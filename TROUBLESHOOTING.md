# HireIQ AI - Troubleshooting Guide

## 🔍 Quick Diagnostics

### Check All Services Status

```bash
# Terminal - Check all ports are listening
echo "Checking services..."
echo "Frontend (5174):"
curl -s http://localhost:5174/ | head -c 100 && echo "✅" || echo "❌"

echo "Backend (3000):"
curl -s http://localhost:3000/ | head -c 100 && echo "✅" || echo "❌"

echo "AI Service (8000):"
curl -s http://localhost:8000/docs | head -c 100 && echo "✅" || echo "❌"

echo "Judge0 (2358):"
curl -s http://localhost:2358/ | head -c 100 && echo "✅" || echo "❌"
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend" (Frontend Error)

**Symptoms:**
- Network error in browser console
- 404 or CORS errors
- Frontend shows blank/error state

**Solutions:**

1. **Check CORS Configuration**
```bash
# In backend .env verify:
CORS_ORIGIN=http://localhost:5174

# If port is different:
CORS_ORIGIN=http://localhost:<your-port>
```

2. **Restart Backend**
```bash
cd backend
npm run dev
```

3. **Clear Browser Cache**
```
Ctrl+Shift+Delete → Clear all data
Or use Incognito/Private mode
```

4. **Check Network Tab**
```
Open DevTools → Network tab
Look for failed requests to /api/
Note the error message
```

---

### Issue: "Cannot connect to AI service" (Judge0 Compilation Fails)

**Symptoms:**
- "Code execution failed" error
- 404 from Judge0 endpoint

**Solutions:**

1. **Verify Judge0 is Running**
```bash
# Terminal 1 - Check if running
curl http://localhost:2358/

# Should show something like:
# {"name": "Judge0", ...}

# If failed, restart:
cd judge0
docker compose down
docker compose up
```

2. **Check Environment Variables**
```bash
# backend/.env should have:
JUDGE0_URL=http://localhost:2358

# NOT: https://judge0-ce.p.rapidapi.com
# NOT: JUDGE0_API_KEY=...
```

3. **Verify Backend Code**
```typescript
// backend/src/routes/codes.ts line 10
const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';
// Should NOT have JUDGE0_KEY
```

---

### Issue: "Connection refused" on Backend Start

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**

1. **Check MongoDB Connection String**
```bash
# backend/.env verify:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Test connection:
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI);"
```

2. **For Local MongoDB**
```bash
# If using local MongoDB instead:
MONGODB_URI=mongodb://localhost:27017/hireiq

# Start local MongoDB:
mongod

# Or with Docker:
docker run -d -p 27017:27017 mongo:latest
```

3. **Whitelist IP on MongoDB Atlas**
- Go to MongoDB Atlas Dashboard
- Network Access → IP Whitelist
- Add your current IP address
- Or add 0.0.0.0/0 for development

---

### Issue: "Port Already in Use"

**For Port 3000 (Backend)**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port:
npm run dev -- --port 3001
```

**For Port 5174 (Frontend)**
```bash
# Find process
lsof -i :5174

# Kill it
kill -9 <PID>

# Or use different port:
npm run dev -- --port 3333
```

**For Port 8000 (AI Service)**
```bash
# Find process
lsof -i :8000

# Kill it
kill -9 <PID>

# Or use different port:
uvicorn app:app --port 8001
```

**For Port 2358 (Judge0)**
```bash
# Find container
docker ps -a | grep judge0

# Stop and remove
docker compose down

# Restart
docker compose up
```

---

### Issue: "Module not found" Errors

**Python AI Service**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
cd ai-service
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

**Node.js Backend**
```
Cannot find module 'express'
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Frontend**
```
Module '@/components/...' not found
```

**Solution:**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run dev
```

---

### Issue: TypeScript Errors

**Backend won't compile**
```bash
cd backend
npm run build
# Or check types:
npx tsc --noEmit
```

**Solutions:**
1. Check for any `any` types that should be typed
2. Verify all imports are correct
3. Check environment variable types

**Frontend won't compile**
```bash
cd frontend
npm run build
# Or check types:
npx tsc --noEmit
```

---

### Issue: "Groq API Key Invalid"

**Symptoms:**
```
Error: Invalid API key for Groq
```

**Solutions:**

1. **Verify API Key in .env**
```bash
# Check backend/.env:
GROQ_API_KEY=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

# Should NOT be empty or 'your-groq-api-key'
```

2. **Test API Key Directly**
```bash
# Test with curl:
curl -X POST "http://localhost:8000/analyze-resume" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@resume.pdf"

# Should return result or error message
```

3. **Check AI Service Logs**
```bash
# Terminal running AI service should show:
# Either: Received request... Processing...
# Or: Error: Invalid API key
```

4. **Get New API Key**
- Visit https://console.groq.com/keys
- Create new API key
- Update .env and restart all services

---

### Issue: "Cannot Upload Resume" 

**Symptoms:**
- File upload fails
- No error message
- Upload button unresponsive

**Solutions:**

1. **Check File Permissions**
```bash
# backend/uploads directory should be writable:
ls -la backend/uploads/
# Should show: drwxr-xr-x

# Fix permissions if needed:
chmod 755 backend/uploads/
```

2. **Check File Size**
```bash
# PDF should be < 10MB
# Check your file size:
ls -lh your-resume.pdf
```

3. **Browser Console Errors**
```
Open DevTools → Console
Look for network errors or upload failures
Check file type (must be PDF)
```

---

## 🧪 Testing Services Individually

### Test Judge0 Directly

```bash
# Test Python execution
curl -X POST "http://localhost:2358/submissions?base64_encoded=false&wait=true" \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello\")",
    "language_id": 71
  }'

# Expected response:
# {"stdout": "Hello\n", "status": {"id": 3, "description": "Accepted"}, ...}
```

### Test AI Service Directly

```bash
# Check if AI service is responsive
curl http://localhost:8000/docs

# Test language listing
curl http://localhost:8000/languages
```

### Test Backend Directly

```bash
# Check if backend is responsive
curl http://localhost:3000/

# Test auth endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

---

## 📊 Debugging Techniques

### Enable Verbose Logging

**Backend**
```bash
cd backend
DEBUG=* npm run dev
```

**AI Service**
```bash
cd ai-service
export LOGLEVEL=DEBUG
uvicorn app:app --log-level debug
```

**Frontend**
```bash
cd frontend
# Check browser DevTools → Console
# Add logging to components:
console.log('Service called:', response);
```

### Browser DevTools

**Network Tab**
- Check request/response headers
- Verify status codes
- Look for CORS errors

**Console Tab**
- Check for JavaScript errors
- Look for unhandled promise rejections
- Monitor WebSocket connections

**Application Tab**
- Check localStorage for auth tokens
- Verify cookies are set correctly

### Database Inspection

```bash
# Using MongoDB CLI:
mongosh "mongodb+srv://user:password@cluster.mongodb.net/"

# List databases:
show databases

# Use hireiq database:
use hireiq

# Check collections:
show collections

# Query users:
db.users.find().pretty()

# Check interview sessions:
db.interviews.find().pretty()
```

---

## 🚨 Emergency Restart

If everything is broken, perform a full reset:

```bash
# Terminal 1 - Stop everything
# Press Ctrl+C in all terminals

# Clear all caches
cd frontend && rm -rf node_modules dist && npm install
cd ../backend && rm -rf node_modules dist && npm install
cd ../ai-service && pip install -r requirements.txt --force-reinstall

# Check Judge0
cd ../judge0 && docker compose down && docker compose up

# Wait 10 seconds for Judge0 to start...

# In new terminals:
# Terminal 2:
cd ai-service && uvicorn app:app --reload

# Terminal 3:
cd backend && npm run dev

# Terminal 4:
cd frontend && npm run dev

# Open http://localhost:5174
```

---

## 📞 Getting Help

### Collect Debug Information

When reporting issues, provide:

```bash
# Node version
node --version

# Python version
python --version

# npm version
npm --version

# Docker version
docker --version

# OS
uname -a

# Backend logs (last 50 lines):
tail -50 backend/npm-debug.log

# AI Service logs (copy terminal output)

# Frontend console errors (from DevTools)
```

### Common Debug Commands

```bash
# List all running ports
lsof -i -P -n

# Check specific port
lsof -i :3000

# Show network connections
netstat -tlnp

# Test DNS
nslookup localhost

# Test network connectivity
ping localhost
```

---

## ✅ Verification Checklist

Before reporting a bug, ensure:

- [ ] Judge0 is running: `curl http://localhost:2358/`
- [ ] Backend is running: `curl http://localhost:3000/`
- [ ] AI Service is running: `curl http://localhost:8000/docs`
- [ ] Frontend is accessible: http://localhost:5174
- [ ] MongoDB is connected (check backend logs)
- [ ] GROQ_API_KEY is set and valid
- [ ] All environment variables are correct
- [ ] No port conflicts
- [ ] Services started in correct order
- [ ] Browser cache cleared

---

**If you need help, check the logs and this guide first!** 🚀