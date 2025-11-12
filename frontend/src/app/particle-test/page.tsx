'use client';

import { useState } from 'react';
import ImageParticleAnimation from '@/components/ImageParticleAnimation';
import Link from 'next/link';

export default function ParticleTestPage() {
  const [particleDensity, setParticleDensity] = useState(3);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [autoMorphInterval, setAutoMorphInterval] = useState(5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-700 via-dark-600 to-dark-700 flex flex-col">
      {/* Header */}
      <header className="px-8 py-4 border-b border-dark-300/40 backdrop-blur-md bg-dark-600/40">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-strategyand-maroon rounded flex items-center justify-center shadow-md">
                <span className="text-white font-serif text-3xl font-bold">&</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-serif text-neutral-50">Image Particle Test</span>
                <span className="text-[10px] font-serif italic text-neutral-400">Custom Image Animations</span>
              </div>
            </Link>
          </div>
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-200 transition-colors text-sm"
          >
            ← Back to Home
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl lg:text-5xl font-normal mb-4 text-neutral-50">
              Image Particle Animation
            </h1>
            <p className="text-lg text-neutral-300 mb-2">
              Transform any image into an interactive 3D particle system
            </p>
            <p className="text-sm text-neutral-400">
              Particles automatically morph between the image and various 3D shapes
            </p>
          </div>

          {/* Animation Display */}
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            {/* Main Animation Area */}
            <div className="lg:col-span-2">
              <div className="strategyand-card-glass rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <ImageParticleAnimation
                  imagePath="/portrait-demo.png"
                  particleDensity={particleDensity}
                  animationSpeed={animationSpeed}
                  autoMorphInterval={autoMorphInterval}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Controls Panel */}
            <div className="lg:col-span-1">
              <div className="strategyand-card-glass rounded-lg p-6 space-y-6">
                <div>
                  <h3 className="text-xl font-serif text-neutral-50 mb-4">Animation Controls</h3>
                  <p className="text-sm text-neutral-400 mb-6">
                    Adjust parameters to customize the particle behavior
                  </p>
                </div>

                {/* Particle Density */}
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Particle Density: {particleDensity}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={particleDensity}
                    onChange={(e) => setParticleDensity(Number(e.target.value))}
                    className="w-full h-2 bg-dark-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>Sparse</span>
                    <span>Dense</span>
                  </div>
                </div>

                {/* Animation Speed */}
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Rotation Speed: {animationSpeed.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={animationSpeed}
                    onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                    className="w-full h-2 bg-dark-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Auto-Morph Interval */}
                <div>
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Shape Change Interval: {autoMorphInterval}s
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={autoMorphInterval}
                    onChange={(e) => setAutoMorphInterval(Number(e.target.value))}
                    className="w-full h-2 bg-dark-500 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-neutral-500 mt-1">
                    <span>Off</span>
                    <span>10s</span>
                  </div>
                  {autoMorphInterval === 0 && (
                    <p className="text-xs text-neutral-500 mt-2">
                      Auto-morphing disabled
                    </p>
                  )}
                </div>

                {/* Shape Sequence Info */}
                <div className="pt-4 border-t border-dark-400">
                  <h4 className="text-sm font-medium text-neutral-200 mb-3">Shape Sequence</h4>
                  <div className="space-y-2 text-xs text-neutral-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-strategyand-accent rounded-full"></div>
                      <span>Original Image</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-strategyand-red rounded-full"></div>
                      <span>Scattered Particles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-strategyand-maroon rounded-full"></div>
                      <span>Sphere Formation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-strategyand-accent rounded-full"></div>
                      <span>Wave Pattern</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-strategyand-red rounded-full"></div>
                      <span>Spiral Formation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-strategyand-maroon rounded-full"></div>
                      <span>Cube Structure</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Card */}
              <div className="strategyand-card-glass rounded-lg p-6 mt-6">
                <h4 className="text-sm font-medium text-neutral-200 mb-3">How it Works</h4>
                <ul className="space-y-2 text-xs text-neutral-400">
                  <li className="flex items-start gap-2">
                    <span className="text-strategyand-accent mt-0.5">•</span>
                    <span>Samples pixel data from the source image</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-strategyand-accent mt-0.5">•</span>
                    <span>Creates particles with colors matching the pixels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-strategyand-accent mt-0.5">•</span>
                    <span>Applies 3D rotation and perspective transformations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-strategyand-accent mt-0.5">•</span>
                    <span>Smoothly transitions between different formations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-strategyand-accent mt-0.5">•</span>
                    <span>Draws connection lines between nearby particles</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="strategyand-card-glass rounded-lg p-8">
            <h3 className="text-2xl font-serif text-neutral-50 mb-4">Technical Implementation</h3>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-neutral-200 mb-2">Rendering</h4>
                <p className="text-neutral-400">
                  Uses HTML5 Canvas 2D API with high DPI support for crisp visuals on retina displays.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-neutral-200 mb-2">Performance</h4>
                <p className="text-neutral-400">
                  Optimized particle system with efficient sorting and culling. Handles thousands of particles at 60fps.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-neutral-200 mb-2">Customization</h4>
                <p className="text-neutral-400">
                  Fully configurable with props for density, speed, and morph intervals. Works with any image.
                </p>
              </div>
            </div>
          </div>

          {/* Usage Example */}
          <div className="strategyand-card-glass rounded-lg p-8 mt-8">
            <h3 className="text-2xl font-serif text-neutral-50 mb-4">Usage Example</h3>
            <div className="bg-dark-800 rounded-lg p-6 overflow-x-auto">
              <pre className="text-sm text-neutral-300 font-mono">
                <code>{`import ImageParticleAnimation from '@/components/ImageParticleAnimation';

<ImageParticleAnimation
  imagePath="/your-image.png"
  particleDensity={5}        // 1-10, controls particle count
  animationSpeed={1.2}       // 0.1-2.0, rotation speed
  autoMorphInterval={5}      // seconds between shapes (0 = off)
  className="w-full h-96"
/>`}</code>
              </pre>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-dark-300/30 text-center backdrop-blur-sm bg-dark-600/40">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-400 text-sm">
            Image Particle Animation - Strategy& Ideation Center
          </p>
        </div>
      </footer>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #C52A2F;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          background: #D93954;
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #C52A2F;
          cursor: pointer;
          border: none;
          transition: all 0.15s ease;
        }

        .slider::-moz-range-thumb:hover {
          background: #D93954;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
