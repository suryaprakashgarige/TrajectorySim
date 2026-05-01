import numpy as np
import pytest
from physics.integrator import NumericalIntegrator, G_ACCEL
from physics.controller import GuidanceController
from physics.coordinates import local_to_wgs84, enu_to_ecef, ecef_to_wgs84

def test_rk4_freefall():
    """
    Test 1: Free fall
    - Zero thrust
    - Verify z(t) and vz(t) against gravity: v = g*t, d = 0.5*g*t^2
    """
    mass = 1.0
    integrator = NumericalIntegrator(mass=mass, drag_coeff=0.0)
    
    # State: [x, y, z, vx, vy, vz]
    state = np.array([0.0, 0.0, 100.0, 0.0, 0.0, 0.0])
    dt = 1.0 # 1 second step
    
    # Thrust is zero
    thrust_vector = np.zeros(3)
    
    next_state = integrator.step(state, thrust_vector, dt, method='rk4')
    
    # v_z should be -9.81 m/s
    assert np.isclose(next_state[5], -G_ACCEL, atol=0.01)
    # z should be 100 - 4.905 = 95.095 m
    assert np.isclose(next_state[2], 100.0 - 0.5 * G_ACCEL, atol=0.01)

def test_hover_equilibrium():
    """
    Test 2: Hover equilibrium
    - Thrust equals mg
    - Verify near-zero acceleration
    """
    mass = 2.0
    integrator = NumericalIntegrator(mass=mass, drag_coeff=0.0)
    state = np.array([0.0, 0.0, 10.0, 0.0, 0.0, 0.0])
    
    # Guidance controller should produce gravity compensation
    controller = GuidanceController(kp=0.0, kd=0.0, max_thrust=100.0, mass=mass)
    
    thrust_vector = controller.compute(
        current_position=state[0:3],
        current_velocity=state[3:6],
        target_position=state[0:3], # Target is current position
        dt=0.1,
        compensate_gravity=True
    )
    
    # Thrust should be exactly 2.0 * 9.81 = 19.62 upwards
    assert np.allclose(thrust_vector, [0.0, 0.0, mass * G_ACCEL])
    
    next_state = integrator.step(state, thrust_vector, dt=0.1)
    
    # Position and velocity should remain completely unchanged
    assert np.allclose(next_state, state, atol=1e-7)

def test_target_convergence():
    """
    Test 3: Target convergence
    - With damping enabled
    - Verify distance to target decreases
    """
    mass = 1.0
    integrator = NumericalIntegrator(mass=mass, drag_coeff=0.0)
    controller = GuidanceController(kp=10.0, kd=5.0, max_thrust=100.0, mass=mass)
    
    current_pos = np.array([0.0, 0.0, 0.0])
    target_pos = np.array([0.0, 0.0, 10.0])
    current_vel = np.array([0.0, 0.0, 0.0])
    
    state = np.concatenate((current_pos, current_vel))
    initial_dist = np.linalg.norm(target_pos - current_pos)
    
    # Take a few steps
    dt = 0.1
    for _ in range(5):
        thrust = controller.compute(state[0:3], state[3:6], target_pos, dt)
        state = integrator.step(state, thrust, dt)
        
    final_dist = np.linalg.norm(target_pos - state[0:3])
    
    # Distance should have decreased
    assert final_dist < initial_dist
    # Should have positive vertical velocity
    assert state[5] > 0

def test_drag_edge_case():
    """
    Test 4: Drag edge case
    - Zero velocity
    - Verify no NaNs and no force blow-up
    """
    mass = 1.0
    integrator = NumericalIntegrator(mass=mass, drag_coeff=0.5, reference_area=1.0)
    
    # State with zero velocity
    state = np.array([0.0, 0.0, 100.0, 0.0, 0.0, 0.0])
    
    # Compute acceleration
    accel = integrator.compute_acceleration(state, np.zeros(3))
    
    # Should be exactly [0, 0, -9.81] (only gravity)
    assert not np.any(np.isnan(accel))
    assert np.allclose(accel, [0.0, 0.0, -G_ACCEL])

def test_coordinate_round_trip():
    """
    Test 5: Coordinate round-trip
    - local -> ECEF -> WGS84
    - Verify outputs are finite and valid
    """
    origin_lat, origin_lon, origin_alt = 17.3850, 78.4867, 542.0
    x, y, z = 100.0, 200.0, 300.0
    
    # 1. To WGS84
    lat, lon, alt = local_to_wgs84(x, y, z, origin_lat, origin_lon, origin_alt)
    
    assert isinstance(lat, float)
    assert isinstance(lon, float)
    assert isinstance(alt, float)
    
    # 2. Check if the values are reasonable
    # For a 100m offset, lat/lon should be very close to origin
    assert np.isclose(lat, origin_lat, atol=0.01)
    assert np.isclose(lon, origin_lon, atol=0.01)
    # Altitude should be close to origin_alt + z
    assert np.isclose(alt, origin_alt + z, atol=1.0)
