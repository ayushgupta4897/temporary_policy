'use client';

import { ContextualSearchQuery } from '@/types';

interface ContextualSearchCardProps {
  search: ContextualSearchQuery;
  onSelect: (search: ContextualSearchQuery) => void;
  onDelete: (queryId: string) => void;
}

export default function ContextualSearchCard({ search, onSelect, onDelete }: ContextualSearchCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-status-warning';
      case 'done': return 'text-status-success';
      case 'failed': return 'text-status-error';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-status-warning border-t-transparent rounded-full animate-spin"></div>
        );
      case 'done':
        return (
          <svg className="w-4 h-4 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="w-4 h-4 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 1) return 'just now';
      if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
      if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
      if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
      
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div className="neural-card p-6 hover:shadow-2xl hover:shadow-gradient-from/10 transition-all duration-300 group cursor-pointer border border-dark-400/30 hover:border-gradient-from/30">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1" onClick={() => onSelect(search)}>
          <h3 className="text-lg font-semibold text-gray-100 mb-2 line-clamp-2 group-hover:text-gradient-to transition-colors">
            {search.displayTitle || search.query}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2">
            {search.query}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(search.queryId);
          }}
          className="ml-4 p-2 text-gray-500 hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Delete search"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div onClick={() => onSelect(search)}>
        {/* Status and Progress */}
        <div className="flex items-center gap-2 mb-4">
          {getStatusIcon(search.status)}
          <span className={`text-sm font-medium ${getStatusColor(search.status)}`}>
            {search.status === 'processing' && 'Searching across source tiers...'}
            {search.status === 'done' && 'Search completed'}
            {search.status === 'failed' && 'Search failed'}
          </span>
        </div>

        {/* Stats Grid */}
        {search.status === 'done' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-dark-600/30 rounded-lg p-3 border border-dark-400/20">
              <div className="text-xl font-bold text-gradient-to">
                {search.uniqueCitations || 0}
              </div>
              <div className="text-xs text-gray-400">Citations Found</div>
            </div>
            <div className="bg-dark-600/30 rounded-lg p-3 border border-dark-400/20">
              <div className="text-xl font-bold text-gradient-via">
                {search.sourceTiersCovered || 0}
              </div>
              <div className="text-xs text-gray-400">Source Tiers</div>
            </div>
            <div className="bg-dark-600/30 rounded-lg p-3 border border-dark-400/20">
              <div className="text-xl font-bold text-gradient-to">
                {search.totalSearches || 0}
              </div>
              <div className="text-xs text-gray-400">Total Searches</div>
            </div>
            <div className="bg-dark-600/30 rounded-lg p-3 border border-dark-400/20">
              <div className="text-xl font-bold text-gray-300">
                {search.durationMinutes || 0}m
              </div>
              <div className="text-xs text-gray-400">Duration</div>
            </div>
          </div>
        )}

        {/* Progress for processing searches */}
        {search.status === 'processing' && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>Processing search streams...</span>
              <span>30 source tiers</span>
            </div>
            <div className="w-full bg-dark-500 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-gradient-from to-gradient-to h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {search.status === 'failed' && search.errorMessage && (
          <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-3 mb-4">
            <p className="text-status-error text-sm">{search.errorMessage}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-dark-400/30">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTimeAgo(search.createdAt)}
            </span>
            {search.completedAt && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed {formatTimeAgo(search.completedAt)}
              </span>
            )}
          </div>
          
          <span className="font-mono text-xs bg-dark-600/50 px-2 py-1 rounded">
            {search.queryId.split('-')[0]}
          </span>
        </div>

        {/* View Results Indicator */}
        {search.status === 'done' && (
          <div className="mt-3 pt-3 border-t border-dark-400/20">
            <div className="flex items-center justify-center text-gradient-to text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Results
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
