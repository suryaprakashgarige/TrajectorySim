import numpy as np
from physics.integrator import NumericalIntegrator, G_ACCEL
from physics.controller import PIDController

def test_rk4_freefall():
    # Test freefall without drag or thrust
    mass = 1.0
    integrator = NumericalIntegrator(mass=mass, drag_coeff=0.0)
    
    state = np.array([0.0, 0.0, 100.0, 0.0, 0.0, 0.0]) # 100m high, 0 velocity
    dt = 1.0 # 1 second step
    
    # After 1 second of freefall, v_z should be -9.81
    # distance = 0.5 * g * t^2 = 4.905m
    next_state = integrator.step(state, F_up=0.0, dt=dt)
    
    assert np.isclose(next_state[5], -G_ACCEL, atol=0.01)
    assert np.isclose(next_state[2], 100.0 - 0.5 * G_ACCEL, atol=0.01)

def test_pid_controller_hover():
    # Test PID controller seeking a setpoint
    controller = PIDController(kp=10.0, ki=0.0, kd=0.0, output_limits=(0, 100))
    
    setpoint = 10.0
    current = 0.0
    dt = 0.1
    
    # Error is 10. P term is 10 * 10 = 100. Output limit max is 100.
    output = controller.compute(setpoint, current, dt)
    assert output == 100.0
    
    # Error is 0. P term is 0. Output is 0.
    current = 10.0
    output = controller.compute(setpoint, current, dt)
    assert output == 0.0

def test_hover_equilibrium():
    # Test that a force equal to gravity produces 0 acceleration
    mass = 2.0
    integrator = NumericalIntegrator(mass=mass, drag_coeff=0.0)
    state = np.array([0.0, 0.0, 10.0, 0.0, 0.0, 0.0])
    
    F_up = mass * G_ACCEL # Exact compensation force
    next_state = integrator.step(state, F_up=F_up, dt=0.1)
    
    # Position and velocity should remain completely unchanged
    assert np.allclose(next_state, state)
