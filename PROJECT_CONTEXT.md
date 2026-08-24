# OpsIncidentAI — Project Context File
# Agent reads this at the start of every session to get up to speed instantly.
# Last updated: After Module 3 completion (AI Agent Pipeline fully working + tested)

---

## 🧑 Student Info
- Name: Amith U Nayak
- Goal: Campus placement (15–20 LPA, product/Big Tech companies)
- Project: OpsIncidentAI — AI-Powered Incident Management System
- Skill level: Built 2-3 web projects using AI, limited deep knowledge
- Learning style: MUST explain EVERY line of code with comments, use simple real-world analogies (restaurant, hospital, hotel etc.), give 2-3 interview talking points after each major file
- Uses: Antigravity IDE + Postman for API testing + CMD for terminal commands

## ⚠️ CRITICAL TEACHING RULES (Agent must follow every session)
1. Write detailed comments INSIDE every code file explaining each line
2. Before writing a file, explain what it is, what it does, and use an analogy
3. After each file, give 2-3 interview talking points the student can use
4. When an error occurs: first explain what the error MEANS in simple terms, then fix it
5. Never skip steps — student is learning from scratch
6. Track every real bug+fix in the "Challenges" section at bottom of this file

## 🖥️ Terminal Notes
- Student uses CMD for npm commands (not PowerShell)
- Agent's run_command tool uses PowerShell — use semicolons (;) not && between commands
- For creating multiple folders in PowerShell: New-Item -ItemType Directory -Force -Path "a","b","c"
- npm installs always need --legacy-peer-deps due to LangChain version conflicts

---

## 📁 Project Location
```
C:\Users\Amith U Nayak\.gemini\antigravity\scratch\opsgenieai\
├── PROJECT_CONTEXT.md   ← THIS FILE
├── server\              ← Backend (complete structure created)
│   ├── .env             ← Contains real credentials (DO NOT READ ALOUD)
│   ├── .gitignore
│   ├── package.json
│   ├── api.http         ← Postman-style test file (REST Client)
│   └── src\
│       ├── app.js            ← Main server (WRITTEN + WORKING)
│       ├── config\
│       │   └── db.js         ← MongoDB connection (WRITTEN + WORKING)
│       ├── models\
│       │   └── User.model.js ← User schema (WRITTEN + WORKING)
│       ├── controllers\
│       │   └── auth.controller.js (WRITTEN + WORKING)
│       ├── middleware\
│       │   └── auth.middleware.js (WRITTEN + WORKING)
│       ├── routes\
│       │   └── auth.routes.js (WRITTEN + WORKING)
│       ├── agents\      ← EMPTY — Module 3
│       │   └── tools\   ← EMPTY — Module 3
│       ├── services\    ← EMPTY — Module 4
│       └── socket\      ← EMPTY — Module 5
└── client\              ← EMPTY — Module 7

```

---

## 🛠️ Tech Stack
- Frontend: React + TailwindCSS + Recharts + Socket.IO client + React Router v6
- Backend: Node.js v24 + Express + Socket.IO
- Database: MongoDB Atlas M0 Free (cluster: opsgenieai-cluster, region: Mumbai ap-south-1)
- AI Agents: LangGraph.js + LangChain + Groq API (free, openai/gpt-oss-20b model)
- Web Search Fallback: Tavily Search API (free, 1000 credits/month, no credit card needed)
- File Storage: Cloudinary (free tier)
- Automation: n8n (Module 8, not started)
- Deploy: Vercel (frontend) + Render (backend) — Module 9

---

## 📦 Backend Packages Installed (server/node_modules)
```
express           → Web server framework
mongoose          → MongoDB ODM (talks to Atlas)
dotenv            → Reads .env file into process.env
bcryptjs          → Password hashing
jsonwebtoken      → JWT creation and verification
cors              → Allows React frontend to call backend
multer            → File upload handler (for log files)
cloudinary        → Cloud file storage SDK
socket.io         → Real-time WebSocket server
uuid              → Generates unique IDs
@langchain/core      → LangChain base
@langchain/langgraph  → AI agent graph orchestration
@langchain/groq      → Groq LLM integration
@langchain/community  → Extra tools (Tavily web search)
zod                  → Enforces strict JSON schema on AI structured outputs
nodemon              → Dev tool: auto-restarts server on file save
```
All installed with --legacy-peer-deps
Note: zod installed separately → npm install zod --legacy-peer-deps

---

## 🗂️ Module Progress

### ✅ Module 0: Project Setup — COMPLETE
- server/ folder + all subfolders created
- package.json with "dev": "nodemon src/app.js" script
- .env filled with real credentials
- .gitignore (ignores node_modules, .env, *.log)
- node_modules excluded in IDE settings to fix lag

### ✅ Module 1: Authentication — COMPLETE
Files written:
- src/config/db.js → connectDB() function using mongoose.connect(process.env.MONGODB_URI)
- src/app.js → Express app, CORS, JSON parser, Socket.IO, auth routes registered at /api/auth
- src/models/User.model.js → Schema: name, email(unique), password(select:false), organization, role(enum: admin/engineer/viewer)
- src/controllers/auth.controller.js → register(), login(), getMe() — uses bcrypt + JWT
- src/middleware/auth.middleware.js → protect() reads Bearer token, verifies JWT, attaches req.user; authorize(...roles) checks role
- src/routes/auth.routes.js → POST /register, POST /login, GET /me(protected)

Tested in Postman — all passing:
- POST /api/auth/register → 201 ✅
- POST /api/auth/login → 200 ✅
- GET /api/auth/me (with token) → 200 ✅
- GET /api/auth/me (without token) → 401 ✅

MongoDB Atlas: users collection created, password stored as bcrypt hash ✅

### ✅ Module 2: Incident Model & CRUD Routes — COMPLETE
Files to create:
- src/models/Incident.model.js → full incident schema (status, severity, logs, root_cause, etc.)
- src/models/PostMortem.model.js → post-mortem document schema
- src/middleware/upload.middleware.js → Multer + Cloudinary config for log file uploads
- src/controllers/incident.controller.js → createIncident, getIncidents, getIncidentById, updateStatus, deleteIncident
- src/routes/incident.routes.js → all incident CRUD endpoints (all protected)
- Register incident routes in app.js as app.use('/api/incidents', incidentRoutes)

Key concepts to explain to student:
- What Multer does (file upload handler)
- What Cloudinary does (cloud file storage)
- How file upload flows: frontend → multer → cloudinary → URL stored in MongoDB
- MongoDB schema design decisions for this model
- HTTP status codes: 200, 201, 400, 401, 403, 404, 500

### ✅ Module 3: AI Agent Pipeline — COMPLETE
- src/agents/agentGraph.js → WRITTEN (real agents wired, pipeline compiled)
- src/agents/logAnalyzer.js → WRITTEN (pre-filter + structured output + 4 guard clauses)
- src/agents/rootCauseAnalyzer.js → WRITTEN (confidence score + causal chain prompt)
- src/agents/runbookMatcher.js → WRITTEN (4-tier fallback: Runbook → History → Tavily → LLM)
- src/agents/postMortemGenerator.js → WRITTEN (upsert to MongoDB, dual-audience prompt)
- src/agents/tools/index.js → WRITTEN (downloadLogFile helper)
Trigger route: POST /api/incidents/:id/analyse → fires the full pipeline
runAnalysis() added to incident.controller.js and incident.routes.js
Key model: openai/gpt-oss-20b (Groq). withStructuredOutput() DROPPED — all agents use
prompt-based JSON parsing via shared parseJsonResponse() helper. retryWithBackoff() added
to all agents (3 retries, 3s/6s/9s delays). Pipeline FULLY TESTED — severity: Critical,
confidence: 85, rootCause: memory leak cascade, postMortemId saved to MongoDB ✅

⚙️ RUNBOOK MATCHER — FOUR-TIER FALLBACK FLOW:
Agent 3 follows this priority order:
  TIER 1: Search company’s private MongoDB runbooks collection (lazy-require, activates in Module 4)
          → If match found: use runbook content as solution
  TIER 2: Search historical resolved PostMortems in MongoDB for similar rootCause keywords
          → If found: use that PostMortem’s resolution as solution
  TIER 3a: Tavily Web Search using rootCause + top 2 extracted errors
          → Searches StackOverflow, GitHub Issues, official docs (3 results)
          → If Tavily fails/exhausted: falls through to 3b
  TIER 3b: Direct LLM Knowledge (Groq Llama 3.3)
          → Uses model’s training knowledge to suggest mitigation steps
          → Always returns something. Never empty.
  isNovelIncident flag set to true when source is Web Search or AI Knowledge

⚠️ REQUIRED IN .env: TAVILY_API_KEY (done ✅)
⚠️ REQUIRED: @langchain/tavily installed (done ✅)

### ✅ Module 4: RAG Pipeline (Runbook Vector Search) — COMPLETE
- src/models/Runbook.model.js → WRITTEN (embedding: [Number] field, 384 dimensions)
- src/services/embedding.service.js → WRITTEN (HuggingFace all-MiniLM-L6-v2, 384-dim vectors)
- src/controllers/runbook.controller.js → WRITTEN (create, list, get, delete, semantic search)
- src/routes/runbook.routes.js → WRITTEN (POST /api/runbooks, GET, DELETE, POST /search)
- src/agents/runbookMatcher.js → UPDATED (Tier 1 now uses real $vectorSearch aggregation)
- MongoDB Atlas: runbook_vector_index created (vectorSearch, cosine similarity, 384 dims) ✅
- npm package: @huggingface/inference installed
- Tier 1 TESTED and WORKING: score 0.81 on first real runbook match ✅
Key: Similarity threshold set to 0.7 — below that, falls through to Tier 2

### ✅ Module 5: Real-time Socket.IO — COMPLETE
- src/socket/agentEvents.js → WRITTEN (Singleton pattern: setSocketContext, emitAgentEvent, clearSocketContext)
- All 4 agents emit 'started' + 'done' events via emitAgentEvent()
- incident.controller.js → sets socket context before pipeline, clears after
- Event name: 'agent_update' → frontend listens to this
- Event shape: { incidentId, agent, status, message, data, timestamp }
- FULLY TESTED: all 8 events (4 agents × 2) fire in correct order ✅
- Mongoose deprecation fixed: new:true → returnDocument:'after'

### ✅ Module 6: Analytics Routes — COMPLETE
- src/controllers/analytics.controller.js → WRITTEN (5 aggregation queries)
- src/routes/analytics.routes.js → WRITTEN (5 endpoints, all protected)
- Endpoints: GET /summary, /severity, /weekly, /mttr, /status
- All 5 TESTED and WORKING ✅
- Key techniques: $group, $match, $project, $sort, $isoWeek, $subtract, $avg, Promise.all
- MTTR returns 0 correctly when no resolved incidents exist

### ✅ Module 7: Frontend (React + TailwindCSS) — COMPLETE
- Setup: Vite + React in client/ folder, TailwindCSS v3 ✅
- Foundation: axios instance, AuthContext, SocketContext, ProtectedRoute, Sidebar, App Router ✅
- Pages Done: Login, Register, Dashboard, Incidents, NewIncident (live stepper), IncidentDetail (5 tabs), Runbooks ✅
- HCI Principles applied: Chunking (tabs), Visibility of System Status (stepper), Error Prevention (form validation).

### 🔄 Module 8: n8n Automation — PENDING (Visual setup required)
Workflows to build: Slack alert (CRITICAL incidents), Post-mortem email, Health checks every 5min, Weekly report
(Backend Webhook code is completed. Remaining: Visual node drag-and-drop in n8n dashboard).

### ⏳ Module 9: Deployment — NOT STARTED
Frontend → Vercel, Backend → Render, env vars on both platforms

### ⏳ Module 10: Automated Testing (QA) — NOT STARTED
- **Backend (Jest + Supertest):** Unit tests for Express routes, MongoDB, and Mocking the LangChain AI calls to test orchestration.
- **Frontend (Playwright):** End-to-end (E2E) UI testing using Playwright's `codegen` auto-recording.
- **AI Evaluation (Promptfoo):** LLM Evals to test prompt quality.

---

## 🐛 Real Bugs Faced (Student's Interview Challenge/Solution Stories)

### Bug 1: npm ERESOLVE dependency conflict
- When: Installing LangChain packages
- Error: "@langchain/community needs @langchain/core ^1.1.38 but found 0.3.x"
- Fix: npm install with --legacy-peer-deps flag; installed packages in two batches
- Interview answer: "LangChain has rapid version cycles creating peer dependency conflicts. I used --legacy-peer-deps to bypass npm's strict resolution and installed packages in separate batches to isolate conflicts."

### Bug 2: Mongoose pre-save hook "next is not a function"
- When: POST /api/auth/register returned 500
- Error: "next is not a function" in User model pre-save hook
- Root cause: Mongoose v7+ changed async middleware — no longer accepts 'next' parameter
- Fix: Removed 'next' parameter, changed 'return next()' to just 'return', removed final 'next()' call
- Interview answer: "I discovered a breaking change in Mongoose v7 where async pre-save hooks no longer accept a next callback — the async function's return value is the signal to continue. This taught me to always check library changelogs when upgrading major versions."

### Bug 3: JWT token copied with surrounding quotes
- When: GET /api/auth/me returned 401 even with token
- Error: "Invalid or expired token"
- Root cause: Copied token from JSON response including the surrounding quote characters
- Fix: Use raw token value without quotes in Authorization: Bearer <token>
- Interview answer: "During testing I learned that JWT values in JSON responses are surrounded by quote marks as JSON syntax, not as part of the token itself. The Authorization header must contain the raw token value."

### Bug 4: 'nodemon' is not recognized / Packages deleted
- When: Running `npm install multer-storage-cloudinary`
- Error: `'nodemon' is not recognized...`
- Root cause: In Module 1, packages were installed but not saved to `package.json` (no `dependencies` block). When `npm install` ran later, it saw the empty list and "pruned" (deleted) the extraneous packages from `node_modules`.
- Fix: Re-installed all packages from the tech stack using `npm install` and `npm install nodemon -D` to save them properly in `package.json`.
- Interview answer: "I encountered a silent failure where my `node_modules` were wiped out. I discovered that installing packages without them being tracked in `package.json` causes npm to prune them during subsequent installs. I fixed this by ensuring all dependencies are properly saved to `package.json`."

### Bug 5: Groq API "model not found" caused by trailing whitespace in .env
- When: POST /api/incidents/:id/analyse returned 500 error
- Error: "The model `llama-3.3-70b-versatile` does not exist or you do not have access to it"
- Root cause: A trailing space was accidentally added after the GROQ_API_KEY value in the .env file. The space became part of the key string, corrupting it. Groq returned a misleading "model not found" error instead of "invalid API key".
- Fix: Removed the trailing space from GROQ_API_KEY in .env and restarted the server.
- Interview answer: "A subtle bug where a trailing whitespace in my .env file corrupted my Groq API key. The error was misleading — it said 'model not found' rather than 'authentication failed'. I debugged it by confirming model access existed in the Groq playground, then narrowing the issue to the environment variable itself. It reinforced the importance of trimming credential strings and auditing .env files carefully."

### Bug 6: Both llama models deprecated by Groq without warning
- When: Switching models; both llama-3.3-70b-versatile AND llama3-70b-8192 failed
- Error: "model has been decommissioned and is no longer supported"
- Root cause: Groq deprecated both models mid-project
- Fix: Queried live GET /v1/models endpoint to get actual active model list → migrated to openai/gpt-oss-20b
- Interview answer: "Groq deprecated both Llama models I was using mid-project. Instead of guessing, I queried the /v1/models endpoint directly to see which models my API key could actually access. This taught me to never hardcode model names — always have a strategy to discover or fall back to available models."

### Bug 7: withStructuredOutput() silently broken after model switch
- When: POST /api/incidents/:id/analyse returned 400 json_validate_failed
- Error: "Failed to validate JSON. failed_generation: (empty string)"
- Root cause: withStructuredOutput() relies on Groq's JSON mode / tool calling. openai/gpt-oss-20b doesn't support this feature and returned an empty string.
- Fix: Removed withStructuredOutput() and zod schemas from all agents. Replaced with prompt-based JSON — model instructed to return raw JSON, parsed with JSON.parse() + markdown code-fence stripper + graceful fallback defaults.
- Interview answer: "I learned that LangChain's withStructuredOutput() is not model-agnostic — it relies on provider-specific features like tool calling. When I switched models, it silently broke. I replaced it with a prompt-engineering approach: explicitly instructing the model to return raw JSON and parsing it myself with error handling. This made the code portable across any LLM provider."

### Bug 8: Mongoose schema optional field rejected by Express controller
- When: Modifying User model so "organization" is optional for solo developers.
- Error: API still rejected registration with "Please provide organization".
- Root cause: Removed `required: true` from Mongoose schema, but forgot to remove the manual hardcoded `if (!organization)` check inside `auth.controller.js`.
- Fix: Removed the duplicate validation in the controller.
- Interview answer: "I discovered a bug where my API rejected valid requests because of duplicate validation logic. It taught me the importance of having a Single Source of Truth for validation (like the DB schema or Zod) instead of hardcoding redundant checks in the controllers."

---

## 🎤 Interview Q&A Progress

Q1 ✅ What problem does it solve?
→ See foundation_guide.md for full answer

Q2 ✅ Why this tech stack?
→ See foundation_guide.md for full answer

Q3 🔄 How does it work internally? (Building answer through modules)
Current answer covers: JWT auth flow, bcrypt password hashing, MongoDB schema design, middleware chain, LangGraph AI orchestration.

Q4 🔄 What challenges did you face? → See Bugs 1-8 above

Q5 🔄 How did you solve them? → See bug fixes above

Q6 ✅ What happens if a critical alert triggers but n8n is offline?
→ Answer: "Currently, I built synchronous Webhooks (using node-fetch) wrapped in a try/catch, so if n8n is offline, the webhook fails silently but the Node server stays alive. However, for a true enterprise production environment, I would decouple the webhook by using a Message Queue (like RabbitMQ or Redis BullMQ). The queue guarantees 'at-least-once delivery' by holding the message in memory and retrying with exponential backoff until n8n comes back online, ensuring no critical Slack alerts are ever dropped."
