fetch('https://ce.judge0.com/submissions?base64_encoded=false&wait=true', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({source_code: '#include <iostream>\nint main() { std::cout << "hello cpp"; return 0; }', language_id: 54}) 
}).then(res => res.json()).then(console.log).catch(console.error);
