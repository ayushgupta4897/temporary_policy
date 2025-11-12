'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImpactAnalysisResponse } from '@/types';
import { ChartIcon, BookIcon, SearchIcon } from '@/components/icons/TabIcons';
import { ImpactVisualization } from './impact-viz/ImpactVisualization';

interface ImpactAnalysisViewerProps {
  analysis: ImpactAnalysisResponse;
  onRefresh: () => Promise<void>;
}

export default function ImpactAnalysisViewer({
  analysis,
  onRefresh
}: ImpactAnalysisViewerProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'citations' | 'meta-prompt' | 'visualization'>('analysis');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Calculate elapsed time
  useEffect(() => {
    if (analysis.status === 'processing' && analysis.created_at) {
      const updateElapsedTime = () => {
        const createdTime = new Date(analysis.created_at!).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - createdTime) / 1000); // in seconds
        setElapsedTime(elapsed);
      };

      updateElapsedTime();
      const timer = setInterval(updateElapsedTime, 1000);

      return () => clearInterval(timer);
    }
  }, [analysis.status, analysis.created_at]);

  useEffect(() => {
    if (analysis.status === 'processing') {
      const interval = setInterval(async () => {
        await onRefresh();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [analysis.status, onRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      'completed': {
        dotClass: 'bg-green-400',
        textClass: 'text-green-400'
      },
      'processing': {
        dotClass: 'bg-yellow-400 animate-pulse',
        textClass: 'text-yellow-400'
      },
      'failed': {
        dotClass: 'bg-red-400',
        textClass: 'text-red-400'
      }
    };

    const config = statusConfig[analysis.status] || statusConfig['failed'];

    return (
      <span className={`flex items-center gap-2 ${config.textClass}`}>
        <div className={`w-2 h-2 rounded-full ${config.dotClass}`}></div>
        {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeoutWarning = () => {
    const timeoutSeconds = 30 * 60; // 30 minutes
    const warningSeconds = 25 * 60; // 25 minutes

    if (elapsedTime >= timeoutSeconds) {
      return { show: true, type: 'error', message: 'Analysis has exceeded 30 minute timeout' };
    } else if (elapsedTime >= warningSeconds) {
      const remaining = timeoutSeconds - elapsedTime;
      return {
        show: true,
        type: 'warning',
        message: `Analysis will timeout in ${formatElapsedTime(remaining)}`
      };
    }
    return { show: false, type: '', message: '' };
  };

  const renderAnalysisContent = () => {
    if (analysis.status === 'processing') {
      const timeoutWarning = getTimeoutWarning();

      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-from mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Analysis in Progress</h3>
          <p className="text-gray-400 text-center max-w-md mb-3">
            Running comprehensive impact analysis across high-trust academic sources. This typically takes 25-30 minutes.
          </p>

          {/* Elapsed Time */}
          <div className="text-lg font-mono text-gradient-from mb-4">
            {formatElapsedTime(elapsedTime)}
          </div>

          {/* Timeout Warning */}
          {timeoutWarning.show && (
            <div className={`mb-4 px-4 py-2 rounded-lg border ${
              timeoutWarning.type === 'error'
                ? 'bg-red-900/30 border-red-700/50 text-red-400'
                : 'bg-amber-900/30 border-amber-700/50 text-amber-400'
            }`}>
              {timeoutWarning.message}
            </div>
          )}

          <div className="mt-6 w-full max-w-md bg-dark-600/30 rounded-full h-2">
            <div className="bg-gradient-to-r from-gradient-from to-gradient-to h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      );
    }

    if (analysis.status === 'failed') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Analysis Failed</h3>
          <p className="text-gray-400 text-center max-w-md mb-4">
            {analysis.error_message || 'The impact analysis encountered an error. Please try submitting a new analysis.'}
          </p>
          {analysis.error_message && (
            <div className="mt-4 px-4 py-3 bg-red-900/20 border border-red-700/30 rounded-lg max-w-md">
              <p className="text-sm text-red-300 font-mono">{analysis.error_message}</p>
            </div>
          )}
        </div>
      );
    }

    if (!analysis.impact_analysis) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">No Analysis Available</h3>
          <p className="text-gray-400 text-center max-w-md">
            The analysis content is not yet available.
          </p>
        </div>
      );
    }

    return (
      <div className="prose prose-invert prose-lg max-w-none [&_*]:text-gray-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }: { children: React.ReactNode }) => (
              <h1 className="text-3xl font-bold text-gradient-from mb-6 border-b border-dark-300/50 pb-4">
                {children}
              </h1>
            ),
            h2: ({ children }: { children: React.ReactNode }) => (
              <h2 className="text-2xl font-semibold text-gray-100 mb-4 mt-8">
                {children}
              </h2>
            ),
            h3: ({ children }: { children: React.ReactNode }) => (
              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-6">
                {children}
              </h3>
            ),
            h4: ({ children }: { children: React.ReactNode }) => (
              <h4 className="text-lg font-medium text-gray-300 mb-2 mt-4">
                {children}
              </h4>
            ),
            p: ({ children }: { children: React.ReactNode }) => (
              <p className="text-gray-300 mb-4 leading-relaxed">
                {children}
              </p>
            ),
            blockquote: ({ children }: { children: React.ReactNode }) => (
              <blockquote className="border-l-4 border-gradient-from/50 pl-4 my-4 bg-dark-600/20 py-2 rounded-r">
                {children}
              </blockquote>
            ),
            table: ({ children }: { children: React.ReactNode }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse bg-dark-600/20 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }: { children: React.ReactNode }) => (
              <thead className="bg-dark-500/50">
                {children}
              </thead>
            ),
            th: ({ children }: { children: React.ReactNode }) => (
              <th className="border border-dark-400/50 px-4 py-3 text-left text-sm font-semibold text-gray-200">
                {children}
              </th>
            ),
            td: ({ children }: { children: React.ReactNode }) => (
              <td className="border border-dark-400/30 px-4 py-3 text-sm text-gray-300">
                {children}
              </td>
            ),
            ul: ({ children }: { children: React.ReactNode }) => (
              <ul className="list-disc list-inside mb-4 space-y-2">
                {children}
              </ul>
            ),
            ol: ({ children }: { children: React.ReactNode }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2">
                {children}
              </ol>
            ),
            li: ({ children }: { children: React.ReactNode }) => (
              <li className="text-gray-300">
                {children}
              </li>
            ),
            code: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
              const isInline = !props.className;
              return isInline ? (
                <code className="bg-dark-600/50 text-gradient-from px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-dark-500 border border-dark-400 p-4 rounded-lg overflow-x-auto my-4">
                  <code className="text-sky-400 text-sm font-mono block">
                    {children}
                  </code>
                </pre>
              );
            },
            pre: ({ children }: { children: React.ReactNode }) => (
              <pre className="bg-dark-500 border border-dark-400 p-4 rounded-lg overflow-x-auto my-4 text-sky-400">
                {children}
              </pre>
            ),
            strong: ({ children }: { children: React.ReactNode }) => (
              <strong className="font-semibold text-gray-100">
                {children}
              </strong>
            ),
            em: ({ children }: { children: React.ReactNode }) => (
              <em className="italic text-gray-200">
                {children}
              </em>
            ),
            a: ({ href, children }: { href?: string; children: React.ReactNode }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gradient-from hover:text-gradient-to transition-colors underline"
              >
                {children}
              </a>
            ),
            hr: () => (
              <hr className="border-dark-300/50 my-8" />
            )
          }}
        >
          {analysis.impact_analysis}
        </ReactMarkdown>
      </div>
    );
  };

  const renderCitations = () => {
    if (!analysis.citations || analysis.citations.length === 0) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-400">No citations available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {analysis.citations.map((citation, index) => (
          <div key={index} className="bg-dark-500 border border-dark-400 rounded-lg p-6 hover:border-dark-300 transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-strategyand-off-white flex-1">
                {citation.title}
              </h3>
              <div className="flex items-center gap-2 ml-4">
                <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                  citation.quality_score === 'high'
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : citation.quality_score === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    : 'bg-red-500/20 text-red-300 border-red-500/30'
                }`}>
                  {citation.quality_score}
                </span>
                <span className="px-2.5 py-1 bg-dark-700/60 text-gray-200 border border-dark-400/30 rounded text-xs font-medium">
                  {citation.source_tier.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-300 font-medium">Publisher:</span>
                <span className="text-gray-100 ml-2">{citation.publisher}</span>
              </div>
              <div>
                <span className="text-gray-300 font-medium">Year:</span>
                <span className="text-gray-100 ml-2">{citation.year}</span>
              </div>
              {citation.doi && (
                <div className="col-span-full">
                  <span className="text-gray-300 font-medium">DOI:</span>
                  <span className="text-gray-100 ml-2 font-mono text-xs">{citation.doi}</span>
                </div>
              )}
              {citation.multiplier && (
                <div>
                  <span className="text-gray-300 font-medium">Multiplier:</span>
                  <span className="text-gradient-from font-semibold ml-2">{citation.multiplier}</span>
                </div>
              )}
            </div>

            <div className="mb-4 bg-dark-600/30 rounded-lg p-4 border border-dark-400/20">
              <div className="text-gray-200 text-sm mb-2 font-semibold">Key Finding:</div>
              <p className="text-gray-100 leading-relaxed">{citation.key_finding}</p>
            </div>

            <div className="mb-4 bg-dark-600/30 rounded-lg p-4 border border-dark-400/20">
              <div className="text-gray-200 text-sm mb-2 font-semibold">Methodology:</div>
              <p className="text-gray-100 leading-relaxed">{citation.methodology}</p>
            </div>

            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-strategyand-accent/20 hover:bg-strategyand-accent/30 rounded-lg text-strategyand-off-white transition-all text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Source
            </a>
          </div>
        ))}
      </div>
    );
  };

  const renderMetaPrompt = () => {
    if (!analysis.meta_prompt) {
      return (
        <div className="text-center py-16">
          <p className="text-gray-400">No analytical framework available.</p>
        </div>
      );
    }

    return (
      <div className="prose prose-invert prose-lg max-w-none [&_*]:text-gray-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }: { children: React.ReactNode }) => (
              <h1 className="text-2xl font-bold text-gradient-from mb-4 border-b border-dark-300/50 pb-3">
                {children}
              </h1>
            ),
            h2: ({ children }: { children: React.ReactNode }) => (
              <h2 className="text-xl font-semibold text-gray-100 mb-3 mt-6">
                {children}
              </h2>
            ),
            h3: ({ children }: { children: React.ReactNode }) => (
              <h3 className="text-lg font-semibold text-gray-200 mb-2 mt-4">
                {children}
              </h3>
            ),
            h4: ({ children }: { children: React.ReactNode }) => (
              <h4 className="text-md font-medium text-gray-300 mb-2 mt-3">
                {children}
              </h4>
            ),
            p: ({ children }: { children: React.ReactNode }) => (
              <p className="text-gray-300 mb-3 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }: { children: React.ReactNode }) => (
              <ul className="list-disc list-inside mb-3 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }: { children: React.ReactNode }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }: { children: React.ReactNode }) => (
              <li className="text-gray-300 ml-2">
                {children}
              </li>
            ),
            strong: ({ children }: { children: React.ReactNode }) => (
              <strong className="font-semibold text-gray-100">
                {children}
              </strong>
            ),
            em: ({ children }: { children: React.ReactNode }) => (
              <em className="italic text-gray-200">
                {children}
              </em>
            ),
            code: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => {
              const isInline = !props.className;
              return isInline ? (
                <code className="bg-dark-600/50 text-gradient-from px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-dark-500 border border-dark-400 p-3 rounded-lg overflow-x-auto my-3">
                  <code className="text-sky-400 text-sm font-mono block">
                    {children}
                  </code>
                </pre>
              );
            },
            pre: ({ children }: { children: React.ReactNode }) => (
              <pre className="bg-dark-500 border border-dark-400 p-3 rounded-lg overflow-x-auto my-3 text-sky-400">
                {children}
              </pre>
            ),
            hr: () => (
              <hr className="border-dark-300/50 my-6" />
            )
          }}
        >
          {analysis.meta_prompt}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            {analysis.query}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {getStatusBadge()}
            <span>{analysis.citations_count || 0} citations</span>
            <span>{formatDate(analysis.created_at)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex border-b border-dark-300/50">
        {[
          { key: 'analysis', label: 'Impact Analysis', icon: <ChartIcon className="w-4 h-4" /> },
          { key: 'visualization', label: 'Visualization', icon: <ChartIcon className="w-4 h-4" /> },
          { key: 'citations', label: `Citations (${analysis.citations_count || 0})`, icon: <BookIcon className="w-4 h-4" /> },
          { key: 'meta-prompt', label: 'Framework', icon: <SearchIcon className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-gradient-from text-gradient-from'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'analysis' && renderAnalysisContent()}
        {activeTab === 'visualization' && <ImpactVisualization analysisId={analysis.analysis_id} />}
        {activeTab === 'citations' && renderCitations()}
        {activeTab === 'meta-prompt' && renderMetaPrompt()}
      </div>
    </div>
  );
}
