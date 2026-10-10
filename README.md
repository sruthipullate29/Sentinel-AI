# Vision404

Vision404 is an AI-powered incident response agent that genuinely learns from past engineering incidents using Vectorize Hindsight™. It acts as a memory-powered reliability engineer that remembers what happened, what fixes were attempted, and what actual outcomes were achieved, so it can make better, evidence-backed decisions for future incidents.

## Problem and Target Users
**Problem:** Site Reliability Engineers (SREs) and DevOps teams often repeat troubleshooting steps because past incident outcomes, especially failed attempts or partial fixes, are lost in ChatOps scrollback or closed tickets. When similar resource pressure or crashes happen again, the context of *what actually worked last time* is usually missing.
**Target Users:** SREs, DevOps engineers, and system administrators.

## Solution and Architecture
Vision404 implements a complete Hindsight learning loop:
- **Detection:** A background telemetry engine monitors for host resource anomalies (e.g. CPU spikes).
- **Incident Persistence:** Incidents are durably saved to a local SQLite database, along with raw system context.
- **Hindsight Recall:** The agent recalls similar past experiences from Hindsight using a natural-language description of the current symptoms.
- **Evidence-Based Recommendation:** The agent recommends a remediation action (e.g., pausing a container), explicitly citing any recalled memory that informed its decision.
- **Remediation & Verification:** Upon human approval, a Docker adapter safely executes the fix. The telemetry engine measures the actual resource delta to verify if the fix worked.
- **Hindsight Retention:** The verified outcome (success or failure) is retained in Hindsight via a durable outbox, creating a new experience for future incidents to learn from.

## Technology Stack
- **Backend:** Python, FastAPI, SQLite, Docker SDK, Hindsight Client SDK (`hindsight-client`).
- **Frontend:** React, Vite, Lucide Icons.
- **Memory Engine:** Hindsight by Vectorize (running via Docker container).

## Hindsight's Specific Role
Hindsight is not used as a generic RAG database or chat history. It is used strictly for **Episodic Memory**: storing and retrieving discrete incident experiences. The backend transforms each incident and its measured outcome into a semantic narrative and retains it. When a new incident occurs, Hindsight retrieves past narratives based on symptom similarity, allowing the agent to avoid repeating documented failures and prefer proven fixes.

## Setup and Configuration

1. **Prerequisites:** Python 3.10+, Node.js 18+.
2. **Hindsight Cloud (Recommended for Demo):**
   Since running Docker locally might not be feasible during the presentation, you can use Vectorize Hindsight Cloud natively:
   - Get a free API key at [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io)
   - Create a `.env` file in the root directory:
   ```env
   HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
   HINDSIGHT_API_KEY=sk-your-api-key-here
   HINDSIGHT_BANK_ID=vision404-demo-bank
   ```
3. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
5. **Frontend Setup:**
   ```bash
   cd vision404
   npm install
   ```

## Running the Application
1. **Backend:** `cd backend && .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000`
2. **Frontend:** `cd vision404 && npm run dev`
   Navigate to `http://localhost:5173`.

## Database and Persistence
The application uses SQLite (`backend/incidents.db`) as the authoritative source of truth for incident history, remediation attempts, and pending memory outbox jobs. Hindsight acts purely as the semantic memory and recall layer. If Hindsight is offline, the app degrades gracefully, still persisting incidents locally and queueing memory retention jobs in the outbox to retry later.

## Running Tests
```bash
cd backend
python -m pytest tests/test_vision404.py -v
```

## Known Limitations
- The remediation adapter only supports a safe allowlist of Docker actions (`pause_container`, `unpause_container`, `stop_container`).
- The anomaly detector uses simple static thresholds rather than dynamic baselines.
