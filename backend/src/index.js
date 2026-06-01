require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const logger = require('./utils/logger');
const { initWhatsApp } = require('./services/whatsapp/WhatsAppManager');
const { initKeepAlive } = require('./utils/keepAlive');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Make io available globally
global.io = io;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/whatsapp', require('./routes/whatsapp.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/memory', require('./routes/memory.routes'));
app.use('/api/personality', require('./routes/personality.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/messages', require('./routes/messages.routes'));
app.use('/api/brain', require('./routes/brain.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
    memory: process.memoryUsage(),
  });
});

// Root UI for QR Scanning
app.get('/', async (req, res) => {
  const { getStatus } = require('./services/whatsapp/WhatsAppManager');
  const status = await getStatus();
  
  let content = '';
  if (status.state === 'CONNECTED' || status.state === 'AUTHENTICATED') {
    content = `
      <div style="text-align: center; color: #10b981;">
        <h2 style="font-size: 2rem;">✅ Bot is LIVE and Connected!</h2>
        <p style="font-size: 1.2rem; color: #a1a1aa;">WhatsApp number: ${status.phone || 'Connected'}</p>
      </div>
    `;
  } else if (status.qr) {
    content = `
      <div style="text-align: center;">
        <h2 style="color: #3b82f6; font-size: 1.8rem; margin-bottom: 20px;">Scan to activate your Bot</h2>
        <img src="${status.qr}" alt="QR Code" style="width: 300px; height: 300px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
        <p style="margin-top: 20px; color: #a1a1aa;">Open WhatsApp > Settings > Linked Devices > Scan</p>
      </div>
    `;
  } else {
    content = `
      <div style="text-align: center; color: #f59e0b;">
        <h2 style="font-size: 1.8rem;">⏳ Starting up...</h2>
        <p style="color: #a1a1aa;">Generating QR code, please refresh the page in 5 seconds.</p>
        <p style="font-size: 0.9rem; color: #52525b;">Status: ${status.state}</p>
      </div>
    `;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>WhatsApp AI Bot Status</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        .container { background: #18181b; padding: 40px; border-radius: 16px; border: 1px solid #27272a; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
      </style>
      ${(!status.connected && !status.qr) ? '<meta http-equiv="refresh" content="5">' : ''}
    </head>
    <body>
      <div class="container">
        ${content}
      </div>
    </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(require('./middleware/errorHandler'));

// Socket.io events
require('./services/socket/socketHandler')(io);

// Keep-alive cron for Render free tier (every 14 minutes)
cron.schedule('*/14 * * * *', () => {
  const http = require('http');
  const port = process.env.PORT || 5000;
  http.get(`http://localhost:${port}/health`, (res) => {
    logger.info(`Keep-alive ping: ${res.statusCode}`);
  }).on('error', (err) => {
    logger.warn('Keep-alive ping failed:', err.message);
  });
});

const PORT = process.env.PORT || 5000;

async function connectDB(retries = 5) {
  if (!process.env.MONGODB_URI) {
    logger.error('CRITICAL ERROR: MONGODB_URI environment variable is missing.');
    logger.error('You MUST set MONGODB_URI to your MongoDB Atlas connection string in Render.');
    process.exit(1);
  }

  while (retries > 0) {
    try {
      logger.info(`Attempting MongoDB connection... (${retries} retries left)`);
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('✅ MongoDB Atlas connected successfully');
      return true;
    } catch (err) {
      logger.error('MongoDB connection error:', err.message);
      retries -= 1;
      if (retries === 0) {
        logger.error('❌ Failed to connect to MongoDB after multiple attempts.');
        process.exit(1);
      }
      logger.info('Retrying MongoDB connection in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

async function start() {
  try {
    // 1. Connect to Database FIRST
    await connectDB();

    // 2. Start Express Server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      
      // 3. Initialize WhatsApp Engine safely
      setTimeout(() => {
        try {
          initWhatsApp();
        } catch (e) {
          logger.error('WhatsApp Init Error:', e.message);
        }
      }, 2000);
      
      // 4. Initialize Keep Alive
      initKeepAlive();
    });
  } catch (err) {
    logger.error('Fatal Startup error:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(async () => {
    try {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error('Error closing MongoDB:', err);
    }
    process.exit(0);
  });
  // Force exit after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

start();
