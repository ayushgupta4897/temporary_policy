'use client';

import MorphingParticleField, { ShapeGenerator } from './MorphingParticleField';

// News Horizon themed shapes - focused on global coverage, signals, waves, scanning
const newsHorizonShapes: ShapeGenerator[] = [
  {
    name: 'Globe',
    generate: (index, total, radius) => {
      // World map/globe with concentrated nodes on continents
      const t = index / total;
      const lat = (t * 2 - 1) * Math.PI; // -π to π
      const lon = ((index * 137.5) % 360) * Math.PI / 180; // Golden angle distribution

      const r = radius * (0.8 + Math.random() * 0.2); // Slight variation for depth
      return {
        x: r * Math.cos(lat) * Math.cos(lon),
        y: r * Math.cos(lat) * Math.sin(lon),
        z: r * Math.sin(lat)
      };
    }
  },
  {
    name: 'Radar Sweep',
    generate: (index, total, radius) => {
      // Circular radar pattern with sweeping arms
      const t = index / total;
      const ringCount = 6;
      const ring = Math.floor(t * ringCount);
      const angleInRing = (t * ringCount % 1) * Math.PI * 2;
      const ringRadius = (ring + 1) / ringCount * radius * 1.2;

      return {
        x: Math.cos(angleInRing) * ringRadius,
        y: Math.sin(angleInRing) * ringRadius,
        z: Math.sin(angleInRing * 4) * radius * 0.2
      };
    }
  },
  {
    name: 'News Wave',
    generate: (index, total, radius) => {
      // Rippling wave representing news spreading
      const t = index / total;
      const waveX = (t - 0.5) * radius * 2.5;
      const waveZ = ((index * 0.2) % 1 - 0.5) * radius * 2;
      const distance = Math.sqrt(waveX * waveX + waveZ * waveZ);
      const waveY = Math.sin(distance * 0.1) * radius * 0.6 * (1 - distance / (radius * 1.5));

      return { x: waveX, y: waveY, z: waveZ };
    }
  },
  {
    name: 'Signal Burst',
    generate: (index, total, radius) => {
      // Radiating signal bursts from center
      const t = index / total;
      const burstCount = 8;
      const burst = Math.floor(t * burstCount);
      const progressInBurst = (t * burstCount % 1);
      const angle = (burst / burstCount) * Math.PI * 2;
      const distance = progressInBurst * radius * 1.5;

      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        z: Math.sin(progressInBurst * Math.PI * 2) * radius * 0.3
      };
    }
  },
  {
    name: 'Geographic Clusters',
    generate: (index, total, radius) => {
      // Regional clusters representing different geographic zones
      const t = index / total;
      const regionCount = 7; // 7 continents/regions
      const region = Math.floor(t * regionCount);
      const withinRegion = (t * regionCount % 1);

      // Position regions around a circle
      const regionAngle = (region / regionCount) * Math.PI * 2;
      const regionDistance = radius * 0.9;
      const regionX = Math.cos(regionAngle) * regionDistance;
      const regionY = Math.sin(regionAngle) * regionDistance;

      // Scatter within region
      const scatterAngle = withinRegion * Math.PI * 2;
      const scatterDist = Math.sqrt(withinRegion) * radius * 0.3;

      return {
        x: regionX + Math.cos(scatterAngle) * scatterDist,
        y: regionY + Math.sin(scatterAngle) * scatterDist,
        z: (Math.random() - 0.5) * radius * 0.4
      };
    }
  },
  {
    name: 'Timeline Stream',
    generate: (index, total, radius) => {
      // Flowing timeline of news events
      const t = index / total;
      const streamX = (t - 0.5) * radius * 3;
      const streamLane = Math.floor((index * 7) % 5); // 5 parallel lanes
      const streamY = (streamLane - 2) * radius * 0.3;
      const streamZ = Math.sin(t * Math.PI * 4) * radius * 0.3;

      return { x: streamX, y: streamY, z: streamZ };
    }
  },
  {
    name: 'Information Vortex',
    generate: (index, total, radius) => {
      // Spiral vortex representing information flow
      const t = index / total;
      const vortexAngle = t * Math.PI * 10;
      const vortexRadius = t * radius * 1.3;
      const vortexHeight = (t - 0.5) * radius * 1.5;

      return {
        x: Math.cos(vortexAngle) * vortexRadius,
        y: vortexHeight,
        z: Math.sin(vortexAngle) * vortexRadius
      };
    }
  },
  {
    name: 'Satellite Network',
    generate: (index, total, radius) => {
      // Orbital satellites around a central sphere
      const t = index / total;
      const isCore = t < 0.3; // 30% in core

      if (isCore) {
        // Central earth/core
        const coreAngle = t * Math.PI * 2 * 10;
        const corePhi = Math.acos(2 * (t / 0.3) - 1);
        const coreR = radius * 0.5;
        return {
          x: coreR * Math.sin(corePhi) * Math.cos(coreAngle),
          y: coreR * Math.sin(corePhi) * Math.sin(coreAngle),
          z: coreR * Math.cos(corePhi)
        };
      } else {
        // Orbiting satellites
        const orbitProgress = (t - 0.3) / 0.7;
        const orbit = Math.floor(orbitProgress * 3); // 3 orbital rings
        const angleInOrbit = (orbitProgress * 3 % 1) * Math.PI * 2;
        const orbitRadius = radius * (0.9 + orbit * 0.3);
        const orbitTilt = orbit * Math.PI / 6;

        return {
          x: Math.cos(angleInOrbit) * orbitRadius,
          y: Math.sin(angleInOrbit) * orbitRadius * Math.cos(orbitTilt),
          z: Math.sin(angleInOrbit) * orbitRadius * Math.sin(orbitTilt)
        };
      }
    }
  }
];

export default function NewsHorizonParticles() {
  return (
    <MorphingParticleField
      shapes={newsHorizonShapes}
      particleCount={500}
      morphInterval={4500}
      colors={['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE']}
      connectionDistance={75}
      rotationSpeed={{ x: 0.002, y: 0.004, z: 0.002 }}
    />
  );
}
