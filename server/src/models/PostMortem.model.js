const mongoose = require('mongoose');

// ==========================================
// POST-MORTEM SCHEMA
// Analogy: When a patient is discharged from a hospital, the doctors write a final report.
// A Post-Mortem is our "final report" for a resolved IT incident.
// It explains what went wrong, how we fixed it, and how to prevent it next time.
// ==========================================

const postMortemSchema = new mongoose.Schema(
  {
    // Which incident is this post-mortem for?
    incident: {
      type: mongoose.Schema.ObjectId, // A MongoDB ID
      ref: 'Incident',                // Pointing to our Incident model
      required: true,
      unique: true                    // One incident can only have ONE post-mortem
    },
    // The main summary of the issue
    summary: {
      type: String,
      required: [true, 'Please provide a post-mortem summary']
    },
    // Why did it actually break?
    rootCause: {
      type: String,
      required: true
    },
    // What steps were taken to fix it?
    resolution: {
      type: String,
      required: true
    },
    // What will we do differently next time?
    actionItems: {
      type: [String], // Array of tasks/learnings
      default: []
    },
    // Who generated this post-mortem? (Could be 'AI' or a User ID)
    generatedBy: {
      type: String, 
      default: 'System/AI'
    }
  },
  {
    // Automatically adds 'createdAt' and 'updatedAt'
    timestamps: true
  }
);

module.exports = mongoose.model('PostMortem', postMortemSchema);
