/**
 * EmotionEngine - Keyword-based emotion detection for incoming messages
 * No external API required - purely local analysis
 */

const EMOTION_PATTERNS = {
  happy: {
    keywords: [
      'haha', 'lol', 'lmao', '😂', '😄', '😁', '🥰', '😍',
      'happy', 'great', 'awesome', 'amazing', 'love', 'excited',
      'fantastic', 'wonderful', 'yay', 'yayy', 'wohoo', 'hooray',
      'khush', 'mast', 'zabardast', 'bahut acha', 'sahi', 'bindaas',
      'pyaar', 'bahut khush', 'maja', 'maza', 'fun', 'enjoy',
    ],
    weight: 1,
  },
  sad: {
    keywords: [
      'sad', 'unhappy', 'depressed', 'crying', '😢', '😭', '💔',
      'heartbroken', 'miss', 'alone', 'lonely', 'hurt', 'pain',
      'dukhi', 'udaas', 'rona', 'dard', 'takleef', 'akelapan',
      'miss kar raha', 'bura lag raha', 'dil dukha', 'toot gaya',
      "can't sleep", 'hopeless', 'worthless', 'tired of everything',
    ],
    weight: 1,
  },
  angry: {
    keywords: [
      'angry', 'mad', 'furious', 'hate', '😠', '😤', '🤬',
      'annoyed', 'irritated', 'frustrated', 'pissed', 'wtf',
      'gussa', 'bahut gussa', 'naraaz', 'kha jaunga', 'pagal kar diya',
      'bc', 'mc', 'chutiya', 'bakwaas', 'bkwas', 'idiot', 'stupid',
      'disgusting', 'ridiculous', 'unfair',
    ],
    weight: 1,
  },
  anxious: {
    keywords: [
      'anxious', 'worried', 'nervous', 'scared', 'fear', '😰', '😨',
      'anxiety', 'panic', 'stress', 'stressed', 'overwhelmed',
      'tension', 'tense', 'dar lag raha', 'ghabra raha', 'tension hai',
      'pareshaan', 'chinta', 'nervous ho raha', "can't handle",
      'what if', 'kya hoga', 'exam', 'interview', 'deadline',
    ],
    weight: 1,
  },
  excited: {
    keywords: [
      'excited', 'can\'t wait', 'omg', 'oh my god', '🤩', '🎉', '🚀',
      'amazing news', 'guess what', 'you won\'t believe', 'yesss',
      'itna excited', 'bhai sun', 'kal se', 'aaj se', 'hogaya',
      'mil gaya', 'finally', 'at last', 'kab se wait kar raha tha',
      'party', 'celebrate', 'wow', 'incredible', 'unbelievable',
    ],
    weight: 1,
  },
  romantic: {
    keywords: [
      'love you', 'i love', 'miss you', '❤️', '💕', '💞', '😘', '🥰',
      'beautiful', 'handsome', 'cute', 'adorable', 'baby', 'babe',
      'jaan', 'jaanu', 'meri jaan', 'pyaar', 'ishq', 'mohabbat',
      'dil mein', 'tum ho to', 'tujhe chahta', 'tujhse pyaar',
      'romantic', 'date', 'relationship', 'together',
    ],
    weight: 1,
  },
  flirty: {
    keywords: [
      'hot', 'sexy', 'gorgeous', '😏', '😉', '🔥', 'wink',
      'flirt', 'crush', 'cute hai tu', 'bahut acha lagta', 'attractive',
      'dil churaya', 'dil le liya', 'pagal kar diya tu',
      'kya baat hai', 'kya lag raha hai tu', 'wow you look',
    ],
    weight: 0.8,
  },
  neutral: {
    keywords: [],
    weight: 0,
  },
};

/**
 * Detect the primary emotion in a text message
 * @param {string} text - The message to analyze
 * @returns {{ emotion: string, intensity: number, keywords: string[] }}
 */
function detectEmotion(text) {
  if (!text || typeof text !== 'string') {
    return { emotion: 'neutral', intensity: 5, keywords: [] };
  }

  const lowerText = text.toLowerCase();
  const scores = {};
  const foundKeywords = {};

  // Score each emotion
  for (const [emotion, config] of Object.entries(EMOTION_PATTERNS)) {
    if (emotion === 'neutral') continue;
    scores[emotion] = 0;
    foundKeywords[emotion] = [];

    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        scores[emotion] += config.weight;
        foundKeywords[emotion].push(keyword);
      }
    }
  }

  // Find highest scoring emotion
  let maxScore = 0;
  let detectedEmotion = 'neutral';
  let detectedKeywords = [];

  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedEmotion = emotion;
      detectedKeywords = foundKeywords[emotion];
    }
  }

  // Calculate intensity (1-10)
  let intensity = 5; // default neutral
  if (maxScore > 0) {
    intensity = Math.min(10, Math.max(1, Math.round(5 + maxScore * 2)));
  }

  // Check for intensifiers
  const intensifiers = ['very', 'so', 'really', 'extremely', 'super', 'bahut', 'itna', 'ekdum'];
  for (const intensifier of intensifiers) {
    if (lowerText.includes(intensifier)) {
      intensity = Math.min(10, intensity + 1);
      break;
    }
  }

  // Check for negations (might flip emotion)
  const negations = ['not ', "don't ", "doesn't ", "isn't ", "nahi ", "na "];
  let hasNegation = false;
  for (const neg of negations) {
    if (lowerText.includes(neg)) {
      hasNegation = true;
      break;
    }
  }

  if (hasNegation && detectedEmotion === 'happy') {
    detectedEmotion = 'sad';
    intensity = Math.max(1, intensity - 2);
  }

  return {
    emotion: detectedEmotion,
    intensity,
    keywords: detectedKeywords.slice(0, 3),
  };
}

/**
 * Get a brief emotion description for logging/display
 */
function describeEmotion(emotion, intensity) {
  if (intensity <= 3) return `slightly ${emotion}`;
  if (intensity <= 6) return emotion;
  return `very ${emotion}`;
}

module.exports = { detectEmotion, describeEmotion };
