'use client';

import { useState } from 'react';

interface ImpactAnalysisFormProps {
  onSubmit: (query: string) => Promise<void>;
}

export default function ImpactAnalysisForm({ onSubmit }: ImpactAnalysisFormProps) {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered with query:', query);
    
    if (!query.trim() || isSubmitting) {
      console.log('Form submission blocked - empty query or already submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Calling onSubmit with query:', query.trim());
      await onSubmit(query.trim());
    } catch (error) {
      console.error('Failed to submit analysis:', error);
      alert('Failed to submit analysis. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exampleQueries = [
    "Impact of renewable energy investment on GDP growth",
    "Effect of minimum wage increases on unemployment rates", 
    "Impact of digital transformation on productivity",
    "Effect of education spending on economic development",
    "Impact of healthcare access on workforce participation"
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          <span style={{
              display: 'inline-block',
              background: 'linear-gradient(to right, #A32020, #D93954)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              paddingLeft: '4px',
              paddingRight: '4px'
            }}>
            New Impact Analysis
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Analyze causal relationships with quantitative evidence and multiplier calculations
        </p>
      </div>

      <div className="neural-card p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="query" className="block text-lg font-medium text-gray-200 mb-3">
              Impact Analysis Query
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Impact of renewable energy investment on GDP growth..."
              className="w-full h-32 px-4 py-3 bg-dark-600/50 border border-dark-400/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from/50 focus:border-transparent resize-none"
              maxLength={1000}
              disabled={isSubmitting}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">
                Describe the causal relationship you want to quantify
              </p>
              <span className="text-sm text-gray-500">
                {query.length}/1000
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isSubmitting}
            className="w-full px-6 py-4 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Launching Analysis...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Launch Impact Analysis
              </>
            )}
          </button>
        </form>
      </div>

      <div className="neural-card p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Example Queries</h3>
        <div className="space-y-3">
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              disabled={isSubmitting}
              className="w-full text-left p-3 bg-dark-600/30 hover:bg-dark-600/50 rounded-lg text-gray-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 p-6 bg-dark-600/20 rounded-lg border border-dark-400/30">
        <h4 className="text-md font-medium text-gray-200 mb-3">Analysis Process:</h4>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gradient-from/30 to-gradient-via/30 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
            <span>Searches <strong>20 high-trust academic and official sources</strong> in parallel</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gradient-from/30 to-gradient-via/30 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
            <span>Generates <strong>analytical framework</strong> with causal identification strategies</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gradient-from/30 to-gradient-via/30 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
            <span>Synthesizes findings with <strong>multiplier calculations</strong> and markdown formatting</span>
          </div>
          <div className="flex items-start gap-3 mt-4 pt-3 border-t border-dark-400/20">
            <div className="w-2 h-2 bg-gradient-from rounded-full mt-2"></div>
            <span className="text-xs">Runs in background - typically takes <strong>2-5 minutes</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
