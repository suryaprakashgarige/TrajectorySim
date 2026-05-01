# Performance and Output Metrics

This document defines the key performance indicators (KPIs) and output metrics calculated during or after a trajectory simulation. These metrics are crucial for evaluating flight characteristics and control system stability.

## 1. Range Calculation

**Definition:** The total horizontal distance traveled from the launch point to the point of termination.

**Formula:**
Given the initial ENU horizontal position $(x_0, y_0)$ and the final position $(x_f, y_f)$:

$$ Range = \sqrt{(x_f - x_0)^2 + (y_f - y_0)^2} $$

**Computation Method:**
Calculated post-simulation by extracting the first and last elements of the output trajectory array and applying the 2D Euclidean distance formula to the $X$ and $Y$ coordinates.

## 2. Maximum Altitude (Apogee)

**Definition:** The highest vertical point reached by the aerospace body during the simulation relative to the local origin.

**Formula:**

$$ Z_{max} = \max_{t \in [0, t_{end}]} z(t) $$

**Computation Method:**
Since the simulation outputs a discrete time-series array of states, the apogee is found by traversing the trajectory array and finding the maximum value of the $Z$ component:
```python
max_altitude = max(point.z for point in trajectory_array)
```

## 3. Time of Flight (ToF)

**Definition:** The total duration the body is in the air. For a hover system, this is simply the duration of the active simulation. For a ballistic trajectory, it is the time from launch until altitude $z(t) \le 0$.

**Formula:**

$$ ToF = t_{impact} - t_{launch} $$

**Computation Method:**
*   **Controlled Hover/Ascent:** Evaluated as `params.duration`.
*   **Freefall/Ballistic:** The physics engine continuously checks the condition $z \le 0$. Once this is met, the simulation loop breaks, and the ToF is the timestamp of the final state vector.

## 4. Velocity Profile

**Definition:** A time-series metric describing the magnitude of the velocity vector at any given moment.

**Formula:**
At any specific timestamp $t$, the speed is the magnitude of the 3D velocity vector:

$$ ||V(t)|| = \sqrt{v_x(t)^2 + v_y(t)^2 + v_z(t)^2} $$

**Computation Method:**
Calculated dynamically for every timestep during the simulation loop and appended to the output JSON alongside the raw Cartesian velocity components. This allows the frontend to plot a continuous Speed vs. Time graph without recalculating.

## 5. Stability Metrics for Hover

For a gravity-compensation system, calculating range is secondary to calculating control stability. The system evaluates how well the PID controller maintains the desired altitude.

### A. Steady-State Error ($e_{ss}$)
**Definition:** The difference between the target altitude and the actual altitude after the system has settled.
**Formula:** $e_{ss} = \lim_{t \to \infty} (z_{target} - z(t))$
**Computation Method:** Look at the average $z(t)$ over the final $10\%$ of the simulation duration.

### B. Maximum Overshoot ($M_p$)
**Definition:** The peak altitude achieved relative to the target altitude during the initial ascent phase.
**Formula:** $M_p = \frac{Z_{max} - z_{target}}{z_{target}} \times 100\%$
**Computation Method:** Find $Z_{max}$ using the logic in Section 2, then apply the formula.

### C. Settling Time ($T_s$)
**Definition:** The time required for the altitude to enter and remain within a specified error band (usually $\pm 2\%$) of the target altitude.
**Computation Method:**
Scan the trajectory array sequentially. Record the timestamp when the altitude first enters the range $[0.98 \cdot z_{target}, 1.02 \cdot z_{target}]$ and never leaves it for the remainder of the simulation.

### D. Energy Error Margin
**Definition:** As defined in the numerical solver documentation, mechanical energy must be conserved.
**Formula:** $E_{error} = | (KE(t) + PE(t)) - (KE(0) + PE(0) + W_{thrust} + W_{drag}) |$
**Computation Method:** This is computed at every timestep by the backend and logged to the frontend to mathematically prove simulation stability.
