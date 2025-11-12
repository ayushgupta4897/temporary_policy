/**
 * Citation Gallery Component
 * Displays rich citation cards with metadata and quality indicators
 */

interface Citation {
  title: string;
  publisher: string;
  year: string;
  url: string;
  doi?: string;
  quality_score: 'high' | 'medium' | 'low';
  source_tier: string;
  key_finding: string;
  methodology: string;
  multiplier?: string;
  badge_color?: 'emerald' | 'amber' | 'rose';
}

interface CitationGalleryProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    citations: Citation[];
  };
}

const qualityColors = {
  high: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  low: { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30' },
};

export function CitationGallery({ title, subtitle, insight, data }: CitationGalleryProps) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.citations.map((citation, index) => {
          const qualityStyle = qualityColors[citation.quality_score];
          return (
            <div
              key={index}
              className="bg-dark-500 border border-dark-400 rounded-lg p-5 hover:border-dark-300 transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-100 flex-1 leading-snug">
                  {citation.title}
                </h3>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${qualityStyle.bg} ${qualityStyle.text} ${qualityStyle.border}`}>
                    {citation.quality_score}
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                <div>
                  <span className="text-gray-400">Publisher:</span>
                  <span className="text-gray-200 ml-2">{citation.publisher}</span>
                </div>
                <div>
                  <span className="text-gray-400">Year:</span>
                  <span className="text-gray-200 ml-2">{citation.year}</span>
                </div>
                {citation.multiplier && (
                  <div className="col-span-2">
                    <span className="text-gray-400">Multiplier:</span>
                    <span className="text-gradient-from font-semibold ml-2">{citation.multiplier}</span>
                  </div>
                )}
              </div>

              {/* Key Finding */}
              <div className="mb-3 bg-dark-600/30 rounded-lg p-3 border border-dark-400/20">
                <div className="text-gray-400 text-xs font-semibold mb-1">Key Finding:</div>
                <p className="text-gray-200 text-sm leading-relaxed">{citation.key_finding}</p>
              </div>

              {/* Methodology */}
              <div className="mb-3 bg-dark-600/30 rounded-lg p-3 border border-dark-400/20">
                <div className="text-gray-400 text-xs font-semibold mb-1">Methodology:</div>
                <p className="text-gray-200 text-sm leading-relaxed">{citation.methodology}</p>
              </div>

              {/* Source Tier & Link */}
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 bg-dark-700/60 text-gray-300 border border-dark-400/30 rounded text-xs font-medium">
                  {citation.source_tier.replace(/_/g, ' ')}
                </span>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-strategyand-accent/20 hover:bg-strategyand-accent/30 rounded text-gray-200 transition-all text-xs font-medium"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View Source
                </a>
              </div>

              {/* DOI if available */}
              {citation.doi && (
                <div className="mt-2 pt-2 border-t border-dark-400/30">
                  <span className="text-gray-400 text-xs">DOI:</span>
                  <span className="text-gray-300 ml-2 font-mono text-xs">{citation.doi}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
