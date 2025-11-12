import {
  Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend, Tooltip, ResponsiveContainer
} from 'recharts';

export function RadarChart({ data, config }: any) {
  const { dimensions, entities } = data;

  const radarData = dimensions.map((dim: string) => {
    const point: any = { dimension: dim };
    entities.forEach((entity: any) => {
      point[entity.name] = entity.scores[dim] || 0;
    });
    return point;
  });

  const colors = ['#9DD4C3', '#A8D4FF', '#D4C8FF', '#FFD4B3', '#FFE8C5'];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsRadar data={radarData}>
        <PolarGrid stroke="#8B8B8B" opacity={0.2} />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#6B6B6B', fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#6B6B6B', fontSize: 10 }} />
        {entities.map((entity: any, idx: number) => (
          <Radar
            key={entity.name}
            name={entity.name}
            dataKey={entity.name}
            stroke={colors[idx % colors.length]}
            fill={colors[idx % colors.length]}
            fillOpacity={0.3}
          />
        ))}
        <Legend wrapperStyle={{ fontFamily: 'Inter', fontSize: 14 }} />
        <Tooltip />
      </RechartsRadar>
    </ResponsiveContainer>
  );
}
