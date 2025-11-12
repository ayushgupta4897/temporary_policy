'use client';

import MorphingParticleField, { ShapeGenerator } from './MorphingParticleField';

// Impact Evaluator themed shapes - focused on metrics, data, measurements, impact waves
const impactEvaluatorShapes: ShapeGenerator[] = [
  {
    name: 'Bar Chart',
    generate: (index, total, radius) => {
      // Rising bar chart columns
      const t = index / total;
      const bars = 10;
      const bar = Math.floor(t * bars);
      const withinBar = (t * bars % 1);
      const barHeight = (Math.sin(bar) + 1) * 0.5; // Varying heights
      const barX = (bar - bars / 2) * (radius * 0.25);
      const barY = -radius + withinBar * barHeight * radius * 2;
      const barZ = (Math.random() - 0.5) * radius * 0.2;

      return { x: barX, y: barY, z: barZ };
    }
  },
  {
    name: 'Impact Ripples',
    generate: (index, total, radius) => {
      // Concentric ripples representing impact spreading
      const t = index / total;
      const rippleCount = 8;
      const ripple = Math.floor(t * rippleCount);
      const angleInRipple = (t * rippleCount % 1) * Math.PI * 2;
      const rippleRadius = (ripple + 1) / rippleCount * radius * 1.3;

      return {
        x: Math.cos(angleInRipple) * rippleRadius,
        y: Math.sin(angleInRipple) * rippleRadius,
        z: Math.sin(ripple * Math.PI / 4) * radius * 0.3
      };
    }
  },
  {
    name: 'Growth Curve',
    generate: (index, total, radius) => {
      // Exponential growth curve
      const t = index / total;
      const curveX = (t - 0.5) * radius * 2.5;
      const growth = Math.pow(t, 2.5); // Exponential
      const curveY = (growth - 0.5) * radius * 2;
      const curveZ = Math.sin(t * Math.PI * 4) * radius * 0.2;

      return { x: curveX, y: curveY, z: curveZ };
    }
  },
  {
    name: 'Scatter Plot',
    generate: (index, total, radius) => {
      // Data points scattered with correlation pattern
      const t = index / total;
      const correlation = 0.7; // Positive correlation
      const scatterX = (t - 0.5) * radius * 2.2;
      const scatterY = scatterX * correlation + (Math.random() - 0.5) * radius * 0.6;
      const scatterZ = (Math.random() - 0.5) * radius * 0.4;

      return { x: scatterX, y: scatterY, z: scatterZ };
    }
  },
  {
    name: 'Pie Segments',
    generate: (index, total, radius) => {
      // Pie chart segments (exploded)
      const t = index / total;
      const segments = 6;
      const segment = Math.floor(t * segments);
      const withinSegment = (t * segments % 1);

      const startAngle = (segment / segments) * Math.PI * 2;
      const endAngle = ((segment + 1) / segments) * Math.PI * 2;
      const angle = startAngle + (endAngle - startAngle) * withinSegment;

      const segmentRadius = radius * (0.6 + withinSegment * 0.4);
      const explodeDistance = segment * 0.1 * radius;
      const explodeAngle = (startAngle + endAngle) / 2;

      return {
        x: Math.cos(angle) * segmentRadius + Math.cos(explodeAngle) * explodeDistance,
        y: Math.sin(angle) * segmentRadius + Math.sin(explodeAngle) * explodeDistance,
        z: Math.sin(segment) * radius * 0.3
      };
    }
  },
  {
    name: 'Multiplier Cascade',
    generate: (index, total, radius) => {
      // Cascading multiplier effect - layers expanding outward
      const t = index / total;
      const layers = 5;
      const layer = Math.floor(t * layers);
      const withinLayer = (t * layers % 1);
      const layerAngle = withinLayer * Math.PI * 2;
      const layerRadius = (layer + 1) / layers * radius * 1.2;
      const layerHeight = (layer - 2) * radius * 0.3;

      return {
        x: Math.cos(layerAngle) * layerRadius,
        y: layerHeight,
        z: Math.sin(layerAngle) * layerRadius
      };
    }
  },
  {
    name: 'Gauge Meter',
    generate: (index, total, radius) => {
      // Semi-circular gauge/speedometer
      const t = index / total;
      const gaugeAngle = Math.PI * t; // 0 to π (semi-circle)
      const gaugeRadius = radius * 1.1;
      const depth = ((index * 3) % total) / total; // Multiple arcs at different depths

      return {
        x: Math.cos(gaugeAngle) * gaugeRadius,
        y: Math.sin(gaugeAngle) * gaugeRadius - radius * 0.3,
        z: (depth - 0.5) * radius * 0.5
      };
    }
  },
  {
    name: 'Trend Arrows',
    generate: (index, total, radius) => {
      // Upward trending arrows
      const t = index / total;
      const arrows = 7;
      const arrow = Math.floor(t * arrows);
      const withinArrow = (t * arrows % 1);

      const arrowX = (arrow - arrows / 2) * (radius * 0.35);
      const arrowY = -radius * 0.8 + withinArrow * radius * 1.8;
      const arrowZ = Math.sin(withinArrow * Math.PI) * radius * 0.3;

      return { x: arrowX, y: arrowY, z: arrowZ };
    }
  }
];

export default function ImpactEvaluatorParticles() {
  return (
    <MorphingParticleField
      shapes={impactEvaluatorShapes}
      particleCount={420}
      morphInterval={4000}
      colors={['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE']}
      connectionDistance={85}
      rotationSpeed={{ x: 0.003, y: 0.004, z: 0.002 }}
    />
  );
}
