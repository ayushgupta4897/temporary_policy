'use client'

import { useState } from 'react'
import { GraphIcon } from '@/components/icons/TabIcons'

interface GraphQueryFormProps {
  onSubmit: (data: any) => Promise<any>
  onSuccess: () => void
}

export default function GraphQueryForm({ onSubmit, onSuccess }: GraphQueryFormProps) {
  const [query, setQuery] = useState('')
  const [geography, setGeography] = useState('Dubai, UAE')
  const [timeRange, setTimeRange] = useState('2015–present')
  const [intervention, setIntervention] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a query')
      return
    }
    
    if (!geography.trim()) {
      setError('Please enter a geography')
      return
    }
    
    if (!timeRange.trim()) {
      setError('Please enter a time range')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onSubmit({
        query: query.trim(),
        geography: geography.trim(),
        time_range: timeRange.trim(),
        intervention: intervention.trim() || null
      })
      
      // Reset form
      setQuery('')
      setIntervention('')
      onSuccess()
    } catch (err) {
      setError('Failed to submit query. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl w-full p-8">
      <div className="neural-card p-8">
        <h2 className="text-2xl font-bold text-gray-100 mb-2 flex items-center gap-3">
          <GraphIcon className="w-6 h-6" />
          Build Evidence Graph
        </h2>
        <p className="text-gray-400 mb-6">
          Map complex social systems with data-driven causal relationships
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Focus Issue <span className="text-red-400">*</span>
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Divorce rates, Youth unemployment, Mental health crisis..."
              className="w-full px-4 py-3 bg-dark-500/50 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from focus:border-transparent transition-all"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Geography <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                placeholder="e.g., Dubai, UAE"
                className="w-full px-4 py-2 bg-dark-500/50 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from focus:border-transparent transition-all"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Range <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                placeholder="e.g., 2015–present"
                className="w-full px-4 py-2 bg-dark-500/50 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from focus:border-transparent transition-all"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Intervention <span className="text-gray-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={intervention}
              onChange={(e) => setIntervention(e.target.value)}
              placeholder="e.g., National Strategy for Financial Education"
              className="w-full px-4 py-2 bg-dark-500/50 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from focus:border-transparent transition-all"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary py-3"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Building Graph...
              </span>
            ) : (
              'Generate Evidence Graph'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
