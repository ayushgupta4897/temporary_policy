'use client';

import { useState } from 'react';
import { 
  LightningBoltIcon, 
  SearchIcon, 
  ChartBarIcon, 
  LightBulbIcon,
  ClockIcon
} from './Icons';
import AnalysisModeToggle from './AnalysisModeToggle';

interface QueryFormProps {
  onSubmit: (query: string, analysisMode: 'full' | 'research_only') => void;
}

export default function QueryForm({ onSubmit }: QueryFormProps) {
  const [query, setQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<'full' | 'research_only'>('full');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(query.trim(), analysisMode);
      setQuery('');
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exampleQueries = [
    "Draft a health policy for Government of Saudi Arabia focusing on infant care (0-24 months)",
    "Create a cybersecurity framework for financial institutions in the UAE",
    "Develop environmental protection guidelines for urban development in Qatar",
    "Design a digital transformation strategy for government services in Bahrain"
  ];

  return (
    <div className="page-container section-spacing">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-3xl mx-auto animate-fade-in">
        <h1 className="font-serif text-4xl lg:text-5xl text-gradient-from mb-4 tracking-tight">
          Create New Policy Analysis
        </h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Leverage advanced AI to draft comprehensive policy documents with deep research, 
          data analytics, and scenario planning.
        </p>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto">
        <div className="pwc-card-elevated p-8 mb-8 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="query" className="block font-serif text-lg text-gray-100 mb-3">
                Describe Your Policy Requirements
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="textarea h-40 text-base"
                placeholder="Provide details about the policy you need: target organization, department, scope, specific requirements, regulatory context, and implementation goals..."
                required
                disabled={isSubmitting}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-gray-400">
                  <span className="inline-flex items-center gap-2">
                    <ClockIcon className="text-gray-500" size="sm" />
                    Estimated processing: {analysisMode === 'full' ? '120-180 minutes' : '30-60 minutes'}
                  </span>
                </p>
                <span className="text-sm text-gray-400 transition-number">
                  {query.length} characters
                </span>
              </div>
            </div>

            {/* Analysis Mode Toggle */}
            <div className="border-t border-dark-500/30 pt-6">
              <AnalysisModeToggle 
                mode={analysisMode} 
                onChange={setAnalysisMode}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={!query.trim() || isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Processing Analysis...
                  </>
                ) : (
                  <>
                    <LightningBoltIcon className="mr-2" size="md" />
                    Generate Policy Analysis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Example Queries */}
        <div className="mb-12">
          <h3 className="font-serif text-2xl text-gray-100 mb-6">Example Queries</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exampleQueries.map((example, index) => (
              <div key={index} className={`pwc-card p-6 hover:shadow-lg transition-all duration-300 animate-stagger stagger-${index + 1}`}>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  "{example}"
                </p>
                <button
                  onClick={() => setQuery(example)}
                  className="btn-ghost text-sm"
                  disabled={isSubmitting}
                >
                  Use This Example
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Capabilities */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2 text-lg font-serif text-gray-100">
              <span>What you'll get with </span>
              <span className="text-gradient-from font-semibold">
                {analysisMode === 'full' ? 'Full Analysis' : 'Research Mode'}
              </span>
            </div>
          </div>
          
          {analysisMode === 'full' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center animate-stagger stagger-1">
                <div className="w-16 h-16 bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                  <SearchIcon className="text-white" size="xl" />
                </div>
                <h4 className="font-serif text-xl text-gray-100 mb-2">Deep Research</h4>
                <p className="text-gray-300 leading-relaxed">
                  Comprehensive analysis using global best practices, current regulations, and expert knowledge
                </p>
              </div>
              
              <div className="text-center animate-stagger stagger-2">
                <div className="w-16 h-16 bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                  <ChartBarIcon className="text-white" size="xl" />
                </div>
                <h4 className="font-serif text-xl text-gray-100 mb-2">Data Analytics</h4>
                <p className="text-gray-300 leading-relaxed">
                  Evidence-based insights with statistical analysis, benchmarking, and quantitative assessments
                </p>
              </div>
              
              <div className="text-center animate-stagger stagger-3">
                <div className="w-16 h-16 bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 rounded-lg flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
                  <LightBulbIcon className="text-white" size="xl" />
                </div>
                <h4 className="font-serif text-xl text-gray-100 mb-2">Scenario Modeling</h4>
                <p className="text-gray-300 leading-relaxed">
                  Implementation simulations with risk assessment, impact analysis, and mitigation strategies
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="text-center animate-stagger stagger-1">
                <div className="w-24 h-24 bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 rounded-lg flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-105">
                  <SearchIcon className="text-white" size="xl" />
                </div>
                <h4 className="font-serif text-2xl text-gray-100 mb-4">Focused Research Analysis</h4>
                <p className="text-gray-300 leading-relaxed text-lg mb-6">
                  Get comprehensive research insights with detailed citation analysis in a fraction of the time. 
                  Perfect for initial exploration and evidence gathering.
                </p>
                <div className="flex justify-center space-x-6 text-sm text-gray-400">
                  <span>✓ Policy elaboration</span>
                  <span>✓ Deep research</span>
                  <span>✓ Citation analysis</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
