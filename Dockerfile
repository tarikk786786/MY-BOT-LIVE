# ───────────────────────────────────────────────────
# ROOT DOCKERFILE (For simple Render Web Service deployment)
# This will build and run the BACKEND by default.
# ───────────────────────────────────────────────────
FROM node:18-bullseye-slim

WORKDIR /app

# Install dependencies required for Puppeteer / Chromium
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copy the backend package.json
COPY backend/package*.json ./

# Tell Puppeteer to skip downloading Chrome and use the installed one
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install dependencies
RUN npm install --only=production

# Copy backend source code
COPY backend/ ./

# Expose backend port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
