const Incident = require('../models/Incident.model');
const PostMortem = require('../models/PostMortem.model');
const { app: agentGraph } = require('../agents/agentGraph');
const { setSocketContext, clearSocketContext } = require('../socket/agentEvents');
const { sendWebhook } = require('../services/webhook.service');

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

    // Trigger n8n Slack Webhook if Critical
    if (newIncident.severity === 'Critical') {
      sendWebhook(process.env.N8N_CRITICAL_WEBHOOK_URL, {
        event: 'incident_created',
        incidentId: newIncident._id,
        title: newIncident.title,
        severity: newIncident.severity,
        url: `${process.env.CLIENT_URL}/incidents/${newIncident._id}`
      });
    }

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

    // Trigger n8n Post-Mortem Email Webhook if Resolved
    if (status === 'Resolved') {
      const pm = await PostMortem.findOne({ incident: incident._id });
      
      sendWebhook(process.env.N8N_RESOLVED_WEBHOOK_URL, {
        event: 'incident_resolved',
        incidentId: incident._id,
        title: incident.title,
        postMortem: pm ? {
          summary: pm.summary,
          rootCause: pm.rootCause,
          resolution: pm.resolution,
          actionItems: pm.actionItems
        } : null
      });
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
// ==========================================
exports.runAnalysis = async (req, res) => {
  try {
    // Step 1: Find the incident in the DB
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    // Step 2: Build the initial State object to pass into the LangGraph pipeline
    const initialState = {
      incidentId: incident._id.toString(),
      logs: incident.logs,
      extractedErrors: [],
      severity: incident.severity,
      rootCause: null,
      confidence: 0,
      runbookSolution: null,
      postMortemId: null,
    };

    console.log(`🚀 Starting AI pipeline for incident: ${incident._id}`);

    // Step 3: Set the Socket.IO context so all agents can emit real-time events
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

// ==========================================
// GET POST-MORTEM FOR INCIDENT
// ==========================================
exports.getPostMortem = async (req, res) => {
  try {
    const postMortem = await PostMortem.findOne({ incident: req.params.id });
    
    if (!postMortem) {
      return res.status(404).json({ success: false, error: 'Post-mortem not found for this incident' });
    }

    res.status(200).json({ success: true, data: postMortem });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// [NEW] INGEST EXTERNAL ALERT (Datadog/AWS)
// ==========================================
exports.ingestExternalAlert = async (req, res) => {
  try {
    const { title, description, severity, source, rawLogText } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    // 1. Format the description to include the raw log text if provided
    const fullDescription = rawLogText 
      ? `${description}\n\n[EXTERNAL LOGS FROM ${source || 'SYSTEM'}]\n${rawLogText}`
      : description;

    // 2. Create the incident in MongoDB
    const incident = await Incident.create({
      title: `[${source || 'ALERT'}] ${title}`,
      description: fullDescription,
      severity: severity || 'High',
      status: 'Open',
      logs: [] // No file attached, logs are embedded in description
    });

    // Trigger Slack webhook for critical external ingestions
    if (incident.severity === 'Critical') {
      sendWebhook(process.env.N8N_CRITICAL_WEBHOOK_URL, {
        event: 'incident_ingested',
        incidentId: incident._id,
        title: incident.title,
        severity: incident.severity,
        source: source || 'External',
        url: `${process.env.CLIENT_URL}/incidents/${incident._id}`
      });
    }

    // 3. (Optional but awesome) Trigger the AI pipeline immediately in the background
    exports.runAnalysis({ params: { id: incident._id }, app: req.app }, { 
      status: () => ({ json: () => {} }) // Dummy response object for background execution
    }).catch(err => console.error("Background AI failed:", err));

    // 4. Respond to the external system instantly
    res.status(201).json({
      success: true,
      message: 'Alert ingested successfully and AI pipeline triggered',
      data: incident
    });

  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ success: false, error: 'Failed to ingest alert' });
  }
};
