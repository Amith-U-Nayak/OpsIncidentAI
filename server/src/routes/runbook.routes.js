const express = require('express');
const router = express.Router();

const {
  createRunbook,
  getRunbooks,
  getRunbookById,
  deleteRunbook,
  searchRunbooks,
} = require('../controllers/runbook.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// All runbook routes require login
router.use(protect);

// ---------------------------------------------------------
// Route:   /api/runbooks
// GET      → list all runbooks
// POST     → create a new runbook (admin/engineer only)
// ---------------------------------------------------------
router
  .route('/')
  .get(getRunbooks)
  .post(authorize('admin', 'engineer'), createRunbook);

// ---------------------------------------------------------
// Route:   /api/runbooks/search
// POST     → semantic vector search (for testing)
// ---------------------------------------------------------
router
  .route('/search')
  .post(searchRunbooks);

// ---------------------------------------------------------
// Route:   /api/runbooks/:id
// GET      → get single runbook
// DELETE   → delete runbook (admin only)
// ---------------------------------------------------------
router
  .route('/:id')
  .get(getRunbookById)
  .delete(authorize('admin'), deleteRunbook);

module.exports = router;
