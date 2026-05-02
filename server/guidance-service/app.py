from flask import Flask, jsonify
import os
import random

app = Flask(__name__)

ALIGNMENT_THRESHOLD = float(os.getenv("GUIDANCE_ALIGNMENT_THRESHOLD_MRAD", "0.5"))
SIM_MODE = os.getenv("SIMULATION_MODE", "nominal")

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "guidance-service"}), 200

@app.route("/guidance/status")
def guidance_status():
    if SIM_MODE == "fault":
        alignment_error = 1.8  # deliberately out of spec
        gps_lock = "UNLOCKED"
    else:
        alignment_error = round(random.uniform(0.1, 0.45), 3)
        gps_lock = "LOCKED"

    if alignment_error <= ALIGNMENT_THRESHOLD and gps_lock == "LOCKED":
        return jsonify({
            "status": "PASS",
            "alignment_error_mrad": alignment_error,
            "gps_lock": gps_lock
        }), 200
    else:
        return jsonify({
            "status": "FAIL",
            "fault": f"Guidance misalignment ({alignment_error} mrad) or GPS {gps_lock}",
            "alignment_error_mrad": alignment_error,
            "gps_lock": gps_lock
        }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
