const logger = require('../../utils/logger');

module.exports = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Dashboard connected: ${socket.id}`);

    // Send current WhatsApp status on connect
    socket.on('get:status', async () => {
      try {
        const { getStatus } = require('../whatsapp/WhatsAppManager');
        const status = await getStatus();
        socket.emit('wa:status', status);
      } catch (err) {
        socket.emit('wa:status', { connected: false, state: 'ERROR' });
      }
    });

    // Request QR code refresh
    socket.on('get:qr', async () => {
      try {
        const { getStatus } = require('../whatsapp/WhatsAppManager');
        const status = await getStatus();
        if (status.qr) {
          socket.emit('wa:qr', { qr: status.qr });
        } else {
          socket.emit('wa:qr', { qr: null, message: 'No QR available' });
        }
      } catch (err) {
        logger.error('Socket get:qr error:', err);
      }
    });

    // Manual message send via socket
    socket.on('send:message', async ({ to, message }) => {
      try {
        if (!to || !message) {
          return socket.emit('error', { msg: 'to and message are required' });
        }
        const { sendMessage } = require('../whatsapp/WhatsAppManager');
        await sendMessage(to, message);
        socket.emit('send:success', { to, message });
      } catch (err) {
        socket.emit('send:error', { error: err.message });
      }
    });

    // Restart WhatsApp
    socket.on('wa:restart', async () => {
      try {
        const { restartWhatsApp } = require('../whatsapp/WhatsAppManager');
        await restartWhatsApp();
        socket.emit('wa:restarting', {});
      } catch (err) {
        socket.emit('error', { msg: err.message });
      }
    });

    // Ping / heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Dashboard disconnected: ${socket.id} (${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error from ${socket.id}:`, err);
    });
  });
};
