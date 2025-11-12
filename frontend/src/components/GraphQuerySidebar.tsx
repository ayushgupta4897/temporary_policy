'use client'

import { useState } from 'react'
import GraphQueryForm from './GraphQueryForm'

interface GraphQuerySidebarProps {
  queries: any[]
  selectedQuery: any
  onSelectQuery: (query: any) => void
  onDeleteQuery: (queryId: string) => void
  onRefresh: () => void
  onNewQuery?: (data: any) => Promise<any>
}

export default function GraphQuerySidebar({
  queries,
  selectedQuery,
  onSelectQuery,
  onDeleteQuery,
  onRefresh,
  onNewQuery
}: GraphQuerySidebarProps) {
  const [showNewQuery, setShowNewQuery] = useState(false)

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <span className="text-xs font-medium text-yellow-400 tracking-wide" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Processing</span>
          </div>
        )
      case 'done':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-xs font-medium text-green-400 tracking-wide" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Completed</span>
          </div>
        )
      case 'failed':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <span className="text-xs font-medium text-red-400 tracking-wide" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Failed</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-xs font-medium text-gray-400 tracking-wide" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Unknown</span>
          </div>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <aside className="w-80 border-r border-dark-300/50 bg-dark-700/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-300/50 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Graph Queries</h2>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-dark-500/50 transition-colors"
            title="Refresh"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setShowNewQuery(true)}
          className="w-full btn-primary py-2"
        >
          + New Graph Query
        </button>
      </div>

      {/* Query List - Fixed height with scroll */}
      <div className="flex-1 overflow-y-auto min-h-0 relative scrollbar-thin scrollbar-thumb-dark-400 scrollbar-track-dark-700">
        {/* Scroll indicator - top fade */}
        <div className="sticky top-0 h-4 bg-gradient-to-b from-dark-700/30 to-transparent pointer-events-none z-10"></div>

        {queries.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No graph queries yet</p>
            <p className="text-sm mt-2">Create your first evidence graph</p>
          </div>
        ) : (
          <div className="p-2 space-y-2 pb-4">
            {queries.map((query) => (
              <div
                key={query.queryId}
                onClick={() => onSelectQuery(query)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all
                  ${selectedQuery?.queryId === query.queryId
                    ? 'bg-gradient-to-r from-gradient-from/20 to-gradient-via/20 border border-gradient-from/30'
                    : 'hover:bg-dark-500/30 border border-transparent'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="mb-2">
                      {getStatusDisplay(query.status)}
                    </div>
                    <h3 className="text-sm font-medium text-gray-200 truncate mb-1">
                      {query.displayTitle || query.query.substring(0, 50)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatDate(query.createdAt)}
                    </p>
                    {query.nodeCount > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {query.nodeCount} nodes · {query.edgeCount} edges
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm('Delete this graph query?')) {
                        onDeleteQuery(query.queryId)
                      }
                    }}
                    className="p-1 rounded hover:bg-dark-400/50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scroll indicator - bottom fade */}
        <div className="sticky bottom-0 h-4 bg-gradient-to-t from-dark-700/30 to-transparent pointer-events-none"></div>
      </div>

      {/* New Query Modal */}
      {showNewQuery && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={() => setShowNewQuery(false)}
              className="absolute -top-12 right-0 p-2 rounded-lg bg-dark-600 hover:bg-dark-500 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <GraphQueryForm
              onSubmit={async (data) => {
                if (onNewQuery) {
                  const result = await onNewQuery(data)
                  setShowNewQuery(false)
                  return result
                }
                return Promise.resolve()
              }}
              onSuccess={() => {
                setShowNewQuery(false)
                onRefresh()
              }}
            />
          </div>
        </div>
      )}
    </aside>
  )
}
