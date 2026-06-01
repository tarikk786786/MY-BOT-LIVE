const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true,
  },
  totalMessages: { type: Number, default: 0 },
  incomingMessages: { type: Number, default: 0 },
  outgoingMessages: { type: Number, default: 0 },
  uniqueContacts: { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 }, // ms
  totalResponseTime: { type: Number, default: 0 }, // for calculating avg
  responseCount: { type: Number, default: 0 },
  moodDistribution: {
    type: Map,
    of: Number,
    default: {},
  },
  topContacts: [{
    contactId: String,
    contactName: String,
    count: Number,
    _id: false,
  }],
  aiGeneratedCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Analytics', analyticsSchema);
