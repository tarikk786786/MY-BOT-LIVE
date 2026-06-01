# ───────────────────────────────────────────────────
# ROOT DOCKERFILE (For simple Render Web Service deployment)
# This will build and run the BACKEND by default.
# ───────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Copy the backend package.json
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
