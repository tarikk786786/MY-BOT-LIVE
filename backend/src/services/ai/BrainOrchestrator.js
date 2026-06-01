const OpenAI = require('openai');
const ApiKey = require('../../models/ApiKey');
const ProviderAnalytics = require('../../models/ProviderAnalytics');
const logger = require('../../utils/logger');

const DEFAULT_MODELS = {
  openai: 'gpt-4o',
  groq: 'llama3-8b-8192',
  together: 'meta-llama/Llama-3-70b-chat-hf',
  openrouter: 'minimax/minimax-m2.5:free',
  mistral: 'mistral-large-latest',
  huggingface: 'meta-llama/Meta-Llama-3-8B-Instruct',
  anthropic: 'claude-3-sonnet-20240229',
  gemini: 'gemini-1.5-pro',
  deepseek: 'deepseek-coder',
};

const BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  together: 'https://api.together.xyz/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  mistral: 'https://api.mistral.ai/v1',
  huggingface: 'https://api-inference.huggingface.co/v1',
  deepseek: 'https://api.deepseek.com/v1',
};

// 1. Intent Detection for Smart Routing
function detectTaskType(userMessage) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('```') || msg.includes('function ') || msg.includes('error:') || msg.match(/python|javascript|react|node|docker|sql|bug/)) {
    return 'coding';
  }
  if (msg.length > 500 && (msg.includes('summarize') || msg.includes('explain'))) {
    return 'summarization';
  }
  return 'chat'; // Default
}

// 2. Fetch all active providers sorted by priority
async function getAvailableProviders(taskType) {
  const keys = await ApiKey.find({ isActive: true }).sort({ priority: 1 }).exec();
  
  // Intelligent Re-sorting based on taskType
  let sortedKeys = [...keys];
  if (taskType === 'coding') {
    // Bring DeepSeek/Claude/OpenAI to top
    sortedKeys.sort((a, b) => {
      const aScore = ['deepseek', 'anthropic', 'openai'].includes(a.provider) ? 0 : 1;
      const bScore = ['deepseek', 'anthropic', 'openai'].includes(b.provider) ? 0 : 1;
      if (aScore === bScore) return a.priority - b.priority;
      return aScore - bScore;
    });
  } else if (taskType === 'chat') {
    // Bring Groq/Mistral to top for speed
    sortedKeys.sort((a, b) => {
      const aScore = ['groq', 'mistral', 'openai'].includes(a.provider) ? 0 : 1;
      const bScore = ['groq', 'mistral', 'openai'].includes(b.provider) ? 0 : 1;
      if (aScore === bScore) return a.priority - b.priority;
      return aScore - bScore;
    });
  }

  // Fallback if no keys in DB: inject ENV keys as virtual providers
  if (sortedKeys.length === 0) {
    logger.warn('No API keys found in database. Falling back to Environment Variables.');
    const provider = process.env.AI_PROVIDER || 'openrouter';
    sortedKeys.push({
      provider,
      key: process.env.AI_API_KEY || process.env.MISTRAL_API_KEY || 'no-key',
      getDecryptedKey: function() { return this.key; }, // Mock decryption for plain env key
      _id: 'env-fallback'
    });
  }

  return sortedKeys;
}

// 3. Fallback execution loop
async function executeWithFailover(messages, taskType, personalityParams) {
  const providers = await getAvailableProviders(taskType);
  
  for (let i = 0; i < providers.length; i++) {
    const keyDoc = providers[i];
    const providerName = keyDoc.provider;
    const apiKey = keyDoc.getDecryptedKey();
    const baseURL = keyDoc.baseUrl || BASE_URLS[providerName];
    const model = process.env.AI_MODEL || DEFAULT_MODELS[providerName];

    logger.info(`[Brain] Routing task '${taskType}' to provider: ${providerName} (Model: ${model})`);
    
    const startTime = Date.now();
    try {
      const client = new OpenAI({ apiKey, baseURL });
      const response = await client.chat.completions.create({
        model: model,
        messages: messages,
        temperature: personalityParams?.temperature ?? 0.9,
        max_tokens: personalityParams?.maxTokens ?? 300,
      });

      const reply = response.choices[0]?.message?.content?.trim();
      const latency = Date.now() - startTime;

      // Log Analytics
      await ProviderAnalytics.create({
        provider: providerName,
        modelName: model,
        latencyMs: latency,
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
        isSuccess: true,
        taskType
      });

      if (keyDoc._id !== 'env-fallback') {
        await ApiKey.findByIdAndUpdate(keyDoc._id, { $inc: { usageCount: 1 }, lastUsed: new Date() });
      }

      return reply;

    } catch (err) {
      const latency = Date.now() - startTime;
      logger.error(`[Brain] Provider ${providerName} failed: ${err.message}`);
      
      await ProviderAnalytics.create({
        provider: providerName,
        modelName: model,
        latencyMs: latency,
        isSuccess: false,
        errorMessage: err.message,
        taskType
      });

      if (keyDoc._id !== 'env-fallback') {
        await ApiKey.findByIdAndUpdate(keyDoc._id, { 
          $inc: { errorCount: 1 }, 
          lastError: err.message,
          // Temporarily disable if too many errors? 
          // isActive: keyDoc.errorCount > 10 ? false : true
        });
      }

      // If it's the last provider, throw
      if (i === providers.length - 1) {
        throw new Error('All AI providers exhausted and failed.');
      }
      
      logger.info(`[Brain] Initiating automatic failover to next provider...`);
    }
  }
}

module.exports = {
  detectTaskType,
  executeWithFailover
};
