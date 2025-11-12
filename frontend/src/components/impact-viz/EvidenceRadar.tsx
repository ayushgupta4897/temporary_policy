/**
 * Evidence Radar Component
 * Radar chart showing evidence quality across multiple dimensions
 */

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface EvidenceRadarProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    dimensions: string[];
    score: number;
    dimensionScores: { [key: string]: number };
    interpretation?: string;
  };
}

export function EvidenceRadar({ title, subtitle, insight, data }: EvidenceRadarProps) {
  // Transform data for Recharts
  const chartData = data.dimensions.map((dimension) => ({
    dimension,
    score: data.dimensionScores[dimension] || 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>

      {insight && (
        <div className="bg-gradient-from/10 border border-gradient-from/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-gradient-from mt-0.5">💡</div>
            <p className="text-gray-200 text-sm leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      <div className="bg-dark-500 border border-dark-400 rounded-lg p-6">
        {/* Overall Score */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-gradient-from mb-2">{data.score}/100</div>
          <div className="text-gray-400 text-sm">Overall Evidence Quality Score</div>
          {data.interpretation && (
            <p className="text-gray-300 text-sm mt-2 max-w-2xl mx-auto">{data.interpretation}</p>
          )}
        </div>

        {/* Radar Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" style={{ fontSize: '10px' }} />
            <Radar
              name="Quality Score"
              dataKey="score"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.5}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#d1d5db' }}
            />
          </RadarChart>
        </ResponsiveContainer>

        {/* Dimension Scores Breakdown */}
        <div className="mt-6 pt-6 border-t border-dark-400/50 grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.dimensions.map((dimension) => {
            const score = data.dimensionScores[dimension] || 0;
            const barWidth = `${score}%`;
            return (
              <div key={dimension} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{dimension}</span>
                  <span className="text-gray-100 font-semibold">{score}</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gradient-from to-gradient-via rounded-full transition-all duration-500"
                    style={{ width: barWidth }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
