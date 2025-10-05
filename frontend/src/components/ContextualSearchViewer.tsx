'use client';

import { useState, useEffect } from 'react';
import { ContextualSearchQuery, SearchResults, Citation, SourceTierAnalysis } from '@/types';
import { apiService } from '@/services/api';
import CitationTile from '@/components/CitationTile';
import SourceTierTabs from '@/components/SourceTierTabs';

interface ContextualSearchViewerProps {
  search: ContextualSearchQuery;
  onRefresh: () => void;
}

export default function ContextualSearchViewer({ search, onRefresh }: ContextualSearchViewerProps) {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [tierAnalysis, setTierAnalysis] = useState<SourceTierAnalysis | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [filteredCitations, setFilteredCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'citations' | 'download'>('overview');

  useEffect(() => {
    if (search.status === 'done') {
      loadSearchResults();
    } else {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    // Filter citations based on selected tier
    if (selectedTier === 'all') {
      setFilteredCitations(citations);
    } else {
      setFilteredCitations(citations.filter(c => c.source_tier === selectedTier));
    }
  }, [citations, selectedTier]);

  const loadSearchResults = async () => {
    try {
      setIsLoading(true);

      // Load results and citations
      const [resultsResponse, citationsResponse, tierAnalysisResponse] = await Promise.all([
        apiService.getContextualSearchContent(search.queryId, 'results'),
        apiService.getContextualSearchContent(search.queryId, 'citations'),
        apiService.getContextualSearchContent(search.queryId, 'tier_analysis')
      ]);

      if (resultsResponse?.content) {
        const parsedResults = JSON.parse(resultsResponse.content);
        setResults(parsedResults);
      }

      if (citationsResponse?.content) {
        const parsedCitations = JSON.parse(citationsResponse.content);
        setCitations(parsedCitations.citations || []);
      }

      if (tierAnalysisResponse?.content) {
        const parsedTierAnalysis = JSON.parse(tierAnalysisResponse.content);
        setTierAnalysis(parsedTierAnalysis);
      }

    } catch (error) {
      console.error('Failed to load search results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = [
      'Title',
      'URL',
      'Publisher',
      'Year',
      'DOI',
      'Source Tier',
      'Source Type',
      'Key Quote',
      'Summary'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredCitations.map(citation => [
        `"${(citation.title || '').replace(/"/g, '""')}"`,
        `"${citation.url || ''}"`,
        `"${(citation.publisher || '').replace(/"/g, '""')}"`,
        citation.year || '',
        `"${citation.doi || ''}"`,
        `"${(citation.source_tier || '').replace(/_/g, ' ')}"`,
        `"${(citation.source_type || '').replace(/"/g, '""')}"`,
        `"${(citation.key_quote || '').replace(/"/g, '""')}"`,
        `"${(citation.summary || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `contextual-search-${search.queryId.split('-')[0]}-${selectedTier}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (search.status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-status-warning border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Processing Search</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Extracting evidence across 30 source tiers with optimized parallel processing...
          </p>
          <button
            onClick={onRefresh}
            className="px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  if (search.status === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Search Failed</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {search.errorMessage || 'An error occurred while processing your contextual search.'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-dark-500 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-dark-500 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-dark-500 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-dark-500 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent">
            {search.displayTitle || 'Search Results'}
          </span>
        </h1>
        <p className="text-gray-400 text-lg mb-6">{search.query}</p>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="bg-dark-600/30 rounded-xl p-6 border border-dark-400/30">
            <div className="text-3xl font-bold text-gradient-from mb-2">
              {search.uniqueCitations || citations.length}
            </div>
            <div className="text-sm text-gray-400">Unique Citations</div>
          </div>
          <div className="bg-dark-600/30 rounded-xl p-6 border border-dark-400/30">
            <div className="text-3xl font-bold text-gradient-via mb-2">
              {search.sourceTiersCovered || tierAnalysis?.tier_coverage || 0}
            </div>
            <div className="text-sm text-gray-400">Source Tiers</div>
          </div>
          <div className="bg-dark-600/30 rounded-xl p-6 border border-dark-400/30">
            <div className="text-3xl font-bold text-gradient-to mb-2">
              {search.totalSearches || 30}
            </div>
            <div className="text-sm text-gray-400">Total Searches</div>
          </div>
          <div className="bg-dark-600/30 rounded-xl p-6 border border-dark-400/30">
            <div className="text-3xl font-bold text-gray-300 mb-2">
              {search.durationMinutes || 0}m
            </div>
            <div className="text-sm text-gray-400">Duration</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-dark-400/30">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'citations', label: 'Citations', icon: '📚' },
            { id: 'download', label: 'Export', icon: '💾' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-gradient-from text-gradient-from'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && results && (
        <div className="space-y-8">
          {/* Search Metadata */}
          <div className="neural-card p-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Search Overview</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Coverage Analysis</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Unique Sources: {results.search_metadata?.unique_sources || 0}</li>
                  <li>• Year Range: {results.search_metadata?.year_range?.earliest || 'N/A'} - {results.search_metadata?.year_range?.latest || 'N/A'}</li>
                  <li>• Time Span: {results.search_metadata?.year_range?.span || 0} years</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Top Source Types</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  {results.search_metadata?.source_types && Object.entries(results.search_metadata.source_types)
                    .slice(0, 4)
                    .map(([type, count]) => (
                      <li key={type}>• {type.replace(/_/g, ' ')}: {count}</li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Top Citations Preview */}
          <div>
            <h3 className="text-xl font-semibold text-gray-100 mb-6">Top Citations</h3>
            <div className="grid gap-4">
              {citations.slice(0, 5).map((citation, index) => (
                <CitationTile key={index} citation={citation} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setActiveTab('citations')}
                className="px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                View All Citations
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'citations' && (
        <div className="space-y-6">
          {/* Source Tier Filter */}
          <SourceTierTabs
            tierAnalysis={tierAnalysis}
            selectedTier={selectedTier}
            onTierSelect={setSelectedTier}
          />

          {/* Citation Count */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-100">
              {selectedTier === 'all' 
                ? `All Citations (${filteredCitations.length})`
                : `${selectedTier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${filteredCitations.length})`
              }
            </h3>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-dark-600 text-gray-300 rounded-lg hover:bg-dark-500 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Download CSV
            </button>
          </div>

          {/* Citations Grid */}
          {filteredCitations.length > 0 ? (
            <div className="grid gap-4">
              {filteredCitations.map((citation, index) => (
                <CitationTile key={index} citation={citation} showSourceTier={selectedTier === 'all'} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">No citations found for this source tier.</div>
              <button
                onClick={() => setSelectedTier('all')}
                className="text-gradient-from hover:underline"
              >
                View all citations
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'download' && (
        <div className="neural-card p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-100 mb-2">Export Search Results</h3>
            <p className="text-gray-400">Download your contextual search results in CSV format</p>
          </div>

          <div className="space-y-4 max-w-md mx-auto">
            <button
              onClick={() => {
                setSelectedTier('all');
                handleDownloadCSV();
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Download All Citations ({citations.length} items)
            </button>

            {tierAnalysis && Object.entries(tierAnalysis.tier_distribution).slice(0, 5).map(([tier, count]) => (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier);
                  setTimeout(handleDownloadCSV, 100);
                }}
                className="w-full px-6 py-3 bg-dark-600 text-gray-300 rounded-lg hover:bg-dark-500 transition-colors"
              >
                Download {tier.replace(/_/g, ' ')} ({count} items)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
