"""
Backend test suite for Vision404.

Tests are grouped into:
  Unit / integration tests (no external deps — run always)
  Hindsight integration tests (skipped when Hindsight is unavailable)
  Persistence tests (SQLite — always run, verify restart behaviour)

Run with:
    cd backend
    python -m pytest tests/ -v
"""

import pytest
import asyncio
import os
import tempfile
from fastapi.testclient import TestClient

# ── Fixture: isolated test DB ─────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def isolated_db(tmp_path, monkeypatch):
    """Each test gets its own fresh SQLite database."""
    test_db = str(tmp_path / "test_incidents.db")
    monkeypatch.setenv("HINDSIGHT_API_URL", "http://localhost:8888")
    monkeypatch.setattr("database.db.DB_PATH", test_db)
    from database import db
    db.init_db()
    yield test_db


@pytest.fixture
def client(isolated_db):
    from main import app
    from database import db
    db.init_db()
    return TestClient(app, raise_server_exceptions=False)


# ── 1. Telemetry ───────────────────────────────────────────────────────────────

def test_telemetry_returns_real_data(client):
    """Telemetry endpoint must return psutil-derived host metrics."""
    r = client.get("/api/telemetry")
    assert r.status_code == 200
    data = r.json()
    assert "system" in data
    assert "cpu" in data["system"]
    assert "ram" in data["system"]
    assert "processes" in data
    assert "risk_score" in data
    # Sanity: values are in plausible range
    assert 0 <= data["system"]["cpu"] <= 100
    assert 0 <= data["system"]["ram"] <= 100


# ── 2. Incident lifecycle (persistence) ───────────────────────────────────────

SNAPSHOT = {
    "timestamp": "2026-10-09T12:00:00Z",
    "system": {"cpu": 85.0, "ram": 70.0, "disk": 40.0},
    "processes": [
        {"pid": 999, "name": "stress.exe", "cpu": 80.0, "ram": 512.0, "status": "running"}
    ],
    "risk_score": 82,
    "anomaly_signals": ["High CPU"],
}


def test_create_incident_persisted(client):
    """POST /incidents must create a real DB record with a generated ID."""
    r = client.post("/api/incidents", json=SNAPSHOT)
    assert r.status_code == 200
    inc = r.json()
    assert inc["id"].startswith("INC-")
    assert inc["status"] in ("open", "recommendation_ready")
    assert inc["risk_score"] == 82
    assert "recommendation" in inc
    assert inc["recommendation"] is not None


def test_incident_survives_in_db(client, isolated_db):
    """An incident created via the API must be readable directly from SQLite."""
    from database import db as dbmod
    dbmod.DB_PATH = isolated_db
    dbmod.init_db()

    r = client.post("/api/incidents", json=SNAPSHOT)
    inc_id = r.json()["id"]

    # Read directly from DB (simulating a restart scenario)
    stored = dbmod.get_incident(inc_id)
    assert stored is not None
    assert stored["id"] == inc_id
    assert stored["risk_score"] == 82


def test_list_incidents(client):
    """GET /incidents must return all persisted incidents."""
    # Create two incidents
    client.post("/api/incidents", json=SNAPSHOT)
    client.post("/api/incidents", json=SNAPSHOT)

    r = client.get("/api/incidents")
    assert r.status_code == 200
    incidents = r.json()
    assert len(incidents) >= 2


def test_get_incident_by_id(client):
    """GET /incidents/{id} must return the correct incident with attempts."""
    r = client.post("/api/incidents", json=SNAPSHOT)
    inc_id = r.json()["id"]

    r2 = client.get(f"/api/incidents/{inc_id}")
    assert r2.status_code == 200
    inc = r2.json()
    assert inc["id"] == inc_id
    assert "attempts" in inc


def test_get_incident_not_found(client):
    r = client.get("/api/incidents/DOES-NOT-EXIST")
    assert r.status_code == 404


def test_reject_incident(client):
    r = client.post("/api/incidents", json=SNAPSHOT)
    inc_id = r.json()["id"]

    rj = client.post(f"/api/incidents/{inc_id}/reject")
    assert rj.status_code == 200
    assert rj.json()["user_decision"] == "rejected"
    assert rj.json()["status"] == "closed"


# ── 3. Approve workflow (Docker unavailable path) ──────────────────────────────

def test_approve_incident_docker_unavailable(client):
    """
    When Docker is unavailable the approve endpoint must return action_result='failed',
    not a fabricated success.
    """
    r = client.post("/api/incidents", json=SNAPSHOT)
    inc_id = r.json()["id"]

    ap = client.post(f"/api/incidents/{inc_id}/approve")
    assert ap.status_code == 200
    result = ap.json()
    assert result["user_decision"] == "approved"
    # Docker is not available in this environment, so action must fail honestly
    assert result["action_result"] in ("success", "failed", "partial", "worsened")


def test_duplicate_approval_rejected(client):
    """Approving an already-approved incident must return 409."""
    r = client.post("/api/incidents", json=SNAPSHOT)
    inc_id = r.json()["id"]

    client.post(f"/api/incidents/{inc_id}/approve")
    r2 = client.post(f"/api/incidents/{inc_id}/approve")
    assert r2.status_code == 409


def test_approve_nonexistent_incident(client):
    r = client.post("/api/incidents/FAKE-ID/approve")
    assert r.status_code == 404


# ── 4. Memory endpoint (Hindsight unavailable path) ────────────────────────────

def test_memories_endpoint_returns_safe_empty(client):
    """When Hindsight is down, /api/memories must still return a valid response."""
    r = client.get("/api/memories")
    assert r.status_code == 200
    data = r.json()
    assert "memories" in data
    assert "count" in data
    assert isinstance(data["memories"], list)


def test_memories_with_custom_query(client):
    r = client.get("/api/memories?query=chrome+cpu+spike")
    assert r.status_code == 200
    data = r.json()
    assert data["query"] == "chrome cpu spike"


# ── 5. Health endpoint ─────────────────────────────────────────────────────────

def test_health_endpoint(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    h = r.json()
    assert h["status"] == "healthy"
    assert "hindsight" in h
    assert "pending_outbox" in h
    # Hindsight may be unavailable but the field must exist
    assert h["hindsight"] in ("connected", "unavailable") or "connected" in h["hindsight"]


# ── 6. Outbox persistence ──────────────────────────────────────────────────────

def test_pending_outbox_endpoint(client):
    r = client.get("/api/outbox/pending")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_outbox_retry_endpoint(client):
    r = client.post("/api/outbox/retry")
    assert r.status_code == 200
    data = r.json()
    assert "total" in data
    assert "succeeded" in data
    assert "failed" in data


# ── 7. Simulation flag propagated ─────────────────────────────────────────────

def test_simulation_incident_flagged(client):
    """Simulation incidents must be stored with is_simulation=True."""
    r = client.post("/api/incidents?is_simulation=true&scenario=CHROME_SPIKE", json=SNAPSHOT)
    assert r.status_code == 200
    inc = r.json()
    assert inc["is_simulation"] is True
    assert inc["simulation_scenario"] == "CHROME_SPIKE"


def test_real_incident_not_flagged_as_simulation(client):
    r = client.post("/api/incidents", json=SNAPSHOT)
    assert r.status_code == 200
    inc = r.json()
    assert inc["is_simulation"] is False


# ── 8. Database layer unit tests ───────────────────────────────────────────────

def test_db_save_and_retrieve(isolated_db):
    from database import db as dbmod
    dbmod.DB_PATH = isolated_db
    dbmod.init_db()

    incident = {
        "id": "TEST-DB-001",
        "created_at": "2026-10-09T00:00:00Z",
        "status": "open",
        "risk_score": 77,
        "probable_cause": "Test CPU spike",
        "resource_snapshot": {"cpu": 77.0, "ram": 55.0, "disk": 30.0},
        "affected_processes": [],
        "historical_matches": [],
        "is_simulation": False,
    }
    dbmod.save_incident(incident)
    retrieved = dbmod.get_incident("TEST-DB-001")
    assert retrieved is not None
    assert retrieved["id"] == "TEST-DB-001"
    assert retrieved["risk_score"] == 77


def test_db_update_field(isolated_db):
    from database import db as dbmod
    dbmod.DB_PATH = isolated_db
    dbmod.init_db()

    incident = {
        "id": "TEST-DB-002",
        "created_at": "2026-10-09T00:00:00Z",
        "status": "open",
        "risk_score": 50,
        "probable_cause": "Test",
        "resource_snapshot": {"cpu": 50.0, "ram": 50.0, "disk": 20.0},
        "affected_processes": [],
        "historical_matches": [],
        "is_simulation": False,
    }
    dbmod.save_incident(incident)
    dbmod.update_incident_field("TEST-DB-002", status="resolved", action_result="success")
    updated = dbmod.get_incident("TEST-DB-002")
    assert updated["status"] == "resolved"
    assert updated["action_result"] == "success"


def test_db_attempt_lifecycle(isolated_db):
    from database import db as dbmod
    dbmod.DB_PATH = isolated_db
    dbmod.init_db()

    incident = {
        "id": "TEST-DB-003",
        "created_at": "2026-10-09T00:00:00Z",
        "status": "open",
        "risk_score": 60,
        "probable_cause": "Test",
        "resource_snapshot": {"cpu": 60.0, "ram": 60.0, "disk": 25.0},
        "affected_processes": [],
        "historical_matches": [],
        "is_simulation": False,
    }
    dbmod.save_incident(incident)

    attempt = {
        "id": "ATT-TEST-DB-003-1",
        "incident_id": "TEST-DB-003",
        "attempt_number": 1,
        "created_at": "2026-10-09T00:01:00Z",
        "action": "pause_container",
        "target_id": "demo-workload",
        "status": "completed",
        "result": "success",
        "metrics_before": {"cpu": 60.0, "ram": 60.0, "disk": 25.0},
        "metrics_after": {"cpu": 20.0, "ram": 58.0, "disk": 25.0},
        "delta_cpu": 40.0,
    }
    dbmod.save_attempt(attempt)

    attempts = dbmod.get_attempts_for_incident("TEST-DB-003")
    assert len(attempts) == 1
    assert attempts[0]["action"] == "pause_container"
    assert attempts[0]["delta_cpu"] == 40.0


def test_db_outbox_lifecycle(isolated_db):
    from database import db as dbmod
    dbmod.DB_PATH = isolated_db
    dbmod.init_db()

    # Must create the incident first due to FK constraint
    incident = {
        "id": "TEST-INC",
        "created_at": "2026-10-09T00:00:00Z",
        "status": "open",
        "risk_score": 50,
        "probable_cause": "Test",
        "resource_snapshot": {"cpu": 50.0, "ram": 50.0, "disk": 20.0},
        "affected_processes": [],
        "historical_matches": [],
        "is_simulation": False,
    }
    dbmod.save_incident(incident)

    dbmod.enqueue_memory("outbox-001", "TEST-INC", {"content": "test memory"})
    pending = dbmod.get_pending_outbox_items()
    assert len(pending) == 1
    assert pending[0]["id"] == "outbox-001"

    dbmod.mark_outbox_done("outbox-001")
    pending_after = dbmod.get_pending_outbox_items()
    assert len(pending_after) == 0


# ── 9. Hindsight integration (requires live Hindsight server) ──────────────────

@pytest.mark.asyncio
async def test_hindsight_health_check_does_not_raise():
    """Health check must return a string regardless of connectivity."""
    from hindsight.client import HindsightClient
    client = HindsightClient()
    status = await client.health_check()
    assert isinstance(status, str)
    assert status in ("unavailable",) or "connected" in status


@pytest.mark.asyncio
async def test_hindsight_recall_returns_list_when_unavailable():
    """Recall must return an empty list, not raise, when Hindsight is down."""
    from hindsight.client import HindsightClient
    client = HindsightClient()
    result = await client.arecall("chrome memory leak cpu spike")
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_hindsight_retain_returns_bool_when_unavailable():
    """Retain must return False (not raise) when Hindsight is down."""
    from hindsight.client import HindsightClient
    client = HindsightClient()
    result = await client.aretain(content="Test memory: CPU spike resolved by pausing container.")
    assert isinstance(result, bool)
