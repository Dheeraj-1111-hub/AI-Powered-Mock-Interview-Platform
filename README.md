<div align="center">
  
# 🚀 HireIQ AI
### **The Next-Generation AI-Powered Career Progression & Interview Platform**

[![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

[Features](#-key-features) • [Architecture](#-architecture) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack)

</div>

---

## 🌟 Overview

**HireIQ AI** is a premium, enterprise-grade AI mock interview and career progression platform. It is designed to act as a hyper-personalized career mentor, pushing software engineers to achieve their peak performance through highly realistic mock interviews, dynamic algorithmic coding challenges, and actionable career roadmaps.

Built with a stunning, highly optimized **glassmorphic dark-mode UI** powered by Framer Motion, HireIQ doesn't just evaluate—it gamifies the grind, providing real-time XP feedback and dynamic leveling algorithms to keep candidates engaged.

---

## ✨ Key Features

### 🧠 **AI Career Intelligence Engine**
* **Dynamic Roadmaps**: Generates adaptive weekly learning plans based on your target role (e.g., FAANG Software Engineer).
* **Skill Matrix**: Real-time visual radar charts and heatmaps mapping your competencies against industry standards.
* **Readiness Explainability**: Uses backend telemetry to calculate your "Interview Readiness Score" and highlights exact topics requiring improvement.

### 💻 **Live Coding Lab**
* **Integrated Monaco Editor**: VS Code-like coding experience right in your browser.
* **Secure Local Execution**: Real-time, sandboxed execution environment for JavaScript, TypeScript, and Python without relying on slow external APIs.
* **AI Code Audit**: After submission, the AI analyzes time complexity, space complexity, and provides line-by-line optimization feedback.

### 🎙️ **Real-Time AI Mock Interviews**
* **Conversational AI**: Uses the Web Speech API to listen to your verbal answers and responds instantly in-character (e.g., "Skeptical Senior Architect").
* **Dynamic Follow-Ups**: The AI dynamically generates follow-up questions based on the technical gaps in your previous answers.
* **Comprehensive Scorecards**: Evaluates Problem Solving, Optimization, Code Quality, and Communication.

### 🎮 **Gamification & Progression**
* **Exponential Leveling Algorithm**: Advanced progression curve ensuring senior levels are a true badge of honor.
* **Live Notifications**: Premium, real-time sliding toasts triggered via an intricate Context/Event-bus architecture for immediate XP dopamine feedback.
* **Activity Center**: A beautiful notification center logging all your milestones and career shifts.

### 📄 **Resume Analyzer**
* Upload your resume to receive instantaneous ATS formatting feedback, keyword optimization strategies, and missing skills mapping.

---

## 🏗️ Architecture

HireIQ is structured as a scalable **Monorepo** consisting of three specialized microservices:

1. **`frontend/` (Vite + React + TS)**: A blisteringly fast SPA prioritizing fluid animations (Framer Motion) and premium UX design.
2. **`backend/` (Node + Express + TS)**: The core state manager. Handles user auth (JWT), database operations (Mongoose), code execution sandboxing, and gamification events.
3. **`ai-service/` (Python + FastAPI)**: A high-performance AI inference layer interacting with LLMs (via Groq API) to orchestrate complex reasoning tasks (Readiness Engine, Mentor Chat, Interview Dialog).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Animations**: Framer Motion
- **Components**: Radix UI / Shadcn, Lucide Icons
- **Editor**: Monaco Editor (`@monaco-editor/react`)

### Backend (Core Service)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Auth**: JSON Web Tokens (JWT)
- **Code Execution**: Local Sandboxed Runner

### AI Service (Inference Layer)
- **Framework**: FastAPI
- **Language**: Python 3.10+
- **LLM Integration**: Groq API (Llama 3 / Mixtral)
- **Data Parsing**: PyPDF2, LangChain

---

## 🚦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- Python (3.10 or higher)
- MongoDB Cluster (Local or Atlas)
- Groq API Key

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/HireIQ-AI.git
cd HireIQ-AI
```

### 2. Setup the AI Service (Python)
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```
Create an `.env` file in `ai-service/`:
```env
GROQ_API_KEY=your_groq_api_key
```

### 3. Setup the Backend (Node.js)
```bash
cd ../backend
npm install
```
Create an `.env` file in `backend/`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
PORT=4000
AI_SERVICE_URL=http://localhost:8000/api
```

### 4. Setup the Frontend (React)
```bash
cd ../frontend
npm install
```
Create an `.env` file in `frontend/`:
```env
VITE_API_BASE=http://localhost:4000/api
```

---

## 🚀 Running the Platform locally

To run the full stack locally, you need three terminal instances:

**Terminal 1 (AI Service):**
```bash
cd ai-service
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 3 (Frontend):**
```bash
cd frontend
npm run dev
```

Navigate to `http://localhost:5174` in your browser.

---
