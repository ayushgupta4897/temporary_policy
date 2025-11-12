'use client';

import { useEffect, useRef, useState } from 'react';

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
  imageX: number; // Original position in image
  imageY: number;
  imageZ: number;
  radius: number;
  color: string;
  pulsePhase: number;
  brightness: number;
}

type ShapeType = 'image' | 'scatter' | 'sphere' | 'wave' | 'spiral' | 'cube';

interface ImageParticleAnimationProps {
  imagePath: string;
  particleDensity?: number; // 1-10, controls how many pixels to sample
  animationSpeed?: number; // 0.5-2.0, controls rotation and transition speed
  autoMorphInterval?: number; // seconds between shape changes (0 to disable)
  className?: string;
}

export default function ImageParticleAnimation({
  imagePath,
  particleDensity = 3,
  animationSpeed = 1,
  autoMorphInterval = 5,
  className = ''
}: ImageParticleAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const currentShapeRef = useRef<ShapeType>('image');
  const shapeTimerRef = useRef(0);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load and process image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
    };

    img.onerror = () => {
      setError('Failed to load image');
      console.error('Failed to load image:', imagePath);
    };

    img.src = imagePath;
  }, [imagePath]);

  useEffect(() => {
    if (!isLoaded || !imageRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

    // Sample pixels from image
    const img = imageRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    // Scale image to fit canvas while maintaining aspect ratio
    const maxDimension = 300; // Max size for particle field
    const scale = Math.min(maxDimension / img.width, maxDimension / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;

    tempCanvas.width = scaledWidth;
    tempCanvas.height = scaledHeight;
    tempCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    // Sample pixels based on density (higher density = more particles)
    const sampling = Math.max(1, Math.floor(11 - particleDensity)); // 10 = very sparse, 1 = very dense
    const imageData = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight);
    const particles: Particle[] = [];

    for (let y = 0; y < scaledHeight; y += sampling) {
      for (let x = 0; x < scaledWidth; x += sampling) {
        const i = (y * scaledWidth + x) * 4;
        const r = imageData.data[i] ?? 0;
        const g = imageData.data[i + 1] ?? 0;
        const b = imageData.data[i + 2] ?? 0;
        const a = imageData.data[i + 3] ?? 0;

        // Skip mostly transparent or very dark pixels
        if (a < 50) continue;

        const brightness = (r + g + b) / 3 / 255;
        if (brightness < 0.1) continue;

        // Position relative to center
        const px = x - scaledWidth / 2;
        const py = y - scaledHeight / 2;
        const pz = 0;

        const color = `rgb(${r}, ${g}, ${b})`;

        particles.push({
          x: px + (Math.random() - 0.5) * 100, // Start scattered
          y: py + (Math.random() - 0.5) * 100,
          z: pz + (Math.random() - 0.5) * 100,
          targetX: px,
          targetY: py,
          targetZ: pz,
          imageX: px,
          imageY: py,
          imageZ: pz,
          vx: 0,
          vy: 0,
          vz: 0,
          radius: Math.random() * 1.5 + 1,
          color,
          pulsePhase: Math.random() * Math.PI * 2,
          brightness
        });
      }
    }

    // Validate particles were created
    if (particles.length === 0) {
      console.error('No particles created from image - image may be too dark or transparent');
      setError('Image has no visible content to animate');
      return;
    }

    // Validate all particles have valid colors
    const validParticles = particles.filter(p =>
      p.color && p.color.startsWith('rgb') && !p.color.includes('undefined')
    );

    if (validParticles.length === 0) {
      console.error('No valid particles created - all had invalid colors');
      setError('Failed to extract colors from image');
      return;
    }

    particlesRef.current = validParticles;
    console.log(`Created ${validParticles.length} particles from image (${particles.length - validParticles.length} invalid particles filtered)`);

    // Shape generators
    const generateShape = (shape: ShapeType, index: number, total: number): { x: number; y: number; z: number } => {
      const particle = particlesRef.current[index];
      const t = index / total;
      const radius = 150;

      switch (shape) {
        case 'image':
          return {
            x: particle.imageX,
            y: particle.imageY,
            z: particle.imageZ
          };

        case 'scatter':
          // Random scattered positions
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * radius * 2;
          return {
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            z: (Math.random() - 0.5) * radius * 2
          };

        case 'sphere':
          // Spherical distribution
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = radius * Math.pow(Math.random(), 1 / 3);
          return {
            x: r * Math.sin(phi) * Math.cos(theta),
            y: r * Math.sin(phi) * Math.sin(theta),
            z: r * Math.cos(phi)
          };

        case 'wave':
          // Wave pattern
          const waveX = particle.imageX;
          const waveZ = particle.imageY;
          const waveY = Math.sin(waveX * 0.03 + waveZ * 0.03) * 50 + Math.cos(waveZ * 0.05) * 30;
          return { x: waveX, y: waveY, z: waveZ };

        case 'spiral':
          // Spiral formation
          const spiralAngle = t * Math.PI * 8;
          const spiralRadius = t * radius * 1.5;
          const spiralHeight = (t - 0.5) * radius * 1.5;
          return {
            x: Math.cos(spiralAngle) * spiralRadius,
            y: spiralHeight,
            z: Math.sin(spiralAngle) * spiralRadius
          };

        case 'cube':
          // Cube surface
          const cubeSize = radius * 1.2;
          const face = Math.floor(Math.random() * 6);
          const u = Math.random() - 0.5;
          const v = Math.random() - 0.5;

          const cubeFaces = [
            { x: cubeSize / 2, y: u * cubeSize, z: v * cubeSize },      // Right
            { x: -cubeSize / 2, y: u * cubeSize, z: v * cubeSize },     // Left
            { x: u * cubeSize, y: cubeSize / 2, z: v * cubeSize },      // Top
            { x: u * cubeSize, y: -cubeSize / 2, z: v * cubeSize },     // Bottom
            { x: u * cubeSize, y: v * cubeSize, z: cubeSize / 2 },      // Front
            { x: u * cubeSize, y: v * cubeSize, z: -cubeSize / 2 },     // Back
          ];

          return cubeFaces[face];
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

      // Shape morphing
      if (autoMorphInterval > 0) {
        shapeTimerRef.current += 1;
        const framesPerTransition = autoMorphInterval * 60; // Convert seconds to frames
        if (shapeTimerRef.current % framesPerTransition === 0) {
          const shapes: ShapeType[] = ['image', 'scatter', 'sphere', 'wave', 'spiral', 'cube'];
          const currentIndex = shapes.indexOf(currentShapeRef.current);
          currentShapeRef.current = shapes[(currentIndex + 1) % shapes.length];
          updateTargets();
        }
      }

      // Update rotation
      rotationRef.current.y += 0.003 * animationSpeed;
      rotationRef.current.x += 0.002 * animationSpeed;
      rotationRef.current.z += 0.001 * animationSpeed;

      // Sort particles by z-index for proper rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => {
        const rotatedA = rotateParticle3D(a, rotationRef.current);
        const rotatedB = rotateParticle3D(b, rotationRef.current);
        return rotatedB.z - rotatedA.z;
      });

      // Draw connection lines for nearby particles (only in non-image modes)
      if (currentShapeRef.current !== 'image') {
        sortedParticles.forEach((particle, i) => {
          const rotated1 = rotateParticle3D(particle, rotationRef.current);

          for (let j = i + 1; j < Math.min(i + 3, sortedParticles.length); j++) {
            const otherParticle = sortedParticles[j];
            const rotated2 = rotateParticle3D(otherParticle, rotationRef.current);

            const dx = rotated1.x - rotated2.x;
            const dy = rotated1.y - rotated2.y;
            const dz = rotated1.z - rotated2.z;
            const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance3D < 40) {
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
              const lineOpacity = (1 - distance3D / 40) * 0.1;
              ctx.strokeStyle = `rgba(200, 200, 200, ${lineOpacity})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      }

      // Draw particles
      sortedParticles.forEach(particle => {
        // Validate particle has valid color
        if (!particle.color || !particle.color.startsWith('rgb')) {
          return; // Skip invalid particles
        }

        // Smoothly move particles toward target
        const smoothing = currentShapeRef.current === 'scatter' ? 0.001 : 0.002;
        particle.vx += (particle.targetX - particle.x) * smoothing;
        particle.vy += (particle.targetY - particle.y) * smoothing;
        particle.vz += (particle.targetZ - particle.z) * smoothing;

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

        // Skip if position is invalid
        if (!isFinite(x2d) || !isFinite(y2d) || !isFinite(scale)) {
          return;
        }

        // Calculate opacity based on z position
        const depthOpacity = Math.max(0.3, Math.min(1, (rotated.z + 300) / 600));

        // Pulse effect (subtle)
        particle.pulsePhase += 0.03;
        const pulse = 1 + Math.sin(particle.pulsePhase) * 0.15;

        // Draw particle
        const finalRadius = particle.radius * scale * pulse;

        // Skip if radius is too small or too large
        if (finalRadius < 0.1 || finalRadius > 100) {
          return;
        }

        try {
          // Glow effect
          const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, finalRadius * 2);
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(0.5, particle.color.replace('rgb', 'rgba').replace(')', `, ${depthOpacity * 0.3})`));
          gradient.addColorStop(1, particle.color.replace('rgb', 'rgba').replace(')', ', 0)'));

          ctx.beginPath();
          ctx.arc(x2d, y2d, finalRadius * 2, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();

          // Core particle
          ctx.beginPath();
          ctx.arc(x2d, y2d, finalRadius, 0, Math.PI * 2);
          ctx.fillStyle = particle.color.replace('rgb', 'rgba').replace(')', `, ${depthOpacity})`);
          ctx.fill();

          // Bright highlight for particles in front
          if (rotated.z > 0 && depthOpacity > 0.7 && particle.brightness > 0.7) {
            ctx.beginPath();
            ctx.arc(x2d, y2d, finalRadius * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${depthOpacity * 0.6})`;
            ctx.fill();
          }
        } catch (error) {
          // Skip particles that cause rendering errors
          console.warn('Error rendering particle:', error);
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [isLoaded, particleDensity, animationSpeed, autoMorphInterval]);

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

  if (error) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-sm">Loading image...</div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
