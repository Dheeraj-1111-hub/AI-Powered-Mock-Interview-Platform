const mongoose = require('mongoose');

async function fix() {
  await mongoose.connect('mongodb+srv://ysaidheeraj1111_db_user:REMOVED_PASSWORD@cluster0.qz2wbuy.mongodb.net/');
  try {
    await mongoose.connection.db.collection('users').dropIndex('clerkId_1');
    console.log('Successfully dropped clerkId_1 index!');
  } catch (e) {
    console.log('Error dropping index:', e.message);
  }
  process.exit(0);
}
fix();
