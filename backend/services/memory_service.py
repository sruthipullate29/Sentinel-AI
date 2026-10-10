"""
Memory service — bridges the domain model to Hindsight and the persistence outbox.

Design principles
─────────────────
1. RETAIN only verified, approved outcomes (or documented failures).
2. Retention failures are queued in the outbox for retry — never silently dropped.
3. RECALL produces a structured summary the recommendation engine can consume.
4. The local SQLite database is the authoritative incident record.
   Hindsight is the semantic memory and recall layer.
5. No metric is fabricated. Outcomes are taken directly from the telemetry delta.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

from hindsight.client import hindsight_client
from database import db

logger = logging.getLogger(__name__)


def _build_retain_content(incident: Dict[str, Any], delta_cpu: float, outcome: str) -> str:
    """
    Produce a rich text narrative that Hindsight will index as a memory.
    Plain text gives Hindsight the semantic surface it needs.
    """
    snap = incident.get("resource_snapshot", {})
    vm = incident.get("verification_metrics", {})
    rec = incident.get("recommendation", {})

    lines = [
        f"INCIDENT MEMORY — {incident['id']}",
        f"Date: {incident.get('created_at', 'unknown')}",
        "",
        f"Symptom / probable cause: {incident.get('probable_cause', 'unknown')}",
        "",
        f"Resource state at detection:",
        f"  CPU: {snap.get('cpu', '?')}%  RAM: {snap.get('ram', '?')}%  Disk: {snap.get('disk', '?')}%",
        f"  Risk score: {incident.get('risk_score', '?')}",
        "",
        f"Recommended action: {rec.get('action', 'unknown')}",
        f"Target: {rec.get('target_id', 'unknown')}",
        f"Recommendation rationale: {rec.get('reason', 'none')}",
        "",
        f"User decision: {incident.get('user_decision', 'unknown')}",
        f"Action execution result: {incident.get('action_result', 'unknown')}",
        "",
    ]

    if outcome == "resolved":
        lines += [
            f"Outcome: RESOLVED",
            f"CPU delta after action: {delta_cpu:+.1f}% (before={snap.get('cpu','?')}% after={vm.get('cpu','?')}%)",
            f"RAM after: {vm.get('ram', '?')}%",
        ]
    elif outcome == "failed_action":
        lines += [
            f"Outcome: ACTION FAILED — the executor could not complete the requested action.",
            f"The incident may still be unresolved. Do not assume this fix works for similar incidents.",
        ]
    elif outcome == "unresolved":
        lines += [
            f"Outcome: UNRESOLVED — the action executed but telemetry did not improve meaningfully.",
            f"CPU delta: {delta_cpu:+.1f}%",
            f"Consider a different approach for similar incidents.",
        ]

    lines += [
        "",
        f"Historical matches used for this recommendation: {len(incident.get('historical_matches', []))}",
        f"Memory retention status: queued",
    ]

    return "\n".join(lines)


class MemoryService:

    async def retain_incident(
        self,
        incident: Dict[str, Any],
        delta_cpu: float,
        attempt_id: Optional[str] = None,
    ) -> bool:
        """
        Retain an incident experience in Hindsight.

        Retention happens when:
        - action_result is 'success' AND delta_cpu shows genuine improvement, OR
        - action_result is 'failed' (failures are valuable too — prevents repeating them)

        Returns True if Hindsight confirmed the retain, False otherwise.
        On failure, queues into the outbox for async retry.
        """
        action_result = incident.get("action_result")
        user_decision = incident.get("user_decision")

        if user_decision != "approved":
            logger.info("Retention skipped: incident was not user-approved")
            return False

        if action_result not in ("success", "failed"):
            logger.info(f"Retention skipped: action_result={action_result}")
            return False

        # Determine outcome label
        if action_result == "failed":
            outcome = "failed_action"
        elif delta_cpu < 5:
            outcome = "unresolved"
        else:
            outcome = "resolved"

        content = _build_retain_content(incident, delta_cpu, outcome)
        metadata = {
            "incident_id": str(incident["id"]),
            "outcome": str(outcome),
            "delta_cpu": str(delta_cpu),
            "action": str(incident.get("recommendation", {}).get("action", "unknown")),
            "probable_cause": str(incident.get("probable_cause", "unknown")),
            "risk_score": str(incident.get("risk_score", 0)),
        }

        # Queue in outbox first so we never lose it on crash
        outbox_id = f"outbox-{incident['id']}-{uuid.uuid4().hex[:8]}"
        db.enqueue_memory(outbox_id, incident["id"], {"content": content, "metadata": metadata}, attempt_id)

        # Attempt immediate retain
        success = await hindsight_client.aretain(content=content, metadata=metadata)

        if success:
            db.mark_outbox_done(outbox_id)
            db.update_incident_field(incident["id"], hindsight_memory_status="retained")
            return True
        else:
            # Will be retried by the outbox worker
            db.update_incident_field(incident["id"], hindsight_memory_status="queued_for_retry")
            return False

    async def recall_for_incident(self, incident: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Recall relevant memories from Hindsight for a given incident.

        Constructs a rich query from actual symptom data, retrieves memories,
        and returns a structured list the recommendation engine can use.
        """
        probable_cause = incident.get("probable_cause", "")
        snap = incident.get("resource_snapshot", {})

        query = (
            f"System incident: {probable_cause}. "
            f"CPU={snap.get('cpu', '?')}% RAM={snap.get('ram', '?')}% Disk={snap.get('disk', '?')}%. "
            f"Risk score={incident.get('risk_score', '?')}. "
            f"What actions resolved or failed to resolve this type of incident?"
        )

        memories = await hindsight_client.arecall(query=query, limit=5)
        return memories

    async def reflect_on_incidents(self, context: str) -> str:
        """
        Ask Hindsight to reflect and synthesise patterns from stored memories.
        """
        return await hindsight_client.areflect(query=context)

    async def health_check(self) -> str:
        return await hindsight_client.health_check()

    async def retry_pending_outbox(self) -> Dict[str, int]:
        """
        Process outbox items that failed earlier. Returns counts of processed items.
        Called on startup and can be polled periodically.
        """
        items = db.get_pending_outbox_items()
        succeeded = failed = 0

        for item in items:
            payload = item["payload"]
            try:
                success = await hindsight_client.aretain(
                    content=payload["content"],
                    metadata=payload.get("metadata"),
                )
                if success:
                    db.mark_outbox_done(item["id"])
                    db.update_incident_field(item["incident_id"], hindsight_memory_status="retained")
                    succeeded += 1
                else:
                    count = db.increment_outbox_retry(item["id"], "aretain returned False")
                    if count >= 5:
                        db.mark_outbox_failed(item["id"], "Max retries exceeded", count)
                    failed += 1
            except Exception as e:
                count = db.increment_outbox_retry(item["id"], str(e))
                if count >= 5:
                    db.mark_outbox_failed(item["id"], str(e), count)
                failed += 1

        if items:
            logger.info(f"Outbox retry: {succeeded} succeeded, {failed} failed of {len(items)} pending")
        return {"succeeded": succeeded, "failed": failed, "total": len(items)}


memory_service = MemoryService()
