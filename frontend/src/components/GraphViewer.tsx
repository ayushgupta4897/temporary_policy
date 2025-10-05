'use client'

import { useState, useEffect } from 'react'
import api from '@/services/api'

interface GraphViewerProps {
  query: any
  onRefresh: () => void
}

export default function GraphViewer({ query, onRefresh }: GraphViewerProps) {
  const [activeTab, setActiveTab] = useState<'graph' | 'executive' | 'csv'>('graph')
  const [content, setContent] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadContent()
    const interval = setInterval(() => {
      if (query.status === 'processing') {
        onRefresh()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [query.queryId, query.status])

  const loadContent = async () => {
    if (query.status !== 'done') {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      // Load all content types in parallel
      const [interactive, executive, csv] = await Promise.all([
        api.getGraphContent(query.queryId, 'interactive'),
        api.getGraphContent(query.queryId, 'executive'),
        api.getGraphContent(query.queryId, 'csv')
      ])
      
      setContent({
        interactive: interactive.content,
        executive: executive.content,
        csv: csv.content
      })
    } catch (err) {
      setError('Failed to load graph content')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatus = () => {
    if (query.status === 'processing') {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <svg className="animate-spin h-12 w-12 mx-auto text-gradient-from" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">Building Evidence Graph...</h3>
            <p className="text-gray-400">This typically takes 10-15 minutes</p>
            {query.createdAt && (
              <p className="text-sm text-gray-500 mt-2">
                Started: {new Date(query.createdAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      )
    }

    if (query.status === 'failed') {
      const errorMsg = query.errorMessage || 'An error occurred during processing'
      
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 text-red-400">
              <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-3">
              Graph Generation Failed
            </h3>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-gray-300">
                {errorMsg}
              </p>
            </div>
            
            <div className="flex justify-center">
              <button onClick={onRefresh} className="btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderCsvTable = (csvContent: string) => {
    if (!csvContent) return null
    
    const lines = csvContent.split('\n').filter(line => line.trim())
    const headers = lines[0]?.split(',').map(h => h.trim())
    const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()))
    
    return (
      <div className="overflow-auto">
        <div className="inline-block min-w-full rounded-lg overflow-hidden bg-gradient-to-br from-dark-500/50 to-dark-600/50 backdrop-blur-sm border border-dark-400/30 shadow-2xl">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gradient-from/20 to-gradient-via/20">
                {headers?.map((header, i) => (
                  <th key={i} className="px-6 py-4 text-left text-sm font-semibold text-gray-100 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400/30">
              {rows.map((row, i) => (
                <tr 
                  key={i} 
                  className="bg-dark-600/40 hover:bg-dark-500/60 transition-all duration-200 hover:shadow-lg"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-4 text-sm text-gray-200 font-medium">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const statusContent = renderStatus()
  if (statusContent) return statusContent

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-dark-300/50 bg-dark-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-100">
              {query.displayTitle || query.query}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span>{query.geography}</span>
              <span>•</span>
              <span>{query.timeRange}</span>
              {query.nodeCount > 0 && (
                <>
                  <span>•</span>
                  <span>{query.nodeCount} nodes</span>
                  <span>•</span>
                  <span>{query.edgeCount} edges</span>
                </>
              )}
              {query.durationMinutes > 0 && (
                <>
                  <span>•</span>
                  <span>{query.durationMinutes} min</span>
                </>
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'graph'
                  ? 'bg-gradient-to-r from-gradient-from to-gradient-via text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📊 Graph
            </button>
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'executive'
                  ? 'bg-gradient-to-r from-gradient-from to-gradient-via text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📝 Executive Summary
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === 'csv'
                  ? 'bg-gradient-to-r from-gradient-from to-gradient-via text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📊 Data Tables
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <svg className="animate-spin h-8 w-8 text-gradient-from" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button onClick={loadContent} className="btn-primary">
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'graph' && (
              <div className="h-full">
                {content.interactive ? (
                  <iframe
                    srcDoc={content.interactive}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No graph visualization available
                  </div>
                )}
              </div>
            )}

            {activeTab === 'executive' && (
              <div className="p-6">
                <div className="max-w-4xl mx-auto">
                  {content.executive ? (
                    <div className="prose prose-invert max-w-none">
                      {/* Parse and render markdown properly */}
                      {content.executive
                        .replace(/^```markdown\n/, '') // Remove opening markdown fence
                        .replace(/\n```$/, '') // Remove closing markdown fence
                        .replace(/```\n?$/, '') // Remove any trailing fence
                        .split('\n').map((line: string, i: number) => {
                          // Handle headers
                          if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-2xl font-bold text-gray-100 mt-6 mb-3">{line.substring(3)}</h2>
                          }
                          if (line.startsWith('### ')) {
                            return <h3 key={i} className="text-xl font-semibold text-gray-200 mt-4 mb-2">{line.substring(4)}</h3>
                          }
                          // Handle bullet points
                          if (line.startsWith('* ') || line.startsWith('- ')) {
                            return <li key={i} className="text-gray-300 ml-6 mb-1">{line.substring(2)}</li>
                          }
                          // Handle bold text
                          if (line.includes('**')) {
                            const parts = line.split(/\*\*(.*?)\*\*/g)
                            return (
                              <p key={i} className="text-gray-300 mb-2">
                                {parts.map((part, j) => 
                                  j % 2 === 1 ? <strong key={j} className="text-gray-100 font-semibold">{part}</strong> : part
                                )}
                              </p>
                            )
                          }
                          // Regular paragraphs
                          if (line.trim()) {
                            return <p key={i} className="text-gray-300 mb-2">{line}</p>
                          }
                          return null
                        })}
                    </div>
                  ) : (
                    <p className="text-gray-500">No executive summary available</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'csv' && (
              <div className="p-6">
                {content.csv ? (
                  renderCsvTable(content.csv)
                ) : (
                  <p className="text-gray-500">No data tables available</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
