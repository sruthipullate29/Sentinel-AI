import sqlite3, json, os
from dotenv import load_dotenv

load_dotenv("../.env")

# Check VAPID key
pk = os.getenv("VAPID_PRIVATE_KEY")
print("VAPID_PRIVATE_KEY:", repr(pk))
print("Is file?", os.path.isfile(pk) if pk else False)
print()

# Check subscriptions
conn = sqlite3.connect("incidents.db")
conn.row_factory = sqlite3.Row
rows = conn.execute("SELECT endpoint, keys_json FROM push_subscriptions").fetchall()
print(f"Subscriptions: {len(rows)}")
for r in rows:
    data = json.loads(r["keys_json"])
    print(" EP:", r["endpoint"][:70] + "...")
    print(" Top-level keys:", list(data.keys()))
    if "keys" in data:
        print(" Sub-keys:", list(data["keys"].keys()))
    else:
        print(" (no 'keys' sub-object)")
    print()
