'use client';

import { useState, useEffect } from 'react';
import ClusterChart from './ClusterChart';
import TrendChart from './TrendChart';
import EntityGraph from './EntityGraph';
import GeoHeatmap from './GeoHeatmap';
import SentimentTimeline from './SentimentTimeline';

interface AnalyticsDashboardProps {
  queryId: string;
}

interface AnalyticsData {
  clustering: any;
  trends: any;
  entities: any;
  geo: any;
  sentiment: any;
  summary: any;
}

export default function AnalyticsDashboard({ queryId }: AnalyticsDashboardProps) {
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'processing' | 'done' | 'error'>('loading');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkExistingAnalytics();
  }, [queryId]);

  const checkExistingAnalytics = async () => {
    const response = await fetch(`http://localhost:8000/news-scrapes/${queryId}/analytics/latest`);

    if (response.ok) {
      const existingAnalytics = await response.json();
      setAnalyticsId(existingAnalytics.analytics_id);

      if (existingAnalytics.status === 'done') {
        setStatus('done');
        loadAnalyticsData();
      } else if (existingAnalytics.status === 'processing') {
        setStatus('processing');
      } else {
        setStatus('idle');
      }
    } else {
      setStatus('idle');
    }
  };

  const submitAnalytics = async () => {
    setStatus('loading');
    setError(null);

    const response = await fetch(`http://localhost:8000/news-scrapes/${queryId}/analytics`, {
      method: 'POST'
    });

    if (!response.ok) {
      setError('Failed to submit analytics job');
      setStatus('error');
      return;
    }

    const result = await response.json();
    setAnalyticsId(result.analytics_id);
    setStatus('processing');
  };

  useEffect(() => {
    if (!analyticsId || status !== 'processing') return;

    const pollStatus = setInterval(async () => {
      const response = await fetch(`http://localhost:8000/news-scrapes/${queryId}/analytics/${analyticsId}`);

      if (!response.ok) return;

      const statusData = await response.json();

      if (statusData.status === 'done') {
        clearInterval(pollStatus);
        setStatus('done');
        loadAnalyticsData();
      } else if (statusData.status === 'failed') {
        clearInterval(pollStatus);
        setStatus('error');
        setError('Analytics processing failed');
      }
    }, 3000);

    return () => clearInterval(pollStatus);
  }, [analyticsId, status, queryId]);

  const loadAnalyticsData = async () => {
    const types = ['clustering', 'trends', 'entities', 'geo', 'sentiment', 'summary'];
    const results: any = {};

    for (const type of types) {
      const response = await fetch(`http://localhost:8000/news-scrapes/${queryId}/analytics/results/${type}`);
      if (response.ok) {
        const data = await response.json();
        results[type] = data.content;
      }
    }

    setData(results);
  };

  if (status === 'idle') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-from/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gradient-from" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-3">Advanced Analytics</h2>
          <p className="text-gray-400 mb-6">
            Run deep analysis on scraped articles including sentiment trends, topic clustering, entity networks, and geographic insights.
          </p>
          <button
            onClick={submitAnalytics}
            className="px-6 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90"
          >
            Run Analytics
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading' || status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-warning/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-10 h-10 border-4 border-status-warning border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Processing Analytics</h2>
          <p className="text-gray-400">
            Scraping article content and running AI analysis...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">Analytics Failed</h2>
          <p className="text-gray-400 mb-4">{error || 'An error occurred'}</p>
          <button
            onClick={submitAnalytics}
            className="px-6 py-3 bg-dark-600 hover:bg-dark-500 text-gray-300 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-100">Analytics Dashboard</h2>
        <div className="flex gap-3 text-sm">
          <div className="px-3 py-1 bg-dark-600 rounded-lg">
            <span className="text-gray-400">Articles: </span>
            <span className="text-white font-semibold">{data.summary?.total_articles_analyzed || 0}</span>
          </div>
          <div className="px-3 py-1 bg-dark-600 rounded-lg">
            <span className="text-gray-400">Clusters: </span>
            <span className="text-white font-semibold">{data.summary?.clusters_found || 0}</span>
          </div>
          <div className="px-3 py-1 bg-dark-600 rounded-lg">
            <span className="text-gray-400">Entities: </span>
            <span className="text-white font-semibold">{data.summary?.unique_entities || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-dark-600/40 rounded-xl border border-dark-400/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Topic Clusters</h3>
          <ClusterChart data={data.clustering} />
        </div>

        <div className="bg-dark-600/40 rounded-xl border border-dark-400/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sentiment Timeline</h3>
          <SentimentTimeline data={data.sentiment} />
        </div>

        <div className="bg-dark-600/40 rounded-xl border border-dark-400/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Article Trends</h3>
          <TrendChart data={data.trends} />
        </div>

        <div className="bg-dark-600/40 rounded-xl border border-dark-400/40 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Geographic Distribution</h3>
          <GeoHeatmap data={data.geo} />
        </div>
      </div>

      <div className="bg-dark-600/40 rounded-xl border border-dark-400/40 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Entity Network</h3>
        <EntityGraph data={data.entities} />
      </div>
    </div>
  );
}
