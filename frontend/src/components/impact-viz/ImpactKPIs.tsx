/**
 * Impact KPIs Component
 * Displays executive KPI dashboard with key impact metrics
 */

interface Metric {
  label: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable' | 'neutral';
  color?: 'emerald' | 'rose' | 'sky' | 'amber';
  icon?: 'multiplier' | 'quality' | 'citations' | 'confidence';
}

interface ImpactKPIsProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    metrics: Metric[];
  };
}

const colorClasses = {
  emerald: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
  rose: 'from-rose-500/20 to-rose-600/20 border-rose-500/30',
  sky: 'from-sky-500/20 to-sky-600/20 border-sky-500/30',
  amber: 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
};

const iconClasses = {
  emerald: 'text-emerald-400',
  rose: 'text-rose-400',
  sky: 'text-sky-400',
  amber: 'text-amber-400',
};

export function ImpactKPIs({ title, subtitle, insight, data }: ImpactKPIsProps) {
  const getIcon = (icon?: string) => {
    switch (icon) {
      case 'multiplier':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'quality':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'citations':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'confidence':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
    }
  };

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((metric, index) => {
          const color = metric.color || 'sky';
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${colorClasses[color]} border rounded-lg p-6 hover:scale-105 transition-transform duration-200`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${iconClasses[color]}`}>
                  {getIcon(metric.icon)}
                </div>
                {metric.trend && metric.trend !== 'neutral' && (
                  <div className={`text-xs px-2 py-1 rounded ${
                    metric.trend === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                    metric.trend === 'down' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-100 mb-2">{metric.value}</div>
              <div className="text-sm font-medium text-gray-300 mb-1">{metric.label}</div>
              {metric.subtitle && (
                <div className="text-xs text-gray-400">{metric.subtitle}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
