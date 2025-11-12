'use client';

import MorphingParticleField, { ShapeGenerator } from './MorphingParticleField';

// Foresight Radar themed shapes - focused on future trends, scanning, prediction
const foresightRadarShapes: ShapeGenerator[] = [
  {
    name: 'Radar Rings',
    generate: (index, total, radius) => {
      // Concentric radar rings scanning for trends
      const t = index / total;
      const rings = 10;
      const ring = Math.floor(t * rings);
      const angleInRing = (t * rings % 1) * Math.PI * 2;
      const ringRadius = (ring + 1) / rings * radius * 1.4;

      return {
        x: Math.cos(angleInRing) * ringRadius,
        y: Math.sin(angleInRing) * ringRadius,
        z: Math.sin(ring * Math.PI / 5) * radius * 0.2
      };
    }
  },
  {
    name: 'Trend Horizon',
    generate: (index, total, radius) => {
      // Emerging trends on the horizon
      const t = index / total;
      const horizonX = (t - 0.5) * radius * 2.8;
      const distance = Math.abs(horizonX) / (radius * 1.4);
      const horizonY = radius * 0.6 - distance * radius * 0.4;
      const horizonZ = (Math.random() - 0.5) * radius * 0.3;

      return { x: horizonX, y: horizonY, z: horizonZ };
    }
  },
  {
    name: 'STEEP-G Hexagon',
    generate: (index, total, radius) => {
      // Hexagonal framework (STEEP-G categories)
      const t = index / total;
      const sides = 6;
      const side = Math.floor(t * sides);
      const withinSide = (t * sides % 1);

      const angle1 = (side / sides) * Math.PI * 2;
      const angle2 = ((side + 1) / sides) * Math.PI * 2;
      const hexRadius = radius * 1.1;

      const x1 = Math.cos(angle1) * hexRadius;
      const y1 = Math.sin(angle1) * hexRadius;
      const x2 = Math.cos(angle2) * hexRadius;
      const y2 = Math.sin(angle2) * hexRadius;

      return {
        x: x1 + (x2 - x1) * withinSide,
        y: y1 + (y2 - y1) * withinSide,
        z: Math.sin(t * Math.PI * 3) * radius * 0.3
      };
    }
  },
  {
    name: 'Signal Strength',
    generate: (index, total, radius) => {
      // Signal strength indicators radiating outward
      const t = index / total;
      const beams = 16;
      const beam = Math.floor(t * beams);
      const progressInBeam = (t * beams % 1);
      const angle = (beam / beams) * Math.PI * 2;

      // Varying signal strengths
      const strength = (Math.sin(beam * 0.7) + 1) / 2;
      const distance = progressInBeam * strength * radius * 1.5;

      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: (1 - progressInBeam) * radius * 0.4
      };
    }
  },
  {
    name: 'Timeline Cone',
    generate: (index, total, radius) => {
      // Expanding cone representing future timeline
      const t = index / total;
      const timeDepth = t; // 0 = present, 1 = far future
      const coneRadius = timeDepth * radius * 1.3;
      const angle = (index * 137.5) % 360 * Math.PI / 180; // Golden angle
      const coneHeight = timeDepth * radius * 1.5;

      return {
        x: Math.cos(angle) * coneRadius,
        y: coneHeight - radius * 0.75,
        z: Math.sin(angle) * coneRadius
      };
    }
  },
  {
    name: 'Scenario Branches',
    generate: (index, total, radius) => {
      // Branching scenarios/futures
      const t = index / total;
      const branches = 5;
      const branch = Math.floor(t * branches);
      const withinBranch = (t * branches % 1);

      const branchAngle = (branch / branches) * Math.PI * 2 - Math.PI / 2;
      const branchSpread = withinBranch * radius * 1.4;

      return {
        x: Math.cos(branchAngle) * branchSpread,
        y: withinBranch * radius * 1.2,
        z: Math.sin(branchAngle) * branchSpread * 0.5
      };
    }
  },
  {
    name: 'Risk Clusters',
    generate: (index, total, radius) => {
      // Clustered risks and opportunities
      const t = index / total;
      const riskZones = 4;
      const zone = Math.floor(t * riskZones);
      const withinZone = (t * riskZones % 1);

      const zoneAngle = (zone / riskZones) * Math.PI * 2;
      const zoneDistance = radius * 1.0;
      const clusterAngle = withinZone * Math.PI * 2 * 3;
      const clusterRadius = Math.sqrt(withinZone) * radius * 0.4;

      return {
        x: Math.cos(zoneAngle) * zoneDistance + Math.cos(clusterAngle) * clusterRadius,
        y: Math.sin(zoneAngle) * zoneDistance + Math.sin(clusterAngle) * clusterRadius,
        z: (withinZone - 0.5) * radius * 0.4
      };
    }
  },
  {
    name: 'Emerging Patterns',
    generate: (index, total, radius) => {
      // Wave interference patterns showing emerging trends
      const t = index / total;
      const gridX = (t * 10 % 1 - 0.5) * radius * 2.5;
      const gridY = (Math.floor(t * 10) / 10 - 0.5) * radius * 2.5;

      const wave1 = Math.sin(Math.hypot(gridX, gridY) * 0.08);
      const wave2 = Math.sin(Math.hypot(gridX - radius * 0.5, gridY) * 0.1 + Math.PI / 3);
      const gridZ = (wave1 + wave2) * radius * 0.35;

      return { x: gridX, y: gridY, z: gridZ };
    }
  }
];

export default function ForesightRadarParticles() {
  return (
    <MorphingParticleField
      shapes={foresightRadarShapes}
      particleCount={460}
      morphInterval={4400}
      colors={['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE']}
      connectionDistance={82}
      rotationSpeed={{ x: 0.002, y: 0.004, z: 0.003 }}
    />
  );
}
