import os
import json
import firebase_admin
from firebase_admin import credentials


if not firebase_admin._apps:
    firebase_json = os.getenv("FIREBASE_SERVICE_ACCOUNT")

    if not firebase_json:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT environment variable is not set"
        )

    try:
        firebase_info = json.loads(firebase_json)
    except json.JSONDecodeError as e:
        raise RuntimeError(
            "FIREBASE_SERVICE_ACCOUNT contains invalid JSON"
        ) from e

    cred = credentials.Certificate(firebase_info)

    firebase_admin.initialize_app(cred)