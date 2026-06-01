const Chat = require('../models/Chat');
const Memory = require('../models/Memory');
const Analytics = require('../models/Analytics');
const { getDaysAgo, getTodayMidnight } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * GET /api/analytics/overview
 * Total stats across all time
 */
exports.getOverview = async (req, res, next) => {
  try {
    const [
      totalMessages,
      totalContacts,
      totalAiMessages,
      avgResponseTimeResult,
      todayMessages,
    ] = await Promise.all([
      Chat.countDocuments(),
      Memory.countDocuments(),
      Chat.countDocuments({ aiGenerated: true }),
      Chat.aggregate([
        { $match: { responseTime: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: '$responseTime' } } },
      ]),
      Chat.countDocuments({
        timestamp: { $gte: getTodayMidnight() },
      }),
    ]);

    const avgResponseTime = avgResponseTimeResult[0]?.avg || 0;

    res.json({
      success: true,
      overview: {
        totalMessages,
        totalContacts,
        totalAiMessages,
        avgResponseTime: Math.round(avgResponseTime),
        avgResponseTimeFormatted: `${(avgResponseTime / 1000).toFixed(1)}s`,
        todayMessages,
        aiRate: totalMessages > 0
          ? `${((totalAiMessages / totalMessages) * 100).toFixed(1)}%`
          : '0%',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/daily
 * Message counts for the last 30 days
 */
exports.getDailyStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = getDaysAgo(days);

    const stats = await Chat.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          total: { $sum: 1 },
          incoming: { $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] } },
          outgoing: { $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] } },
          aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Fill missing days with zeros
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = getDaysAgo(i);
      const dateKey = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };
      const found = stats.find(
        s => s._id.year === dateKey.year &&
             s._id.month === dateKey.month &&
             s._id.day === dateKey.day
      );
      result.push({
        date: date.toISOString().split('T')[0],
        total: found?.total || 0,
        incoming: found?.incoming || 0,
        outgoing: found?.outgoing || 0,
        aiGenerated: found?.aiGenerated || 0,
      });
    }

    res.json({ success: true, stats: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/moods
 * Mood distribution across all messages
 */
exports.getMoodStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = getDaysAgo(days);

    const moodStats = await Chat.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          mood: { $exists: true, $ne: null, $ne: '' },
        }
      },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = moodStats.reduce((sum, m) => sum + m.count, 0);
    const distribution = moodStats.map(m => ({
      mood: m._id,
      count: m.count,
      percentage: total > 0 ? ((m.count / total) * 100).toFixed(1) : '0',
    }));

    res.json({ success: true, distribution, total, days });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/top-contacts
 * Most active contacts by message count
 */
exports.getTopContacts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30;
    const startDate = getDaysAgo(days);

    const topContacts = await Chat.aggregate([
      { $match: { timestamp: { $gte: startDate }, direction: 'incoming' } },
      {
        $group: {
          _id: '$contactId',
          contactName: { $first: '$contactName' },
          count: { $sum: 1 },
          lastMessage: { $last: '$timestamp' },
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    // Enrich with memory data
    const contactIds = topContacts.map(c => c._id);
    const memories = await Memory.find({ contactId: { $in: contactIds } })
      .select('contactId mood relationshipLevel')
      .lean();
    const memoryMap = memories.reduce((acc, m) => { acc[m.contactId] = m; return acc; }, {});

    const enriched = topContacts.map(c => ({
      contactId: c._id,
      contactName: c.contactName,
      messageCount: c.count,
      lastMessage: c.lastMessage,
      mood: memoryMap[c._id]?.mood || 'neutral',
      relationshipLevel: memoryMap[c._id]?.relationshipLevel || 1,
    }));

    res.json({ success: true, contacts: enriched, days });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/engagement
 * Engagement score and metrics
 */
exports.getEngagementScore = async (req, res, next) => {
  try {
    const days = 7;
    const startDate = getDaysAgo(days);

    const [weekMessages, avgRelationship, activeContacts] = await Promise.all([
      Chat.countDocuments({ timestamp: { $gte: startDate } }),
      Memory.aggregate([
        { $group: { _id: null, avg: { $avg: '$relationshipLevel' } } },
      ]),
      Chat.distinct('contactId', { timestamp: { $gte: startDate } }),
    ]);

    const avgLevel = avgRelationship[0]?.avg || 1;
    const messagesPerDay = weekMessages / days;

    // Engagement score: 0-100 based on activity + relationship levels
    const engagementScore = Math.min(100, Math.round(
      (messagesPerDay * 5) + (avgLevel * 5) + (activeContacts.length * 2)
    ));

    res.json({
      success: true,
      engagement: {
        score: engagementScore,
        weeklyMessages: weekMessages,
        messagesPerDay: messagesPerDay.toFixed(1),
        activeContacts: activeContacts.length,
        avgRelationshipLevel: avgLevel.toFixed(1),
        trend: engagementScore > 50 ? 'positive' : engagementScore > 25 ? 'neutral' : 'low',
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/hourly
 * Message activity by hour of day
 */
exports.getHourlyActivity = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = getDaysAgo(days);

    const hourly = await Chat.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 },
        }
      },
      { $sort: { '_id': 1 } },
    ]);

    // Fill all 24 hours
    const result = Array.from({ length: 24 }, (_, hour) => {
      const found = hourly.find(h => h._id === hour);
      return { hour, count: found?.count || 0 };
    });

    res.json({ success: true, hourly: result, days });
  } catch (err) {
    next(err);
  }
};


exports.getDashboardStats = async (req, res, next) => { res.json({ success: true, data: {} }); };
exports.getChartData = async (req, res, next) => { res.json({ success: true, data: [] }); };
