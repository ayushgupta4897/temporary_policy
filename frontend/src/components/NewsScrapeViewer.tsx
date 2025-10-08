'use client';

import { NewsScrapeQuery } from '@/types';
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import NewsCitationCard from './NewsCitationCard';
import LoadingSkeleton from './LoadingSkeleton';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';

interface NewsScrapeViewerProps {
  scrape: NewsScrapeQuery;
  onRefresh: () => void;
}

export default function NewsScrapeViewer({ scrape, onRefresh }: NewsScrapeViewerProps) {
  const [citations, setCitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'citations' | 'analytics'>('citations');
  const [sortBy, setSortBy] = useState<'date' | 'relevance' | 'trust' | 'sentiment'>('date');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  useEffect(() => {
    loadCitations();
  }, [scrape.queryId]);

  const loadCitations = async () => {
    setIsLoading(true);
    const response = await apiService.getNewsScrapeContent(scrape.queryId, 'citations');
    if (response && response.content) {
      const parsed = JSON.parse(response.content);
      setCitations(parsed.citations || []);
    }
    setIsLoading(false);
  };

  // Extract unique tags from all citations
  const allRegions = Array.from(new Set(citations.flatMap(c => {
    const region = c.region;
    return Array.isArray(region) ? region : region ? [region] : [];
  }))).sort();
  const allCountries = Array.from(new Set(citations.flatMap(c => {
    const country = c.country;
    return Array.isArray(country) ? country : country ? [country] : [];
  }))).sort();
  const allTopics = Array.from(new Set(citations.flatMap(c => c.topics || []))).sort();
  const allIndustries = Array.from(new Set(citations.flatMap(c => c.industry || []))).sort();

  const sortedAndFiltered = citations
    .filter(c => {
      if (filterKeyword) {
        const keyword = filterKeyword.toLowerCase();
        const matchesKeyword = c.title?.toLowerCase().includes(keyword) ||
               c.summary?.toLowerCase().includes(keyword) ||
               c.publisher?.toLowerCase().includes(keyword);
        if (!matchesKeyword) return false;
      }

      if (selectedRegions.length > 0) {
        const regions = Array.isArray(c.region) ? c.region : c.region ? [c.region] : [];
        const hasRegion = regions.some((r: string) => selectedRegions.includes(r));
        if (!hasRegion) return false;
      }

      if (selectedCountries.length > 0) {
        const countries = Array.isArray(c.country) ? c.country : c.country ? [c.country] : [];
        const hasCountry = countries.some((co: string) => selectedCountries.includes(co));
        if (!hasCountry) return false;
      }

      if (selectedTopics.length > 0) {
        const hasTopic = c.topics?.some((t: string) => selectedTopics.includes(t));
        if (!hasTopic) return false;
      }

      if (selectedIndustries.length > 0) {
        const hasIndustry = c.industry?.some((i: string) => selectedIndustries.includes(i));
        if (!hasIndustry) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // Sort by date field if available, otherwise fall back to year
          const dateA = a.date ? new Date(a.date).getTime() : (a.year ? new Date(a.year).getTime() : 0);
          const dateB = b.date ? new Date(b.date).getTime() : (b.year ? new Date(b.year).getTime() : 0);
          return dateB - dateA;
        case 'relevance':
          return (b.relevance_score || 0) - (a.relevance_score || 0);
        case 'trust':
          return (b.trust_score || 0) - (a.trust_score || 0);
        case 'sentiment':
          return (b.sentiment_score || 0) - (a.sentiment_score || 0);
        default:
          return 0;
      }
    });

  if (scrape.status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-status-warning border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Processing News Horizon</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Collecting news from 40 targeted sources and enriching with AI analysis...
          </p>
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  if (scrape.status === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Query Failed</h2>
          <p className="text-gray-400">{scrape.errorMessage || 'An error occurred'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              {scrape.query}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {scrape.status === 'done' && activeTab === 'citations' && `${sortedAndFiltered.length} of ${citations.length} citations`}
            </p>
          </div>

          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-dark-400/40">
          <button
            onClick={() => setActiveTab('citations')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'citations'
                ? 'border-gradient-from text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Citations
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'analytics'
                ? 'border-gradient-from text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Analytics
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <AnalyticsDashboard queryId={scrape.queryId} />
        ) : (
          <>

        {scrape.status === 'done' && citations.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-4 p-4 bg-dark-600/40 rounded-xl border border-dark-400/40">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-400">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gradient-from/50"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="relevance">Relevance Score</option>
                  <option value="trust">Trust Score</option>
                  <option value="sentiment">Sentiment Score</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-400">Search:</label>
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="Title, summary, publisher..."
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gradient-from/50"
                />
                {filterKeyword && (
                  <button
                    onClick={() => setFilterKeyword('')}
                    className="px-2 py-1 text-gray-400 hover:text-gray-300 text-lg"
                    title="Clear filter"
                  >
                    ✗
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-dark-600/40 rounded-xl border border-dark-400/40">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Region</label>
                <select
                  multiple
                  value={selectedRegions}
                  onChange={(e) => setSelectedRegions(Array.from(e.target.selectedOptions, opt => opt.value))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gradient-from/50 min-h-[100px]"
                >
                  {allRegions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Country</label>
                <select
                  multiple
                  value={selectedCountries}
                  onChange={(e) => setSelectedCountries(Array.from(e.target.selectedOptions, opt => opt.value))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gradient-from/50 min-h-[100px]"
                >
                  {allCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Topics</label>
                <select
                  multiple
                  value={selectedTopics}
                  onChange={(e) => setSelectedTopics(Array.from(e.target.selectedOptions, opt => opt.value))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gradient-from/50 min-h-[100px]"
                >
                  {allTopics.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Industry</label>
                <select
                  multiple
                  value={selectedIndustries}
                  onChange={(e) => setSelectedIndustries(Array.from(e.target.selectedOptions, opt => opt.value))}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gradient-from/50 min-h-[100px]"
                >
                  {allIndustries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
            </div>

            {(selectedRegions.length > 0 || selectedCountries.length > 0 || selectedTopics.length > 0 || selectedIndustries.length > 0) && (
              <div className="mb-4 p-3 bg-dark-600/40 rounded-lg border border-dark-400/40 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {selectedRegions.map(r => (
                    <span key={r} className="px-2 py-1 bg-gradient-from/20 text-gradient-from rounded text-xs">
                      {r}
                    </span>
                  ))}
                  {selectedCountries.map(c => (
                    <span key={c} className="px-2 py-1 bg-gradient-via/20 text-gradient-via rounded text-xs">
                      {c}
                    </span>
                  ))}
                  {selectedTopics.map(t => (
                    <span key={t} className="px-2 py-1 bg-gradient-to/20 text-gradient-to rounded text-xs">
                      {t}
                    </span>
                  ))}
                  {selectedIndustries.map(i => (
                    <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                      {i}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSelectedRegions([]);
                    setSelectedCountries([]);
                    setSelectedTopics([]);
                    setSelectedIndustries([]);
                  }}
                  className="text-sm text-gray-400 hover:text-gray-300 underline"
                >
                  Clear All
                </button>
              </div>
            )}
          </>
        )}

        {isLoading ? (
          <LoadingSkeleton />
        ) : scrape.status === 'done' && sortedAndFiltered.length > 0 ? (
          <div className="space-y-4">
            {sortedAndFiltered.map((citation, idx) => (
              <NewsCitationCard key={idx} citation={citation} />
            ))}
          </div>
        ) : scrape.status === 'done' && citations.length > 0 ? (
          <p className="text-gray-400 text-center py-8">No citations match your filter</p>
        ) : (
          <p className="text-gray-400 text-center py-8">No citations found</p>
        )}
          </>
        )}
      </div>
    </div>
  );
}