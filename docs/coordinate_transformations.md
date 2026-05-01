# Coordinate Transformations for 3D Trajectory Systems

In a rigorous 3D aerospace simulation, tracking a body's position requires transitioning between localized physics calculations and global geospatial rendering. This document defines the three primary coordinate systems used and the mathematical pipeline to transform data between them.

## 1. Coordinate Systems Overview

### A. Local Tangent Plane (ENU - East, North, Up)
*   **Definition:** A localized 3D Cartesian system where the origin $(0,0,0)$ is a specific reference point on the Earth's surface (e.g., the launch pad).
    *   $x$-axis: Points East.
    *   $y$-axis: Points True North.
    *   $z$-axis: Points Up (perpendicular to the reference ellipsoid).
*   **When it is used:** Used directly by the **Physics Engine** (RK4/Euler integrator). Newtonian physics equations (gravity, thrust, drag) are easiest to compute in a flat, localized Cartesian frame without dealing with planetary curvature for short-range flights.

### B. Earth-Centered, Earth-Fixed (ECEF)
*   **Definition:** A global 3D Cartesian system with the origin $(0,0,0)$ at the center of mass of the Earth. The axes rotate with the Earth.
    *   $X$-axis: Intersects the sphere at $0^\circ$ latitude (Equator) and $0^\circ$ longitude (Prime Meridian).
    *   $Y$-axis: Intersects the sphere at $0^\circ$ latitude and $90^\circ$ East longitude.
    *   $Z$-axis: Points toward the North Pole.
*   **When it is used:** Serves as the critical **intermediary mathematical bridge** between local Cartesian distances (ENU) and spherical coordinates (Geodetic). 

### C. Geodetic Coordinates (WGS84)
*   **Definition:** The standard global positioning system representing locations via a reference ellipsoid (WGS84).
    *   $\phi$ (Latitude): Angle north/south of the equator.
    *   $\lambda$ (Longitude): Angle east/west of the Prime Meridian.
    *   $h$ (Altitude): Height above the reference ellipsoid.
*   **When it is used:** Used by the **3D Visualization UI** (e.g., placing the trajectory on a 3D Earth globe map) and user inputs/outputs.

---

## 2. Transformation Pipeline (Step-by-Step)

When the physics engine generates a trajectory point in the local ENU frame, it must be mapped to the globe.

**Pipeline:** `Local ENU` $\xrightarrow{\text{Step 1}}$ `Global ECEF` $\xrightarrow{\text{Step 2}}$ `Geodetic (Lat, Lon, Alt)`

---

## 3. Transformation Formulas

To perform these transformations, we define the WGS84 ellipsoid constants:
*   Semi-major axis ($a$) = $6378137.0$ m
*   Semi-minor axis ($b$) = $6356752.3142$ m
*   First eccentricity squared ($e^2$) = $1 - \frac{b^2}{a^2} \approx 0.00669437999$

Let the origin of the ENU system be located at a known geodetic coordinate: $(\phi_0, \lambda_0, h_0)$.

### Step 0: Reference Origin to ECEF
First, calculate the Prime Vertical Radius of Curvature ($N(\phi_0)$) at the origin:

$$ N(\phi_0) = \frac{a}{\sqrt{1 - e^2 \sin^2(\phi_0)}} $$

Convert the ENU origin $(\phi_0, \lambda_0, h_0)$ to ECEF coordinates $(X_0, Y_0, Z_0)$:

$$ X_0 = (N(\phi_0) + h_0) \cos\phi_0 \cos\lambda_0 $$
$$ Y_0 = (N(\phi_0) + h_0) \cos\phi_0 \sin\lambda_0 $$
$$ Z_0 = \left(N(\phi_0)(1 - e^2) + h_0\right) \sin\phi_0 $$

### Step 1: Local ENU $(x,y,z)$ to ECEF $(X,Y,Z)$
Given a simulated point in ENU $(x,y,z)$, we rotate it by the origin's latitude and longitude, and add the ECEF origin vector.

$$ \begin{bmatrix} X \\ Y \\ Z \end{bmatrix} = \begin{bmatrix} X_0 \\ Y_0 \\ Z_0 \end{bmatrix} + R_{ENU \to ECEF} \begin{bmatrix} x \\ y \\ z \end{bmatrix} $$

Where the rotation matrix $R$ is:

$$ R_{ENU \to ECEF} = \begin{bmatrix} -\sin\lambda_0 & -\sin\phi_0 \cos\lambda_0 & \cos\phi_0 \cos\lambda_0 \\ \cos\lambda_0 & -\sin\phi_0 \sin\lambda_0 & \cos\phi_0 \sin\lambda_0 \\ 0 & \cos\phi_0 & \sin\phi_0 \end{bmatrix} $$

### Step 2: ECEF $(X,Y,Z)$ to Geodetic $(\phi, \lambda, h)$
Converting back to Lat/Lon/Alt requires an iterative approach or a closed-form approximation (like Bowring's method), because latitude depends on altitude and vice versa.

**Longitude ($\lambda$):**
$$ \lambda = \arctan2(Y, X) $$

**Latitude ($\phi$) and Altitude ($h$):**
Let $p = \sqrt{X^2 + Y^2}$. 

*Iterative approach:*
1. Initial guess for latitude: $\phi_i = \arctan\left(\frac{Z}{p (1 - e^2)}\right)$
2. Calculate $N(\phi_i) = \frac{a}{\sqrt{1 - e^2 \sin^2\phi_i}}$
3. Calculate altitude: $h_i = \frac{p}{\cos\phi_i} - N(\phi_i)$
4. Improve latitude guess: $\phi_{i+1} = \arctan\left(\frac{Z}{p}\left(1 - e^2 \frac{N(\phi_i)}{N(\phi_i) + h_i}\right)^{-1}\right)$
5. Repeat steps 2-4 until the difference between $\phi_{i+1}$ and $\phi_i$ is below a tiny threshold (e.g., $10^{-12}$ radians).

The final converged values are the true Geodetic Coordinates $\phi$ (Latitude) and $h$ (Altitude).

*(Note: Radians must be converted to degrees for standard UI display: $\text{Degrees} = \text{Radians} \times \frac{180}{\pi}$)*
