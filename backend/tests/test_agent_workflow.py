import pytest
from fastapi.testclient import TestClient
from main import app
from domain.models import TelemetrySnapshot, ResourceMetrics, ProcessMetrics

client = TestClient(app)

def test_telemetry_endpoint():
    response = client.get("/api/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert "system" in data
    assert "processes" in data
    assert "risk_score" in data

def test_incident_creation_and_approval():
    # 1. Create Incident
    snapshot = {
        "timestamp": "2026-09-29T12:00:00Z",
        "system": {"cpu": 90.0, "ram": 50.0, "disk": 40.0},
        "processes": [
            {"pid": 123, "name": "stress", "cpu": 80.0, "ram": 5.0, "status": "running"}
        ],
        "risk_score": 85,
        "anomaly_signals": ["High CPU"]
    }
    
    res = client.post("/api/incidents", json=snapshot)
    assert res.status_code == 200
    incident = res.json()
    
    assert "id" in incident
    assert incident["status"] == "open"
    assert incident["recommendation"] is not None
    assert incident["recommendation"]["action"] in ["pause_container", "stop_container"]
    
    incident_id = incident["id"]
    
    # 2. Approve Incident
    approve_res = client.post(f"/api/incidents/{incident_id}/approve")
    assert approve_res.status_code == 200
    approved_incident = approve_res.json()
    
    assert approved_incident["user_decision"] == "approved"
    # Action result might be failed if docker is not running, but workflow passes
    assert approved_incident["action_result"] in ["success", "failed"]
