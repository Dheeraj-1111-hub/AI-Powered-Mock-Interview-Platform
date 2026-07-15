require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');

// Ensure dist models are available
const CodingProblem = require('../dist/models/CodingProblem').default;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const promptTemplate = `
You are an expert FAANG platform engineer. I have an existing coding problem on our platform, but the boilerplate code for the candidates is missing the proper LeetCode-style function signatures for C++ and Java.

Problem Title: {title}
Problem Description: {description}
Existing Test Cases: {testCases}

Your task is to generate ONLY a strictly valid JSON object matching the schema below. 
Do NOT output markdown blocks (\`\`\`json). Just the raw JSON string.

CRITICAL: The \`starterCode\` MUST contain fully defined function signatures. You MUST infer the exact actual return types and actual parameter types (e.g., \`vector<int>\`, \`string\`, \`int[]\`) for C++ and Java based on the problem description and test cases. 
Do NOT literally write the string 'ReturnType' or 'Type'. You must replace them with the actual inferred data types!

SCHEMA:
{
    "javascript": "function functionName(param1, param2) {\\n    // Your code here\\n    return null;\\n}",
    "python": "def functionName(param1, param2):\\n    # Your code here\\n    pass",
    "cpp": "#include <iostream>\\n#include <vector>\\n#include <string>\\n#include <unordered_map>\\n#include <unordered_set>\\n#include <algorithm>\\n\\nusing namespace std;\\n\\nActualReturnType functionName(ActualType param1, ActualType param2) {\\n    // Your code here\\n    return {};\\n}\\n",
    "java": "import java.util.*;\\n\\nclass Solution {\\n    public ActualReturnType functionName(ActualType param1, ActualType param2) {\\n        // Your code here\\n        return null;\\n    }\\n}"
}
`;

async function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

async function run() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");

    const problems = await CodingProblem.find({});
    console.log(`Found ${problems.length} problems to backfill.`);

    for (let i = 0; i < problems.length; i++) {
        const p = problems[i];
        console.log(`[${i+1}/${problems.length}] Processing "${p.title}"...`);

        try {
            if (p.starterCode && p.starterCode.cpp && p.starterCode.cpp.includes('#include') && !p.starterCode.cpp.includes('ReturnType')) {
                console.log(`  -> Skipping ${p.title}, already has valid Leetcode boilerplate.`);
                continue;
            }

            const filledPrompt = promptTemplate
                .replace('{title}', p.title)
                .replace('{description}', p.description)
                .replace('{testCases}', JSON.stringify(p.testCases || []));

            let success = false;
            let attempts = 0;
            while (!success && attempts < 3) {
                try {
                    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                        model: 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: filledPrompt }],
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    }, {
                        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` }
                    });

                    const content = response.data.choices[0].message.content;
                    const generated = JSON.parse(content);

                    if (generated.javascript && generated.cpp && generated.java && generated.python) {
                        p.starterCode = generated;
                        await p.save();
                        console.log(`  -> Success! Updated starter code.`);
                        success = true;
                    } else {
                        console.log(`  -> Failed: Missing language keys in response.`);
                        break;
                    }
                } catch (apiErr) {
                    if (apiErr.response && apiErr.response.status === 429) {
                        console.log(`  -> Rate limit hit. Waiting 10 seconds...`);
                        await delay(10000);
                        attempts++;
                    } else {
                        throw apiErr;
                    }
                }
            }
        } catch (err) {
            console.error(`  -> Error processing ${p.title}:`, err.message);
            if (err.response) {
                console.error(err.response.data);
            }
        }
        
        // Wait 15 seconds to avoid hogging the API rate limit from real users
        await delay(15000);
    }

    console.log("Backfill complete!");
    process.exit(0);
}

run();
