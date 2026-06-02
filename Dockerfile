FROM node:20-bullseye-slim

WORKDIR /app

# Copy the backend package.json
COPY backend/package*.json ./

# Install dependencies (without dev dependencies)
RUN npm install --omit=dev

# Copy backend source code
COPY backend/ ./

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
