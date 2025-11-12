'use client';

import { useState } from 'react';
import { Query } from '@/types';
import { 
  ProcessingIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertCircleIcon,
  RefreshIcon,
  TrashIcon,
  PolicyIcon,
  LightBulbIcon,
  ClockIcon
} from './Icons';
import { QueryListSkeleton } from './LoadingSkeleton';

interface QuerySidebarProps {
  queries: Query[];
  selectedQuery: Query | null;
  onSelectQuery: (query: Query) => void;
  onRefresh: () => void;
  onDeleteQuery?: (queryId: string) => void;
}

export default function QuerySidebar({ 
  queries, 
  selectedQuery, 
  onSelectQuery, 
  onRefresh,
  onDeleteQuery 
}: QuerySidebarProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusIcon = (query: Query) => {
    const isStuck = isStuckProcessing(query);
    
    switch (query.status) {
      case 'processing':
        return isStuck 
          ? <AlertCircleIcon className="text-red-500" size="sm" />
          : <ProcessingIcon className="text-amber-500" size="sm" />;
      case 'done':
        return <CheckCircleIcon className="text-green-500" size="sm" />;
      case 'failed':
        return <XCircleIcon className="text-red-500" size="sm" />;
      default:
        return <div className="w-4 h-4 bg-neutral-200 rounded-full" />;
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const isStuckProcessing = (query: Query) => {
    if (query.status !== 'processing') return false;
    const createdAt = new Date(query.createdAt).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - createdAt) / (1000 * 60);
    return elapsedMinutes > 180; // Stuck if processing for more than 180 minutes
  };

  const canDelete = (query: Query) => {
    return query.status !== 'processing' || isStuckProcessing(query);
  };

  const handleDeleteClick = (e: React.MouseEvent, queryId: string) => {
    e.stopPropagation(); // Prevent selecting the query
    setDeleteConfirmId(queryId);
  };

  const confirmDelete = (queryId: string) => {
    if (onDeleteQuery) {
      onDeleteQuery(queryId);
    }
    setDeleteConfirmId(null);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <aside className="w-80 bg-dark-700/50 border-r border-gradient-from/30 h-screen overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-neutral-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-gradient-from font-medium tracking-wide">Recent Analyses</h2>
            <p className="font-sans text-xs text-gray-400 mt-1 leading-relaxed">
              Your policy research history
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="p-2.5 hover:bg-dark-600/80 hover:shadow-sm rounded-xl transition-all duration-200 border border-transparent hover:border-gradient-from/30 group"
            title="Refresh queries"
          >
            <RefreshIcon className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" size="sm" />
          </button>
        </div>
        <div className="mt-3 p-2 bg-dark-600/60 rounded-lg border border-gradient-from/30 flex items-start gap-2">
          <LightBulbIcon className="text-amber-500 mt-0.5" size="sm" />
          <p className="text-xs text-gray-400 leading-relaxed font-medium font-sans">
            Queries processing 180+ minutes can be deleted if stuck
          </p>
        </div>
      </div>

      {/* Query List */}
      <div className="p-5">
        {queries.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-neutral-100 to-neutral-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <PolicyIcon className="text-gray-500" size="xl" />
            </div>
            <h3 className="font-serif text-base text-gray-300 mb-2 font-medium">No analyses yet</h3>
            <p className="font-sans text-xs text-gray-400 leading-relaxed">
              Start by creating your first<br />policy analysis query
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {queries.map((query, index) => (
              <div
                key={query.queryId}
                className={`relative animate-stagger ${index < 5 ? `stagger-${index + 1}` : ''}`}
              >
                {/* Confirmation Dialog */}
                {deleteConfirmId === query.queryId && (
                  <div className="absolute inset-0 z-10 bg-dark-700 rounded-lg border border-status-error/50 p-4">
                    <p className="text-sm text-gray-100 mb-3">
                      {isStuckProcessing(query) ? 'Delete stuck query?' : 'Delete this query?'}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {isStuckProcessing(query) 
                        ? 'This query has been processing for over 180 minutes and appears to be stuck. This action cannot be undone.'
                        : 'This action cannot be undone.'
                      }
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmDelete(query.queryId)}
                        className="flex-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={cancelDelete}
                        className="flex-1 px-3 py-1 bg-dark-600 text-gray-300 text-xs rounded hover:bg-dark-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Query Item */}
                <div
                  onClick={() => onSelectQuery(query)}
                  className={`group cursor-pointer p-5 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    selectedQuery?.queryId === query.queryId
                      ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 shadow-sm ring-1 ring-primary-200/50'
                      : isStuckProcessing(query)
                        ? 'hover:bg-red-50 border border-red-200 bg-red-50/30 hover:shadow-red-100'
                        : 'hover:bg-dark-600/50 border border-dark-500/30 bg-dark-700/30 hover:border-gradient-from/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-2">
                      {getStatusIcon(query)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm text-gray-100 leading-snug mb-3 font-medium tracking-wide">
                            {truncateText(query.query)}
                          </p>
                        </div>
                        
                        {/* Delete Button */}
                        {onDeleteQuery && canDelete(query) && (
                          <button
                            onClick={(e) => handleDeleteClick(e, query.queryId)}
                            className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-all duration-200 p-1.5 hover:bg-red-50 rounded-md"
                            title={isStuckProcessing(query) ? "Delete stuck query" : "Delete query"}
                          >
                            <TrashIcon className="text-red-500" size="sm" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full tracking-wide ${
                            isStuckProcessing(query) 
                              ? 'bg-red-100 text-red-800 font-bold' 
                              : query.status === 'processing'
                                ? 'bg-amber-100 text-amber-800'
                                : query.status === 'done'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : query.status === 'failed'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-dark-600/50 text-gray-300'
                          }`}>
                            {isStuckProcessing(query) ? 'Stuck' :
                             query.status === 'processing' ? 'Processing' : 
                             query.status === 'done' ? 'Complete' : 
                             query.status === 'failed' ? 'Failed' : 'Unknown'}
                          </span>
                          
                          {/* Analysis Mode Badge */}
                          {query.analysisMode === 'research_only' && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              Research
                            </span>
                          )}
                        </div>
                        
                        <span className="font-mono text-xs text-gray-400 tabular-nums">
                          {formatDate(query.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
