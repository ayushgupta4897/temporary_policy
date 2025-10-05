'use client';

import { useState, useEffect } from 'react';
import { Query } from '@/types';

interface QueryStatusProps {
  query: Query;
  onRefresh: () => void;
}

export default function QueryStatus({ query, onRefresh }: QueryStatusProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      onRefresh();
    }, 30000);

    const timeInterval = setInterval(() => {
      const createdAt = new Date(query.createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      setTimeElapsed(elapsed);
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(timeInterval);
    };
  }, [query.createdAt, onRefresh]);

  const formatElapsedTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hrs = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const fullAnalysisStages = [
    { name: 'Query Elaboration', icon: '🔍', description: 'Analyzing and expanding your policy request' },
    { name: 'Deep Research', icon: '📚', description: 'Conducting comprehensive web research with citations' },
    { name: 'Citation Analysis', icon: '🔗', description: 'Verifying sources and evaluating credibility' },
    { name: 'Policy Drafting', icon: '📄', description: 'Creating implementation-ready policy document' },
    { name: 'Scenario Simulation', icon: '🎭', description: 'Generating risk scenarios and impact analysis' },
    { name: 'Data Analytics', icon: '📊', description: 'Creating KPIs and metrics visualizations' },
    { name: 'Report Generation', icon: '📋', description: 'Compiling final deliverables and presentations' },
  ];

  const researchOnlyStages = [
    { name: 'Query Elaboration', icon: '🔍', description: 'Analyzing and expanding your policy request' },
    { name: 'Deep Research', icon: '📚', description: 'Conducting comprehensive web research with citations' },
    { name: 'Citation Analysis', icon: '🔗', description: 'Verifying sources and evaluating credibility' },
  ];

  const processingStages = query.analysisMode === 'research_only' ? researchOnlyStages : fullAnalysisStages;

  return (
    <div className="page-container section-spacing">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 loading-spinner border-primary-700"></div>
          </div>
          <h1 className="font-serif text-3xl lg:text-4xl text-gradient-from mb-4">
            {query.analysisMode === 'research_only' ? 'Research' : 'Analysis'} in Progress
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {query.analysisMode === 'research_only' 
              ? 'Our AI agents are conducting deep research and citation analysis for your query'
              : 'Our AI agents are conducting comprehensive policy research and analysis for your query'
            }
          </p>
          
          {/* Analysis Mode Badge */}
          <div className="flex justify-center mt-4">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              query.analysisMode === 'research_only' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                : 'bg-gradient-from/20 text-gray-100'
            }`}>
              {query.analysisMode === 'research_only' ? '🔍 Research Mode' : '🏛️ Full Analysis'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Query Context */}
          <div className="pwc-card p-8">
            <h3 className="font-serif text-lg text-gray-100 mb-4">Your Query</h3>
            <p className="text-gray-300 leading-relaxed bg-dark-600/50 p-4 rounded-lg">
              {query.query}
            </p>
          </div>

          {/* Status Overview */}
          <div className="pwc-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-gray-100">Processing Status</h3>
              <button
                onClick={onRefresh}
                className="btn-ghost text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {/* Time Info */}
            <div className={`rounded-lg p-4 ${
              timeElapsed > 3300 ? 'bg-gradient-to-r from-status-error/30 to-dark-600/30' : timeElapsed > 2700 ? 'bg-gradient-to-r from-gradient-from/30 to-dark-600/30' : 'bg-dark-600/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    timeElapsed > 3300 ? 'bg-red-500' : timeElapsed > 2700 ? 'bg-amber-500' : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm text-gray-400">
                    {timeElapsed > 3300 
                      ? 'Processing is taking longer than expected' 
                      : timeElapsed > 2700 
                        ? 'Processing is nearing completion' 
                        : 'Policy generation in progress'
                    }
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono text-gray-100">
                    {formatElapsedTime(timeElapsed)}
                  </div>
                  <p className="text-xs text-gray-400">Processing time</p>
                </div>
              </div>
              {timeElapsed > 2700 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">
                    {timeElapsed > 3300 
                      ? '⚠️ If processing exceeds 180 minutes, the query will be marked as failed.'
                      : '⏳ Most queries complete within 30-45 minutes. Please be patient.'
                    }
                  </p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Auto-refreshes every 30 seconds</p>
          </div>

          {/* Processing Stages */}
          <div className="pwc-card p-8">
            <h3 className="font-serif text-lg text-gray-100 mb-6">Processing Pipeline</h3>
            <p className="text-sm text-gray-300 mb-6">
              Your policy is being processed through the following stages:
            </p>
            <div className="space-y-4">
              {processingStages.map((stage, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 text-white flex-shrink-0">
                    <span>{stage.icon}</span>
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-100">
                      {index + 1}. {stage.name}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {stage.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Note:</span> The entire pipeline typically takes 120-180 minutes to complete. 
                You'll receive comprehensive policy documents once all stages are finished. Processing will automatically timeout after 180 minutes if not completed.
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="text-center text-sm text-gray-400">
            <p>You can safely navigate away from this page.</p>
            <p>Your analysis will continue processing in the background.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
