'use client';

import MorphingParticleField, { ShapeGenerator } from './MorphingParticleField';

// Contextual Web Search themed shapes - focused on search, web crawling, knowledge extraction
const contextualSearchShapes: ShapeGenerator[] = [
  {
    name: 'Search Beams',
    generate: (index, total, radius) => {
      // Radiating search beams from center
      const t = index / total;
      const beamCount = 12;
      const beam = Math.floor(t * beamCount);
      const progressInBeam = (t * beamCount % 1);
      const angle = (beam / beamCount) * Math.PI * 2;
      const distance = progressInBeam * radius * 1.6;

      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: Math.sin(progressInBeam * Math.PI) * radius * 0.2
      };
    }
  },
  {
    name: 'Web Crawler',
    generate: (index, total, radius) => {
      // Spider web pattern crawling outward
      const t = index / total;
      const rings = 8;
      const ring = Math.floor(t * rings);
      const angleInRing = (t * rings % 1) * Math.PI * 2 * (ring + 1);
      const ringRadius = (ring + 1) / rings * radius * 1.2;

      return {
        x: Math.cos(angleInRing) * ringRadius,
        y: Math.sin(angleInRing) * ringRadius,
        z: Math.sin(ring * Math.PI / 4) * radius * 0.3
      };
    }
  },
  {
    name: 'Knowledge Graph',
    generate: (index, total, radius) => {
      // Interconnected knowledge nodes in clusters
      const t = index / total;
      const clusters = 5;
      const cluster = Math.floor(t * clusters);
      const withinCluster = (t * clusters % 1);

      const clusterAngle = (cluster / clusters) * Math.PI * 2;
      const clusterDist = radius * 0.9;
      const nodeAngle = withinCluster * Math.PI * 2 * 3;
      const nodeRadius = Math.sqrt(withinCluster) * radius * 0.35;

      return {
        x: Math.cos(clusterAngle) * clusterDist + Math.cos(nodeAngle) * nodeRadius,
        y: Math.sin(clusterAngle) * clusterDist + Math.sin(nodeAngle) * nodeRadius,
        z: Math.sin(withinCluster * Math.PI * 4) * radius * 0.3
      };
    }
  },
  {
    name: 'Tier Pyramid',
    generate: (index, total, radius) => {
      // 30+ source tiers represented as pyramid layers
      const t = index / total;
      const tiers = 8;
      const tier = Math.floor(t * tiers);
      const withinTier = (t * tiers % 1);
      const tierWidth = (tiers - tier) / tiers * radius * 1.5;
      const tierAngle = withinTier * Math.PI * 2;

      return {
        x: Math.cos(tierAngle) * tierWidth,
        y: tier * radius * 0.3 - radius,
        z: Math.sin(tierAngle) * tierWidth
      };
    }
  },
  {
    name: 'Search Spiral',
    generate: (index, total, radius) => {
      // Spiral representing search depth
      const t = index / total;
      const spiralAngle = t * Math.PI * 8;
      const spiralRadius = t * radius * 1.4;
      const spiralHeight = (t - 0.5) * radius * 1.2;

      return {
        x: Math.cos(spiralAngle) * spiralRadius,
        y: spiralHeight,
        z: Math.sin(spiralAngle) * spiralRadius
      };
    }
  },
  {
    name: 'Query Expansion',
    generate: (index, total, radius) => {
      // Expanding query terms radiating from center
      const t = index / total;
      const expansionWaves = 6;
      const wave = Math.floor(t * expansionWaves);
      const withinWave = (t * expansionWaves % 1);
      const waveAngle = withinWave * Math.PI * 2;
      const waveRadius = (wave + withinWave) / expansionWaves * radius * 1.3;

      return {
        x: Math.cos(waveAngle) * waveRadius,
        y: Math.sin(waveAngle) * waveRadius,
        z: Math.sin(wave * Math.PI) * radius * 0.3
      };
    }
  },
  {
    name: 'Source Matrix',
    generate: (index, total, radius) => {
      // 3D matrix of information sources
      const t = index / total;
      const gridSize = 7;
      const totalCells = gridSize * gridSize * gridSize;
      const cell = Math.floor(t * totalCells);

      const x = (cell % gridSize) - gridSize / 2;
      const y = Math.floor((cell / gridSize) % gridSize) - gridSize / 2;
      const z = Math.floor(cell / (gridSize * gridSize)) - gridSize / 2;

      const cellSize = radius * 0.35;

      return {
        x: x * cellSize,
        y: y * cellSize,
        z: z * cellSize
      };
    }
  },
  {
    name: 'Context Waves',
    generate: (index, total, radius) => {
      // Contextual understanding waves
      const t = index / total;
      const waveX = (t - 0.5) * radius * 2.5;
      const waveZ = ((index * 0.3) % 1 - 0.5) * radius * 2;
      const distance = Math.sqrt(waveX * waveX + waveZ * waveZ);
      const waveY = Math.cos(distance * 0.08 - t * Math.PI * 2) * radius * 0.5;

      return { x: waveX, y: waveY, z: waveZ };
    }
  }
];

export default function ContextualSearchParticles() {
  return (
    <MorphingParticleField
      shapes={contextualSearchShapes}
      particleCount={480}
      morphInterval={4200}
      colors={['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE']}
      connectionDistance={80}
      rotationSpeed={{ x: 0.003, y: 0.005, z: 0.002 }}
    />
  );
}
