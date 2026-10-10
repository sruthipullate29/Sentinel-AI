# Judge Demonstration Guide

This guide provides the exact steps to demonstrate the Hindsight learning loop in Vision404.

## Prerequisites
1. **API Key Setup:** Obtain a Hindsight Cloud API key from [ui.hindsight.vectorize.io](https://ui.hindsight.vectorize.io). Put it in your root `.env` as `HINDSIGHT_API_KEY`. This removes the need for local Docker completely.
2. Run the backend: `cd backend && .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000`
3. Run the frontend: `cd vision404 && npm run dev`

## First Incident Scenario (Amnesia State)
1. Open the UI at `http://localhost:5173`.
2. Click **Run Auto Simulation**. This overrides the telemetry with a high CPU spike.
3. The agent detects the anomaly and checks Hindsight.
4. **Observable Evidence:** The recommendation panel will explicitly state: *"No relevant historical experience found. This is a first-time incident."*
5. Click **Approve**.
6. The agent executes `pause_container` on `vision404-demo-workload`.
7. **Observable Evidence:** The verification phase measures the real CPU delta, resolves the incident, and you can see in the terminal logs: `Hindsight retain OK`.

## Restart & Persistence Check
1. Kill the backend terminal process (CTRL+C).
2. Restart the backend: `.\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000`
3. **Observable Evidence:** Look at the frontend "Incident History" or query `/api/incidents`. The previous incident remains. The backend logs will show `Database initialised` without errors.

## Second Incident Scenario (Learning State)
1. In the UI, trigger the **Run Auto Simulation** again.
2. The agent detects the anomaly and checks Hindsight.
3. **Observable Evidence:** The recommendation panel will now state: *"Hindsight recalled 1 relevant past experience(s). Recommendation is based on previously verified remediation history."*
4. Click **Approve**.
5. The agent executes the fix again, successfully relying on the fact that it worked previously.

## Troubleshooting
- **Simulation vs Physical Execution:** The "Run Auto Simulation" button passes an `is_simulation=True` flag to the API. This safely bypasses the physical Docker execution block (returning faked success and a faked CPU drop), allowing you to demonstrate the full logic flow, approval UI, and memory writing even on a laptop without Docker!
- **Hindsight unavailable:** If you don't configure the `.env` with a Hindsight Cloud API key, the system will degrade gracefully: it will still run, return empty memories on recall, and queue retentions in the local SQLite outbox until Hindsight is online.
