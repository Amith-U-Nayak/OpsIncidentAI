// auth.routes.js - Defines the API endpoints for authentication
//
// A route connects:
//   HTTP Method + URL Path → Controller Function
//
// These are the auth endpoints we're creating:
//
//   POST /api/auth/register → register controller (create new account)
//   POST /api/auth/login    → login controller (sign in)
//   GET  /api/auth/me       → getMe controller (who am I? - requires login)
//
// The /api/auth prefix is added in app.js when we register this router

const express = require('express');
const router = express.Router(); // Router is a mini Express app for grouping routes

// Import controller functions
const { register, login, getMe } = require('../controllers/auth.controller');

// Import middleware
const { protect } = require('../middleware/auth.middleware');

// ── PUBLIC ROUTES (no login required) ────────────────────────────
// POST /api/auth/register
// When frontend sends: { name, email, password, organization }
// register controller creates the account
router.post('/register', register);

// POST /api/auth/login
// When frontend sends: { email, password }
// login controller verifies credentials and returns a token
router.post('/login', login);

// ── PROTECTED ROUTES (login required) ────────────────────────────
// GET /api/auth/me
// 'protect' middleware runs FIRST - checks if token is valid
// If token is valid → getMe controller runs and returns user info
// If token is invalid → protect middleware sends 401 and stops here
router.get('/me', protect, getMe);

module.exports = router;
