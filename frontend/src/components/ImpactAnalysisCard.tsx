'use client';

import { ImpactAnalysisResponse } from '@/types';

interface ImpactAnalysisCardProps {
  analysis: ImpactAnalysisResponse;
  onSelect: (analysis: ImpactAnalysisResponse) => void;
  onDelete: (analysisId: string) => void;
  onRegenerate: (analysisId: string) => void;
}

export default function ImpactAnalysisCard({ 
  analysis, 
  onSelect, 
  onDelete, 
  onRegenerate 
}: ImpactAnalysisCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateQuery = (query: string, maxLength: number = 100) => {
    return query.length > maxLength ? query.substring(0, maxLength) + '...' : query;
  };

  return (
    <div className="neural-card p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 
            className="text-lg font-semibold text-gray-100 mb-2 cursor-pointer hover:text-gradient-from transition-colors line-clamp-2"
            onClick={() => onSelect(analysis)}
            title={analysis.query}
          >
            {truncateQuery(analysis.query)}
          </h3>
          
          <div className="flex items-center gap-2 mb-3">
            <span className={`flex items-center gap-1 text-sm ${getStatusColor(analysis.status)}`}>
              {getStatusIcon(analysis.status)}
              {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {analysis.status === 'completed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(analysis.analysis_id);
              }}
              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
              title="Regenerate analysis"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(analysis.analysis_id);
            }}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
            title="Delete analysis"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-dark-600/30 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Citations</div>
          <div className="text-lg font-semibold text-gray-200">
            {analysis.citations_count || 0}
          </div>
        </div>
        
        <div className="bg-dark-600/30 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">Quality Sources</div>
          <div className="text-lg font-semibold text-gray-200">
            {analysis.citations?.filter(c => c.quality_score === 'high').length || 0}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>ID: {analysis.analysis_id.slice(0, 8)}...</span>
        <span>{formatDate(analysis.created_at)}</span>
      </div>

      <button
        onClick={() => onSelect(analysis)}
        className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 hover:from-gradient-from/30 hover:to-gradient-to/30 text-white rounded-lg transition-all duration-300 text-sm font-medium"
      >
        View Analysis
      </button>
    </div>
  );
}
