'use client';

import { useState, useMemo } from 'react';

interface SentimentTimelineProps {
  data: any;
}

export default function SentimentTimeline({ data }: SentimentTimelineProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewType, setViewType] = useState<'line' | 'bar'>('line');

  if (!data || !data.daily_sentiment || data.daily_sentiment.length === 0) {
    return <p className="text-gray-400 text-center py-8">No sentiment data available</p>;
  }

  const timeline = data.daily_sentiment.slice(-30);
  const maxSentiment = 1;
  const minSentiment = -1;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatDateFull = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const trend = data.overall_trend;

  // Calculate statistics
  const stats = useMemo(() => {
    const sentiments = timeline.map((d: any) => d.avg_sentiment);
    const avg = sentiments.reduce((a: number, b: number) => a + b, 0) / sentiments.length;
    const max = Math.max(...sentiments);
    const min = Math.min(...sentiments);
    const current = sentiments[sentiments.length - 1];
    const previous = sentiments[sentiments.length - 2];
    const dayChange = ((current - previous) / Math.abs(previous)) * 100;

    return { avg, max, min, current, dayChange };
  }, [timeline]);

  // Generate SVG path for line chart
  const generatePath = () => {
    const width = 100;
    const height = 100;
    const points = timeline.map((day: any, idx: number) => {
      const x = (idx / (timeline.length - 1)) * width;
      const sentiment = day.avg_sentiment;
      const normalized = ((sentiment - minSentiment) / (maxSentiment - minSentiment));
      const y = height - (normalized * height);
      return { x, y, sentiment };
    });

    const pathD = points.map((p: any, i: number) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    const areaD = `M 0 ${height} L ${points.map((p: any) => `${p.x} ${p.y}`).join(' L ')} L ${width} ${height} Z`;

    return { pathD, areaD, points };
  };

  const { pathD, areaD, points } = generatePath();

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return { color: 'rgb(34, 197, 94)', label: 'Positive', gradient: 'from-green-500/30 to-green-500/5' };
    if (sentiment > 0) return { color: 'rgb(74, 222, 128)', label: 'Slightly Positive', gradient: 'from-green-400/30 to-green-400/5' };
    if (sentiment < -0.2) return { color: 'rgb(239, 68, 68)', label: 'Negative', gradient: 'from-red-500/30 to-red-500/5' };
    if (sentiment < 0) return { color: 'rgb(248, 113, 113)', label: 'Slightly Negative', gradient: 'from-orange-400/30 to-orange-400/5' };
    return { color: 'rgb(156, 163, 175)', label: 'Neutral', gradient: 'from-gray-500/30 to-gray-500/5' };
  };

  const currentSentiment = getSentimentColor(stats.current);

  return (
    <div className="space-y-4">
      {/* Header with statistics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Current Sentiment */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">Current</div>
          <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: currentSentiment.color }}>
            {stats.current.toFixed(3)}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">{currentSentiment.label}</div>
        </div>

        {/* Trend */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">Trend</div>
          <div className={`font-bold mb-1 flex items-center gap-2 ${
            trend?.direction === 'improving' ? 'text-green-400' :
            trend?.direction === 'declining' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            <span className="text-2xl sm:text-3xl">{trend?.direction === 'improving' ? '↗' : trend?.direction === 'declining' ? '↘' : '→'}</span>
            <span className="text-lg sm:text-xl">
              {trend?.change > 0 ? '+' : ''}{(trend?.change * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-300 capitalize">{trend?.direction || 'Stable'}</div>
        </div>

        {/* Average */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">30-Day Avg</div>
          <div className="text-2xl sm:text-3xl font-bold mb-1 text-blue-400">
            {stats.avg.toFixed(3)}
          </div>
          <div className="text-xs sm:text-sm text-gray-300">
            {getSentimentColor(stats.avg).label}
          </div>
        </div>

        {/* Range */}
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-4 sm:p-5 border border-dark-400/40">
          <div className="text-xs sm:text-sm text-gray-400 mb-2">Range</div>
          <div className="flex items-center gap-2 mb-1 text-base sm:text-lg font-bold">
            <span className="text-red-400">{stats.min.toFixed(2)}</span>
            <span className="text-gray-500">→</span>
            <span className="text-green-400">{stats.max.toFixed(2)}</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-300">Min to Max</div>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-400">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-gray-400">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-400">Negative</span>
          </div>
        </div>
        <div className="flex gap-1 bg-dark-700/50 rounded-lg p-1">
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
        </div>
      </div>

      {/* Chart */}
      {viewType === 'line' ? (
        <div className="relative bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-6">
          {/* SVG Line Chart */}
          <div className="relative" style={{ height: '300px' }}>
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Gradient definition */}
              <defs>
                <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: currentSentiment.color, stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: currentSentiment.color, stopOpacity: 0.05 }} />
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

              {/* Zero line (neutral sentiment) */}
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="rgba(156, 163, 175, 0.3)"
                strokeWidth="0.3"
                strokeDasharray="2,2"
              />

              {/* Area fill */}
              <path
                d={areaD}
                fill="url(#sentimentGradient)"
              />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke={currentSentiment.color}
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
                  fill={getSentimentColor(point.sentiment).color}
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
                <div className="text-sm font-bold mb-1" style={{ color: getSentimentColor(timeline[hoveredIndex].avg_sentiment).color }}>
                  {timeline[hoveredIndex].avg_sentiment.toFixed(3)}
                </div>
                <div className="text-xs text-gray-300 mb-0.5">
                  {getSentimentColor(timeline[hoveredIndex].avg_sentiment).label}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDateFull(timeline[hoveredIndex].date)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {timeline[hoveredIndex].article_count} articles
                </div>
              </div>
            )}

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-10">
              <span>+1.0</span>
              <span>+0.5</span>
              <span className="text-gray-400 font-medium">0.0</span>
              <span>-0.5</span>
              <span>-1.0</span>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-4 px-1">
            <span className="text-gray-400">{formatDate(timeline[0].date)}</span>
            <span className="text-gray-400 font-medium">Sentiment over time (30 days)</span>
            <span className="text-gray-400">{formatDate(timeline[timeline.length - 1].date)}</span>
          </div>
        </div>
      ) : (
        // Bar Chart View
        <div className="relative bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-6">
          {/* Y-axis reference line */}
          <div className="absolute left-6 right-6 top-1/2 h-px bg-gray-500/30 border-t border-dashed border-gray-500/30 z-0" />

          <div className="relative h-72 flex items-center gap-0.5">
            {timeline.map((day: any, idx: number) => {
              const sentiment = day.avg_sentiment;
              const normalized = ((sentiment - minSentiment) / (maxSentiment - minSentiment));
              const heightPercent = normalized * 100;
              const barHeight = Math.max(Math.abs(heightPercent - 50) * 2, 5); // Make bars more visible
              const sentimentInfo = getSentimentColor(sentiment);
              const isAboveZero = sentiment >= 0;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-center relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar */}
                  <div className="flex flex-col items-center w-full h-full justify-center">
                    {isAboveZero ? (
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: sentimentInfo.color,
                          opacity: hoveredIndex === idx ? 1 : 0.8,
                          minHeight: '4px'
                        }}
                      />
                    ) : (
                      <div
                        className="w-full rounded-b transition-all"
                        style={{
                          height: `${barHeight}%`,
                          backgroundColor: sentimentInfo.color,
                          opacity: hoveredIndex === idx ? 1 : 0.8,
                          minHeight: '4px'
                        }}
                      />
                    )}
                  </div>

                  {/* Tooltip */}
                  {hoveredIndex === idx && (
                    <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-dark-600/95 backdrop-blur-md border border-dark-400/60 px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-xl z-20">
                      <div className="font-bold mb-0.5" style={{ color: sentimentInfo.color }}>
                        {sentiment.toFixed(3)}
                      </div>
                      <div className="text-gray-300 text-xs mb-0.5">{sentimentInfo.label}</div>
                      <div className="text-gray-400 text-xs">{formatDate(day.date)}</div>
                      <div className="text-gray-500 text-xs">{day.article_count} articles</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around text-xs text-gray-500 pr-2">
            <span>+1.0</span>
            <span className="text-gray-400 font-medium">0.0</span>
            <span>-1.0</span>
          </div>

          {/* X-axis labels */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t border-dark-400/40 pt-3 mt-3">
            <span className="text-gray-400">{formatDate(timeline[0].date)}</span>
            <span className="text-gray-400 font-medium">Sentiment over time (30 days)</span>
            <span className="text-gray-400">{formatDate(timeline[timeline.length - 1].date)}</span>
          </div>
        </div>
      )}

      {/* Additional insights */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-dark-700/30 rounded-lg p-3 border border-dark-400/20">
          <div className="text-xs text-gray-400 mb-1">Positive Days</div>
          <div className="text-xl font-bold text-green-400">
            {timeline.filter((d: any) => d.avg_sentiment > 0).length}
          </div>
        </div>
        <div className="bg-dark-700/30 rounded-lg p-3 border border-dark-400/20">
          <div className="text-xs text-gray-400 mb-1">Neutral Days</div>
          <div className="text-xl font-bold text-gray-400">
            {timeline.filter((d: any) => d.avg_sentiment >= -0.1 && d.avg_sentiment <= 0.1).length}
          </div>
        </div>
        <div className="bg-dark-700/30 rounded-lg p-3 border border-dark-400/20">
          <div className="text-xs text-gray-400 mb-1">Negative Days</div>
          <div className="text-xl font-bold text-red-400">
            {timeline.filter((d: any) => d.avg_sentiment < 0).length}
          </div>
        </div>
      </div>
    </div>
  );
}
