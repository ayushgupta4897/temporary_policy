import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';

interface RiskMatrixProps {
  data: {
    risks: Array<{
      name: string;
      probability: number;
      impact: number;
      severity: number;
      mitigation: string;
    }>;
  };
  config?: any;
}

const getSeverityColor = (severity: number) => {
  if (severity > 30) return '#FFB8B8'; // High severity - red
  if (severity > 15) return '#FFD4B3'; // Medium severity - orange
  return '#FFE8C5'; // Low severity - yellow
};

export function RiskMatrix({ data, config }: RiskMatrixProps) {
  const { risks } = data;

  return (
    <div className="space-y-6">
      {/* Risk cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {risks.map((risk, index) => (
          <div
            key={index}
            className="rounded-lg p-4 border border-monument-stone/30 shadow-sm"
            style={{ backgroundColor: getSeverityColor(risk.severity) + '50' }}
          >
            <p className="font-semibold text-monument-stone mb-3">{risk.name}</p>
            <div className="flex gap-4 text-xs text-monument-stone/80 mb-3">
              <span className="font-medium">Probability: {risk.probability}%</span>
              <span className="font-medium">Impact: {risk.impact}%</span>
              <span className="font-semibold">Severity: {risk.severity}%</span>
            </div>
            <p className="text-xs text-monument-stone/70 italic">
              Mitigation: {risk.mitigation}
            </p>
          </div>
        ))}
      </div>

      {/* Scatter plot */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/20">
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#8B8B8B" opacity={0.1} />
            <XAxis
              type="number"
              dataKey="probability"
              name="Probability"
              domain={[0, 100]}
              label={{ value: 'Probability (%)', position: 'bottom', fill: '#6B6B6B', fontSize: 12, offset: 10 }}
              tick={{ fill: '#6B6B6B', fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="impact"
              name="Impact"
              domain={[0, 100]}
              label={{ value: 'Impact (%)', angle: -90, position: 'left', fill: '#6B6B6B', fontSize: 12 }}
              tick={{ fill: '#6B6B6B', fontSize: 12 }}
            />
            <ZAxis range={[400, 800]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E5E5E5',
                borderRadius: '8px',
                fontFamily: 'Inter'
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'probability') return [`${value}%`, 'Probability'];
                if (name === 'impact') return [`${value}%`, 'Impact'];
                return [value, name];
              }}
              labelFormatter={(label: any, payload: any) => {
                if (payload && payload.length > 0) {
                  return payload[0].payload.name;
                }
                return label;
              }}
            />
            <Scatter data={risks}>
              {risks.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
