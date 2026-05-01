import numpy as np

# Physical constants
G_ACCEL = 9.81  # m/s^2

class NumericalIntegrator:
    """
    Numerical integrator for aerospace state evolution supporting Euler and RK4 methods.
    State vector: [x, y, z, vx, vy, vz]
    """
    def __init__(self, mass: float, drag_coeff: float = 0.0, reference_area: float = 0.0, air_density: float = 1.225):
        self.mass = mass
        self.drag_coeff = drag_coeff
        self.reference_area = reference_area
        self.air_density = air_density

    def compute_acceleration(self, state: np.ndarray, F_up: float) -> np.ndarray:
        """
        Computes acceleration at a given state.
        a = F_net / m
        F_net = F_gravity + F_drag + F_up
        """
        v = state[3:6]
        
        # 1. Gravity force vector (acting downwards on Z axis)
        F_gravity = np.array([0.0, 0.0, -self.mass * G_ACCEL])
        
        # 2. Compensation force (Thrust/Levitation) vector (acting upwards on Z axis)
        F_compensation = np.array([0.0, 0.0, F_up])
        
        # 3. Aerodynamic Drag force
        v_mag = np.linalg.norm(v)
        if v_mag > 0 and self.drag_coeff > 0:
            drag_mag = 0.5 * self.air_density * self.drag_coeff * self.reference_area * v_mag
            F_drag = -drag_mag * v
        else:
            F_drag = np.zeros(3)
            
        F_net = F_gravity + F_compensation + F_drag
        acceleration = F_net / self.mass
        
        return acceleration

    def state_derivative(self, state: np.ndarray, F_up: float) -> np.ndarray:
        """
        Returns the derivative of the state vector: [vx, vy, vz, ax, ay, az]
        """
        v = state[3:6]
        a = self.compute_acceleration(state, F_up)
        return np.concatenate((v, a))

    def step(self, state: np.ndarray, F_up: float, dt: float, method: str = 'rk4') -> np.ndarray:
        """
        Perform one integration step using the specified numerical method.
        """
        if method == 'euler':
            return self.euler_step(state, F_up, dt)
        else:
            return self.rk4_step(state, F_up, dt)

    def euler_step(self, state: np.ndarray, F_up: float, dt: float) -> np.ndarray:
        """
        Perform one Forward Euler integration step.
        y_k+1 = y_k + f(t_k, y_k) * dt
        """
        derivative = self.state_derivative(state, F_up)
        return state + derivative * dt

    def rk4_step(self, state: np.ndarray, F_up: float, dt: float) -> np.ndarray:
        """
        Perform one Runge-Kutta 4 (RK4) integration step.
        y_k+1 = y_k + 1/6 * (k1 + 2k2 + 2k3 + k4) * dt
        """
        k1 = self.state_derivative(state, F_up)
        k2 = self.state_derivative(state + 0.5 * dt * k1, F_up)
        k3 = self.state_derivative(state + 0.5 * dt * k2, F_up)
        k4 = self.state_derivative(state + dt * k3, F_up)
        
        next_state = state + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
        return next_state
