'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImpactAnalysisResponse } from '@/types';
import { apiService } from '@/services/api';
import ImpactAnalysisForm from '@/components/ImpactAnalysisForm';
import ImpactAnalysisCard from '@/components/ImpactAnalysisCard';
import ImpactAnalysisViewer from '@/components/ImpactAnalysisViewer';
import { QueryListSkeleton } from '@/components/LoadingSkeleton';

export default function ImpactAnalysisPage() {
  const [analyses, setAnalyses] = useState<ImpactAnalysisResponse[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<ImpactAnalysisResponse[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ImpactAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') || localStorage.getItem('policy-drafter-auth');
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }
    loadAnalyses();
  }, [router]);

  useEffect(() => {
    setFilteredAnalyses([...analyses]);
  }, [analyses]);

  const loadAnalyses = async () => {
    try {
      const analysesList = await apiService.listImpactAnalyses(50);
      setAnalyses(analysesList);
    } catch (error) {
      console.error('Failed to load impact analyses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisSubmit = async (query: string) => {
    console.log('Submitting impact analysis:', query);
    try {
      const response = await apiService.submitImpactAnalysis({ 
        query, 
        async_mode: true 
      });
      console.log('Analysis submitted successfully:', response);
      
      await loadAnalyses();
      
      const newAnalyses = await apiService.listImpactAnalyses(50);
      const newAnalysis = newAnalyses.find(a => a.analysis_id === response.analysis_id);
      if (newAnalysis) {
        setSelectedAnalysis(newAnalysis);
        setShowNewAnalysis(false);
      }
    } catch (error) {
      console.error('Failed to submit impact analysis:', error);
      alert('Failed to submit analysis. Please check the console for details.');
    }
  };

  const refreshSelectedAnalysis = async () => {
    if (!selectedAnalysis) return;
    
    try {
      const updatedAnalysis = await apiService.getImpactAnalysis(selectedAnalysis.analysis_id);
      setSelectedAnalysis(updatedAnalysis);
      setAnalyses(prev => prev.map(a => 
        a.analysis_id === updatedAnalysis.analysis_id ? updatedAnalysis : a
      ));
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this impact analysis?')) return;
    
    try {
      await apiService.deleteImpactAnalysis(analysisId);
      setAnalyses(prev => prev.filter(a => a.analysis_id !== analysisId));
      if (selectedAnalysis?.analysis_id === analysisId) {
        setSelectedAnalysis(null);
      }
    } catch (error) {
      console.error('Failed to delete analysis:', error);
    }
  };

  const handleRegenerateAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to regenerate this analysis? This will overwrite the existing results.')) return;
    
    try {
      const updatedAnalysis = await apiService.regenerateImpactAnalysis(analysisId);
      setAnalyses(prev => prev.map(a => 
        a.analysis_id === analysisId ? updatedAnalysis : a
      ));
      if (selectedAnalysis?.analysis_id === analysisId) {
        setSelectedAnalysis(updatedAnalysis);
      }
    } catch (error) {
      console.error('Failed to regenerate analysis:', error);
    }
  };

  const resetToMainView = () => {
    setSelectedAnalysis(null);
    setShowNewAnalysis(false);
  };

  const renderContent = () => {
    if (showNewAnalysis) {
      return <ImpactAnalysisForm onSubmit={handleAnalysisSubmit} />;
    }

    if (selectedAnalysis) {
      return (
        <ImpactAnalysisViewer 
          analysis={selectedAnalysis} 
          onRefresh={refreshSelectedAnalysis}
          onRegenerate={() => handleRegenerateAnalysis(selectedAnalysis.analysis_id)}
        />
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent">
              Impact Evaluator
            </span>
            <span className="ml-4 px-3 py-1 text-sm font-medium bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white rounded-full border border-blue-400/30">
              Beta
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-8">
            Quantifies the real-world impact of policies with evidence-based multiplier calculations and rigorous causal analysis
          </p>
          <button
            onClick={() => setShowNewAnalysis(true)}
            className="px-8 py-4 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-lg flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Start new analysis
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Analyze causal relationships with high-trust academic sources and quantitative evidence
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Recent Analyses</h2>
          
          <div className="flex items-center gap-4">
            <button
              onClick={loadAnalyses}
              className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <QueryListSkeleton />
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-dark-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No analyses found</h3>
            <p className="text-gray-400 mb-6">
              Start your first impact analysis to see results here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
              <ImpactAnalysisCard 
                key={analysis.analysis_id}
                analysis={analysis}
                onSelect={setSelectedAnalysis}
                onDelete={handleDeleteAnalysis}
                onRegenerate={handleRegenerateAnalysis}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-64 w-24 h-24 bg-gradient-to-r from-gradient-from/15 to-gradient-via/15 rounded-full animate-float blur-xl"></div>
        <div className="absolute top-64 right-32 w-32 h-32 bg-gradient-to-r from-gradient-via/15 to-gradient-to/15 rounded-full animate-float animation-delay-1500 blur-xl"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-gradient-to-r from-gradient-to/15 to-gradient-from/15 rounded-full animate-float animation-delay-3000 blur-xl"></div>
      </div>

      <aside className="w-80 bg-dark-700/50 backdrop-blur-lg border-r border-dark-300/40 flex flex-col relative z-20">
        <div className="p-6 border-b border-dark-300/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 animate-neural-pulse shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Impact Evaluator</h2>
              <p className="text-sm text-gray-400">Causal Impact Quantification</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewAnalysis(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Analysis
          </button>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={resetToMainView}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                !selectedAnalysis && !showNewAnalysis
                  ? 'bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-600/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                All Analyses
              </div>
            </button>
          </div>
        </nav>

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

      <div className="flex-1 flex flex-col">
        <header className="bg-dark-700/30 backdrop-blur-lg border-b border-dark-300/40 px-8 py-4 relative z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-xl font-semibold text-gray-100 animate-glow">Impact Evaluator</h2>
              {selectedAnalysis && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-gray-500">/</span>
                  <span className="font-mono text-xs bg-dark-600/80 px-2 py-1 rounded">{selectedAnalysis.analysis_id}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
