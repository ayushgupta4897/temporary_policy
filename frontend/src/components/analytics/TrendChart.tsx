'use client';

import { useState, useMemo } from 'react';

interface TrendChartProps {
  data: any;
}

export default function TrendChart({ data }: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'line' | 'bar'>('bar');

  if (!data || !data.daily_timeline || data.daily_timeline.length === 0) {
    return <p className="text-gray-400 text-center py-8">No trend data available</p>;
  }

  const timeline = data.daily_timeline.slice(-30);
  const maxCount = Math.max(...timeline.map((d: any) => d.article_count));
  const minCount = Math.min(...timeline.map((d: any) => d.article_count));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const velocity = data.velocity_trend;
  const trendingTopics = data.top_trending_topics?.slice(0, 5) || [];

  // Calculate statistics
  const stats = useMemo(() => {
    const counts = timeline.map((d: any) => d.article_count);
    const total = counts.reduce((a: number, b: number) => a + b, 0);
    const avg = total / counts.length;
    const current = counts[counts.length - 1];
    const previous = counts[counts.length - 2];
    const dayChange = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return { total, avg, current, dayChange, max: maxCount, min: minCount };
  }, [timeline, maxCount, minCount]);

  // Generate SVG path for line chart
  const generatePath = () => {
    const width = 100;
    const height = 100;
    const points = timeline.map((day: any, idx: number) => {
      const x = (idx / (timeline.length - 1)) * width;
      const normalized = (day.article_count - minCount) / (maxCount - minCount);
      const y = height - (normalized * height);
      return { x, y, count: day.article_count };
    });

    const pathD = points.map((p: any, i: number) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    const areaD = `M 0 ${height} L ${points.map((p: any) => `${p.x} ${p.y}`).join(' L ')} L ${width} ${height} Z`;

    return { pathD, areaD, points };
  };

  const { pathD, areaD, points } = generatePath();

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Current Count */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">Today</div>
          <div className="text-2xl sm:text-3xl font-bold mb-1 text-blue-400">
            {stats.current}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Articles</div>
        </div>

        {/* Velocity Trend */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">Velocity</div>
          <div className={`font-bold mb-1 flex items-center gap-2 ${
            velocity?.direction === 'increasing' ? 'text-green-400' :
            velocity?.direction === 'decreasing' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            <span className="text-2xl sm:text-3xl">
              {velocity?.direction === 'increasing' ? '📈' : velocity?.direction === 'decreasing' ? '📉' : '➡️'}
            </span>
            <span className="text-lg sm:text-xl capitalize">{velocity?.direction || 'Stable'}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-300">
            Confidence: <span className={`font-medium ${
              velocity?.confidence === 'high' ? 'text-green-400' :
              velocity?.confidence === 'medium' ? 'text-yellow-400' :
              'text-orange-400'
            }`}>{velocity?.confidence || 'N/A'}</span>
          </div>
        </div>

        {/* Average */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">30-Day Avg</div>
          <div className="text-2xl sm:text-3xl font-bold mb-1 text-purple-400">
            {stats.avg.toFixed(1)}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Articles/day</div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">Total (30d)</div>
          <div className="text-2xl sm:text-3xl font-bold mb-1 text-cyan-400">
            {stats.total}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Articles</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-end">
        <div className="flex gap-1 bg-dark-700/50 rounded-lg p-1">
          <button
            onClick={() => setViewType('bar')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewType === 'bar'
                ? 'bg-accent-red text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setViewType('line')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewType === 'line'
                ? 'bg-accent-red text-white'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Line Chart
          </button>
        </div>
      </div>

      {/* Chart */}
      {viewType === 'bar' ? (
        <div className="relative bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-6">
          <div className="relative h-48 flex items-end gap-px">
            {timeline.map((day: any, idx: number) => {
              const height = (day.article_count / maxCount) * 100;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div
                    className="w-full bg-gradient-to-t from-accent-maroon to-accent-red rounded-t transition-all"
                    style={{
                      height: `${height}%`,
                      opacity: hoveredIndex === idx ? 1 : 0.8,
                      minHeight: '2px'
                    }}
                  />
                  {hoveredIndex === idx && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-dark-600/95 backdrop-blur-md border border-dark-400/60 px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl z-10">
                      <div className="text-accent-red font-bold mb-0.5">{day.article_count} articles</div>
                      <div className="text-gray-300">{formatDateFull(day.date)}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-dark-400/40 pt-3 mt-3">
            <span className="text-gray-400">{formatDate(timeline[0].date)}</span>
            <span className="text-gray-400 font-medium">Article volume over time (30 days)</span>
            <span className="text-gray-400">{formatDate(timeline[timeline.length - 1].date)}</span>
          </div>
        </div>
      ) : (
        // Line Chart View
        <div className="relative bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-6">
          <div className="relative" style={{ height: '250px' }}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gradient definition */}
              <defs>
                <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#D93954', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#A32020', stopOpacity: 0.05 }} />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="rgba(156, 163, 175, 0.1)"
                  strokeWidth="0.2"
                />
              ))}

              {/* Area fill */}
              <path
                d={areaD}
                fill="url(#volumeGradient)"
              />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#D93954"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((point: any, idx: number) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r={hoveredIndex === idx ? 1.5 : 0.8}
                  fill="#D93954"
                  stroke="white"
                  strokeWidth="0.2"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              ))}
            </svg>

            {/* Hover tooltip */}
            {hoveredIndex !== null && (
              <div
                className="absolute bg-dark-600/95 backdrop-blur-md border border-dark-400/60 rounded-lg px-3 py-2 shadow-xl z-20 pointer-events-none"
                style={{
                  left: `${(hoveredIndex / (timeline.length - 1)) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="text-accent-red font-bold mb-0.5">
                  {timeline[hoveredIndex].article_count} articles
                </div>
                <div className="text-gray-300 text-xs">
                  {formatDateFull(timeline[hoveredIndex].date)}
                </div>
              </div>
            )}

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-10">
              <span className="text-gray-400">{maxCount}</span>
              <span className="text-gray-500">{Math.round((maxCount + minCount) / 2)}</span>
              <span className="text-gray-400">{minCount}</span>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-4 px-1">
            <span className="text-gray-400">{formatDate(timeline[0].date)}</span>
            <span className="text-gray-400 font-medium">Article volume over time (30 days)</span>
            <span className="text-gray-400">{formatDate(timeline[timeline.length - 1].date)}</span>
          </div>
        </div>
      )}

      {/* Trending Topics */}
      {trendingTopics.length > 0 && (
        <div className="bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Top Trending Topics</h3>
            <span className="text-xs text-gray-500">Momentum (articles/day)</span>
          </div>
          <div className="space-y-3">
            {trendingTopics.map((topic: any, idx: number) => {
              const maxMomentum = Math.max(...trendingTopics.map((t: any) => t.momentum));
              const barWidth = (topic.momentum / maxMomentum) * 100;

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 font-medium">{idx + 1}. {topic.topic}</span>
                    <span className="text-accent-red font-mono text-xs font-bold">{topic.momentum.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-maroon to-accent-red rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
