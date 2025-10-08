'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PolicyIcon } from '@/components/Icons'

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
      relative p-8 rounded-xl transition-all duration-300
      ${enabled
        ? 'neural-card hover:shadow-xl hover:-translate-y-2 cursor-pointer'
        : 'pwc-card-glass opacity-60 cursor-not-allowed'
      }
    `}>
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`
          p-5 rounded-lg transition-all duration-300
          ${enabled
            ? 'bg-primary-700 text-white shadow-md'
            : 'bg-dark-400/30 text-neutral-500'
          }
        `}>
          {icon}
        </div>
        <h3 className={`text-xl font-semibold ${enabled ? 'text-neutral-50' : 'text-neutral-400'}`}>
          {title}
        </h3>
        <p className={`text-sm leading-relaxed ${enabled ? 'text-neutral-200' : 'text-neutral-500'}`}>
          {description}
        </p>
        {!enabled && (
          <span className="absolute top-4 right-4 px-3 py-1 text-xs font-medium bg-dark-400/40 text-neutral-400 rounded-md border border-dark-300/30">
            Coming Soon
          </span>
        )}
        {enabled && beta && (
          <span className="absolute top-4 right-4 px-3 py-1 text-xs font-medium bg-primary-700 text-white rounded-md shadow-sm">
            Beta
          </span>
        )}
      </div>
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
      {/* Subtle Background Elements - Strategy& Style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-primary-700/10 to-primary-800/10 rounded-full animate-float blur-xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-primary-800/10 to-primary-700/10 rounded-full animate-float animation-delay-1000 blur-xl"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-r from-primary-700/10 to-dark-900/10 rounded-full animate-float animation-delay-2000 blur-xl"></div>
      </div>
      {/* Header - Strategy& Style */}
      <header className="px-8 py-6 border-b border-dark-300/50 backdrop-blur-sm bg-dark-800/50 relative z-10">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-700 shadow-md">
              <PolicyIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-semibold text-neutral-50">Policy Intelligence Suite</span>
          </div>
          <button
            onClick={() => router.push('/auth')}
            className="btn-primary"
          >
            Sign In
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-8 py-16">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section - Strategy& Style */}
          <div className="text-center mb-16 animate-fade-in relative z-10">
            <h1 className="text-6xl font-bold mb-4 text-neutral-50">
              Policy Intelligence Suite
            </h1>
            <p className="text-2xl text-neutral-200 mb-2 font-medium">Ideation Center</p>
            <p className="text-xl text-primary-700 font-semibold">Strategy&</p>
            <div className="mt-8 h-1 w-64 mx-auto rounded-full bg-gradient-to-r from-transparent via-primary-700 to-transparent"></div>
          </div>

          {/* Service Cards Grid */}
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
              title="Impact Evaluator"
              description="Quantifies the real-world impact of policies with evidence and scenarios"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              enabled={true}
              href="/auth?redirect=impact-analysis"
              beta={true}
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
              title="Pulse Analyzer"
              description="Captures public and media sentiment to gauge policy resonance"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              enabled={false}
            />
            
            <ServiceCard
              title="Foresight Radar"
              description="Scans emerging trends to anticipate risks and opportunities in policy"
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
              enabled={false}
            />
          </div>
        </div>
      </main>

      {/* Footer - Strategy& Style */}
      <footer className="px-8 py-6 border-t border-dark-300/40 text-center text-neutral-400 text-sm backdrop-blur-sm bg-dark-800/50 relative z-10">
        <p>© 2024 Policy Intelligence Suite. All rights reserved.</p>
      </footer>
    </div>
  )
}