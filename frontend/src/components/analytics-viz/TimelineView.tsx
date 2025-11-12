interface TimelinePhase {
  phase: string;
  duration: string;
  milestones: string[];
  cost: number;
  successRate: number;
}

interface TimelineViewProps {
  phases: TimelinePhase[];
}

/**
 * Timeline View - Horizontal timeline with geometric nodes
 */
export function TimelineView({ phases }: TimelineViewProps) {
  return (
    <div className="bg-white/40 backdrop-blur-sm rounded-xl p-8 border border-monument-stone/20">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-monument-stone/30" style={{ zIndex: 0 }} />

        {/* Timeline phases */}
        <div className="relative grid grid-cols-3 gap-8" style={{ zIndex: 1 }}>
          {phases.map((phase, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Phase node */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold text-white mb-4"
                style={{
                  background: `linear-gradient(135deg, ${
                    phase.successRate > 70 ? '#9DD4C3' : phase.successRate > 60 ? '#FFE8C5' : '#FFD4B3'
                  } 0%, ${
                    phase.successRate > 70 ? '#7FC4B3' : phase.successRate > 60 ? '#FFD8A5' : '#FFB893'
                  } 100%)`,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {index + 1}
              </div>

              {/* Phase info */}
              <div className="text-center">
                <p className="monument-label font-semibold mb-2">
                  {phase.phase}
                </p>
                <p className="monument-label text-xs text-monument-stone/70 mb-3">
                  {phase.duration}
                </p>

                {/* Milestones */}
                <div className="bg-monument-sand/70 rounded-lg p-3 text-left space-y-1 border border-monument-stone/10">
                  {phase.milestones.slice(0, 2).map((milestone, mIndex) => (
                    <p key={mIndex} className="monument-label text-xs text-monument-stone/90">
                      • {milestone.length > 35 ? milestone.substring(0, 35) + '...' : milestone}
                    </p>
                  ))}
                </div>

                {/* Cost & Success rate */}
                <div className="flex justify-between mt-3 text-xs">
                  <span className="monument-label font-medium">
                    ${phase.cost}M
                  </span>
                  <span className="monument-label font-medium">
                    {phase.successRate}% success
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
