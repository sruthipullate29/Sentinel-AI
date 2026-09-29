# SentinelAI — Self-Learning System Reliability Agent

> **"SentinelAI doesn't just detect system problems. It remembers what caused them, learns what solved them, and uses that experience to prevent the next incident."**

SentinelAI is an AI-powered system reliability agent that continuously monitors CPU, memory, disk, and application-level resource usage. Instead of merely displaying passive system statistics, SentinelAI learns how a user's system behaves over time and remembers previous resource incidents, their root causes, the human-approved remediation actions taken, and the verified outcomes using **Hindsight Episodic Memory**.

---

## 🔄 The Continuous Learning Loop

```
Monitor ──▶ Remember ──▶ Learn ──▶ Predict ──▶ Recommend ──▶ Act ──▶ Measure ──▶ Remember
```

1. **Monitor**: Continuous kernel & process-level telemetry collection (CPU, Memory, NVMe I/O, Network, and per-process PID metrics).
2. **Remember**: Queries Hindsight vector memory for historical incident fingerprints matching active symptom patterns.
3. **Learn**: Synthesizes baseline application behavior and detects deviations (e.g., Docker container compile loops, Node.js heap bloating).
4. **Predict**: Forecasts resource exhaustion **45–90 seconds before** host OS stability fails or processes freeze.
5. **Recommend**: Synthesizes safe, non-destructive remediation with direct recall of previously successful human-approved actions.
6. **Act**: Executes safe optimization commands in a non-destructive sandbox (user remains in complete control).
7. **Measure**: Validates real-time before vs. after metric deltas (e.g., `-67% CPU`, `+4.2GB RAM freed`).
8. **Remember**: Commits the verified outcome, human rating, and resolution fingerprint back to Hindsight Episodic Memory for future recall.

---

## 🚀 Key Features

- **Hindsight Episodic Memory Core**: Stores detailed incident records including symptom, root cause, user notes, and verified before/after deltas.
- **Predictive Early Anomaly Alerts**: Alerts before thrashing locks your desktop, pinpointing culprit PIDs.
- **Human-in-the-Loop Execution Workflow**: Interactive step-by-step terminal execution with user review and approval.
- **Real-Time Telemetry Simulation**: Live SVG sparkline graphs, per-core CPU load, DDR5 memory distribution, NVMe I/O throughput, and predictive instability risk index.
- **Interactive Incident Injector**:
  - 🐳 **Docker Container CPU Spike & Build Runaway**
  - 🟢 **Node.js V8 Heap Memory Leak & GC Thrash**
  - 🐘 **PostgreSQL Lock Contention & Disk I/O Storm**
  - ⚡ **Normal Baseline Idle Recovery**
- **Learned Workstation Habits**: Surface personalized insights and habits SentinelAI learned about your workstation.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite + Modern Cyber-Observability CSS Design System
- **Icons**: Lucide React
- **Design Tokens**: Inter, Outfit, and JetBrains Mono typography with glowing glassmorphism aesthetic

---

## 💻 Running the Application

### 1. Global CLI (Anywhere on your machine)
```bash
sentinel-ai
# or
sentinel
```

### 2. Standard Dev Server (Workspace)
```bash
cd sentinel-ai
npm install
npm run dev
```

---

## 🐳 Running with Docker

SentinelAI includes production-ready Docker and Docker Compose setups:

### Run via Docker Compose (Recommended)
```bash
# Production Container (Nginx Alpine + Gzip + Healthchecks)
docker compose up -d

# Development Container (with hot module reload)
docker compose --profile dev up
```

### Run via NPM Docker scripts
```bash
npm run docker:build   # Build Docker image
npm run docker:up      # Start container via docker compose
npm run docker:down    # Stop container
```

Once running, access SentinelAI in your browser at **[http://localhost:5173](http://localhost:5173)**.
