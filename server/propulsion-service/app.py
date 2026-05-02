from flask import Flask, jsonify
import os
import random

app = Flask(__name__)

PRESSURE_MIN = float(os.getenv("PROPELLANT_PRESSURE_MIN_BAR", "45.0"))
PRESSURE_MAX = float(os.getenv("PROPELLANT_PRESSURE_MAX_BAR", "55.0"))
SIM_MODE = os.getenv("SIMULATION_MODE", "nominal")

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "service": "propulsion-service"}), 200

@app.route("/propulsion/status")
def propulsion_status():
    if SIM_MODE == "fault":
        pressure = 38.2  # below minimum
        igniter = "OPEN_CIRCUIT"
    else:
        pressure = round(random.uniform(46.0, 54.0), 2)
        igniter = "OK"

    if PRESSURE_MIN <= pressure <= PRESSURE_MAX and igniter == "OK":
        return jsonify({
            "status": "PASS",
            "pressure_bar": pressure,
            "igniter_continuity": igniter
        }), 200
    else:
        return jsonify({
            "status": "FAIL",
            "fault": f"Pressure {pressure} bar out of range or igniter {igniter}",
            "pressure_bar": pressure,
            "igniter_continuity": igniter
        }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=False)
