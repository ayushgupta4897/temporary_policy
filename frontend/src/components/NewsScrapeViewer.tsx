'use client';

import { NewsScrapeQuery } from '@/types';
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import NewsCitationCard from './NewsCitationCard';
import LoadingSkeleton from './LoadingSkeleton';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import { NEWS_SCRAPE_THEME } from '@/config/theme';

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
            {/* Sort and Search Bar */}
            <div className="flex items-center gap-4 mb-4 p-4 bg-dark-600/40 rounded-xl border border-dark-400/40">
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-strategyand-accent/50 transition-all duration-[280ms]"
                >
                  <option value="date">Date (Newest First)</option>
                  <option value="relevance">Relevance Score</option>
                  <option value="trust">Trust Score</option>
                  <option value="sentiment">Sentiment Score</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">Search:</label>
                <input
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                  placeholder="Title, summary, publisher..."
                  className="flex-1 px-3 py-2 bg-dark-700 border border-dark-400 rounded-lg text-gray-300 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-strategyand-accent/50 transition-all duration-[280ms]"
                />
                {filterKeyword && (
                  <button
                    onClick={() => setFilterKeyword('')}
                    className="px-2 py-1 text-gray-400 hover:text-gray-300 transition-colors duration-[280ms]"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Tag-based Filter Section */}
            <div className="mb-6 p-4 bg-dark-600/40 rounded-xl border border-dark-400/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-300">Filter by Tags</h3>
                {(selectedRegions.length > 0 || selectedCountries.length > 0 || selectedTopics.length > 0 || selectedIndustries.length > 0) && (
                  <button
                    onClick={() => {
                      setSelectedRegions([]);
                      setSelectedCountries([]);
                      setSelectedTopics([]);
                      setSelectedIndustries([]);
                    }}
                    className="text-xs text-strategyand-accent hover:text-strategyand-accent/80 transition-colors duration-[280ms]"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>

              {/* Region Tags */}
              {allRegions.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Region</label>
                  <div className="flex flex-wrap gap-2">
                    {allRegions.map(region => {
                      const isActive = selectedRegions.includes(region);
                      const filterTag = NEWS_SCRAPE_THEME.FILTER_TAGS;
                      const style = isActive ? filterTag.ACTIVE : filterTag.INACTIVE;
                      return (
                        <button
                          key={region}
                          onClick={() => {
                            if (isActive) {
                              setSelectedRegions(selectedRegions.filter(r => r !== region));
                            } else {
                              setSelectedRegions([...selectedRegions, region]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-[280ms] ${style.bg} ${style.text} ${style.border} ${isActive ? style.hoverBg : `${style.hoverBg} ${style.hoverText || ''}`}`}
                        >
                          {region}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Country Tags */}
              {allCountries.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Country</label>
                  <div className="flex flex-wrap gap-2">
                    {allCountries.map(country => {
                      const isActive = selectedCountries.includes(country);
                      const filterTag = NEWS_SCRAPE_THEME.FILTER_TAGS;
                      const style = isActive ? filterTag.ACTIVE : filterTag.INACTIVE;
                      return (
                        <button
                          key={country}
                          onClick={() => {
                            if (isActive) {
                              setSelectedCountries(selectedCountries.filter(c => c !== country));
                            } else {
                              setSelectedCountries([...selectedCountries, country]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-[280ms] ${style.bg} ${style.text} ${style.border} ${isActive ? style.hoverBg : `${style.hoverBg} ${style.hoverText || ''}`}`}
                        >
                          {country}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Topics Tags */}
              {allTopics.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Topics</label>
                  <div className="flex flex-wrap gap-2">
                    {allTopics.map(topic => {
                      const isActive = selectedTopics.includes(topic);
                      const filterTag = NEWS_SCRAPE_THEME.FILTER_TAGS;
                      const style = isActive ? filterTag.ACTIVE : filterTag.INACTIVE;
                      return (
                        <button
                          key={topic}
                          onClick={() => {
                            if (isActive) {
                              setSelectedTopics(selectedTopics.filter(t => t !== topic));
                            } else {
                              setSelectedTopics([...selectedTopics, topic]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-[280ms] ${style.bg} ${style.text} ${style.border} ${isActive ? style.hoverBg : `${style.hoverBg} ${style.hoverText || ''}`}`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Industry Tags */}
              {allIndustries.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-2 block">Industry</label>
                  <div className="flex flex-wrap gap-2">
                    {allIndustries.map(industry => {
                      const isActive = selectedIndustries.includes(industry);
                      const filterTag = NEWS_SCRAPE_THEME.FILTER_TAGS;
                      const style = isActive ? filterTag.ACTIVE : filterTag.INACTIVE;
                      return (
                        <button
                          key={industry}
                          onClick={() => {
                            if (isActive) {
                              setSelectedIndustries(selectedIndustries.filter(i => i !== industry));
                            } else {
                              setSelectedIndustries([...selectedIndustries, industry]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-[280ms] ${style.bg} ${style.text} ${style.border} ${isActive ? style.hoverBg : `${style.hoverBg} ${style.hoverText || ''}`}`}
                        >
                          {industry}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Active Filter Summary */}
            {(selectedRegions.length > 0 || selectedCountries.length > 0 || selectedTopics.length > 0 || selectedIndustries.length > 0) && (
              <div className="mb-4 p-3 bg-dark-600/40 rounded-lg border border-strategyand-accent/30 flex items-center justify-between">
                <div className="flex flex-wrap gap-2 flex-1">
                  <span className="text-xs text-gray-400 mr-2">Active filters:</span>
                  {selectedRegions.map(r => {
                    const tags = NEWS_SCRAPE_THEME.TAG_COLORS.REGION;
                    return (
                      <span key={r} className={`px-2 py-1 ${tags.bg} ${tags.text} border ${tags.border} rounded text-xs flex items-center gap-1`}>
                        {r}
                        <button onClick={() => setSelectedRegions(selectedRegions.filter(x => x !== r))} className="hover:text-white">×</button>
                      </span>
                    );
                  })}
                  {selectedCountries.map(c => {
                    const tags = NEWS_SCRAPE_THEME.TAG_COLORS.COUNTRY;
                    return (
                      <span key={c} className={`px-2 py-1 ${tags.bg} ${tags.text} border ${tags.border} rounded text-xs flex items-center gap-1`}>
                        {c}
                        <button onClick={() => setSelectedCountries(selectedCountries.filter(x => x !== c))} className="hover:text-white">×</button>
                      </span>
                    );
                  })}
                  {selectedTopics.map(t => {
                    const tags = NEWS_SCRAPE_THEME.TAG_COLORS.TOPICS;
                    return (
                      <span key={t} className={`px-2 py-1 ${tags.bg} ${tags.text} border ${tags.border} rounded text-xs flex items-center gap-1`}>
                        {t}
                        <button onClick={() => setSelectedTopics(selectedTopics.filter(x => x !== t))} className="hover:text-white">×</button>
                      </span>
                    );
                  })}
                  {selectedIndustries.map(i => {
                    const tags = NEWS_SCRAPE_THEME.TAG_COLORS.INDUSTRY;
                    return (
                      <span key={i} className={`px-2 py-1 ${tags.bg} ${tags.text} border ${tags.border} rounded text-xs flex items-center gap-1`}>
                        {i}
                        <button onClick={() => setSelectedIndustries(selectedIndustries.filter(x => x !== i))} className="hover:text-white">×</button>
                      </span>
                    );
                  })}
                </div>
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