const logger = require('../../utils/logger');
const { detectTaskType, executeWithFailover } = require('./BrainOrchestrator');
const PromptBuilder = require('./PromptBuilder');

/**
 * Generate an AI reply for a WhatsApp message using the Multi-AI Brain
 * @param {string} userMessage - The incoming message text
 * @param {object} memory - Contact memory document
 * @param {object} personality - Personality profile document
 * @param {Array} conversationHistory - Recent chat messages [{direction, body}]
 * @returns {string} - Generated reply text
 */
async function generateReply(userMessage, memory, personality, conversationHistory = []) {
  try {
    const systemPrompt = PromptBuilder.build(personality, memory);
    const taskType = detectTaskType(userMessage);

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

    const reply = await executeWithFailover(messages, taskType, personality);
    
    if (!reply) {
      return getDefaultFallback();
    }
    return reply;
  } catch (err) {
    logger.error('AIEngine Orchestration error:', err.message);
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
