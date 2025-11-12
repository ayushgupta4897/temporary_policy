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

export interface ShapeGenerator {
  name: string;
  generate: (index: number, total: number, radius: number) => { x: number; y: number; z: number };
}

interface MorphingParticleFieldProps {
  shapes: ShapeGenerator[];
  particleCount?: number;
  morphInterval?: number; // milliseconds
  colors?: string[];
  connectionDistance?: number;
  rotationSpeed?: { x: number; y: number; z: number };
}

export default function MorphingParticleField({
  shapes,
  particleCount = 400,
  morphInterval = 4000,
  colors = ['#C52A2F', '#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#F5F3EE'],
  connectionDistance = 80,
  rotationSpeed = { x: 0.003, y: 0.005, z: 0.002 }
}: MorphingParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const currentShapeIndexRef = useRef(0);
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

    const radius = 140;
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    // Initialize particles with first shape
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const initialPos = shapes[0].generate(i, particleCount, radius);

      particlesRef.current.push({
        x: initialPos.x,
        y: initialPos.y,
        z: initialPos.z,
        targetX: initialPos.x,
        targetY: initialPos.y,
        targetZ: initialPos.z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Update target positions for current shape
    const updateTargets = () => {
      const currentShape = shapes[currentShapeIndexRef.current];
      particlesRef.current.forEach((particle, i) => {
        const target = currentShape.generate(i, particlesRef.current.length, radius);
        particle.targetX = target.x;
        particle.targetY = target.y;
        particle.targetZ = target.z;
      });
    };

    updateTargets();

    // Animation loop
    let animationId: number;
    const framesPerMorph = (morphInterval / 1000) * 60; // Convert ms to frames at 60fps

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Shape morphing
      shapeTimerRef.current += 1;
      if (shapeTimerRef.current % framesPerMorph === 0) {
        currentShapeIndexRef.current = (currentShapeIndexRef.current + 1) % shapes.length;
        updateTargets();
      }

      // Update rotation
      rotationRef.current.y += rotationSpeed.y;
      rotationRef.current.x += rotationSpeed.x;
      rotationRef.current.z += rotationSpeed.z;

      // Sort particles by z-index for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        const rotatedA = rotateParticle3D(a, rotationRef.current);
        const rotatedB = rotateParticle3D(b, rotationRef.current);
        return rotatedB.z - rotatedA.z;
      });

      // Draw connection lines
      sortedParticles.forEach((particle, i) => {
        const rotated1 = rotateParticle3D(particle, rotationRef.current);

        for (let j = i + 1; j < Math.min(i + 5, sortedParticles.length); j++) {
          const otherParticle = sortedParticles[j];
          const rotated2 = rotateParticle3D(otherParticle, rotationRef.current);

          const dx = rotated1.x - rotated2.x;
          const dy = rotated1.y - rotated2.y;
          const dz = rotated1.z - rotated2.z;
          const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance3D < connectionDistance) {
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
            const lineOpacity = (1 - distance3D / connectionDistance) * 0.15;
            ctx.strokeStyle = `rgba(197, 42, 47, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw particles
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
  }, [shapes, particleCount, morphInterval, colors, connectionDistance, rotationSpeed]);

  // Rotate particle in 3D space
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
