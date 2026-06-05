require('dotenv').config();
const mongoose = require('mongoose');

async function wipe() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const Interview = require('./src/models/Interview').default;
  const CodingSubmission = require('./src/models/CodingSubmission').default;
  const IntelligenceEvent = require('./src/models/IntelligenceEvent').default;
  const ActivityLog = require('./src/models/ActivityLog').default;
  const Roadmap = require('./src/models/Roadmap').default;
  const User = require('./src/models/User').default;

  await Interview.deleteMany({});
  await CodingSubmission.deleteMany({});
  await IntelligenceEvent.deleteMany({});
  await ActivityLog.deleteMany({});
  await Roadmap.deleteMany({});
  
  await User.updateMany({}, {
    $set: {
      'careerProfile.initialized': false,
      careerState: 'Explorer',
      solvedProblems: []
    }
  });

  console.log('Wiped all analytical collections');
  process.exit(0);
}

wipe();
