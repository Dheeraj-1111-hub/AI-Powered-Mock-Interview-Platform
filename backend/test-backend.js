const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function run() {
    await mongoose.connect('mongodb+srv://ysaidheeraj1111_db_user:REMOVED_PASSWORD@cluster0.qz2wbuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({});
    if (!user) {
        console.log("No users found");
        process.exit(1);
    }
    console.log("Found user:", user._id);
    
    const token = jwt.sign({ userId: user._id.toString() }, 'supersecretjwtkey', { expiresIn: '1h' });
    
    try {
        const res = await fetch('https://ai-powered-mock-interview-platform-ha0o.onrender.com/api/career/today', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log("Backend Status:", res.status);
        const text = await res.text();
        console.log("Backend Body:", text);
    } catch (err) {
        console.error("Fetch failed:", err);
    }
    process.exit(0);
}
run();
