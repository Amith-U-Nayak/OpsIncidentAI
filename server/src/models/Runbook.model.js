const mongoose = require('mongoose');

// ==========================================
// RUNBOOK MODEL
// ==========================================
// A Runbook is like a "recipe card" for fixing a specific type of incident.
// Example: "How to fix MongoDB connection pool exhaustion"
//
// The KEY field here is 'embedding' — it stores the runbook's text
// converted into 384 numbers that represent its MEANING.
// When Agent 3 searches, it converts the incident's root cause into numbers too,
// then finds the runbook whose numbers are most SIMILAR.
// This is called Vector Search (semantic search).
// ==========================================

const RunbookSchema = new mongoose.Schema(
  {
    // The title of this runbook (e.g., "Fix: Database Connection Pool Exhaustion")
    title: {
      type: String,
      required: [true, 'Runbook title is required'],
      trim: true,
    },

    // The full text content of the runbook
    // This is what gets searched and shown as the solution
    content: {
      type: String,
      required: [true, 'Runbook content is required'],
    },

    // THE MAGIC FIELD: The vector embedding
    // This is the runbook's content converted into 384 numbers
    // MongoDB Atlas Vector Search uses these numbers to find similar runbooks
    // Analogy: Like GPS coordinates, but for meaning instead of location
    embedding: {
      type: [Number], // An array of 384 floating-point numbers
      required: true,
    },

    // Tags for quick filtering (e.g., ["mongodb", "database", "connection"])
    tags: {
      type: [String],
      default: [],
    },

    // Who created this runbook
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('Runbook', RunbookSchema);
