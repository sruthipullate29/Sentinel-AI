import requests

payload = {
  "system": {
    "cpu": 85.0,
    "ram": 90.0,
    "disk": 50.0,
    "network_tx": 100,
    "network_rx": 100
  },
  "processes": [
    {"pid": 1, "name": "chrome.exe", "cpu": 80.0, "ram": 1024.0, "status": "running"}
  ],
  "anomaly_signals": ["High CPU Usage by Chrome"],
  "risk_score": 95,
  "timestamp": "2026-10-09T00:00:00Z"
}

try:
    r = requests.post("http://127.0.0.1:8000/api/incidents?is_simulation=true", json=payload)
    print("Status:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", e)
