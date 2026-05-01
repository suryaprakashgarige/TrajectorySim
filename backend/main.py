from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from physics.integrator import NumericalIntegrator, G_ACCEL
from physics.controller import PIDController

app = FastAPI(title="Gravity-Compensation Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimulationParams(BaseModel):
    mass: float = 1.0  # kg
    target_altitude: float = 10.0  # m
    kp: float = 5.0
    ki: float = 0.5
    kd: float = 10.0
    duration: float = 15.0  # seconds
    dt: float = 0.02  # seconds (50 Hz)
    drag_coeff: float = 0.47  # sphere
    reference_area: float = 0.01  # m^2
    integration_method: str = "rk4"

@app.post("/simulate")
async def run_simulation(params: SimulationParams):
    if params.duration <= 0 or params.dt <= 0:
        raise HTTPException(status_code=400, detail="Duration and dt must be positive.")
        
    num_steps = int(params.duration / params.dt)
    
    # Initialize physics
    integrator = NumericalIntegrator(
        mass=params.mass, 
        drag_coeff=params.drag_coeff, 
        reference_area=params.reference_area
    )
    
    # Initialize controller. 
    # Max upward force limit: maybe 3x gravity for a realistic quadcopter/thruster
    max_thrust = params.mass * G_ACCEL * 3.0
    controller = PIDController(
        kp=params.kp, 
        ki=params.ki, 
        kd=params.kd,
        output_limits=(0.0, max_thrust) # Cannot push downwards, only lift
    )
    
    # State: [x, y, z, vx, vy, vz]
    state = np.array([0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
    
    # Initial Energy (KE + PE)
    initial_energy = 0.0 # Since v=0 and z=0
    
    cumulative_work_thrust = 0.0
    cumulative_work_drag = 0.0
    
    trajectory = []
    
    for step in range(num_steps):
        t = step * params.dt
        altitude = state[2]
        
        # PID control based on altitude error
        feed_forward_force = params.mass * G_ACCEL
        
        pid_adjustment = controller.compute(setpoint=params.target_altitude, current_value=altitude, dt=params.dt)
        F_up = feed_forward_force + pid_adjustment
        
        # Enforce limits on total F_up
        if F_up < 0.0:
            F_up = 0.0
        elif F_up > max_thrust:
            F_up = max_thrust
            
        # Current velocities
        vx, vy, vz = state[3], state[4], state[5]
        v_mag = np.linalg.norm([vx, vy, vz])
        
        # Calculate Energies
        kinetic_energy = 0.5 * params.mass * (v_mag ** 2)
        potential_energy = params.mass * G_ACCEL * altitude
        total_energy = kinetic_energy + potential_energy
        
        # Calculate Work done over the step (using current velocity as approximation for dt)
        work_thrust_step = F_up * vz * params.dt
        
        # Drag force is -0.5 * rho * Cd * A * |v| * v
        # Work is F_drag . v * dt = -0.5 * rho * Cd * A * |v|^3 * dt
        work_drag_step = -0.5 * integrator.air_density * params.drag_coeff * params.reference_area * (v_mag ** 3) * params.dt
        
        cumulative_work_thrust += work_thrust_step
        cumulative_work_drag += work_drag_step
        
        energy_error = total_energy - initial_energy - cumulative_work_thrust - cumulative_work_drag
        
        # Log data point before step
        trajectory.append({
            "time": float(t),
            "x": float(state[0]),
            "y": float(state[1]),
            "z": float(state[2]),
            "vx": float(vx),
            "vy": float(vy),
            "vz": float(vz),
            "f_up": float(F_up),
            "altitude_error": float(params.target_altitude - altitude),
            "kinetic_energy": float(kinetic_energy),
            "potential_energy": float(potential_energy),
            "total_energy": float(total_energy),
            "energy_error": float(energy_error)
        })
        
        # Step physics
        state = integrator.step(state, F_up, params.dt, method=params.integration_method)

    return {"trajectory": trajectory}
