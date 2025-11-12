import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface AreaTrendChartProps {
  data: {
    series: Array<{
      name: string;
      values: Array<{
        year: number;
        value: number;
      }>;
    }>;
  };
  config?: any;
}

const colors = ['#9DD4C3', '#FFB8B8', '#A8D4FF', '#D4C8FF', '#FFD4B3'];

export function AreaTrendChart({ data, config }: AreaTrendChartProps) {
  const { series } = data;

  // Merge all series into single dataset for Recharts
  const mergedData: any[] = [];
  if (series.length > 0) {
    const years = series[0].values.map(v => v.year);
    years.forEach(year => {
      const dataPoint: any = { year };
      series.forEach(s => {
        const value = s.values.find(v => v.year === year);
        dataPoint[s.name] = value ? value.value : 0;
      });
      mergedData.push(dataPoint);
    });
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          {series.map((s, idx) => (
            <linearGradient key={s.name} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.6} />
              <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
        <XAxis
          dataKey="year"
          label={{ value: 'Year', position: 'bottom', fill: '#6B6B6B' }}
          tick={{ fill: '#6B6B6B', fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: '#6B6B6B', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            fontFamily: 'Inter'
          }}
        />
        <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 14 }} />
        <ReferenceLine y={0} stroke="#6B6B6B" strokeDasharray="3 3" opacity={0.5} />
        {series.map((s, idx) => (
          <Area
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${idx})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
