import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface BubbleChartProps {
  data: {
    xAxis: { label: string; min: number; max: number };
    yAxis: { label: string; min: number; max: number };
    bubbles: Array<{
      name: string;
      x: number;
      y: number;
      size: number;
      color: 'high' | 'medium' | 'low';
    }>;
  };
  config?: any;
}

const colorMap = {
  high: '#FFB8B8',
  medium: '#FFD4B3',
  low: '#9DD4C3'
};

export function BubbleChart({ data, config }: BubbleChartProps) {
  const { xAxis, yAxis, bubbles } = data;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
        <XAxis
          type="number"
          dataKey="x"
          name={xAxis.label}
          domain={[xAxis.min, xAxis.max]}
          label={{ value: xAxis.label, position: 'bottom', fill: '#6B6B6B', fontSize: 12, offset: 10 }}
          tick={{ fill: '#6B6B6B', fontSize: 12 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yAxis.label}
          domain={[yAxis.min, yAxis.max]}
          label={{ value: yAxis.label, angle: -90, position: 'left', fill: '#6B6B6B', fontSize: 12 }}
          tick={{ fill: '#6B6B6B', fontSize: 12 }}
        />
        <ZAxis type="number" dataKey="size" range={[100, 1000]} name="Population" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            fontFamily: 'Inter'
          }}
          formatter={(value: any, name: string) => {
            if (name === 'x') return [value, xAxis.label];
            if (name === 'y') return [value, yAxis.label];
            if (name === 'size') return [value.toLocaleString(), 'Population'];
            return [value, name];
          }}
        />
        <Scatter data={bubbles} name="Stakeholders">
          {bubbles.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colorMap[entry.color]} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}
