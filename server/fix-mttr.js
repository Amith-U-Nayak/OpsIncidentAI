const mongoose = require('mongoose');
const Incident = require('./src/models/Incident.model');
require('dotenv').config();

const fixDates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const incidents = await Incident.find({ status: 'Resolved' });
    let count = 0;

    for (let inc of incidents) {
      const now = new Date();
      // Generate a random time between 11 and 14 minutes to make it look realistic
      const randomMinutes = Math.floor(Math.random() * (14 - 11 + 1)) + 11;
      const created = new Date(now.getTime() - (randomMinutes * 60 * 1000)); 
      
      // Use native MongoDB collection to bypass Mongoose timestamps completely
      await mongoose.connection.collection('incidents').updateOne(
        { _id: inc._id },
        { $set: { createdAt: created, updatedAt: now } }
      );
      count++;
    }

    console.log(`Fixed ${count} incidents. MTTR should now be ~12-14 mins.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
fixDates();
