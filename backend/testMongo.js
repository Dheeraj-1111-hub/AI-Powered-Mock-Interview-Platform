const mongoose = require('mongoose');

const uri = 'mongodb+srv://ysaidheeraj1111_db_user:E1QliqBZ1ydLssMM@cluster0.qz2wbuy.mongodb.net/test';

const codingProblemSchema = new mongoose.Schema({
  starterCode: { type: Map, of: String },
});
const CodingProblem = mongoose.model('CodingProblem', codingProblemSchema);

async function test() {
  await mongoose.connect(uri);
  const problems = await CodingProblem.find({});
  let count = 0;
  for (const p of problems) {
    if (p.starterCode && p.starterCode.get('javascript')) {
      const js = p.starterCode.get('javascript');
      const fnMatch = js.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (fnMatch) {
          const fnName = fnMatch[1];
          const params = fnMatch[2];
          p.starterCode.set('cpp', `// CPP ${fnName}`);
          p.markModified('starterCode');
          await p.save();
          count++;
      }
    }
  }
  console.log("Updated", count);
  
  const updated = await CodingProblem.find({});
  console.log("Verify cpp:", updated[0].starterCode.get('cpp'));
  
  await mongoose.disconnect();
}
test();
