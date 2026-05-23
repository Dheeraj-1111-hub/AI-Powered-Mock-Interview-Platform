# Local Judge0 Setup Guide

## ✅ Judge0 is Running!

Your local Judge0 compiler service is now configured and ready to use.

### 🎯 Quick Access

- **Swagger UI**: http://localhost:2358/docs
- **API Endpoint**: http://localhost:2358
- **Languages List**: http://localhost:2358/languages
- **Health Check**: http://localhost:2358/

## 🚀 Backend Configuration

### Environment Variables

Your `.env` file is configured with:

```env
JUDGE0_URL=http://localhost:2358
```

### Code Route Implementation

The backend endpoint has been updated to use the local Judge0 service:

```typescript
// backend/src/routes/codes.ts
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

// Submit code for execution
POST /api/codes/submit
{
  "language": "python",
  "code": "print('Hello World')",
  "input": ""
}

// Retrieve submission result
GET /api/codes/result/:id
```

## 📋 Supported Languages

| Language   | ID | Code Example |
|------------|----|----|
| C          | 50 | `#include <stdio.h>\nint main() { printf("Hello"); }` |
| C++        | 54 | `#include <iostream>\nint main() { std::cout << "Hello"; }` |
| Java       | 62 | `public class Main { public static void main(String[] args) { System.out.println("Hello"); } }` |
| Python     | 71 | `print('Hello')` |
| JavaScript | 63 | `console.log('Hello')` |
| TypeScript | 74 | `console.log('Hello')` |
| Go         | 60 | `package main\nimport "fmt"\nfunc main() { fmt.Println("Hello") }` |
| Rust       | 73 | `fn main() { println!("Hello"); }` |

## 🧪 Test Examples

### Using cURL

```bash
# Python execution
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello Dheeraj\")",
    "language_id": 71
  }'

# JavaScript execution
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "console.log(\"Hello Dheeraj\")",
    "language_id": 63
  }'

# Java execution
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello Dheeraj\"); } }",
    "language_id": 62
  }'
```

### Using Axios (in Node.js)

```typescript
import axios from 'axios';

export const executeCode = async (
  source_code: string,
  language_id: number,
  stdin?: string
) => {
  const response = await axios.post(
    `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
    {
      source_code,
      language_id,
      stdin: stdin || '',
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

// Usage
const result = await executeCode('print("Hello")', 71);
console.log(result.stdout); // Output: Hello
```

### Testing via Frontend

1. Navigate to **Coding Lab** on the dashboard
2. Select a programming language
3. Write your code
4. Click **Run Code**
5. View the output immediately

## ⚠️ Important Reminders

### PC Restart Protocol

After restarting your PC, you must start Judge0 again:

```bash
cd judge0
docker compose up
```

Keep this terminal running while developing.

### Common Issues

**Port Already in Use**
```bash
# Kill the process using port 2358
lsof -ti:2358 | xargs kill -9

# Or restart Docker
docker restart <container_id>
```

**Connection Refused**
- Ensure Judge0 Docker container is running
- Check that port 2358 is not blocked by firewall
- Verify with: `curl http://localhost:2358/`

## 📊 Response Format

### Success Response

```json
{
  "stdout": "Hello World\n",
  "stderr": null,
  "compile_output": null,
  "time": 0.123,
  "memory": 2048,
  "status": {
    "id": 3,
    "description": "Accepted"
  },
  "language": "Python 3.11",
  "language_id": 71
}
```

### Error Response

```json
{
  "stdout": null,
  "stderr": "SyntaxError: invalid syntax\n",
  "compile_output": null,
  "time": 0.05,
  "memory": 1024,
  "status": {
    "id": 5,
    "description": "Runtime Error"
  }
}
```

## 🔧 Advanced Usage

### With Standard Input

```bash
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "import sys\nname = sys.stdin.read().strip()\nprint(f\"Hello {name}\")",
    "language_id": 71,
    "stdin": "Dheeraj"
  }'
```

### Batch Execution

Submit multiple code snippets and collect results:

```typescript
const languages = [
  { id: 50, code: '#include <stdio.h>\nint main() { printf("C"); }' },
  { id: 62, code: 'public class M { public static void main(String[] a) { System.out.println("Java"); } }' },
  { id: 71, code: 'print("Python")' },
];

const results = await Promise.all(
  languages.map(lang => 
    executeCode(lang.code, lang.id)
  )
);
```

## 📚 Documentation

- **Judge0 Swagger**: http://localhost:2358/docs
- **Judge0 Official Docs**: https://judge0.com/
- **Docker Compose**: See `./judge0/docker-compose.yml`

## ✨ Next Steps

1. ✅ Backend updated to use local Judge0
2. ✅ Environment variables configured
3. 🚀 Start the backend: `npm run dev`
4. 🎯 Test via Coding Lab in the UI
5. 📊 Monitor Judge0 logs: `docker compose logs -f`

---

**Your HireIQ AI platform now has local code execution! No API keys needed. 🎉**