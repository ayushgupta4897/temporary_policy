/**
 * Impact Visualization Component
 * Displays LLM-driven visualizations for impact analysis results
 * Inspired by AnalyticsVisualization but specialized for impact data
 */

import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { ImpactKPIs } from './ImpactKPIs';
import { CitationGallery } from './CitationGallery';
import { MultiplierComparison } from './MultiplierComparison';
import { TimeImpactChart } from './TimeImpactChart';
import { CausalDiagram } from './CausalDiagram';
import { EvidenceRadar } from './EvidenceRadar';
import { MethodologyBreakdown } from './MethodologyBreakdown';
import { DataTable } from './DataTable';

interface Visualization {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  insight?: string;
  data: any;
  config?: any;
  metadata?: {
    confidence?: 'low' | 'medium' | 'high';
    dataSource?: string;
  };
}

interface VisualizationData {
  visualizations: Visualization[];
}

interface ImpactVisualizationProps {
  analysisId: string;
  onGenerateClick?: () => void;
}

export function ImpactVisualization({ analysisId, onGenerateClick }: ImpactVisualizationProps) {
  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    checkVisualizationStatus();
  }, [analysisId]);

  const checkVisualizationStatus = async () => {
    try {
      const status = await apiService.getImpactVisualizationStatus(analysisId);

      if (status.exists) {
        // Cached visualization exists, load it
        await loadVisualization();
      } else if (status.available) {
        // Visualization can be generated but doesn't exist yet
        setLoading(false);
        setData(null);
      } else {
        // Visualization not available
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
      const result = await apiService.generateImpactVisualization(analysisId, false);

      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.visualization_data);
        setError(null);
      }
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

      const result = await apiService.generateImpactVisualization(analysisId, false);

      if (result.error) {
        setError(result.error);
      } else {
        setData(result.visualization_data);

        if (onGenerateClick) {
          onGenerateClick();
        }
      }
    } catch (err) {
      console.error('Error generating visualization:', err);
      setError('Failed to generate visualization. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderVisualization = (viz: Visualization) => {
    const commonProps = {
      title: viz.title,
      subtitle: viz.subtitle,
      insight: viz.insight,
      data: viz.data,
      config: viz.config,
    };

    switch (viz.type) {
      case 'kpi-cards':
        return <ImpactKPIs key={viz.id} {...commonProps} />;
      case 'citation-cards':
        return <CitationGallery key={viz.id} {...commonProps} />;
      case 'bar-comparison':
        return <MultiplierComparison key={viz.id} {...commonProps} />;
      case 'timeline-chart':
        return <TimeImpactChart key={viz.id} {...commonProps} />;
      case 'mermaid-diagram':
        return <CausalDiagram key={viz.id} {...commonProps} />;
      case 'radar':
        return <EvidenceRadar key={viz.id} {...commonProps} />;
      case 'pie-chart':
        return <MethodologyBreakdown key={viz.id} {...commonProps} />;
      case 'data-table':
        return <DataTable key={viz.id} {...commonProps} />;
      default:
        console.warn(`Unknown visualization type: ${viz.type}`);
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gradient-from mx-auto mb-4"></div>
          <p className="text-gray-400">Loading visualization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <div className="text-amber-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">Visualization Not Available</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-lg">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-semibold text-gray-200 mb-4">Generate Visualization</h3>
          <p className="text-gray-400 mb-6">
            Create interactive charts and visualizations from your impact analysis report.
            This uses AI to extract key metrics, causal pathways, and evidence quality data.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-strategyand-accent text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
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
      {data.visualizations.map((viz) => (
        <section key={viz.id} id={viz.id}>
          {renderVisualization(viz)}
        </section>
      ))}
    </div>
  );
}
