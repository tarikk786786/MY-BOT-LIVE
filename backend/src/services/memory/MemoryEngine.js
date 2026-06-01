const Memory = require('../../models/Memory');
const logger = require('../../utils/logger');
const { extractFacts } = require('../../utils/helpers');

/**
 * Get or create memory for a contact
 */
async function getMemory(contactId, displayName = null) {
  try {
    let memory = await Memory.findOne({ contactId });
    if (!memory) {
      memory = await Memory.create({
        contactId,
        contactName: displayName || contactId,
        phone: contactId,
        firstSeen: new Date(),
        lastSeen: new Date(),
      });
      logger.info(`Created new memory for contact: ${contactId}`);
    } else if (displayName && !memory.contactName || memory.contactName === 'Unknown') {
      memory.contactName = displayName;
      memory.lastSeen = new Date();
      await memory.save();
    } else {
      memory.lastSeen = new Date();
      await Memory.updateOne({ contactId }, { lastSeen: new Date() });
    }
    return memory;
  } catch (err) {
    logger.error('getMemory error:', err);
    // Return a minimal in-memory object so processing can continue
    return {
      contactId,
      contactName: displayName || contactId,
      interests: [],
      mood: 'neutral',
      relationshipLevel: 1,
      facts: [],
      language: 'hinglish',
      messageCount: 0,
      blocked: false,
    };
  }
}

/**
 * Update specific memory fields for a contact
 */
async function updateMemory(contactId, updates) {
  try {
    return await Memory.findOneAndUpdate(
      { contactId },
      { $set: updates },
      { new: true, upsert: true }
    );
  } catch (err) {
    logger.error('updateMemory error:', err);
  }
}

/**
 * Parse a message for extractable facts and update memory
 */
async function extractAndUpdateFacts(contactId, message) {
  try {
    if (!message || typeof message !== 'string' || message.length < 5) return;

    const newFacts = extractFacts(message);
    if (newFacts.length === 0) return;

    const memory = await Memory.findOne({ contactId });
    if (!memory) return;

    const existingFacts = memory.facts || [];
    const factsSet = new Set(existingFacts);
    let changed = false;

    for (const fact of newFacts) {
      if (!factsSet.has(fact) && existingFacts.length < 30) {
        factsSet.add(fact);
        changed = true;
      }
    }

    if (changed) {
      await Memory.updateOne(
        { contactId },
        { $set: { facts: Array.from(factsSet) } }
      );
    }

    // Extract interests from message topics
    const interestKeywords = extractInterests(message);
    if (interestKeywords.length > 0) {
      await Memory.updateOne(
        { contactId },
        {
          $addToSet: {
            interests: { $each: interestKeywords.slice(0, 3) }
          }
        }
      );
    }
  } catch (err) {
    logger.error('extractAndUpdateFacts error:', err);
  }
}

/**
 * Simple interest extraction from common topics
 */
function extractInterests(text) {
  const interests = [];
  const lowerText = text.toLowerCase();

  const topicMap = {
    cricket: ['cricket', 'ipl', 'test match', 'virat', 'rohit', 'dhoni'],
    movies: ['movie', 'film', 'bollywood', 'netflix', 'cinema', 'ott', 'series'],
    music: ['music', 'song', 'singer', 'rap', 'playlist', 'spotify', 'gaana'],
    gaming: ['game', 'gaming', 'pubg', 'cod', 'bgmi', 'valorant', 'pc game'],
    gym: ['gym', 'workout', 'fitness', 'protein', 'gains', 'exercise', 'running'],
    cooking: ['cooking', 'food', 'recipe', 'restaurant', 'khana', 'dish'],
    travel: ['travel', 'trip', 'tour', 'vacation', 'holiday', 'goa', 'manali'],
    tech: ['tech', 'coding', 'programming', 'startup', 'phone', 'laptop', 'app'],
  };

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      interests.push(topic);
    }
  }

  return interests;
}

/**
 * Update the mood of a contact
 */
async function updateMood(contactId, emotion) {
  try {
    if (!emotion || emotion === 'neutral') return;

    await Memory.updateOne(
      { contactId },
      {
        $set: { mood: emotion, lastMood: emotion },
        $push: {
          moodHistory: {
            $each: [{ mood: emotion, timestamp: new Date() }],
            $slice: -50, // Keep last 50
          }
        }
      }
    );
  } catch (err) {
    logger.error('updateMood error:', err);
  }
}

/**
 * Increment message count for a contact
 */
async function incrementMessageCount(contactId) {
  try {
    await Memory.updateOne(
      { contactId },
      { $inc: { messageCount: 1 }, $set: { lastSeen: new Date() } }
    );
  } catch (err) {
    logger.error('incrementMessageCount error:', err);
  }
}

/**
 * Get formatted memory context for prompt injection
 */
async function getMemoryContext(contactId) {
  try {
    const memory = await Memory.findOne({ contactId }).lean();
    if (!memory) return null;
    return memory;
  } catch (err) {
    logger.error('getMemoryContext error:', err);
    return null;
  }
}

/**
 * Auto-update relationship level based on message count thresholds
 */
async function updateRelationshipLevel(contactId) {
  try {
    const memory = await Memory.findOne({ contactId }).select('messageCount relationshipLevel');
    if (!memory) return;

    const count = memory.messageCount;
    let newLevel = memory.relationshipLevel;

    // Thresholds: 10, 30, 60, 100, 150, 200, 300, 500, 750, 1000
    const thresholds = [10, 30, 60, 100, 150, 200, 300, 500, 750, 1000];
    for (let i = 0; i < thresholds.length; i++) {
      if (count >= thresholds[i]) {
        newLevel = i + 1;
      }
    }

    if (newLevel !== memory.relationshipLevel) {
      await Memory.updateOne({ contactId }, { $set: { relationshipLevel: newLevel } });
      logger.info(`Relationship level updated for ${contactId}: ${newLevel}`);
      if (global.io) {
        global.io.emit('memory:level_up', { contactId, newLevel });
      }
    }
  } catch (err) {
    logger.error('updateRelationshipLevel error:', err);
  }
}

/**
 * Get all contact memories with pagination
 */
async function getAllMemories(page = 1, limit = 20) {
  try {
    const skip = (page - 1) * limit;
    const [memories, total] = await Promise.all([
      Memory.find({ blocked: false })
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Memory.countDocuments({ blocked: false }),
    ]);
    return { memories, total, page, pages: Math.ceil(total / limit) };
  } catch (err) {
    logger.error('getAllMemories error:', err);
    return { memories: [], total: 0, page: 1, pages: 0 };
  }
}

module.exports = {
  getMemory,
  updateMemory,
  extractAndUpdateFacts,
  extractInterests,
  updateMood,
  incrementMessageCount,
  getMemoryContext,
  updateRelationshipLevel,
  getAllMemories,
};
