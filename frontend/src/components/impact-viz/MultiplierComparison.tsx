/**
 * Multiplier Comparison Component
 * Bar chart comparing min/max/average impact multipliers
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface Bar {
  name: string;
  value: number;
  unit?: string;
  citation?: number;
  color?: 'emerald' | 'sky' | 'amber';
}

interface MultiplierComparisonProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    bars: Bar[];
    yAxisLabel?: string;
    showValues?: boolean;
  };
}

const colorMap = {
  emerald: '#10b981',
  sky: '#0ea5e9',
  amber: '#f59e0b',
};

export function MultiplierComparison({ title, subtitle, insight, data }: MultiplierComparisonProps) {
  const chartData = data.bars.map((bar) => ({
    name: bar.name,
    value: bar.value,
    fill: colorMap[bar.color || 'sky'],
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} label={{ value: data.yAxisLabel || 'Impact Multiplier', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
              itemStyle={{ color: '#d1d5db' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {data.showValues && (
          <div className="mt-4 pt-4 border-t border-dark-400/50 grid grid-cols-3 gap-4">
            {data.bars.map((bar, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-gray-100">{bar.value}{bar.unit || '%'}</div>
                <div className="text-sm text-gray-400">{bar.name}</div>
                {bar.citation && (
                  <div className="text-xs text-gray-500 mt-1">Citation {bar.citation}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
