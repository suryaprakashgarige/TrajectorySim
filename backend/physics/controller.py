import numpy as np

class GuidanceController:
    """
    3D Target-Based Guidance Controller.
    Computes a thrust vector to navigate to a target position.
    """
    def __init__(self, kp: float, kd: float, max_thrust: float, mass: float = 1.0):
        self.kp = kp
        self.kd = kd
        self.max_thrust = max_thrust
        self.mass = mass

    def compute(self, current_position: np.ndarray, current_velocity: np.ndarray, target_position: np.ndarray, dt: float, compensate_gravity: bool = True) -> np.ndarray:
        """
        Compute the 3D thrust vector using explicit damping and gravity compensation.
        """
        error_vec = target_position - current_position
        distance = np.linalg.norm(error_vec)
        
        # 1. Determine direction to target
        if distance < 1e-6:
            direction = np.zeros(3)
        else:
            direction = error_vec / distance
            
        # 2. PD control on distance and velocity projected along the target direction
        # v_proj is the component of velocity heading TOWARDS or AWAY from the target
        v_proj = np.dot(current_velocity, direction)
        
        # P term on distance, D term on velocity damping along the path
        thrust_mag = self.kp * distance - self.kd * v_proj
        
        # 3. Base thrust vector from controlled magnitude
        thrust_vector = thrust_mag * direction
        
        # 4. Add gravity compensation as a feedforward term
        if compensate_gravity:
            from .integrator import G_ACCEL
            gravity_comp = np.array([0.0, 0.0, self.mass * G_ACCEL])
            thrust_vector += gravity_comp
            
        # 5. Clamp final thrust vector magnitude to allowed limits
        total_mag = np.linalg.norm(thrust_vector)
        if total_mag > self.max_thrust:
            thrust_vector = (thrust_vector / total_mag) * self.max_thrust
        elif total_mag < 0:
            thrust_vector = np.zeros(3)
            
        return thrust_vector
