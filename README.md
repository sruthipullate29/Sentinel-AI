np# SentinelAI — Self-Learning System Reliability Agent

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

## 🌍 Running Globally

### 1. Run from Any Terminal Anywhere (Global CLI Command)
SentinelAI has been linked globally to your system PATH. You can open any terminal (PowerShell, CMD, bash) from **any folder** and run:

```bash
sentinel-ai
# or simply
sentinel
```

This will automatically boot up the SentinelAI agent on `0.0.0.0` and open your default browser.

### 2. Network & LAN Global Access
The server binds to `0.0.0.0`, making it accessible across your entire local network (Wi-Fi, LAN, or other workstations):

- **Local Machine**: [http://localhost:5173](http://localhost:5173)
- **Local Network (LAN / Mobile / Other Machines)**: `http://192.168.0.11:5173`

### 3. Running from Workspace Directory
```bash
cd sentinel-ai
npm run dev
```

---

## 🐳 Running with Docker

SentinelAI is fully containerized with Vectorize Hindsight local memory engine and SentinelAI backend:

### Option A: Using Docker Compose (Hindsight + Backend)
From the root workspace directory:
```bash
# Build and run Hindsight and SentinelAI Backend in background
docker compose up -d

# Check service container status
docker compose ps

# View live container logs
docker compose logs -f

# Stop containers
docker compose down
```

Once running:
- **Vectorize Hindsight Memory Engine**: [http://localhost:8888](http://localhost:8888)
- **SentinelAI Backend API**: [http://localhost:8000](http://localhost:8000)

### Option B: Frontend Dashboard Container
```bash
cd sentinel-ai

# Build the production image
docker build -t sentinel-ai .

# Run container mapped to port 5173
docker run -d -p 5173:80 --name sentinel-ai-agent sentinel-ai
```

Once running, access SentinelAI Dashboard at **[http://localhost:5173](http://localhost:5173)**.


