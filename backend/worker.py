# backend/worker.py
import os
import redis
import json
import numpy as np
from rq import Worker, Queue
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from physics.integrator import NumericalIntegrator, G_ACCEL
from physics.controller import GuidanceController
from physics.coordinates import local_to_wgs84
from pymongo import MongoClient

# Redis & Mongo setup
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

redis_conn = redis.from_url(REDIS_URL)
mongo_client = MongoClient(MONGO_URL)
db = mongo_client.trajectory_sim

def simulate_task(params_dict: dict, job_id: str):
    """Heavy lifting simulation task with real-time telemetry publishing."""
    params = type('Struct', (), params_dict)
    num_steps = int(params.duration / params.dt)
    
    integrator = NumericalIntegrator(
        mass=params.mass, 
        drag_coeff=params.drag_coeff, 
        reference_area=params.reference_area
    )
    
    max_thrust = params.mass * G_ACCEL * 4.0
    controller = GuidanceController(
        kp=params.kp, 
        kd=params.kd,
        max_thrust=max_thrust,
        mass=params.mass
    )
    
    pitch_rad = np.radians(params.launch_pitch)
    yaw_rad = np.radians(params.launch_yaw)
    
    vx_init = params.initial_speed * np.cos(pitch_rad) * np.cos(yaw_rad)
    vy_init = params.initial_speed * np.cos(pitch_rad) * np.sin(yaw_rad)
    vz_init = params.initial_speed * np.sin(pitch_rad)
    
    state = np.array([
        params.initial_position[0], 
        params.initial_position[1], 
        params.initial_position[2], 
        vx_init, vy_init, vz_init
    ])
    
    target_pos = np.array(params.target_position)
    trajectory = []
    
    # Save mission metadata to MongoDB
    db.missions.insert_one({
        "job_id": job_id,
        "params": params_dict,
        "status": "running",
        "timestamp": json.dumps(params_dict.get('timestamp', '')) # Placeholder
    })

    for step in range(num_steps):
        t = step * params.dt
        curr_pos = state[0:3]
        curr_vel = state[3:6]
        
        thrust_vector = controller.compute(
            current_position=curr_pos,
            current_velocity=curr_vel,
            target_position=target_pos,
            dt=params.dt,
            compensate_gravity=True
        )
        
        lat, lon, alt = local_to_wgs84(state[0], state[1], state[2])
        v_mag = np.linalg.norm(curr_vel)
        thrust_mag = np.linalg.norm(thrust_vector)
        dist_to_target = np.linalg.norm(curr_pos - target_pos)
        
        point = {
            "time": float(t),
            "x": float(state[0]),
            "y": float(state[1]),
            "z": float(state[2]),
            "lat": float(lat),
            "lon": float(lon),
            "alt": float(alt),
            "vx": float(state[3]),
            "vy": float(state[4]),
            "vz": float(state[5]),
            "v_mag": float(v_mag),
            "thrust_mag": float(thrust_mag),
            "dist_to_target": float(dist_to_target)
        }
        
        trajectory.append(point)
        
        # Publish real-time telemetry to Redis Pub/Sub
        redis_conn.publish(f"telemetry:{job_id}", json.dumps(point))
        
        state = integrator.step(state, thrust_vector, params.dt, method=params.integration_method)
        if state[2] < -0.1:
            break
            
    final_pos = state[0:3]
    metrics = {
        "time_of_flight": trajectory[-1]["time"],
        "max_altitude": float(max([p["z"] for p in trajectory])),
        "miss_distance": float(np.linalg.norm(final_pos - target_pos)),
        "final_velocity_mag": float(np.linalg.norm(state[3:6]))
    }
    
    result = {
        "metrics": metrics,
        "trajectory": trajectory
    }

    # Save final result to MongoDB
    db.replays.insert_one({
        "job_id": job_id,
        "result": result
    })
    
    db.missions.update_one({"job_id": job_id}, {"$set": {"status": "finished", "metrics": metrics}})
    
    return result

if __name__ == '__main__':
    worker = Worker(['default'], connection=redis_conn)
    worker.work()
