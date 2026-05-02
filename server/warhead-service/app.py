from flask import Flask, jsonify
import os

app = Flask(__name__)

INTERLOCK_CODE = os.getenv("WARHEAD_INTERLOCK_CODE", "SAFE_ARMED")
SIM_MODE = os.getenv("SIMULATION_MODE", "nominal")

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "warhead-service"}), 200

@app.route("/warhead/status")
def warhead_status():
    if SIM_MODE == "fault":
        interlock_state = "UNSAFE"
    else:
        interlock_state = INTERLOCK_CODE

    if interlock_state == INTERLOCK_CODE:
        return jsonify({
            "status": "PASS",
            "interlock_state": interlock_state
        }), 200
    else:
        return jsonify({
            "status": "FAIL",
            "fault": f"Warhead interlock in state '{interlock_state}', expected '{INTERLOCK_CODE}'",
            "interlock_state": interlock_state
        }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=False)
