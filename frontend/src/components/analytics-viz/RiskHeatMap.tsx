import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

interface RiskData {
  risk: string;
  probability: number;
  impact: number;
  severity: number;
  mitigation: string;
}

interface RiskHeatMapProps {
  data: RiskData[];
}

/**
 * Risk Heat Map - Scatter plot showing probability vs impact
 */
export function RiskHeatMap({ data }: RiskHeatMapProps) {
  // Color based on severity
  const getSeverityColor = (severity: number) => {
    if (severity > 30) return '#FFB8B8'; // Blush - high risk
    if (severity > 15) return '#FFD4B3'; // Peach - medium risk
    return '#FFE8C5'; // Cream - low risk
  };

  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/20">
      {/* Risk cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map((risk, index) => (
          <div
            key={index}
            className="rounded-lg p-4 border border-monument-stone/30"
            style={{ backgroundColor: getSeverityColor(risk.severity) + '50' }}
          >
            <p className="monument-label font-semibold mb-2">
              {risk.risk}
            </p>
            <div className="flex gap-4 text-xs monument-label text-monument-stone/80 mb-2">
              <span className="font-medium">P: {risk.probability}%</span>
              <span className="font-medium">I: {risk.impact}%</span>
              <span className="font-semibold">S: {risk.severity}%</span>
            </div>
            <p className="monument-label text-xs text-monument-stone/70">
              {risk.mitigation.length > 80 ? risk.mitigation.substring(0, 80) + '...' : risk.mitigation}
            </p>
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
          <XAxis
            type="number"
            dataKey="probability"
            name="Probability"
            domain={[0, 100]}
            label={{ value: 'Probability (%)', position: 'bottom', fill: '#8B8B8B', fontSize: 12 }}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }}
          />
          <YAxis
            type="number"
            dataKey="impact"
            name="Impact"
            domain={[0, 100]}
            label={{ value: 'Impact (%)', angle: -90, position: 'left', fill: '#8B8B8B', fontSize: 12 }}
            tick={{ fill: '#8B8B8B', fontSize: 12, fontWeight: 300 }}
          />
          <ZAxis range={[400, 800]} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              fontFamily: 'Inter'
            }}
            formatter={(value: number, name) => [
              `${value}%`,
              name === 'probability' ? 'Probability' : name === 'impact' ? 'Impact' : name
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.risk;
              }
              return label;
            }}
          />
          <Scatter data={data}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
