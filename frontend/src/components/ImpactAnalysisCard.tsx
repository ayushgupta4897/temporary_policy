'use client';

import { ImpactAnalysisResponse } from '@/types';

interface ImpactAnalysisCardProps {
  analysis: ImpactAnalysisResponse;
  onSelect: (analysis: ImpactAnalysisResponse) => void;
  onDelete: (analysisId: string) => void;
}

export default function ImpactAnalysisCard({
  analysis,
  onSelect,
  onDelete
}: ImpactAnalysisCardProps) {
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

  const getStatusBadge = () => {
    const statusConfig = {
      'completed': {
        label: 'Complete',
        className: 'bg-green-900/30 text-green-400 border-green-700/50'
      },
      'processing': {
        label: 'Running',
        className: 'bg-amber-900/30 text-amber-400 border-amber-700/50 animate-pulse'
      },
      'failed': {
        label: 'Error',
        className: 'bg-red-900/30 text-red-400 border-red-700/50'
      }
    };

    const config = statusConfig[analysis.status] || statusConfig['failed'];

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div
      onClick={() => onSelect(analysis)}
      className="bg-dark-500 border border-dark-400 rounded-lg p-6 hover:bg-dark-400/50 hover:border-dark-300 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-white font-medium text-lg leading-snug flex-1 mr-4">
          {truncateQuery(analysis.query)}
        </h3>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (analysis.status === 'processing') {
                if (window.confirm('This analysis is still running. Are you sure you want to cancel and delete it?')) {
                  onDelete(analysis.analysis_id);
                }
              } else {
                if (window.confirm('Are you sure you want to delete this analysis?')) {
                  onDelete(analysis.analysis_id);
                }
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-dark-600 rounded transition-all duration-200"
            title={analysis.status === 'processing' ? 'Cancel and delete analysis' : 'Delete analysis'}
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Date */}
      <p className="text-gray-400 text-sm mb-4">
        {formatDate(analysis.created_at)}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {/* Citations Count */}
        {analysis.status === 'completed' && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 2 0 01-2 2z" />
            </svg>
            <span>{analysis.citations_count && analysis.citations_count > 0 ? `${analysis.citations_count} sources` : '--'}</span>
          </div>
        )}

        {/* Status Info */}
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {analysis.status === 'processing' ? 'In progress' : formatDate(analysis.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
