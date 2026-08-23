// app.js - The main entry point of our backend server
// This is the first file that runs when you do "npm run dev"

// ─────────────────────────────────────────────
// STEP 1: Load environment variables from .env
// ─────────────────────────────────────────────
// dotenv reads your .env file and puts all the values into process.env
// IMPORTANT: This must be the VERY FIRST line, before anything else
// If you put it later, other files might try to read process.env before it's loaded
require('dotenv').config();

// ─────────────────────────────────────────────
// STEP 2: Import required libraries
// ─────────────────────────────────────────────
const express = require('express');  // The web framework that creates our server
const cors = require('cors');        // Allows our React frontend to talk to this backend
const http = require('http');        // Node.js built-in: creates a raw HTTP server
const { Server } = require('socket.io'); // Real-time communication library
const connectDB = require('./config/db'); // Our database connector (the file we just made)

// ─────────────────────────────────────────────
// STEP 3: Connect to MongoDB
// ─────────────────────────────────────────────
// Call our connectDB function - this dials MongoDB Atlas
// If this fails, the app stops (because we set process.exit(1) in db.js)
connectDB();

// ─────────────────────────────────────────────
// STEP 4: Create the Express app
// ─────────────────────────────────────────────
// express() creates the main application object
// Think of 'app' as the blank restaurant before adding menus, staff, etc.
const app = express();

// ─────────────────────────────────────────────
// STEP 5: Set up Middleware
// ─────────────────────────────────────────────
// Middleware = functions that run on EVERY request before it reaches the route
// Think of them as security checkpoints at the entrance

// 5a. CORS - Cross-Origin Resource Sharing
// By default, browsers block requests from one URL to another (security feature)
// Example: React runs on http://localhost:5173
//          Backend runs on http://localhost:5000
// Without CORS, React can't talk to the backend!
// This tells the backend: "Accept requests from our frontend URL"
app.use(cors({
  origin: process.env.CLIENT_URL, // Reads from .env → http://localhost:5173
  credentials: true               // Allow cookies and auth headers
}));

// 5b. JSON Parser
// When the frontend sends data (like a login form), it sends it as JSON text
// This middleware converts that JSON text into a JavaScript object automatically
// Without this, req.body would be undefined everywhere
app.use(express.json());

// 5c. URL Encoded Parser
// For form data submitted via HTML forms (not JSON)
// extended: true means it can handle nested objects
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────
// STEP 6: Create HTTP Server and Socket.IO
// ─────────────────────────────────────────────
// Normally express runs on HTTP. But Socket.IO needs to "wrap" the HTTP server
// to add real-time WebSocket support on top of it.
// So we create an http.Server wrapping our express app, then attach Socket.IO

const httpServer = http.createServer(app); // Wrap express app in HTTP server

// Attach Socket.IO to the HTTP server
// Socket.IO creates a persistent two-way connection (like a phone call)
// vs normal HTTP which is one request → one response (like sending a letter)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL, // Allow frontend to connect via WebSocket
    methods: ['GET', 'POST']
  }
});

// Make 'io' available globally so any route can emit real-time events
// Without this, only app.js could send real-time messages
app.set('io', io);

// Basic Socket.IO connection handler
// This runs every time a frontend client connects via WebSocket
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // This runs when a client disconnects (closes tab, loses internet, etc.)
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─────────────────────────────────────────────
// STEP 7: Register API Routes
// ─────────────────────────────────────────────
// Routes are the "doors" of your backend - each door handles different requests
// We'll add routes here as we build them. For now, just a test route.

// Import route files
// Each route file handles a specific feature area
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const runbookRoutes = require('./routes/runbook.routes');
const analyticsRoutes = require('./routes/analytics.routes'); // [NEW] Module 6

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/runbooks', runbookRoutes);
app.use('/api/analytics', analyticsRoutes); // [NEW] Module 6

// Test route - visit http://localhost:5000/api/health to verify server is running
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OpsIncidentAI server is running! 🚀',
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────
// STEP 8: Start the Server
// ─────────────────────────────────────────────
// process.env.PORT reads from .env → 5000
// If PORT isn't set (just in case), use 5000 as fallback (the || 5000 part)
const PORT = process.env.PORT || 5000;

// httpServer.listen() starts the server
// It "opens the restaurant doors" and starts accepting requests on port 5000
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.IO ready for real-time connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
