// User.model.js - Defines what a "User" looks like in MongoDB
//
// In MongoDB, data is stored as documents (like JSON objects)
// A "model" is the blueprint that every user document must follow
// Mongoose enforces these rules - if you try to save a user without an email,
// it will throw an error before even touching the database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For encrypting passwords

// ─────────────────────────────────────────────
// THE SCHEMA - Blueprint for a User document
// ─────────────────────────────────────────────
// A Schema defines: field names, data types, and validation rules
const userSchema = new mongoose.Schema(
  {
    // NAME FIELD
    name: {
      type: String,      // Must be text
      required: [true, 'Name is required'],  // Can't be empty
      trim: true,        // Removes extra spaces: "  Amith  " → "Amith"
      maxlength: [50, 'Name cannot exceed 50 characters']
    },

    // EMAIL FIELD
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,      // No two users can have the same email
      lowercase: true,   // Always stored as lowercase: "AMITH@Gmail.com" → "amith@gmail.com"
      trim: true,
      // Regex validation - checks if the email format is valid
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },

    // PASSWORD FIELD
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false  // IMPORTANT: When you fetch a user from DB, password is NEVER included
                     // You have to explicitly ask for it with .select('+password')
                     // This prevents accidentally sending passwords to the frontend
    },

    // ORGANIZATION FIELD
    // One organization = one team (e.g., "Zepto Engineering Team")
    organization: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true
    },

    // ROLE FIELD
    // Different users have different powers:
    // admin → can do everything
    // engineer → can create and manage incidents
    // viewer → can only view incidents (read-only)
    role: {
      type: String,
      enum: ['admin', 'engineer', 'viewer'], // Only these 3 values are allowed
      default: 'engineer'                    // If not specified, default is 'engineer'
    }
  },
  {
    // timestamps: true automatically adds TWO fields to every document:
    // createdAt → when the user registered
    // updatedAt → when the user last updated their profile
    timestamps: true
  }
);

// ─────────────────────────────────────────────
// MIDDLEWARE (Pre-save hook)
// ─────────────────────────────────────────────
// This runs AUTOMATICALLY before every .save() call
// "pre" = before, "save" = saving to database
// Its job: encrypt the password before storing it
//
// WHY ENCRYPT?
// If your database is hacked, attackers shouldn't be able to read passwords
// bcrypt turns "mypassword123" into "$2a$10$xK9Lk..." (impossible to reverse)
// In Mongoose 7+, async pre-save hooks do NOT use the 'next' parameter
// You simply write an async function and return - Mongoose handles the rest
// This is the modern, correct way to write pre-save hooks
userSchema.pre('save', async function () {
  // 'this' refers to the user document being saved

  // Only encrypt if password was actually changed
  // If user updates their name (not password), don't re-encrypt
  if (!this.isModified('password')) {
    return; // Skip encryption - just return, no next() needed
  }

  // bcrypt.genSalt(10) creates a "salt" - random data added to password before hashing
  // The 10 is the "cost factor" - higher = more secure but slower
  // 10 is the industry standard sweet spot
  const salt = await bcrypt.genSalt(10);

  // bcrypt.hash() combines the password + salt and creates the encrypted version
  this.password = await bcrypt.hash(this.password, salt);
  // No next() needed - the async function returning IS the signal to continue
});

// ─────────────────────────────────────────────
// INSTANCE METHOD: comparePassword
// ─────────────────────────────────────────────
// An "instance method" is a function available on every user object
// This method lets us check if a given password matches the stored encrypted one
//
// Usage: const isMatch = await user.comparePassword("enteredPassword")
userSchema.methods.comparePassword = async function (enteredPassword) {
  // bcrypt.compare() takes the plain text password and compares it with the hash
  // It handles all the salt/hash math internally
  // Returns: true if they match, false if they don't
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─────────────────────────────────────────────
// CREATE AND EXPORT THE MODEL
// ─────────────────────────────────────────────
// mongoose.model('User', userSchema) creates a Model class from our schema
// First argument 'User' → MongoDB will create a collection called 'users' (auto-pluralized)
// Think of the Model as a class, and each user document as an instance of that class
const User = mongoose.model('User', userSchema);

module.exports = User;
