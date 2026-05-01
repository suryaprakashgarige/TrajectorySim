class PIDController:
    def __init__(self, kp: float, ki: float, kd: float, output_limits: tuple[float, float] = (None, None)):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        
        self.output_min, self.output_max = output_limits
        
        self.integral = 0.0
        self.previous_error = 0.0

    def compute(self, setpoint: float, current_value: float, dt: float) -> float:
        """
        Compute the PID control output.
        u(t) = Kp * e(t) + Ki * integral(e(t)) + Kd * derivative(e(t))
        """
        if dt <= 0:
            return 0.0

        error = setpoint - current_value
        
        # Proportional term
        p_term = self.kp * error
        
        # Integral term
        self.integral += error * dt
        i_term = self.ki * self.integral
        
        # Derivative term
        derivative = (error - self.previous_error) / dt
        d_term = self.kd * derivative
        
        output = p_term + i_term + d_term
        
        # Apply output limits
        if self.output_min is not None and output < self.output_min:
            output = self.output_min
            # Anti-windup: stop integrating if output is saturated
            self.integral -= error * dt
        elif self.output_max is not None and output > self.output_max:
            output = self.output_max
            # Anti-windup
            self.integral -= error * dt
            
        self.previous_error = error
        
        return output
