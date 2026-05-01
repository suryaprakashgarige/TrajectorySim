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

    def compute_acceleration(self, state: np.ndarray, thrust_vector: np.ndarray) -> np.ndarray:
        """
        Computes acceleration at a given state.
        a = F_net / m
        F_net = F_gravity + F_drag + Thrust
        """
        v = state[3:6]
        
        # 1. Gravity force vector (acting downwards on Z axis)
        F_gravity = np.array([0.0, 0.0, -self.mass * G_ACCEL])
        
        # 2. Compensation force (Thrust vector)
        F_compensation = thrust_vector
        
        # 3. Aerodynamic Drag force
        v_mag = np.linalg.norm(v)
        if v_mag > 1e-6 and self.drag_coeff > 0:
            # Speed-safe numerically stable drag
            F_drag = -0.5 * self.air_density * self.drag_coeff * self.reference_area * v_mag**2 * (v / v_mag)
        else:
            F_drag = np.zeros(3)
            
        F_net = F_gravity + F_compensation + F_drag
        acceleration = F_net / self.mass
        
        return acceleration

    def state_derivative(self, state: np.ndarray, thrust_vector: np.ndarray) -> np.ndarray:
        """
        Returns the derivative of the state vector: [vx, vy, vz, ax, ay, az]
        """
        v = state[3:6]
        a = self.compute_acceleration(state, thrust_vector)
        return np.concatenate((v, a))

    def step(self, state: np.ndarray, thrust_vector: np.ndarray, dt: float, method: str = 'rk4') -> np.ndarray:
        """
        Perform one integration step using the specified numerical method.
        """
        if method == 'euler':
            return self.euler_step(state, thrust_vector, dt)
        else:
            return self.rk4_step(state, thrust_vector, dt)

    def euler_step(self, state: np.ndarray, thrust_vector: np.ndarray, dt: float) -> np.ndarray:
        """
        Perform one Forward Euler integration step.
        y_k+1 = y_k + f(t_k, y_k) * dt
        """
        derivative = self.state_derivative(state, thrust_vector)
        return state + derivative * dt

    def rk4_step(self, state: np.ndarray, thrust_vector: np.ndarray, dt: float) -> np.ndarray:
        """
        Perform one Runge-Kutta 4 (RK4) integration step.
        y_k+1 = y_k + 1/6 * (k1 + 2k2 + 2k3 + k4) * dt
        """
        k1 = self.state_derivative(state, thrust_vector)
        k2 = self.state_derivative(state + 0.5 * dt * k1, thrust_vector)
        k3 = self.state_derivative(state + 0.5 * dt * k2, thrust_vector)
        k4 = self.state_derivative(state + dt * k3, thrust_vector)
        
        next_state = state + (dt / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)
        return next_state
