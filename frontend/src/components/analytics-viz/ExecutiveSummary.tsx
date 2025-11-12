interface ExecutiveMetric {
  label: string;
  current: string;
  target: string;
  gap: number;
  trend: 'up' | 'down' | 'stable';
  color: 'mint' | 'blush' | 'sky' | 'cream';
}

interface ExecutiveSummaryProps {
  metrics: ExecutiveMetric[];
}

const colorClasses = {
  mint: 'from-monument-mint/30 to-monument-mint/10',
  blush: 'from-monument-blush/30 to-monument-blush/10',
  sky: 'from-monument-sky/30 to-monument-sky/10',
  cream: 'from-monument-cream/40 to-monument-cream/10',
};

const trendSymbols = {
  up: '↗',
  down: '↘',
  stable: '→',
};

/**
 * Executive Summary - KPI cards grid with Monument Valley aesthetic
 */
export function ExecutiveSummary({ metrics }: ExecutiveSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`kpi-card bg-gradient-to-br ${colorClasses[metric.color]} rounded-xl p-6 border border-monument-stone/20`}
        >
          {/* Label */}
          <p className="monument-label mb-3 font-medium">
            {metric.label}
          </p>

          {/* Current value */}
          <div className="flex items-baseline gap-2 mb-2">
            <p className="text-4xl font-light text-monument-stone tracking-zen">
              {metric.current}
            </p>
            <span className="text-2xl text-monument-stone/60">
              {trendSymbols[metric.trend]}
            </span>
          </div>

          {/* Target & Gap */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-monument-stone/20">
            <p className="monument-label text-xs">
              Target: <span className="font-semibold">{metric.target}</span>
            </p>
            <p className={`text-xs font-semibold ${metric.gap < 0 ? 'text-red-700' : 'text-green-700'}`}>
              Gap: {metric.gap > 0 ? '+' : ''}{metric.gap}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
