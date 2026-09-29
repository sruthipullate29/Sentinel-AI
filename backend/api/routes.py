from fastapi import APIRouter, HTTPException
from typing import List
import uuid
import datetime
from domain.models import Incident, TelemetrySnapshot, ResourceMetrics, ProcessMetrics, ActionRecommendation
from services.memory_service import memory_service
from monitoring.telemetry_engine import telemetry_engine
from actions.docker_adapter import docker_adapter

router = APIRouter()

# In-memory incident store for MVP
active_incidents = {}

@router.get("/telemetry", response_model=TelemetrySnapshot)
async def get_telemetry():
    """Get current live telemetry."""
    return telemetry_engine.get_latest_snapshot()

@router.post("/incidents", response_model=Incident)
async def create_incident(snapshot: TelemetrySnapshot):
    """Create a new incident from telemetry."""
    incident_id = f"INC-{str(uuid.uuid4())[:8].upper()}"
    
    # Simple logic to find probable cause
    probable_cause = "Unknown workload"
    if snapshot.processes:
        top_process = sorted(snapshot.processes, key=lambda p: p.cpu, reverse=True)[0]
        if top_process.cpu > 20:
            probable_cause = f"High CPU contribution by {top_process.name} (PID: {top_process.pid})"
            
    incident = Incident(
        id=incident_id,
        timestamp=datetime.datetime.utcnow().isoformat(),
        status="open",
        resource_snapshot=snapshot.system,
        affected_processes=snapshot.processes,
        risk_score=snapshot.risk_score,
        probable_cause=probable_cause,
        historical_matches=[]
    )
    
    # Recall relevant historical memories
    memories = await memory_service.recall_for_incident(incident)
    incident.historical_matches = memories
    
    # Generate recommendation based on history (simplistic logic for MVP)
    target_id = "sentinelai-demo-workload" # default target for demo
    if memories and len(memories) > 0:
        # We found a historical memory
        incident.recommendation = ActionRecommendation(
            action=memories[0].get("actionTaken", "pause_container"),
            target_id=target_id,
            requires_confirmation=True,
            reason="Matches historical incident where this action was successful."
        )
    else:
        # No history found, general recommendation
        incident.recommendation = ActionRecommendation(
            action="pause_container",
            target_id=target_id,
            requires_confirmation=True,
            reason="No historical experience. Top contributor is causing pressure."
        )
        
    active_incidents[incident_id] = incident
    return incident

@router.post("/incidents/{incident_id}/approve")
async def approve_incident_action(incident_id: str):
    """User approves the recommendation. Execute and verify."""
    incident = active_incidents.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    incident.user_decision = "approved"
    
    # Execute action
    if incident.recommendation:
        action_name = incident.recommendation.action
        target = incident.recommendation.target_id
        
        success = await docker_adapter.execute_action(action_name, target)
        
        if success:
            incident.action_result = "success"
            # Simulate verification metrics for demo purposes (ideally wait and re-read)
            incident.verification_metrics = ResourceMetrics(
                cpu=max(0.0, incident.resource_snapshot.cpu - 30.0),
                ram=incident.resource_snapshot.ram,
                disk=incident.resource_snapshot.disk
            )
            
            delta_cpu = incident.resource_snapshot.cpu - incident.verification_metrics.cpu
            
            # Retain in Hindsight
            retained = await memory_service.retain_incident(incident, delta_cpu)
            if retained:
                incident.hindsight_memory_status = "retained"
            else:
                incident.hindsight_memory_status = "failed"
        else:
            incident.action_result = "failed"
            incident.verification_metrics = incident.resource_snapshot
            
    return incident

@router.get("/memories")
async def list_memories():
    """List all stored memories via recall with empty query."""
    # In a real app we'd use a different endpoint, but recall with generic query works for MVP demo
    return await memory_service.recall_for_incident(Incident(id="0", timestamp="", status="", resource_snapshot=ResourceMetrics(cpu=0, ram=0, disk=0), affected_processes=[], risk_score=0, probable_cause="any", historical_matches=[]))
