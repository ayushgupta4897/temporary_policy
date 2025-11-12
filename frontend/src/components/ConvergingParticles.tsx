'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  startX: number;
  startY: number;
  startZ: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  speed: number;
  phase: number;
}

interface RayParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  life: number;
  maxLife: number;
}

export default function ConvergingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rayParticlesRef = useRef<RayParticle[]>([]);
  const rotationRef = useRef({ x: 0, y: 0 });
  const timeRef = useRef(0);

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

    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;
    const cubeSize = 30;

    // Strategy& color palette
    const colors = ['#A32020', '#D93954', '#FF8B9D', '#FFA5B4', '#C52A2F', '#F5F3EE'];

    // Initialize scattered particles - unstructured and random
    const particleCount = 800;
    particlesRef.current = [];

    for (let i = 0; i < particleCount; i++) {
      // Random positions in 3D space around the center
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const distance = 200 + Math.random() * 300;

      const x = distance * Math.sin(phi) * Math.cos(theta);
      const y = distance * Math.sin(phi) * Math.sin(theta);
      const z = distance * Math.cos(phi);

      particlesRef.current.push({
        x, y, z,
        startX: x,
        startY: y,
        startZ: z,
        vx: 0,
        vy: 0,
        vz: 0,
        radius: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: 0.8 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      timeRef.current += 0.016;

      // Slow rotation
      rotationRef.current.y += 0.005;
      rotationRef.current.x = Math.sin(timeRef.current * 0.3) * 0.2;

      // Update converging particles
      particlesRef.current.forEach(particle => {
        // Calculate convergence force toward center cube
        const dx = -particle.x;
        const dy = -particle.y;
        const dz = -particle.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // Converge toward cube center
        if (distance > cubeSize) {
          const force = particle.speed * 0.03;
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
          particle.vz += (dz / distance) * force;

          // Damping
          particle.vx *= 0.95;
          particle.vy *= 0.95;
          particle.vz *= 0.95;

          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.z += particle.vz;
        } else {
          // Particle reached the cube - emit as ray
          if (Math.random() < 0.05) {
            // Emit streamlined ray particle upward
            rayParticlesRef.current.push({
              x: particle.x * 0.5,
              y: particle.y * 0.5,
              z: particle.z * 0.5,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -8 - Math.random() * 4, // Upward velocity
              vz: (Math.random() - 0.5) * 0.5,
              radius: particle.radius * 0.8,
              life: 0,
              maxLife: 60 + Math.random() * 40
            });
          }

          // Reset particle to scattered position
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const distance = 200 + Math.random() * 300;

          particle.x = distance * Math.sin(phi) * Math.cos(theta);
          particle.y = distance * Math.sin(phi) * Math.sin(theta);
          particle.z = distance * Math.cos(phi);
          particle.vx = 0;
          particle.vy = 0;
          particle.vz = 0;
        }
      });

      // Update ray particles
      rayParticlesRef.current = rayParticlesRef.current.filter(ray => {
        ray.x += ray.vx;
        ray.y += ray.vy;
        ray.z += ray.vz;
        ray.life++;
        return ray.life < ray.maxLife;
      });

      // Sort all particles by z-index
      const allParticles = [
        ...particlesRef.current.map(p => ({ ...p, isRay: false })),
        ...rayParticlesRef.current.map(r => ({ ...r, isRay: true, color: colors[0], phase: 0, speed: 0, startX: 0, startY: 0, startZ: 0 }))
      ];

      const sortedParticles = allParticles.map(p => {
        const rotated = rotateParticle3D(p, rotationRef.current);
        return { particle: p, rotated };
      }).sort((a, b) => b.rotated.z - a.rotated.z);

      // Draw converging particles
      sortedParticles.forEach(({ particle, rotated }) => {
        const perspective = 900;
        const scale = perspective / (perspective + rotated.z);
        const x2d = rotated.x * scale + centerX;
        const y2d = rotated.y * scale + centerY;

        const depthOpacity = Math.max(0.1, (rotated.z + 600) / 1200);

        if ('isRay' in particle && particle.isRay) {
          // Draw ray particle with trail effect
          const rayP = particle as any;
          const lifeFactor = 1 - (rayP.life / rayP.maxLife);
          const finalRadius = particle.radius * scale * lifeFactor;

          // Glow
          const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, finalRadius * 3);
          gradient.addColorStop(0, particle.color + Math.floor(lifeFactor * 180).toString(16).padStart(2, '0'));
          gradient.addColorStop(0.5, particle.color + '30');
          gradient.addColorStop(1, particle.color + '00');

          ctx.beginPath();
          ctx.arc(x2d, y2d, finalRadius * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(x2d, y2d, finalRadius, 0, Math.PI * 2);
          ctx.fillStyle = particle.color + Math.floor(lifeFactor * 255).toString(16).padStart(2, '0');
          ctx.fill();
        } else {
          // Draw converging particle
          particle.phase += 0.05;
          const pulse = 1 + Math.sin(particle.phase) * 0.3;
          const finalRadius = particle.radius * scale * pulse;

          // Glow
          const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, finalRadius * 2.5);
          gradient.addColorStop(0, particle.color + Math.floor(depthOpacity * 150).toString(16).padStart(2, '0'));
          gradient.addColorStop(0.5, particle.color + '20');
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
        }
      });

      // Draw central cube (wireframe)
      drawCube(ctx, centerX, centerY, cubeSize, rotationRef.current);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const rotateParticle3D = (particle: { x: number; y: number; z: number }, rotation: { x: number; y: number }) => {
    let { x, y, z } = particle;

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

  const drawCube = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, size: number, rotation: { x: number; y: number }) => {
    const s = size / 2;
    const vertices = [
      { x: -s, y: -s, z: -s },
      { x: s, y: -s, z: -s },
      { x: s, y: s, z: -s },
      { x: -s, y: s, z: -s },
      { x: -s, y: -s, z: s },
      { x: s, y: -s, z: s },
      { x: s, y: s, z: s },
      { x: -s, y: s, z: s }
    ];

    // Rotate and project vertices
    const projected = vertices.map(v => {
      const rotated = rotateParticle3D(v, rotation);
      const perspective = 900;
      const scale = perspective / (perspective + rotated.z);
      return {
        x: rotated.x * scale + centerX,
        y: rotated.y * scale + centerY,
        z: rotated.z
      };
    });

    // Draw edges
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Back face
      [4, 5], [5, 6], [6, 7], [7, 4], // Front face
      [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting edges
    ];

    ctx.strokeStyle = '#D93954';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#D93954';

    edges.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(projected[i].x, projected[i].y);
      ctx.lineTo(projected[j].x, projected[j].y);
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
