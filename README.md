<h1 align="center">
  <img src="https://img.shields.io/badge/CompanionAI-WhatsApp%20Companion-00d084?style=for-the-badge&logo=whatsapp" />
</h1>

<p align="center">
  <strong>Ultra Human-Like AI WhatsApp Companion Platform</strong><br/>
  Production-ready SaaS · Dark Luxury UI · OpenAI-Compatible · Render Deployable
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb" />
  <img src="https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis" />
  <img src="https://img.shields.io/badge/Docker-ready-blue?style=flat-square&logo=docker" />
  <img src="https://img.shields.io/badge/Render-deployable-purple?style=flat-square" />
</p>

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🤖 **Ultra Human-Like AI** | Emotional intelligence, Hinglish support, mood detection, relationship progression |
| 📱 **WhatsApp Integration** | QR scan login, auto-reconnect, typing simulation, seen simulation |
| 🧠 **Memory System** | Per-contact facts, interests, moods, relationship level tracking |
| 🎭 **6 AI Personalities** | Best Friend, Girlfriend, Mentor, Gym Bro, Emotional Companion, Funny Mode |
| 📊 **Admin Dashboard** | Real-time analytics, memory editor, prompt editor, live chat viewer |
| ⚡ **Always Live** | Auto-reconnect, crash recovery, Render keep-alive worker |
| 🔒 **Security** | JWT auth, rate limiting, helmet, input validation |
| 🌐 **Multi-Provider AI** | OpenAI, Groq, Together AI, OpenRouter — switch via env var |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB 7+
- Redis 7+ *(optional — graceful fallback)*
- OpenAI API key (or Groq/Together AI)

### 1. Clone & Setup

```bash
git clone <your-repo>
cd "my new bot"

# Copy env file
cp .env.example .env
# Edit .env with your values (especially AI_API_KEY)
```

### 2. Run with Docker (Recommended)

```bash
# Start full stack (MongoDB + Redis + Backend + Frontend)
docker-compose up -d

# View logs
docker-compose logs -f backend
```

Open http://localhost:3000 → Login → Scan WhatsApp QR

### 3. Run Manually (Dev Mode)

**Backend:**
```bash
cd backend
npm install
npm run seed    # Create admin user + seed personality profiles
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Default Login

```
Username: admin
Password: admin123
```

> ⚠️ **Change this immediately** after first login via Settings!

---

## 🌐 Render Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial CompanionAI setup"
git remote add origin https://github.com/YOUR_USERNAME/companionai
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect your GitHub repository
3. Render auto-detects `render.yaml` → click **Apply**
4. Set these env vars in Render dashboard:
   - `AI_API_KEY` = your OpenAI/Groq/Together key
   - `JWT_SECRET` = a long random string
5. Wait for all 3 services to deploy (backend, frontend, worker)
6. Open the frontend URL → Login → Scan QR

### Step 3: WhatsApp Session on Render

The backend service has a 1GB disk mounted at `/app/sessions` for WhatsApp session persistence. Sessions survive redeploys! 🎉

---

## 🤖 AI Providers

Switch providers by setting env vars:

| Provider | `AI_PROVIDER` | `AI_MODEL` | Notes |
|----------|---------------|------------|-------|
| OpenAI | `openai` | `gpt-4o` | Best quality |
| Groq | `groq` | `llama3-70b-8192` | Very fast, free tier |
| Together AI | `together` | `meta-llama/Llama-3-70b-chat-hf` | Affordable |
| OpenRouter | `openrouter` | `anthropic/claude-3-haiku` | Access many models |

---

## 🎭 AI Personalities

| Mode | Vibe |
|------|------|
| **Best Friend** | Casual, supportive, funny, Hinglish |
| **Girlfriend** | Warm, romantic, caring, emotional |
| **Mentor** | Wise, motivating, structured advice |
| **Gym Bro** | Energetic, hype, fitness obsessed |
| **Emotional Companion** | Deep listener, empathetic, patient |
| **Funny Mode** | Memes, jokes, savage comebacks |

---

## 📁 Project Structure

```
my new bot/
├── frontend/           # Next.js 14 Admin Dashboard
│   ├── app/            # Pages (login, dashboard, chats, analytics...)
│   ├── components/     # UI components
│   └── lib/            # API client, socket, store
│
├── backend/            # Node.js API Server
│   └── src/
│       ├── controllers/
│       ├── models/     # MongoDB schemas
│       ├── routes/
│       ├── services/
│       │   ├── ai/     # AI engine, prompt builder, emotion
│       │   ├── whatsapp/ # WA manager, sessions
│       │   ├── memory/ # Memory engine
│       │   └── queue/  # Bull message queue
│       └── middleware/
│
├── docker-compose.yml  # Local full stack
├── render.yaml         # Render deployment
└── .env.example        # Environment template
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Long random secret for JWT signing |
| `AI_API_KEY` | ✅ | Your AI provider API key |
| `AI_PROVIDER` | ✅ | `openai` / `groq` / `together` / `openrouter` |
| `AI_MODEL` | ✅ | Model name for your provider |
| `REDIS_URL` | ⚡ | Redis URL (optional, graceful fallback) |
| `FRONTEND_URL` | ✅ | Frontend URL (for CORS) |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API URL (frontend env) |

---

## 📊 API Endpoints

```
POST   /api/auth/login          Login
POST   /api/auth/setup          First-time admin setup

GET    /api/whatsapp/status     WA connection status + QR
POST   /api/whatsapp/restart    Restart WA client

GET    /api/chat/contacts       List all contacts
GET    /api/chat/:id/messages   Get messages (paginated)
POST   /api/chat/:id/send       Send manual message

GET    /api/memory              All contact memories
GET    /api/memory/:id          Single contact memory
PUT    /api/memory/:id          Update memory

GET    /api/personality         List personalities
POST   /api/personality         Create personality
POST   /api/personality/seed    Seed 6 defaults

GET    /api/analytics/overview  Total stats
GET    /api/analytics/daily     Daily message counts
GET    /api/analytics/moods     Mood distribution

GET    /api/settings            All settings
PUT    /api/settings            Update settings

GET    /health                  Health check
```

---

## 🐛 Troubleshooting

**WhatsApp disconnects frequently?**
- Enable the worker service on Render
- Check session disk is properly mounted
- WhatsApp auto-reconnects every 5s on disconnect

**AI not responding?**
- Verify `AI_API_KEY` is set correctly
- Check backend logs: `docker-compose logs backend`
- Test with Groq (free): set `AI_PROVIDER=groq`

**QR code not showing?**
- Check backend is running: GET /health
- Open browser console → look for socket errors
- Restart WA: POST /api/whatsapp/restart

---

## 🛡️ Security Notes

- Change default `admin123` password immediately
- Use a strong random `JWT_SECRET` (32+ chars)
- Keep `AI_API_KEY` secret — never commit to git
- Add `.env` to `.gitignore`
- Rate limiting is enabled by default (500 req/15min)

---

## 📜 License

MIT — Built with ❤️ for the builders.
