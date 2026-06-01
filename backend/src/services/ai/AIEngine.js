const OpenAI = require('openai');
const logger = require('../../utils/logger');

const PROVIDERS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
  },
  groq: {
    baseURL: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama3-70b-8192',
  },
  together: {
    baseURL: 'https://api.together.xyz/v1',
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
  },
  openrouter: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3-haiku',
  },
};

let _client = null;
let _lastProvider = null;

function getClient() {
  const provider = process.env.AI_PROVIDER || 'openai';
  const config = PROVIDERS[provider] || PROVIDERS.openai;

  // Re-use client unless provider changed
  if (_client && _lastProvider === provider) {
    return { client: _client, model: process.env.AI_MODEL || config.defaultModel };
  }

  _client = new OpenAI({
    apiKey: process.env.AI_API_KEY || 'no-key',
    baseURL: config.baseURL,
    defaultHeaders: provider === 'openrouter' ? {
      'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
      'X-Title': 'WhatsApp AI Companion',
    } : undefined,
  });
  _lastProvider = provider;

  return { client: _client, model: process.env.AI_MODEL || config.defaultModel };
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
