'use client';

import { FC, useState, useMemo } from 'react';
import { RadarSignal } from '@/types';

interface RadarChartProps {
  signals: RadarSignal[];
  onSignalClick?: (signal: RadarSignal) => void;
}

const RadarChart: FC<RadarChartProps> = ({ signals, onSignalClick }) => {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);
  const [selectedRing, setSelectedRing] = useState<string | null>(null);
  const [hoveredSignal, setHoveredSignal] = useState<RadarSignal | null>(null);

  // Strategy& minimal color scheme
  const quadrants = [
    { name: 'Social', angle: 60, color: '#C52A2F' },
    { name: 'Technological', angle: 120, color: '#D93954' },
    { name: 'Economic', angle: 180, color: '#C52A2F' },
    { name: 'Environmental', angle: 240, color: '#D93954' },
    { name: 'Political', angle: 300, color: '#C52A2F' },
    { name: 'Geopolitical', angle: 0, color: '#D93954' },
  ];

  const rings = [
    { name: 'Now', radius: 25, label: '0-12mo' },
    { name: 'Next', radius: 50, label: '1-3yr' },
    { name: 'Later', radius: 75, label: '3-10yr' },
  ];

  const centerX = 50;
  const centerY = 50;
  const maxRadius = 75;

  const getSignalPosition = (signal: RadarSignal) => {
    const quadrant = quadrants.find(q => q.name === signal.quadrant);
    if (!quadrant) return { x: centerX, y: centerY };

    const ring = rings.find(r => r.name === signal.ring);
    if (!ring) return { x: centerX, y: centerY };

    const baseAngle = quadrant.angle;
    const angleVariation = (Math.random() - 0.5) * 50;
    const angle = (baseAngle + angleVariation) * (Math.PI / 180);

    const radiusVariation = (Math.random() - 0.5) * 5;
    const radius = ring.radius + radiusVariation;

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return { x, y };
  };

  const signalPositions = useMemo(() => {
    return signals.map(signal => ({
      signal,
      position: getSignalPosition(signal),
    }));
  }, [signals]);

  const filteredSignals = signalPositions.filter(({ signal }) => {
    if (selectedQuadrant && signal.quadrant !== selectedQuadrant) return false;
    if (selectedRing && signal.ring !== selectedRing) return false;
    return true;
  });

  const getSignalSize = (signal: RadarSignal) => {
    const score = signal.priority_score || (signal.impact_0to5 * signal.likelihood_0to5);
    return 0.8 + (score / 25) * 1.2;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div
        className="relative w-full aspect-square bg-[#111214] rounded-lg overflow-hidden border border-[#232427]"
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
        >

          {rings.map((ring, idx) => (
            <circle
              key={idx}
              cx={centerX}
              cy={centerY}
              r={ring.radius}
              fill="none"
              stroke="#232427"
              strokeWidth="0.2"
              className={`transition-all duration-280 cursor-pointer ${
                selectedRing === ring.name ? 'opacity-100' : 'opacity-100'
              }`}
              onClick={() => setSelectedRing(selectedRing === ring.name ? null : ring.name)}
            />
          ))}

          {quadrants.map((quadrant, idx) => {
            const angle = quadrant.angle * (Math.PI / 180);
            return (
              <line
                key={idx}
                x1={centerX}
                y1={centerY}
                x2={centerX + maxRadius * Math.cos(angle)}
                y2={centerY + maxRadius * Math.sin(angle)}
                stroke="#232427"
                strokeWidth="0.15"
              />
            );
          })}

          <circle
            cx={centerX}
            cy={centerY}
            r="1"
            fill="#111214"
            stroke="#232427"
            strokeWidth="0.2"
          />

          {filteredSignals.map(({ signal, position }, idx) => {
            const quadrant = quadrants.find(q => q.name === signal.quadrant);
            const size = getSignalSize(signal);
            const isHovered = hoveredSignal?.title === signal.title;

            return (
              <g
                key={idx}
                className="cursor-pointer"
                onClick={() => onSignalClick?.(signal)}
                onMouseEnter={() => setHoveredSignal(signal)}
                onMouseLeave={() => setHoveredSignal(null)}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={isHovered ? size * 1.2 : size}
                  fill={quadrant?.color}
                  opacity={isHovered ? 1 : 0.9}
                  className="transition-all duration-280"
                />

                {signal.direction === 'up' && (
                  <path
                    d={`M ${position.x} ${position.y - size - 0.8} L ${position.x - 0.4} ${position.y - size - 0.3} L ${position.x + 0.4} ${position.y - size - 0.3} Z`}
                    fill={quadrant?.color}
                    opacity={isHovered ? 1 : 0.9}
                  />
                )}
              </g>
            );
          })}

          {rings.map((ring, idx) => (
            <text
              key={idx}
              x={centerX}
              y={centerY - ring.radius - 2}
              textAnchor="middle"
              fontSize="2"
              fill="#F5F3EE"
              opacity="0.6"
              className="font-sans tracking-tight"
              style={{ letterSpacing: '-0.005em' }}
            >
              {ring.label}
            </text>
          ))}
        </svg>

        {hoveredSignal && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-[#111214] border border-[#232427] rounded-lg px-6 py-4 max-w-md z-50">
            <div className="flex items-start gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0"
                style={{
                  backgroundColor: quadrants.find(q => q.name === hoveredSignal.quadrant)?.color
                }}
              />
              <div>
                <h4 className="text-[#F5F3EE] font-medium text-sm mb-1" style={{ letterSpacing: '-0.005em' }}>{hoveredSignal.title}</h4>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>
                  <span className="px-2 py-0.5 bg-[#111214] rounded border border-[#232427]">{hoveredSignal.ring}</span>
                  <span className="px-2 py-0.5 bg-[#111214] rounded border border-[#232427]">{hoveredSignal.quadrant}</span>
                  <span>Impact: {hoveredSignal.impact_0to5}/5</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
        {quadrants.map((quadrant) => {
          const count = signals.filter(s => s.quadrant === quadrant.name).length;
          const isSelected = selectedQuadrant === quadrant.name;

          return (
            <button
              key={quadrant.name}
              onClick={() => setSelectedQuadrant(isSelected ? null : quadrant.name)}
              className={`p-4 rounded-lg border transition-all duration-280 ${
                isSelected
                  ? 'bg-[#111214] border-[#C52A2F]'
                  : 'bg-[#111214] border-[#232427] hover:border-[#C52A2F]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: quadrant.color
                  }}
                />
                <div className="flex-1 text-left">
                  <div className="text-[#F5F3EE] font-medium text-sm" style={{ letterSpacing: '-0.005em' }}>{quadrant.name}</div>
                  <div className="text-xs" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>{count} signals</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        {rings.map((ring) => {
          const isSelected = selectedRing === ring.name;
          return (
            <button
              key={ring.name}
              onClick={() => setSelectedRing(isSelected ? null : ring.name)}
              className={`px-6 py-2.5 rounded-lg border text-sm font-medium transition-all duration-280 ${
                isSelected
                  ? 'bg-[#111214] border-[#C52A2F] text-[#F5F3EE]'
                  : 'bg-[#111214] border-[#232427] hover:border-[#C52A2F]/50'
              }`}
              style={{
                color: isSelected ? '#F5F3EE' : 'rgba(245, 243, 238, 0.6)',
                letterSpacing: '-0.005em'
              }}
            >
              {ring.name} <span className="text-xs opacity-60">({ring.label})</span>
            </button>
          );
        })}
      </div>

      {(selectedQuadrant || selectedRing) && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setSelectedQuadrant(null);
              setSelectedRing(null);
            }}
            className="text-sm hover:text-[#F5F3EE] underline underline-offset-4 transition-colors duration-280"
            style={{ color: 'rgba(245, 243, 238, 0.6)', letterSpacing: '-0.005em' }}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default RadarChart;
