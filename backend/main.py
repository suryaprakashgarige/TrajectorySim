from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import redis
from rq import Queue
from rq.job import Job
import os
import json
import asyncio
from db import replays, missions
from worker import simulate_task

app = FastAPI(title="Pre-Launch Missile Simulation API")

# Redis configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_conn = redis.from_url(REDIS_URL)
q = Queue(connection=redis_conn)

# Dynamic CORS from K8s Environment Variables
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = allowed_origins_env.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Verify Redis is reachable
    redis_conn.ping()
    print("Startup: Redis connection verified.")

class SimulationParams(BaseModel):
    mass: float = 1.0
    initial_position: List[float] = [0.0, 0.0, 0.0]
    target_position: List[float] = [0.0, 0.0, 100.0]
    initial_speed: float = 0.0
    launch_pitch: float = 0.0
    launch_yaw: float = 0.0
    kp: float = 10.0
    kd: float = 5.0
    duration: float = 20.0
    dt: float = 0.02
    drag_coeff: float = 0.47
    reference_area: float = 0.01
    integration_method: str = "rk4"
    origin_lat: float = 17.3850
    origin_lon: float = 78.4867
    origin_alt: float = 542.0
    target_tolerance: float = 1.0
    velocity_tolerance: float = 0.5

@app.post("/simulate")
async def enqueue_simulation(params: SimulationParams):
    """Enqueues a simulation task and returns a job ID."""
    # Enqueue task without job_id (worker will retrieve it via get_current_job)
    job = q.enqueue(simulate_task, params.model_dump())
    return {"job_id": job.get_id()}

@app.get("/result/{job_id}")
async def get_result(job_id: str):
    """Fetches the result of a simulation job (from RQ or DB)."""
    # 1. Check if job is finished in RQ
    try:
        job = Job.fetch(job_id, connection=redis_conn)
        if job.is_finished:
            return job.result
        if job.is_failed:
            return {"status": "failed", "error": str(job.exc_info)}
    except:
        pass

    # 2. Check if result is in MongoDB (Persistence)
    result_doc = await replays.find_one({"job_id": job_id})
    if result_doc:
        return result_doc["result"]

    return {"status": "processing"}

@app.get("/replays")
async def list_replays():
    """Lists all historical mission summaries."""
    cursor = missions.find().sort("timestamp", -1).limit(50)
    docs = await cursor.to_list(length=50)
    for doc in docs:
        doc["_id"] = str(doc["_id"])
    return docs

@app.get("/replays/{job_id}")
async def get_replay(job_id: str):
    """Fetches a specific historical trajectory."""
    doc = await replays.find_one({"job_id": job_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Replay not found")
    return doc["result"]

@app.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    """Streams real-time telemetry from Redis Pub/Sub to the client."""
    await websocket.accept()
    pubsub = redis_conn.pubsub()
    pubsub.subscribe(f"telemetry:{job_id}")
    
    try:
        while True:
            # Check for messages from Redis
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                await websocket.send_text(message['data'].decode('utf-8'))
            
            # Check if job is finished to stop streaming
            try:
                job = Job.fetch(job_id, connection=redis_conn)
                if job.is_finished or job.is_failed:
                    break
            except:
                # If job not found in RQ, check if it's already in DB
                if await replays.find_one({"job_id": job_id}):
                    break

            await asyncio.sleep(0.01) # Small delay to avoid busy loop
    except WebSocketDisconnect:
        pass
    finally:
        pubsub.unsubscribe(f"telemetry:{job_id}")
        await websocket.close()

@app.get("/health")
async def health():
    return {"status": "healthy", "redis": redis_conn.ping()}
