const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Use a minimal pino logger for Baileys internals
const pino = require('pino');
const baileysLogger = pino({ level: 'silent' });

const AUTH_DIR = path.join(process.cwd(), 'sessions', 'baileys_auth');

let sock = null;
let waStatus = {
  connected: false,
  qr: null,
  phone: null,
  battery: null,
  lastConnected: null,
  state: 'DISCONNECTED',
};
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;

async function createClient() {
  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  logger.info(`Using Baileys v${version.join('.')} (WebSocket, no Chrome needed)`);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
    },
    logger: baileysLogger,
    printQRInTerminal: false,
    browser: ['WhatsApp AI Bot', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 25000,
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
  });

  // Save credentials whenever they update
  sock.ev.on('creds.update', saveCreds);

  // Connection updates (QR, open, close)
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // QR code received
    if (qr) {
      logger.info('QR Code generated — scan it in the dashboard');
      try {
        const qrDataUrl = await qrcode.toDataURL(qr);
        waStatus.qr = qrDataUrl;
        waStatus.connected = false;
        waStatus.state = 'QR_READY';
        if (global.io) global.io.emit('wa:qr', { qr: qrDataUrl });
      } catch (err) {
        logger.error('QR generation error:', err);
      }
    }

    // Connection opened
    if (connection === 'open') {
      logger.info('✅ WhatsApp connected successfully!');
      reconnectAttempts = 0;
      waStatus.pairingCode = null; // Clear pairing code on connect
      const phone = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || null;
      waStatus = {
        connected: true,
        qr: null,
        phone,
        battery: null,
        lastConnected: new Date(),
        state: 'CONNECTED',
        pushname: sock.user?.name || null,
      };
      if (global.io) global.io.emit('wa:ready', waStatus);
    }

    // Connection closed
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(`WhatsApp disconnected (code: ${statusCode})`);
      waStatus.connected = false;
      waStatus.qr = null;

      if (statusCode === DisconnectReason.loggedOut) {
        // Clear auth data on logout
        logger.info('Logged out — clearing session data');
        waStatus.state = 'LOGGED_OUT';
        waStatus.pairingCode = null;
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch (e) {}
        if (global.io) global.io.emit('wa:disconnected', { reason: 'Logged out' });
        // Restart to show fresh QR
        setTimeout(() => initWhatsApp(), 3000);
      } else if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        waStatus.state = 'RECONNECTING';
        const delay = Math.min(3000 * Math.pow(1.3, reconnectAttempts), 30000);
        reconnectAttempts++;
        logger.info(`Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
        if (global.io) global.io.emit('wa:disconnected', { reason: `Reconnecting... (${reconnectAttempts})` });
        setTimeout(() => initWhatsApp(), delay);
      } else {
        waStatus.state = 'DISCONNECTED';
        logger.error('Max reconnect attempts reached or logged out');
        if (global.io) global.io.emit('wa:max_reconnect', {});
      }
    }
  });

  // Incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        // Skip own messages
        if (msg.key.fromMe) continue;

        // Skip status broadcast
        if (msg.key.remoteJid === 'status@broadcast') continue;

        // Skip group messages unless enabled
        const isGroup = msg.key.remoteJid?.endsWith('@g.us');
        if (isGroup) {
          const Settings = require('../../models/Settings');
          const groupEnabled = await Settings.get('allowGroupMessages');
          if (!groupEnabled) continue;
        }

        const from = msg.key.remoteJid;
        const body = msg.message?.conversation
          || msg.message?.extendedTextMessage?.text
          || msg.message?.imageMessage?.caption
          || msg.message?.videoMessage?.caption
          || '';
        const messageType = Object.keys(msg.message || {})[0] || 'conversation';

        logger.info(`Incoming message from ${from}: ${body.substring(0, 60)}`);

        if (global.io) {
          global.io.emit('wa:message', {
            from,
            body,
            type: messageType,
            timestamp: msg.messageTimestamp,
            isGroupMsg: isGroup,
          });
        }

        // Build a compatible message object for MessageQueue
        const compatMsg = {
          from,
          body,
          timestamp: msg.messageTimestamp,
          type: mapBaileysType(messageType),
          id: { _serialized: msg.key.id },
          _data: { notifyName: msg.pushName || null },
          isGroupMsg: isGroup || false,
        };

        const { processIncomingMessage } = require('../queue/MessageQueue');
        await processIncomingMessage(compatMsg, sock);
      } catch (err) {
        logger.error('Error processing incoming message:', err.message);
      }
    }
  });
}

function mapBaileysType(type) {
  if (type === 'conversation' || type === 'extendedTextMessage') return 'chat';
  if (type === 'audioMessage') return 'ptt';
  if (type === 'imageMessage') return 'image';
  if (type === 'videoMessage' || type === 'documentMessage') return 'document';
  if (type === 'stickerMessage') return 'sticker';
  return 'chat';
}

async function initWhatsApp() {
  logger.info('Initializing WhatsApp client (Baileys)...');
  try {
    if (sock) {
      try {
        sock.end(undefined);
        logger.info('Previous socket closed');
      } catch (e) {
        logger.warn('Could not close previous socket:', e.message);
      }
      sock = null;
    }
    await createClient();
  } catch (err) {
    logger.error('WhatsApp init error:', err.message);
    setTimeout(() => initWhatsApp(), 10000);
  }
}

async function sendMessage(to, message) {
  if (!sock || !waStatus.connected) {
    throw new Error('WhatsApp not connected');
  }
  const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text: message });
}

async function sendTyping(to) {
  try {
    if (!sock || !waStatus.connected) return;
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await sock.sendPresenceUpdate('composing', jid);
  } catch (e) {
    // Non-critical
  }
}

async function stopTyping(to) {
  try {
    if (!sock || !waStatus.connected) return;
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    await sock.sendPresenceUpdate('paused', jid);
  } catch (e) {
    // Non-critical
  }
}

async function getStatus() {
  return { ...waStatus };
}

function getClient() {
  return sock;
}

async function restartWhatsApp() {
  reconnectAttempts = 0;
  await initWhatsApp();
}

async function requestPairingCode(phoneNumber) {
  if (!sock) {
    throw new Error('WhatsApp client not initialized');
  }
  // Sanitize phone number (remove +, spaces, etc)
  const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
  if (!cleanNumber) {
    throw new Error('Invalid phone number');
  }
  
  logger.info(`Requesting pairing code for ${cleanNumber}...`);
  // Delay slightly to ensure socket is ready
  await new Promise(r => setTimeout(r, 1500));
  const code = await sock.requestPairingCode(cleanNumber);
  waStatus.pairingCode = code;
  waStatus.state = 'PAIRING_CODE_READY';
  
  if (global.io) {
    global.io.emit('wa:pairing_code', { code });
  }
  return code;
}

async function logoutWhatsApp() {
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {
      logger.warn('Logout error:', e.message);
    }
    try {
      sock.end(undefined);
    } catch (e) {}
    sock = null;
  }
  // Clear auth
  try {
    fs.rmSync(AUTH_DIR, { recursive: true, force: true });
  } catch (e) {}
  waStatus = { connected: false, qr: null, phone: null, battery: null, lastConnected: null, state: 'LOGGED_OUT' };
  if (global.io) global.io.emit('wa:disconnected', { reason: 'Logged out' });
}

module.exports = {
  initWhatsApp,
  sendMessage,
  sendTyping,
  stopTyping,
  getStatus,
  getClient,
  restartWhatsApp,
  logoutWhatsApp,
  requestPairingCode,
};
