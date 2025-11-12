'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">
    <div className="text-strategyand-off-white/50">Loading visualization...</div>
  </div>
});

interface Node {
  lat: number;
  lng: number;
  label: string;
  color: string;
  size: number;
}

interface Arc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

interface SystemCompassGlobeProps {
  nodes?: Node[];
  arcs?: Arc[];
}

export default function SystemCompassGlobe({ nodes = [], arcs = [] }: SystemCompassGlobeProps) {
  const globeEl = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Generate sample network data if none provided
  const generateSampleData = () => {
    // Create hub and spoke network pattern (like systems thinking)
    const hubs = [
      { lat: 40.7128, lng: -74.0060, label: 'Policy Hub', color: '#C52A2F', size: 0.8 },
      { lat: 51.5074, lng: -0.1278, label: 'Economic System', color: '#D93954', size: 0.7 },
      { lat: 35.6762, lng: 139.6503, label: 'Social System', color: '#FF8B9D', size: 0.7 },
      { lat: -33.8688, lng: 151.2093, label: 'Environmental', color: '#FFA5B4', size: 0.7 },
      { lat: 48.8566, lng: 2.3522, label: 'Infrastructure', color: '#A32020', size: 0.6 },
      { lat: 37.7749, lng: -122.4194, label: 'Technology', color: '#C52A2F', size: 0.6 },
    ];

    const sampleNodes = hubs;

    // Create interconnected arcs between nodes
    const sampleArcs: Arc[] = [];
    hubs.forEach((start, i) => {
      hubs.forEach((end, j) => {
        if (i < j && Math.random() > 0.3) { // 70% connection probability
          sampleArcs.push({
            startLat: start.lat,
            startLng: start.lng,
            endLat: end.lat,
            endLng: end.lng,
            color: ['#C52A2F', '#D93954', '#FF8B9D'][Math.floor(Math.random() * 3)]
          });
        }
      });
    });

    return { nodes: sampleNodes, arcs: sampleArcs };
  };

  const { nodes: displayNodes, arcs: displayArcs } = nodes.length > 0
    ? { nodes, arcs }
    : generateSampleData();

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (globeEl.current && globeReady) {
      // Initial camera position
      globeEl.current.pointOfView({ lat: 30, lng: 0, altitude: 2 }, 0);

      // Enable smooth auto-rotation
      const controls = globeEl.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.5;
        controls.enableZoom = true;
        controls.minDistance = 200;
        controls.maxDistance = 500;
      }
    }
  }, [globeReady]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Globe
        ref={globeEl}
        width={dimensions.width}
        height={dimensions.height}
        onGlobeReady={() => setGlobeReady(true)}

        // Globe appearance
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundColor="rgba(0,0,0,0)"

        // Points (nodes)
        pointsData={displayNodes}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lng}
        pointColor={(d: any) => d.color}
        pointAltitude={0.02}
        pointRadius={(d: any) => d.size || 0.5}
        pointLabel={(d: any) => `<div style="color: white; background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${d.label}</div>`}

        // Arcs (connections)
        arcsData={displayArcs}
        arcStartLat={(d: any) => d.startLat}
        arcStartLng={(d: any) => d.startLng}
        arcEndLat={(d: any) => d.endLat}
        arcEndLng={(d: any) => d.endLng}
        arcColor={(d: any) => d.color}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashInitialGap={() => Math.random()}
        arcDashAnimateTime={4000}
        arcStroke={0.3}
        arcAltitude={0.1}
        arcAltitudeAutoScale={0.3}

        // Atmosphere
        atmosphereColor="#C52A2F"
        atmosphereAltitude={0.25}

        // Animation
        enablePointerInteraction={true}
      />
    </div>
  );
}
