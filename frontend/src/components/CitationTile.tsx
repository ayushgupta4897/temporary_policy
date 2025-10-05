'use client';

import { Citation } from '@/types';

interface CitationTileProps {
  citation: Citation;
  showSourceTier?: boolean;
}

export default function CitationTile({ citation, showSourceTier = false }: CitationTileProps) {
  const formatTierName = (tier: string) => {
    return tier
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTierIcon = (tier: string) => {
    const iconMap: Record<string, string> = {
      'official_government_primary': '🏛️',
      'government_statistics_bureaus': '📊',
      'international_organizations_un': '🌍',
      'international_organizations_financial': '🏦',
      'international_organizations_oecd': '📈',
      'peer_reviewed_nature_science': '🔬',
      'peer_reviewed_medical': '⚕️',
      'peer_reviewed_social_science': '📚',
      'peer_reviewed_policy_journals': '📜',
      'peer_reviewed_domain_specific': '🎓',
      'university_research_centers': '🏫',
      'think_tanks_global': '💭',
      'think_tanks_regional': '🌐',
      'professional_associations': '👥',
      'regulatory_authorities': '⚖️',
      'central_banks_monetary': '💰',
      'industry_reports_consulting': '📋',
      'industry_reports_market_research': '📊',
      'industry_associations': '🏢',
      'news_quality_international': '📰',
      'news_quality_business': '💼',
      'news_specialized_trade': '📡',
      'multilateral_development_banks': '🏛️',
      'ngo_advocacy_organizations': '🤝',
      'policy_implementation_cases': '⚙️',
      'comparative_international_studies': '🔄',
      'historical_policy_analysis': '📜',
      'emerging_trends_future': '🚀',
      'quantitative_data_metrics': '📊',
      'implementation_barriers_challenges': '⚠️'
    };
    return iconMap[tier] || '📄';
  };

  const getSourceTypeColor = (sourceType: string) => {
    const colorMap: Record<string, string> = {
      'academic_journal': 'text-blue-400 bg-blue-400/10',
      'government_report': 'text-green-400 bg-green-400/10',
      'news_article': 'text-purple-400 bg-purple-400/10',
      'policy_document': 'text-yellow-400 bg-yellow-400/10',
      'research_study': 'text-cyan-400 bg-cyan-400/10',
      'industry_report': 'text-orange-400 bg-orange-400/10',
      'regulatory_document': 'text-red-400 bg-red-400/10',
      'statistics': 'text-indigo-400 bg-indigo-400/10',
      'data_analysis': 'text-teal-400 bg-teal-400/10'
    };
    return colorMap[sourceType] || 'text-gray-400 bg-gray-400/10';
  };

  const handleLinkClick = (url: string) => {
    if (url) {
      // Ensure URL has protocol
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    }).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  };

  return (
    <div className="neural-card p-6 hover:shadow-lg hover:shadow-gradient-from/5 transition-all duration-300 group border border-dark-400/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-100 mb-2 line-clamp-2 group-hover:text-gradient-from transition-colors">
            {citation.title || 'Untitled Document'}
          </h3>
          
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
              </svg>
              {citation.publisher || 'Unknown Publisher'}
            </span>
            
            {citation.year && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {citation.year}
              </span>
            )}

            {citation.doi && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                DOI Available
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {showSourceTier && citation.source_tier && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 text-gradient-from rounded-full border border-gradient-from/30">
                {getTierIcon(citation.source_tier)}
                {formatTierName(citation.source_tier)}
              </span>
            )}
            
            {citation.source_type && (
              <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${getSourceTypeColor(citation.source_type)} border-current/30`}>
                {citation.source_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => copyToClipboard(citation.title || '')}
            className="p-2 text-gray-400 hover:text-gray-300 hover:bg-dark-600/50 rounded-lg transition-colors"
            title="Copy title"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary */}
      {citation.summary && (
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
          {citation.summary}
        </p>
      )}

      {/* Key Quote */}
      {citation.key_quote && (
        <blockquote className="border-l-4 border-gradient-from/50 pl-4 py-2 mb-4 bg-dark-600/20 rounded-r-lg">
          <p className="text-gray-300 text-sm italic">"{citation.key_quote}"</p>
        </blockquote>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-dark-400/30">
        {/* URL */}
        <div className="flex-1 min-w-0">
          {citation.url ? (
            <button
              onClick={() => handleLinkClick(citation.url)}
              className="flex items-center gap-2 text-gradient-from hover:text-gradient-to transition-colors text-sm truncate max-w-full"
              title={`Open: ${citation.url}`}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="truncate">
                {citation.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
              </span>
            </button>
          ) : (
            <span className="text-gray-500 text-sm">No URL available</span>
          )}
        </div>

        {/* DOI Link */}
        {citation.doi && (
          <button
            onClick={() => {
              const doi = citation.doi!; // We know it's defined because of the check above
              const doiUrl = doi.startsWith('http') 
                ? doi 
                : `https://doi.org/${doi}`;
              handleLinkClick(doiUrl);
            }}
            className="ml-4 flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition-colors"
            title="Open DOI link"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            DOI
          </button>
        )}
      </div>

      {/* Search Streams (if available) */}
      {citation.search_streams && citation.search_streams.length > 1 && (
        <div className="mt-3 pt-3 border-t border-dark-400/20">
          <p className="text-xs text-gray-500">
            Found via {citation.search_streams.length} search streams: {citation.search_streams.slice(0, 3).join(', ')}
            {citation.search_streams.length > 3 && ` +${citation.search_streams.length - 3} more`}
          </p>
        </div>
      )}
    </div>
  );
}
