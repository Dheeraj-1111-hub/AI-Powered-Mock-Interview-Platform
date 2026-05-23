# HireIQ AI - Complete Startup Guide

## 🚀 System Overview

HireIQ AI consists of 4 services that need to run together:

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────┐
│   Frontend      │   Backend API    │   AI Service     │  Judge0      │
│   (React)       │   (Node.js)      │   (FastAPI)      │  (Docker)    │
│   Vite          │   Express        │   Python         │  Compiler    │
│   Port: 5174    │   Port: 3000     │   Port: 8000     │  Port: 2358  │
└─────────────────┴──────────────────┴──────────────────┴──────────────┘
```

## ✅ Prerequisites

- ✅ Node.js 18+ installed
- ✅ Python 3.11+ installed
- ✅ Docker & Docker Compose installed
- ✅ MongoDB Atlas account configured
- ✅ Groq API key obtained

## 📋 Step-by-Step Startup

### Step 1: Judge0 (Code Execution Engine)

**Terminal 1** - Start Judge0 locally:

```bash
cd judge0
docker compose up
```

**Expected Output:**
```
judge0-server-1   | Listening on 0.0.0.0:2358
```

**Verify:** Open http://localhost:2358/docs - You should see Swagger UI ✅

---

### Step 2: AI Service (FastAPI + Groq)

**Terminal 2** - Start the Python AI service:

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
Uvicorn running on http://0.0.0.0:8000
Application startup complete
```

**Verify:** Open http://localhost:8000/docs - You should see Swagger UI ✅

---

### Step 3: Backend API (Node.js + Express)

**Terminal 3** - Start the Node.js backend:

```bash
cd backend
npm install  # Only first time
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:3000
Connected to MongoDB
```

**Verify:** Open http://localhost:3000/ - You should see API running ✅

---

### Step 4: Frontend (React + Vite)

**Terminal 4** - Start the React frontend:

```bash
cd frontend
npm install  # Only first time
npm run dev
```

**Expected Output:**
```
VITE v5.4.21 ready in 123 ms
➜  Local: http://localhost:5174/
```

**Verify:** Open http://localhost:5174 - You should see the landing page ✅

---

## 🧪 Quick Verification Checklist

```
✅ Judge0 at http://localhost:2358
✅ AI Service at http://localhost:8000/docs
✅ Backend at http://localhost:3000
✅ Frontend at http://localhost:5174
✅ Can access landing page
✅ Can sign up / login
✅ Can navigate to dashboard
```

## 🎯 Quick Test Flow

### 1. Test Resume Analysis
- Go to Dashboard → Resume Analyzer
- Upload a PDF resume
- Should show: "Resume analysis completed"

### 2. Test Interview Generation
- Go to Dashboard → Interview Generator
- Click "Generate Questions"
- Should show: AI-generated interview questions

### 3. Test Code Execution
- Go to Dashboard → Coding Lab
- Select Python
- Enter: `print("Hello World")`
- Click "Run Code"
- Should show: "Hello World" in output

## 📝 Environment Configuration

Your `.env` file should look like this:

```env
# AI Service
GROQ_API_KEY=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

# Code Execution (Local Judge0 - No key needed!)
JUDGE0_URL=http://localhost:2358

# Database
MONGODB_URI=mongodb+srv://ysaidheeraj1111_db_user:REMOVED_PASSWORD@cluster0.qz2wbuy.mongodb.net/

# JWT Secret
JWT_SECRET=super_secret_random_string

# CORS
CORS_ORIGIN=http://localhost:5174
```

## 🔧 Troubleshooting

### Judge0 Port 2358 Already in Use

```bash
# Find process using port
lsof -i :2358

# Kill the process
kill -9 <PID>

# Or restart Docker
docker restart $(docker ps -f "name=judge0" -q)
```

### Cannot Connect to MongoDB

```bash
# Verify connection string in .env
# Check MongoDB Atlas whitelist includes your IP
# Or use local MongoDB: mongodb://localhost:27017/hireiq
```

### AI Service Won't Start

```bash
# Ensure Python 3.11+ is installed
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Check for port conflict
lsof -i :8000
```

### Backend Not Connecting to Frontend

```bash
# Check CORS_ORIGIN in .env
# Should match: http://localhost:5174

# Verify in backend app.ts:
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
```

### Vite Port 5174 Already in Use

```bash
# Use different port
npm run dev -- --port 3333

# Update CORS_ORIGIN in backend .env:
CORS_ORIGIN=http://localhost:3333
```

## 🎓 Service Communication Flow

```
Frontend (5174)
      ↓
Backend API (3000)
      ├→ AI Service (8000) - for resume analysis & interview generation
      ├→ Judge0 (2358) - for code execution
      └→ MongoDB - for data persistence
```

## 📊 Monitoring

### View Logs

```bash
# Backend logs
# Terminal 3 - showing automatically

# AI Service logs  
# Terminal 2 - showing automatically

# Judge0 logs
# Terminal 1 - showing automatically

# Frontend console logs
# Browser DevTools → Console tab
```

### Check Health Status

```bash
# Backend health
curl http://localhost:3000

# AI Service health
curl http://localhost:8000/docs

# Judge0 health
curl http://localhost:2358

# Database connection
# Check Backend logs for "Connected to MongoDB"
```

## 🚀 Production Deployment

When ready to deploy:

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build

# Use Docker Compose for production
docker-compose -f docker-compose.yml up -d

# Verify services
docker-compose ps
```

## 📞 Support & Debugging

### Enable Debug Logging

```bash
# Backend
DEBUG=* npm run dev

# AI Service
export LOGLEVEL=DEBUG
uvicorn app:app --reload

# Frontend
npm run dev
```

### Common Error Messages

| Error | Solution |
|-------|----------|
| `ECONNREFUSED 127.0.0.1:3000` | Backend not running - run `npm run dev` in backend folder |
| `Cannot find module 'groq'` | Install dependencies: `pip install -r requirements.txt` |
| `Port 3000 already in use` | Kill process or use different port: `npm run dev -- --port 3001` |
| `CORS error` | Check CORS_ORIGIN matches frontend URL |
| `Cannot connect to MongoDB` | Check MongoDB Atlas connection string in .env |

## ✨ You're All Set!

All 4 services are now running and communicating:

```
✅ Judge0 - Local code compilation & execution
✅ AI Service - Groq-powered AI features
✅ Backend - Node.js API with MongoDB
✅ Frontend - Professional React UI
```

**Now open http://localhost:5174 and start using HireIQ AI!** 🎉

---

**Made with ❤️ for interview preparation excellence**