import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface FinancialData {
  year: number;
  investment: number;
  returns: number;
  roi: number;
}

interface FinancialChartProps {
  data: FinancialData[];
}

/**
 * Financial Chart - Area chart showing ROI projection over 5 years
 */
export function FinancialChart({ data }: FinancialChartProps) {
  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/5">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9DD4C3" stopOpacity={0.6}/>
              <stop offset="95%" stopColor="#9DD4C3" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
          <XAxis
            dataKey="year"
            label={{ value: 'Year', position: 'bottom', fill: '#8B8B8B', fontSize: 12 }}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }}
          />
          <YAxis
            label={{ value: 'ROI (%)', angle: -90, position: 'left', fill: '#8B8B8B', fontSize: 12 }}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontFamily: 'Inter'
            }}
            formatter={(value: number, name) => {
              if (name === 'roi') return [`${value}%`, 'ROI'];
              return [`$${value}M`, name === 'investment' ? 'Investment' : 'Returns'];
            }}
          />
          <Legend
            wrapperStyle={{ fontFamily: 'Inter', fontSize: 14, fontWeight: 400 }}
          />
          <ReferenceLine y={0} stroke="#8B8B8B" strokeDasharray="3 3" opacity={0.5} />
          <Area
            type="monotone"
            dataKey="roi"
            stroke="#9DD4C3"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#roiGradient)"
            name="ROI (%)"
          />
          <Line
            type="monotone"
            dataKey="investment"
            stroke="#FFB8B8"
            strokeWidth={2}
            dot={{ fill: '#FFB8B8', r: 4 }}
            name="Investment ($M)"
          />
          <Line
            type="monotone"
            dataKey="returns"
            stroke="#A8D4FF"
            strokeWidth={2}
            dot={{ fill: '#A8D4FF', r: 4 }}
            name="Returns ($M)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center p-3 bg-monument-blush/20 rounded-lg border border-monument-blush/30">
          <p className="monument-label text-xs text-monument-stone/80 mb-1 font-medium">Total Investment</p>
          <p className="monument-value text-xl text-monument-stone">${data.reduce((sum, d) => sum + d.investment, 0)}M</p>
        </div>
        <div className="text-center p-3 bg-monument-sky/20 rounded-lg border border-monument-sky/30">
          <p className="monument-label text-xs text-monument-stone/80 mb-1 font-medium">Total Returns (Y5)</p>
          <p className="monument-value text-xl text-monument-stone">${data[data.length - 1].returns}M</p>
        </div>
        <div className="text-center p-3 bg-monument-mint/20 rounded-lg border border-monument-mint/30">
          <p className="monument-label text-xs text-monument-stone/80 mb-1 font-medium">Final ROI</p>
          <p className="monument-value text-xl text-monument-stone">{data[data.length - 1].roi}%</p>
        </div>
      </div>
    </div>
  );
}
