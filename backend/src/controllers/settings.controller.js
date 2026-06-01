const Settings = require('../models/Settings');
const logger = require('../utils/logger');

const DEFAULT_SETTINGS = {
  autoReply: true,
  autoReplyDelay: true,
  allowGroupMessages: false,
  globalLanguage: 'hinglish',
  maxTokens: 300,
  temperature: 0.9,
  emojiUsage: 'medium',
  minTypingDelay: 1500,
  maxTypingDelay: 6000,
  seenDelay: true,
  maintenanceMode: false,
  debugMode: false,
  aiProvider: 'openai',
  aiModel: '',
  businessHoursOnly: false,
  businessHoursStart: '09:00',
  businessHoursEnd: '23:00',
  maxDailyMessages: 0, // 0 = unlimited
  welcomeMessage: '',
  awayMessage: '',
};

/**
 * GET /api/settings
 */
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.getAll();
    // Fill missing keys with defaults
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    res.json({ success: true, settings: merged });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/settings
 * Update one or more settings
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Settings object required in body' });
    }

    // Only allow known setting keys
    const allowedKeys = Object.keys(DEFAULT_SETTINGS);
    const filteredUpdates = {};
    for (const [key, value] of Object.entries(updates)) {
      if (allowedKeys.includes(key)) {
        filteredUpdates[key] = value;
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid settings keys provided' });
    }

    await Settings.setMany(filteredUpdates);

    logger.info(`Settings updated by ${req.user.username}:`, Object.keys(filteredUpdates));

    const settings = await Settings.getAll();
    res.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...settings } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/settings/reset
 * Reset all settings to defaults
 */
exports.resetSettings = async (req, res, next) => {
  try {
    await Settings.setMany(DEFAULT_SETTINGS);
    logger.info(`Settings reset to defaults by ${req.user.username}`);
    res.json({ success: true, settings: DEFAULT_SETTINGS, message: 'Settings reset to defaults' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/settings/defaults
 * Return the default settings schema
 */
exports.getDefaults = async (req, res) => {
  res.json({ success: true, defaults: DEFAULT_SETTINGS });
};
