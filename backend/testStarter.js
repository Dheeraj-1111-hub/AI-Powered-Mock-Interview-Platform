require('dotenv').config();
const mongoose = require('mongoose');
const CodingProblem = require('./dist/models/CodingProblem').default;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const p = await CodingProblem.findOne().lean();
  console.log(p.title);
  console.log(JSON.stringify(p.starterCode, null, 2));
  process.exit();
}
run();
