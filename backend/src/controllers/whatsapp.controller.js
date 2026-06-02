const { getStatus, restartWhatsApp, logoutWhatsApp } = require('../services/whatsapp/WhatsAppManager');
const logger = require('../utils/logger');

/**
 * GET /api/whatsapp/status
 */
exports.getStatus = async (req, res, next) => {
  try {
    const status = await getStatus();
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/whatsapp/qr
 */
exports.getQR = async (req, res, next) => {
  try {
    const status = await getStatus();
    if (status.connected) {
      return res.json({ success: true, connected: true, qr: null });
    }
    if (!status.qr) {
      return res.json({ success: true, connected: false, qr: null, message: 'QR not yet generated' });
    }
    res.json({ success: true, connected: false, qr: status.qr });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/whatsapp/restart
 */
exports.restart = async (req, res, next) => {
  try {
    logger.info(`WhatsApp restart requested by user: ${req.user.username}`);
    // Restart asynchronously
    setTimeout(() => restartWhatsApp(), 100);
    res.json({ success: true, message: 'WhatsApp restart initiated' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/whatsapp/logout
 */
exports.logout = async (req, res, next) => {
  try {
    logger.info(`WhatsApp logout requested by user: ${req.user.username}`);
    await logoutWhatsApp();
    res.json({ success: true, message: 'WhatsApp logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/whatsapp/pairing-code
 */
exports.requestPairingCode = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    const { requestPairingCode } = require('../services/whatsapp/WhatsAppManager');
    const code = await requestPairingCode(phoneNumber);
    res.json({ success: true, code });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/whatsapp/send
 * Manually send a message via WhatsApp
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: 'to and message are required' });
    }

    const { sendMessage } = require('../services/whatsapp/WhatsAppManager');
    await sendMessage(to, message);

    // Log to chat DB
    const Chat = require('../models/Chat');
    await Chat.create({
      contactId: to.replace('@c.us', ''),
      direction: 'outgoing',
      messageType: 'text',
      body: message,
      aiGenerated: false,
      timestamp: new Date(),
    });

    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    next(err);
  }
};
