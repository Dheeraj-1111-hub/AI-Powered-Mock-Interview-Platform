import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

export function ThreeDGeometry() {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <ParticleGlobe />
      <AmbientParticles />
    </Float>
  );
}

function ParticleGlobe() {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create a sphere of particles
  const particleCount = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Golden ratio spiral for even distribution on a sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * (i + 0.5);
      
      const r = 3.5; // Radius of the globe
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [particleCount]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.15;
      pointsRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#818cf8"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function AmbientParticles({ count = 500 }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 10 - 2;
      const speed = 0.01 + Math.random() * 0.02;
      temp.push({ x, y, z, speed, initialY: y });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      particle.y += particle.speed;
      if (particle.y > 8) particle.y = -8; // Reset to bottom
      
      dummy.position.set(particle.x, particle.y, particle.z);
      const s = 1 + Math.sin(state.clock.elapsedTime * particle.speed * 10) * 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      
      if (mesh.current) {
        mesh.current.setMatrixAt(i, dummy.matrix);
      }
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.02, 4, 4]} />
      <meshBasicMaterial 
        color="#c7d2fe" 
        transparent 
        opacity={0.4} 
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}
