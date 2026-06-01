const Chat = require('../models/Chat');
const Memory = require('../models/Memory');
const logger = require('../utils/logger');

/**
 * GET /api/chat/contacts
 * List all unique contacts with their latest message and message count
 */
exports.getContacts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Get unique contacts with last message via aggregation
    const pipeline = [
      ...(search ? [{
        $match: {
          $or: [
            { contactId: { $regex: search, $options: 'i' } },
            { contactName: { $regex: search, $options: 'i' } },
          ]
        }
      }] : []),
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$contactId',
          contactId: { $first: '$contactId' },
          contactName: { $first: '$contactName' },
          lastMessage: { $first: '$body' },
          lastMessageTime: { $first: '$timestamp' },
          lastDirection: { $first: '$direction' },
          totalMessages: { $sum: 1 },
        }
      },
      { $sort: { lastMessageTime: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const countPipeline = [
      ...(search ? [{
        $match: {
          $or: [
            { contactId: { $regex: search, $options: 'i' } },
            { contactName: { $regex: search, $options: 'i' } },
          ]
        }
      }] : []),
      { $group: { _id: '$contactId' } },
      { $count: 'total' },
    ];

    const [contacts, countResult] = await Promise.all([
      Chat.aggregate(pipeline),
      Chat.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    // Enrich with memory data
    const contactIds = contacts.map(c => c.contactId);
    const memories = await Memory.find({ contactId: { $in: contactIds } })
      .select('contactId mood relationshipLevel blocked tags')
      .lean();
    const memoryMap = memories.reduce((acc, m) => { acc[m.contactId] = m; return acc; }, {});

    const enriched = contacts.map(c => ({
      ...c,
      mood: memoryMap[c.contactId]?.mood || 'neutral',
      relationshipLevel: memoryMap[c.contactId]?.relationshipLevel || 1,
      blocked: memoryMap[c.contactId]?.blocked || false,
      tags: memoryMap[c.contactId]?.tags || [],
    }));

    res.json({
      success: true,
      contacts: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/chat/:contactId/messages
 * Get paginated messages for a contact
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Chat.find({ contactId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Chat.countDocuments({ contactId }),
    ]);

    res.json({
      success: true,
      messages: messages.reverse(), // Chronological order
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/chat/:contactId
 * Get contact details (last message + memory summary)
 */
exports.getContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;

    const [lastMessage, memory, messageCount] = await Promise.all([
      Chat.findOne({ contactId }).sort({ timestamp: -1 }).lean(),
      Memory.findOne({ contactId }).lean(),
      Chat.countDocuments({ contactId }),
    ]);

    if (!lastMessage && !memory) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({
      success: true,
      contact: {
        contactId,
        contactName: memory?.contactName || lastMessage?.contactName || contactId,
        lastMessage: lastMessage?.body,
        lastMessageTime: lastMessage?.timestamp,
        messageCount,
        mood: memory?.mood || 'neutral',
        relationshipLevel: memory?.relationshipLevel || 1,
        blocked: memory?.blocked || false,
        memory: memory || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/chat/send
 * Manually send a message to a contact
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { contactId, message } = req.body;

    if (!contactId || !message) {
      return res.status(400).json({ error: 'contactId and message are required' });
    }

    const { sendMessage } = require('../services/whatsapp/WhatsAppManager');
    await sendMessage(contactId, message);

    // Log to DB
    const memory = await Memory.findOne({ contactId }).select('contactName').lean();
    const chatEntry = await Chat.create({
      contactId,
      contactName: memory?.contactName || contactId,
      direction: 'outgoing',
      messageType: 'text',
      body: message,
      aiGenerated: false,
      timestamp: new Date(),
    });

    if (global.io) {
      global.io.emit('chat:manual_send', {
        contactId,
        body: message,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: 'Message sent', chat: chatEntry });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/chat/:contactId/messages
 * Clear chat history for a contact
 */
exports.clearHistory = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const result = await Chat.deleteMany({ contactId });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
};
