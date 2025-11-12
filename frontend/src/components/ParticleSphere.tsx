'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
}

export default function ParticleSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef({ x: 0, y: 0 });

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

    // Create particles in sphere formation
    const particleCount = 150;
    const sphereRadius = 120;
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;

    // Strategy& color palette
    const colors = ['#A32020', '#D93954', '#FF8B9D', '#FFA5B4'];

    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = sphereRadius * Math.pow(Math.random(), 1 / 3);

      particlesRef.current.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        vz: (Math.random() - 0.5) * 0.1,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update rotation
      rotationRef.current.y += 0.002;
      rotationRef.current.x += 0.001;

      // Sort particles by z-index for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        // Rotate particles
        const rotatedA = rotateParticle(a, rotationRef.current);
        const rotatedB = rotateParticle(b, rotationRef.current);
        return rotatedB.z - rotatedA.z;
      });

      // Draw particles
      sortedParticles.forEach(particle => {
        const rotated = rotateParticle(particle, rotationRef.current);

        // Apply perspective
        const perspective = 600;
        const scale = perspective / (perspective + rotated.z);
        const x2d = rotated.x * scale + centerX;
        const y2d = rotated.y * scale + centerY;

        // Calculate opacity based on z position (depth)
        const opacity = (rotated.z + sphereRadius) / (sphereRadius * 2);

        // Draw particle
        ctx.beginPath();
        ctx.arc(x2d, y2d, particle.radius * scale, 0, Math.PI * 2);
        ctx.fillStyle = particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        // Draw subtle glow for closer particles
        if (rotated.z > 0) {
          ctx.beginPath();
          ctx.arc(x2d, y2d, particle.radius * scale * 2, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + '20';
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

  // Rotate particle in 3D space
  const rotateParticle = (particle: Particle, rotation: { x: number; y: number }) => {
    // Rotate around Y axis
    let x = particle.x * Math.cos(rotation.y) - particle.z * Math.sin(rotation.y);
    let z = particle.x * Math.sin(rotation.y) + particle.z * Math.cos(rotation.y);
    let y = particle.y;

    // Rotate around X axis
    const y2 = y * Math.cos(rotation.x) - z * Math.sin(rotation.x);
    const z2 = y * Math.sin(rotation.x) + z * Math.cos(rotation.x);

    return { x, y: y2, z: z2 };
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
