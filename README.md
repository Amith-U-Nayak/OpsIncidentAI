# OpsIncidentAI 🚨🤖

> **Autonomous AI-Powered IT Incident Management Platform**

OpsIncidentAI automatically analyses server incidents, identifies root causes, matches runbooks, and generates post-mortem reports — all without human intervention — using a 4-agent LangGraph pipeline powered by Groq LLMs.

---

## 🎯 What Problem Does It Solve?

When a production server goes down, engineers waste precious time:
1. Manually digging through thousands of log lines
2. Googling error messages to find solutions
3. Writing post-mortem reports after the fact

**OpsIncidentAI automates all three steps** — the moment an incident is created, the AI pipeline kicks in and returns a root cause analysis, recommended solution, and a full post-mortem report within seconds.

---

## 🏗️ Architecture

```
POST /api/incidents/:id/analyse
         ↓
   Agent 1: Log Analyzer
   → Downloads logs from Cloudinary
   → Pre-filters for error signals (keyword-based, not blind truncation)
   → Extracts structured error list + severity level
         ↓
   Agent 2: Root Cause Analyzer
   → Reads extracted errors
   → Traces causal chain (what broke first?)
   → Returns: rootCause + confidence score (0-100)
         ↓
   Agent 3: Runbook Matcher (4-tier fallback)
   → Tier 1: Search private MongoDB runbooks (vector/semantic search)
   → Tier 2: Search historical resolved PostMortems
   → Tier 3: Tavily web search (StackOverflow, GitHub Issues, docs)
   → Tier 4: Direct LLM knowledge (never returns empty)
         ↓
   Agent 4: Post-Mortem Generator
   → Writes dual-audience report (plain English for management + technical for engineers)
   → Saves to MongoDB with upsert (no duplicates on pipeline re-runs)
   → Updates incident status automatically
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **AI Orchestration** | LangGraph.js, LangChain.js |
| **LLM** | Groq API (`openai/gpt-oss-20b`) |
| **Web Search** | Tavily Search API |
| **File Storage** | Cloudinary |
| **Auth** | JWT + bcrypt, Role-Based Access Control |
| **Real-time** | Socket.IO |
| **Frontend** | React + TailwindCSS + Recharts *(in progress)* |
| **Automation** | n8n *(planned)* |
| **Deployment** | Render (backend) + Vercel (frontend) *(planned)* |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+
- MongoDB Atlas account (free M0 cluster)
- Groq API key (free)
- Cloudinary account (free)
- Tavily API key (free)

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/OpsIncidentAI.git
cd OpsIncidentAI/server

# Install dependencies
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env
# Fill in your API keys in .env

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the `server/` folder:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user (protected) |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/incidents` | Create incident + upload log files |
| GET | `/api/incidents` | List all incidents |
| GET | `/api/incidents/:id` | Get single incident |
| PATCH | `/api/incidents/:id/status` | Update incident status |
| DELETE | `/api/incidents/:id` | Delete incident |
| **POST** | **`/api/incidents/:id/analyse`** | **🤖 Trigger AI pipeline** |

---

## ✅ Module Progress

- [x] Module 0: Project Setup
- [x] Module 1: JWT Authentication + RBAC
- [x] Module 2: Incident CRUD + File Upload (Cloudinary)
- [x] Module 3: AI Agent Pipeline (LangGraph)
- [ ] Module 4: RAG Pipeline (Runbook Vector Search)
- [ ] Module 5: Real-time Socket.IO Agent Events
- [ ] Module 6: Analytics Routes
- [ ] Module 7: React Frontend Dashboard
- [ ] Module 8: n8n Automation (Slack/Email alerts)
- [ ] Module 9: Deployment

---

## 👨‍💻 Author

**Amith U Nayak** — Built as a portfolio project for campus placements.
