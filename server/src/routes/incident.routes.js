const express = require('express');
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateStatus,
  deleteIncident,
  runAnalysis   // [NEW] trigger the AI pipeline
} = require('../controllers/incident.controller');

// Import our middlewares
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

// Apply protect middleware to ALL incident routes below this line
// This means you MUST be logged in (have a valid JWT token) to do anything with incidents
router.use(protect);

// ---------------------------------------------------------
// Route:       /api/incidents
// Methods:     POST (Create) and GET (Read All)
// Middleware:  upload.array('logs', 5) allows up to 5 files named 'logs'
// ---------------------------------------------------------
router
  .route('/')
  .post(upload.array('logs', 5), createIncident)
  .get(getIncidents);

// ---------------------------------------------------------
// Route:       /api/incidents/:id
// Methods:     GET (Read One), DELETE (Remove)
// ---------------------------------------------------------
router
  .route('/:id')
  .get(getIncidentById)
  .delete(deleteIncident);

// ---------------------------------------------------------
// Route:       /api/incidents/:id/status
// Methods:     PATCH (Update partially)
// ---------------------------------------------------------
router
  .route('/:id/status')
  .patch(updateStatus);

// ---------------------------------------------------------
// Route:       /api/incidents/:id/analyse
// Methods:     POST (Trigger the AI pipeline)
// This fires the full 4-agent LangGraph pipeline on the incident
// ---------------------------------------------------------
router
  .route('/:id/analyse')
  .post(runAnalysis);

module.exports = router;
