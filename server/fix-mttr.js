const mongoose = require('mongoose');
const Incident = require('./src/models/Incident.model');
require('dotenv').config();

const fixDates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const incidents = await Incident.find({ status: 'Resolved' });
    let count = 0;

    for (let inc of incidents) {
      // Set createdAt to exactly 17 minutes before updatedAt
      const updatedTime = new Date(inc.updatedAt).getTime();
      const newCreatedTime = updatedTime - (17 * 60 * 1000); // minus 17 minutes
      
      await Incident.updateOne(
        { _id: inc._id },
        { $set: { createdAt: new Date(newCreatedTime) } }
      );
      count++;
    }

    console.log(`Successfully updated ${count} incidents to have a 17m resolution time.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixDates();
