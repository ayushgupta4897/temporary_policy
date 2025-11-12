'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Strategy& Brand Colors
const STRATEGYAND_COLORS = {
  accent: 0xC52A2F,
  maroon: 0xA32020,
  red: 0xD93954,
  darkGray: 0x333333,
  mediumGray: 0x737373,
  lightGray: 0x94a3af,
};

// 10 taxonomy category colors
const TAXONOMY_COLORS = [
  0xC52A2F, // Strategy& accent red
  0xA32020, // Strategy& maroon
  0xD93954, // Strategy& bright red
  0x8B4049, // Dark burgundy
  0xA64D55, // Rose
  0x7A3034, // Deep maroon
  0xBF6268, // Light rose
  0x663338, // Darkest red
  0xC97C81, // Pale red
  0x94565C, // Medium burgundy
];

interface ParticleSystemProps {
  count: number;
}

function ParticleSystem({ count }: ParticleSystemProps) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const time = useRef(0);
  const stage = useRef(0); // 0: chaos, 1: clustering, 2: graph, 3: intervention

  // Particle data
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const cluster = Math.floor(i / (count / 10)); // 10 clusters
      temp.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        targetPosition: new THREE.Vector3(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ),
        cluster,
        scale: Math.random() * 0.5 + 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, [count]);

  // Connection lines
  const lines = useRef<THREE.LineSegments>(null!);
  const lineGeometry = useMemo(() => new THREE.BufferGeometry(), []);
  const lineMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: 0xA32020,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  useFrame((state, delta) => {
    time.current += delta;

    // Stage progression (each stage lasts 3 seconds)
    const cycleDuration = 12;
    const cycleTime = time.current % cycleDuration;
    const newStage = Math.floor(cycleTime / 3);

    if (newStage !== stage.current) {
      stage.current = newStage;
    }

    const stageProgress = (cycleTime % 3) / 3;

    particles.forEach((particle, i) => {
      const { position, targetPosition, velocity, cluster, scale, phase } = particle;

      // Calculate target based on stage
      if (stage.current === 0) {
        // Stage 0: Chaotic brownian motion
        position.add(velocity);
        if (Math.random() < 0.05) {
          velocity.set(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
          );
        }
      } else if (stage.current === 1) {
        // Stage 1: Clustering into taxonomy categories
        const clusterAngle = (cluster / 10) * Math.PI * 2;
        const clusterRadius = 8;
        targetPosition.set(
          Math.cos(clusterAngle) * clusterRadius,
          Math.sin(clusterAngle) * clusterRadius,
          0
        );
        position.lerp(targetPosition, delta * 2);
      } else if (stage.current === 2) {
        // Stage 2: Form hierarchical graph structure
        const clusterAngle = (cluster / 10) * Math.PI * 2;
        const clusterRadius = 10;
        const childIndex = i % (count / 10);
        const childrenPerCluster = count / 10;
        const childAngle = (childIndex / childrenPerCluster) * Math.PI * 2;

        targetPosition.set(
          Math.cos(clusterAngle) * clusterRadius + Math.cos(childAngle) * 3,
          Math.sin(clusterAngle) * clusterRadius + Math.sin(childAngle) * 3,
          Math.sin(childIndex) * 2
        );
        position.lerp(targetPosition, delta * 1.5);
      } else if (stage.current === 3) {
        // Stage 3: Enhanced intervention ripple effect
        const dist = position.length();
        const ripplePhase = time.current * 2.5 + dist * 0.3;
        const rippleAmount = Math.sin(ripplePhase) * 0.6;
        const expandPulse = Math.sin(time.current * 1.5) * 0.2;

        position.y += rippleAmount * delta;

        // Keep base graph structure with expansion
        const clusterAngle = (cluster / 10) * Math.PI * 2;
        const clusterRadius = 10 + expandPulse;
        const childIndex = i % (count / 10);
        const childrenPerCluster = count / 10;
        const childAngle = (childIndex / childrenPerCluster) * Math.PI * 2;

        targetPosition.set(
          Math.cos(clusterAngle) * clusterRadius + Math.cos(childAngle) * (3 + expandPulse),
          Math.sin(clusterAngle) * clusterRadius + Math.sin(childAngle) * (3 + expandPulse),
          Math.sin(childIndex) * 2 + rippleAmount * 0.5
        );
        position.lerp(targetPosition, delta * 0.5);
      }

      // Update instance matrix
      dummy.position.copy(position);
      dummy.scale.setScalar(scale * (stage.current >= 2 ? 1.2 : 1));
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);

      // Update color based on stage and cluster
      const color = new THREE.Color();
      if (stage.current === 0) {
        color.setHex(STRATEGYAND_COLORS.lightGray);
      } else {
        color.setHex(TAXONOMY_COLORS[cluster]);
        if (stage.current === 3) {
          // Enhanced pulse effect during intervention
          const pulseBrightness = 1 + Math.sin(time.current * 3 + phase) * 0.5;
          color.multiplyScalar(pulseBrightness);
        }
      }
      mesh.current.setColorAt(i, color);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) {
      mesh.current.instanceColor.needsUpdate = true;
    }

    // Update connection lines opacity based on stage
    if (lines.current) {
      const targetOpacity = stage.current >= 2 ? 0.35 : 0;
      (lines.current.material as THREE.LineBasicMaterial).opacity = THREE.MathUtils.lerp(
        (lines.current.material as THREE.LineBasicMaterial).opacity,
        targetOpacity,
        delta * 2
      );
    }

    // Generate connection lines for graph stage
    if (stage.current >= 2 && lines.current) {
      const positions: number[] = [];
      const maxConnections = 3;

      particles.forEach((particle, i) => {
        const nearbyParticles = particles
          .filter((other, j) => {
            if (i === j) return false;
            const dist = particle.position.distanceTo(other.position);
            return dist < 6 && Math.abs(particle.cluster - other.cluster) <= 1;
          })
          .slice(0, maxConnections);

        nearbyParticles.forEach((other) => {
          positions.push(
            particle.position.x,
            particle.position.y,
            particle.position.z,
            other.position.x,
            other.position.y,
            other.position.z
          );
        });
      });

      lineGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      );
    }
  });

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial
          emissive={STRATEGYAND_COLORS.accent}
          emissiveIntensity={0.3}
          metalness={0.6}
          roughness={0.3}
        />
      </instancedMesh>
      <lineSegments ref={lines} geometry={lineGeometry} material={lineMaterial} />
    </group>
  );
}

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Gentle circular motion
    state.camera.position.x = Math.sin(t * 0.15) * 3;
    state.camera.position.y = Math.cos(t * 0.1) * 2;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#C52A2F" />
      <ParticleSystem count={600} />
      <CameraRig />
    </>
  );
}

export default function DSMSystemsAnimation() {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
