const mongoose = require('mongoose');
const crypto = require('crypto');

// Use ENCRYPTION_KEY or fallback to JWT_SECRET. Must be exactly 32 bytes for AES-256-CBC.
function getEncryptionKey() {
  const secret = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'fallback-secret-key-32-chars-min!!!';
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
}

const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getEncryptionKey()), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  const textParts = text.split(':');
  if (textParts.length !== 2) return text; // Not encrypted or corrupted
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getEncryptionKey()), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const apiKeySchema = new mongoose.Schema({
  provider: { 
    type: String, 
    required: true,
    enum: ['openai', 'groq', 'together', 'openrouter', 'mistral', 'huggingface', 'anthropic', 'gemini', 'deepseek', 'ollama', 'custom']
  },
  label: { type: String, default: 'Default Key' },
  key: { type: String, required: true }, // Encrypted at rest
  baseUrl: { type: String }, // For custom endpoints
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  lastUsed: { type: Date },
  lastError: { type: String },
  priority: { type: Number, default: 5 }, // 1 is highest priority
}, { timestamps: true });

// Encrypt key before saving
apiKeySchema.pre('save', function(next) {
  if (this.isModified('key') && !this.key.includes(':')) {
    this.key = encrypt(this.key);
  }
  next();
});

// Helper to decrypt key when retrieving
apiKeySchema.methods.getDecryptedKey = function() {
  return decrypt(this.key);
};

module.exports = mongoose.model('ApiKey', apiKeySchema);
