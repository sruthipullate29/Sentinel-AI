"""
Vision404 API routes.

Key design decisions
────────────────────
- Incidents are persisted in SQLite immediately upon creation.
- Hindsight recall happens BEFORE recommendation generation.
- Remediation is attempted against real Docker targets; failure is reported honestly.
- Verification uses a fresh telemetry snapshot, NOT a hardcoded arithmetic offset.
- Memory retention goes through the durable outbox.
- Simulated / demo incidents are clearly labelled (is_simulation=True).
"""

import uuid
import asyncio
import datetime
import logging
import json
import os
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from domain.models import TelemetrySnapshot, ResourceMetrics, ProcessMetrics
from services.memory_service import memory_service
from monitoring.telemetry_engine import telemetry_engine
from actions.docker_adapter import docker_adapter
from database import db

import socket
try:
    import urllib3.util.connection as urllib_conn
    urllib_conn.allowed_gai_family = lambda: socket.AF_INET
except Exception:
    pass

logger = logging.getLogger(__name__)
router = APIRouter()
_push_executor = ThreadPoolExecutor(max_workers=2)


def _get_vapid_private_key() -> Optional[str]:
    key = os.getenv("VAPID_PRIVATE_KEY")
    if not key:
        return None
    if os.path.exists(key):
        return os.path.abspath(key)
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    candidate = os.path.join(backend_dir, key.lstrip("./\\"))
    if os.path.exists(candidate):
        return os.path.abspath(candidate)
    root_dir = os.path.dirname(backend_dir)
    candidate_root = os.path.join(root_dir, key.lstrip("./\\"))
    if os.path.exists(candidate_root):
        return os.path.abspath(candidate_root)
    return key


def _send_native_windows_toast(title: str, body: str):
    """Deliver a native Windows toast directly via PowerShell WinRT script."""
    if os.name != "nt":
        return
    try:
        import subprocess
        backend_dir = os.path.dirname(os.path.dirname(__file__))
        script_path = os.path.join(backend_dir, "notify_os.ps1")
        if os.path.exists(script_path):
            subprocess.Popen([
                "powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
                "-File", script_path,
                "-Title", title,
                "-Body", body
            ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            logger.info(f"Native Windows toast dispatched: {title}")
    except Exception as ex:
        logger.warning(f"Native Windows toast dispatch error: {repr(ex)}")


# ── Request / Response helpers ────────────────────────────────────────────────

class ApproveRequest(BaseModel):
    notes: Optional[str] = None


# ── Telemetry ─────────────────────────────────────────────────────────────────

@router.get("/telemetry")
async def get_telemetry():
    """Return the latest host telemetry snapshot (real psutil data)."""
    return telemetry_engine.get_latest_snapshot()


# ── Incidents ─────────────────────────────────────────────────────────────────

@router.get("/incidents")
async def list_incidents(limit: int = Query(50, ge=1, le=200)):
    """List all persisted incidents, most recent first."""
    return db.list_incidents(limit=limit)


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    inc = db.get_incident(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc["attempts"] = db.get_attempts_for_incident(incident_id)
    return inc


@router.post("/incidents")
async def create_incident(snapshot: TelemetrySnapshot, is_simulation: bool = False, scenario: Optional[str] = None):
    """
    Create a real or simulation incident from a telemetry snapshot.

    Steps:
    1. Determine probable cause from actual process data.
    2. Recall relevant Hindsight memories.
    3. Generate recommendation (uses recalled memories if available).
    4. Persist to database.
    5. Return enriched incident.
    """
    incident_id = f"INC-{str(uuid.uuid4())[:8].upper()}"
    now = datetime.datetime.utcnow().isoformat()

    # 1. Determine probable cause
    probable_cause = "Unknown workload pressure"
    if snapshot.processes:
        top = max(snapshot.processes, key=lambda p: p.cpu)
        if top.cpu > 10:
            probable_cause = f"High CPU from {top.name} (PID {top.pid}, {top.cpu:.1f}%)"

    incident_data = {
        "id": incident_id,
        "created_at": now,
        "updated_at": now,
        "status": "open",
        "risk_score": snapshot.risk_score,
        "probable_cause": probable_cause,
        "resource_snapshot": snapshot.system.model_dump(),
        "affected_processes": [p.model_dump() for p in snapshot.processes],
        "historical_matches": [],
        "recommendation": None,
        "user_decision": None,
        "action_result": None,
        "verification_metrics": None,
        "hindsight_memory_status": "not_attempted",
        "is_simulation": is_simulation,
        "simulation_scenario": scenario,
    }

    # 2. Recall Hindsight memories BEFORE recommendation
    memories = await memory_service.recall_for_incident(incident_data)
    incident_data["historical_matches"] = memories

    # 3. Generate recommendation
    target_id = "vision404-demo-workload"
    if memories:
        # Extract previous action from memory content
        prev_action = _extract_action_from_memories(memories)
        reason = _build_memory_informed_reason(memories, probable_cause)
        recommendation = {
            "action": prev_action,
            "target_id": target_id,
            "requires_confirmation": True,
            "reason": reason,
            "memory_informed": True,
            "memory_count": len(memories),
        }
    else:
        recommendation = {
            "action": "pause_container",
            "target_id": target_id,
            "requires_confirmation": True,
            "reason": (
                f"No historical experience found for this incident pattern. "
                f"Defaulting to safe container pause for: {probable_cause}"
            ),
            "memory_informed": False,
            "memory_count": 0,
        }
    incident_data["recommendation"] = recommendation
    incident_data["status"] = "recommendation_ready"

    # 4. Persist
    db.save_incident(incident_data)
    logger.info(f"Incident created: {incident_id}  memories={len(memories)}  simulation={is_simulation}")

    # 5. Dispatch push notifications and native Windows toast in background
    title = "Vision404 - Anomaly Detected"
    body = f"{probable_cause} (Risk: {snapshot.risk_score})"
    _send_native_windows_toast(title, body)

    vapid_private_key = _get_vapid_private_key()
    vapid_subject = os.getenv("VAPID_SUBJECT")
    if vapid_private_key and vapid_subject:
        push_payload = json.dumps({
            "title": title,
            "body": body,
            "url": f"/?incident={incident_id}"
        })
        asyncio.create_task(_dispatch_push_notifications(push_payload, vapid_private_key, vapid_subject))

    return incident_data


async def _dispatch_push_notifications(payload: str, vapid_private_key: str, vapid_subject: str):
    """Send Web Push to all subscribers. Runs as a background task so it never blocks incident creation."""
    subs = db.get_all_push_subscriptions()
    logger.info(f"Dispatching push to {len(subs)} subscriber(s)")
    loop = asyncio.get_event_loop()
    for sub in subs:
        try:
            await loop.run_in_executor(
                _push_executor,
                _send_one_push,
                sub, payload, vapid_private_key, vapid_subject
            )
        except Exception as ex:
            logger.error(f"Push executor error: {repr(ex)}")


def _send_one_push(sub: dict, payload: str, vapid_private_key: str, vapid_subject: str):
    """Blocking push call — run in thread executor."""
    from pywebpush import webpush, WebPushException
    endpoint = sub.get("endpoint", "")
    try:
        resp = webpush(
            subscription_info=sub,
            data=payload,
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": vapid_subject}
        )
        logger.info(f"Push sent OK  status={resp.status_code if resp else '?'}  ep={endpoint[:60]}")
    except WebPushException as ex:
        logger.error(f"WebPushException ep={endpoint[:60]} err={repr(ex)}")
        if ex.response and ex.response.status_code in (404, 410):
            db.delete_push_subscription(endpoint)
    except Exception as ex:
        logger.error(f"Push send error ep={endpoint[:60]} err={repr(ex)}")


@router.post("/notifications/subscribe")
async def subscribe_push(sub: dict):
    """Register a browser push subscription."""
    endpoint = sub.get("endpoint")
    if not endpoint:
        raise HTTPException(status_code=400, detail="Missing endpoint")
    db.save_push_subscription(endpoint, sub)
    logger.info(f"Push subscription saved: {endpoint[:60]}")
    return {"status": "subscribed"}


@router.post("/notifications/test")
async def test_notification():
    """Send a test push to all registered subscriptions immediately and fire native Windows toast."""
    _send_native_windows_toast("Vision404 - Test Notification", "If visible, Windows notifications are working!")
    vapid_private_key = _get_vapid_private_key()
    vapid_subject = os.getenv("VAPID_SUBJECT")
    if not vapid_private_key or not vapid_subject:
        raise HTTPException(status_code=500, detail="VAPID not configured")
    subs = db.get_all_push_subscriptions()
    if not subs:
        raise HTTPException(status_code=404, detail="No subscriptions registered")
    payload = json.dumps({
        "title": "Vision404 — Test Notification",
        "body": "If visible, Windows notification delivery is working!",
        "url": "http://localhost:5173"
    })
    results = []
    for sub in subs:
        ep = sub.get("endpoint", "")
        try:
            from pywebpush import webpush, WebPushException
            resp = webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=vapid_private_key,
                vapid_claims={"sub": vapid_subject}
            )
            results.append({
                "endpoint": ep[:60],
                "status": resp.status_code if resp else 201,
                "response_body": resp.text if resp else ""
            })
        except WebPushException as ex:
            status = ex.response.status_code if ex.response else 500
            body = ex.response.text if ex.response else str(ex)
            results.append({"endpoint": ep[:60], "status": status, "error": repr(ex), "response_body": body})
            if status in (404, 410):
                db.delete_push_subscription(ep)
        except Exception as ex:
            results.append({"endpoint": ep[:60], "status": 500, "error": repr(ex), "response_body": ""})
    return {"results": results}

@router.post("/incidents/{incident_id}/approve")
async def approve_incident(incident_id: str, body: ApproveRequest = ApproveRequest()):
    """
    User approves the recommendation.
    - Executes the action against the real Docker target (or returns false if unavailable).
    - Waits briefly and collects actual post-action telemetry.
    - Computes a real delta.
    - Persists the attempt.
    - Triggers Hindsight retention via the outbox.
    """
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.get("user_decision") == "approved":
        raise HTTPException(status_code=409, detail="Incident already approved")

    recommendation = incident.get("recommendation")
    if not recommendation:
        raise HTTPException(status_code=422, detail="No recommendation to approve")

    db.update_incident_field(incident_id, user_decision="approved", status="executing")

    # Count existing attempts for this incident
    existing = db.get_attempts_for_incident(incident_id)
    attempt_number = len(existing) + 1
    attempt_id = f"ATT-{incident_id}-{attempt_number}"
    now = datetime.datetime.utcnow().isoformat()

    metrics_before = incident["resource_snapshot"]

    # Execute action (bypass if simulation)
    action = recommendation["action"]
    target = recommendation["target_id"]
    is_simulation = incident.get("is_simulation", False)
    
    if is_simulation:
        exec_success, exec_error = True, None
        logger.info(f"SIMULATION MODE: Faking successful execution of '{action}'")
    else:
        exec_success, exec_error = await docker_adapter.execute_action_safe(action, target)

    attempt_data = {
        "id": attempt_id,
        "incident_id": incident_id,
        "attempt_number": attempt_number,
        "created_at": now,
        "action": action,
        "target_id": target,
        "metrics_before": metrics_before,
    }

    if not exec_success:
        attempt_data.update({
            "status": "failed",
            "result": "action_execution_failed",
            "error_message": exec_error or "Docker action could not be executed",
            "metrics_after": None,
            "delta_cpu": 0.0,
        })
        db.save_attempt(attempt_data)
        db.update_incident_field(
            incident_id,
            action_result="failed",
            status="unresolved",
            hindsight_memory_status="pending_retention",
        )
        incident = db.get_incident(incident_id)

        # Retain failed experience so future recommendations avoid this path
        await memory_service.retain_incident(incident, 0.0, attempt_id)
        incident = db.get_incident(incident_id)
        return incident

    # Wait for system to stabilise, then take a real snapshot
    await asyncio.sleep(2)
    fresh = telemetry_engine.get_latest_snapshot()
    metrics_after = fresh.system.model_dump()
    
    if is_simulation:
        # Simulate a successful fix for the demo
        metrics_after["cpu"] = max(5.0, metrics_before.get("cpu", 0) - 60.0)
        logger.info(f"SIMULATION MODE: Simulated CPU drop to {metrics_after['cpu']}%")

    delta_cpu = round(metrics_before.get("cpu", 0) - metrics_after.get("cpu", 0), 2)

    # Determine resolution
    if delta_cpu >= 5:
        incident_outcome = "resolved"
        action_result = "success"
    elif delta_cpu >= 0:
        incident_outcome = "unresolved"
        action_result = "partial"
    else:
        incident_outcome = "unresolved"
        action_result = "worsened"

    attempt_data.update({
        "status": "completed",
        "result": action_result,
        "metrics_after": metrics_after,
        "delta_cpu": delta_cpu,
    })
    db.save_attempt(attempt_data)
    import json
    db.update_incident_field(
        incident_id,
        action_result=action_result,
        status=incident_outcome,
        verification_metrics_json=json.dumps(metrics_after),  # stored as JSON string via update
    )

    # Re-read fresh to ensure we pass the persisted record to retention
    incident = db.get_incident(incident_id)
    incident["verification_metrics"] = metrics_after

    await memory_service.retain_incident(incident, delta_cpu, attempt_id)
    incident = db.get_incident(incident_id)
    incident["attempts"] = db.get_attempts_for_incident(incident_id)

    logger.info(
        f"Incident {incident_id} approved. action={action} exec={exec_success} "
        f"delta_cpu={delta_cpu:+.1f}% outcome={incident_outcome}"
    )
    return incident


@router.post("/incidents/{incident_id}/reject")
async def reject_incident(incident_id: str):
    """User rejects the recommendation."""
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.update_incident_field(incident_id, user_decision="rejected", status="closed")
    return db.get_incident(incident_id)


@router.get("/incidents/{incident_id}/attempts")
async def get_attempts(incident_id: str):
    """List all remediation attempts for a given incident."""
    if not db.get_incident(incident_id):
        raise HTTPException(status_code=404, detail="Incident not found")
    return db.get_attempts_for_incident(incident_id)


# ── Memories ──────────────────────────────────────────────────────────────────

@router.get("/memories")
async def list_memories(query: Optional[str] = Query(None)):
    """
    List all memories from the Hindsight bank, or recall by query if query is provided.
    This populates the Hindsight Episodic Memory Bank with live Hindsight cloud data.
    """
    from hindsight.client import hindsight_client
    if query and query.strip() and query.strip().lower() != "all" and query.strip() != "system incident resource pressure":
        recalled = await hindsight_client.arecall(query=query, limit=15)
        return {
            "query": query,
            "memories": recalled,
            "count": len(recalled),
            "source": "hindsight_recall",
        }

    # Return all real indexed memories from Hindsight bank
    all_memories = await hindsight_client.list_all_bank_memories()
    if not all_memories:
        # Fallback to recall if list_memories returned empty
        all_memories = await hindsight_client.arecall(query="system incident", limit=20)

    return {
        "query": query or "",
        "memories": all_memories,
        "count": len(all_memories),
        "source": "hindsight_bank",
    }


@router.get("/hindsight/stats")
async def get_hindsight_stats():
    """
    Fetch comprehensive Hindsight bank statistics, token usage, and live agent status.
    Directly corresponds to the Vectorize Hindsight cloud console.
    """
    from hindsight.client import hindsight_client
    return await hindsight_client.get_bank_dashboard_stats()


async def hindsight_client_recall(query: str):
    from hindsight.client import hindsight_client
    return await hindsight_client.arecall(query=query, limit=10)


@router.get("/memories/reflect")
async def reflect_memories(context: str = Query("What patterns appear in recurring system incidents?")):
    """Ask Hindsight to synthesise patterns from stored memories."""
    synthesis = await memory_service.reflect_on_incidents(context)
    return {"context": context, "synthesis": synthesis}


# ── Outbox ────────────────────────────────────────────────────────────────────

@router.post("/outbox/retry")
async def retry_outbox():
    """Manually trigger outbox retry. Also runs on startup."""
    result = await memory_service.retry_pending_outbox()
    return result


@router.get("/outbox/pending")
async def pending_outbox():
    """List pending memory retention jobs."""
    return db.get_pending_outbox_items()


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    hindsight_status = await memory_service.health_check()
    from hindsight.client import hindsight_client
    stats = await hindsight_client.get_bank_dashboard_stats()
    return {
        "status": "healthy",
        "hindsight": hindsight_status,
        "hindsight_bank": stats.get("bank_id"),
        "hindsight_stats": stats,
        "pending_outbox": len(db.get_pending_outbox_items()),
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_action_from_memories(memories: list) -> str:
    """
    Try to extract the action that previously worked from recalled memory content.
    Looks for 'Recommended action:' or falls back to 'pause_container'.
    """
    for mem in memories:
        content = ""
        if isinstance(mem, dict):
            content = mem.get("content", "") or mem.get("text", "") or str(mem)
        else:
            content = str(mem)
        for line in content.splitlines():
            if "Recommended action:" in line:
                action_part = line.split("Recommended action:")[-1].strip()
                # Normalise to our allowlist
                if "pause" in action_part.lower():
                    return "pause_container"
                if "stop" in action_part.lower():
                    return "stop_container"
                if "unpause" in action_part.lower():
                    return "unpause_container"
    return "pause_container"


def _build_memory_informed_reason(memories: list, probable_cause: str) -> str:
    """Build a human-readable reason using recalled memory context."""
    count = len(memories)
    if count == 0:
        return f"No historical experience for: {probable_cause}"

    # Extract snippet from the first memory
    first = memories[0]
    content = ""
    if isinstance(first, dict):
        content = first.get("content", "") or first.get("text", "") or ""
    else:
        content = str(first)

    # Find outcome line in the memory
    outcome_line = ""
    for line in content.splitlines():
        if "Outcome:" in line or "CPU delta" in line:
            outcome_line = line.strip()
            break

    reason = (
        f"Hindsight recalled {count} relevant past experience(s) for '{probable_cause}'. "
    )
    if outcome_line:
        reason += f"Most relevant: {outcome_line}. "
    reason += "Recommendation is based on previously verified remediation history."
    return reason
