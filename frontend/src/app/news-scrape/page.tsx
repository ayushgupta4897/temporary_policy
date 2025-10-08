'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { NewsScrapeQuery } from '@/types';
import NewsScrapeForm from '@/components/NewsScrapeForm';
import NewsScrapeViewer from '@/components/NewsScrapeViewer';
import NewsScrapeCard from '@/components/NewsScrapeCard';

function NewsScrapeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedQueryId = searchParams.get('queryId');

  const [scrapes, setScrapes] = useState<NewsScrapeQuery[]>([]);
  const [selectedScrape, setSelectedScrape] = useState<NewsScrapeQuery | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScrapes();
  }, []);

  useEffect(() => {
    if (selectedQueryId && scrapes.length > 0) {
      const scrape = scrapes.find(s => s.queryId === selectedQueryId);
      if (scrape) {
        setSelectedScrape(scrape);
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
      router.push(`/news-scrape?queryId=${response.queryId}`);
    } catch (error) {
      console.error('Failed to submit news scrape:', error);
    }
  };

  const handleSelectScrape = (scrape: NewsScrapeQuery) => {
    setSelectedScrape(scrape);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900">
      <div className="max-w-[1800px] mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-center">
            <span style={{
              display: 'inline-block',
              background: 'linear-gradient(to right, #A32020, #D93954, #D93954)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              paddingLeft: '4px',
              paddingRight: '4px'
            }}>
              News Horizon
            </span>
          </h1>
          <p className="text-gray-400 text-center text-lg">
            Exhaustive news intelligence across geographic hierarchies
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <NewsScrapeForm onSubmit={handleSubmit} />
            
            <div className="neural-card p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Recent Queries ({scrapes.length})
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-dark-500 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : scrapes.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No queries yet. Submit your first query above.
                </p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
          </div>

          <div className="lg:col-span-2">
            {!selectedScrape ? (
              <div className="neural-card p-16 text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-gradient-from to-gradient-to rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-100 mb-3">
                  Select or Create a Query
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Submit a query to analyze news across geographic hierarchies with AI-powered insights and tag-based filtering.
                </p>
              </div>
            ) : (
              <NewsScrapeViewer scrape={selectedScrape} onRefresh={handleRefresh} />
            )}
          </div>
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

