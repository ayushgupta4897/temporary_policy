/**
 * Methodology Breakdown Component
 * Pie chart showing distribution of methodologies across citations
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Slice {
  method: string;
  count: number;
  percentage: number;
  quality: 'high' | 'medium' | 'low';
  color?: 'emerald' | 'sky' | 'amber' | 'rose';
}

interface MethodologyBreakdownProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    slices: Slice[];
    total: number;
  };
}

const colorMap = {
  emerald: '#10b981',
  sky: '#0ea5e9',
  amber: '#f59e0b',
  rose: '#f43f5e',
};

export function MethodologyBreakdown({ title, subtitle, insight, data }: MethodologyBreakdownProps) {
  const chartData = data.slices.map((slice) => ({
    name: slice.method,
    value: slice.count,
    fill: colorMap[slice.color || 'sky'],
    percentage: slice.percentage,
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.percent ? (props.percent * 100).toFixed(0) : 0}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#f3f4f6' }}
                  itemStyle={{ color: '#d1d5db' }}
                  formatter={(value: number) => `${value} studies`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend & Breakdown */}
          <div className="space-y-3">
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-gray-100">{data.total}</div>
              <div className="text-gray-400 text-sm">Total Citations</div>
            </div>

            {data.slices.map((slice, index) => {
              const color = colorMap[slice.color || 'sky'];
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-600/30 border border-dark-400/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                    <div>
                      <div className="text-gray-200 font-medium">{slice.method}</div>
                      <div className="text-xs text-gray-400">Quality: {slice.quality}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-100 font-semibold">{slice.count}</div>
                    <div className="text-xs text-gray-400">{slice.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
