'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/services/api';
import { PolicyIcon } from '@/components/Icons';

function AuthForm() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.authenticate(password);
      
      if (response.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('policy-drafter-auth', 'true'); // Keep for backward compatibility
        
        // Handle redirect parameter
        if (redirect === 'graph-builder') {
          router.push('/graph-builder');
        } else if (redirect === 'contextual-search') {
          router.push('/contextual-search');
        } else if (redirect === 'impact-analysis') {
          router.push('/impact-analysis');
        } else if (redirect === 'news-scrape') {
          router.push('/news-scrape');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating AI Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-gradient-from/20 to-gradient-via/20 rounded-full animate-float blur-xl"></div>
        <div className="absolute top-60 right-32 w-24 h-24 bg-gradient-to-r from-gradient-via/20 to-gradient-to/20 rounded-full animate-float animation-delay-1000 blur-xl"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-gradient-to/20 to-gradient-from/20 rounded-full animate-float animation-delay-2000 blur-xl"></div>
      </div>
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-block p-5 bg-gradient-to-br from-gradient-from to-gradient-via rounded-2xl mb-6 shadow-2xl animate-neural-pulse">
              <PolicyIcon className="text-white" size="xl" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 animate-scale-breath">
              <span style={{
                display: 'inline-block',
                background: 'linear-gradient(to right, #A32020, #D93954, #D93954)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                paddingLeft: '4px',
                paddingRight: '4px'
              }}>
                {redirect === 'graph-builder'
                  ? 'System Compass'
                  : redirect === 'contextual-search'
                  ? 'Contextual Web Search'
                  : redirect === 'impact-analysis'
                  ? 'Impact Evaluator'
                  : redirect === 'news-scrape'
                  ? 'News Horizon'
                  : 'Policy Bot'}
              </span>
            </h1>
            <p className="text-gray-300 text-lg font-medium mb-4">
              {redirect === 'graph-builder'
                ? 'Map complex social systems with data-driven causal relationships'
                : redirect === 'contextual-search'
                ? 'Extract comprehensive evidence across 30 source tiers for research excellence'
                : redirect === 'impact-analysis'
                ? 'Quantify the real-world impact of policies with evidence-based multiplier calculations'
                : redirect === 'news-scrape'
                ? 'Exhaustive news intelligence with AI-powered tag-based filtering and analysis'
                : 'AI-powered policy research, benchmarking and implementation planning for smarter policy decisions'}
            </p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Analyze global best practices, assess sentiment and perception, and generate actionable policy options with roadmaps and KPIs
            </p>
            <div className="mt-6 data-flow-bg h-1 w-48 mx-auto rounded-full"></div>
          </div>

          {/* Authentication Card */}
          <div className="neural-card p-8 animate-slide-up shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-gray-300 mb-3 text-sm font-medium">
                  Access Credentials
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-dark-500/80 backdrop-blur-sm border border-dark-300/50 rounded-xl focus:ring-2 focus:ring-gradient-from focus:border-gradient-from text-gray-100 placeholder-gray-400 transition-all shadow-sm"
                  placeholder="Enter access password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-status-error/20 border border-status-error/40 text-status-error px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="btn-primary w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  'Access Platform'
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-dark-400/30">
              <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-2">
                Authorized access only • Secure environment
                <span className="animate-neural-pulse">🔒</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-5 bg-gradient-to-br from-gradient-from to-gradient-via rounded-2xl mb-6 shadow-2xl">
              <PolicyIcon className="text-white" size="xl" />
            </div>
            <div className="loading-spinner mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthForm />
    </Suspense>
  );
}
