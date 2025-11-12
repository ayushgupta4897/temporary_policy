'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { GenericVisualization, type Visualization } from '@/components/analytics-viz/GenericVisualization';

// API Base URL - uses environment variable in production, localhost in development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface VisualizationData {
  visualizations: Visualization[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const queryId = params?.queryId as string;

  const [data, setData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (queryId) {
      checkVisualizationStatus();
    }
  }, [queryId]);

  const checkVisualizationStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/queries/${queryId}/visualization/status`);
      if (!response.ok) {
        throw new Error('Failed to check visualization status');
      }

      const status = await response.json();

      if (status.exists) {
        await loadVisualization();
      } else if (status.available) {
        setLoading(false);
        setData(null);
      } else {
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
      const response = await fetch(`${API_BASE_URL}/queries/${queryId}/visualization`, {
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

      const response = await fetch(`${API_BASE_URL}/queries/${queryId}/visualization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force_regenerate: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate visualization');
      }

      const result = await response.json();
      setData(result.visualization_data);
    } catch (err) {
      console.error('Error generating visualization:', err);
      setError('Failed to generate visualization. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAE6DD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#A32020] mx-auto mb-4"></div>
          <p className="text-[#6B6B6B] text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#EAE6DD] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-semibold mb-4 text-[#6B6B6B]">Visualization Not Available</h3>
          <p className="text-[#6B6B6B]/70 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-[#A32020] text-white px-6 py-3 rounded-lg hover:bg-[#8B1A1A] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#EAE6DD] flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <div className="text-7xl mb-6">📊</div>
          <h3 className="text-3xl font-semibold mb-4 text-[#6B6B6B]">Generate Analytics Visualization</h3>
          <p className="text-[#6B6B6B]/70 mb-8 text-lg">
            Create interactive charts and visualizations from your analytics report.
            Our AI analyzes the report and generates 8-12 dynamic visualizations with insights.
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-[#A32020] text-white px-10 py-4 rounded-lg hover:bg-[#8B1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating... (this may take 1-2 minutes)
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
    <div className="min-h-screen bg-[#EAE6DD]">
      {/* Header with Strategy& Branding */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#A32020] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-serif text-2xl font-bold">&</span>
              </div>
              <div>
                <h1 className="text-3xl font-light text-[#6B6B6B]">Policy Analytics</h1>
                <p className="text-sm text-[#6B6B6B]/60">Strategy& Ideation Center • AI-Generated Insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="text-sm px-4 py-2 border border-[#A32020] text-[#A32020] rounded-lg hover:bg-[#A32020] hover:text-white transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={() => router.back()}
                className="text-[#6B6B6B] hover:text-[#4A4A4A] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Dynamic Visualizations */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Visualization count indicator */}
        <div className="mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-monument-stone/20">
          <p className="text-monument-stone">
            <span className="font-semibold">{data.visualizations?.length || 0} visualizations</span> generated from analytics report
          </p>
        </div>

        {/* Render all visualizations dynamically */}
        {data.visualizations && data.visualizations.length > 0 ? (
          data.visualizations.map((viz) => (
            <GenericVisualization key={viz.id} visualization={viz} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-monument-stone/70">No visualizations available</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-monument-stone/60 text-sm pt-12 pb-6 border-t border-monument-stone/20 mt-12">
          <p className="font-medium">Policy Analytics Visualization • Strategy& Ideation Center</p>
          <p className="mt-2">Powered by AI-driven insights • All titles and insights generated by GPT-5</p>
        </div>
      </div>
    </div>
  );
}
