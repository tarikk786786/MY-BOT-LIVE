const mongoose = require('mongoose');

const personalitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Personality name is required'],
    trim: true,
  },
  mode: {
    type: String,
    required: [true, 'Personality mode is required'],
    trim: true,
  },
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required'],
  },
  temperature: { type: Number, default: 0.9, min: 0, max: 2 },
  maxTokens: { type: Number, default: 300, min: 50, max: 2000 },
  isDefault: { type: Boolean, default: false },
  traits: { type: [String], default: [] },
  language: { type: String, default: 'hinglish' },
  emojiUsage: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'high',
  },
  responseStyle: String,
  minDelay: { type: Number, default: 1000 },
  maxDelay: { type: Number, default: 5000 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure only one default at a time
personalitySchema.pre('save', async function (next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Personality', personalitySchema);
