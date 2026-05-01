# Pre-Launch Missile Simulation Platform

A high-fidelity, physics-based 3D trajectory simulation system built with FastAPI, Redis/RQ, MongoDB, and Cesium.
This project simulates gravity-compensation and controlled 3D trajectories for research and engineering analysis.

## Quick Start (Docker)

1.  **Clone the repository**
2.  **Start the platform**:
    ```bash
    docker-compose up --build
    ```
3.  **Access the Dashboard**: Open `http://localhost` in your browser.

## Tech Stack

-   **Frontend**: React, Vite, Tailwind CSS, Resium (Cesium React wrappers), Lucide Icons, Recharts.
-   **Backend**: FastAPI, Redis, RQ (Redis Queue), MongoDB, NumPy.
-   **Infrastructure**: Docker, Docker Compose.

## Key Features

-   **Scalable Architecture**: Decoupled physics workers from the API using Redis task queues.
-   **Real-time Streaming**: Telemetry data streamed from worker to UI via WebSockets.
-   **3D Globe Visualization**: WGS84 projection, 3D terrain, and OSM buildings.
-   **Replay System**: Historical mission persistence in MongoDB with full playback capability.
-   **Mission Library**: Pre-defined flight templates for rapid testing.

## Local Development (No Docker)

### Backend
1.  Install dependencies: `pip install -r backend/requirements.txt`
2.  Start Redis and MongoDB.
3.  Run worker: `python backend/worker.py`
4.  Run API: `uvicorn backend.main:app --reload`

### Frontend
1.  Install dependencies: `npm install`
2.  Run dev server: `npm run dev`
