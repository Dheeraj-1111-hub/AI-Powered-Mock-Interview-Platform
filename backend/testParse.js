const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://ysaidheeraj1111_db_user:E1QliqBZ1ydLssMM@cluster0.fgrqzxc.mongodb.net/test';

async function testParse() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('test');
    const problems = await db.collection('codingproblems').find({}).toArray();
    
    console.log(`Found ${problems.length} problems`);
    for (let i = 0; i < Math.min(5, problems.length); i++) {
        const js = problems[i].starterCode.javascript;
        const match = js.match(/function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
        if (match) {
            console.log(`Matched! Name: ${match[1]}, Params: ${match[2]}`);
        } else {
            console.log(`Failed to match JS: ${js}`);
        }
    }
  } finally {
    await client.close();
  }
}

testParse();
