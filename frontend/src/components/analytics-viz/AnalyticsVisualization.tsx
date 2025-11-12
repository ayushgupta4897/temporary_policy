/**
 * Analytics Visualization Component
 * Displays interactive chart visualizations for policy analytics data
 */

import { useState, useEffect } from 'react';
import { ExecutiveSummary } from './ExecutiveSummary';
import { PerformanceChart } from './PerformanceChart';
import { TimelineView } from './TimelineView';
import { CountryComparison } from './CountryComparison';
import { RiskHeatMap } from './RiskHeatMap';
import { FinancialChart } from './FinancialChart';

interface VisualizationData {
  executive_metrics: any[];
  performance_chart: { data: any[] };
  timeline: any[];
  country_comparison: { data: any[] };
  risk_matrix: { data: any[] };
  financial_chart: { data: any[] };
}

interface AnalyticsVisualizationProps {
  queryId: string;
  onGenerateClick?: () => void;
}

export function AnalyticsVisualization({ queryId, onGenerateClick }: AnalyticsVisualizationProps) {
  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkVisualizationStatus();
  }, [queryId]);

  const checkVisualizationStatus = async () => {
    try {
      const response = await fetch(`/api/queries/${queryId}/visualization/status`);
      if (!response.ok) {
        throw new Error('Failed to check visualization status');
      }

      const status = await response.json();

      if (status.exists) {
        // Cached visualization exists, load it
        await loadVisualization();
      } else if (status.available) {
        // Visualization can be generated but doesn't exist yet
        setLoading(false);
        setData(null);
      } else {
        // Visualization not available (wrong mode or query not completed)
        setError(status.reason || 'Visualization not available');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error checking visualization status:', err);
      setError('Failed to check visualization availability');
      setLoading(false);
    }
  };

  const loadVisualization = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/queries/${queryId}/visualization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force_regenerate: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to load visualization');
      }

      const result = await response.json();
      setData(result.visualization_data);
      setError(null);
    } catch (err) {
      console.error('Error loading visualization:', err);
      setError('Failed to load visualization');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`/api/queries/${queryId}/visualization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force_regenerate: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate visualization');
      }

      const result = await response.json();
      setData(result.visualization_data);

      if (onGenerateClick) {
        onGenerateClick();
      }
    } catch (err) {
      console.error('Error generating visualization:', err);
      setError('Failed to generate visualization. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C52A2F] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Visualization Not Available</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-semibold mb-4">Generate Visualization</h3>
          <p className="text-gray-600 mb-6">
            Create interactive charts and visualizations from your analytics report.
            This uses AI to extract and structure data for visual presentation.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-[#C52A2F] text-white px-8 py-3 rounded-lg hover:bg-[#A32020] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              'Generate Visualization'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      {data.executive_metrics && data.executive_metrics.length > 0 && (
        <section id="executive-summary">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Executive Summary</h2>
          <ExecutiveSummary metrics={data.executive_metrics} />
        </section>
      )}

      {/* Performance Metrics */}
      {data.performance_chart?.data && data.performance_chart.data.length > 0 && (
        <section id="performance">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Performance Metrics</h2>
          <PerformanceChart data={data.performance_chart.data} />
        </section>
      )}

      {/* Implementation Timeline */}
      {data.timeline && data.timeline.length > 0 && (
        <section id="timeline">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Implementation Timeline</h2>
          <TimelineView phases={data.timeline} />
        </section>
      )}

      {/* International Benchmarks */}
      {data.country_comparison?.data && data.country_comparison.data.length > 0 && (
        <section id="benchmarks">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">International Benchmarks</h2>
          <CountryComparison data={data.country_comparison.data} />
        </section>
      )}

      {/* Risk Assessment */}
      {data.risk_matrix?.data && data.risk_matrix.data.length > 0 && (
        <section id="risk">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Risk Assessment</h2>
          <RiskHeatMap data={data.risk_matrix.data} />
        </section>
      )}

      {/* Financial Projection */}
      {data.financial_chart?.data && data.financial_chart.data.length > 0 && (
        <section id="financial">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Financial Projection</h2>
          <FinancialChart data={data.financial_chart.data} />
        </section>
      )}
    </div>
  );
}
