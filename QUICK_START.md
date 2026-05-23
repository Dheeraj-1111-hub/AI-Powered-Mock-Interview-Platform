# 🚀 HireIQ AI - Quick Reference Card

## 📌 What You Have

- ✅ **Local Judge0** - Code execution engine (Port 2358)
- ✅ **FastAPI AI Service** - Groq-powered intelligence (Port 8000)  
- ✅ **Node.js Backend** - Express API with MongoDB (Port 3000)
- ✅ **React Frontend** - Professional UI (Port 5174)

---

## 🎯 Start Everything (4 Terminals)

### Terminal 1: Judge0
```bash
cd judge0
docker compose up
```
✅ Ready when: `Listening on 0.0.0.0:2358`

### Terminal 2: AI Service
```bash
cd ai-service
pip install -r requirements.txt  # First time only
uvicorn app:app --reload --port 8000
```
✅ Ready when: `Application startup complete`

### Terminal 3: Backend
```bash
cd backend
npm install  # First time only
npm run dev
```
✅ Ready when: `Server running on http://localhost:3000`

### Terminal 4: Frontend
```bash
cd frontend
npm install  # First time only
npm run dev
```
✅ Ready when: `Local: http://localhost:5174/`

---

## 🔑 Environment Variables

Your `.env` file:
```env
GROQ_API_KEY=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
JUDGE0_URL=http://localhost:2358
MONGODB_URI=mongodb+srv://ysaidheeraj1111_db_user:REMOVED_PASSWORD@cluster0.qz2wbuy.mongodb.net/
JWT_SECRET=super_secret_random_string
CORS_ORIGIN=http://localhost:5174
```

---

## ✨ Features Ready to Use

| Feature | Status | How to Test |
|---------|--------|------------|
| Resume Analysis | ✅ Working | Upload PDF in Dashboard |
| Interview Generation | ✅ Working | Click "Generate Questions" |
| Code Execution | ✅ Working | Go to Coding Lab & run code |
| Authentication | ✅ Working | Sign up / Login |
| Analytics | ✅ Working | View performance metrics |
| Real-time Sync | ✅ Working | Socket.IO connected |

---

## 🧪 Quick Tests

### Test Code Execution
```bash
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{"source_code":"print(\"Test\")","language_id":71}'
```
Expected: `{"stdout": "Test\n", ...}`

### Test AI Service
```bash
curl http://localhost:8000/docs
```
Expected: Swagger UI loads

### Test Backend
```bash
curl http://localhost:3000
```
Expected: API response

### Test Frontend
```
Open http://localhost:5174
```
Expected: Landing page loads

---

## 🔧 Common Commands

### Stop Everything
```bash
# In each terminal: Ctrl+C
```

### Restart Judge0
```bash
cd judge0
docker compose down
docker compose up
```

### Clear Frontend Cache
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run dev
```

### Check if Port is Free
```bash
lsof -i :3000  # Check port 3000
kill -9 <PID>  # Kill process
```

### View Service Logs
```bash
# Backend logs appear in Terminal 3
# AI Service logs appear in Terminal 2
# Judge0 logs appear in Terminal 1
# Browser console for Frontend
```

---

## 🎓 File Structure

```
HireIQ-AI/
├── judge0/                    # Local code execution
│   └── docker-compose.yml
├── backend/                   # Node.js API
│   ├── src/
│   │   ├── routes/codes.ts   # Code execution endpoint
│   │   └── models/           # MongoDB schemas
│   └── package.json
├── ai-service/               # FastAPI + Groq
│   ├── app.py
│   └── requirements.txt
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── pages/           # Landing, Dashboard, etc.
│   │   └── components/      # UI components
│   └── package.json
├── .env                      # Configuration
├── README.md                 # Full documentation
├── STARTUP_GUIDE.md         # This guide
├── JUDGE0_LOCAL_SETUP.md    # Judge0 details
└── TROUBLESHOOTING.md       # Common issues
```

---

## 🆘 When Something Breaks

1. **Check Terminal Output** - Look for error messages
2. **Verify .env File** - Ensure all keys are set
3. **Check Ports** - Run `lsof -i :3000` etc.
4. **Restart Service** - Ctrl+C then restart
5. **Read TROUBLESHOOTING.md** - Detailed fixes
6. **Clear Cache** - `rm -rf node_modules`

---

## 📊 Service Health Check

```bash
# All working?
curl -s http://localhost:2358/ && echo "✅ Judge0" || echo "❌ Judge0"
curl -s http://localhost:8000/docs && echo "✅ AI" || echo "❌ AI"
curl -s http://localhost:3000/ && echo "✅ Backend" || echo "❌ Backend"
curl -s http://localhost:5174/ && echo "✅ Frontend" || echo "❌ Frontend"
```

---

## 🎯 Next Steps

1. ✅ All services running
2. ✅ .env configured with API keys
3. 🚀 Open http://localhost:5174
4. 📝 Sign up for an account
5. 🧪 Test each feature
6. 🎓 Check STARTUP_GUIDE.md for detailed info

---

## ⚡ Pro Tips

- **Judge0 Persists**: Restart your PC? Run `cd judge0 && docker compose up`
- **No API Keys Needed**: Judge0 runs locally - completely free!
- **Multiple Languages**: Supported: C, C++, Java, Python, JavaScript, TypeScript, Go, Rust
- **Development**: Use Incognito mode to avoid cache issues
- **Database**: Connected to MongoDB Atlas - check data in console.mongodb.com

---

**🎉 You're ready to go! Open http://localhost:5174 and enjoy HireIQ AI!**