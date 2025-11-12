'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ForesightRadarQuery } from '@/types';
import { apiService } from '@/services/api';
import { authUtils } from '@/utils/auth';
import StrategyAndHeader from '@/components/StrategyAndHeader';
import ForesightRadarForm from '@/components/ForesightRadarForm';
import ForesightRadarCard from '@/components/ForesightRadarCard';
import ForesightRadarViewer from '@/components/ForesightRadarViewer';
import { QueryListSkeleton } from '@/components/LoadingSkeleton';
import ForesightRadarParticles from '@/components/ForesightRadarParticles';

export default function ForesightRadarPage() {
  const [radars, setRadars] = useState<ForesightRadarQuery[]>([]);
  const [filteredRadars, setFilteredRadars] = useState<ForesightRadarQuery[]>([]);
  const [selectedRadar, setSelectedRadar] = useState<ForesightRadarQuery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewRadar, setShowNewRadar] = useState(false);
  const router = useRouter();

  // Check authentication with 1-day expiry
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      router.push('/auth?redirect=foresight-radar');
      return;
    }
    loadRadars();
  }, [router]);

  // Apply filters whenever radars change
  useEffect(() => {
    setFilteredRadars([...radars]);
  }, [radars]);

  const loadRadars = async () => {
    try {
      const radarsList = await apiService.listForesightRadars();
      setRadars(radarsList);
    } catch (error) {
      console.error('Failed to load foresight radars:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadarSubmit = async (query: string) => {
    try {
      const response = await apiService.submitForesightRadar({ query });
      await loadRadars();

      const newRadars = await apiService.listForesightRadars();
      const newRadar = newRadars.find(r => r.queryId === response.queryId);
      if (newRadar) {
        setSelectedRadar(newRadar);
        setShowNewRadar(false);
      }
    } catch (error) {
      console.error('Failed to submit foresight radar:', error);
    }
  };

  const refreshSelectedRadar = async () => {
    if (!selectedRadar) return;

    try {
      const updatedRadar = await apiService.getForesightRadarStatus(selectedRadar.queryId);
      setSelectedRadar(updatedRadar);
      setRadars(prev => prev.map(r =>
        r.queryId === updatedRadar.queryId ? updatedRadar : r
      ));
    } catch (error) {
      console.error('Failed to refresh radar:', error);
    }
  };

  const handleDeleteRadar = async (queryId: string) => {
    if (!confirm('Are you sure you want to delete this foresight radar?')) return;

    try {
      await apiService.deleteForesightRadar(queryId);
      setRadars(prev => prev.filter(r => r.queryId !== queryId));
      if (selectedRadar?.queryId === queryId) {
        setSelectedRadar(null);
      }
    } catch (error) {
      console.error('Failed to delete radar:', error);
    }
  };

  const resetToMainView = () => {
    setSelectedRadar(null);
    setShowNewRadar(false);
  };

  const renderContent = () => {
    if (showNewRadar) {
      return <ForesightRadarForm onSubmit={handleRadarSubmit} isSubmitting={false} />;
    }

    if (selectedRadar) {
      return (
        <ForesightRadarViewer
          radar={selectedRadar}
          onRefresh={refreshSelectedRadar}
        />
      );
    }

    // Main dashboard view with radar cards
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Recent Radars</h2>
          <button
            onClick={loadRadars}
            className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <QueryListSkeleton />
          </div>
        ) : filteredRadars.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-dark-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No radars found</h3>
            <p className="text-gray-400">Start your first foresight radar to see results here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRadars.map((radar) => (
              <ForesightRadarCard
                key={radar.queryId}
                radar={radar}
                onClick={() => setSelectedRadar(radar)}
                onDelete={() => handleDeleteRadar(radar.queryId)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main component return
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Hero Section - Always Visible */}
      <div className="px-8 py-8 border-b border-dark-300/40">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center animate-fade-in">
            {/* Left Column - Content */}
            <div className="text-left">
              {/* Strategy& Logo */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-strategyand-accent rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-serif text-4xl font-bold">&</span>
                </div>
                <div>
                  <h1 className="text-2xl font-serif text-strategyand-off-white tracking-tight">Foresight Radar</h1>
                  <p className="text-sm text-strategyand-off-white/70">Ideation Center · Beta</p>
                </div>
              </div>

              {/* Main Headline */}
              <h2 className="font-serif text-5xl lg:text-6xl font-normal mb-6 text-strategyand-off-white leading-tight">
                Anticipate
                <br />
                <span className="text-strategyand-accent">emerging trends</span>
              </h2>

              {/* Divider */}
              <div className="h-1 w-32 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red mb-6"></div>

              {/* Description */}
              <p className="text-lg text-strategyand-off-white/80 mb-8 leading-relaxed">
                Scan high-trust sources for emerging trends, risks, and opportunities with STEEP-G analysis to anticipate future scenarios and strategic implications.
              </p>

              {/* Value Props */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-strategyand-accent font-serif text-3xl mb-2">STEEP-G</div>
                  <div className="text-xs text-strategyand-off-white/60">
                    Framework
                  </div>
                </div>
                <div>
                  <div className="text-strategyand-accent font-serif text-3xl mb-2">Trends</div>
                  <div className="text-xs text-strategyand-off-white/60">
                    Early signals
                  </div>
                </div>
                <div>
                  <div className="text-strategyand-accent font-serif text-3xl mb-2">Futures</div>
                  <div className="text-xs text-strategyand-off-white/60">
                    Scenario planning
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Foresight Animation */}
            <div className="relative h-96 lg:h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <ForesightRadarParticles />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Floating AI Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-32 left-64 w-24 h-24 bg-gradient-to-r from-gradient-from/15 to-gradient-via/15 rounded-full animate-float blur-xl"></div>
          <div className="absolute top-64 right-32 w-32 h-32 bg-gradient-to-r from-gradient-via/15 to-gradient-to/15 rounded-full animate-float animation-delay-1500 blur-xl"></div>
          <div className="absolute bottom-40 left-32 w-28 h-28 bg-gradient-to-r from-gradient-to/15 to-gradient-from/15 rounded-full animate-float animation-delay-3000 blur-xl"></div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-dark-700/50 backdrop-blur-lg border-r border-dark-300/40 flex flex-col relative z-20">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-dark-300/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gradient-from/30 to-gradient-via/30 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">Foresight Radar</h2>
              <p className="text-sm text-gray-400">Strategic Foresight Analysis</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewRadar(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-gradient-from to-gradient-to text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Radar
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={resetToMainView}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                !selectedRadar && !showNewRadar
                  ? 'bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-dark-600/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
                All Radars
              </div>
            </button>
          </div>
        </nav>

        {/* Footer */}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
        {/* Header with Strategy& Branding */}
        <header className="bg-dark-700/30 backdrop-blur-lg border-b border-dark-300/40 px-8 py-6 relative z-20">
          <StrategyAndHeader
            title="Foresight Radar"
            subtitle="Scan emerging trends with high-trust sources and STEEP-G analysis"
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-6">
              {selectedRadar && (
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-gray-500">/</span>
                  <span className="font-mono text-xs bg-dark-600/80 px-2 py-1 rounded">{selectedRadar.queryId}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
