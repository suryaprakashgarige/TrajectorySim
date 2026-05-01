import asyncio
import websockets
import requests
import json
import time

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws"

payload = {
    "initial_position": [0, 0, 0],
    "target_position": [100, 50, 100],
    "initial_speed": 10,
    "launch_pitch": 45,
    "launch_yaw": 30,
    "duration": 5,
    "dt": 0.1
}

async def test_websocket_telemetry():
    print(f"Enqueuing simulation for WebSocket test...")
    response = requests.post(f"{BASE_URL}/simulate", json=payload)
    job_id = response.json().get("job_id")
    print(f"Job ID: {job_id}")

    print(f"Connecting to WebSocket: {WS_URL}/{job_id}...")
    try:
        async with websockets.connect(f"{WS_URL}/{job_id}") as websocket:
            packets_received = 0
            async for message in websocket:
                data = json.loads(message)
                if packets_received == 0:
                    print(f"First packet received: {data}")
                packets_received += 1
                if packets_received >= 5: # Just check if we get some data
                    break
            
            print(f"Successfully received {packets_received} telemetry packets via WebSocket.")
    except Exception as e:
        print(f"WebSocket test failed: {e}")

def test_db_persistence():
    print("Checking database persistence...")
    # List replays
    response = requests.get(f"{BASE_URL}/replays")
    replays = response.json()
    if len(replays) > 0:
        print(f"Found {len(replays)} historical missions in DB.")
        job_id = replays[0]['job_id']
        # Fetch specific replay
        res_response = requests.get(f"{BASE_URL}/replays/{job_id}")
        if res_response.status_code == 200:
            print(f"Successfully retrieved trajectory for JOB-{job_id}")
        else:
            print(f"Failed to retrieve trajectory for JOB-{job_id}")
    else:
        print("No historical missions found. Run a simulation first.")

if __name__ == "__main__":
    # Note: These tests require the full stack (Redis, Mongo, API, Worker) to be running.
    print("Starting Integration Tests...")
    test_db_persistence()
    asyncio.run(test_websocket_telemetry())
