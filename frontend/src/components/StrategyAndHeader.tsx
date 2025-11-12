'use client';

import Link from 'next/link';
import { UI_CONFIG } from '@/config';

interface StrategyAndHeaderProps {
  title: string;
  subtitle?: string;
  showBranding?: boolean;
}

export default function StrategyAndHeader({
  title,
  subtitle,
  showBranding = true,
}: StrategyAndHeaderProps) {
  return (
    <div className="mb-8 pb-6 border-b border-dark-300/30">
      {showBranding && (
        <div className="flex items-center gap-3 mb-6">
          {/* Strategy& Logo - Top Left - Clickable Home Button */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
            aria-label="Return to homepage"
          >
            <div className="w-10 h-10 bg-strategyand-maroon rounded flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <span className="text-white font-serif text-2xl font-bold">&</span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-serif text-neutral-50">strategy&</span>
              <span className="text-[9px] font-serif italic text-neutral-400">Part of the PwC network</span>
            </div>
          </Link>
          <span className="text-neutral-600 mx-2">|</span>
          <span className="text-sm font-sans text-neutral-300">{UI_CONFIG.APP_SUBTITLE}</span>
        </div>
      )}

      <div>
        <h1 className="font-serif text-4xl font-normal text-neutral-50 mb-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-neutral-300 font-light">
            {subtitle}
          </p>
        )}
      </div>

      {/* Accent line */}
      <div className="mt-4 h-0.5 w-24 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red"></div>
    </div>
  );
}
