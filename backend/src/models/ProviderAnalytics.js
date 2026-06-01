const mongoose = require('mongoose');

const providerAnalyticsSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  modelName: { type: String, required: true },
  latencyMs: { type: Number, required: true }, // Time taken for response
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  estimatedCostUsd: { type: Number, default: 0 },
  isSuccess: { type: Boolean, default: true },
  errorMessage: { type: String },
  taskType: { type: String, enum: ['chat', 'coding', 'vision', 'voice', 'summarization', 'general'] },
  timestamp: { type: Date, default: Date.now }
});

// Create index for fast dashboard analytics (querying by provider and task type over time)
providerAnalyticsSchema.index({ provider: 1, timestamp: -1 });
providerAnalyticsSchema.index({ taskType: 1, timestamp: -1 });

module.exports = mongoose.model('ProviderAnalytics', providerAnalyticsSchema);
