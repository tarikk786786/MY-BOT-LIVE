const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  contactId: {
    type: String,
    required: true,
    index: true,
  },
  contactName: {
    type: String,
    default: 'Unknown',
  },
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'voice', 'image', 'document', 'sticker', 'video', 'location', 'ptt'],
    default: 'text',
  },
  body: {
    type: String,
    default: '',
  },
  mediaUrl: String,
  mood: String,
  emotionScore: Number,
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  processed: {
    type: Boolean,
    default: false,
  },
  messageId: {
    type: String,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  responseTime: Number, // ms taken to respond
  read: { type: Boolean, default: false },
}, { timestamps: true });

chatSchema.index({ contactId: 1, timestamp: -1 });
chatSchema.index({ timestamp: -1 });
chatSchema.index({ direction: 1, timestamp: -1 });

module.exports = mongoose.model('Chat', chatSchema);
