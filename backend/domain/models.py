from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class ResourceMetrics(BaseModel):
    cpu: float
    ram: float
    disk: float

class ProcessMetrics(BaseModel):
    pid: int
    name: str
    cpu: float
    ram: float
    status: str

class TelemetrySnapshot(BaseModel):
    timestamp: str
    system: ResourceMetrics
    processes: List[ProcessMetrics]
    risk_score: int
    anomaly_signals: List[str]

class ActionRecommendation(BaseModel):
    action: str
    target_id: str
    requires_confirmation: bool
    reason: str

class Incident(BaseModel):
    id: str
    timestamp: str
    status: str
    resource_snapshot: ResourceMetrics
    affected_processes: List[ProcessMetrics]
    risk_score: int
    probable_cause: str
    historical_matches: List[Dict[str, Any]]
    recommendation: Optional[ActionRecommendation] = None
    user_decision: Optional[str] = None
    action_result: Optional[str] = None
    verification_metrics: Optional[ResourceMetrics] = None
    hindsight_memory_status: str = "pending"
    
class MemoryExperience(BaseModel):
    id: str
    timestamp: str
    app: str
    processName: str
    pid: int
    symptom: str
    metricsBefore: ResourceMetrics
    metricsAfter: ResourceMetrics
    deltaCpu: float
    deltaRam: float
    rootCause: str
    actionTaken: str
    approvedByUser: bool
    userNotes: str
    effectivenessScore: int
    similarityKeywords: List[str]
