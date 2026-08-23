// ==========================================
// AGENT EVENTS — Socket.IO Real-time Emitter
// ==========================================
// This file is the "announcer" of our AI pipeline.
// Analogy: Like a sports commentator who narrates every play live.
// As each agent starts and finishes, this file broadcasts the update
// to the frontend so the user sees progress in real-time.
//
// HOW IT WORKS:
// 1. When the pipeline starts, the controller calls setSocketContext(io, incidentId)
// 2. This stores the io instance and incidentId in module-level variables
// 3. Each agent calls emitAgentEvent() at the start and end of its work
// 4. emitAgentEvent() uses io to broadcast to all connected frontend clients
//
// WHY MODULE-LEVEL VARIABLES?
// The agents run inside a LangGraph pipeline. Passing io through the graph state
// would add complexity. Instead, we use a shared module-level "context" that
// any agent can access without needing it passed explicitly.
// This is called the Singleton pattern.
// ==========================================

// These variables hold the active Socket.IO instance and incident being processed
let _io = null;
let _incidentId = null;

// ==========================================
// SET SOCKET CONTEXT
// Called ONCE by the controller before the pipeline starts
// ==========================================
const setSocketContext = (io, incidentId) => {
  _io = io;
  _incidentId = incidentId;
  console.log(`📡 [Socket] Context set for incident: ${incidentId}`);
};

// ==========================================
// EMIT AGENT EVENT
// Called by each agent to broadcast its status to all connected clients
//
// Event structure sent to frontend:
// {
//   incidentId: "abc123",
//   agent: "logAnalyzer",
//   status: "started" | "done" | "error",
//   message: "Extracting error signals from logs...",
//   data: { severity: "Critical", errorCount: 8 }  // optional
// }
// ==========================================
const emitAgentEvent = (agent, status, message, data = {}) => {
  if (!_io || !_incidentId) {
    // Socket context not set — skip silently (won't crash the pipeline)
    return;
  }

  const event = {
    incidentId: _incidentId,
    agent,
    status,    // "started", "done", or "error"
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // 'agent_update' is the event name the frontend will listen to
  // io.emit() broadcasts to ALL connected clients (we'll scope this per-room in Module 7)
  _io.emit('agent_update', event);
  console.log(`📡 [Socket] Emitted: ${agent} → ${status} — ${message}`);
};

// ==========================================
// CLEAR SOCKET CONTEXT
// Called after the pipeline finishes to reset state
// ==========================================
const clearSocketContext = () => {
  _io = null;
  _incidentId = null;
};

module.exports = { setSocketContext, emitAgentEvent, clearSocketContext };
