'use client';

import { useState, useMemo, useRef, useEffect } from 'react';

interface ClusterChartProps {
  data: any;
}

export default function ClusterChart({ data }: ClusterChartProps) {
  const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | 'grid'>('2d');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!data || !data.clusters || data.clusters.length === 0) {
    return <p className="text-gray-400 text-center py-8">No clustering data available</p>;
  }

  const clusters = data.clusters.slice(0, 15);
  const maxSize = Math.max(...clusters.map((c: any) => c.size));

  // Generate 2D positions for clusters based on their characteristics
  const clusterPositions = useMemo(() => {
    return clusters.map((cluster: any, idx: number) => {
      // Use sentiment and size to create natural clustering in 2D space
      const sentiment = cluster.avg_sentiment || 0;
      const normalizedSize = cluster.size / maxSize;

      // Create a spiral-like distribution with sentiment affecting vertical position
      const angle = (idx / clusters.length) * Math.PI * 2;
      const radius = 20 + (normalizedSize * 30);

      return {
        x: 50 + Math.cos(angle) * radius + (sentiment * 10),
        y: 50 + Math.sin(angle) * radius - (sentiment * 15),
        size: normalizedSize
      };
    });
  }, [clusters, maxSize]);

  const getClusterColor = (idx: number, sentiment: number) => {
    // Color based on sentiment
    if (sentiment > 0.2) return {
      main: 'rgb(34, 197, 94)',
      bg: 'rgba(34, 197, 94, 0.15)',
      border: 'rgba(34, 197, 94, 0.4)',
      text: 'text-green-400'
    };
    if (sentiment < -0.2) return {
      main: 'rgb(239, 68, 68)',
      bg: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.4)',
      text: 'text-red-400'
    };

    // Neutral - use varied colors
    const colors = [
      { main: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', text: 'text-blue-400' },
      { main: 'rgb(168, 85, 247)', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.4)', text: 'text-purple-400' },
      { main: 'rgb(236, 72, 153)', bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', text: 'text-pink-400' },
      { main: 'rgb(14, 165, 233)', bg: 'rgba(14, 165, 233, 0.15)', border: 'rgba(14, 165, 233, 0.4)', text: 'text-cyan-400' },
      { main: 'rgb(245, 158, 11)', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' },
    ];
    return colors[idx % colors.length];
  };

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.2) return { label: 'Positive', icon: '😊', color: 'text-green-400' };
    if (sentiment > 0) return { label: 'Slightly Positive', icon: '🙂', color: 'text-green-300' };
    if (sentiment < -0.2) return { label: 'Negative', icon: '😟', color: 'text-red-400' };
    if (sentiment < 0) return { label: 'Slightly Negative', icon: '😐', color: 'text-orange-400' };
    return { label: 'Neutral', icon: '😐', color: 'text-gray-400' };
  };

  // Zoom and pan handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev * 1.2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev / 1.2));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (viewMode === 'grid') {
    return (
      <div className="space-y-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setViewMode('2d')}
            className="px-3 py-1.5 text-xs bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg transition-colors"
          >
            Switch to 2D View
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {clusters.map((cluster: any, idx: number) => {
            const colors = getClusterColor(idx, cluster.avg_sentiment || 0);
            const sentiment = getSentimentLabel(cluster.avg_sentiment || 0);
            const sizePercent = (cluster.size / maxSize) * 100;

            return (
              <div
                key={idx}
                className="p-4 rounded-lg border bg-dark-600/40 border-dark-400/40 hover:border-accent-red/40 hover:scale-[1.02] transition-all cursor-pointer"
                style={{ borderColor: colors.border }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`text-base font-bold ${colors.text}`}>
                      Topic {idx + 1}
                    </div>
                    <span className="text-lg">{sentiment.icon}</span>
                  </div>
                  <div className="px-2 py-1 rounded bg-dark-500/40 border border-dark-400/30">
                    <span className={`text-sm font-mono font-bold ${colors.text}`}>
                      {cluster.size}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sizePercent}%`, backgroundColor: colors.main }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.keywords.slice(0, 5).map((keyword: string, kidx: number) => (
                      <span
                        key={kidx}
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${colors.text}`}
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                    <span>{cluster.size} article{cluster.size !== 1 ? 's' : ''}</span>
                    <span className={sentiment.color}>{sentiment.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-dark-400/40 pt-4 flex items-center justify-between text-sm">
          <div className="text-gray-400">
            <span className="text-white font-semibold">{data.articles_clustered}</span> of{' '}
            <span className="text-white font-semibold">{data.total_articles}</span> articles clustered into{' '}
            <span className="text-white font-semibold">{data.cluster_count}</span> topic groups
          </div>
        </div>
      </div>
    );
  }

  // 2D Scatter Plot View
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Positive Sentiment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-400">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Negative Sentiment</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Zoom: {(zoom * 100).toFixed(0)}%</span>
          <button
            onClick={() => setViewMode('grid')}
            className="px-3 py-1.5 text-xs bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg transition-colors"
          >
            Switch to Grid View
          </button>
        </div>
      </div>

      {/* 2D Visualization Canvas */}
      <div
        ref={canvasRef}
        className="relative w-full bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 overflow-hidden"
        style={{ height: '600px', cursor: isDragging ? 'grabbing' : 'grab' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-600"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Axis labels */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-medium">
          Topic Distribution
        </div>
        <div className="absolute top-1/2 left-2 -translate-y-1/2 -rotate-90 text-xs text-gray-500 font-medium">
          Sentiment Scale
        </div>

        {/* Zoom/Pan container */}
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Clusters as bubbles */}
          {clusters.map((cluster: any, idx: number) => {
            const position = clusterPositions[idx];
            const colors = getClusterColor(idx, cluster.avg_sentiment || 0);
            const sentiment = getSentimentLabel(cluster.avg_sentiment || 0);
            const isHovered = hoveredCluster === idx;
            const bubbleSize = 40 + (position.size * 120);

            return (
              <div
                key={idx}
                className="absolute transition-all duration-300 cursor-pointer group"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
                  zIndex: isHovered ? 50 : 10
                }}
                onMouseEnter={() => setHoveredCluster(idx)}
                onMouseLeave={() => setHoveredCluster(null)}
              >
              {/* Bubble */}
              <div
                className="rounded-full border-2 backdrop-blur-sm transition-all duration-300 flex items-center justify-center relative"
                style={{
                  width: `${bubbleSize}px`,
                  height: `${bubbleSize}px`,
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  boxShadow: isHovered ? `0 0 30px ${colors.main}` : `0 0 15px ${colors.bg}`
                }}
              >
                {/* Cluster number */}
                <div className={`text-lg font-bold ${colors.text}`}>
                  {idx + 1}
                </div>

                {/* Sentiment indicator */}
                <div className="absolute -top-1 -right-1 text-xl">
                  {sentiment.icon}
                </div>

                {/* Pulse effect */}
                {isHovered && (
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: colors.main }}
                  />
                )}
              </div>

              {/* Tooltip on hover */}
              {isHovered && (
                <div
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-dark-600/95 backdrop-blur-md border rounded-lg p-3 shadow-xl z-50 min-w-[250px]"
                  style={{ borderColor: colors.border }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-bold ${colors.text}`}>Topic Cluster {idx + 1}</div>
                    <div className={`text-sm ${sentiment.color}`}>
                      {sentiment.icon} {sentiment.label}
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mb-2">
                    {cluster.size} articles • Sentiment: {(cluster.avg_sentiment || 0).toFixed(3)}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {cluster.keywords.slice(0, 8).map((keyword: string, kidx: number) => (
                      <span
                        key={kidx}
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${colors.text}`}
                        style={{
                          backgroundColor: colors.bg,
                          borderColor: colors.border
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>

                  {cluster.top_titles && cluster.top_titles.length > 0 && (
                    <div className="text-xs text-gray-300 border-t border-dark-400/40 pt-2 mt-2">
                      <div className="font-medium text-gray-400 mb-1">Sample articles:</div>
                      {cluster.top_titles.slice(0, 2).map((title: string, tidx: number) => (
                        <div key={tidx} className="text-xs text-gray-400 truncate mb-0.5">
                          • {title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

          {/* Center reference point */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-600 rounded-full"></div>
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-dark-600/90 backdrop-blur-md border border-dark-400/40 rounded-lg p-2 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-dark-500 hover:bg-dark-400 text-gray-300 hover:text-white rounded transition-colors"
            title="Zoom In (Scroll Up)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-dark-500 hover:bg-dark-400 text-gray-300 hover:text-white rounded transition-colors"
            title="Zoom Out (Scroll Down)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-dark-500 hover:bg-dark-400 text-gray-300 hover:text-white rounded transition-colors"
            title="Reset View"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Instructions overlay */}
        <div className="absolute top-4 left-4 bg-dark-600/80 backdrop-blur-md border border-dark-400/40 rounded-lg px-3 py-2 text-xs text-gray-300">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">Controls:</span>
          </div>
          <div className="space-y-0.5">
            <div>🖱️ Scroll to zoom</div>
            <div>✋ Click & drag to pan</div>
            <div>👆 Hover bubbles for details</div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="border-t border-dark-400/40 pt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-white">{data.articles_clustered}</div>
          <div className="text-xs text-gray-400">Articles Clustered</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{data.cluster_count}</div>
          <div className="text-xs text-gray-400">Topic Groups</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-white">
            {((data.articles_clustered / data.total_articles) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-gray-400">Coverage</div>
        </div>
      </div>
    </div>
  );
}
