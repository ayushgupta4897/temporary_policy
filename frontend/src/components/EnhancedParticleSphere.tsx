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

export default function EnhancedParticleSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });

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

    // 5000 particles for GRANDEUR - massive visual impact
    const particleCount = 5000;
    // Constrain to fit container (max 500px height, with infinity needing horizontal space)
    const radius = 150; // Base radius that fits in container
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    // Strategy& color palette
    const colors = ['#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#C52A2F', '#F5F3EE'];

    // Initialize particles along infinity path - each particle has its own position on the curve
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const angle = t * Math.PI * 2;

      // Infinity symbol formula (Lemniscate of Bernoulli)
      const wideScale = radius * 1.8;
      const denom = 1 + Math.sin(angle) * Math.sin(angle);
      const x = (wideScale * Math.cos(angle)) / denom;
      const y = (wideScale * Math.sin(angle) * Math.cos(angle)) / denom;
      const z = Math.sin(angle * 2) * radius * 0.3;

      particlesRef.current.push({
        x, y, z,
        targetX: x,
        targetY: y,
        targetZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: t * Math.PI * 2 // Stagger pulses along the path
      });
    }

    // Particle flow parameters - each particle moves along the infinity curve
    let flowOffset = 0;

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Increment flow - particles flow along the infinity curve
      flowOffset += 0.005; // Flow speed

      // Update each particle's position along the infinity path
      particlesRef.current.forEach((particle, i) => {
        const t = (i / particleCount + flowOffset) % 1;
        const angle = t * Math.PI * 2;

        // Calculate new position on infinity curve
        const wideScale = radius * 1.8;
        const denom = 1 + Math.sin(angle) * Math.sin(angle);
        particle.targetX = (wideScale * Math.cos(angle)) / denom;
        particle.targetY = (wideScale * Math.sin(angle) * Math.cos(angle)) / denom;
        particle.targetZ = Math.sin(angle * 2) * radius * 0.3;
      });

      // Slower, more elegant rotation
      rotationRef.current.y += 0.003;
      rotationRef.current.x += 0.002;
      rotationRef.current.z += 0.001;

      // Sort particles by z-index for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        const rotatedA = rotateParticle3D(a, rotationRef.current);
        const rotatedB = rotateParticle3D(b, rotationRef.current);
        return rotatedB.z - rotatedA.z;
      });

      // Draw connection lines between close particles (optimized for performance)
      sortedParticles.forEach((particle, i) => {
        const rotated1 = rotateParticle3D(particle, rotationRef.current);

        // Reduced to 3 neighbors for better performance with 5000 particles
        for (let j = i + 1; j < Math.min(i + 3, sortedParticles.length); j++) {
          const otherParticle = sortedParticles[j];
          const rotated2 = rotateParticle3D(otherParticle, rotationRef.current);

          const dx = rotated1.x - rotated2.x;
          const dy = rotated1.y - rotated2.y;
          const dz = rotated1.z - rotated2.z;
          const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Increased threshold for denser web effect with more particles
          if (distance3D < 80) {
            const perspective = 900;
            const scale1 = perspective / (perspective + rotated1.z);
            const scale2 = perspective / (perspective + rotated2.z);

            const x1 = rotated1.x * scale1 + centerX;
            const y1 = rotated1.y * scale1 + centerY;
            const x2 = rotated2.x * scale2 + centerX;
            const y2 = rotated2.y * scale2 + centerY;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            const lineOpacity = (1 - distance3D / 80) * 0.08; // Slightly reduced opacity for cleaner look
            ctx.strokeStyle = `rgba(163, 32, 32, ${lineOpacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw particles with effects
      sortedParticles.forEach(particle => {
        // Smooth movement toward target position on the infinity curve
        particle.vx += (particle.targetX - particle.x) * 0.02;
        particle.vy += (particle.targetY - particle.y) * 0.02;
        particle.vz += (particle.targetZ - particle.z) * 0.02;

        // Damping for smooth flow
        particle.vx *= 0.85;
        particle.vy *= 0.85;
        particle.vz *= 0.85;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        const rotated = rotateParticle3D(particle, rotationRef.current);

        // Apply perspective
        const perspective = 900;
        const scale = perspective / (perspective + rotated.z);
        const x2d = rotated.x * scale + centerX;
        const y2d = rotated.y * scale + centerY;

        // Calculate opacity based on z position
        const depthOpacity = Math.max(0.2, (rotated.z + radius * 2) / (radius * 4));

        // Subtle pulse
        particle.pulsePhase += 0.03;
        const pulse = 1 + Math.sin(particle.pulsePhase) * 0.2;

        // Draw particle
        const finalRadius = particle.radius * scale * pulse;

        // Glow effect
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, finalRadius * 2.5);
        gradient.addColorStop(0, particle.color + Math.floor(depthOpacity * 100).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, particle.color + '15');
        gradient.addColorStop(1, particle.color + '00');

        ctx.beginPath();
        ctx.arc(x2d, y2d, finalRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x2d, y2d, finalRadius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(depthOpacity * 255).toString(16).padStart(2, '0');
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

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
