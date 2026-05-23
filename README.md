# HireIQ AI — Career Operating System 🚀

HireIQ is a next-generation, AI-driven career intelligence platform designed to transform how engineers prepare for high-stakes technical interviews. Built with a production-grade, modular architecture, HireIQ replicates the intensity of FAANG-level interviews using advanced LLM orchestration and real-time collaborative environments.

## 💎 Elite Feature Ecosystem

### 🧠 AI Interview Engine
- **Interviewer Personas**: Train against different personalities (e.g., Skeptical Architect, Friendly HR, Pragmatic CTO).
- **Multi-Round Simulations**: Realistic flows from HR screening to deep-dive System Design.
- **Real-Time Evaluation**: Question-by-question scoring and clarity analysis powered by Llama 3.

### 🔬 Resume Intelligence
- **Deep Scan Matrix**: Analyze resumes against 50+ ATS data points.
- **Keyword Intelligence**: Present/Missing keyword highlighting with recruiter-style breakdown.
- **Strategic Weakness Analysis**: Identifying critical gaps before they reach a human recruiter.

### 💻 Elite Coding Lab
- **FAANG Sandbox**: Real-time code execution via Judge0 in 40+ languages.
- **AI Structural Review**: Complexity analysis (Time/Space) and automated refactoring suggestions.
- **Reference Solutions**: High-performance solution snippets generated for every challenge.

### 📡 Real-Time Command Center
- **Collaborative Rooms**: Shared Monaco editor and low-latency WebRTC video/audio feeds.
- **AI Moderator**: Live AI observer that provides technical hints and behavioral guidance.
- **Participant Presence**: Multi-user synchronization with typing indicators.

### 📈 Career Alpha
- **Skill Gap Matrix**: Visualized comparison between current resume and target industry benchmarks.
- **Strategic Roadmapping**: Personalized learning trajectories with phase-based execution tasks.
- **Executive AI Mentor**: 24/7 career strategist for high-level industry advice.

## 🏗️ Master Architecture

The project follows a **Feature-Based Modular Architecture** designed for extreme scalability and recruiter credibility.

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide-React, Shadcn/UI.
- **Backend**: Node.js/Express, MongoDB, Socket.io, Winston, JWT (Refresh Rotation).
- **AI Service**: FastAPI, Groq (Llama-3), PyPDF2, LangChain-ready prompt patterns.
- **Infra**: Docker, Redis (Caching), GitHub Actions (CI/CD), Nginx.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB & Redis
- Groq API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/HireIQ-AI.git
   cd HireIQ-AI
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **AI Service Setup**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📜 License
MIT License. Built for impact.
