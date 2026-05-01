import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';

interface TrajectoryPoint {
  time: number;
  x: number;
  y: number;
  z: number;
}

interface Props {
  data: TrajectoryPoint[];
}

function SceneContent({ data }: Props) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTimeRef = useRef(0);

  // Derive points for the full trajectory line
  const points = useMemo(() => {
    if (!data || data.length === 0) return [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0.01)];
    return data.map(pt => new THREE.Vector3(pt.x, pt.z, -pt.y)); // Note: Swapping Y and Z for 3D engine conventions
  }, [data]);

  // Reset animation when new data arrives
  useEffect(() => {
    if (data && data.length > 0) {
      startTimeRef.current = performance.now();
      setIsPlaying(true);
    }
  }, [data]);

  useFrame(() => {
    if (!isPlaying || !data || data.length === 0 || !sphereRef.current) return;
    
    // Calculate elapsed time (assuming realtime replay for now, or scaled)
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    
    // Find the current point based on elapsed time
    const currentPoint = data.find(pt => pt.time >= elapsed);
    
    if (currentPoint) {
      // Map physics coordinates to 3D scene coordinates
      // Physics Z is altitude, so we map it to Scene Y
      // Physics Y is North, map to Scene -Z
      sphereRef.current.position.set(currentPoint.x, currentPoint.z, -currentPoint.y);
    } else {
      // Reached the end
      const last = data[data.length - 1];
      sphereRef.current.position.set(last.x, last.z, -last.y);
      setIsPlaying(false);
    }
  });

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      
      <Grid infiniteGrid fadeDistance={50} sectionColor="#444" cellColor="#222" />
      
      {/* Target Altitude Line */}
      {data.length > 0 && (
         <Line
            points={[
              [-10, data[0].z + (data[data.length-1].z - data[0].z), -10],
              [10, data[0].z + (data[data.length-1].z - data[0].z), -10]
            ]} // Placeholder for target altitude plane/line
            color="red"
            lineWidth={1}
            dashed
            opacity={0.3}
            transparent
         />
      )}

      {/* Historical Path Line */}
      {points.length > 1 && (
        <Line 
          points={points}
          color="#3b82f6" 
          lineWidth={2}
        />
      )}

      {/* Moving Body */}
      <Sphere ref={sphereRef} args={[0.5, 32, 32]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#22c55e" roughness={0.2} metalness={0.8} />
      </Sphere>
    </>
  );
}

export function TrajectoryScene({ data }: Props) {
  return (
    <div className="w-full h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
      <Canvas camera={{ position: [15, 10, 15], fov: 45 }} shadows>
        <SceneContent data={data} />
      </Canvas>
    </div>
  );
}
