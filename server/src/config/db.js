// db.js - Connects our backend to MongoDB Atlas
//
// We use the 'mongoose' library to connect.
// Mongoose is like a translator between Node.js and MongoDB.
// Without it, we'd have to write raw MongoDB commands.

const mongoose = require('mongoose');

// This function connects to the database
// We mark it 'async' because connecting takes time (it's a network call)
// 'async' means: "this function does something that takes time, wait for it"
const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    console.log('🧪 Test mode detected - skipping real MongoDB connection.');
    return;
  }

  try {
    // mongoose.connect() makes the actual connection
    // process.env.MONGODB_URI reads the connection string from your .env file
    // process.env is Node.js's way of reading environment variables
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    // If connection works, print the host name so we know it connected
    // conn.connection.host will show something like "opsgenieai-cluster.xxx.mongodb.net"
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    // If connection fails (wrong password, wrong URI, no internet), catch the error
    // and print it so we know what went wrong
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // process.exit(1) means: "stop the entire server immediately"
    // Code 1 = stopped due to an error (Code 0 = stopped normally)
    // We do this because if the DB isn't connected, the app is useless
    process.exit(1);
  }
};

// 'module.exports' makes this function available to other files
// Think of it like: "I'm making connectDB available for anyone who imports this file"
module.exports = connectDB;
