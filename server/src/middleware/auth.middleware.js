// auth.middleware.js - The Security Guard
//
// This middleware runs BEFORE any protected route's controller
// Its job: verify the JWT token, find the user, and attach them to the request
//
// HOW JWT WORKS (the full flow):
//
// 1. User logs in → server sends back a token: "eyJhbGciOiJIUzI1..."
// 2. Frontend stores the token (in localStorage or memory)
// 3. For every future request, frontend sends it in the "Authorization" header:
//    Authorization: Bearer eyJhbGciOiJIUzI1...
// 4. THIS MIDDLEWARE reads that header, verifies the token, finds the user
// 5. If valid → attaches user to req.user → passes to controller
// 6. If invalid/expired → sends 401 Unauthorized → request STOPS here

const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  // ── STEP 1: Get the token from the request header ──────────
  let token;

  // Check if the Authorization header exists and starts with "Bearer"
  // The header looks like: "Authorization: Bearer eyJhbGciOiJIUzI1..."
  // We split by space and take the second part (the actual token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    // "Bearer eyJhbGciOiJ..." → split by space → ["Bearer", "eyJhbGciOiJ..."] → [1]
  }

  // If no token found in header, block the request
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please login.'
    });
  }

  // ── STEP 2: Verify the token ───────────────────────────────
  // jwt.verify() does 3 things:
  // 1. Checks if the token was signed with our JWT_SECRET (not fake)
  // 2. Checks if the token hasn't expired (7 days)
  // 3. Extracts the payload (the { id: userId } we put inside when creating it)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded will be: { id: "64f8a1b2c3d4e5f6a7b8c9d0", iat: 1234567890, exp: 1235172690 }
    // iat = "issued at" timestamp
    // exp = "expires at" timestamp
  } catch (error) {
    // jwt.verify() throws errors for:
    // - "JsonWebTokenError": token is fake/tampered
    // - "TokenExpiredError": token is older than 7 days
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.'
    });
  }

  // ── STEP 3: Find the user in the database ─────────────────
  // The token contains the user's ID. Use it to fetch the full user.
  // WHY fetch from DB instead of just using the token data?
  // Because the user might have been deleted after the token was issued.
  // Fetching from DB ensures the user still exists.
  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User no longer exists.'
    });
  }

  // ── STEP 4: Attach user to request and continue ────────────
  // req.user = the logged-in user's data
  // Now every controller that comes after this middleware can access req.user
  // Example in auth.controller.js → getMe: "const user = await User.findById(req.user.id)"
  req.user = user;

  // next() = "I'm done, pass the request to the next function (the controller)"
  // Without calling next(), the request would just hang forever
  next();
};

// ─────────────────────────────────────────────
// ROLE-BASED AUTHORIZATION MIDDLEWARE
// ─────────────────────────────────────────────
// Sometimes "logged in" isn't enough. Some routes are admin-only.
// This middleware factory checks the user's role.
//
// Usage: router.delete('/incidents/:id', protect, authorize('admin'), controller)
// → only admins can delete incidents
//
// 'authorize' returns a middleware function (that's why it has double arrow functions)
const authorize = (...roles) => {
  // roles is an array of allowed roles, e.g. ['admin'] or ['admin', 'engineer']
  return (req, res, next) => {
    // req.user is set by 'protect' middleware above
    // Check if the logged-in user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        // 403 = "Forbidden" - you're logged in but not allowed to do this
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }
    next(); // Role is allowed, continue
  };
};

module.exports = { protect, authorize };
