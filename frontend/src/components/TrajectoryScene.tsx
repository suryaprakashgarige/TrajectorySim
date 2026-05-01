import { useRef, useEffect, useMemo } from 'react';
import { Viewer, Entity, PolylineGraphics, ModelGraphics, Scene, Globe, PointGraphics } from 'resium';
import { 
  Cartesian3, 
  Color, 
  JulianDate, 
  SampledPositionProperty, 
  TimeIntervalCollection, 
  TimeInterval, 
  VelocityOrientationProperty,
  createWorldTerrain,
  Ion,
  createOsmBuildings
} from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

// Note: In a real production app, the user would provide their own Ion token.
// Using a placeholder or default if available.

interface TrajectoryPoint {
  time: number;
  x: number;
  y: number;
  z: number;
  lat: number;
  lon: number;
  alt: number;
}

interface Props {
  data: TrajectoryPoint[];
}

export function TrajectoryScene({ data }: Props) {
  const viewerRef = useRef<any>(null);

  // 1. Create SampledPositionProperty for animation
  const { positionProperty, orientationProperty, startTime, stopTime, polylinePositions } = useMemo(() => {
    if (!data || data.length === 0) {
      return { 
        positionProperty: null, 
        orientationProperty: null, 
        startTime: null, 
        stopTime: null,
        polylinePositions: []
      };
    }

    const start = JulianDate.now();
    const property = new SampledPositionProperty();
    const positions: Cartesian3[] = [];

    data.forEach((pt) => {
      const time = JulianDate.addSeconds(start, pt.time, new JulianDate());
      const position = Cartesian3.fromDegrees(pt.lon, pt.lat, pt.alt);
      property.addSample(time, position);
      positions.push(position);
    });

    const stop = JulianDate.addSeconds(start, data[data.length - 1].time, new JulianDate());
    
    // Orientation based on velocity
    const orientation = new VelocityOrientationProperty(property);

    return { 
      positionProperty: property, 
      orientationProperty: orientation,
      startTime: start, 
      stopTime: stop,
      polylinePositions: positions
    };
  }, [data]);

  // 2. Adjust view and environment when data changes
  useEffect(() => {
    if (viewerRef.current && viewerRef.current.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      
      // Add OSM Buildings
      viewer.scene.primitives.add(createOsmBuildings());

      if (data.length > 0) {
        // Zoom to the start point
        const firstPoint = data[0];
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(firstPoint.lon, firstPoint.lat, firstPoint.alt + 1500),
          orientation: {
            pitch: -0.5,
            heading: 0
          },
          duration: 2
        });
        
        // Set clock range
        if (startTime && stopTime) {
          viewer.clock.startTime = startTime.clone();
          viewer.clock.stopTime = stopTime.clone();
          viewer.clock.currentTime = startTime.clone();
          viewer.clock.clockRange = 1; // LOOP_STOP
          viewer.clock.multiplier = 1;
        }
      }
    }
  }, [data, startTime, stopTime]);

  return (
    <div className="w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl">
      <Viewer 
        full 
        ref={viewerRef}
        timeline={true}
        animation={true}
        baseLayerPicker={false}
        geocoder={false}
        navigationHelpButton={false}
        homeButton={false}
        sceneModePicker={false}
        terrainProvider={createWorldTerrain()}
      >
        <Scene backgroundColor={Color.BLACK} />
        <Globe enableLighting={true} />
        
        {data.length > 0 && positionProperty && (
          <>
            {/* The Missile/Drone Entity */}
            <Entity
              position={positionProperty}
              orientation={orientationProperty}
              availability={new TimeIntervalCollection([
                new TimeInterval({ start: startTime!, stop: stopTime! })
              ])}
              tracked
            >
              {/* Drone 3D Model */}
              <ModelGraphics
                uri="https://assets.cesium.com/0/0/0/0/model.glb" // Placeholder URL, Cesium Ion assets are better
                minimumPixelSize={64}
                maximumScale={20000}
                runAnimations={true}
              />
              <PointGraphics pixelSize={8} color={Color.YELLOW} />
            </Entity>

            {/* The Trajectory Path */}
            <Entity>
              <PolylineGraphics
                positions={polylinePositions}
                width={4}
                material={Color.fromCssColorString('#3b82f6').withAlpha(0.8)}
              />
            </Entity>
            
            {/* Target Marker */}
            <Entity
              position={Cartesian3.fromDegrees(
                data[data.length-1].lon, 
                data[data.length-1].lat, 
                data[data.length-1].alt
              )}
            >
              <PointGraphics pixelSize={12} color={Color.RED} outlineColor={Color.WHITE} outlineWidth={2} />
            </Entity>
          </>
        )}
      </Viewer>
    </div>
  );
}
