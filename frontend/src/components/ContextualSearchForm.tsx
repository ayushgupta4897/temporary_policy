'use client';

import { useState } from 'react';

interface ContextualSearchFormProps {
  onSubmit: (query: string) => void;
}

export default function ContextualSearchForm({ onSubmit }: ContextualSearchFormProps) {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(query.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 animate-neural-pulse shadow-lg mb-6">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent">
            New Contextual Search
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Launch a comprehensive multi-tier web search across 30+ source categories to extract the most relevant evidence for your research topic.
        </p>
      </div>

      <div className="neural-card p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Query Input */}
          <div>
            <label htmlFor="query" className="block text-gray-300 mb-4 text-lg font-medium">
              Research Query
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-6 py-4 bg-dark-500/80 backdrop-blur-sm border border-dark-300/50 rounded-xl focus:ring-2 focus:ring-gradient-from focus:border-gradient-from text-gray-100 placeholder-gray-400 transition-all shadow-sm resize-none"
              placeholder="Enter your research topic or question (e.g., 'UAE renewable energy policy initiatives 2024', 'mental health interventions in Gulf countries')"
              rows={4}
              required
              disabled={isSubmitting}
            />
            <p className="text-gray-500 text-sm mt-2">
              💡 Be specific and include geographic, temporal, or domain context for better results
            </p>
          </div>

          {/* Search Information */}
          <div className="border border-dark-400/30 rounded-xl p-6 bg-dark-600/20">
            <h3 className="text-lg font-medium text-gray-200 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Search Process
            </h3>
            
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-from rounded-full"></div>
                <span>Automatically processes <strong>30 source tiers</strong> in parallel</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-via rounded-full"></div>
                <span>Optimized <strong>batch processing</strong> for maximum efficiency</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gradient-to rounded-full"></div>
                <span>Intelligent <strong>deduplication</strong> and quality filtering</span>
              </div>
            </div>
          </div>

          {/* Search Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-dark-600/30 border border-dark-400/30">
              <div className="text-2xl font-bold text-gradient-from mb-1">30+</div>
              <div className="text-sm text-gray-400">Source Tiers</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-dark-600/30 border border-dark-400/30">
              <div className="text-2xl font-bold text-gradient-via mb-1">100+</div>
              <div className="text-sm text-gray-400">Expected Citations</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-dark-600/30 border border-dark-400/30">
              <div className="text-2xl font-bold text-gradient-to mb-1">5-10</div>
              <div className="text-sm text-gray-400">Minutes Duration</div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!query.trim() || isSubmitting}
              className="w-full btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner mr-3"></div>
                  Launching Search Across 30 Source Tiers...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Launch Contextual Search
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Section */}
        <div className="mt-8 pt-8 border-t border-dark-400/30">
          <h4 className="text-sm font-medium text-gray-300 mb-3">🎯 Source Categories Include:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-500">
            <div>• Government Official Reports</div>
            <div>• Academic Journals (Nature, Science)</div>
            <div>• International Organizations (UN, WHO)</div>
            <div>• Think Tanks & Policy Institutes</div>
            <div>• Industry Analysis & Consulting</div>
            <div>• Regulatory Authorities</div>
            <div>• Professional Associations</div>
            <div>• University Research Centers</div>
            <div>• Regional Development Banks</div>
            <div>• NGOs & Advocacy Groups</div>
            <div>• Implementation Case Studies</div>
            <div>• Comparative International Studies</div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Each source tier uses specialized search strategies and quality filters to ensure relevant, authoritative citations.
          </p>
        </div>
      </div>
    </div>
  );
}
