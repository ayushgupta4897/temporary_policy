'use client';

import { useState, useMemo } from 'react';

interface WordCloudProps {
  data: any;
}

export default function WordCloud({ data }: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  // Extract keywords from clustering data
  const extractKeywords = () => {
    if (!data) return [];

    // Check if we have top_keywords directly
    if (data.top_keywords && data.top_keywords.length > 0) {
      return data.top_keywords;
    }

    // Extract keywords from clusters
    if (data.clusters && data.clusters.length > 0) {
      const keywordMap = new Map();

      data.clusters.forEach((cluster: any) => {
        if (cluster.keywords && Array.isArray(cluster.keywords)) {
          cluster.keywords.forEach((keyword: string) => {
            const count = keywordMap.get(keyword) || 0;
            keywordMap.set(keyword, count + (cluster.size || 1));
          });
        }
      });

      // Convert map to array and sort by frequency
      return Array.from(keywordMap.entries())
        .map(([keyword, frequency]) => ({ keyword, frequency }))
        .sort((a, b) => b.frequency - a.frequency);
    }

    return [];
  };

  const allKeywords = extractKeywords();

  if (allKeywords.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-2">No keyword data available</div>
        <div className="text-xs text-gray-500">Keywords will appear after clustering analysis</div>
      </div>
    );
  }

  const keywords = allKeywords.slice(0, 50);
  const maxFrequency = Math.max(...keywords.map((k: any) => k.frequency));
  const minFrequency = Math.min(...keywords.map((k: any) => k.frequency));

  // Generate word positions and sizes
  const wordElements = useMemo(() => {
    return keywords.map((keyword: any, idx: number) => {
      // Normalize frequency to font size (12px to 48px)
      const normalized = (keyword.frequency - minFrequency) / (maxFrequency - minFrequency);
      const fontSize = 12 + (normalized * 36);

      // Generate spiral positions for better layout
      const angle = idx * 137.5; // Golden angle for nice distribution
      const radius = 5 + Math.sqrt(idx) * 8;
      const x = 50 + radius * Math.cos(angle * Math.PI / 180);
      const y = 50 + radius * Math.sin(angle * Math.PI / 180);

      // Color based on frequency
      let color;
      if (normalized > 0.7) {
        color = '#D93954'; // Bright red for high frequency
      } else if (normalized > 0.4) {
        color = '#F87171'; // Light red for medium
      } else if (normalized > 0.2) {
        color = '#60A5FA'; // Blue for low-medium
      } else {
        color = '#9CA3AF'; // Gray for low
      }

      return {
        word: keyword.keyword,
        frequency: keyword.frequency,
        fontSize,
        x,
        y,
        color,
        normalized
      };
    });
  }, [keywords, maxFrequency, minFrequency]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalWords = keywords.reduce((sum: number, k: any) => sum + k.frequency, 0);
    const avgFrequency = totalWords / keywords.length;
    const topWord = keywords[0];

    return {
      totalWords,
      uniqueWords: keywords.length,
      avgFrequency,
      topWord
    };
  }, [keywords]);

  return (
    <div className="space-y-4">
      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-3 border border-dark-400/40">
          <div className="text-xs text-gray-400 mb-1">Total Mentions</div>
          <div className="text-xl font-bold text-accent-red">{stats.totalWords}</div>
        </div>
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-3 border border-dark-400/40">
          <div className="text-xs text-gray-400 mb-1">Unique Keywords</div>
          <div className="text-xl font-bold text-blue-400">{stats.uniqueWords}</div>
        </div>
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-3 border border-dark-400/40">
          <div className="text-xs text-gray-400 mb-1">Avg Frequency</div>
          <div className="text-xl font-bold text-purple-400">{stats.avgFrequency.toFixed(1)}</div>
        </div>
        <div className="bg-gradient-to-br from-dark-600/60 to-dark-700/40 rounded-lg p-3 border border-dark-400/40">
          <div className="text-xs text-gray-400 mb-1">Top Keyword</div>
          <div className="text-sm font-bold text-green-400 truncate">{stats.topWord.keyword}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#D93954]"></div>
          <span className="text-gray-400">High Frequency</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#F87171]"></div>
          <span className="text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#60A5FA]"></div>
          <span className="text-gray-400">Low-Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#9CA3AF]"></div>
          <span className="text-gray-400">Low</span>
        </div>
      </div>

      {/* Word Cloud Canvas */}
      <div className="relative bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-4 overflow-hidden"
        style={{ height: '500px' }}
      >
        {/* Background grid */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="wordcloud-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-600"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#wordcloud-grid)" />
          </svg>
        </div>

        {/* Words */}
        <div className="relative w-full h-full">
          {wordElements.map((word: any, idx: number) => (
            <div
              key={idx}
              className="absolute cursor-pointer transition-all duration-300"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                transform: `translate(-50%, -50%) scale(${hoveredWord === word.word ? 1.2 : 1})`,
                zIndex: hoveredWord === word.word ? 100 : 10
              }}
              onMouseEnter={() => setHoveredWord(word.word)}
              onMouseLeave={() => setHoveredWord(null)}
            >
              <span
                className="font-bold whitespace-nowrap select-none"
                style={{
                  fontSize: `${word.fontSize}px`,
                  color: word.color,
                  textShadow: hoveredWord === word.word ? `0 0 10px ${word.color}` : 'none',
                  opacity: hoveredWord && hoveredWord !== word.word ? 0.4 : 1
                }}
              >
                {word.word}
              </span>

              {/* Tooltip */}
              {hoveredWord === word.word && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-dark-600/95 backdrop-blur-md border border-dark-400/60 rounded-lg px-3 py-2 shadow-xl z-50 whitespace-nowrap">
                  <div className="text-xs font-bold mb-0.5" style={{ color: word.color }}>
                    {word.word}
                  </div>
                  <div className="text-xs text-gray-300">
                    Frequency: <span className="font-mono font-bold">{word.frequency}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Rank: #{idx + 1}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="absolute top-4 right-4 bg-dark-600/80 backdrop-blur-md border border-dark-400/40 rounded-lg px-3 py-2 text-xs text-gray-300">
          💡 Hover over words for details
        </div>
      </div>

      {/* Top 10 List */}
      <div className="bg-gradient-to-br from-dark-700/50 to-dark-800/50 rounded-xl border border-dark-400/40 p-5">
        <h4 className="text-sm font-semibold text-gray-200 mb-4">Top 10 Keywords</h4>
        <div className="grid grid-cols-2 gap-3">
          {keywords.slice(0, 10).map((keyword: any, idx: number) => {
            const normalized = (keyword.frequency - minFrequency) / (maxFrequency - minFrequency);
            const barWidth = normalized * 100;

            let color;
            if (normalized > 0.7) color = '#D93954';
            else if (normalized > 0.4) color = '#F87171';
            else if (normalized > 0.2) color = '#60A5FA';
            else color = '#9CA3AF';

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 font-medium truncate flex-1">
                    {idx + 1}. {keyword.keyword}
                  </span>
                  <span className="text-xs font-mono font-bold ml-2" style={{ color }}>
                    {keyword.frequency}
                  </span>
                </div>
                <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
