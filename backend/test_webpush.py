import os
import json
from dotenv import load_dotenv
from database import db
from pywebpush import webpush, WebPushException

load_dotenv()
vapid_private_key = os.getenv("VAPID_PRIVATE_KEY")
vapid_subject = os.getenv("VAPID_SUBJECT")

subs = db.get_all_push_subscriptions()
if not subs:
    print("No subscriptions found!")
else:
    sub = subs[-1]
    print(f"Testing push to {sub['endpoint']}")
    try:
        webpush(
            subscription_info=sub,
            data="Hello World",
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": vapid_subject}
        )
        print("Success!")
    except WebPushException as ex:
        print("WebPushException:", repr(ex))
        if ex.response is not None:
            print("Response:", ex.response.text)
    except Exception as e:
        print("Other exception:", repr(e))
