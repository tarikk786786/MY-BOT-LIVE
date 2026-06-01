/**
 * TypingSimulator - Calculates realistic human typing delays for WhatsApp
 */

// Average human typing speeds (words per minute)
const TYPING_SPEED = {
  slow: 25,      // slow typer
  normal: 45,    // average
  fast: 70,      // fast typer
  teen: 90,      // fast phone typer (teenager style)
};

// Characters per word (avg English/Hinglish word = 5 chars)
const CHARS_PER_WORD = 5;
// Characters per minute based on WPM
function cpm(wpm) { return wpm * CHARS_PER_WORD; }

/**
 * Calculate realistic typing delay for a response text
 * @param {string} responseText - The text that will be sent
 * @param {object} personality - Personality profile (for min/max delay)
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(responseText, personality) {
  if (!responseText) return 1500;

  const minDelay = personality?.minDelay ?? 1000;
  const maxDelay = personality?.maxDelay ?? 6000;

  // Character count of the response
  const charCount = responseText.length;

  // Pick a random typing speed profile
  const speeds = [TYPING_SPEED.normal, TYPING_SPEED.fast, TYPING_SPEED.teen];
  const speed = speeds[Math.floor(Math.random() * speeds.length)];

  // Time to type in milliseconds
  const charsPerMs = cpm(speed) / 60000;
  const typingTime = charCount / charsPerMs;

  // Add reading/thinking time (0.5-2 seconds)
  const thinkingTime = 500 + Math.random() * 1500;

  // Total delay
  let totalDelay = typingTime + thinkingTime;

  // Add randomness ±20%
  const jitter = totalDelay * 0.2 * (Math.random() - 0.5) * 2;
  totalDelay += jitter;

  // Clamp to personality's min/max bounds
  totalDelay = Math.max(minDelay, Math.min(maxDelay, Math.round(totalDelay)));

  return totalDelay;
}

/**
 * Get a realistic "seen" delay before starting to type
 * Simulates the time between message arriving and starting to type
 * @returns {number} Delay in milliseconds
 */
function getSeenDelay() {
  // 500ms to 3000ms — sometimes people read immediately, sometimes after a bit
  const baseDelay = 500;
  const randomDelay = Math.random() * 2500;
  return Math.round(baseDelay + randomDelay);
}

/**
 * Get a "read" delay — time before the typing indicator appears
 * @param {number} messageLength - Length of incoming message
 * @returns {number} Delay in milliseconds
 */
function getReadDelay(messageLength = 50) {
  // Longer messages take longer to read
  const readSpeed = 200; // words per minute reading speed
  const words = messageLength / CHARS_PER_WORD;
  const readTime = (words / readSpeed) * 60000;
  const minRead = 300;
  return Math.max(minRead, Math.round(readTime + Math.random() * 500));
}

/**
 * Simulate a burst typing pattern for longer messages
 * Returns array of partial delays (typing, pause, typing...)
 */
function getBurstPattern(responseText) {
  if (responseText.length < 50) {
    return [calculateDelay(responseText, null)];
  }
  // Longer messages sometimes have a "thinking pause" in the middle
  const firstPart = Math.floor(responseText.length * 0.6);
  const secondPart = responseText.length - firstPart;
  return [
    calculateDelay(responseText.slice(0, firstPart), null),
    300 + Math.random() * 700, // pause
    calculateDelay(responseText.slice(firstPart), null),
  ];
}

module.exports = { calculateDelay, getSeenDelay, getReadDelay, getBurstPattern };
