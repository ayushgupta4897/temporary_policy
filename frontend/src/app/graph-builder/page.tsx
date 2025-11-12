'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authUtils } from '@/utils/auth'
import GraphQueryForm from '@/components/GraphQueryForm'
import GraphQuerySidebar from '@/components/GraphQuerySidebar'
import GraphViewer from '@/components/GraphViewer'
import StrategyAndHeader from '@/components/StrategyAndHeader'
import { QueryListSkeleton } from '@/components/LoadingSkeleton'
import SystemCompassParticles from '@/components/SystemCompassParticles'
import FloatingSystemCompassChat from '@/components/FloatingSystemCompassChat'
import api from '@/services/api'

export default function GraphBuilder() {
  const router = useRouter()
  const [queries, setQueries] = useState<any[]>([])
  const [selectedQuery, setSelectedQuery] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    // Check authentication with 1-day expiry
    if (!authUtils.isAuthenticated()) {
      router.push('/auth?redirect=graph-builder')
      return
    }
    setIsAuthenticated(true)
    fetchQueries()
  }

  const fetchQueries = async () => {
    setIsLoading(true)
    try {
      const response = await api.listGraphQueries()
      setQueries(response)
      if (response.length > 0 && !selectedQuery) {
        setSelectedQuery(response[0])
      }
    } catch (error) {
      console.error('Failed to fetch graph queries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewQuery = async (queryData: any) => {
    try {
      const response = await api.submitGraphQuery(queryData)
      await fetchQueries()
      return response
    } catch (error) {
      console.error('Failed to submit graph query:', error)
      throw error
    }
  }

  const handleDeleteQuery = async (queryId: string) => {
    try {
      await api.deleteGraphQuery(queryId)
      await fetchQueries()
      if (selectedQuery?.queryId === queryId) {
        setSelectedQuery(null)
      }
    } catch (error) {
      console.error('Failed to delete graph query:', error)
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/')
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

      {/* Full-Screen Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-6 py-12 border-b border-dark-300/50 backdrop-blur-sm bg-dark-700/50">
        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 px-6 py-6 flex items-center justify-end">
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto w-full animate-fade-in">
          {/* Left Column - Content */}
          <div className="text-left">
            {/* Strategy& Logo - Clickable Home Button */}
            <Link
              href="/"
              className="flex items-center gap-4 mb-8 group cursor-pointer hover:opacity-90 transition-opacity inline-flex"
              aria-label="Return to homepage"
            >
              <div className="w-16 h-16 bg-strategyand-accent rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <span className="text-white font-serif text-4xl font-bold">&</span>
              </div>
              <div>
                <h1 className="text-2xl font-serif text-strategyand-off-white tracking-tight">System Compass</h1>
                <p className="text-sm text-strategyand-off-white/70">Ideation Center</p>
              </div>
            </Link>

            {/* Main Headline */}
            <h2 className="font-serif text-5xl lg:text-6xl font-normal mb-6 text-strategyand-off-white leading-tight">
              Map complex
              <br />
              <span className="text-strategyand-accent">social systems</span>
            </h2>

            {/* Divider */}
            <div className="h-1 w-32 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red mb-6"></div>

            {/* Description */}
            <p className="text-lg text-strategyand-off-white/80 mb-8 leading-relaxed">
              Build evidence-based causal graphs revealing how policies impact interconnected social, economic, and environmental systems with data-driven relationships.
            </p>

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-strategyand-accent font-serif text-3xl mb-2">Network</div>
                <div className="text-xs text-strategyand-off-white/60">
                  Causal mapping
                </div>
              </div>
              <div>
                <div className="text-strategyand-accent font-serif text-3xl mb-2">Evidence</div>
                <div className="text-xs text-strategyand-off-white/60">
                  Data-driven links
                </div>
              </div>
              <div>
                <div className="text-strategyand-accent font-serif text-3xl mb-2">Systems</div>
                <div className="text-xs text-strategyand-off-white/60">
                  Impact analysis
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - System Network Animation */}
          <div className="relative h-96 lg:h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <SystemCompassParticles />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-strategyand-off-white/60">Scroll to explore</span>
            <svg className="w-6 h-6 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Main Content Section - Appears on Scroll */}
      <section className="min-h-screen flex flex-col bg-dark-600">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 px-6 py-4 border-b border-dark-300/50 backdrop-blur-sm bg-dark-700/90 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-strategyand-accent rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-serif text-2xl font-bold">&</span>
              </div>
              <div>
                <h1 className="text-lg font-serif text-strategyand-off-white tracking-tight">System Compass</h1>
                <p className="text-xs text-strategyand-off-white/70">Evidence Graph Analysis</p>
              </div>
            </div>
          </div>
        </header>

        {/* Query Interface */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="flex-shrink-0 h-[calc(100vh-73px)] sticky top-[73px]">
            <GraphQuerySidebar
              queries={queries}
              selectedQuery={selectedQuery}
              onSelectQuery={setSelectedQuery}
              onDeleteQuery={handleDeleteQuery}
              onRefresh={fetchQueries}
              onNewQuery={handleNewQuery}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0">
            {isLoading ? (
              <div className="p-6">
                <QueryListSkeleton />
              </div>
            ) : selectedQuery ? (
              <GraphViewer
                query={selectedQuery}
                onRefresh={fetchQueries}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <GraphQueryForm
                  onSubmit={handleNewQuery}
                  onSuccess={fetchQueries}
                />
              </div>
            )}
          </main>
        </div>
      </section>

      {/* Floating Chat - Only show when viewing completed graph */}
      {selectedQuery && selectedQuery.status === 'done' && (
        <FloatingSystemCompassChat queryId={selectedQuery.queryId} />
      )}
    </div>
  )
}
