import requests
import json
import time

BASE_URL = "http://localhost:8000"

payload = {
    "initial_position": [0, 0, 0],
    "target_position": [100, 50, 100],
    "initial_speed": 10,
    "launch_pitch": 45,
    "launch_yaw": 30,
    "duration": 5,
    "dt": 0.1
}

def test_async_simulation():
    print(f"Enqueuing simulation at {BASE_URL}/simulate...")
    try:
        response = requests.post(f"{BASE_URL}/simulate", json=payload)
        print(f"Enqueue Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Error: {response.text}")
            return

        job_id = response.json().get("job_id")
        print(f"Job enqueued. ID: {job_id}")

        # Polling for result
        max_retries = 10
        for i in range(max_retries):
            print(f"Polling for result (attempt {i+1})...")
            res_response = requests.get(f"{BASE_URL}/result/{job_id}")
            result = res_response.json()

            if "trajectory" in result:
                print("Simulation complete!")
                print(f"Metrics: {json.dumps(result['metrics'], indent=2)}")
                print(f"Trajectory Points: {len(result['trajectory'])}")
                return
            
            if result.get("status") == "failed":
                print(f"Simulation failed: {result.get('error')}")
                return
            
            print(f"Status: {result.get('status', 'processing')}...")
            time.sleep(2)
        
        print("Polling timed out.")

    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_async_simulation()
