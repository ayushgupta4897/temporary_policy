import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WaterfallChartProps {
  data: {
    periods: Array<{
      name: string;
      value: number;
      cumulative: number;
      breakeven?: boolean;
    }>;
  };
  config?: any;
}

export function WaterfallChart({ data, config }: WaterfallChartProps) {
  const { periods } = data;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={periods} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#6B6B6B', fontSize: 12 }}
          label={{ value: 'Period', position: 'bottom', offset: 0, fill: '#6B6B6B' }}
        />
        <YAxis
          tick={{ fill: '#6B6B6B', fontSize: 12 }}
          label={{ value: 'Cumulative Value ($M)', angle: -90, position: 'left', fill: '#6B6B6B' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            fontFamily: 'Inter'
          }}
          formatter={(value: number, name: string, props: any) => {
            const entry = props.payload;
            return [
              <div key="tooltip">
                <div>Change: ${entry.value > 0 ? '+' : ''}${entry.value}M</div>
                <div>Cumulative: ${value}M</div>
                {entry.breakeven && <div className="font-bold text-monument-mint">✓ Break-even achieved!</div>}
              </div>,
              ''
            ];
          }}
        />
        <ReferenceLine y={0} stroke="#6B6B6B" strokeDasharray="3 3" opacity={0.5} />
        <Bar dataKey="cumulative" radius={[8, 8, 0, 0]}>
          {periods.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.breakeven ? '#4ADE80' : entry.cumulative < 0 ? '#FFB8B8' : '#9DD4C3'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
