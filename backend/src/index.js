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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
    memory: process.memoryUsage(),
  });
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
