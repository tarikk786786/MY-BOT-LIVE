const logger = require('../../utils/logger');
const Chat = require('../../models/Chat');
const Settings = require('../../models/Settings');
const Personality = require('../../models/Personality');
const AIEngine = require('../ai/AIEngine');
const EmotionEngine = require('../ai/EmotionEngine');
const TypingSimulator = require('../ai/TypingSimulator');
const MemoryEngine = require('../memory/MemoryEngine');
const { sendMessage, sendTyping } = require('../whatsapp/WhatsAppManager');

/**
 * Core message processing logic
 */
async function processMessage(msgData) {
  const startTime = Date.now();
  try {
    const { from, body, timestamp, type, _data } = msgData;
    const contactId = from.replace('@c.us', '');
    const messageBody = body || '';

    // Check auto-reply setting
    const autoReply = await Settings.get('autoReply');
    if (autoReply === false) {
      logger.info(`Auto-reply disabled, skipping message from ${contactId}`);
      return;
    }

    // Get or create memory (auto-create if not exists)
    const memory = await MemoryEngine.getMemory(contactId, _data?.notifyName || null);

    // Check if contact is blocked
    if (memory.blocked) {
      logger.info(`Skipping blocked contact: ${contactId}`);
      return;
    }

    // Save incoming message to DB
    const contactName = memory.contactName || _data?.notifyName || contactId;
    await Chat.create({
      contactId,
      contactName,
      direction: 'incoming',
      messageType: mapMessageType(type),
      body: messageBody,
      timestamp: timestamp ? new Date(timestamp * 1000) : new Date(),
      messageId: msgData.id?._serialized || msgData.id,
    });

    // Emit to dashboard
    if (global.io) {
      global.io.emit('chat:incoming', {
        contactId,
        contactName,
        body: messageBody,
        timestamp: new Date(),
      });
    }

    // Skip AI reply for non-text messages unless body exists
    if (!messageBody.trim() && type !== 'chat') {
      logger.info(`Skipping non-text message from ${contactId} (type: ${type})`);
      return;
    }

    // Detect emotion
    const { emotion } = EmotionEngine.detectEmotion(messageBody);
    await MemoryEngine.updateMood(contactId, emotion);
    await MemoryEngine.incrementMessageCount(contactId);
    await MemoryEngine.extractAndUpdateFacts(contactId, messageBody);

    // Get active personality
    let personality = null;
    if (memory.personalityOverride) {
      try {
        personality = await Personality.findById(memory.personalityOverride);
      } catch (e) {}
    }
    if (!personality) {
      personality = await Personality.findOne({ isDefault: true });
    }
    if (!personality) {
      // Fallback: create a minimal personality config
      personality = {
        temperature: 0.9,
        maxTokens: 300,
        minDelay: 1500,
        maxDelay: 6000,
        emojiUsage: 'medium',
        language: 'hinglish',
      };
    }

    // Get conversation history (last 20 messages)
    const history = await Chat.find({ contactId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();
    const orderedHistory = history.reverse();

    // Generate AI reply
    const reply = await AIEngine.generateReply(
      messageBody,
      memory,
      personality,
      orderedHistory
    );

    // Calculate realistic delays
    const seenDelay = TypingSimulator.getSeenDelay();
    const typingDelay = TypingSimulator.calculateDelay(reply, personality);

    // Simulate "seen" (read receipt delay)
    await new Promise(r => setTimeout(r, seenDelay));

    // Send typing indicator
    await sendTyping(contactId);

    // Wait for typing simulation
    await new Promise(r => setTimeout(r, typingDelay));

    // Send reply via WhatsApp
    await sendMessage(contactId, reply);

    const responseTime = Date.now() - startTime;

    // Save outgoing message to DB
    await Chat.create({
      contactId,
      contactName,
      direction: 'outgoing',
      messageType: 'text',
      body: reply,
      aiGenerated: true,
      mood: emotion,
      timestamp: new Date(),
      responseTime,
    });

    // Update relationship level
    await MemoryEngine.updateRelationshipLevel(contactId);

    // Update daily analytics
    updateAnalytics(contactId, contactName, emotion, responseTime).catch(err => {
      logger.warn('Analytics update failed:', err.message);
    });

    // Emit reply to dashboard
    if (global.io) {
      global.io.emit('chat:new_reply', {
        contactId,
        contactName,
        body: reply,
        timestamp: new Date(),
        responseTime,
      });
    }

    logger.info(`✓ Reply sent to ${contactId} in ${Math.round(responseTime / 1000)}s`);
  } catch (err) {
    logger.error('Message processing error:', err.message, err.stack);
  }
}

function mapMessageType(type) {
  const typeMap = {
    chat: 'text',
    ptt: 'voice',
    audio: 'voice',
    image: 'image',
    video: 'document',
    document: 'document',
    sticker: 'sticker',
    location: 'text',
  };
  return typeMap[type] || 'text';
}

async function updateAnalytics(contactId, contactName, emotion, responseTime) {
  try {
    const Analytics = require('../../models/Analytics');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await Analytics.findOneAndUpdate(
      { date: today },
      {
        $inc: {
          totalMessages: 2, // incoming + outgoing
          incomingMessages: 1,
          outgoingMessages: 1,
          aiGeneratedCount: 1,
          totalResponseTime: responseTime,
          responseCount: 1,
        },
        $set: {
          [`moodDistribution.${emotion}`]: {
            $ifNull: [`$moodDistribution.${emotion}`, 0],
          },
        },
      },
      { upsert: true }
    );

    // Update mood distribution separately
    if (emotion) {
      await Analytics.updateOne(
        { date: today },
        { $inc: { [`moodDistribution.${emotion}`]: 1 } }
      );
    }

    // Recalculate avg response time
    const analytics = await Analytics.findOne({ date: today });
    if (analytics && analytics.responseCount > 0) {
      const avg = analytics.totalResponseTime / analytics.responseCount;
      await Analytics.updateOne({ date: today }, { $set: { avgResponseTime: Math.round(avg) } });
    }
  } catch (err) {
    logger.error('Analytics update error:', err.message);
  }
}

// ─── Bull Queue Setup ─────────────────────────────────────────────────────────
let queue = null;

try {
  const Bull = require('bull');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  queue = new Bull('message-processing', redisUrl, {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  });

  queue.process(3, async (job) => {
    await processMessage(job.data.msg);
  });

  queue.on('failed', (job, err) => {
    logger.error(`Queue job ${job.id} failed: ${err.message}`);
  });

  queue.on('completed', (job) => {
    logger.debug(`Queue job ${job.id} completed`);
  });

  logger.info('Bull queue initialized with Redis');
} catch (err) {
  logger.warn(`Bull queue not available (${err.message}), using direct processing fallback`);
  queue = null;
}

/**
 * Process an incoming WhatsApp message
 * Routes through Bull queue if available, otherwise processes directly
 */
async function processIncomingMessage(msg, client) {
  // Serialize message data for queue transmission
  const msgData = {
    from: msg.from,
    body: msg.body || '',
    timestamp: msg.timestamp,
    type: msg.type || 'chat',
    id: {
      _serialized: msg.id?._serialized || msg.id?.id || String(Date.now()),
    },
    _data: {
      notifyName: msg._data?.notifyName || null,
    },
    isGroupMsg: msg.isGroupMsg || false,
  };

  if (queue) {
    try {
      await queue.add({ msg: msgData }, { priority: 1 });
      return;
    } catch (err) {
      logger.warn('Queue add failed, falling back to direct processing:', err.message);
    }
  }

  // Direct fallback (no Redis)
  setImmediate(() => processMessage(msgData));
}

module.exports = { processIncomingMessage, processMessage };
