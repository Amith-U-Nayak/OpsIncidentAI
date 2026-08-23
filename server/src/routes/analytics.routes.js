const express = require('express');
const router = express.Router();

const {
  getSummary,
  getSeverityDistribution,
  getWeeklyTrend,
  getMTTR,
  getStatusBreakdown,
} = require('../controllers/analytics.controller');

const { protect } = require('../middleware/auth.middleware');

// All analytics routes require login
router.use(protect);

// KPI summary cards
router.get('/summary', getSummary);

// Severity distribution for pie chart
router.get('/severity', getSeverityDistribution);

// Weekly incident trend for line chart
router.get('/weekly', getWeeklyTrend);

// Mean Time To Resolve
router.get('/mttr', getMTTR);

// Status breakdown
router.get('/status', getStatusBreakdown);

module.exports = router;
