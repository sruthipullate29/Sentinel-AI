"""
SQLite database layer for Vision404 — durable incident persistence.
Uses a single incidents.db file in the backend directory.
"""
import sqlite3
import json
import os
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "incidents.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Create tables if they don't exist. Safe to call on every startup."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS incidents (
                id              TEXT PRIMARY KEY,
                created_at      TEXT NOT NULL,
                updated_at      TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'open',
                risk_score      INTEGER NOT NULL DEFAULT 0,
                probable_cause  TEXT NOT NULL DEFAULT '',
                resource_snapshot_json  TEXT NOT NULL DEFAULT '{}',
                affected_processes_json TEXT NOT NULL DEFAULT '[]',
                historical_matches_json TEXT NOT NULL DEFAULT '[]',
                recommendation_json     TEXT,
                user_decision           TEXT,
                action_result           TEXT,
                verification_metrics_json TEXT,
                hindsight_memory_status TEXT NOT NULL DEFAULT 'pending',
                is_simulation           INTEGER NOT NULL DEFAULT 0,
                simulation_scenario     TEXT
            );

            CREATE TABLE IF NOT EXISTS remediation_attempts (
                id              TEXT PRIMARY KEY,
                incident_id     TEXT NOT NULL,
                attempt_number  INTEGER NOT NULL,
                created_at      TEXT NOT NULL,
                action          TEXT NOT NULL,
                target_id       TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'pending',
                result          TEXT,
                error_message   TEXT,
                metrics_before_json TEXT,
                metrics_after_json  TEXT,
                delta_cpu       REAL,
                FOREIGN KEY (incident_id) REFERENCES incidents(id)
            );

            CREATE TABLE IF NOT EXISTS memory_outbox (
                id              TEXT PRIMARY KEY,
                incident_id     TEXT NOT NULL,
                attempt_id      TEXT,
                payload_json    TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'pending',
                created_at      TEXT NOT NULL,
                retry_count     INTEGER NOT NULL DEFAULT 0,
                last_error      TEXT,
                completed_at    TEXT,
                FOREIGN KEY (incident_id) REFERENCES incidents(id)
            );

            CREATE TABLE IF NOT EXISTS push_subscriptions (
                endpoint        TEXT PRIMARY KEY,
                keys_json       TEXT NOT NULL,
                created_at      TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
            CREATE INDEX IF NOT EXISTS idx_attempts_incident ON remediation_attempts(incident_id);
            CREATE INDEX IF NOT EXISTS idx_outbox_status ON memory_outbox(status);
        """)
    logger.info(f"Database initialised at {DB_PATH}")

def save_push_subscription(endpoint: str, keys: dict) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO push_subscriptions (endpoint, keys_json, created_at)
            VALUES (?, ?, ?)
        """, (endpoint, json.dumps(keys), now))
        conn.commit()

def delete_push_subscription(endpoint: str) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM push_subscriptions WHERE endpoint = ?", (endpoint,))
        conn.commit()

def get_all_push_subscriptions() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM push_subscriptions").fetchall()
        return [json.loads(r["keys_json"]) for r in rows]


# ── Incidents ──────────────────────────────────────────────────────────────────

def save_incident(incident_data: Dict[str, Any]) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO incidents (
                id, created_at, updated_at, status, risk_score, probable_cause,
                resource_snapshot_json, affected_processes_json, historical_matches_json,
                recommendation_json, user_decision, action_result,
                verification_metrics_json, hindsight_memory_status,
                is_simulation, simulation_scenario
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            incident_data["id"],
            incident_data.get("created_at", now),
            now,
            incident_data.get("status", "open"),
            incident_data.get("risk_score", 0),
            incident_data.get("probable_cause", ""),
            json.dumps(incident_data.get("resource_snapshot", {})),
            json.dumps(incident_data.get("affected_processes", [])),
            json.dumps(incident_data.get("historical_matches", [])),
            json.dumps(incident_data.get("recommendation")) if incident_data.get("recommendation") else None,
            incident_data.get("user_decision"),
            incident_data.get("action_result"),
            json.dumps(incident_data.get("verification_metrics")) if incident_data.get("verification_metrics") else None,
            incident_data.get("hindsight_memory_status", "pending"),
            1 if incident_data.get("is_simulation", False) else 0,
            incident_data.get("simulation_scenario"),
        ))


def get_incident(incident_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM incidents WHERE id=?", (incident_id,)).fetchone()
    return _row_to_incident(row) if row else None


def list_incidents(limit: int = 50) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM incidents ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
    return [_row_to_incident(r) for r in rows]


def update_incident_field(incident_id: str, **kwargs) -> None:
    if not kwargs:
        return
    set_parts = ", ".join(f"{k}=?" for k in kwargs)
    values = list(kwargs.values()) + [datetime.utcnow().isoformat(), incident_id]
    with get_connection() as conn:
        conn.execute(
            f"UPDATE incidents SET {set_parts}, updated_at=? WHERE id=?", values
        )


def _row_to_incident(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    d["resource_snapshot"] = json.loads(d.pop("resource_snapshot_json", "{}"))
    d["affected_processes"] = json.loads(d.pop("affected_processes_json", "[]"))
    d["historical_matches"] = json.loads(d.pop("historical_matches_json", "[]"))
    d["recommendation"] = json.loads(d["recommendation_json"]) if d.get("recommendation_json") else None
    d.pop("recommendation_json", None)
    vm = None
    if d.get("verification_metrics_json"):
        try:
            vm = json.loads(d["verification_metrics_json"])
        except json.JSONDecodeError:
            import ast
            try:
                vm = ast.literal_eval(d["verification_metrics_json"])
            except:
                pass
    d["verification_metrics"] = vm
    d.pop("verification_metrics_json", None)
    d["is_simulation"] = bool(d.get("is_simulation", 0))
    return d


# ── Remediation Attempts ───────────────────────────────────────────────────────

def save_attempt(attempt_data: Dict[str, Any]) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO remediation_attempts (
                id, incident_id, attempt_number, created_at, action, target_id,
                status, result, error_message, metrics_before_json, metrics_after_json, delta_cpu
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            attempt_data["id"],
            attempt_data["incident_id"],
            attempt_data.get("attempt_number", 1),
            attempt_data.get("created_at", now),
            attempt_data["action"],
            attempt_data["target_id"],
            attempt_data.get("status", "pending"),
            attempt_data.get("result"),
            attempt_data.get("error_message"),
            json.dumps(attempt_data.get("metrics_before")) if attempt_data.get("metrics_before") else None,
            json.dumps(attempt_data.get("metrics_after")) if attempt_data.get("metrics_after") else None,
            attempt_data.get("delta_cpu"),
        ))


def get_attempts_for_incident(incident_id: str) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM remediation_attempts WHERE incident_id=? ORDER BY attempt_number",
            (incident_id,)
        ).fetchall()
    result = []
    for row in rows:
        d = dict(row)
        d["metrics_before"] = json.loads(d.pop("metrics_before_json")) if d.get("metrics_before_json") else None
        d["metrics_after"] = json.loads(d.pop("metrics_after_json")) if d.get("metrics_after_json") else None
        result.append(d)
    return result


# ── Memory Outbox ──────────────────────────────────────────────────────────────

def enqueue_memory(outbox_id: str, incident_id: str, payload: Dict[str, Any], attempt_id: Optional[str] = None) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute("""
            INSERT OR IGNORE INTO memory_outbox (id, incident_id, attempt_id, payload_json, status, created_at)
            VALUES (?,?,?,?,?,?)
        """, (outbox_id, incident_id, attempt_id, json.dumps(payload), "pending", now))


def get_pending_outbox_items() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM memory_outbox WHERE status='pending' ORDER BY created_at"
        ).fetchall()
    result = []
    for row in rows:
        d = dict(row)
        d["payload"] = json.loads(d.pop("payload_json"))
        result.append(d)
    return result


def mark_outbox_done(outbox_id: str) -> None:
    now = datetime.utcnow().isoformat()
    with get_connection() as conn:
        conn.execute(
            "UPDATE memory_outbox SET status='done', completed_at=? WHERE id=?",
            (now, outbox_id)
        )


def mark_outbox_failed(outbox_id: str, error: str, retry_count: int) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE memory_outbox SET status='failed', last_error=?, retry_count=? WHERE id=?",
            (error, retry_count, outbox_id)
        )


def increment_outbox_retry(outbox_id: str, error: str) -> int:
    with get_connection() as conn:
        conn.execute(
            "UPDATE memory_outbox SET retry_count=retry_count+1, last_error=? WHERE id=?",
            (error, outbox_id)
        )
        row = conn.execute("SELECT retry_count FROM memory_outbox WHERE id=?", (outbox_id,)).fetchone()
    return row["retry_count"] if row else 0
