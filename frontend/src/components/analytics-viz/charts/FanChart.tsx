import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FanChartProps {
  data: {
    years: number[];
    scenarios: {
      best: number[];
      likely: number[];
      worst: number[];
    };
  };
  config?: any;
}

export function FanChart({ data, config }: FanChartProps) {
  const { years, scenarios } = data;

  // Transform data for Recharts
  const chartData = years.map((year, idx) => ({
    year,
    best: scenarios.best[idx],
    likely: scenarios.likely[idx],
    worst: scenarios.worst[idx],
  }));

  return (
    <div className="space-y-4">
      {/* Scenario legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#4ADE80]" />
          <span className="text-[#6B6B6B]">Best Case</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#A8D4FF]" />
          <span className="text-[#6B6B6B]">Most Likely</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#FFB8B8]" />
          <span className="text-[#6B6B6B]">Worst Case</span>
        </div>
      </div>

      {/* Fan chart */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="bestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="likelyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A8D4FF" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#A8D4FF" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="worstGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FFB8B8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#FFB8B8" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
          <XAxis
            dataKey="year"
            label={{ value: 'Year', position: 'bottom', fill: '#6B6B6B' }}
            tick={{ fill: '#6B6B6B', fontSize: 12 }}
          />
          <YAxis
            label={{ value: 'Projected Value', angle: -90, position: 'left', fill: '#6B6B6B' }}
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

          {/* Best case area */}
          <Area
            type="monotone"
            dataKey="best"
            stroke="#4ADE80"
            strokeWidth={2}
            fill="url(#bestGradient)"
            name="Best Case"
          />

          {/* Most likely area */}
          <Area
            type="monotone"
            dataKey="likely"
            stroke="#A8D4FF"
            strokeWidth={3}
            fill="url(#likelyGradient)"
            name="Most Likely"
          />

          {/* Worst case area */}
          <Area
            type="monotone"
            dataKey="worst"
            stroke="#FFB8B8"
            strokeWidth={2}
            fill="url(#worstGradient)"
            name="Worst Case"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Scenario probabilities */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="p-3 bg-[#4ADE80]/10 rounded-lg">
          <p className="text-[#6B6B6B]/70 mb-1">Best Case</p>
          <p className="font-semibold text-[#6B6B6B]">{scenarios.best[scenarios.best.length - 1]}</p>
          <p className="text-xs text-[#6B6B6B]/50 mt-1">Year {years[years.length - 1]}</p>
        </div>
        <div className="p-3 bg-[#A8D4FF]/10 rounded-lg">
          <p className="text-[#6B6B6B]/70 mb-1">Most Likely</p>
          <p className="font-semibold text-[#6B6B6B]">{scenarios.likely[scenarios.likely.length - 1]}</p>
          <p className="text-xs text-[#6B6B6B]/50 mt-1">Year {years[years.length - 1]}</p>
        </div>
        <div className="p-3 bg-[#FFB8B8]/10 rounded-lg">
          <p className="text-[#6B6B6B]/70 mb-1">Worst Case</p>
          <p className="font-semibold text-[#6B6B6B]">{scenarios.worst[scenarios.worst.length - 1]}</p>
          <p className="text-xs text-[#6B6B6B]/50 mt-1">Year {years[years.length - 1]}</p>
        </div>
      </div>
    </div>
  );
}
