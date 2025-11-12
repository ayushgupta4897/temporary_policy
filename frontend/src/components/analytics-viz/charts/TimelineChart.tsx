interface TimelineChartProps {
  data: {
    phases: Array<{
      name: string;
      start?: string;
      end?: string;
      duration: string;
      milestones: string[];
      cost: number;
      risk: 'low' | 'medium' | 'high';
      dependencies?: string[];
    }>;
  };
  config?: any;
}

const riskColors = {
  low: 'bg-monument-mint',
  medium: 'bg-monument-cream',
  high: 'bg-monument-blush'
};

const riskBorders = {
  low: 'border-monument-mint',
  medium: 'border-monument-cream',
  high: 'border-monument-blush'
};

export function TimelineChart({ data, config }: TimelineChartProps) {
  const { phases } = data;

  return (
    <div className="space-y-8">
      {/* Timeline connector line */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-monument-stone/20" />

        {phases.map((phase, index) => (
          <div key={index} className="relative flex items-start gap-6 mb-8 last:mb-0">
            {/* Phase number badge */}
            <div className={`
              relative z-10 w-12 h-12 rounded-full flex items-center justify-center
              text-white font-semibold text-lg shadow-lg
              ${riskColors[phase.risk]}
            `}>
              {index + 1}
            </div>

            {/* Phase content */}
            <div className="flex-1 bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/20 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg text-monument-stone mb-1">{phase.name}</h4>
                  <p className="text-sm text-monument-stone/80">{phase.duration}</p>
                  {phase.start && phase.end && (
                    <p className="text-xs text-monument-stone/60 mt-1">{phase.start} to {phase.end}</p>
                  )}
                </div>

                <div className={`
                  px-3 py-1 rounded-full text-xs font-semibold border-2
                  ${riskBorders[phase.risk]}
                  ${phase.risk === 'low' ? 'text-green-700 bg-monument-mint/20' : ''}
                  ${phase.risk === 'medium' ? 'text-amber-700 bg-monument-cream/20' : ''}
                  ${phase.risk === 'high' ? 'text-red-700 bg-monument-blush/20' : ''}
                `}>
                  {phase.risk.toUpperCase()} RISK
                </div>
              </div>

              {/* Milestones */}
              <div className="bg-monument-sand/50 rounded-lg p-4 mb-4 border border-monument-stone/10">
                <p className="text-xs font-semibold text-monument-stone mb-2 uppercase tracking-wide">Key Milestones</p>
                <div className="space-y-2">
                  {phase.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5 font-bold">✓</span>
                      <p className="text-sm text-monument-stone">{milestone}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost and dependencies */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-[#6B6B6B]/70">
                    <span className="font-medium">Cost:</span> ${phase.cost}M
                  </span>
                </div>
                {phase.dependencies && phase.dependencies.length > 0 && (
                  <span className="text-xs text-[#6B6B6B]/50">
                    Depends on: {phase.dependencies.join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
