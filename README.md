# Ready?.com — AI-Powered Mock Interview Platform

Ready?.com is an advanced, ultra-low-latency mock interview evaluation engine engineered for the **Hack2Hire: AI-Powered Interview Hackathon**. The platform bridges structural LLM contextual routing with real-time speech processing pipelines to accurately simulate an adaptive, high-pressure professional hiring evaluation.

---

## 🚀 Core Engine Architecture

* **The Cognitive Layer (LLM Router):** Managed by the **Groq API (`llama3-70b-8192`)** for sub-second, stateful reasoning. Dynamically sequences interactions across Technical, Conceptual, Behavioral, and Scenario-based quadrants.
* **The Acoustic Pipeline (STT):** Powered by the **Deepgram API SDK** for real-time voice streaming and instantaneous vocal transcription.
* **The Vocalization Engine (TTS):** Handled entirely via the client-side browser native **Web Speech API (`window.speechSynthesis`)** to completely avoid API payload overhead and keep animations synchronized.
* **Persistent File Vault (Local DB):** A zero-volatile infrastructure layer built with Node.js native `fs.promises` storing schemas directly into `local-database.json`. Candidate profiles, parsing text metadata, and deep analytical arrays persist seamlessly across development server reloads.

---

## 🖼️ Application Lifecycle & System Walkthrough

### 1. Secure Credential Gateway
A crisp, minimal entry layer enforcing strict format parsing. The application validates registration vectors to ensure only valid `@gmail.com` profiles can establish persistent account environments.
![Login Security Interface](./images/Screenshot%20(41).png)
*Figure 1: Split-screen credential gateway and security verification panel.*

![Account Profile Construction](./images/Screenshot%20(42).png)
*Figure 2: Form validator ensuring strong authentication metrics during registration.*

---

### 2. Comprehensive Candidate Command Center
Upon entering the portal, the parsed skill array from the ingested resume is rendered dynamically. Candidates can manage their settings, access their timeline logs, or trigger a target Job Description alignment sweep.
![Resume Extraction Ingestion](./images/Screenshot%20(43).png)
*Figure 3: Drag-and-drop ingestion interface parsing PDF/TXT technical metadata.*

![Unified Candidate Dashboard](./images/Screenshot%20(44).png)
*Figure 4: The unified landing cockpit presenting profile matrices and target session entry points.*

---

### 3. Live Interview Room & Responsive AI Visualizer
The assessment environment features a custom **Pulsing AI Sphere** built with Framer Motion that scales its radius and morphs shadows in perfect alignment with active audio output frequencies.
![Technical Code Execution Turn](./images/Screenshot%20(46).png)
*Figure 5: Live evaluation view showcasing an active workspace for technical problem-solving.*

![Algorithmic Data Manipulation Challenge](./images/Screenshot%20(47).png)
*Figure 6: Dynamic scenario turn forcing code implementation alongside voice transcription analysis.*

---

### 4. Deep Metrics & Analytical Summary Dashboard
When an interview run concludes or passes below safety thresholds, the evaluation suite tabulates scores across key structural metrics and populates clear data visualizations.
![Quick Stats Overview](./images/Screenshot%202026-06-01%20165812.png)
*Figure 7: Summary widget mapping aggregate readiness scores and session volume metrics.*

![Advanced Performance Analytics Hub](./images/Screenshot%202026-06-01%20165819.png)
*Figure 8: High-fidelity performance dashboard rendering multi-attribute radar charts, skill-wise bar graphs, and qualitative lists for target optimizations.*

![Chronological Interview History Logs](./images/Screenshot%202026-06-01%20165832.png)
*Figure 9: In-depth session timeline module cataloging persistent historical records, errors, and metadata details.*

---

## 🎥 Live Demonstration Walkthrough
Click the link below to watch the mandatory live application demonstration, showcasing the full voice interaction pipeline, code execution parsing, and state adjustments:

📺 **[Watch the Ready?.com System Demonstration Video](https://drive.google.com/file/d/1oxYexnEEYHxaMjFgTfT2WYxuYhSr_n6E/view?usp=sharing)**

---

## 🛠️ Local Installation & Development Set
1. Clone the project workspace:
   ```bash
   git clone https://github.com/Kaushal-Rohit/Ready-interview.git
   cd ready-dot-com
   ```
2. Ingest structural dependencies:
   ```bash
   npm install
   ```

3. Establish your environment variables (`.env.local`):
   ```text
   GROQ_API_KEY=your_secure_groq_token
   DEEPGRAM_API_KEY=your_secure_deepgram_token
   ```
4. Initiate the local runtime engine:
   ```bash
   npm run dev
   ```
