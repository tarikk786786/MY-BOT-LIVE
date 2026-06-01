const cron = require('node-cron');
const logger = require('./logger');

function initKeepAlive() {
  // Ping the server every 14 minutes to prevent Render free-tier from sleeping
  cron.schedule('*/14 * * * *', async () => {
    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/health`);
      if (res.ok) {
        logger.info('Keep-alive ping successful');
      }
    } catch (err) {
      logger.error('Keep-alive ping failed', err.message);
    }
  });
  logger.info('Always-live ping initialized (14m interval)');
}

module.exports = { initKeepAlive };
