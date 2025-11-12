'use client';

import { FC } from 'react';
import { Query } from '@/types';

interface QueryCardProps {
  query: Query;
  onSelect: (query: Query) => void;
  onDelete?: (queryId: string) => void;
}

const QueryCard: FC<QueryCardProps> = ({ query, onSelect, onDelete }) => {
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      'done': {
        label: 'Complete',
        className: 'bg-status-complete/20 text-status-complete border-status-complete/40 font-semibold'
      },
      'processing': {
        label: 'Running',
        className: 'bg-status-running/20 text-status-running border-status-running/40 font-semibold animate-pulse'
      },
      'failed': {
        label: 'Error',
        className: 'bg-status-error/20 text-status-error border-status-error/40 font-semibold'
      }
    };

    const config = statusConfig[query.status] || statusConfig['failed'];

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Extract a synthesized summary from the query
  const getSynthesizedSummary = (queryText: string) => {
    // Extract key topics from the query - simple keyword extraction
    const keywords = queryText.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4 && !['about', 'policy', 'policies', 'develop', 'create', 'design', 'implement', 'for', 'with', 'from', 'should', 'could', 'would', 'please', 'analyze', 'research'].includes(word));
    
    // Capitalize first letter of each keyword
    const capitalizedKeywords = keywords.slice(0, 3).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    // Return a synthesized title
    if (capitalizedKeywords.length > 0) {
      return capitalizedKeywords.join(' ');
    }
    return truncateText(queryText, 60);
  };

  return (
    <div 
      onClick={() => onSelect(query)}
      className="bg-dark-500 border border-dark-400 rounded-lg p-6 hover:bg-dark-400/50 hover:border-dark-300 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-white font-medium text-lg leading-snug flex-1 mr-4">
          {query.displayTitle || getSynthesizedSummary(query.query)}
        </h3>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {onDelete && query.status !== 'processing' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(query.queryId);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-dark-600 rounded transition-all duration-200"
              title="Delete query"
            >
              <svg className="w-4 h-4 text-gray-400 hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Date - no label */}
      <p className="text-gray-400 text-sm mb-4">
        {formatDate(query.createdAt)}
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {/* Sources/Citations */}
        {query.status === 'done' && (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{query.citationsCount && query.citationsCount > 0 ? `${query.citationsCount} sources` : '--'}</span>
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {query.status === 'done' 
              ? (query.durationMinutes && query.durationMinutes > 0 ? formatDuration(query.durationMinutes) : '--')
              : query.status === 'processing'
              ? 'In progress'
              : formatDate(query.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QueryCard;
