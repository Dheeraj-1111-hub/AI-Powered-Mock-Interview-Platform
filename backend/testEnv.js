require('dotenv').config();
console.log("GROQ KEY:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");
