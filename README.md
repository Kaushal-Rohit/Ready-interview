# Ready?.com — AI-Powered Mock Interview Platform

> An AI-driven mock interview simulator that adapts in real-time to candidate performance, providing objective scoring, adaptive difficulty, and actionable feedback.

## 🎯 Problem Statement

Most candidates fail interviews not due to lack of skill, but due to lack of **structured interview preparedness**. This platform solves that by simulating a real-world interview with an AI interviewer that thinks, adapts, evaluates, and decides — just like a human interviewer would.

## ✨ Key Features

### Core Interview Engine
- **Resume Parsing** — Upload PDF/TXT resume, AI extracts skills, experience, projects, and education
- **Job Description Alignment** — Questions are tailored to both the candidate's resume and the target role
- **4 Question Types** — Technical, Conceptual, Behavioral, and Scenario-based questions
- **Adaptive Difficulty** — Dynamically adjusts (Easy → Medium → Hard) based on recent performance
- **Voice-Powered** — Speak your answers naturally via browser microphone + Deepgram STT
- **Code Editor** — Embedded IDE workspace slides in for Technical/Scenario questions

### Scoring & Evaluation
- **5-Metric Scoring** — Each answer scored 1-10 on: Accuracy, Clarity, Depth, Relevance, Time Efficiency
- **90-Second Timer** — Fixed response time with automatic time penalties
- **Early Termination** — Interview ends if 3+ consecutive poor scores on Easy difficulty
- **4-Strike Rule** — 4 consecutive timeouts = automatic termination
- **Final Readiness Score** — Overall 0-100 score with badge (Strong / Average / Needs Improvement)

### Dashboard & Analytics
- **Performance Radar Chart** — Visual breakdown of all 5 scoring metrics
- **Skill Breakdown Bar Chart** — Per-skill scoring based on resume skills
- **Strengths & Weaknesses** — AI-generated actionable feedback
- **Session History** — Full history of past interview sessions with scores

### Infrastructure
- **Persistent Local DB** — File-based JSON database (`local-database.json`) for users, resumes, and feedback
- **Gmail-Only Auth** — Simplified authentication for hackathon MVP
- **Greeting Phase** — AI introduces itself and asks for candidate introduction before real questions

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Charts | Recharts |
| AI/LLM | Groq (Llama 3.3 70B Versatile) |
| Speech-to-Text | Deepgram Nova-2 (REST API) |
| Text-to-Speech | Web Speech API |
| Database | Local JSON file (Node.js `fs`) |

## 📁 Project Structure

```
/src
├── /app
│   ├── layout.tsx              # Global layout with metadata
│   ├── page.tsx                # Landing redirect
│   ├── /auth/page.tsx          # Gmail-only login/register
│   ├── /dashboard/page.tsx     # Resume upload, JD input, analytics
│   ├── /interview/page.tsx     # Live interview room
│   └── /api
│       ├── /auth/login          # User authentication
│       ├── /auth/register       # User registration
│       ├── /resume              # Resume parsing via Groq
│       ├── /groq                # Question generation + evaluation + summary
│       └── /deepgram            # Speech-to-text transcription
├── /components
│   ├── InterviewVisualizer.tsx  # AI sphere with speaking/listening animations
│   ├── PerformanceChart.tsx     # Radar + bar charts
│   ├── HistoryCard.tsx          # Session history cards
│   ├── JobDescriptionModal.tsx  # JD input modal
│   └── /ui                     # Button, Input, Card primitives
├── /hooks
│   ├── useAudioRecorder.ts     # MediaRecorder hook
│   └── useSpeechSynthesis.ts   # Web Speech API hook
└── /utils
    ├── stateEngine.ts          # Interview state machine + scoring + termination
    ├── groqClient.ts           # Groq SDK wrapper
    ├── localDb.ts              # Persistent file-based JSON database
    └── db.ts                   # Type definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Groq API Key
- Deepgram API Key

### Setup

```bash
# Clone the repository
git clone https://github.com/Kaushal-Rohit/Ready-interview.git
cd Ready-interview

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Add your API keys to `.env.local`:
```env
GROQ_API_KEY=your_groq_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
```

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎬 Demo

> **[Screen Recording Video]** — *(Link to video in repository)*

## 📊 Scoring Algorithm

| Metric | Weight | Description |
|---|---|---|
| Accuracy | 20% | Factual correctness of the answer |
| Clarity | 20% | Structure and communication quality |
| Depth | 20% | Thoroughness and detail level |
| Relevance | 20% | How well it addresses the question |
| Time Efficiency | 20% | Response time management |

### Time Penalties
- **72-90 seconds**: -1 to Time Efficiency score
- **90+ seconds**: -3 to Time Efficiency score

### Difficulty Adaptation
- Recent avg ≥ 7/10 → **Hard**
- Recent avg ≥ 5/10 → **Medium**  
- Recent avg < 5/10 → **Easy**

### Termination Rules
- 3 consecutive poor scores (avg < 4) on Easy → Early termination
- 4 consecutive timeouts → Automatic termination
- 8 questions completed → Normal completion

## 👤 Author

**Kaushal Rohit**

---

*Built for Hack2Hire: AI-Powered Interview Hackathon by UnsaidTalks*
