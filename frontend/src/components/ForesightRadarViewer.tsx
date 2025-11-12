'use client';

import { FC, useState, useEffect } from 'react';
import { ForesightRadarQuery, RadarJSON, RadarSignal } from '@/types';
import { apiService } from '@/services/api';
import RadarChart from './RadarChart';

interface ForesightRadarViewerProps {
  radar: ForesightRadarQuery;
  onRefresh: () => void;
}

type ViewMode = 'radar' | 'signals' | 'scenarios' | 'watchlist';

const ForesightRadarViewer: FC<ForesightRadarViewerProps> = ({ radar, onRefresh }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('radar');
  const [radarData, setRadarData] = useState<RadarJSON | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<RadarSignal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRadarData();
  }, [radar.queryId]);

  const loadRadarData = async () => {
    if (radar.status !== 'done') {
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.getForesightRadarContent(radar.queryId, 'radar_json');
      if (response && response.content) {
        const parsed = JSON.parse(response.content);
        // If radar_json is nested inside, extract it
        const radarJson = parsed.radar_json || parsed;
        setRadarData(radarJson);
      }
    } catch (error) {
      console.error('Failed to load radar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (radar.status === 'processing') {
      const interval = setInterval(() => {
        onRefresh();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [radar.status, onRefresh]);

  // Loading state
  if (isLoading || radar.status === 'processing') {
    return (
      <div className="min-h-screen bg-[#111214] flex items-center justify-center">
        <div className="text-center z-10 max-w-2xl px-8">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border border-[#232427]"></div>
            <div className="absolute inset-4 rounded-full border border-[#232427]"></div>
            <div className="absolute inset-8 rounded-full border border-[#232427]"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#C52A2F] rounded-full"></div>
            </div>
          </div>

          <h3 className="text-2xl font-serif text-[#F5F3EE] mb-4" style={{ letterSpacing: '-0.005em' }}>
            {radar.status === 'processing' ? 'Analyzing Future Signals' : 'Loading Radar'}
          </h3>
          <p className="text-base" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>
            {radar.status === 'processing' ? 'Scanning high-trust sources across STEEP-G dimensions' : 'Preparing visualization'}
          </p>

          {radar.status === 'processing' && (
            <div className="mt-12 space-y-3 max-w-md mx-auto">
              {['Social & Technological', 'Economic & Environmental', 'Political & Geopolitical'].map((text, idx) => (
                <div key={idx} className="flex items-center gap-4 text-sm" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>
                  <div className="w-1.5 h-1.5 bg-[#C52A2F] rounded-full"></div>
                  <span>{text} trends</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Failed state
  if (radar.status === 'failed') {
    return (
      <div className="min-h-screen bg-[#111214] flex items-center justify-center">
        <div className="text-center max-w-md px-8">
          <div className="w-20 h-20 bg-[#111214] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#232427]">
            <svg className="w-10 h-10 text-[#C52A2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-serif text-[#F5F3EE] mb-3" style={{ letterSpacing: '-0.005em' }}>Analysis Failed</h3>
          <p className="mb-8" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>{radar.errorMessage || 'An error occurred during foresight analysis'}</p>
          <button
            onClick={onRefresh}
            className="px-8 py-3 bg-[#C52A2F] text-[#F5F3EE] font-medium rounded-lg hover:bg-[#A32020] transition-colors duration-280 border border-[#232427]"
            style={{ letterSpacing: '-0.005em' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main radar view
  return (
    <div className="min-h-screen bg-[#111214]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#111214] border-b border-[#232427]">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="p-3 rounded-lg bg-[#111214] border border-[#232427]">
                <svg className="w-6 h-6 text-[#C52A2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-serif text-[#F5F3EE]" style={{ letterSpacing: '-0.005em' }}>{radar.displayTitle || radar.query}</h1>
                <div className="flex items-center gap-4 text-sm mt-1" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>
                  {radar.durationMinutes && <span>{radar.durationMinutes} min</span>}
                  {radarData && (
                    <>
                      <span>•</span>
                      <span>{radarData.radar_items?.length || 0} signals</span>
                      <span>•</span>
                      <span>{radarData.scenarios?.length || 0} scenarios</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onRefresh}
              className="p-3 transition-colors hover:bg-[#111214] rounded-lg border border-[#232427]"
              style={{ color: 'rgba(245, 243, 238, 0.6)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="relative z-10">
        {viewMode === 'radar' && radarData && (
          <div className="max-w-7xl mx-auto px-8 py-16">
            <RadarChart
              signals={radarData.radar_items || []}
              onSignalClick={setSelectedSignal}
            />

            {radarData.scope && (
              <div className="mt-16 bg-[#111214] border border-[#232427] rounded-lg p-8">
                <h3 className="text-xl font-serif text-[#F5F3EE] mb-6" style={{ letterSpacing: '-0.005em' }}>Scope & Context</h3>
                <div className="space-y-6 text-[#F5F3EE]">
                  <div>
                    <span className="text-sm uppercase" style={{ color: 'rgba(245, 243, 238, 0.6)', letterSpacing: '0.05em' }}>Restatement</span>
                    <p className="mt-2 leading-relaxed">{radarData.scope.restatement}</p>
                  </div>
                  <div>
                    <span className="text-sm uppercase" style={{ color: 'rgba(245, 243, 238, 0.6)', letterSpacing: '0.05em' }}>Unit of Analysis</span>
                    <p className="mt-2">{radarData.scope.unit_of_analysis}</p>
                  </div>
                  {radarData.scope.dependent_variables && radarData.scope.dependent_variables.length > 0 && (
                    <div>
                      <span className="text-sm uppercase" style={{ color: 'rgba(245, 243, 238, 0.6)', letterSpacing: '0.05em' }}>Key Variables</span>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {radarData.scope.dependent_variables.map((variable, idx) => (
                          <span key={idx} className="px-4 py-2 bg-[#111214] text-[#F5F3EE] rounded text-sm border border-[#232427]">
                            {variable}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'signals' && radarData && (
          <div className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {radarData.radar_items?.map((signal, idx) => (
                <div
                  key={idx}
                  className="bg-[#111214] border border-[#232427] rounded-lg p-6 hover:border-[#C52A2F]/50 transition-all duration-280 cursor-pointer group"
                  onClick={() => setSelectedSignal(signal)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 rounded text-xs font-medium bg-[#111214] text-[#F5F3EE] border border-[#232427]">
                      {signal.ring}
                    </span>
                    <div className="text-[#C52A2F] text-lg">
                      {signal.direction === 'up' && '↑'}
                      {signal.direction === 'down' && '↓'}
                      {signal.direction === 'flat' && '→'}
                    </div>
                  </div>

                  <h4 className="text-[#F5F3EE] font-medium mb-3 group-hover:text-[#C52A2F] transition-colors leading-snug" style={{ letterSpacing: '-0.005em' }}>
                    {signal.title}
                  </h4>

                  <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>
                    {signal.rationale}
                  </p>

                  <div className="flex items-center gap-4 text-xs border-t border-[#232427] pt-4" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>
                    <span>Impact {signal.impact_0to5}/5</span>
                    <span>•</span>
                    <span>{signal.quadrant}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'scenarios' && radarData && (
          <div className="max-w-5xl mx-auto px-8 py-16 space-y-8">
            {radarData.scenarios?.map((scenario, idx) => (
              <div
                key={idx}
                className="bg-[#111214] border border-[#232427] rounded-lg p-10"
              >
                <h3 className="text-2xl font-serif text-[#F5F3EE] mb-6" style={{ letterSpacing: '-0.005em' }}>{scenario.name}</h3>

                {scenario.axes && scenario.axes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {scenario.axes.map((axis, axisIdx) => (
                      <span key={axisIdx} className="px-4 py-2 bg-[#111214] text-[#F5F3EE] rounded text-sm border border-[#232427]">
                        {axis}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-[#F5F3EE] mb-10 text-base leading-relaxed">{scenario.summary}</p>

                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-[#C52A2F] font-medium mb-4 text-sm uppercase" style={{ letterSpacing: '0.05em' }}>Opportunities</h4>
                    <ul className="space-y-3">
                      {scenario.implications?.opportunities?.map((opp, oppIdx) => (
                        <li key={oppIdx} className="text-[#F5F3EE] text-sm flex items-start gap-3 leading-relaxed">
                          <span className="text-[#C52A2F] mt-1">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#D93954] font-medium mb-4 text-sm uppercase" style={{ letterSpacing: '0.05em' }}>Hedges</h4>
                    <ul className="space-y-3">
                      {scenario.implications?.hedges?.map((hedge, hedgeIdx) => (
                        <li key={hedgeIdx} className="text-[#F5F3EE] text-sm flex items-start gap-3 leading-relaxed">
                          <span className="text-[#D93954] mt-1">•</span>
                          <span>{hedge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[#C52A2F] font-medium mb-4 text-sm uppercase" style={{ letterSpacing: '0.05em' }}>No-Regret Moves</h4>
                    <ul className="space-y-3">
                      {scenario.implications?.no_regret_moves?.map((move, moveIdx) => (
                        <li key={moveIdx} className="text-[#F5F3EE] text-sm flex items-start gap-3 leading-relaxed">
                          <span className="text-[#C52A2F] mt-1">•</span>
                          <span>{move}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'watchlist' && radarData && (
          <div className="max-w-7xl mx-auto px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {radarData.watchlist?.map((indicator, idx) => (
                <div
                  key={idx}
                  className="bg-[#111214] border border-[#232427] rounded-lg p-6"
                >
                  <h4 className="text-[#F5F3EE] font-medium mb-2 text-lg" style={{ letterSpacing: '-0.005em' }}>{indicator.metric}</h4>
                  <div className="text-sm mb-4" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>{indicator.unit}</div>

                  <div className="flex items-center gap-2 mb-6">
                    <span className={`px-3 py-1 rounded text-xs font-medium ${
                      indicator.expected_direction === 'up' ? 'bg-[#111214] text-[#C52A2F] border border-[#232427]' :
                      indicator.expected_direction === 'down' ? 'bg-[#111214] text-[#D93954] border border-[#232427]' :
                      'bg-[#111214] border border-[#232427]'
                    }`} style={{ color: indicator.expected_direction === 'flat' ? 'rgba(245, 243, 238, 0.6)' : undefined }}>
                      {indicator.expected_direction === 'up' && '↑ Expected to rise'}
                      {indicator.expected_direction === 'down' && '↓ Expected to fall'}
                      {indicator.expected_direction === 'flat' && '→ Expected stable'}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#D93954] font-medium">Amber threshold</span>
                      <span className="text-[#F5F3EE] font-mono text-xs">{indicator.alert_thresholds.amber}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#C52A2F] font-medium">Red threshold</span>
                      <span className="text-[#F5F3EE] font-mono text-xs">{indicator.alert_thresholds.red}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#232427]">
                    <div className="text-xs" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>Source: {indicator.source}</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>Frequency: {indicator.frequency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-[#111214] border border-[#232427] rounded-lg px-2 py-2">
          <div className="flex items-center gap-1">
            {[
              { id: 'radar' as ViewMode, label: 'Radar' },
              { id: 'signals' as ViewMode, label: 'Signals' },
              { id: 'scenarios' as ViewMode, label: 'Scenarios' },
              { id: 'watchlist' as ViewMode, label: 'Watchlist' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id)}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-280 ${
                  viewMode === view.id
                    ? 'bg-[#C52A2F] text-[#F5F3EE]'
                    : 'hover:bg-[#111214]'
                }`}
                style={{
                  color: viewMode === view.id ? '#F5F3EE' : 'rgba(245, 243, 238, 0.6)',
                  letterSpacing: '-0.005em'
                }}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Signal detail sidebar */}
      {selectedSignal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-end"
          onClick={() => setSelectedSignal(null)}
        >
          <div
            className="w-full max-w-2xl h-full bg-[#111214] border-l border-[#232427] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#111214] border-b border-[#232427] p-8 flex items-center justify-between z-10">
              <h3 className="text-2xl font-serif text-[#F5F3EE]" style={{ letterSpacing: '-0.005em' }}>Signal Details</h3>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-2 transition-colors hover:bg-[#111214] rounded-lg border border-[#232427]"
                style={{ color: 'rgba(245, 243, 238, 0.6)' }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-2 rounded text-sm font-medium bg-[#111214] border border-[#232427] text-[#F5F3EE]">
                    {selectedSignal.ring}
                  </span>
                  <span className="px-4 py-2 rounded text-sm font-medium bg-[#111214] border border-[#232427] text-[#F5F3EE]">
                    {selectedSignal.quadrant}
                  </span>
                </div>
                <h4 className="text-3xl font-serif text-[#F5F3EE] leading-snug" style={{ letterSpacing: '-0.005em' }}>{selectedSignal.title}</h4>
              </div>

              <div className="bg-[#111214] rounded-lg p-6 space-y-6 border border-[#232427]">
                <div className="grid grid-cols-3 gap-6">
                  {['Impact', 'Likelihood', 'Confidence'].map((label, idx) => {
                    const value = [selectedSignal.impact_0to5, selectedSignal.likelihood_0to5, selectedSignal.confidence_0to5][idx];
                    return (
                      <div key={label}>
                        <div className="text-sm mb-2" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>{label}</div>
                        <div className="text-3xl font-medium text-[#F5F3EE]">
                          {value}<span className="text-sm" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>/5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSignal.priority_score && (
                  <div className="pt-6 border-t border-[#232427]">
                    <div className="text-sm mb-2" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>Priority Score</div>
                    <div className="text-4xl font-medium text-[#C52A2F]">
                      {selectedSignal.priority_score.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h5 className="text-sm uppercase mb-4" style={{ color: 'rgba(245, 243, 238, 0.6)', letterSpacing: '0.05em' }}>Rationale</h5>
                <p className="text-[#F5F3EE] leading-relaxed text-base">{selectedSignal.rationale}</p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span style={{ color: 'rgba(245, 243, 238, 0.6)' }}>Direction: </span>
                  <span className="text-[#F5F3EE]">
                    {selectedSignal.direction === 'up' && '↑ Rising'}
                    {selectedSignal.direction === 'down' && '↓ Declining'}
                    {selectedSignal.direction === 'flat' && '→ Stable'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'rgba(245, 243, 238, 0.6)' }}>Uncertainty: </span>
                  <span className="text-[#F5F3EE] capitalize">{selectedSignal.uncertainty_class}</span>
                </div>
              </div>

              <div>
                <span className="text-sm" style={{ color: 'rgba(245, 243, 238, 0.6)' }}>Driver Type: </span>
                <span className="text-[#F5F3EE]">{selectedSignal.driver_type}</span>
              </div>

              {selectedSignal.citations && selectedSignal.citations.length > 0 && (
                <div>
                  <h5 className="text-sm uppercase mb-4" style={{ color: 'rgba(245, 243, 238, 0.6)', letterSpacing: '0.05em' }}>Citations</h5>
                  <div className="space-y-3">
                    {selectedSignal.citations.map((citation, idx) => (
                      <div key={idx} className="bg-[#111214] rounded-lg p-4 text-sm text-[#F5F3EE] leading-relaxed border border-[#232427]">
                        {citation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForesightRadarViewer;
