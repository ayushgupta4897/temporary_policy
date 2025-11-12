/**
 * Data Table Component
 * Sortable, structured data table for comparative data
 */

import { useState } from 'react';

interface DataTableProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    columns: string[];
    rows: { [key: string]: string | number }[];
    sortable?: boolean;
    highlightColumn?: string;
  };
}

export function DataTable({ title, subtitle, insight, data }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (!data.sortable) return;

    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedRows = [...data.rows];
  if (sortColumn && data.sortable) {
    sortedRows.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>

      {insight && (
        <div className="bg-gradient-from/10 border border-gradient-from/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-gradient-from mt-0.5">💡</div>
            <p className="text-gray-200 text-sm leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      <div className="bg-dark-500 border border-dark-400 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-dark-600/50">
              <tr>
                {data.columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className={`
                      px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider
                      ${data.sortable ? 'cursor-pointer hover:bg-dark-600 transition-colors' : ''}
                      ${data.highlightColumn === column ? 'bg-gradient-from/20' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {column}
                      {data.sortable && sortColumn === column && (
                        <span className="text-gradient-from">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/30">
              {sortedRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-dark-600/30 transition-colors">
                  {data.columns.map((column) => (
                    <td
                      key={column}
                      className={`
                        px-4 py-3 text-sm text-gray-200
                        ${data.highlightColumn === column ? 'font-semibold text-gradient-from' : ''}
                      `}
                    >
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row Count */}
        <div className="px-4 py-3 bg-dark-600/30 border-t border-dark-400/30 text-xs text-gray-400 text-right">
          {sortedRows.length} {sortedRows.length === 1 ? 'row' : 'rows'}
        </div>
      </div>
    </div>
  );
}
