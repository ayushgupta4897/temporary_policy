'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MorphingParticleField, { ShapeGenerator } from './MorphingParticleField';

// Dynamically import the Globe component
const SystemCompassGlobe = dynamic(() => import('./SystemCompassGlobe'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">
    <div className="text-white/50 animate-pulse">Loading visualization...</div>
  </div>
});

// System Compass themed shapes - focused on networks, graphs, systems
const systemCompassShapes: ShapeGenerator[] = [
  {
    name: 'Network Graph',
    generate: (index, total, radius) => {
      // Network with central hub and radiating nodes
      const t = index / total;
      const isHub = index < total * 0.1; // 10% are hub nodes

      if (isHub) {
        // Central cluster
        const angle = t * Math.PI * 2 * 10;
        return {
          x: Math.cos(angle) * radius * 0.3,
          y: Math.sin(angle) * radius * 0.3,
          z: (Math.random() - 0.5) * radius * 0.2
        };
      } else {
        // Peripheral nodes in rings
        const ring = Math.floor((t - 0.1) * 4);
        const angleInRing = ((t - 0.1) * 4 % 1) * Math.PI * 2;
        const ringRadius = radius * (0.6 + ring * 0.2);
        return {
          x: Math.cos(angleInRing) * ringRadius,
          y: Math.sin(angleInRing) * ringRadius,
          z: Math.sin(ring) * radius * 0.4
        };
      }
    }
  },
  {
    name: 'Causal Flow',
    generate: (index, total, radius) => {
      // Flowing river of causality - left to right flow
      const t = index / total;
      const flowX = (t - 0.5) * radius * 2.5;
      const wavePhase = t * Math.PI * 6;
      const streamY = Math.sin(wavePhase) * radius * 0.6;
      const streamZ = Math.cos(wavePhase * 2) * radius * 0.4;
      return { x: flowX, y: streamY, z: streamZ };
    }
  },
  {
    name: 'Interconnected Web',
    generate: (index, total, radius) => {
      // Dense mesh representing interconnected systems
      const layers = 5;
      const nodesPerLayer = Math.ceil(total / layers);
      const layer = Math.floor(index / nodesPerLayer);
      const nodeInLayer = index % nodesPerLayer;
      const angleInLayer = (nodeInLayer / nodesPerLayer) * Math.PI * 2;

      return {
        x: Math.cos(angleInLayer) * radius * 0.8,
        y: (layer - layers / 2) * (radius * 0.4),
        z: Math.sin(angleInLayer) * radius * 0.8
      };
    }
  },
  {
    name: 'Feedback Loops',
    generate: (index, total, radius) => {
      // Multiple circular feedback loops
      const t = index / total;
      const loopCount = 3;
      const loop = Math.floor(t * loopCount);
      const angleInLoop = (t * loopCount % 1) * Math.PI * 2;
      const loopRadius = radius * 0.6;
      const loopOffset = (loop - 1) * radius * 0.6;

      return {
        x: Math.cos(angleInLoop) * loopRadius + loopOffset,
        y: Math.sin(angleInLoop) * loopRadius,
        z: Math.sin(angleInLoop * 3) * radius * 0.3
      };
    }
  },
  {
    name: 'Tree Hierarchy',
    generate: (index, total, radius) => {
      // Hierarchical tree structure (decision tree)
      const t = index / total;
      const depth = Math.floor(t * 5); // 5 levels
      const nodesAtDepth = Math.pow(2, depth);
      const positionInDepth = (t * 5 % 1) * nodesAtDepth;

      return {
        x: (positionInDepth - nodesAtDepth / 2) * (radius * 0.3),
        y: -radius + depth * (radius * 0.4),
        z: Math.sin(positionInDepth * Math.PI) * radius * 0.2
      };
    }
  },
  {
    name: 'System Dynamics',
    generate: (index, total, radius) => {
      // Circular attractor with spiraling orbits
      const t = index / total;
      const spiralAngle = t * Math.PI * 12;
      const spiralRadius = (Math.sin(t * Math.PI * 3) + 1) * radius * 0.5;

      return {
        x: Math.cos(spiralAngle) * spiralRadius,
        y: Math.sin(spiralAngle) * spiralRadius,
        z: (t - 0.5) * radius * 0.8
      };
    }
  },
  {
    name: 'Node Clusters',
    generate: (index, total, radius) => {
      // Multiple clustered groups (representing subsystems)
      const t = index / total;
      const clusterCount = 6;
      const cluster = Math.floor(t * clusterCount);
      const clusterAngle = (cluster / clusterCount) * Math.PI * 2;
      const clusterDistance = radius * 0.8;
      const withinCluster = (t * clusterCount % 1);
      const subAngle = withinCluster * Math.PI * 2;

      return {
        x: Math.cos(clusterAngle) * clusterDistance + Math.cos(subAngle) * radius * 0.25,
        y: Math.sin(clusterAngle) * clusterDistance + Math.sin(subAngle) * radius * 0.25,
        z: Math.sin(withinCluster * Math.PI * 4) * radius * 0.3
      };
    }
  }
];

export default function SystemCompassParticles() {
  const [useGlobe, setUseGlobe] = useState(true);

  return (
    <div className="relative w-full h-full">
      {/* Toggle button */}
      <button
        onClick={() => setUseGlobe(!useGlobe)}
        className="absolute top-4 right-4 z-10 px-3 py-1.5 text-xs font-medium bg-dark-600/80 hover:bg-dark-500/80 text-strategyand-off-white/90 rounded-lg border border-dark-400/50 backdrop-blur-sm transition-colors"
        title={useGlobe ? "Switch to Particle Field" : "Switch to Globe View"}
      >
        {useGlobe ? "3D Globe" : "Particles"}
      </button>

      {/* Visualization */}
      {useGlobe ? (
        <SystemCompassGlobe />
      ) : (
        <MorphingParticleField
          shapes={systemCompassShapes}
          particleCount={450}
          morphInterval={5000}
          colors={['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE']}
          connectionDistance={90}
          rotationSpeed={{ x: 0.002, y: 0.004, z: 0.001 }}
        />
      )}
    </div>
  );
}
