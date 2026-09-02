// auth.controller.js - Handles Register and Login logic
//
// A controller is a function that:
// 1. Receives data from the frontend (via req - "request")
// 2. Does the business logic (validate, save, check password, etc.)
// 3. Sends a response back (via res - "response")
//
// Every controller function gets two arguments automatically:
// req = the incoming request (contains: body, headers, params, cookies)
// res = the outgoing response (you use this to send data back)

const User = require('../models/User.model'); // Import the User blueprint
const jwt = require('jsonwebtoken');           // For creating login tokens

// ─────────────────────────────────────────────
// HELPER FUNCTION: Generate JWT Token
// ─────────────────────────────────────────────
// JWT = JSON Web Token
// Think of it like a stamped wristband at an event:
// - You get it once when you login
// - You show it on every future request to prove you're allowed in
// - It expires after 7 days (you have to login again)
// - It's digitally signed - nobody can fake it without knowing JWT_SECRET
//
// The token contains: { id: "user's MongoDB _id" }
// It does NOT contain password or sensitive info (token is visible to frontend)
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },              // PAYLOAD: data stored inside the token
    process.env.JWT_SECRET,      // SECRET KEY: used to sign the token (from .env)
    { expiresIn: process.env.JWT_EXPIRE } // EXPIRY: token becomes invalid after 7 days
  );
};

// ─────────────────────────────────────────────
// CONTROLLER 1: REGISTER
// Route: POST /api/auth/register
// ─────────────────────────────────────────────
// What happens when a new user signs up
const register = async (req, res) => {
  try {
    // req.body contains the data sent from the frontend
    // When frontend sends: { name: "Amith", email: "amith@gmail.com", password: "123456", organization: "VIT" }
    // We extract those values here using destructuring
    const { name, email, password, organization, role } = req.body;

    // 🛡️ SECURITY PATCH: Prevent Privilege Escalation (Mass Assignment)
    // Never trust the client payload for critical fields like roles.
    let assignedRole = 'engineer'; // Default to lowest operational role
    
    // If they explicitly asked to be a viewer, allow it. Otherwise, force engineer.
    // If they ask for 'admin', it will safely fall back to 'engineer'.
    if (role === 'viewer') {
      assignedRole = 'viewer';
    }

    // ── STEP 1: Validate required fields ──────────────────────
    // Check if any required field is missing
    // If frontend forgot to send email, for example, stop here and tell them
    if (!name || !email || !password) {
      return res.status(400).json({
        // status(400) = "Bad Request" - the client sent wrong/incomplete data
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // ── STEP 2: Check if email already exists ──────────────────
    // Find a user in the DB with this email
    // User.findOne() returns the first matching document, or null if not found
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // 409 = "Conflict" - the resource already exists
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // ── STEP 3: Create the user ────────────────────────────────
    // User.create() does two things:
    // 1. Creates a new user document from our schema
    // 2. Saves it to MongoDB
    // The password gets automatically encrypted by our pre('save') hook in the model!
    const user = await User.create({
      name,
      email,
      password,    // Plain text here - gets encrypted before saving
      organization,
      role: assignedRole  // 🛡️ Safe assigned role
    });

    // ── STEP 4: Generate JWT token ─────────────────────────────
    // user._id is the unique ID MongoDB auto-generates for each document
    // It looks like: "64f8a1b2c3d4e5f6a7b8c9d0"
    const token = generateToken(user._id);

    // ── STEP 5: Send success response ─────────────────────────
    // 201 = "Created" - a new resource was successfully created
    // We send back: the token (for future requests) + user info (for the frontend to display)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,  // Frontend stores this and sends it with every future request
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role
        // Note: we do NOT send user.password - never send passwords to frontend!
      }
    });

  } catch (error) {
    // If anything unexpected happens (DB down, mongoose error, etc.)
    // 500 = "Internal Server Error" - something broke on our side
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
      // In development, show the actual error so we can debug
      // In production, hide it (security - don't expose internals to users)
    });
  }
};

// ─────────────────────────────────────────────
// CONTROLLER 2: LOGIN
// Route: POST /api/auth/login
// ─────────────────────────────────────────────
// What happens when an existing user signs in
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── STEP 1: Validate inputs ────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // ── STEP 2: Find the user ──────────────────────────────────
    // Remember we set select: false on password in the model?
    // That means password is NEVER returned by default
    // .select('+password') explicitly asks for it - we need it to compare
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // 401 = "Unauthorized" - not allowed in
      // We say "Invalid credentials" not "Email not found" intentionally
      // Saying "Email not found" helps hackers know which emails exist in your DB
      // Vague message = better security
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // ── STEP 3: Check if password matches ─────────────────────
    // Use our comparePassword method from the User model
    // It bcrypt-hashes what the user typed and compares with stored hash
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials' // Same vague message for security
      });
    }

    // ── STEP 4: Generate token and send response ───────────────
    const token = generateToken(user._id);

    // 200 = "OK" - standard success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ─────────────────────────────────────────────
// CONTROLLER 3: GET CURRENT USER (GET ME)
// Route: GET /api/auth/me
// ─────────────────────────────────────────────
// When a logged-in user refreshes the page, the frontend sends the stored
// token and asks: "who am I?" - this returns the current user's info
// This route will be PROTECTED (requires a valid token)
const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware (we'll build that next)
    // The middleware reads the token, finds the user, and attaches them to req
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Export all 3 controllers so routes can use them
module.exports = { register, login, getMe };
