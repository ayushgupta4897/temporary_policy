'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ConvergingParticles from '@/components/ConvergingParticles'
import HowItWorksDropdown from '@/components/HowItWorksDropdown'
import { UI_CONFIG } from '@/config'

const ServiceCard = ({
  title,
  description,
  icon,
  enabled = false,
  href = '#',
  beta = false
}: {
  title: string
  description: string
  icon: React.ReactNode
  enabled?: boolean
  href?: string
  beta?: boolean
}) => {
  const content = (
    <div className={`
      relative p-8 rounded-lg flex flex-col h-full
      ${enabled
        ? 'strategyand-accent-card cursor-pointer group'
        : 'strategyand-card-glass cursor-not-allowed'
      }
    `}>
      {/* Icon in red circular disk - properly sized */}
      <div className={`
        w-16 h-16 rounded-full flex items-center justify-center mb-6 flex-shrink-0
        ${enabled ? 'bg-strategyand-accent text-white' : 'bg-gray-600 text-gray-400'}
      `}>
        {icon}
      </div>

      {/* Title */}
      <h4 className={`text-xl font-serif font-normal mb-3 tracking-tight ${enabled ? 'text-strategyand-off-white' : 'text-gray-400'}`}>
        {title}
        {beta && (
          <span className="ml-3 text-xs px-2 py-1 bg-strategyand-accent/20 text-strategyand-accent rounded-full font-sans">
            BETA
          </span>
        )}
      </h4>

      {/* Description - fixed height for consistency */}
      <p className={`text-sm leading-relaxed mb-6 min-h-[3rem] ${enabled ? 'text-strategyand-off-white/60' : 'text-gray-500'}`}>
        {description}
      </p>

      {/* Spacer to push CTA to bottom */}
      <div className="flex-grow"></div>

      {/* Single CTA */}
      {enabled && (
        <button className="text-sm font-medium text-strategyand-accent group-hover:opacity-80 transition-opacity text-left mt-auto">
          Start Analysis →
        </button>
      )}

      {!enabled && (
        <span className="text-sm text-gray-500 mt-auto">
          Coming Soon
        </span>
      )}
    </div>
  )

  if (enabled) {
    return (
      <Link href={href}>
        {content}
      </Link>
    )
  }

  return content
}

export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Geometric Background Elements - Strategy& Style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {/* Diagonal shapes inspired by Strategy& design */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-strategyand-maroon/20 to-transparent transform rotate-45 translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-strategyand-red/20 to-transparent transform -rotate-45 -translate-x-40 translate-y-40"></div>
      </div>

      {/* Header - Strategy& Style */}
      <header className="px-8 py-4 border-b border-dark-300/30 backdrop-blur-md bg-dark-600/40 relative z-10">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Strategy& Logo - Clickable Home Button */}
            <Link
              href="/"
              className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition-opacity"
              aria-label="Return to homepage"
            >
              <div className="w-12 h-12 bg-strategyand-maroon rounded flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-serif text-3xl font-bold">&</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-serif text-neutral-50">strategy&</span>
                <span className="text-[10px] font-serif italic text-neutral-400">Part of the PwC network</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <HowItWorksDropdown />
            <button
              onClick={() => router.push('/auth')}
              className="btn-primary px-8 py-2.5 text-sm font-medium"
            >
              Sign In
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section - Ideation Center Style */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20 animate-fade-in relative z-10">
            <div className="text-left">
              <h1 className="font-serif text-5xl lg:text-6xl font-normal mb-6 text-neutral-50 leading-tight">
                The Ideation Center
              </h1>
              <p className="text-xl lg:text-2xl text-neutral-200 mb-8 leading-relaxed font-light">
                {UI_CONFIG.TAGLINE}
              </p>
              <div className="h-1 w-32 rounded-full bg-gradient-to-r from-strategyand-maroon to-strategyand-red mb-8"></div>
              <p className="text-lg text-neutral-300 mb-8 leading-relaxed">
                Where evidence meets ambition. An AI-powered intelligence architecture that transforms policy concepts into government-ready strategies through exhaustive research, comparative analysis across peer nations, and scenario modeling that anticipates the unintended. Built for leaders who demand both intellectual rigor and actionable clarity.
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="btn-primary px-10 py-4 text-base font-medium shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Converging Particles Visualization */}
            <div className="relative h-96 lg:h-[500px]">
              <div className="absolute inset-0 flex items-center justify-center">
                <ConvergingParticles />
              </div>
            </div>
          </div>

          {/* Service Cards Grid */}
          <div className="mb-12 text-center">
            <h2 className="font-serif text-4xl font-normal text-neutral-50 mb-4">
              {UI_CONFIG.APP_NAME}
            </h2>
            <p className="text-lg text-neutral-300">
              Comprehensive tools for policy intelligence and strategic foresight
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto animate-slide-up">
            <ServiceCard
              title="Policy Bot"
              description="Turns policy ideas into implementation-ready strategies in minutes"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
              enabled={true}
              href="/auth"
            />

            <ServiceCard
              title="System Compass"
              description="Maps complex social systems with data-driven causal relationships"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=graph-builder"
            />

            <ServiceCard
              title="Impact Evaluator"
              description="Quantifies the real-world impact of policies with evidence and scenarios"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=impact-analysis"
            />

            <ServiceCard
              title="News Horizon"
              description="Exhaustive news intelligence with AI-powered tag-based filtering across regions, countries, topics, and industries"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=news-scrape"
              beta={true}
            />

            <ServiceCard
              title="Contextual Web Search"
              description="Extracts comprehensive evidence across 30 source tiers for research excellence"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=contextual-search"
            />

            <ServiceCard
              title="Dynamic Systems Modeler"
              description="Model intervention scenarios with custom taxonomy and evidence-based impact analysis"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=dsm"
              beta={true}
            />

            <ServiceCard
              title="Foresight Radar"
              description="Scans emerging trends to anticipate risks and opportunities with high-trust sources and STEEP-G analysis"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=foresight-radar"
              beta={true}
            />

            <ServiceCard
              title="Pulse Analyzer"
              description="Captures public and media sentiment to gauge policy resonance"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              enabled={false}
            />
          </div>
        </div>
      </main>

      {/* Footer - Strategy& Style */}
      <footer className="px-8 py-8 border-t border-dark-300/30 text-center backdrop-blur-sm bg-dark-600/40 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex justify-center items-center gap-2">
            <span className="text-neutral-400 font-serif text-sm">strategy&</span>
            <span className="text-neutral-500">|</span>
            <span className="text-neutral-500 text-xs italic">Part of the PwC network</span>
          </div>
          <p className="text-neutral-400 text-sm">© 2024 {UI_CONFIG.APP_SUBTITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
