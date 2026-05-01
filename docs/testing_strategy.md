# Testing Strategy for Physics-Based Trajectory Simulation

This document outlines the comprehensive test plan to ensure the accuracy, stability, and performance of the 3D trajectory simulation system. Because this is a scientific computing platform, validating the physics math against analytical truth is just as important as standard software integration testing.

## 1. Test Plan Overview

The testing strategy is divided into four distinct phases:
1.  **Unit Testing (Physics Equations):** Isolated testing of the numerical integrator and PID controller.
2.  **Validation Testing (Analytical Cases):** Proving the numerical output matches classical closed-form physics equations.
3.  **Integration Testing (API & Vis):** Ensuring the backend REST API and frontend 3D visualizer map data correctly.
4.  **Performance Testing (Load & Profiling):** Verifying the system can handle concurrent simulations and heavy frontend rendering.

---

## 2. Unit Testing for Physics Equations

Unit tests (written in `pytest`) isolate the mathematical functions from the rest of the application.

### Objectives:
*   Ensure force calculations (gravity, drag) yield expected vectors.
*   Verify the PID controller calculates Proportional, Integral, and Derivative terms correctly without windup.

### Example Test Cases:
*   **Test: Drag Force Vector Direction**
    *   *Input:* Body moving strictly North ($V_y = 100$).
    *   *Assert:* Drag force vector must have $F_y < 0$ and $F_x, F_z = 0$.
*   **Test: PID Controller Anti-Windup**
    *   *Input:* Simulate a massive target altitude error where output clamps to `F_max` for 10 seconds.
    *   *Assert:* The internal integral accumulator does not exceed the threshold necessary to output `F_max`, ensuring immediate recovery when the error decreases.

---

## 3. Validation Against Known Analytical Cases

Because numerical integration (Euler/RK4) is an approximation, the system must be validated against closed-form analytical solutions to prove its scientific rigor.

### Objectives:
*   Ensure the integration step size ($\Delta t$) is appropriate.
*   Prove the system conserves energy.

### Example Test Cases:
*   **Test: Freefall in a Vacuum (No Drag)**
    *   *Condition:* Drop object from $1000m$ with $V_{z, initial} = 0$, $C_d = 0$, and thrust $= 0$.
    *   *Analytical Truth:* $z(t) = z_0 - \frac{1}{2}gt^2$. At $t = 10s$, $z$ must equal $1000 - 0.5(9.81)(100) = 509.5m$.
    *   *Assert:* Simulated altitude at $t=10$ matches $509.5m$ within a $0.1\%$ margin of error (RK4 should pass, Euler might need a tiny $\Delta t$).
*   **Test: Hover Equilibrium (Force Balance)**
    *   *Condition:* Object mass $= 2kg$, initial altitude $= 10m$. Set PID to bypass and explicitly command a constant $F_{up} = 19.62N$ ($m \cdot g$).
    *   *Assert:* Acceleration $a_z = 0$, Velocity $v_z = 0$, and Altitude remains exactly $10.0m$ for the entire duration.

---

## 4. Integration Tests for API and Visualization

Integration tests ensure the decoupled services communicate correctly and data transforms are applied accurately.

### Objectives:
*   Verify the API rejects malformed parameters and returns HTTP 400.
*   Verify coordinate mapping from the backend (Z-Up) to the frontend Engine (Y-Up).

### Example Test Cases:
*   **Test: API Payload Validation**
    *   *Action:* POST to `/simulate` with a negative mass ($-5.0$).
    *   *Assert:* API returns HTTP 400 Bad Request (via Pydantic validation).
*   **Test: Coordinate Transformation Mapping**
    *   *Action:* Mock backend response where altitude ($z$) increases from $0$ to $100$.
    *   *Assert:* The frontend interpolation logic correctly assigns these values to the 3D Engine's $Y$-axis.

---

## 5. Performance Testing

Performance testing ensures the platform behaves correctly under load, fulfilling the "cloud-native" requirement.

### Objectives:
*   Verify the backend can compute long-duration simulations rapidly.
*   Verify the frontend browser does not crash under high vertex counts.

### Example Test Cases:
*   **Test: High-Frequency Simulation Load (Backend)**
    *   *Action:* Request a 1-hour simulation ($duration = 3600$) with a high-fidelity timestep ($\Delta t = 0.001$).
    *   *Assert:* The backend computes the $3.6$ million steps and returns the payload in under $2$ seconds.
*   **Test: Concurrent User Load (Kubernetes HPA)**
    *   *Action:* Use `Locust` to send 500 concurrent `/simulate` POST requests.
    *   *Assert:* Average response time stays under $500ms$, and Kubernetes automatically scales the backend pods from 3 to the required amount.
