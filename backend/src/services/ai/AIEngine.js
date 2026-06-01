const OpenAI = require('openai');
const logger = require('../../utils/logger');

const PROVIDERS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama3-8b-8192',
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'minimax/minimax-m2.5:free',
  },
  mistral: {
    baseURL: 'https://api.mistral.ai/v1',
    defaultModel: 'mistral-large-latest',
  },
  huggingface: {
    baseURL: 'https://api-inference.huggingface.co/v1',
    defaultModel: 'meta-llama/Meta-Llama-3-8B-Instruct',
  },
};

let _client = null;
let _lastProvider = null;

function getClient() {
  const provider = process.env.AI_PROVIDER || 'openrouter';
  const config = PROVIDERS[provider] || PROVIDERS.openrouter;

  // Re-use client unless provider changed
  if (_client && _lastProvider === provider) {
    return { client: _client, model: resolveModel(provider, config) };
  }

  let apiKey = process.env.AI_API_KEY;
  if (provider === 'mistral') apiKey = process.env.MISTRAL_API_KEY || apiKey;
  if (provider === 'huggingface') {
    try {
      const hfConfig = require('../../config');
      apiKey = hfConfig.HF_API_KEY || apiKey;
    } catch (e) {
      apiKey = process.env.HF_API_KEY || apiKey;
    }
  }

  _client = new OpenAI({
    apiKey: apiKey || 'no-key',
    baseURL: config.baseURL,
    defaultHeaders: provider === 'openrouter' ? {
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': 'WhatsApp AI Companion',
    } : undefined,
  });
  _lastProvider = provider;

  return { client: _client, model: resolveModel(provider, config) };
}

function resolveModel(provider, config) {
  if (provider === 'mistral' && process.env.MISTRAL_AGENT_ID) {
    return process.env.MISTRAL_AGENT_ID;
  }
  return process.env.AI_MODEL || config.defaultModel;
}

/**
 * Generate an AI reply for a WhatsApp message
 * @param {string} userMessage - The incoming message text
 * @param {object} memory - Contact memory document
 * @param {object} personality - Personality profile document
 * @param {Array} conversationHistory - Recent chat messages [{direction, body}]
 * @returns {string} - Generated reply text
 */
async function generateReply(userMessage, memory, personality, conversationHistory = []) {
  try {
    const { client, model } = getClient();
    const PromptBuilder = require('./PromptBuilder');
    const systemPrompt = PromptBuilder.build(personality, memory);

    // Build messages array with history (last 10 exchanges = 20 messages)
    const historyMessages = conversationHistory
      .slice(-20)
      .filter(h => h.body && h.body.trim())
      .map(h => ({
        role: h.direction === 'incoming' ? 'user' : 'assistant',
        content: h.body,
      }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ];

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature: personality?.temperature ?? 0.9,
      max_tokens: personality?.maxTokens ?? 300,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const reply = response.choices[0]?.message?.content?.trim();
    if (!reply) {
      return getDefaultFallback();
    }
    return reply;
  } catch (err) {
    logger.error('AI generation error:', err.message);
    return getErrorFallback();
  }
}

function getDefaultFallback() {
  const fallbacks = [
    'Yaar, kuch hua mujhe. Baad mein baat karte! 😅',
    'Ek second wait kar... 🙈',
    'Hmm, kuch soch raha hoon 🤔',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function getErrorFallback() {
  const fallbacks = [
    'Ek second yaar, kuch technical issue aa gaya 😅',
    'Sorry yaar, net slow hai abhi. Phir baat karte! 🙏',
    'Arey kuch hua... thoda wait kar na! 😬',
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

module.exports = { generateReply };
