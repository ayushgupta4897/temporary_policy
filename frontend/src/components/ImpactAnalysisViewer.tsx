'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImpactAnalysisResponse } from '@/types';

interface ImpactAnalysisViewerProps {
  analysis: ImpactAnalysisResponse;
  onRefresh: () => Promise<void>;
  onRegenerate: () => void;
}

export default function ImpactAnalysisViewer({ 
  analysis, 
  onRefresh, 
  onRegenerate 
}: ImpactAnalysisViewerProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'citations' | 'meta-prompt'>('analysis');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
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

  const renderAnalysisContent = () => {
    if (analysis.status === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-from mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Analysis in Progress</h3>
          <p className="text-gray-400 text-center max-w-md">
            Running comprehensive impact analysis across high-trust academic sources. This typically takes 2-5 minutes.
          </p>
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
          <p className="text-gray-400 text-center max-w-md mb-6">
            The impact analysis encountered an error. You can try regenerating the analysis.
          </p>
          <button
            onClick={onRegenerate}
            className="px-6 py-2 bg-gradient-to-r from-gradient-from to-gradient-to text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Regenerate Analysis
          </button>
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
      <div className="prose prose-invert prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-gradient-from mb-6 border-b border-dark-300/50 pb-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold text-gray-100 mb-4 mt-8">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold text-gray-200 mb-3 mt-6">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-lg font-medium text-gray-300 mb-2 mt-4">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 mb-4 leading-relaxed">
                {children}
              </p>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-gradient-from/50 pl-4 my-4 bg-dark-600/20 py-2 rounded-r">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse bg-dark-600/20 rounded-lg overflow-hidden">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-dark-500/50">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="border border-dark-400/50 px-4 py-3 text-left text-sm font-semibold text-gray-200">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-dark-400/30 px-4 py-3 text-sm text-gray-300">
                {children}
              </td>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-4 space-y-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-4 space-y-2">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-300">
                {children}
              </li>
            ),
            code: ({ children, ...props }) => {
              const isInline = !props.className;
              return isInline ? (
                <code className="bg-dark-600/50 text-gradient-from px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-dark-600/50 p-4 rounded-lg overflow-x-auto my-4">
                  <code className="text-gray-300 text-sm font-mono">
                    {children}
                  </code>
                </pre>
              );
            },
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-100">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-200">
                {children}
              </em>
            ),
            a: ({ href, children }) => (
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
          <div key={index} className="neural-card p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-100 flex-1">
                {citation.title}
              </h3>
              <div className="flex items-center gap-2 ml-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  citation.quality_score === 'high' 
                    ? 'bg-green-500/20 text-green-400' 
                    : citation.quality_score === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {citation.quality_score}
                </span>
                <span className="px-2 py-1 bg-dark-600/50 text-gray-300 rounded text-xs">
                  {citation.source_tier.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-400">Publisher:</span>
                <span className="text-gray-200 ml-2">{citation.publisher}</span>
              </div>
              <div>
                <span className="text-gray-400">Year:</span>
                <span className="text-gray-200 ml-2">{citation.year}</span>
              </div>
              {citation.doi && (
                <div>
                  <span className="text-gray-400">DOI:</span>
                  <span className="text-gray-200 ml-2 font-mono text-xs">{citation.doi}</span>
                </div>
              )}
              {citation.multiplier && (
                <div>
                  <span className="text-gray-400">Multiplier:</span>
                  <span className="text-gradient-from font-semibold ml-2">{citation.multiplier}</span>
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="text-gray-400 text-sm mb-1">Key Finding:</div>
              <p className="text-gray-300">{citation.key_finding}</p>
            </div>

            <div className="mb-4">
              <div className="text-gray-400 text-sm mb-1">Methodology:</div>
              <p className="text-gray-300">{citation.methodology}</p>
            </div>

            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gradient-from hover:text-gradient-to transition-colors text-sm"
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
      <div className="prose prose-invert prose-lg max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-2xl font-bold text-gradient-from mb-4 border-b border-dark-300/50 pb-3">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-xl font-semibold text-gray-100 mb-3 mt-6">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-gray-200 mb-2 mt-4">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="text-md font-medium text-gray-300 mb-2 mt-3">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 mb-3 leading-relaxed">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside mb-3 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-inside mb-3 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-gray-300 ml-2">
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-gray-100">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-gray-200">
                {children}
              </em>
            ),
            code: ({ children, ...props }) => {
              const isInline = !props.className;
              return isInline ? (
                <code className="bg-dark-600/50 text-gradient-from px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-dark-600/50 p-3 rounded-lg overflow-x-auto my-3">
                  <code className="text-gray-300 text-sm font-mono">
                    {children}
                  </code>
                </pre>
              );
            },
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
            <span className={`flex items-center gap-2 ${getStatusColor(analysis.status)}`}>
              <div className={`w-2 h-2 rounded-full ${
                analysis.status === 'completed' ? 'bg-green-400' :
                analysis.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}></div>
              {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
            </span>
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
          
          {analysis.status === 'completed' && (
            <button
              onClick={onRegenerate}
              className="px-4 py-2 bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 hover:from-gradient-from/30 hover:to-gradient-to/30 text-white rounded-lg transition-all text-sm"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-dark-300/50">
        {[
          { key: 'analysis', label: 'Impact Analysis', icon: '📊' },
          { key: 'citations', label: `Citations (${analysis.citations_count || 0})`, icon: '📚' },
          { key: 'meta-prompt', label: 'Framework', icon: '🔍' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gradient-from text-gradient-from'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'analysis' && renderAnalysisContent()}
        {activeTab === 'citations' && renderCitations()}
        {activeTab === 'meta-prompt' && renderMetaPrompt()}
      </div>
    </div>
  );
}
