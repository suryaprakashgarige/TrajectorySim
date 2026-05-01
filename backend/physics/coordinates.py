import numpy as np

EARTH_RADIUS = 6378137.0  # WGS84 semi-major axis
WGS84_FLATTENING = 1 / 298.257223563
EARTH_ECCENTRICITY_SQ = 2 * WGS84_FLATTENING - WGS84_FLATTENING**2

def lla_to_ecef(lat: float, lon: float, alt: float) -> np.ndarray:
    """
    Convert LLA (lat, lon, alt in degrees/meters) to ECEF.
    """
    lat_rad = np.radians(lat)
    lon_rad = np.radians(lon)
    
    sin_lat = np.sin(lat_rad)
    cos_lat = np.cos(lat_rad)
    sin_lon = np.sin(lon_rad)
    cos_lon = np.cos(lon_rad)
    
    n = EARTH_RADIUS / np.sqrt(1 - EARTH_ECCENTRICITY_SQ * sin_lat**2)
    
    x = (n + alt) * cos_lat * cos_lon
    y = (n + alt) * cos_lat * sin_lon
    z = (n * (1 - EARTH_ECCENTRICITY_SQ) + alt) * sin_lat
    
    return np.array([x, y, z])

def enu_to_ecef(x: float, y: float, z: float, origin_lat: float, origin_lon: float, origin_alt: float) -> np.ndarray:
    """
    Convert local ENU coordinates to ECEF.
    """
    origin_ecef = lla_to_ecef(origin_lat, origin_lon, origin_alt)
    
    lat_rad = np.radians(origin_lat)
    lon_rad = np.radians(origin_lon)
    
    sin_lat = np.sin(lat_rad)
    cos_lat = np.cos(lat_rad)
    sin_lon = np.sin(lon_rad)
    cos_lon = np.cos(lon_rad)
    
    # Rotation matrix from ENU to ECEF
    # R = [-sin_lon, -sin_lat*cos_lon, cos_lat*cos_lon]
    #     [ cos_lon, -sin_lat*sin_lon, cos_lat*sin_lon]
    #     [ 0,        cos_lat,         sin_lat        ]
    r = np.array([
        [-sin_lon, -sin_lat * cos_lon, cos_lat * cos_lon],
        [ cos_lon, -sin_lat * sin_lon, cos_lat * sin_lon],
        [ 0,        cos_lat,           sin_lat          ]
    ])
    
    enu = np.array([x, y, z])
    ecef_offset = r @ enu
    
    return origin_ecef + ecef_offset

def ecef_to_wgs84(ecef_vector: np.ndarray) -> tuple[float, float, float]:
    """
    Convert ECEF coordinates [x, y, z] to WGS84 [lat, lon, alt] using Olson's method.
    """
    x, y, z = ecef_vector[0], ecef_vector[1], ecef_vector[2]
    
    # Simple iterative or direct method
    # Here using a slightly more accurate direct approximation
    lon = np.degrees(np.arctan2(y, x))
    
    p = np.sqrt(x**2 + y**2)
    lat = np.degrees(np.arctan2(z, p * (1 - EARTH_ECCENTRICITY_SQ))) # Initial guess
    
    # One iteration is usually enough for most applications
    for _ in range(2):
        lat_rad = np.radians(lat)
        n = EARTH_RADIUS / np.sqrt(1 - EARTH_ECCENTRICITY_SQ * np.sin(lat_rad)**2)
        alt = p / np.cos(lat_rad) - n
        lat = np.degrees(np.arctan2(z, p * (1 - EARTH_ECCENTRICITY_SQ * (n / (n + alt)))))
        
    return lat, lon, alt

def local_to_wgs84(x: float, y: float, z: float, origin_lat: float, origin_lon: float, origin_alt: float) -> tuple[float, float, float]:
    """
    Directly converts local cartesian [x, y, z] to WGS84.
    Requires an explicit mission origin.
    """
    ecef = enu_to_ecef(x, y, z, origin_lat, origin_lon, origin_alt)
    return ecef_to_wgs84(ecef)
