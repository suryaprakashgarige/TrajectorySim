# Pre-Launch Missile Simulation
## Using Docker, Kubernetes & CI/CD Pipelines

**Student:** SURYA PRAKASH GARIGE (25955A2101)  
**Course:** Flight Mechanics (AAED09)  
**Program:** BTech Aeronautical Engineering, 2nd Year  
**Institute:** Institute of Aeronautical Engineering (IARE), Hyderabad

---

## Project Overview

This project implements a **Pre-Launch Missile Simulation** as a distributed microservices system. Four independent subsystem validation services are containerized with Docker, orchestrated on Kubernetes, and continuously deployed via a GitHub Actions CI/CD pipeline.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
│                   (namespace: missile-sim)                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Guidance    │  │  Propulsion  │  │   Warhead    │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  │  :5001       │  │  :5002       │  │  :5003       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └────────────────┬┴──────────────────┘              │
│                          ▼                                  │
│              ┌───────────────────────┐                      │
│              │  Launch Authorization │                      │
│              │       Service         │                      │
│              │       :5000           │                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Local Development with Docker Compose

```bash
git clone https://github.com/suryaprakashgarige/TrajectorySim.git
cd TrajectorySim
docker-compose up --build
```

Access the launch authorization endpoint:
```bash
curl http://localhost:5000/launch/authorize
```

### Deploy to Kubernetes (Minikube)

```bash
# Start Minikube
minikube start --cpus=4 --memory=8192

# Apply all manifests
kubectl apply -f docs/kubernetes/namespace.yaml
kubectl apply -f docs/kubernetes/configmap.yaml
kubectl apply -f docs/kubernetes/guidance-deployment.yaml
kubectl apply -f docs/kubernetes/propulsion-deployment.yaml
kubectl apply -f docs/kubernetes/warhead-deployment.yaml
kubectl apply -f docs/kubernetes/launch-auth-deployment.yaml

# Check status
kubectl get pods -n missile-sim

# Access launch authorization
minikube service launch-auth-service -n missile-sim
```

## API Endpoints

| Service | Endpoint | Description |
|---------|----------|-------------|
| Guidance | `GET /guidance/status` | IMU alignment & GPS lock check |
| Propulsion | `GET /propulsion/status` | Propellant pressure & igniter check |
| Warhead | `GET /warhead/status` | Safety interlock validation |
| Launch Auth | `GET /launch/authorize` | Aggregated GO/NO-GO decision |
| All | `GET /health` | Kubernetes liveness probe |

## Example Response — GO

```json
{
  "decision": "GO",
  "timestamp": "2026-04-08T10:23:45.123Z",
  "message": "All systems nominal. Launch authorized.",
  "subsystems": [
    {"service": "guidance", "status": "PASS", "alignment_error_mrad": 0.32, "gps_lock": "LOCKED"},
    {"service": "propulsion", "status": "PASS", "pressure_bar": 49.8, "igniter_continuity": "OK"},
    {"service": "warhead", "status": "PASS", "interlock_state": "SAFE_ARMED"}
  ]
}
```

## Example Response — NO-GO

```json
{
  "decision": "NO-GO",
  "timestamp": "2026-04-08T10:24:12.456Z",
  "message": "1 subsystem(s) failed pre-launch validation.",
  "faults": ["Pressure 38.2 bar out of range or igniter OPEN_CIRCUIT"]
}
```

## Fault Injection Testing

Set `SIMULATION_MODE=fault` in the ConfigMap for any service to trigger its failure condition:

```bash
kubectl set env deployment/propulsion-service SIMULATION_MODE=fault -n missile-sim
curl http://localhost:5000/launch/authorize  # Should return NO-GO
```

## CI/CD Pipeline

The GitHub Actions pipeline at `.github/workflows/ci-cd.yml` automatically:
1. Runs unit and integration tests for all services
2. Builds Docker images tagged with commit SHA
3. Pushes to GitHub Container Registry (GHCR)
4. Deploys to Kubernetes with automatic rollback on failure

## Project Report

Full technical report: [`docs/Report.md`](docs/Report.md)  
Self-Assessment Form: [`docs/Self_Assessment_Form.md`](docs/Self_Assessment_Form.md)

---
*Institute of Aeronautical Engineering (IARE), Dundigal, Hyderabad — 2026*
