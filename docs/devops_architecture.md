# DevOps Architecture for Trajectory Simulation

This document outlines the cloud-native deployment strategy for the Gravity-Compensation Trajectory Simulation System, ensuring it is scalable, reproducible, and highly available.

## 1. Container Structure (Docker)

The system is decoupled into isolated, lightweight containers:

1.  **`trajectory-backend` Image:** 
    *   **Base:** `python:3.11-slim`
    *   **Contents:** FastAPI application, Physics Engine (RK4), PID Controller logic.
    *   **Role:** Exposes the `/simulate` REST API. Mathematically intensive, stateless.
2.  **`trajectory-frontend` Image:** 
    *   **Base:** Multi-stage build using `node:20-alpine` (for compiling React) and `nginx:alpine` (for serving static assets).
    *   **Contents:** React Three Fiber 3D UI and telemetry dashboard.
    *   **Role:** Serves the client-side application. Extremely lightweight.

## 2. Kubernetes Deployment Model & Scaling

To support multiple simultaneous simulation requests without degrading performance, the system leverages Kubernetes (K8s).

*   **Deployments:**
    *   `backend-deployment`: Configured with `replicas: 3` (minimum) to handle baseline traffic.
    *   `frontend-deployment`: Configured with `replicas: 2` for high availability.
*   **Horizontal Pod Autoscaler (HPA):** 
    *   The backend is computationally heavy. The HPA monitors CPU utilization on the `trajectory-backend` pods. 
    *   If CPU usage exceeds 70%, the HPA automatically spins up additional backend pods to parallelize incoming physics simulations.
*   **Services:**
    *   `backend-svc`: A `ClusterIP` service providing internal load balancing across all healthy backend pods.
    *   `frontend-svc`: A `LoadBalancer` (or `Ingress`) exposing the web UI to the end user.

## 3. DevOps Architecture Diagram

```text
                           [ End User ]
                                │
                                ▼
                      ┌──────────────────┐
                      │ Ingress / Router │
                      └────────┬─────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │   Frontend Pod  │           │   Frontend Pod  │
       │ (Nginx / React) │           │ (Nginx / React) │
       └────────┬────────┘           └────────┬────────┘
                │                             │
                └──────────────┬──────────────┘
                               │ (REST POST /simulate)
                               ▼
                      ┌──────────────────┐
                      │  backend-svc     │ (Internal Load Balancer)
                      └────────┬─────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Backend Pod   │   │   Backend Pod   │   │   Backend Pod   │
│ (FastAPI / RK4) │   │ (FastAPI / RK4) │   │ (FastAPI / RK4) │
└─────────────────┘   └─────────────────┘   └─────────────────┘
         │                     │                     │
         └───────────┬─────────┴─────────┬───────────┘
                     ▼                   ▼
            ┌───────────────┐   ┌───────────────┐
            │   Prometheus  │   │    Grafana    │
            │  (Metrics DB) │   │  (Dashboards) │
            └───────────────┘   └───────────────┘
```

## 4. CI/CD Pipeline Workflow

The Continuous Integration and Continuous Deployment pipeline (e.g., GitHub Actions or GitLab CI) ensures code quality and automates delivery.

### Workflow Stages:
1.  **Code Commit:** Developer pushes code to the `main` branch.
2.  **Linting & Static Analysis:** Checks Python formatting (`flake8`) and React conventions (`eslint`).
3.  **Unit Testing:** Runs `pytest`. Validates the RK4 integrator, PID stability, and the Energy Consistency Checks to ensure physics math isn't broken.
4.  **Container Build:** Runs `docker build` for both the frontend and backend images.
5.  **Image Push:** Tags the images with the git commit SHA and pushes them to a container registry (e.g., Docker Hub or AWS ECR).
6.  **Deploy to Staging:** Uses `kubectl apply` or `Helm` to update the staging namespace with the new image tags. Runs automated integration tests against the live API.
7.  **Production Release:** Manual approval gate triggers the rollout to the production cluster.

## 5. Logging and Monitoring

*   **Prometheus:** Scrapes `/metrics` endpoints from the FastAPI backend to track API latency, error rates (HTTP 4xx/5xx), and simulation job durations.
*   **Grafana:** Visualizes the Prometheus metrics, allowing operators to monitor system health and HPA scaling events.
*   **Centralized Logging (e.g., ELK Stack / Fluentd):** Collects standard output (`stdout`) from all containers. If a specific trajectory simulation fails (e.g., a mathematical singularity or NaN value), the error and input parameters are logged for debugging and reproducibility.
