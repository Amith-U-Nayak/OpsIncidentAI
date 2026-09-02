const mongoose = require('mongoose');

// ==========================================
// INCIDENT SCHEMA
// Think of a Schema like a blueprint for a house.
// It tells MongoDB exactly what rooms (fields) the house must have,
// what type of materials (String, Number, Array) they use,
// and which rooms are mandatory (required: true).
// ==========================================

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an incident title'], // If someone forgets the title, throw this error
      trim: true, // Removes accidental spaces at start or end ("  server down  " -> "server down")
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide an incident description'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Investigating', 'Resolved', 'Closed'], // Only these exact words are allowed
      default: 'Open' // By default, a new incident is 'Open'
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    // Multi-tenant organization scoping
    organization: {
      type: String,
      default: null
    },
    // The person who reported it
    createdBy: {
      type: mongoose.Schema.ObjectId, // This is a special MongoDB ID type
      ref: 'User', // It points to the 'User' model. Like a foreign key in SQL.
      required: true
    },
    // The engineer assigned to fix it
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null // Might not be assigned immediately
    },
    // Array of log file URLs (e.g., from Cloudinary)
    logs: {
      type: [String], // Array of strings (URLs)
      default: []
    },
    // The AI's proposed root cause (populated in Module 3)
    aiRootCause: {
      type: String,
      default: null
    }
  },
  {
    // Automatically adds 'createdAt' and 'updatedAt' timestamps to every incident
    timestamps: true 
  }
);

// We turn the blueprint (Schema) into a usable tool (Model)
// The Model gives us the power to use methods like Incident.find(), Incident.create(), etc.
module.exports = mongoose.model('Incident', incidentSchema);
