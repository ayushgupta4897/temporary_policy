'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Query } from '@/types';
import { apiService } from '@/services/api';
import { authUtils } from '@/utils/auth';
import SidebarNav from '@/components/SidebarNav';
import StrategyAndHeader from '@/components/StrategyAndHeader';
import QueryCard from '@/components/QueryCard';
import QueryForm from '@/components/QueryForm';
import QueryStatus from '@/components/QueryStatus';
import ReportsViewer from '@/components/ReportsViewer';
import AIParticleField from '@/components/AIParticleField';

export default function Dashboard() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [filteredQueries, setFilteredQueries] = useState<Query[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const router = useRouter();
  
  // Function to reset to main view
  const resetToMainView = () => {
    setSelectedQuery(null);
    setShowNewAnalysis(false);
  };

  useEffect(() => {
    // Check authentication with 1-day expiry
    if (!authUtils.isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadQueries();
  }, [router]);

  // Apply filters whenever queries or filters change
  useEffect(() => {
    let filtered = [...queries];
    
    // Theme filter - simple keyword matching
    if (themeFilter !== 'all') {
      filtered = filtered.filter(q => 
        q.query.toLowerCase().includes(themeFilter.toLowerCase())
      );
    }
    
    // Country filter - simple keyword matching
    if (countryFilter !== 'all') {
      filtered = filtered.filter(q => 
        q.query.toLowerCase().includes(countryFilter.toLowerCase())
      );
    }
    
    setFilteredQueries(filtered);
  }, [queries, themeFilter, countryFilter]);

  const loadQueries = async () => {
    try {
      const queriesList = await apiService.listQueries();
      // Filter out graph queries - only show policy queries
      const policyQueries = queriesList.filter(q => 
        q.queryType !== 'graph'
      );
      setQueries(policyQueries);
    } catch (error) {
      console.error('Failed to load queries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySubmit = async (queryText: string, analysisMode: 'full' | 'research_only') => {
    try {
      const response = await apiService.submitQuery(queryText, analysisMode);
      await loadQueries();
      
      const newQueries = await apiService.listQueries();
      // Filter out graph queries
      const policyQueries = newQueries.filter(q => q.queryType !== 'graph');
      const newQuery = policyQueries.find(q => q.queryId === response.queryId);
      if (newQuery) {
        setSelectedQuery(newQuery);
        setShowNewAnalysis(false);
      }
    } catch (error) {
      console.error('Failed to submit query:', error);
    }
  };

  const refreshSelectedQuery = async () => {
    if (!selectedQuery) return;
    
    try {
      const updatedQuery = await apiService.getQueryStatus(selectedQuery.queryId);
      setSelectedQuery(updatedQuery);
      setQueries(prev => prev.map(q => 
        q.queryId === updatedQuery.queryId ? updatedQuery : q
      ));
    } catch (error) {
      console.error('Failed to refresh query:', error);
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;
    
    try {
      await apiService.deleteQuery(queryId);
      setQueries(prev => prev.filter(q => q.queryId !== queryId));
      if (selectedQuery?.queryId === queryId) {
        setSelectedQuery(null);
      }
    } catch (error) {
      console.error('Failed to delete query:', error);
    }
  };

  const renderContent = () => {
    if (showNewAnalysis) {
      return <QueryForm onSubmit={handleQuerySubmit} />;
    }

    if (selectedQuery) {
      switch (selectedQuery.status) {
        case 'processing':
          return <QueryStatus query={selectedQuery} onRefresh={refreshSelectedQuery} />;
        case 'done':
          return <ReportsViewer query={selectedQuery} />;
        case 'failed':
          return (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="w-20 h-20 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Processing Failed</h2>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  {selectedQuery.errorMessage || 'An error occurred while processing your policy query.'}
                </p>
                <button 
                  onClick={() => {
                    setSelectedQuery(null);
                    setShowNewAnalysis(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create New Analysis
                </button>
              </div>
            </div>
          );
        default:
          return null;
      }
    }

    // Main dashboard view with query cards
    return (
      <div className="space-y-8">
        {/* Hero Section - Always Visible */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12 animate-fade-in">
          {/* Left Column - Content */}
          <div className="text-left">
            {/* Strategy& Logo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-strategyand-accent rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-serif text-4xl font-bold">&</span>
              </div>
              <div>
                <h1 className="text-2xl font-serif text-strategyand-off-white tracking-tight">Policy Bot</h1>
                <p className="text-sm text-strategyand-off-white/70">Ideation Center</p>
              </div>
            </div>

            {/* Main Headline */}
            <h2 className="font-serif text-5xl lg:text-6xl font-normal mb-6 text-strategyand-off-white leading-tight">
              Evidence-driven policy
              <br />
              <span className="text-strategyand-accent">in minutes</span>
            </h2>

            {/* Divider */}
            <div className="h-1 w-32 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red mb-6"></div>

            {/* Description */}
            <p className="text-lg text-strategyand-off-white/80 mb-8 leading-relaxed">
              Transform policy ideas into implementation-ready strategies. Powered by AI, backed by global evidence from 30+ source tiers, designed for strategic decision-making.
            </p>

            {/* CTA */}
            <button
              onClick={() => setShowNewAnalysis(true)}
              className="bg-strategyand-accent hover:opacity-90 text-white px-10 py-4 rounded-lg text-base font-medium transition-opacity shadow-lg hover:shadow-xl inline-flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Start new analysis
            </button>

            {/* Value Props */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div>
                <div className="text-strategyand-accent font-serif text-3xl mb-2">7-Stage</div>
                <div className="text-xs text-strategyand-off-white/60">
                  Research pipeline
                </div>
              </div>
              <div>
                <div className="text-strategyand-accent font-serif text-3xl mb-2">30+ Tiers</div>
                <div className="text-xs text-strategyand-off-white/60">
                  Evidence sources
                </div>
              </div>
              <div>
                <div className="text-strategyand-accent font-serif text-3xl mb-2">Real-time</div>
                <div className="text-xs text-strategyand-off-white/60">
                  Live tracking
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - AI Particle Animation */}
          <div className="relative h-96 lg:h-[500px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <AIParticleField />
            </div>
          </div>
        </div>

        {/* Strategy& Header */}
        <StrategyAndHeader
          title="Policy Bot"
          subtitle="AI-powered policy research, benchmarking and implementation planning for smarter policy decisions"
        />

        {/* Filters Section */}
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-serif font-normal text-neutral-50">Recent Analyses</h3>
          
          <div className="flex items-center gap-4">
            {/* Theme Filter */}
            <select 
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-gray-300 text-sm focus:ring-2 focus:ring-gradient-from focus:border-gradient-from"
            >
              <option value="all">All Themes</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="economic">Economic</option>
              <option value="social">Social</option>
              <option value="environment">Environment</option>
              <option value="technology">Technology</option>
              <option value="governance">Governance</option>
              <option value="visa">Visa & Immigration</option>
            </select>

            {/* Country Filter */}
            <select 
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-4 py-2 bg-dark-600 border border-dark-400 rounded-lg text-gray-300 text-sm focus:ring-2 focus:ring-gradient-from focus:border-gradient-from"
            >
              <option value="all">All Countries</option>
              <option value="saudi">Saudi Arabia</option>
              <option value="uae">UAE</option>
              <option value="qatar">Qatar</option>
              <option value="kuwait">Kuwait</option>
              <option value="bahrain">Bahrain</option>
              <option value="oman">Oman</option>
              <option value="usa">USA</option>
              <option value="uk">UK</option>
              <option value="singapore">Singapore</option>
              <option value="canada">Canada</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={loadQueries}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-500 border border-dark-400 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-dark-400 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-dark-400 rounded w-1/2 mb-4"></div>
                <div className="h-16 bg-dark-400 rounded mb-4"></div>
                <div className="flex gap-4">
                  <div className="h-3 bg-dark-400 rounded w-20"></div>
                  <div className="h-3 bg-dark-400 rounded w-20"></div>
                  <div className="h-3 bg-dark-400 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-dark-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No analyses found</h3>
            <p className="text-gray-400 mb-6">
              {themeFilter !== 'all' || countryFilter !== 'all' 
                ? 'No analyses match your filters. Try adjusting them.'
                : 'Start your first policy analysis to see results here.'}
            </p>
            {(themeFilter !== 'all' || countryFilter !== 'all') && (
              <button
                onClick={() => {
                  setThemeFilter('all');
                  setCountryFilter('all');
                }}
                className="text-gradient-from hover:underline text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredQueries.map((query) => (
              <QueryCard 
                key={query.queryId}
                query={query}
                onSelect={setSelectedQuery}
                onDelete={handleDeleteQuery}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Floating AI Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-64 w-24 h-24 bg-gradient-to-r from-gradient-from/15 to-gradient-via/15 rounded-full animate-float blur-xl"></div>
        <div className="absolute top-64 right-32 w-32 h-32 bg-gradient-to-r from-gradient-via/15 to-gradient-to/15 rounded-full animate-float animation-delay-1500 blur-xl"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-gradient-to-r from-gradient-to/15 to-gradient-from/15 rounded-full animate-float animation-delay-3000 blur-xl"></div>
      </div>
      {/* Sidebar */}
      <SidebarNav 
        onNewAnalysis={() => setShowNewAnalysis(true)}
        onHomeClick={resetToMainView}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-dark-700/30 backdrop-blur-lg border-b border-dark-300/40 px-8 py-4 relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-xl font-semibold text-gray-100">Policy Intelligence Suite</h2>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  localStorage.removeItem('policy-drafter-auth');
                  router.push('/');
                }}
                className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-dark-600/50"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}