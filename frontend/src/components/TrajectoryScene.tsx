import { useRef, useEffect, useMemo } from 'react';
import { Viewer, Entity, PolylineGraphics, Scene, Globe, PointGraphics } from 'resium';
import { 
  Cartesian3, 
  Color, 
  JulianDate, 
  SampledPositionProperty, 
  TimeIntervalCollection, 
  TimeInterval, 
  VelocityOrientationProperty,
  createOsmBuildingsAsync,
  CallbackProperty
} from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

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

  // 1. Initialize environment only once on mount
  useEffect(() => {
    if (viewerRef.current && viewerRef.current.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      
      // Add OSM Buildings once
      createOsmBuildingsAsync().then((buildings) => {
        viewer.scene.primitives.add(buildings);
      });
    }
  }, []);

  // 2. State to hold Cesium objects without recreation
  const [sceneContext, setSceneContext] = useState<{
    positionProperty: SampledPositionProperty | null;
    orientationProperty: VelocityOrientationProperty | null;
    startTime: JulianDate | null;
    stopTime: JulianDate | null;
  }>({
    positionProperty: null,
    orientationProperty: null,
    startTime: null,
    stopTime: null,
  });

  const polylinePositionsRef = useRef<Cartesian3[]>([]);
  const initializedRef = useRef(false);

  const polylineCallback = useMemo(() => {
    return new CallbackProperty(() => polylinePositionsRef.current, false);
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) {
      initializedRef.current = false;
      polylinePositionsRef.current = [];
      setSceneContext({
        positionProperty: null,
        orientationProperty: null,
        startTime: null,
        stopTime: null,
      });
      return;
    }

    if (!initializedRef.current) {
      const start = JulianDate.now();
      const property = new SampledPositionProperty();
      const positions: Cartesian3[] = [];
      let stop = start;

      data.forEach((pt) => {
        const time = JulianDate.addSeconds(start, pt.time, new JulianDate());
        const position = Cartesian3.fromDegrees(pt.lon, pt.lat, pt.alt);
        property.addSample(time, position);
        positions.push(position);
        stop = time;
      });

      const orientation = new VelocityOrientationProperty(property);
      polylinePositionsRef.current = positions;

      setSceneContext({
        positionProperty: property,
        orientationProperty: orientation,
        startTime: start,
        stopTime: stop
      });
      initializedRef.current = true;
    }
  }, [data]);

  // Imperative real-time telemetry receiver
  useEffect(() => {
    const handlePoint = (e: any) => {
      const pt = e.detail;
      if (!initializedRef.current || !sceneContext.positionProperty || !sceneContext.startTime) return;
      
      const time = JulianDate.addSeconds(sceneContext.startTime, pt.time, new JulianDate());
      const position = Cartesian3.fromDegrees(pt.lon, pt.lat, pt.alt);
      
      sceneContext.positionProperty.addSample(time, position);
      polylinePositionsRef.current.push(position);
      
      setSceneContext(prev => ({ ...prev, stopTime: time }));
    };

    window.addEventListener('telemetry_point', handlePoint);
    return () => window.removeEventListener('telemetry_point', handlePoint);
  }, [sceneContext]);

  const { positionProperty, orientationProperty, startTime, stopTime } = sceneContext;

  // 3. Adjust view and clock when simulation data is loaded
  useEffect(() => {
    if (viewerRef.current && viewerRef.current.cesiumElement && data.length > 0) {
      const viewer = viewerRef.current.cesiumElement;
      
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
      
      // Sync clock with the simulation time axis
      if (startTime && stopTime) {
        viewer.clock.startTime = startTime.clone();
        viewer.clock.stopTime = stopTime.clone();
        viewer.clock.currentTime = startTime.clone();
        viewer.clock.clockRange = 1; // LOOP_STOP
        viewer.clock.multiplier = 1;
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
        terrainProvider={undefined}
      >
        <Scene backgroundColor={Color.BLACK} />
        <Globe enableLighting={true} />
        
        {data.length > 0 && positionProperty && (
          <>
            {/* The Missile Entity (Represented by a point marker) */}
            <Entity
              position={positionProperty}
              orientation={orientationProperty}
              availability={new TimeIntervalCollection([
                new TimeInterval({ start: startTime!, stop: stopTime! })
              ])}
              tracked
            >
              {/* Point marker as a fallback for the 3D model */}
              <PointGraphics pixelSize={10} color={Color.YELLOW} outlineColor={Color.BLACK} outlineWidth={2} />
            </Entity>

            {/* The Trajectory Path */}
            <Entity>
              <PolylineGraphics
                positions={polylineCallback as any}
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
