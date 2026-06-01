const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../../utils/logger');

let client = null;
let waStatus = {
  connected: false,
  qr: null,
  phone: null,
  battery: null,
  lastConnected: null,
  state: 'DISCONNECTED',
};
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

function createClient() {
  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WA_SESSION_PATH || './sessions',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    },
  });

  client.on('qr', async (qr) => {
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
  });

  client.on('ready', async () => {
    logger.info('WhatsApp connected successfully!');
    reconnectAttempts = 0;
    try {
      const info = client.info;
      waStatus = {
        connected: true,
        qr: null,
        phone: info?.wid?.user || null,
        battery: null,
        lastConnected: new Date(),
        state: 'CONNECTED',
        pushname: info?.pushname || null,
      };
    } catch (e) {
      waStatus.connected = true;
      waStatus.state = 'CONNECTED';
      waStatus.qr = null;
    }
    if (global.io) global.io.emit('wa:ready', waStatus);
  });

  client.on('authenticated', () => {
    logger.info('WhatsApp authenticated');
    waStatus.state = 'AUTHENTICATED';
    if (global.io) global.io.emit('wa:authenticated', {});
  });

  client.on('auth_failure', (msg) => {
    logger.error('WhatsApp auth failure:', msg);
    waStatus.connected = false;
    waStatus.state = 'AUTH_FAILED';
    if (global.io) global.io.emit('wa:auth_failure', { msg });
  });

  client.on('disconnected', (reason) => {
    logger.warn(`WhatsApp disconnected: ${reason}`);
    waStatus.connected = false;
    waStatus.state = 'DISCONNECTED';
    waStatus.qr = null;
    if (global.io) global.io.emit('wa:disconnected', { reason });

    // Exponential backoff reconnect
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts), 60000);
      reconnectAttempts++;
      logger.info(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      setTimeout(() => initWhatsApp(), delay);
    } else {
      logger.error('Max reconnect attempts reached. Manual restart required.');
      if (global.io) global.io.emit('wa:max_reconnect', {});
    }
  });

  client.on('message', async (msg) => {
    // Skip group messages unless enabled
    if (msg.isGroupMsg) {
      const Settings = require('../../models/Settings');
      const groupEnabled = await Settings.get('allowGroupMessages');
      if (!groupEnabled) return;
    }

    // Skip status messages
    if (msg.from === 'status@broadcast') return;

    logger.info(`Incoming message from ${msg.from}: ${(msg.body || '').substring(0, 60)}`);

    if (global.io) {
      global.io.emit('wa:message', {
        from: msg.from,
        body: msg.body,
        type: msg.type,
        timestamp: msg.timestamp,
        isGroupMsg: msg.isGroupMsg,
      });
    }

    try {
      const { processIncomingMessage } = require('../queue/MessageQueue');
      await processIncomingMessage(msg, client);
    } catch (err) {
      logger.error('Error dispatching incoming message:', err);
    }
  });

  client.on('message_create', async (msg) => {
    // Log outgoing messages sent from the phone itself
    if (msg.fromMe && !msg.from === 'status@broadcast') {
      if (global.io) {
        global.io.emit('wa:message_sent', {
          to: msg.to,
          body: msg.body,
          timestamp: msg.timestamp,
        });
      }
    }
  });

  client.on('change_battery', (batteryInfo) => {
    waStatus.battery = batteryInfo;
    if (global.io) global.io.emit('wa:battery', batteryInfo);
  });

  client.initialize().catch((err) => {
    logger.error('WhatsApp initialization error:', err.message);
    waStatus.state = 'ERROR';
    const delay = Math.min(10000 * Math.pow(1.5, reconnectAttempts), 60000);
    reconnectAttempts++;
    setTimeout(() => initWhatsApp(), delay);
  });
}

async function initWhatsApp() {
  logger.info('Initializing WhatsApp client...');
  try {
    if (client) {
      try {
        await client.destroy();
        logger.info('Previous client destroyed');
      } catch (e) {
        logger.warn('Could not destroy previous client:', e.message);
      }
      client = null;
    }
    createClient();
  } catch (err) {
    logger.error('WhatsApp reinit error:', err);
    setTimeout(() => initWhatsApp(), 15000);
  }
}

async function sendMessage(to, message) {
  if (!client || !waStatus.connected) {
    throw new Error('WhatsApp not connected');
  }
  const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
  return client.sendMessage(chatId, message);
}

async function sendTyping(to) {
  try {
    if (!client || !waStatus.connected) return;
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    const chat = await client.getChatById(chatId);
    await chat.sendStateTyping();
  } catch (e) {
    // Typing indicator failures are non-critical
  }
}

async function stopTyping(to) {
  try {
    if (!client || !waStatus.connected) return;
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    const chat = await client.getChatById(chatId);
    await chat.clearState();
  } catch (e) {
    // Non-critical
  }
}

async function getStatus() {
  return { ...waStatus };
}

function getClient() {
  return client;
}

async function restartWhatsApp() {
  reconnectAttempts = 0;
  await initWhatsApp();
}

async function logoutWhatsApp() {
  if (client) {
    try {
      await client.logout();
    } catch (e) {
      logger.warn('Logout error:', e.message);
    }
    try {
      await client.destroy();
    } catch (e) {}
    client = null;
  }
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
};
