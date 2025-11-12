import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface TreemapChartProps {
  data: {
    children: Array<{
      name: string;
      value: number;
      children?: Array<{
        name: string;
        value: number;
      }>;
    }>;
  };
  config?: any;
}

const COLORS = ['#9DD4C3', '#A8D4FF', '#D4C8FF', '#FFD4B3', '#FFE8C5', '#FFB8B8'];

export function TreemapChart({ data, config }: TreemapChartProps) {
  const { children } = data;

  const CustomContent = ({ x, y, width, height, index, name, value }: any) => {
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: '#fff',
            strokeWidth: 2,
          }}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - 8}
              textAnchor="middle"
              fill="#2D3748"
              fontSize={14}
              fontWeight="600"
            >
              {name}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              fill="#4A5568"
              fontSize={13}
            >
              ${value}M
            </text>
          </>
        )}
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={children}
        dataKey="value"
        stroke="#fff"
        content={<CustomContent />}
      >
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            fontFamily: 'Inter'
          }}
          formatter={(value: number) => [`$${value}M`, 'Budget']}
        />
      </Treemap>
    </ResponsiveContainer>
  );
}
