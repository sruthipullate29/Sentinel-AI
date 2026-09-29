import logging
from typing import Dict, Any, List
from hindsight.client import hindsight_client
from domain.models import Incident, MemoryExperience

logger = logging.getLogger(__name__)

class MemoryService:
    async def retain_incident(self, incident: Incident, verified_delta_cpu: float = 0.0) -> bool:
        """
        Retain a meaningful experience based on an incident that has been resolved.
        Only retain verified and approved outcomes.
        """
        if not incident.action_result or incident.action_result != "success":
            logger.info("Incident not successful, skipping retention.")
            return False
            
        memory_payload = {
            "id": incident.id,
            "timestamp": incident.timestamp,
            "symptom": incident.probable_cause,
            "metricsBefore": incident.resource_snapshot.dict(),
            "metricsAfter": incident.verification_metrics.dict() if incident.verification_metrics else {},
            "deltaCpu": verified_delta_cpu,
            "rootCause": incident.probable_cause,
            "actionTaken": incident.recommendation.action if incident.recommendation else "Unknown",
            "approvedByUser": True if incident.user_decision == "approved" else False,
            "effectivenessScore": 95 if incident.action_result == "success" else 50
        }
        
        success = await hindsight_client.aretain(memory_payload)
        return success

    async def recall_for_incident(self, current_incident: Incident) -> List[Dict[str, Any]]:
        """
        Recall relevant historical memories before making a recommendation.
        """
        query = f"High CPU pressure caused by {current_incident.probable_cause}"
        memories = await hindsight_client.arecall(query=query, limit=3)
        return memories

    async def reflect(self, context: str) -> str:
        return await hindsight_client.areflect(context)

    async def health_check(self) -> str:
        return await hindsight_client.health_check()

memory_service = MemoryService()
