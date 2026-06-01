const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a random delay between min and max milliseconds
 */
function randomDelay(min = 1000, max = 5000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format a phone number to WhatsApp chat ID format
 */
function formatPhone(number) {
  // Remove all non-digits
  let cleaned = String(number).replace(/\D/g, '');
  // Remove leading zeros
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  // Add country code if missing (default India +91)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return `${cleaned}@c.us`;
}

/**
 * Extract facts from a message text (names, preferences, events)
 */
function extractFacts(text) {
  if (!text || typeof text !== 'string') return [];
  const facts = [];

  // Name patterns
  const namePatterns = [
    /(?:my name is|i am|i'm|mera naam|main hoon)\s+([A-Za-z]+)/gi,
    /(?:call me|mujhe bulao)\s+([A-Za-z]+)/gi,
  ];
  namePatterns.forEach(pattern => {
    const match = pattern.exec(text);
    if (match && match[1]) facts.push(`Name: ${match[1]}`);
  });

  // Like/interest patterns
  const likePatterns = [
    /(?:i love|i like|mujhe pasand hai|mujhe acha lagta hai)\s+(.{3,30}?)(?:\.|,|$)/gi,
    /(?:my favorite|mera favorite)\s+(?:is|hai)?\s+(.{3,30}?)(?:\.|,|$)/gi,
  ];
  likePatterns.forEach(pattern => {
    const match = pattern.exec(text);
    if (match && match[1]) facts.push(`Likes: ${match[1].trim()}`);
  });

  // Work/job patterns
  const workPatterns = [
    /(?:i work|i'm a|main|mera kaam)\s+(?:as a|as an|as)?\s*(.{3,30}?)(?:\.|,|$)/gi,
  ];
  workPatterns.forEach(pattern => {
    const match = pattern.exec(text);
    if (match && match[1]) facts.push(`Works as: ${match[1].trim()}`);
  });

  return [...new Set(facts)].slice(0, 3); // Max 3 facts per message
}

/**
 * Truncate text to max length with ellipsis
 */
function truncateText(text, maxLen = 100) {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

/**
 * Generate a JWT token for a user
 */
function generateJWT(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'super-secret-key-change-me',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Generate a refresh token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-key-change-me',
    { expiresIn: '30d' }
  );
}

/**
 * Sanitize a WhatsApp contact object for API response
 */
function sanitizeContact(contact) {
  if (!contact) return null;
  return {
    id: contact.contactId || contact.id,
    name: contact.contactName || contact.name || 'Unknown',
    phone: contact.phone || contact.contactId,
    lastMessage: contact.lastMessage,
    lastSeen: contact.lastSeen,
    messageCount: contact.messageCount || 0,
    mood: contact.mood || 'neutral',
    blocked: contact.blocked || false,
  };
}

/**
 * Sleep for ms milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get today's date at midnight (for analytics daily grouping)
 */
function getTodayMidnight() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Get date N days ago at midnight
 */
function getDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

module.exports = {
  randomDelay,
  formatPhone,
  extractFacts,
  truncateText,
  generateJWT,
  generateRefreshToken,
  sanitizeContact,
  sleep,
  getTodayMidnight,
  getDaysAgo,
};
