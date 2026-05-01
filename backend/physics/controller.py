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
        Compute the 3D thrust vector.
        """
        error_vec = target_position - current_position
        distance = np.linalg.norm(error_vec)
        
        if distance < 1e-6:
            direction = np.zeros(3)
        else:
            direction = error_vec / distance
            
        # PD control on distance and velocity along the direction vector
        thrust_mag = self.kp * distance - self.kd * np.dot(current_velocity, direction)
        
        # Base thrust vector from PD control
        thrust_vector = thrust_mag * direction
        
        # Add gravity compensation if requested
        if compensate_gravity:
            from .integrator import G_ACCEL
            gravity_comp = np.array([0.0, 0.0, self.mass * G_ACCEL])
            thrust_vector += gravity_comp
            
        # Clamp total thrust magnitude to allowed limits
        total_mag = np.linalg.norm(thrust_vector)
        if total_mag > self.max_thrust:
            thrust_vector = (thrust_vector / total_mag) * self.max_thrust
        elif total_mag < 0: # Should not happen with norm but for safety
            thrust_vector = np.zeros(3)
            
        return thrust_vector
