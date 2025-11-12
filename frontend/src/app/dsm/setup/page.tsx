'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/services/api'

const DEFAULT_PARENTS = [
  'Food Environment',
  'Exercise & Physical Activity',
  'Healthcare Access',
  'Economic Factors',
  'Education System',
  'Cultural Norms',
  'Built Environment',
  'Policy & Regulation',
  'Technology & Media',
  'Mental Health'
]

export default function DSMSetup() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: Query, 2: Parents, 3: Generate, 4: Review
  const [mainQuery, setMainQuery] = useState('')
  const [parentCategories, setParentCategories] = useState<string[]>(DEFAULT_PARENTS)
  const [taxonomy, setTaxonomy] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState('')
  const [taxonomyQueryId, setTaxonomyQueryId] = useState('')
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [pollInterval])

  const handleParentChange = (index: number, value: string) => {
    const updated = [...parentCategories]
    updated[index] = value
    setParentCategories(updated)
  }

  const loadSuggestedCategories = async () => {
    setIsLoadingCategories(true)
    setError('')

    try {
      const response = await api.suggestParentCategories(mainQuery)
      setParentCategories(response.categories)
      setStep(2)
    } catch (err) {
      setError('Failed to generate category suggestions. Please try again.')
      console.error(err)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  const handleGenerateTaxonomy = async () => {
    if (!mainQuery.trim()) {
      setError('Please enter a main query')
      return
    }

    if (parentCategories.some(p => !p.trim())) {
      setError('All 10 parent categories must be filled')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      const response = await api.submitTaxonomyGeneration({
        main_query: mainQuery,
        parent_categories: parentCategories
      })

      setTaxonomyQueryId(response.queryId)
      setStep(3) // Move to generating step immediately

      // Clear any existing poll interval
      if (pollInterval) {
        clearInterval(pollInterval)
      }

      // Poll for completion (record is created synchronously, so we can poll immediately)
      const interval = setInterval(async () => {
        try {
          const status = await api.getDSMQueryStatus(response.queryId)

          console.log('Poll status:', status.status, 'stage:', status.stage)

          if (status.status === 'done') {
            clearInterval(interval)
            setPollInterval(null)
            // Fetch taxonomy content
            const content = await api.getDSMContent(response.queryId, 'taxonomy')
            setTaxonomy(JSON.parse(content.content))
            setStep(4) // Move to review step
            setIsGenerating(false)
          } else if (status.status === 'failed') {
            clearInterval(interval)
            setPollInterval(null)
            setError(status.errorMessage || 'Taxonomy generation failed')
            setIsGenerating(false)
          }
          // Don't stop polling on other statuses or errors - keep trying
        } catch (err) {
          console.error('Poll error:', err)
          // Don't stop polling on error - backend might be restarting
        }
      }, 5000) // Poll every 5 seconds

      setPollInterval(interval)
    } catch (err: any) {
      setError(err.message || 'Failed to generate taxonomy')
      setIsGenerating(false)
    }
  }

  const handleChildEdit = (parentIndex: number, childIndex: number, field: string, value: string) => {
    const updated = { ...taxonomy }
    updated.categories[parentIndex].children[childIndex][field] = value
    setTaxonomy(updated)
  }

  const handleAddChild = (parentIndex: number) => {
    const updated = { ...taxonomy }
    updated.categories[parentIndex].children.push({
      id: `custom_${Date.now()}`,
      label: 'New factor',
      description: 'Custom factor',
      evidence_strength: 'Medium',
      measurability: 'Medium'
    })
    setTaxonomy(updated)
  }

  const handleDeleteChild = (parentIndex: number, childIndex: number) => {
    const updated = { ...taxonomy }
    updated.categories[parentIndex].children.splice(childIndex, 1)
    setTaxonomy(updated)
  }

  const handleBuildBaseGraph = async () => {
    setIsBuilding(true)
    setError('')

    try {
      const response = await api.submitBaseGraph({
        main_query: mainQuery,
        taxonomy: taxonomy
      })

      // Navigate to viewer (will show processing state)
      router.push(`/dsm/viewer/${response.queryId}`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit base graph')
      setIsBuilding(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-600 py-8 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dsm')}
            className="flex items-center gap-2 text-neutral-400 hover:text-strategyand-off-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Projects</span>
          </button>

          <h1 className="text-3xl font-bold text-strategyand-off-white mb-2 font-serif tracking-zen">Create New Project</h1>
          <p className="text-neutral-400">Set up your custom taxonomy and build the base graph</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12">
          {[
            { num: 1, title: 'Main Query' },
            { num: 2, title: 'Parent Categories' },
            { num: 3, title: 'Generate Children' },
            { num: 4, title: 'Review & Build' }
          ].map((s, i) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  step >= s.num
                    ? 'bg-strategyand-maroon text-strategyand-off-white'
                    : 'bg-dark-500 text-neutral-500'
                }`}>
                  {s.num}
                </div>
                <div className={`text-xs mt-2 ${step >= s.num ? 'text-strategyand-off-white' : 'text-neutral-500'}`}>
                  {s.title}
                </div>
              </div>
              {i < 3 && (
                <div className={`flex-1 h-1 mx-4 transition-all ${
                  step > s.num ? 'bg-strategyand-maroon' : 'bg-strategyand-hairline'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-dark-500/50 border border-dark-400 rounded-xl p-8">
          {/* Step 1: Main Query */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-strategyand-off-white mb-4 font-serif tracking-zen">What system do you want to model?</h2>
              <p className="text-neutral-400 mb-6">
                Enter the main question or issue you want to analyze. This will be the focus of your systems graph.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Main Query <span className="text-strategyand-accent">*</span>
                </label>
                <textarea
                  value={mainQuery}
                  onChange={(e) => setMainQuery(e.target.value)}
                  placeholder="e.g., High obesity rates in United States"
                  className="w-full px-4 py-3 bg-dark-600 border border-dark-400 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-strategyand-maroon transition-all"
                  rows={4}
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-strategyand-accent/20 border border-strategyand-accent/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (!mainQuery.trim()) {
                      setError('Please enter a main query')
                    } else {
                      setError('')
                      loadSuggestedCategories()
                    }
                  }}
                  disabled={isLoadingCategories}
                  className="px-6 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoadingCategories ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Generating Categories...</span>
                    </>
                  ) : (
                    'Continue to Parent Categories'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Parent Categories */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-strategyand-off-white mb-4 font-serif tracking-zen">Define 10 Parent Categories</h2>
              <p className="text-neutral-400 mb-6">
                These are AI-suggested high-level domains that influence your main query. You can edit any category to refine the analysis.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {parentCategories.map((parent, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">
                      Category {index + 1}
                    </label>
                    <input
                      type="text"
                      value={parent}
                      onChange={(e) => handleParentChange(index, e.target.value)}
                      className="w-full px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-neutral-100 focus:outline-none focus:ring-2 focus:ring-strategyand-maroon transition-all"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-strategyand-accent/20 border border-strategyand-accent/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-dark-600 border border-dark-400 text-neutral-300 font-semibold rounded-lg hover:bg-dark-500 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateTaxonomy}
                  className="px-6 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all"
                >
                  Generate Children
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 3 && (
            <div className="text-center py-12">
              <svg className="animate-spin h-16 w-16 mx-auto mb-6 text-strategyand-maroon" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <h3 className="text-2xl font-bold text-strategyand-off-white mb-3 font-serif tracking-zen">Generating Taxonomy...</h3>
              <p className="text-neutral-400 mb-2">AI is researching and generating child nodes for each category</p>
              <p className="text-sm text-neutral-500">This typically takes 2-3 minutes</p>
            </div>
          )}

          {/* Step 4: Review Taxonomy */}
          {step === 4 && taxonomy && (
            <div>
              <h2 className="text-2xl font-bold text-strategyand-off-white mb-4 font-serif tracking-zen">Review & Edit Taxonomy</h2>
              <p className="text-neutral-400 mb-6">
                Review the generated child nodes. You can edit, add, or delete factors before building the graph.
              </p>

              <div className="mb-6 p-4 bg-strategyand-maroon/10 border border-strategyand-maroon/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-neutral-400">Total Children Generated</div>
                    <div className="text-3xl font-bold text-strategyand-accent">{taxonomy.total_children}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-neutral-400">Across Categories</div>
                    <div className="text-3xl font-bold text-strategyand-off-white">{taxonomy.categories.length}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-6 max-h-[600px] overflow-y-auto pr-2">
                {taxonomy.categories.map((category: any, parentIndex: number) => (
                  <div key={parentIndex} className="border border-dark-400 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-strategyand-off-white mb-3">{category.parent}</h3>

                    <div className="space-y-2">
                      {category.children.map((child: any, childIndex: number) => (
                        <div key={childIndex} className="flex items-start gap-3 p-3 bg-dark-600 rounded-lg">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={child.label}
                              onChange={(e) => handleChildEdit(parentIndex, childIndex, 'label', e.target.value)}
                              className="w-full mb-2 px-3 py-1 bg-dark-500 border border-dark-400 rounded text-neutral-100 text-sm focus:outline-none focus:ring-1 focus:ring-strategyand-maroon"
                            />
                            <textarea
                              value={child.description}
                              onChange={(e) => handleChildEdit(parentIndex, childIndex, 'description', e.target.value)}
                              className="w-full px-3 py-1 bg-dark-500 border border-dark-400 rounded text-neutral-300 text-xs focus:outline-none focus:ring-1 focus:ring-strategyand-maroon"
                              rows={2}
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteChild(parentIndex, childIndex)}
                            className="p-2 text-strategyand-accent hover:bg-strategyand-accent/20 rounded transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddChild(parentIndex)}
                      className="mt-3 w-full py-2 border border-dashed border-strategyand-maroon/50 rounded-lg text-strategyand-accent hover:bg-strategyand-maroon/10 transition-all text-sm"
                    >
                      + Add Custom Factor
                    </button>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-strategyand-accent/20 border border-strategyand-accent/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  disabled={isBuilding}
                  className="px-6 py-3 bg-dark-600 border border-dark-400 text-neutral-300 font-semibold rounded-lg hover:bg-dark-500 transition-all disabled:opacity-50"
                >
                  Back to Categories
                </button>
                <button
                  onClick={handleBuildBaseGraph}
                  disabled={isBuilding}
                  className="px-6 py-3 bg-strategyand-accent hover:bg-strategyand-maroon text-strategyand-off-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {isBuilding ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Building...
                    </span>
                  ) : (
                    'Build Base Graph'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
