'use client';

import { useState } from 'react';

interface NewsScrapeFormProps {
  onSubmit: (query: string, timeline: string) => void;
}

const TIMELINE_OPTIONS = [
  { value: 'last_1_month', label: 'Last 1 Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_1_year', label: 'Last 1 Year' },
  { value: 'last_2_years', label: 'Last 2 Years' },
  { value: 'last_3_years', label: 'Last 3 Years' }
];

export default function NewsScrapeForm({ onSubmit }: NewsScrapeFormProps) {
  const [query, setQuery] = useState('');
  const [timeline, setTimeline] = useState('last_6_months');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(query.trim(), timeline);
      setQuery('');
      setTimeline('last_6_months');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neural-card p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        New Horizon
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-300 mb-2">
            Query
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Energy localization in Middle East"
            rows={4}
            className="w-full bg-dark-600 border border-dark-400 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from/50 focus:border-gradient-from transition-all"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium text-gray-300 mb-2">
            Timeline
          </label>
          <select
            id="timeline"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full bg-dark-600 border border-dark-400 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gradient-from/50 focus:border-gradient-from transition-all"
            disabled={isSubmitting}
          >
            {TIMELINE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isSubmitting}
          className="w-full px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Start Scrape'}
        </button>
      </form>
    </div>
  );
}

