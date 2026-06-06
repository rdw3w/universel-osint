import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { cn } from '../lib/utils';

export function NetworkGlobe({ intensity = "normal" }: { intensity?: "normal" | "high" }) {
  return (
    <div className={cn("absolute inset-0 z-0 pointer-events-none", intensity === "high" ? "bg-red-950/20" : "bg-slate-950" )}>
      <Canvas camera={{ position: [0, 0, 1.2] }}>
        <Suspense fallback={null}>
          <Stars />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Stars(props: any) {
  const ref = useRef<any>(null);
  
  // Use a large array to simulate points.
  // Generate random points in a sphere.
  const sphere = random.inSphere(new Float32Array(8000), { radius: 1.8 });

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 8;
      ref.current.rotation.y -= delta / 12;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#10b981"
          size={0.007}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
      <Points ref={ref} positions={sphere as Float32Array} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#ef4444"
          size={0.003}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}
