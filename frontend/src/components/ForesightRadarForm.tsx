'use client';

import { FC, useState } from 'react';

interface ForesightRadarFormProps {
  onSubmit: (query: string) => void;
  isSubmitting: boolean;
}

const ForesightRadarForm: FC<ForesightRadarFormProps> = ({ onSubmit, isSubmitting }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isSubmitting) {
      onSubmit(query.trim());
    }
  };

  const exampleQueries = [
    'Future of renewable energy in the Middle East by 2035',
    'Impact of AI on workforce transformation in financial services',
    'Climate adaptation strategies for coastal cities',
    'Geopolitical shifts in global supply chains post-2025',
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-[#0f1419]/40 backdrop-blur-xl border border-[#ff6b9d]/20 rounded-3xl p-10 shadow-2xl">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-[#e8eaf6] mb-3 tracking-tight">
            Create Foresight Radar
          </h2>
          <p className="text-[#9fa8da] text-lg leading-relaxed">
            Explore emerging signals across STEEP-G dimensions using high-trust sources and strategic foresight analysis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="query" className="block text-sm font-semibold text-[#e8eaf6] mb-3 uppercase tracking-wider">
              Research Question
            </label>
            <textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe the strategic question or domain you want to explore..."
              rows={4}
              className="w-full px-6 py-4 bg-[#1a1f3a]/50 border border-[#ff6b9d]/30 rounded-2xl text-[#e8eaf6] placeholder-[#9fa8da] focus:outline-none focus:border-[#ff6b9d]/50 focus:ring-2 focus:ring-[#ff6b9d]/20 transition-all resize-none text-lg"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!query.trim() || isSubmitting}
            className="w-full px-8 py-4 bg-gradient-to-r from-[#ff6b9d] to-[#a78bfa] text-white font-semibold rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg text-lg"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Analyzing Future Signals...
              </span>
            ) : (
              'Generate Radar'
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-[#ff6b9d]/20">
          <h3 className="text-sm font-semibold text-[#9fa8da] mb-4 uppercase tracking-wider">Example Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                disabled={isSubmitting}
                className="text-left px-5 py-3 bg-[#1a1f3a]/40 hover:bg-[#1a1f3a]/60 border border-[#ff6b9d]/30 hover:border-[#ff6b9d]/50 rounded-xl text-[#e8eaf6] text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 p-6 bg-[#ff6b9d]/5 border border-[#ff6b9d]/20 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-[#ff6b9d]/10 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#ff6b9d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-[#ff6b9d] font-semibold mb-2 text-sm">What to Expect</h4>
              <ul className="space-y-2 text-[#9fa8da] text-sm leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#ff6b9d] mt-1">•</span>
                  <span>Analysis scans 25+ high-trust sources across government, multilateral, and peer-reviewed research</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff6b9d] mt-1">•</span>
                  <span>Generates STEEP-G categorized signals with impact, likelihood, and confidence scores</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff6b9d] mt-1">•</span>
                  <span>Creates strategic scenarios and monitoring watchlists for decision-making</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff6b9d] mt-1">•</span>
                  <span>Processing typically takes 2-3 minutes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForesightRadarForm;
