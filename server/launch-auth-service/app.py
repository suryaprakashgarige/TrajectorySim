from flask import Flask, jsonify
import httpx
import asyncio
import os
from datetime import datetime, timezone

app = Flask(__name__)

GUIDANCE_URL = os.getenv("GUIDANCE_SERVICE_URL", "http://guidance-service/guidance/status")
PROPULSION_URL = os.getenv("PROPULSION_SERVICE_URL", "http://propulsion-service/propulsion/status")
WARHEAD_URL = os.getenv("WARHEAD_SERVICE_URL", "http://warhead-service/warhead/status")
TIMEOUT = float(os.getenv("TIMEOUT_SECONDS", "5"))

async def call_service(client, url, name):
    try:
        response = await client.get(url, timeout=TIMEOUT)
        data = response.json()
        data["service"] = name
        return data
    except Exception as e:
        return {"service": name, "status": "FAIL", "fault": f"Service timeout or unreachable: {str(e)}"}

async def run_parallel_checks():
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(
            call_service(client, GUIDANCE_URL, "guidance"),
            call_service(client, PROPUSLION_URL, "propulsion"),
            call_service(client, WARHEAD_URL, "warhead")
        )
    return results

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "launch-auth-service"}), 200

@app.route("/launch/authorize")
def launch_authorize():
    results = asyncio.run(run_parallel_checks())
    faults = [r for r in results if r.get("status") != "PASS"]
    timestamp = datetime.now(timezone.utc).isoformat()

    if not faults:
        return jsonify({
            "decision": "GO",
            "timestamp": timestamp,
            "subsystems": results,
            "message": "All systems nominal. Launch authorized."
        }), 200
    else:
        return jsonify({
            "decision": "NO-GO",
            "timestamp": timestamp,
            "subsystems": results,
            "faults": [f.get("fault", f"FAIL in {f['service']}") for f in faults],
            "message": f"{len(faults)} subsystem(s) failed pre-launch validation."
        }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
