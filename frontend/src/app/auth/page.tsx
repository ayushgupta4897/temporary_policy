'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '@/services/api';
import { authUtils } from '@/utils/auth';
import { UI_CONFIG } from '@/config';
import ParticleSphere from '@/components/ParticleSphere';
import { LockIcon } from '@/components/icons/TabIcons';

function AuthForm() {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Check if already authenticated
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      // Already authenticated, redirect to appropriate page
      handleRedirect();
    }
  }, []);

  const handleRedirect = () => {
    if (redirect === 'graph-builder') {
      router.push('/graph-builder');
    } else if (redirect === 'contextual-search') {
      router.push('/contextual-search');
    } else if (redirect === 'impact-analysis') {
      router.push('/impact-analysis');
    } else if (redirect === 'news-scrape') {
      router.push('/news-scrape');
    } else if (redirect === 'foresight-radar') {
      router.push('/foresight-radar');
    } else if (redirect === 'dsm') {
      router.push('/dsm');
    } else {
      router.push('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.authenticate(password);

      if (response.success) {
        // Set authentication with 1-day expiry
        authUtils.setAuth();

        // Redirect to appropriate page
        handleRedirect();
      } else {
        setError(response.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPageTitle = () => {
    if (redirect === 'graph-builder') return 'System Compass';
    if (redirect === 'contextual-search') return 'Contextual Web Search';
    if (redirect === 'impact-analysis') return 'Impact Evaluator';
    if (redirect === 'news-scrape') return 'News Horizon';
    if (redirect === 'foresight-radar') return 'Foresight Radar';
    if (redirect === 'dsm') return 'Dynamic Systems Modeler';
    return UI_CONFIG.APP_NAME;
  };

  const getPageDescription = () => {
    if (redirect === 'graph-builder') return 'Map complex social systems with data-driven causal relationships';
    if (redirect === 'contextual-search') return 'Extract comprehensive evidence across 30 source tiers for research excellence';
    if (redirect === 'foresight-radar') return 'Scan emerging trends with high-trust sources and strategic foresight';
    if (redirect === 'impact-analysis') return 'Quantify the real-world impact of policies with evidence-based multiplier calculations';
    if (redirect === 'news-scrape') return 'Exhaustive news intelligence with AI-powered tag-based filtering and analysis';
    if (redirect === 'dsm') return 'Model intervention scenarios with custom taxonomy and evidence-based delta analysis';
    return UI_CONFIG.TAGLINE;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Geometric Background Elements - Strategy& Style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-strategyand-maroon/20 to-transparent transform rotate-45 translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-strategyand-red/20 to-transparent transform -rotate-45 -translate-x-40 translate-y-40"></div>
      </div>

      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Branding & Particle Sphere */}
            <div className="text-center lg:text-left">
              {/* Strategy& Logo - Clickable Home Button */}
              <Link
                href="/"
                className="flex items-center gap-3 justify-center lg:justify-start mb-8 group cursor-pointer hover:opacity-90 transition-opacity inline-flex"
                aria-label="Return to homepage"
              >
                <div className="w-16 h-16 bg-strategyand-maroon rounded flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <span className="text-white font-serif text-4xl font-bold">&</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-serif text-neutral-50">strategy&</span>
                  <span className="text-xs font-serif italic text-neutral-400">Part of the PwC network</span>
                </div>
              </Link>

              <h1 className="font-serif text-4xl lg:text-5xl font-normal mb-4 text-neutral-50 leading-tight">
                {getPageTitle()}
              </h1>

              <p className="text-lg text-neutral-300 mb-6 leading-relaxed">
                {getPageDescription()}
              </p>

              <div className="h-1 w-32 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red mb-8 mx-auto lg:mx-0"></div>

              <p className="text-sm text-neutral-400 mb-8">
                {UI_CONFIG.APP_SUBTITLE} • Secure access platform
              </p>

              {/* Particle Sphere */}
              <div className="hidden lg:block relative h-64 mt-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <ParticleSphere />
                </div>
              </div>
            </div>

            {/* Right: Authentication Form */}
            <div className="strategyand-card-elevated p-8 shadow-2xl">
              <h2 className="font-serif text-2xl font-normal text-neutral-50 mb-6">
                Access Platform
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-neutral-300 mb-2 text-sm font-medium">
                    Credentials
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Enter access password"
                    required
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-neutral-500">
                    Session valid for 24 hours after authentication
                  </p>
                </div>

                {error && (
                  <div className="bg-status-error/20 border border-status-error/40 text-status-error px-4 py-3 rounded-xl text-sm">
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
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-dark-400/30">
                <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-2">
                  Authorized access only • Secure environment
                  <LockIcon className="w-3 h-3 text-strategyand-maroon" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-strategyand-maroon rounded flex items-center justify-center shadow-md mb-4 mx-auto">
          <span className="text-white font-serif text-3xl font-bold">&</span>
        </div>
        <div className="loading-spinner mx-auto"></div>
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
