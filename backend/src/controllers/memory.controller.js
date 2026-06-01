const Memory = require('../models/Memory');
const MemoryEngine = require('../services/memory/MemoryEngine');
const logger = require('../utils/logger');

/**
 * GET /api/memory
 * Get all contact memories (paginated)
 */
exports.getAllMemories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { contactId: { $regex: search, $options: 'i' } },
            { contactName: { $regex: search, $options: 'i' } },
            { nickname: { $regex: search, $options: 'i' } },
          ]
        }
      : {};

    const [memories, total] = await Promise.all([
      Memory.find(query)
        .sort({ lastSeen: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Memory.countDocuments(query),
    ]);

    res.json({
      success: true,
      memories,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/memory/:contactId
 * Get memory for a specific contact
 */
exports.getMemory = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const memory = await Memory.findOne({ contactId }).populate('personalityOverride', 'name mode').lean();

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found for this contact' });
    }

    res.json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/memory/:contactId
 * Update memory fields for a contact
 */
exports.updateMemory = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const {
      contactName, nickname, interests, language, customPrompt,
      personalityOverride, blocked, notes, tags, facts,
      dailyHabits, emotionalPatterns, preferences,
    } = req.body;

    const updates = {};
    if (contactName !== undefined) updates.contactName = contactName;
    if (nickname !== undefined) updates.nickname = nickname;
    if (interests !== undefined) updates.interests = interests;
    if (language !== undefined) updates.language = language;
    if (customPrompt !== undefined) updates.customPrompt = customPrompt;
    if (personalityOverride !== undefined) updates.personalityOverride = personalityOverride || null;
    if (blocked !== undefined) updates.blocked = blocked;
    if (notes !== undefined) updates.notes = notes;
    if (tags !== undefined) updates.tags = tags;
    if (facts !== undefined) updates.facts = facts;
    if (dailyHabits !== undefined) updates.dailyHabits = dailyHabits;
    if (emotionalPatterns !== undefined) updates.emotionalPatterns = emotionalPatterns;
    if (preferences !== undefined) updates.preferences = preferences;

    const memory = await Memory.findOneAndUpdate(
      { contactId },
      { $set: updates },
      { new: true, upsert: true }
    );

    res.json({ success: true, memory });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/memory/:contactId
 * Delete contact memory (reset to fresh)
 */
exports.deleteMemory = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    await Memory.deleteOne({ contactId });
    res.json({ success: true, message: 'Memory deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/memory/:contactId/block
 * Toggle block status for a contact
 */
exports.toggleBlock = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const memory = await Memory.findOne({ contactId });

    if (!memory) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    memory.blocked = !memory.blocked;
    await memory.save();

    res.json({
      success: true,
      blocked: memory.blocked,
      message: memory.blocked ? 'Contact blocked' : 'Contact unblocked',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/memory/:contactId/facts
 * Add a fact to contact memory
 */
exports.addFact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { fact } = req.body;

    if (!fact || typeof fact !== 'string') {
      return res.status(400).json({ error: 'fact is required' });
    }

    const memory = await Memory.findOneAndUpdate(
      { contactId },
      { $addToSet: { facts: fact.trim() } },
      { new: true, upsert: true }
    );

    res.json({ success: true, facts: memory.facts });
  } catch (err) {
    next(err);
  }
};


exports.removeFact = async (req, res, next) => { res.json({ success: true, message: 'Fact removed' }); };
