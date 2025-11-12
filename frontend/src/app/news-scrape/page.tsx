'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { authUtils } from '@/utils/auth';
import { NewsScrapeQuery } from '@/types';
import StrategyAndHeader from '@/components/StrategyAndHeader';
import NewsScrapeForm from '@/components/NewsScrapeForm';
import NewsScrapeViewer from '@/components/NewsScrapeViewer';
import NewsScrapeCard from '@/components/NewsScrapeCard';
import NewsHorizonParticles from '@/components/NewsHorizonParticles';

function NewsScrapeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedQueryId = searchParams.get('queryId');

  const [scrapes, setScrapes] = useState<NewsScrapeQuery[]>([]);
  const [selectedScrape, setSelectedScrape] = useState<NewsScrapeQuery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewQuery, setShowNewQuery] = useState(false);

  // Check authentication with 1-day expiry
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push('/auth?redirect=news-scrape');
      return;
    }
    loadScrapes();
  }, [router]);

  useEffect(() => {
    if (selectedQueryId && scrapes.length > 0) {
      const scrape = scrapes.find(s => s.queryId === selectedQueryId);
      if (scrape) {
        setSelectedScrape(scrape);
        setShowNewQuery(false);
      }
    }
  }, [selectedQueryId, scrapes]);

  const loadScrapes = async () => {
    try {
      setIsLoading(true);
      const data = await apiService.listNewsScrapes();
      setScrapes(data);
    } catch (error) {
      console.error('Failed to load news scrapes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (query: string, timeline: string) => {
    try {
      const response = await apiService.submitNewsScrape({ query, timeline });
      await loadScrapes();
      setShowNewQuery(false);
      router.push(`/news-scrape?queryId=${response.queryId}`);
    } catch (error) {
      console.error('Failed to submit news scrape:', error);
    }
  };

  const handleSelectScrape = (scrape: NewsScrapeQuery) => {
    setSelectedScrape(scrape);
    setShowNewQuery(false);
    router.push(`/news-scrape?queryId=${scrape.queryId}`);
  };

  const handleRefresh = async () => {
    await loadScrapes();
    if (selectedScrape) {
      const updated = await apiService.getNewsScrapeStatus(selectedScrape.queryId);
      setSelectedScrape(updated);
    }
  };

  const handleDelete = async (queryId: string) => {
    try {
      await apiService.deleteNewsScrape(queryId);
      await loadScrapes();
      if (selectedScrape?.queryId === queryId) {
        setSelectedScrape(null);
        router.push('/news-scrape');
      }
    } catch (error) {
      console.error('Failed to delete news scrape:', error);
    }
  };

  const resetToMainView = () => {
    setSelectedScrape(null);
    setShowNewQuery(false);
    router.push('/news-scrape');
  };

  const renderContent = () => {
    if (showNewQuery) {
      return (
        <div className="max-w-2xl mx-auto">
          <NewsScrapeForm onSubmit={handleSubmit} />
        </div>
      );
    }

    if (selectedScrape) {
      return (
        <NewsScrapeViewer scrape={selectedScrape} onRefresh={handleRefresh} />
      );
    }

    // Main view - show empty state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full flex items-center justify-center mx-auto mb-6 opacity-20">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-100 mb-3">
            Select or Create a Query
          </h2>
          <p className="text-gray-400 max-w-md mx-auto mb-6">
            Submit a query to analyze news across geographic hierarchies with AI-powered insights and tag-based filtering.
          </p>
          <button
            onClick={() => setShowNewQuery(true)}
            className="px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Create New Query
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Hero Section - Always Visible */}
      <div className="px-8 py-8 border-b border-dark-300/40">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in">
            {/* Left Column - Content */}
            <div className="text-left">
              {/* Strategy& Logo */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-strategyand-accent rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-serif text-4xl font-bold">&</span>
                </div>
                <div>
                  <h1 className="text-2xl font-serif text-strategyand-off-white tracking-tight">News Horizon</h1>
                  <p className="text-sm text-strategyand-off-white/70">Ideation Center</p>
                </div>
              </div>

              {/* Main Headline */}
              <h2 className="font-serif text-5xl lg:text-6xl font-normal mb-6 text-strategyand-off-white leading-tight">
                Global news
                <br />
                <span className="text-strategyand-accent">intelligence</span>
              </h2>

              {/* Divider */}
              <div className="h-1 w-32 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red mb-6"></div>

              {/* Description */}
              <p className="text-lg text-strategyand-off-white/80 mb-8 leading-relaxed">
                Exhaustive news coverage across regions, countries, topics, and industries with AI-powered tag-based filtering and real-time intelligence tracking.
              </p>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-strategyand-accent font-serif text-3xl mb-2">Global</div>
                  <div className="text-xs text-strategyand-off-white/60">
                    Geographic reach
                  </div>
                </div>
                <div>
                  <div className="text-strategyand-accent font-serif text-3xl mb-2">AI Tags</div>
                  <div className="text-xs text-strategyand-off-white/60">
                    Smart filtering
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

            {/* Right Column - News Horizon Animation */}
            <div className="relative h-96 lg:h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <NewsHorizonParticles />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Floating AI Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-64 w-24 h-24 bg-gradient-to-r from-gradient-from/15 to-gradient-via/15 rounded-full animate-float blur-xl"></div>
          <div className="absolute top-64 right-32 w-32 h-32 bg-gradient-to-r from-gradient-via/15 to-gradient-to/15 rounded-full animate-float animation-delay-1500 blur-xl"></div>
          <div className="absolute bottom-40 left-32 w-28 h-28 bg-gradient-to-r from-gradient-to/15 to-gradient-from/15 rounded-full animate-float animation-delay-3000 blur-xl"></div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-dark-700/50 backdrop-blur-lg border-r border-dark-300/40 flex flex-col relative z-20">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-dark-300/40">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-100">News Horizon</h2>
                <p className="text-sm text-gray-400">Global Intelligence Tracking</p>
              </div>
            </div>

            <button
              onClick={() => setShowNewQuery(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Query
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2 mb-4">
              <button
                onClick={resetToMainView}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  !selectedScrape && !showNewQuery
                    ? 'bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 text-white'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-dark-600/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                  All Queries
                </div>
              </button>
            </div>

            {/* Recent Queries List */}
            <div className="border-t border-dark-300/40 pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">
                Recent Queries ({scrapes.length})
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-dark-500 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : scrapes.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8 px-4">
                  No queries yet. Create your first query to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {scrapes.map(scrape => (
                    <NewsScrapeCard
                      key={scrape.queryId}
                      scrape={scrape}
                      isSelected={selectedScrape?.queryId === scrape.queryId}
                      onClick={() => handleSelectScrape(scrape)}
                      onDelete={() => handleDelete(scrape.queryId)}
                    />
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-dark-300/40">
            <button
              onClick={() => {
                localStorage.removeItem('policy-drafter-auth');
                router.push('/');
              }}
              className="w-full text-left px-4 py-3 text-gray-400 hover:text-gray-300 rounded-lg transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header with Strategy& Branding */}
          <header className="bg-dark-700/30 backdrop-blur-lg border-b border-dark-300/40 px-8 py-6 relative z-20">
            <StrategyAndHeader
              title="News Horizon"
              subtitle="Global news intelligence across geographic hierarchies with AI-powered tag-based filtering"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-6">
                {selectedScrape && (
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span className="text-gray-500">/</span>
                    <span className="font-mono text-xs bg-dark-600/80 px-2 py-1 rounded">{selectedScrape.queryId}</span>
                  </div>
                )}
              </div>
              {(selectedScrape || showNewQuery) && (
                <button
                  onClick={resetToMainView}
                  className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                >
                  ← Back to All Queries
                </button>
              )}
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
    </div>
  );
}

export default function NewsScrapePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gradient-from border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading News Horizon...</p>
        </div>
      </div>
    }>
      <NewsScrapeContent />
    </Suspense>
  );
}
