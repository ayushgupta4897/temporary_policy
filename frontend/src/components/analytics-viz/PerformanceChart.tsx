import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  metric: string;
  current: number;
  target: number;
  unit: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

/**
 * Performance Chart - Grouped bar chart comparing current vs target
 */
export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/20">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
          <XAxis
            dataKey="metric"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }}
          />
          <YAxis tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontFamily: 'Inter'
            }}
          />
          <Legend
            wrapperStyle={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 400 }}
          />
          <Bar
            dataKey="current"
            fill="#9DD4C3"
            name="Current"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="target"
            fill="#A8D4FF"
            name="Target"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
