# Architecture

## Component Architecture
- **Frontend (React/Vite):** Renders the dashboard, live telemetry, and incident approval queues. Connects strictly to `/api` backend routes.
- **Backend (FastAPI):** Orchestrates the incident lifecycle, connects to Docker, reads telemetry, and interacts with SQLite and Hindsight.
- **Database (SQLite):** Authoritative storage for `incidents`, `remediation_attempts`, and `memory_outbox`.
- **Hindsight (Vectorize):** Episodic memory engine used for semantic recall and retention.
- **Docker Adapter:** A safe wrapper that restricts execution to an allowlist of container actions (`pause_container`, `stop_container`).

## Incident Lifecycle
1. **Detection (`telemetry_engine.py`):** Background thread polls `psutil`. If CPU > 60%, an incident is triggered.
2. **Analysis (`routes.py`):** The system identifies the top offending process.
3. **Recall (`memory_service.py`):** Queries Hindsight with the symptoms.
4. **Recommendation (`routes.py`):** Suggests an action based on past memories (if any) or defaults to safe container pause.
5. **Approval (`App.jsx`):** Human operator clicks "Approve".
6. **Execution (`docker_adapter.py`):** Command executed against the target container.
7. **Verification (`routes.py`):** Telemetry is polled 2 seconds later. Delta CPU is calculated.
8. **Retention (`memory_service.py`):** The outcome (resolved, unresolved, failed execution) is written to Hindsight.

## Database Persistence & Retry Flow
Incidents are persisted *immediately* upon detection to `incidents.db`.
When an incident is resolved, a retention payload is queued into the `memory_outbox` table.
The application then attempts to write to Hindsight. If it succeeds, the outbox item is marked done. If it fails (or the server crashes), the outbox item remains pending.
On every backend startup (`main.py`), pending outbox items are automatically retried.

## Security and Approval Boundaries
- **No autonomous destructive actions:** The agent can *recommend*, but human approval is strictly required.
- **Action Allowlist:** The Docker adapter hardcodes `ALLOWED_ACTIONS = {"pause_container", "unpause_container", "stop_container"}`. It will reject any other LLM hallucination.
- **No arbitrary code execution:** The system interfaces directly via the Docker SDK, avoiding shell command injection entirely.
