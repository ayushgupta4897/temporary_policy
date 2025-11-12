/**
 * Time Impact Chart Component
 * Timeline showing immediate/short-term/long-term effects
 */

interface Period {
  name: string;
  multiplier: number;
  description?: string;
  citations?: number[];
}

interface TimeImpactChartProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    periods: Period[];
  };
}

export function TimeImpactChart({ title, subtitle, insight, data }: TimeImpactChartProps) {
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

      <div className="bg-dark-500 border border-dark-400 rounded-lg p-6">
        <div className="relative">
          {/* Timeline */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gradient-from via-gradient-via to-gradient-to rounded-full"></div>

          {/* Periods */}
          <div className="space-y-8 ml-8">
            {data.periods.map((period, index) => (
              <div key={index} className="relative">
                {/* Dot */}
                <div className="absolute -left-10 top-2 w-4 h-4 bg-gradient-from rounded-full border-4 border-dark-500"></div>

                {/* Content */}
                <div className="bg-dark-600/30 border border-dark-400/30 rounded-lg p-4 hover:border-gradient-from/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-100">{period.name}</h3>
                    <div className="text-2xl font-bold text-gradient-from">{period.multiplier}%</div>
                  </div>
                  {period.description && (
                    <p className="text-gray-300 text-sm mb-2">{period.description}</p>
                  )}
                  {period.citations && period.citations.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Citations: {period.citations.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
