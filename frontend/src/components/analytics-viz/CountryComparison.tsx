import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CountryData {
  country: string;
  score: number;
  metric: string;
  value: string;
}

interface CountryComparisonProps {
  data: CountryData[];
}

/**
 * Country Comparison - Horizontal bar chart with Monument Valley colors
 */
export function CountryComparison({ data }: CountryComparisonProps) {
  const colors = ['#A8D4FF', '#9DD4C3', '#D4C8FF'];

  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/20">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }}
          />
          <YAxis
            type="category"
            dataKey="country"
            width={110}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 400 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontFamily: 'Inter'
            }}
            formatter={(value: number, name, props) => [
              `${value}/100 - ${props.payload.value}`,
              'Score'
            ]}
          />
          <Bar
            dataKey="score"
            radius={[0, 8, 8, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
