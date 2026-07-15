const { MongoClient } = require('mongodb');

const sourceUri = 'mongodb+srv://ysaidheeraj1111_db_user:E1QliqBZ1ydLssMM@cluster0.qz2wbuy.mongodb.net/test';
const destUri = 'mongodb+srv://ysaidheeraj1111_db_user:E1QliqBZ1ydLssMM@cluster0.fgrqzxc.mongodb.net/';

async function migrate() {
  let sourceClient, destClient;
  try {
    console.log('Connecting to source...');
    sourceClient = new MongoClient(sourceUri);
    await sourceClient.connect();
    const sourceDb = sourceClient.db('test');
    
    console.log('Connecting to destination...');
    destClient = new MongoClient(destUri);
    await destClient.connect();
    const destDb = destClient.db('test');

    console.log('Fetching codingproblems from source...');
    const problems = await sourceDb.collection('codingproblems').find({}).toArray();
    console.log(`Found ${problems.length} problems.`);

    if (problems.length > 0) {
      console.log('Inserting into destination...');
      await destDb.collection('codingproblems').insertMany(problems);
      console.log('Successfully copied codingproblems!');
    } else {
      console.log('No problems found to copy.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (destClient) await destClient.close();
  }
}

migrate();
