'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/services/api'
import FloatingDSMChat from '@/components/FloatingDSMChat'

export default function DSMViewer() {
  const router = useRouter()
  const params = useParams()
  const queryId = params.id as string

  const [query, setQuery] = useState<any>(null)
  const [interventions, setInterventions] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<'base' | string>('base') // 'base' or intervention ID
  const [graphContent, setGraphContent] = useState<string>('')
  const [deltaContent, setDeltaContent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showInterventionModal, setShowInterventionModal] = useState(false)
  const [interventionName, setInterventionName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'dense' | 'hierarchical'>('dense')

  useEffect(() => {
    if (queryId) {
      loadData()
    }
  }, [queryId])

  useEffect(() => {
    if (query?.status === 'processing') {
      const interval = setInterval(loadData, 5000)
      return () => clearInterval(interval)
    }
  }, [query?.status])

  useEffect(() => {
    // Reload graph when viewMode changes
    if (query?.status === 'done') {
      const viewId = selectedView === 'base' ? queryId : selectedView
      loadGraphContent(viewId)
    }
  }, [viewMode])

  const loadData = async () => {
    try {
      console.log('[DSM Viewer] Loading data for queryId:', queryId)

      // Load query status
      const queryData = await api.getDSMQueryStatus(queryId)
      console.log('[DSM Viewer] Query data:', queryData)
      setQuery(queryData)

      if (queryData.status === 'done') {
        console.log('[DSM Viewer] Query is done, loading content...')

        // If this is a base graph, load interventions
        if (queryData.isBaseGraph) {
          console.log('[DSM Viewer] This is a base graph, loading interventions...')
          const interventionList = await api.listInterventions(queryId)
          console.log('[DSM Viewer] Interventions loaded:', interventionList)
          setInterventions(interventionList)
        }

        // Load graph content
        const viewId = selectedView === 'base' ? queryId : selectedView
        console.log('[DSM Viewer] Loading graph content for viewId:', viewId)
        await loadGraphContent(viewId)
      } else {
        console.log('[DSM Viewer] Query status is not done:', queryData.status)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('[DSM Viewer] Failed to load data:', err)
      setIsLoading(false)
    }
  }

  const loadGraphContent = async (id: string) => {
    try {
      console.log('[DSM Viewer] Loading graph content for:', id)

      // Load the appropriate visualization based on viewMode
      const contentType = viewMode === 'dense' ? 'visualization' : 'hierarchical'
      const htmlResponse = await api.getDSMContent(id, contentType)
      console.log('[DSM Viewer] Received HTML response:', htmlResponse)

      if (htmlResponse && htmlResponse.content) {
        console.log('[DSM Viewer] Setting graph content, length:', htmlResponse.content.length)
        setGraphContent(htmlResponse.content)
      } else {
        console.error('[DSM Viewer] No content in response:', htmlResponse)
      }

      // If intervention, also load delta
      const isBase = id === queryId
      if (!isBase) {
        const deltaResponse = await api.getDSMContent(id, 'delta')
        setDeltaContent(JSON.parse(deltaResponse.content))
      } else {
        setDeltaContent(null)
      }
    } catch (err) {
      console.error('[DSM Viewer] Failed to load graph content:', err)
    }
  }

  const handleViewChange = async (viewId: string) => {
    setSelectedView(viewId)
    await loadGraphContent(viewId === 'base' ? queryId : viewId)
  }

  const handleAddIntervention = async () => {
    if (!interventionName.trim()) {
      setError('Please enter an intervention name')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await api.submitIntervention({
        base_graph_id: queryId,
        intervention_name: interventionName,
        intervention_details: {}
      })

      setShowInterventionModal(false)
      setInterventionName('')

      // Navigate to the new intervention (will show processing)
      router.push(`/dsm/viewer/${response.queryId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit intervention')
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      await api.deleteDSMQuery(queryId)
      // Navigate back to DSM home
      router.push('/dsm')
    } catch (error) {
      console.error('Failed to delete query:', error)
      alert('Failed to delete project. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <svg className="animate-spin h-12 w-12 text-strategyand-maroon" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  if (!query) {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-strategyand-off-white mb-4 font-serif">Graph not found</h2>
          <button
            onClick={() => router.push('/dsm')}
            className="px-6 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  // Processing state
  if (query.status === 'processing') {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg className="animate-spin h-16 w-16 mx-auto mb-6 text-strategyand-maroon" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h2 className="text-2xl font-bold text-strategyand-off-white mb-3 font-serif tracking-zen">
            {query.isBaseGraph ? 'Building Base Graph...' : 'Generating Intervention Scenario...'}
          </h2>
          <p className="text-neutral-400 mb-2">{query.stage || 'Processing...'}</p>
          <p className="text-sm text-neutral-500">This typically takes 10-15 minutes</p>
          <p className="text-xs text-neutral-600 mt-4">
            Started: {new Date(query.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>
    )
  }

  // Failed state
  if (query.status === 'failed') {
    return (
      <div className="min-h-screen bg-dark-600 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-strategyand-accent/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-strategyand-off-white mb-3 font-serif">Generation Failed</h2>
          <div className="p-4 bg-strategyand-accent/20 border border-strategyand-accent/50 rounded-lg text-red-300 mb-6">
            {query.errorMessage || 'An error occurred during processing'}
          </div>
          <button
            onClick={() => router.push('/dsm')}
            className="px-6 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  // Main viewer
  return (
    <div className="min-h-screen bg-dark-600">
      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 border-b border-dark-300/50 backdrop-blur-sm bg-dark-700/90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dsm')}
              className="p-2 rounded-lg hover:bg-dark-500/50 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">{query.displayTitle || query.query}</h1>
              <p className="text-sm text-gray-400">
                {query.nodeCount || 0} nodes • {query.edgeCount || 0} edges
              </p>
            </div>
          </div>

          {/* View Selector */}
          <div className="flex items-center gap-3">
            <select
              value={selectedView}
              onChange={(e) => handleViewChange(e.target.value)}
              className="px-4 py-2 bg-dark-500 border border-dark-400 rounded-lg text-neutral-200 focus:outline-none focus:ring-2 focus:ring-strategyand-maroon"
            >
              <option value="base">Base Graph</option>
              {interventions.map((int) => (
                <option key={int.queryId} value={int.queryId}>
                  {int.intervention || 'Intervention'}
                  {int.status === 'processing' && ' (Building...)'}
                </option>
              ))}
            </select>

            {query.isBaseGraph && (
              <button
                onClick={() => setShowInterventionModal(true)}
                className="px-4 py-2 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all"
              >
                + Add Disruptor
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={handleDeleteClick}
              className="p-2 rounded-lg bg-dark-500 hover:bg-strategyand-accent/20 text-neutral-400 hover:text-strategyand-accent transition-all"
              title="Delete project"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Graph Visualization */}
        <div className="flex-1 p-6">
          {/* View Mode Toggle */}
          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={() => setViewMode('dense')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'dense'
                  ? 'bg-strategyand-maroon text-white shadow-lg'
                  : 'bg-dark-500 text-neutral-400 hover:bg-dark-400'
              }`}
            >
              Dense Graph
            </button>
            <button
              onClick={() => setViewMode('hierarchical')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                viewMode === 'hierarchical'
                  ? 'bg-strategyand-maroon text-white shadow-lg'
                  : 'bg-dark-500 text-neutral-400 hover:bg-dark-400'
              }`}
            >
              Hierarchical View
            </button>
            <div className="ml-2 text-xs text-neutral-500">
              {viewMode === 'dense' ? 'All nodes visible' : 'Click parent nodes to expand'}
            </div>
          </div>

          {graphContent ? (
            <div className="h-[calc(100%-3.5rem)] rounded-xl border border-dark-400 bg-dark-500/50 overflow-hidden">
              <iframe
                srcDoc={graphContent}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No visualization available
            </div>
          )}
        </div>

        {/* Delta Panel (if intervention selected) */}
        {deltaContent && (
          <div className="w-96 p-6 border-l border-dark-300/50 bg-dark-700/50 overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Impact Analysis</h2>

            {/* Summary */}
            <div className="mb-6 p-4 bg-strategyand-maroon/10 border border-strategyand-maroon/30 rounded-lg">
              <h3 className="text-sm font-semibold text-neutral-400 mb-3">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Nodes Changed:</span>
                  <span className="text-white font-semibold">{deltaContent.summary?.nodes_changed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Edges Changed:</span>
                  <span className="text-white font-semibold">{deltaContent.summary?.edges_changed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Edges:</span>
                  <span className="text-green-400 font-semibold">{deltaContent.summary?.new_edges || 0}</span>
                </div>
              </div>
            </div>

            {/* Node Changes */}
            {deltaContent.node_changes && deltaContent.node_changes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Node Changes</h3>
                <div className="space-y-2">
                  {deltaContent.node_changes.slice(0, 5).map((change: any, i: number) => (
                    <div key={i} className="p-3 bg-dark-600 rounded-lg">
                      <div className="text-sm font-medium text-white mb-1">{change.node_label}</div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          {change.base_kpi?.value} → {change.intervention_kpi?.value}
                        </span>
                        <span className={change.percent_change > 0 ? 'text-red-400' : 'text-green-400'}>
                          {change.percent_change > 0 ? '+' : ''}{change.percent_change.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edge Changes */}
            {deltaContent.edge_changes && deltaContent.edge_changes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Top Edge Changes</h3>
                <div className="space-y-2">
                  {deltaContent.edge_changes.slice(0, 5).map((change: any, i: number) => (
                    <div key={i} className="p-3 bg-dark-600 rounded-lg">
                      <div className="text-xs text-gray-400 mb-1">
                        {change.source} → {change.target}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                          Weight: {change.base_weight.toFixed(2)} → {change.intervention_weight.toFixed(2)}
                        </span>
                        <span className={change.direction === 'strengthened' ? 'text-red-400' : 'text-green-400'}>
                          {change.direction === 'strengthened' ? '↑' : '↓'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Intervention Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-strategyand-off-white mb-4 font-serif tracking-zen">Add Disruptor Scenario</h2>
            <p className="text-neutral-400 mb-6">
              Enter a disruptor or external event to model its impact on the system.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Disruptor Name <span className="text-strategyand-accent">*</span>
              </label>
              <input
                type="text"
                value={interventionName}
                onChange={(e) => setInterventionName(e.target.value)}
                placeholder="e.g., FDA approves Ozempic for OTC use"
                className="w-full px-4 py-3 bg-dark-600 border border-dark-400 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-strategyand-maroon"
              />
            </div>

            {error && (
              <div className="mb-6 p-3 bg-strategyand-accent/20 border border-strategyand-accent/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowInterventionModal(false)
                  setInterventionName('')
                  setError('')
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-dark-600 border border-dark-400 text-neutral-300 font-semibold rounded-lg hover:bg-dark-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIntervention}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="bg-dark-700 border border-dark-400 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-strategyand-accent/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-strategyand-off-white mb-2 font-serif">Delete Project?</h2>
                <p className="text-neutral-400 text-sm mb-1">
                  Are you sure you want to delete this project? This action cannot be undone.
                </p>
                <p className="text-strategyand-accent text-sm font-medium mt-3">
                  {query?.displayTitle || query?.query}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-dark-600 border border-dark-400 text-neutral-300 font-semibold rounded-lg hover:bg-dark-500 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat - Only show when graph is done */}
      {query && query.status === 'done' && (
        <FloatingDSMChat queryId={queryId} />
      )}
    </div>
  )
}
