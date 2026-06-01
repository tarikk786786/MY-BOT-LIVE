const ApiKey = require('../models/ApiKey');
const ProviderAnalytics = require('../models/ProviderAnalytics');
const logger = require('../utils/logger');

// GET /api/brain/keys
async function getKeys(req, res) {
  try {
    const keys = await ApiKey.find().select('-key').sort({ priority: 1 });
    res.json(keys);
  } catch (err) {
    logger.error('Error fetching API keys:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/brain/keys
async function addKey(req, res) {
  try {
    const { provider, key, label, baseUrl, priority } = req.body;
    
    if (!provider || !key) {
      return res.status(400).json({ error: 'Provider and Key are required' });
    }

    const newKey = await ApiKey.create({
      provider,
      key,
      label,
      baseUrl,
      priority
    });

    res.status(201).json({ message: 'API Key added successfully', id: newKey._id });
  } catch (err) {
    logger.error('Error adding API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/brain/keys/:id
async function deleteKey(req, res) {
  try {
    await ApiKey.findByIdAndDelete(req.params.id);
    res.json({ message: 'API Key deleted successfully' });
  } catch (err) {
    logger.error('Error deleting API key:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/brain/analytics
async function getAnalytics(req, res) {
  try {
    // Get aggregated stats by provider
    const stats = await ProviderAnalytics.aggregate([
      {
        $group: {
          _id: '$provider',
          totalCalls: { $sum: 1 },
          successCalls: { $sum: { $cond: ['$isSuccess', 1, 0] } },
          avgLatency: { $avg: '$latencyMs' },
          totalTokens: { $sum: '$totalTokens' }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    logger.error('Error fetching analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getKeys,
  addKey,
  deleteKey,
  getAnalytics
};
