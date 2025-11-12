/**
 * Heatmap Chart - Matrix Visualization
 * Shows intensity/adoption across two dimensions
 */

interface HeatmapChartProps {
  data: {
    rows: string[];
    columns: string[];
    cells: Array<{
      row: string;
      column: string;
      value: number;
    }>;
  };
  config?: any;
}

const getColorForValue = (value: number): string => {
  if (value >= 80) return 'bg-[#0077B6] text-white';
  if (value >= 60) return 'bg-[#00B4D8] text-white';
  if (value >= 40) return 'bg-[#66C2E0] text-gray-800';
  if (value >= 20) return 'bg-[#ADE8F4] text-gray-800';
  return 'bg-[#E8F4F8] text-gray-600';
};

export function HeatmapChart({ data, config }: HeatmapChartProps) {
  const { rows, columns, cells } = data;

  // Create a map for quick lookup
  const cellMap = new Map<string, number>();
  cells.forEach(cell => {
    cellMap.set(`${cell.row}-${cell.column}`, cell.value);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-monument-stone border border-monument-stone/20 bg-monument-sand/50">
              {/* Empty corner cell */}
            </th>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="p-3 text-center text-sm font-semibold text-monument-stone border border-monument-stone/20 bg-monument-sand/50 min-w-[100px]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td className="p-3 text-sm font-semibold text-monument-stone border border-monument-stone/20 bg-monument-sand/50 whitespace-nowrap">
                {row}
              </td>
              {columns.map((col, colIdx) => {
                const value = cellMap.get(`${row}-${col}`) || 0;
                const colorClass = getColorForValue(value);

                return (
                  <td
                    key={colIdx}
                    className={`p-3 text-center border border-monument-stone/20 ${colorClass} transition-colors`}
                  >
                    <span className="font-semibold text-sm">{value}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-end gap-2 text-xs">
        <span className="text-monument-stone font-medium">Intensity:</span>
        <div className="flex gap-1">
          <div className="px-2 py-1 bg-[#E8F4F8] border border-monument-stone/20 text-gray-700 font-medium">0-20</div>
          <div className="px-2 py-1 bg-[#ADE8F4] border border-monument-stone/20 text-gray-800 font-medium">20-40</div>
          <div className="px-2 py-1 bg-[#66C2E0] border border-monument-stone/20 text-gray-900 font-medium">40-60</div>
          <div className="px-2 py-1 bg-[#00B4D8] text-white border border-monument-stone/20 font-medium">60-80</div>
          <div className="px-2 py-1 bg-[#0077B6] text-white border border-monument-stone/20 font-medium">80-100</div>
        </div>
      </div>
    </div>
  );
}
