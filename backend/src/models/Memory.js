const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  contactId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  contactName: { type: String, default: 'Unknown' },
  nickname: String,
  phone: String,
  interests: { type: [String], default: [] },
  mood: { type: String, default: 'neutral' },
  relationshipLevel: { type: Number, default: 1, min: 1, max: 10 },
  emotionalPatterns: { type: [String], default: [] },
  dailyHabits: { type: [String], default: [] },
  facts: { type: [String], default: [] },
  preferences: { type: mongoose.Schema.Types.Mixed, default: {} },
  language: { type: String, default: 'hinglish' },
  lastMood: { type: String, default: 'neutral' },
  moodHistory: [{
    mood: String,
    timestamp: { type: Date, default: Date.now },
    _id: false,
  }],
  messageCount: { type: Number, default: 0 },
  lastSeen: Date,
  firstSeen: { type: Date, default: Date.now },
  personalityOverride: { type: mongoose.Schema.Types.ObjectId, ref: 'Personality' },
  customPrompt: String,
  blocked: { type: Boolean, default: false },
  notes: String, // Admin notes about this contact
  tags: { type: [String], default: [] },
  avgResponseSentiment: { type: Number, default: 5 }, // 1-10
}, { timestamps: true });

// Auto-limit mood history to last 50 entries
memorySchema.pre('save', function (next) {
  if (this.moodHistory && this.moodHistory.length > 50) {
    this.moodHistory = this.moodHistory.slice(-50);
  }
  next();
});

module.exports = mongoose.model('Memory', memorySchema);
