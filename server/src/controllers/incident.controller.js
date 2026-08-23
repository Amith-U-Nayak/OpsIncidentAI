const Incident = require('../models/Incident.model');
const PostMortem = require('../models/PostMortem.model');
const { app: agentGraph } = require('../agents/agentGraph');
const { setSocketContext, clearSocketContext } = require('../socket/agentEvents');

// ==========================================
// CREATE INCIDENT
// ==========================================
exports.createIncident = async (req, res) => {
  try {
    const { title, description, severity } = req.body;
    
    // Check if the user uploaded files. Multer attaches them to req.files
    // We map through the files to get their Cloudinary URLs (file.path)
    const logs = req.files ? req.files.map(file => file.path) : [];

    // Create the incident in the database
    // req.user.id comes from our auth middleware (the person who is logged in)
    const newIncident = await Incident.create({
      title,
      description,
      severity,
      logs,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: newIncident
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// GET ALL INCIDENTS
// ==========================================
exports.getIncidents = async (req, res) => {
  try {
    // Populate lets us fetch the user details (name, email) instead of just the ID
    const incidents = await Incident.find().populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// GET SINGLE INCIDENT
// ==========================================
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// UPDATE INCIDENT STATUS
// ==========================================
exports.updateStatus = async (req, res) => {
  try {
    const { status, severity, aiRootCause } = req.body;

    // new: true tells Mongoose to return the updated document, not the old one
    // runValidators: true ensures the new status matches our enum ['Open', 'Resolved' etc]
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status, severity, aiRootCause },
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.status(200).json({
      success: true,
      data: incident
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// DELETE INCIDENT
// ==========================================
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// RUN AI ANALYSIS ON AN INCIDENT
// This is the trigger that fires the full LangGraph pipeline
// Analogy: pressing the big red "ANALYSE" button in the UI
// ==========================================
exports.runAnalysis = async (req, res) => {
  try {
    // Step 1: Find the incident in the DB
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    // Step 2: Build the initial State object to pass into the LangGraph pipeline
    // This is like placing the first piece on the assembly line conveyor belt
    const initialState = {
      incidentId: incident._id.toString(),
      logs: incident.logs,         // Array of Cloudinary URLs from the incident
      extractedErrors: [],
      severity: incident.severity, // Starting severity (AI may upgrade it)
      rootCause: null,
      confidence: 0,
      runbookSolution: null,
      postMortemId: null,
    };

    console.log(`🚀 Starting AI pipeline for incident: ${incident._id}`);

    // Step 3: Set the Socket.IO context so all agents can emit real-time events
    // req.app.get('io') retrieves the io instance we stored in app.js with app.set('io', io)
    const io = req.app.get('io');
    setSocketContext(io, incident._id.toString());

    // Step 4: Fire the LangGraph pipeline!
    const finalState = await agentGraph.invoke(initialState);

    // Step 5: Clear the socket context after pipeline finishes
    clearSocketContext();

    console.log('✅ AI Pipeline complete! Final state:', finalState);

    // Step 4: Send the result back to whoever called this API
    res.status(200).json({
      success: true,
      message: 'AI analysis complete',
      data: {
        incidentId: finalState.incidentId,
        severity: finalState.severity,
        rootCause: finalState.rootCause,
        confidence: finalState.confidence,
        postMortemId: finalState.postMortemId,
      }
    });
  } catch (error) {
    console.error('❌ AI Pipeline failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
