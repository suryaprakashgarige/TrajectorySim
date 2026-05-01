# Numerical Solver for 3D Motion Simulation

This document outlines the numerical integration strategies implemented in the simulation platform to resolve the state variables of an aerospace body over time.

## 1. State Variables

The 3D motion is fully described by a 6-dimensional state vector $\vec{y}(t)$, consisting of position and velocity components in Cartesian coordinates:

$$ \vec{y}(t) = \begin{bmatrix} \vec{r}(t) \\ \vec{v}(t) \end{bmatrix} = \begin{bmatrix} x \\ y \\ z \\ v_x \\ v_y \\ v_z \end{bmatrix} $$

The derivative of the state vector with respect to time gives the rate of change (velocity and acceleration):

$$ \frac{d\vec{y}}{dt} = \vec{f}(t, \vec{y}) = \begin{bmatrix} \vec{v}(t) \\ \vec{a}(t) \end{bmatrix} = \begin{bmatrix} v_x \\ v_y \\ v_z \\ a_x \\ a_y \\ a_z \end{bmatrix} $$

where $\vec{a}(t) = \frac{1}{m}\sum \vec{F}(t, \vec{y})$.

## 2. Time Stepping Methods & Update Equations

The system supports two numerical integration methods: **Forward Euler** and **Runge-Kutta 4 (RK4)**.

### Forward Euler Method
A first-order method. Simple to implement but accumulates error linearly.

**Update Equation:**
$$ \vec{y}_{k+1} = \vec{y}_k + \Delta t \cdot \vec{f}(t_k, \vec{y}_k) $$

### Runge-Kutta 4 (RK4) Method
A fourth-order method. It samples the derivative at four points within the step interval to compute a weighted average, offering drastically higher precision for non-linear physics (like quadratic aerodynamic drag).

**Update Equations:**
$$ \vec{k}_1 = \vec{f}(t_k, \vec{y}_k) $$
$$ \vec{k}_2 = \vec{f}\left(t_k + \frac{\Delta t}{2}, \vec{y}_k + \frac{\Delta t}{2}\vec{k}_1\right) $$
$$ \vec{k}_3 = \vec{f}\left(t_k + \frac{\Delta t}{2}, \vec{y}_k + \frac{\Delta t}{2}\vec{k}_2\right) $$
$$ \vec{k}_4 = \vec{f}(t_k + \Delta t, \vec{y}_k + \Delta t \cdot \vec{k}_3) $$
$$ \vec{y}_{k+1} = \vec{y}_k + \frac{\Delta t}{6}(\vec{k}_1 + 2\vec{k}_2 + 2\vec{k}_3 + \vec{k}_4) $$

## 3. Algorithm Steps & Pseudocode

### Algorithm Steps
1. **Initialize State**: Define initial position $\vec{r}_0$ and velocity $\vec{v}_0$.
2. **Determine Forces**: At the current state, compute gravity, drag, and apply the PID-controlled thrust force.
3. **Calculate Derivative**: Divide net force by mass to get acceleration $\vec{a}_k$. Concatenate $\vec{v}_k$ and $\vec{a}_k$ to form $\vec{f}(t, \vec{y})$.
4. **Integration Step**: Apply the chosen numerical method (Euler or RK4) to compute $\vec{y}_{k+1}$.
5. **Update State**: Store $\vec{y}_{k+1}$ as the new current state.
6. **Repeat**: Loop until the simulation duration is reached.

### Pseudocode (RK4 Implementation)

```python
function compute_derivative(state, F_thrust):
    # Extract velocity from state
    v = state[3:5] 
    
    # Compute forces
    F_gravity = mass * [0, 0, -9.81]
    F_drag = -0.5 * rho * Cd * Area * norm(v) * v
    F_up = [0, 0, F_thrust]
    
    # Net force and acceleration
    F_net = F_gravity + F_drag + F_up
    a = F_net / mass
    
    # Return derivative vector [velocity, acceleration]
    return concatenate(v, a)

function rk4_step(state, F_thrust, dt):
    k1 = compute_derivative(state, F_thrust)
    k2 = compute_derivative(state + 0.5 * dt * k1, F_thrust)
    k3 = compute_derivative(state + 0.5 * dt * k2, F_thrust)
    k4 = compute_derivative(state + dt * k3, F_thrust)
    
    next_state = state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
    return next_state
```

## 4. Stability Considerations & Timestep Selection

### Stability Considerations
* **Energy Drift**: The Euler method is non-symplectic; it will artificially add or lose mechanical energy over time, especially in oscillatory systems (like a PID-controlled hover bounding around a setpoint).
* **Control Loop Aliasing**: If the integration timestep $\Delta t$ is larger than the characteristic response time of the PID controller, the system will overcorrect and become unstable (rapidly diverging oscillations).

### Timestep Selection Criteria
To ensure numerical stability, $\Delta t$ must be chosen based on:
1. **Nyquist-Shannon limit for the PID Controller**: $\Delta t \le \frac{1}{10 f_{n}}$ where $f_n$ is the natural frequency of the closed-loop system.
2. **Courant-Friedrichs-Lewy (CFL) analogue**: The step size must be small enough that the aerodynamic drag force does not completely reverse the velocity vector in a single step.

### Performance Tradeoffs

| Feature | Forward Euler | Runge-Kutta 4 (RK4) |
| :--- | :--- | :--- |
| **Computational Cost** | Low (1 force evaluation per step) | High (4 force evaluations per step) |
| **Accuracy** | $O(\Delta t)$ (First order) | $O(\Delta t^4)$ (Fourth order) |
| **Memory Footprint** | Minimal | Slightly higher (stores 4 intermediate states) |
| **Stability at large $\Delta t$** | Poor (diverges quickly) | Excellent (tolerates larger steps without energy blowup) |
| **Recommendation** | Real-time gaming, low-fidelity visuals | Scientific modeling, PID tuning, energy tracking |

Given the requirement for an accurate Energy Consistency Check, **RK4** is the default recommended solver for this platform.
