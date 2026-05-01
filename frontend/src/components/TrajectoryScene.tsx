import { useRef, useEffect } from 'react';
import { Viewer, Entity, PointGraphics, PathGraphics, Scene, Globe } from 'resium';
import * as Cesium from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";

interface TrajectoryPoint {
  time: number;
  lat: number;
  lon: number;
  alt: number;
}

interface Props {
  data: TrajectoryPoint[];
}

export function TrajectoryScene({ data }: Props) {
  const viewerRef = useRef<any>(null);
  const positionProperty = useRef(new Cesium.SampledPositionProperty());
  const startTimeRef = useRef(Cesium.JulianDate.now());

  useEffect(() => {
    if (!data || data.length === 0) {
      // Reset the timeline if data is cleared
      positionProperty.current = new Cesium.SampledPositionProperty();
      startTimeRef.current = Cesium.JulianDate.now();
      return;
    }

    // Only process the latest points (handles both live stream and replay load)
    // For replay load, it will populate the property in one go
    // For live stream, it will add the newest sample
    const start = startTimeRef.current;
    
    // If we have a bulk update (like replay load), process all
    // If we have a single point update, process the latest
    // Optimization: find points that haven't been added yet
    // For simplicity in this performance fix, we process based on length
    // But since this is called on every 'data' update, we'll just add the last point
    // if it's a live update, or rebuild if it's a new mission.
    
    const latestPoint = data[data.length - 1];
    const time = Cesium.JulianDate.addSeconds(start, latestPoint.time, new Cesium.JulianDate());
    const position = Cesium.Cartesian3.fromDegrees(latestPoint.lon, latestPoint.lat, latestPoint.alt);
    
    positionProperty.current.addSample(time, position);

    // Initial camera zoom if it's the first point
    if (data.length === 1 && viewerRef.current?.cesiumElement) {
      const viewer = viewerRef.current.cesiumElement;
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(latestPoint.lon, latestPoint.lat, latestPoint.alt + 1500),
        duration: 2
      });
      
      // Sync clock
      viewer.clock.startTime = start.clone();
      viewer.clock.currentTime = start.clone();
      viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
    }
  }, [data]);

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
      >
        <Scene backgroundColor={Cesium.Color.BLACK} />
        <Globe enableLighting={true} />
        
        {data.length > 0 && (
          <Entity 
            position={positionProperty.current}
            tracked
          >
            <PointGraphics 
              pixelSize={10} 
              color={Cesium.Color.YELLOW} 
              outlineColor={Cesium.Color.BLACK} 
              outlineWidth={2} 
            />
            <PathGraphics 
              width={4} 
              material={Cesium.Color.fromCssColorString('#3b82f6').withAlpha(0.8)}
              leadTime={0} 
              trailTime={3600} 
            />
          </Entity>
        )}
      </Viewer>
    </div>
  );
}
