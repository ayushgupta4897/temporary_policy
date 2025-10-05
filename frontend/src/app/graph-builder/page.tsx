'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import GraphQueryForm from '@/components/GraphQueryForm'
import GraphQuerySidebar from '@/components/GraphQuerySidebar'
import GraphViewer from '@/components/GraphViewer'
import { QueryListSkeleton } from '@/components/LoadingSkeleton'
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
    const isAuth = localStorage.getItem('isAuthenticated') === 'true'
    if (!isAuth) {
      router.push('/')
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
    <div className="min-h-screen flex flex-col bg-dark-600">
      {/* Header */}
      <header className="px-6 py-4 border-b border-dark-300/50 backdrop-blur-sm bg-dark-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-dark-500/50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-gradient-from/30 to-gradient-via/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-100">System Compass</h1>
                <p className="text-sm text-gray-400">Systems Evidence Graph Analysis</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <GraphQuerySidebar
          queries={queries}
          selectedQuery={selectedQuery}
          onSelectQuery={setSelectedQuery}
          onDeleteQuery={handleDeleteQuery}
          onRefresh={fetchQueries}
          onNewQuery={handleNewQuery}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
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
    </div>
  )
}
