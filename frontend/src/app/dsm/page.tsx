'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authUtils } from '@/utils/auth'
import api from '@/services/api'

// Lazy load the 3D animation for better initial load performance
const DSMSystemsAnimation = lazy(() => import('@/components/DSMSystemsAnimation'))

export default function DynamicSystemsModeler() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [baseGraphs, setBaseGraphs] = useState<any[]>([])
  const [selectedGraph, setSelectedGraph] = useState<any>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [graphToDelete, setGraphToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    if (!authUtils.isAuthenticated()) {
      router.push('/auth?redirect=dsm')
      return
    }
    setIsAuthenticated(true)
    fetchBaseGraphs()
  }

  const fetchBaseGraphs = async () => {
    setIsLoading(true)
    try {
      const graphs = await api.listBaseGraphs()
      setBaseGraphs(graphs)
      if (graphs.length > 0 && !selectedGraph) {
        setSelectedGraph(graphs[0])
      }
    } catch (error) {
      console.error('Failed to fetch base graphs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/')
  }

  const handleNewProject = () => {
    router.push('/dsm/setup')
  }

  const handleDeleteClick = (e: React.MouseEvent, graph: any) => {
    e.stopPropagation() // Prevent card click
    setGraphToDelete(graph)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!graphToDelete) return

    setIsDeleting(true)
    try {
      await api.deleteDSMQuery(graphToDelete.queryId)
      // Refresh the list
      await fetchBaseGraphs()
      setDeleteModalOpen(false)
      setGraphToDelete(null)
    } catch (error) {
      console.error('Failed to delete query:', error)
      alert('Failed to delete project. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setGraphToDelete(null)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-600 overflow-y-auto">
      {/* Fixed Home Button - Top Left */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 w-12 h-12 bg-strategyand-accent hover:bg-strategyand-maroon rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg"
        aria-label="Go to homepage"
      >
        <span className="text-white text-2xl font-serif leading-none">&amp;</span>
      </Link>

      {/* Hero Section - Systems Thinking in Motion */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 py-12 border-b border-strategyand-hairline overflow-hidden bg-[#0A0A0A]">
        {/* 3D Background Animation - Full Visibility */}
        <div className="absolute inset-0">
          <Suspense fallback={<div className="w-full h-full bg-dark-700" />}>
            <DSMSystemsAnimation />
          </Suspense>
        </div>

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-end z-20">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-strategyand-off-white transition-all duration-280"
          >
            Sign Out
          </button>
        </div>

        {/* Hero Content - Asymmetric Grid Layout */}
        <div className="relative z-10 w-full h-full flex items-center">
          <div className="max-w-[1600px] mx-auto w-full grid grid-cols-12 gap-12 px-12">

            {/* Left Column: Title + Stats */}
            <div className="col-span-5 flex flex-col justify-center">
              <div className="backdrop-blur-xl bg-black/40 p-12 rounded-2xl border border-white/5">
                {/* Eyebrow */}
                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-sans mb-6 font-medium">
                  AI-DRIVEN INTERVENTION MODELING
                </p>

                {/* Hero Title */}
                <h1 className="text-8xl font-serif font-semibold text-[#F5F3EE] leading-[0.95] tracking-tighter mb-8">
                  Dynamic
                  <br />
                  Systems
                  <br />
                  Modeler
                </h1>

                {/* Hairline */}
                <div className="h-px w-24 bg-gradient-to-r from-[#B8860B] to-transparent mb-8" />

                {/* Tagline */}
                <p className="text-base text-neutral-400 leading-relaxed mb-12 font-sans">
                  Model complex policy interventions before implementation.
                  Evidence-backed scenario analysis at unprecedented scale.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-5xl font-light text-strategyand-accent mb-1">60</div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Nodes Per Graph
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-light text-strategyand-accent mb-1">150+</div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Evidence Citations
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-light text-strategyand-accent mb-1">10</div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Taxonomy Categories
                    </div>
                  </div>
                  <div>
                    <div className="text-5xl font-light text-strategyand-accent mb-1">120+</div>
                    <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Causal Edges
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column: Empty Space for Animation */}
            <div className="col-span-2" />

            {/* Right Column: Value Props + CTA */}
            <div className="col-span-5 flex flex-col justify-center gap-6">

              {/* Value Proposition Cards */}
              <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-white/5 hover:border-strategyand-maroon/30 transition-all duration-280 group">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl bg-strategyand-maroon/10 flex items-center justify-center flex-shrink-0 group-hover:bg-strategyand-maroon/20 transition-all">
                    <svg className="w-7 h-7 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[#F5F3EE] font-semibold text-lg mb-2 font-sans">Hierarchical Taxonomy</div>
                    <div className="text-sm text-neutral-400 leading-relaxed">
                      Parent-child node structure with 10 custom categories. AI-generated evidence synthesis across 50+ factors.
                    </div>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-white/5 hover:border-strategyand-maroon/30 transition-all duration-280 group">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl bg-strategyand-maroon/10 flex items-center justify-center flex-shrink-0 group-hover:bg-strategyand-maroon/20 transition-all">
                    <svg className="w-7 h-7 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[#F5F3EE] font-semibold text-lg mb-2 font-sans">Dense Causal Networks</div>
                    <div className="text-sm text-neutral-400 leading-relaxed">
                      120+ edge graphs with 2-4x node-to-edge ratio. Cross-category connections reveal system dynamics.
                    </div>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-black/30 p-8 rounded-2xl border border-white/5 hover:border-strategyand-maroon/30 transition-all duration-280 group">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-xl bg-strategyand-maroon/10 flex items-center justify-center flex-shrink-0 group-hover:bg-strategyand-maroon/20 transition-all">
                    <svg className="w-7 h-7 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[#F5F3EE] font-semibold text-lg mb-2 font-sans">Intervention Deltas</div>
                    <div className="text-sm text-neutral-400 leading-relaxed">
                      Before-after graph comparison. Quantified node changes, edge modifications, cascade impact analysis.
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleNewProject}
                  className="flex-1 px-8 py-4 bg-strategyand-accent hover:bg-gradient-to-r hover:from-strategyand-maroon hover:to-strategyand-accent text-[#F5F3EE] font-semibold rounded-lg transition-all duration-280 shadow-2xl hover:shadow-strategyand-accent/20"
                >
                  Create New Project
                </button>
                {baseGraphs.length > 0 && (
                  <button
                    onClick={() => {
                      const scrollTarget = document.getElementById('projects-section')
                      scrollTarget?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="px-8 py-4 backdrop-blur-xl bg-black/30 border border-white/10 text-neutral-300 font-semibold rounded-lg hover:border-strategyand-maroon/50 transition-all duration-280"
                  >
                    View Projects ({baseGraphs.length})
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Projects Section */}
      {baseGraphs.length > 0 && (
        <section id="projects-section" className="min-h-screen py-16 px-6 bg-dark-600">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-semibold text-strategyand-off-white mb-2 font-serif">Your Projects</h2>
              <div className="h-px w-20 bg-strategyand-maroon" />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-12 w-12 text-strategyand-maroon" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {baseGraphs.map((graph) => (
                  <div
                    key={graph.queryId}
                    className="relative p-6 rounded-lg bg-dark-700 border border-strategyand-hairline hover:border-strategyand-maroon/40 transition-all duration-280 cursor-pointer group"
                    onClick={() => router.push(`/dsm/viewer/${graph.queryId}`)}
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(e, graph)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-dark-600/80 hover:bg-strategyand-accent/20 text-neutral-400 hover:text-strategyand-accent transition-all duration-280 opacity-0 group-hover:opacity-100"
                      title="Delete project"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-8">
                        <h3 className="text-base font-semibold text-strategyand-off-white mb-2 group-hover:text-strategyand-accent transition-colors duration-280">
                          {graph.displayTitle || graph.query}
                        </h3>
                        <p className="text-sm text-neutral-500 line-clamp-2">
                          {graph.query}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                        graph.status === 'done'
                          ? 'bg-status-complete/20 text-status-complete'
                          : graph.status === 'processing'
                          ? 'bg-status-running/20 text-status-running'
                          : 'bg-status-error/20 text-status-error'
                      }`}>
                        {graph.status === 'done' ? 'Ready' : graph.status === 'processing' ? 'Building' : 'Failed'}
                      </div>
                    </div>

                    {graph.status === 'done' && (
                      <div className="flex gap-4 text-sm text-neutral-500 mb-4">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          <span>{graph.nodeCount || 0} nodes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span>{graph.edgeCount || 0} edges</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-strategyand-hairline text-xs text-neutral-600">
                      Created {new Date(graph.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!isLoading && baseGraphs.length === 0 && (
        <section className="min-h-[50vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-strategyand-maroon/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-strategyand-off-white mb-3 font-serif">No projects yet</h3>
            <p className="text-neutral-500 mb-6 leading-relaxed">
              Create your first Dynamic Systems Model to begin modeling complex policy interventions
            </p>
            <button
              onClick={handleNewProject}
              className="px-6 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all duration-280 shadow-lg"
            >
              Create First Project
            </button>
          </div>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && graphToDelete && (
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
                  {graphToDelete.displayTitle || graphToDelete.query}
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
    </div>
  )
}
