"""
Full end-to-end push diagnostic.
Tests: VAPID key format, pywebpush call, provider response.
"""
import sqlite3, json, os, sys
from dotenv import load_dotenv

load_dotenv("../.env")

pk_path = os.getenv("VAPID_PRIVATE_KEY")
vapid_subject = os.getenv("VAPID_SUBJECT")
print("VAPID_PRIVATE_KEY path:", pk_path)
print("VAPID_SUBJECT:", vapid_subject)

# Read PEM key
if not pk_path or not os.path.isfile(pk_path):
    print("ERROR: Private key file not found at:", pk_path)
    sys.exit(1)

with open(pk_path, "r") as f:
    pk_content = f.read()

print("PEM key starts with:", pk_content[:40])
print("PEM key length:", len(pk_content))
print()

# Get latest subscription
conn = sqlite3.connect("incidents.db")
conn.row_factory = sqlite3.Row
rows = conn.execute("SELECT endpoint, keys_json FROM push_subscriptions ORDER BY created_at DESC LIMIT 1").fetchall()
if not rows:
    print("No subscriptions in DB!")
    sys.exit(1)

row = rows[0]
sub = json.loads(row["keys_json"])
print("Testing push to:", sub["endpoint"][:70], "...")
print("Sub keys present:", list(sub.get("keys", {}).keys()))
print()

# Try push
try:
    from pywebpush import webpush, WebPushException
    
    payload = json.dumps({
        "title": "Vision404 — Diagnostic Test",
        "body": "Testing push delivery pipeline",
        "url": "http://localhost:5173"
    })
    
    print("Sending push...")
    resp = webpush(
        subscription_info=sub,
        data=payload,
        vapid_private_key=pk_path,
        vapid_claims={"sub": vapid_subject}
    )
    print("SUCCESS! Response status:", resp.status_code if resp else "None")
    if resp:
        print("Response text:", resp.text[:200])
        
except WebPushException as ex:
    print("WebPushException:", repr(ex))
    if ex.response is not None:
        print("HTTP Status:", ex.response.status_code)
        print("Response body:", ex.response.text[:500])
except Exception as e:
    print("General Exception:", type(e).__name__, str(e))
