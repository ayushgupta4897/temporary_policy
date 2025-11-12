'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  radius: number;
  color: string;
  pulsePhase: number;
}

type ShapeType = 'sphere' | 'brain' | 'network' | 'helix' | 'lattice' | 'bulb';

export default function AIParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const currentShapeRef = useRef<ShapeType>('sphere');
  const shapeTimerRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // More particles for intensity
    const particleCount = 400;
    const radius = 140;
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    // Strategy& color palette with more variation
    const colors = ['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE'];

    // Initialize particles in sphere formation
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.pow(Math.random(), 1 / 3);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      particlesRef.current.push({
        x, y, z,
        targetX: x,
        targetY: y,
        targetZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Shape generators
    const generateShape = (shape: ShapeType, index: number, total: number) => {
      const t = index / total;

      switch (shape) {
        case 'sphere':
          const theta1 = Math.random() * Math.PI * 2;
          const phi1 = Math.acos(2 * Math.random() - 1);
          const r1 = radius * Math.pow(Math.random(), 1 / 3);
          return {
            x: r1 * Math.sin(phi1) * Math.cos(theta1),
            y: r1 * Math.sin(phi1) * Math.sin(theta1),
            z: r1 * Math.cos(phi1)
          };

        case 'brain':
          // Brain-like organic shape with lobes
          const brainAngle = t * Math.PI * 4;
          const brainRadius = radius * (0.7 + Math.sin(brainAngle * 3) * 0.3);
          const lobe = Math.sin(t * Math.PI * 2) * radius * 0.4;
          return {
            x: Math.cos(brainAngle) * brainRadius + lobe,
            y: Math.sin(brainAngle) * brainRadius * 0.7 + Math.sin(brainAngle * 8) * 20,
            z: Math.sin(brainAngle * 2) * radius * 0.5
          };

        case 'network':
          // Neural network node distribution
          const layer = Math.floor(t * 5);
          const layerProgress = (t * 5) % 1;
          const nodesInLayer = 8 + Math.floor(Math.sin(layer) * 4);
          const nodeAngle = layerProgress * Math.PI * 2 * nodesInLayer;
          const layerRadius = radius * 0.6;
          return {
            x: Math.cos(nodeAngle) * layerRadius,
            y: (layer - 2) * radius * 0.4,
            z: Math.sin(nodeAngle) * layerRadius
          };

        case 'helix':
          // DNA-like double helix
          const helixAngle = t * Math.PI * 6;
          const helixRadius = radius * 0.6;
          const strand = index % 2;
          return {
            x: Math.cos(helixAngle + strand * Math.PI) * helixRadius,
            y: (t - 0.5) * radius * 2,
            z: Math.sin(helixAngle + strand * Math.PI) * helixRadius
          };

        case 'lattice':
          // 3D cubic lattice
          const gridSize = 7;
          const cellSize = radius * 0.4;
          const gridX = Math.floor(t * gridSize * gridSize * gridSize) % gridSize;
          const gridY = Math.floor(t * gridSize * gridSize) % gridSize;
          const gridZ = Math.floor(t * gridSize);
          return {
            x: (gridX - gridSize / 2) * cellSize,
            y: (gridY - gridSize / 2) * cellSize,
            z: (gridZ - gridSize / 2) * cellSize
          };

        case 'bulb':
          // Light bulb shape - wider at top, narrow at bottom
          const bulbAngle = t * Math.PI * 2;
          const height = (t - 0.5) * radius * 1.8; // Vertical position
          const bulbRadiusAtHeight = height > 0
            ? radius * 0.7 * Math.sqrt(1 - Math.pow(height / (radius * 0.9), 2)) // Top sphere
            : radius * 0.3 * (1 - height / (radius * -0.9)); // Bottom cone
          return {
            x: Math.cos(bulbAngle) * bulbRadiusAtHeight,
            y: height,
            z: Math.sin(bulbAngle) * bulbRadiusAtHeight
          };
      }
    };

    // Update target positions for current shape
    const updateTargets = () => {
      particlesRef.current.forEach((particle, i) => {
        const target = generateShape(currentShapeRef.current, i, particlesRef.current.length);
        particle.targetX = target.x;
        particle.targetY = target.y;
        particle.targetZ = target.z;
      });
    };

    updateTargets();

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Shape morphing every 4 seconds
      shapeTimerRef.current += 1;
      if (shapeTimerRef.current % 240 === 0) { // 4 seconds at 60fps
        const shapes: ShapeType[] = ['sphere', 'brain', 'network', 'helix', 'lattice', 'bulb'];
        const currentIndex = shapes.indexOf(currentShapeRef.current);
        currentShapeRef.current = shapes[(currentIndex + 1) % shapes.length];
        updateTargets();
      }

      // Update rotation - faster and more complex
      rotationRef.current.y += 0.005;
      rotationRef.current.x += 0.003;
      rotationRef.current.z += 0.002;

      // Sort particles by z-index for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        const rotatedA = rotateParticle3D(a, rotationRef.current);
        const rotatedB = rotateParticle3D(b, rotationRef.current);
        return rotatedB.z - rotatedA.z;
      });

      // Draw connection lines between nearby particles
      sortedParticles.forEach((particle, i) => {
        const rotated1 = rotateParticle3D(particle, rotationRef.current);

        for (let j = i + 1; j < Math.min(i + 5, sortedParticles.length); j++) {
          const otherParticle = sortedParticles[j];
          const rotated2 = rotateParticle3D(otherParticle, rotationRef.current);

          const dx = rotated1.x - rotated2.x;
          const dy = rotated1.y - rotated2.y;
          const dz = rotated1.z - rotated2.z;
          const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance3D < 80) {
            const perspective = 800;
            const scale1 = perspective / (perspective + rotated1.z);
            const scale2 = perspective / (perspective + rotated2.z);

            const x1 = rotated1.x * scale1 + centerX;
            const y1 = rotated1.y * scale1 + centerY;
            const x2 = rotated2.x * scale2 + centerX;
            const y2 = rotated2.y * scale2 + centerY;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            const lineOpacity = (1 - distance3D / 80) * 0.15;
            ctx.strokeStyle = `rgba(197, 42, 47, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw particles with enhanced effects
      sortedParticles.forEach(particle => {
        // Smoothly move particles toward target
        particle.vx += (particle.targetX - particle.x) * 0.002;
        particle.vy += (particle.targetY - particle.y) * 0.002;
        particle.vz += (particle.targetZ - particle.z) * 0.002;

        // Apply damping
        particle.vx *= 0.92;
        particle.vy *= 0.92;
        particle.vz *= 0.92;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        const rotated = rotateParticle3D(particle, rotationRef.current);

        // Apply perspective
        const perspective = 800;
        const scale = perspective / (perspective + rotated.z);
        const x2d = rotated.x * scale + centerX;
        const y2d = rotated.y * scale + centerY;

        // Calculate opacity based on z position
        const depthOpacity = Math.max(0.2, (rotated.z + radius * 1.5) / (radius * 3));

        // Pulse effect
        particle.pulsePhase += 0.05;
        const pulse = 1 + Math.sin(particle.pulsePhase) * 0.3;

        // Draw particle with glow
        const finalRadius = particle.radius * scale * pulse;

        // Outer glow
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, finalRadius * 3);
        gradient.addColorStop(0, particle.color + Math.floor(depthOpacity * 120).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, particle.color + '20');
        gradient.addColorStop(1, particle.color + '00');

        ctx.beginPath();
        ctx.arc(x2d, y2d, finalRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(x2d, y2d, finalRadius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(depthOpacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Bright center for closer particles
        if (rotated.z > 0 && depthOpacity > 0.7) {
          ctx.beginPath();
          ctx.arc(x2d, y2d, finalRadius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = '#F5F3EE' + 'AA';
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Rotate particle in 3D space with Z-axis rotation
  const rotateParticle3D = (particle: Particle, rotation: { x: number; y: number; z: number }) => {
    let { x, y, z } = particle;

    // Rotate around Z axis
    const x1 = x * Math.cos(rotation.z) - y * Math.sin(rotation.z);
    const y1 = x * Math.sin(rotation.z) + y * Math.cos(rotation.z);
    x = x1;
    y = y1;

    // Rotate around Y axis
    const x2 = x * Math.cos(rotation.y) - z * Math.sin(rotation.y);
    const z2 = x * Math.sin(rotation.y) + z * Math.cos(rotation.y);
    x = x2;
    z = z2;

    // Rotate around X axis
    const y3 = y * Math.cos(rotation.x) - z * Math.sin(rotation.x);
    const z3 = y * Math.sin(rotation.x) + z * Math.cos(rotation.x);

    return { x, y: y3, z: z3 };
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
