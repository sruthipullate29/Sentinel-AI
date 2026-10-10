import pytest
from fastapi.testclient import TestClient
from main import app
from database import db
import json

client = TestClient(app)

def test_subscribe_endpoint():
    with TestClient(app) as client:
        payload = {
            "endpoint": "https://example.com/push/123",
            "keys": {"p256dh": "dummy_key", "auth": "dummy_auth"}
        }
        response = client.post("/api/notifications/subscribe", json=payload)
        assert response.status_code == 200
        assert response.json() == {"status": "subscribed"}
        
        subs = db.get_all_push_subscriptions()
        assert len(subs) >= 1
        
        # Clean up
        db.delete_push_subscription("https://example.com/push/123")
