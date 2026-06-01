const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  value: mongoose.Schema.Types.Mixed,
  description: String,
}, { timestamps: true });

// Helper statics
settingsSchema.statics.get = async function (key) {
  const doc = await this.findOne({ key });
  return doc ? doc.value : null;
};

settingsSchema.statics.set = async function (key, value) {
  return this.findOneAndUpdate(
    { key },
    { value },
    { upsert: true, new: true }
  );
};

settingsSchema.statics.getAll = async function () {
  const docs = await this.find();
  return docs.reduce((acc, doc) => {
    acc[doc.key] = doc.value;
    return acc;
  }, {});
};

settingsSchema.statics.setMany = async function (updates) {
  const ops = Object.entries(updates).map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: { $set: { value } },
      upsert: true,
    }
  }));
  return this.bulkWrite(ops);
};

module.exports = mongoose.model('Settings', settingsSchema);
