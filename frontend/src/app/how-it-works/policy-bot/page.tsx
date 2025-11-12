'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'
import Link from 'next/link'
import type { Metadata } from 'next'

// Reusable Animation Components
const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

const CountUpStat = ({ end, duration = 2, suffix = "" }: { end: number, duration?: number, suffix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = (timestamp - startTime) / (duration * 1000)

      if (progress < 1) {
        setCount(Math.floor(end * progress))
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(end)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [isInView, end, duration])

  return <span ref={ref}>{count}{suffix}</span>
}

// Custom SVG Icons (Enhanced)
const MagnifyingGlassIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="3"/>
    <path d="M38 38L52 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <path d="M20 26L26 32L32 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const GlobalNetworkIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="2.5"/>
    <ellipse cx="32" cy="32" rx="12" ry="24" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="8" y1="32" x2="56" y2="32" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="32" y1="8" x2="32" y2="56" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="32" cy="12" r="2.5" fill="currentColor"/>
    <circle cx="32" cy="52" r="2.5" fill="currentColor"/>
    <circle cx="12" cy="32" r="2.5" fill="currentColor"/>
    <circle cx="52" cy="32" r="2.5" fill="currentColor"/>
  </svg>
)

const DocumentLayersIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="12" width="32" height="40" rx="2" stroke="currentColor" strokeWidth="2.5"/>
    <rect x="20" y="16" width="24" height="32" rx="1" stroke="currentColor" strokeWidth="2"/>
    <line x1="24" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="2"/>
    <line x1="24" y1="30" x2="40" y2="30" stroke="currentColor" strokeWidth="2"/>
    <line x1="24" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const ChatBubbleIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M52 20C52 14.477 47.523 10 42 10H22C16.477 10 12 14.477 12 20V36C12 41.523 16.477 46 22 46H28L36 54L44 46H42C47.523 46 52 41.523 52 36V20Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
    <circle cx="24" cy="28" r="2.5" fill="currentColor"/>
    <circle cx="32" cy="28" r="2.5" fill="currentColor"/>
    <circle cx="40" cy="28" r="2.5" fill="currentColor"/>
  </svg>
)

// Tabbed Interface Component
const TabGroup = ({ tabs }: { tabs: { label: string, content: React.ReactNode }[] }) => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              activeTab === index
                ? 'bg-strategyand-accent text-white shadow-lg shadow-strategyand-accent/30'
                : 'bg-dark-800/50 text-neutral-400 hover:text-neutral-200 hover:bg-dark-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {tabs[activeTab].content}
      </motion.div>
    </div>
  )
}

// Accordion Component
const Accordion = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-dark-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 bg-dark-800/30 hover:bg-dark-800/50 transition-colors flex items-center justify-between"
      >
        <span className="font-medium text-neutral-200">{title}</span>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-6 bg-dark-800/20">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// FAQ Accordion Component
const FAQAccordion = ({ question, category, children }: { question: string, category: string, children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  const categoryColors = {
    security: 'border-blue-600/30 bg-blue-900/10',
    technical: 'border-purple-600/30 bg-purple-900/10',
    quality: 'border-green-600/30 bg-green-900/10',
    consistency: 'border-orange-600/30 bg-orange-900/10',
    methodology: 'border-red-600/30 bg-red-900/10',
  }

  const categoryBorderColors = {
    security: 'border-l-blue-500',
    technical: 'border-l-purple-500',
    quality: 'border-l-green-500',
    consistency: 'border-l-orange-500',
    methodology: 'border-l-red-500',
  }

  return (
    <div className={`rounded-lg overflow-hidden border ${categoryColors[category as keyof typeof categoryColors] || 'border-dark-600'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-4 bg-dark-800/50 hover:bg-dark-800/70 transition-all duration-300 flex items-center justify-between border-l-4 ${categoryBorderColors[category as keyof typeof categoryBorderColors] || 'border-l-strategyand-accent'}`}
      >
        <span className="font-medium text-neutral-100 text-left">{question}</span>
        <svg
          className={`w-5 h-5 text-neutral-400 transition-transform flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="p-6 bg-dark-900/30">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export default function PolicyBotHowItWorks() {
  return (
    <div className="min-h-screen bg-dark-800 text-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #D93954 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-strategyand-accent mb-8 hover:opacity-80 transition-opacity">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-strategyand-accent/10 text-strategyand-accent rounded-full border border-strategyand-accent/20">
              Policy Bot
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 font-spectral text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 to-neutral-400">
              Evidence-Driven <br/>Policy Analysis
            </h1>
            <p className="text-xl text-neutral-300 max-w-3xl leading-relaxed">
              A comprehensive, AI-powered system that transforms policy ideas into implementation-ready strategies through evidence-based research, intelligent synthesis, and scenario planning.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-12 font-spectral text-center">By The Numbers</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { number: 150, suffix: '+', label: 'Verified Citations', sublabel: 'Per Analysis' },
                { number: 7, suffix: '', label: 'Deliverable Documents', sublabel: 'Full Mode' },
                { number: 180, suffix: '', label: 'Minutes Max Depth', sublabel: 'Research Phase' },
                { number: 5, suffix: '', label: 'Scenario Simulations', sublabel: 'Generated' }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(217, 57, 84, 0.2)' }}
                  className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600 text-center transition-all duration-300"
                >
                  <div className="text-5xl font-bold text-strategyand-accent mb-2">
                    <CountUpStat end={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm text-neutral-400 uppercase tracking-wide mb-1">{stat.label}</div>
                  <div className="text-xs text-neutral-500">{stat.sublabel}</div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Analysis Modes Section */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-4 font-spectral">Two Analysis Modes</h2>
            <p className="text-neutral-400 mb-12 text-lg">Choose the depth that matches your needs</p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Research Mode */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-dark-900/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-strategyand-accent/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-strategyand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-50 mb-2 font-spectral">Research Mode</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-strategyand-accent font-medium px-3 py-1 bg-strategyand-accent/10 rounded-full">30-180 minutes</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3 text-neutral-300">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Query elaboration and research scoping</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Deep evidence gathering with verified sources</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Comprehensive citation analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Ideal for feasibility studies and background research</span>
                  </li>
                </ul>
              </motion.div>

              {/* Full Analysis Mode */}
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-dark-900 to-dark-800 p-8 rounded-lg border-2 border-strategyand-accent/40 shadow-lg shadow-strategyand-accent/10"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-strategyand-accent flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-neutral-50 mb-2 font-spectral">Full Analysis</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-strategyand-accent font-medium px-3 py-1 bg-strategyand-accent/20 rounded-full border border-strategyand-accent/30">4-6 hours</span>
                      <span className="text-xs text-neutral-400 px-2 py-1 bg-dark-700/50 rounded">Recommended</span>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3 text-neutral-300">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-medium">Everything in Research Mode, plus:</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Implementation-ready policy document drafting</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>5 scenario simulations (best-case, worst-case, likely, resistance, resource-constraint)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>Quantitative analytics with metrics and visualizations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-strategyand-accent mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span>3 client-ready presentations (executive summary, strategy brief, full dossier)</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Workflow Timeline Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-4 font-spectral">The Workflow</h2>
            <p className="text-neutral-400 mb-16 text-lg">Four stages that transform ideas into actionable policies</p>
          </AnimatedSection>

          {/* Stage 1: Query Understanding */}
          <div className="relative mb-20">
            {/* Timeline connector */}
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-strategyand-accent to-transparent hidden md:block"></div>

            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <MagnifyingGlassIcon />
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 1: Query Understanding</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">~30 seconds</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    The system begins by deeply analyzing your policy question using high-reasoning AI models. This elaboration phase expands your initial query into a comprehensive research brief.
                  </p>

                  <Accordion title="What Happens in This Stage" defaultOpen={true}>
                    <ul className="space-y-3 text-sm text-neutral-300">
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Analyzes current policy landscape requirements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Identifies 5-7 peer countries for international benchmarking</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Defines policy instruments and implementation strategies to explore</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Maps stakeholder analysis framework</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Establishes resource requirements and risk mitigation approaches</span>
                      </li>
                    </ul>
                  </Accordion>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Stage 2: Evidence Collection */}
          <div className="relative mb-20">
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-strategyand-accent to-transparent hidden md:block"></div>

            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <GlobalNetworkIcon />
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 2: Deep Research & Evidence Gathering</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">120-180 minutes</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    The core research phase leverages advanced web search capabilities to conduct exhaustive evidence gathering from verified sources only. This is where the system builds a comprehensive evidence base for your policy.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(76, 175, 80, 0.1)' }}
                      className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-green-500/20"
                    >
                      <h4 className="font-medium text-neutral-50 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Trusted Sources Only
                      </h4>
                      <ul className="space-y-2 text-sm text-neutral-300">
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Government portals and official statistics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>UN agencies (UNDP, WHO, ILO)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Peer-reviewed academic journals</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Think tanks and research institutes</span>
                        </li>
                      </ul>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 30px rgba(244, 67, 54, 0.1)' }}
                      className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-red-500/20"
                    >
                      <h4 className="font-medium text-neutral-50 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                        </svg>
                        Explicitly Excluded
                      </h4>
                      <ul className="space-y-2 text-sm text-neutral-300">
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">✗</span>
                          <span>Blogs and social media</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">✗</span>
                          <span>Wikipedia and crowd-sourced content</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">✗</span>
                          <span>PR portals and marketing content</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-red-400">✗</span>
                          <span>Unverified news aggregators</span>
                        </li>
                      </ul>
                    </motion.div>
                  </div>

                  <Accordion title="Citation Verification Process">
                    <p className="text-sm text-neutral-300 mb-4">Every citation undergoes batch quality analysis to ensure credibility:</p>
                    <ul className="space-y-3 text-sm text-neutral-300">
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Source credibility assessment</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Relevance confirmation to policy question</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Key findings extraction</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-strategyand-accent mt-1 font-bold">→</span>
                        <span>Bias detection and transparency flagging</span>
                      </li>
                    </ul>
                  </Accordion>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Stage 3: Policy Synthesis */}
          <div className="relative mb-20">
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-strategyand-accent to-transparent hidden md:block"></div>

            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <DocumentLayersIcon />
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 3: Policy Synthesis & Scenario Planning</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">Full Mode Only | 35-45 minutes</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    With research complete, the system synthesizes all evidence into actionable policy documents, scenarios, and analytics.
                  </p>

                  <TabGroup tabs={[
                    {
                      label: 'Document Drafting',
                      content: (
                        <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-700 rounded-full">10-15 minutes</span>
                          </div>
                          <p className="text-sm text-neutral-300 mb-4">
                            Creates an implementation-ready policy document combining research findings, international benchmarks, and strategic recommendations.
                          </p>
                          <ul className="space-y-3 text-sm text-neutral-300">
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Synthesizes elaboration + research + verified citations</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Structures policy instruments and implementation pathways</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Includes stakeholder analysis and resource allocation</span>
                            </li>
                          </ul>
                        </div>
                      )
                    },
                    {
                      label: 'Scenario Simulation',
                      content: (
                        <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-700 rounded-full">10-15 minutes</span>
                          </div>
                          <p className="text-sm text-neutral-300 mb-4">
                            Generates 5 detailed implementation scenarios to anticipate outcomes and risks:
                          </p>
                          <div className="grid md:grid-cols-2 gap-3">
                            {[
                              { number: 1, label: 'Best-Case Scenario', color: 'green' },
                              { number: 2, label: 'Most Likely Scenario', color: 'amber' },
                              { number: 3, label: 'Worst-Case Scenario', color: 'red' },
                              { number: 4, label: 'Resistance/Opposition Scenario', color: 'purple' },
                              { number: 5, label: 'Resource Constraint Scenario', color: 'blue' }
                            ].map((scenario) => (
                              <motion.div
                                key={scenario.number}
                                whileHover={{ scale: 1.05 }}
                                className={`flex items-center gap-3 p-3 rounded-lg bg-${scenario.color}-500/10 border border-${scenario.color}-500/30`}
                              >
                                <span className={`text-${scenario.color}-400 font-bold text-lg`}>{scenario.number}.</span>
                                <span className="text-sm text-neutral-300">{scenario.label}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )
                    },
                    {
                      label: 'Data Analytics',
                      content: (
                        <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-700 rounded-full">5-10 minutes</span>
                          </div>
                          <p className="text-sm text-neutral-300 mb-4">
                            Generates quantitative analysis and visualization-ready data:
                          </p>
                          <ul className="space-y-3 text-sm text-neutral-300">
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Policy impact metrics and KPI frameworks</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Comparative analysis tables across peer countries</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Success metrics and monitoring indicators</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-strategyand-accent mt-1 font-bold">→</span>
                              <span>Chart-ready data for presentations</span>
                            </li>
                          </ul>
                        </div>
                      )
                    },
                    {
                      label: 'Presentations',
                      content: (
                        <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
                          <p className="text-sm text-neutral-300 mb-4">
                            Automatically generates 3 presentation documents tailored to different audiences:
                          </p>
                          <div className="space-y-4">
                            {[
                              { num: 1, title: 'Executive Summary', pages: '2 pages', audience: 'For C-suite leadership briefings' },
                              { num: 2, title: 'Strategy Brief', pages: '3-5 pages', audience: 'For internal teams and client presentations' },
                              { num: 3, title: 'Full Policy Dossier', pages: 'Complete', audience: 'Government-ready reference document with citations and annexes' }
                            ].map((doc) => (
                              <motion.div
                                key={doc.num}
                                whileHover={{ x: 5 }}
                                className="flex items-start gap-4 p-4 bg-dark-700/30 rounded-lg border border-dark-600/50"
                              >
                                <span className="text-strategyand-accent font-bold text-xl">{doc.num}.</span>
                                <div>
                                  <p className="font-medium text-neutral-50 mb-1">{doc.title}</p>
                                  <p className="text-xs text-strategyand-accent mb-1">{doc.pages}</p>
                                  <p className="text-sm text-neutral-400">{doc.audience}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  ]} />
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Stage 4: Interactive Chat */}
          <div className="relative">
            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <ChatBubbleIcon />
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 4: Intelligent Q&A System</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">5-70 seconds per query</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    After analysis completes, engage in real-time dialogue with your policy documents. The system intelligently decides whether to answer from existing knowledge or conduct additional research.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-medium text-neutral-50">Fast Mode</h4>
                        <span className="text-xs text-green-400 px-2 py-1 bg-green-400/10 rounded">5-10s</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-3">
                        For questions answered by existing policy documents:
                      </p>
                      <ul className="space-y-2 text-sm text-neutral-300">
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">→</span>
                          <span>Contextual understanding of full document set</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">→</span>
                          <span>Synthesizes across research, policy, scenarios, and analytics</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">→</span>
                          <span>Maintains conversation history for follow-up questions</span>
                        </li>
                      </ul>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="font-medium text-neutral-50">Research Mode</h4>
                        <span className="text-xs text-amber-400 px-2 py-1 bg-amber-400/10 rounded">35-70s</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-3">
                        For emerging questions requiring fresh research:
                      </p>
                      <ul className="space-y-2 text-sm text-neutral-300">
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">→</span>
                          <span>Conducts live web search for current information</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">→</span>
                          <span>Combines document knowledge with new findings</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">→</span>
                          <span>Provides citations for new sources</span>
                        </li>
                      </ul>
                    </motion.div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 bg-dark-800 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-12 font-spectral text-center">Built on Trust & Excellence</h2>
            <div className="bg-gradient-to-br from-dark-900 to-dark-800 p-8 rounded-lg border border-strategyand-accent/20 text-center">
              <p className="text-xl text-neutral-300 leading-relaxed max-w-4xl mx-auto">
                Policy Bot doesn't cut corners. Every citation verified. Every source vetted. Every recommendation grounded in evidence from government agencies, UN organizations, and peer-reviewed research. This is policy analysis at the highest standard.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section - Technical Clarifications */}
      <section className="py-24 bg-dark-800 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-1.5 mb-4 text-sm font-medium bg-strategyand-accent/10 text-strategyand-accent rounded-full border border-strategyand-accent/20">
                Technical FAQs
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-spectral text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 to-neutral-400">
                Common Questions & Clarifications
              </h2>
              <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                Technical and operational details for enterprise and government clients
              </p>
            </div>
          </AnimatedSection>

          <div className="space-y-3">
            {/* Security & Confidentiality */}
            <AnimatedSection>
              <FAQAccordion
                question="How is our query data handled and stored?"
                category="security"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    All query data and generated reports are stored in <strong>Microsoft Azure</strong> with enterprise-grade security:
                  </p>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Azure Table Storage:</strong> Query metadata, progress tracking, and status with IST timestamps</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Azure Blob Storage:</strong> All generated documents in markdown format (container: "policy-reports")</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Encryption:</strong> AES-256 encryption at rest, TLS 1.2+ in transit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Organization:</strong> Query-specific folders with unique IDs for easy retrieval</span>
                    </li>
                  </ul>
                  <div className="bg-dark-900/50 p-4 rounded border border-strategyand-accent/20 mt-4">
                    <p className="text-sm text-neutral-400">
                      <strong className="text-strategyand-accent">Current Configuration:</strong> We use standard OpenAI APIs with Azure storage. For enterprise deployments requiring enhanced data residency and compliance (Azure OpenAI Service), please contact our team for migration options.
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="What is OpenAI's data retention policy and how does it affect us?"
                category="security"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Standard OpenAI API Policy (Current Configuration):</strong>
                  </p>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>30-day retention:</strong> API inputs and outputs retained for 30 days for safety monitoring, then permanently deleted</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Not used for training:</strong> Commercial API data is never used to train OpenAI models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Ownership:</strong> You retain all rights to inputs and outputs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>SOC 2 Type 2:</strong> OpenAI API Platform is certified for SOC 2 Type 2 compliance</span>
                    </li>
                  </ul>

                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded border border-blue-600/30 mt-4">
                    <p className="text-sm font-medium text-blue-300 mb-2">Enterprise Option: Zero Data Retention (ZDR)</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      For regulated industries (healthcare, finance, government) with stricter privacy requirements, OpenAI offers <strong>Zero Data Retention</strong> where prompts and completions are never retained. We can configure this for your organization upon request.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded border border-purple-600/30 mt-4">
                    <p className="text-sm font-medium text-purple-300 mb-2">Alternative: Azure OpenAI Service</p>
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      Azure OpenAI Service provides additional data processing guarantees: prompts/data stored only in Microsoft Azure (not accessible to OpenAI), data zones for geographic boundaries (US or EU), and option for <strong>modified abuse monitoring</strong> (zero retention if approved).
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="Is our sensitive policy data used to train AI models?"
                category="security"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed text-lg font-medium">
                    <strong className="text-green-400">No.</strong> Your data is never used to train AI models.
                  </p>
                  <p className="text-neutral-300 leading-relaxed">
                    OpenAI's commercial API policy explicitly states that data from business customers (API users) is <strong>not used for training</strong> underlying AI models. This is a core privacy commitment for enterprise customers.
                  </p>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Your policy queries and generated reports remain confidential</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Data is not shared with other customers or third parties</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>You retain full ownership of all inputs and outputs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>OpenAI can sign Business Associate Agreements (BAA) for HIPAA compliance if needed</span>
                    </li>
                  </ul>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            {/* Technical Architecture */}
            <AnimatedSection>
              <FAQAccordion
                question="What AI models power the Policy Bot?"
                category="technical"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    Policy Bot uses a <strong>multi-model architecture</strong> optimized for different tasks based on complexity, cost, and performance:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-dark-900/50 p-4 rounded border border-purple-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <strong className="text-purple-300">O3 with Reasoning</strong>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">Query elaboration (~30 seconds)</p>
                      <p className="text-sm text-neutral-300">High-quality research blueprints with extended reasoning capabilities for complex policy understanding</p>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-blue-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <strong className="text-blue-300">O3-Deep-Research</strong>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">Exhaustive research (120-180 minutes)</p>
                      <p className="text-sm text-neutral-300">Web search with 180-minute timeout for comprehensive evidence gathering from trusted sources</p>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-green-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <strong className="text-green-300">O4-mini</strong>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">Batch processing (cost-effective)</p>
                      <p className="text-sm text-neutral-300">Citation analysis, document drafting, and analytics generation with excellent STEM capabilities</p>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-orange-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <strong className="text-orange-300">GPT-5</strong>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">Interactive Q&A routing</p>
                      <p className="text-sm text-neutral-300">Smart decision-making for chat mode selection with lowest hallucination rate (2.1%)</p>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-red-600/30">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <strong className="text-red-300">gpt-4o-search-preview</strong>
                      </div>
                      <p className="text-sm text-neutral-400 mb-2">Real-time web search</p>
                      <p className="text-sm text-neutral-300">Fast mode Q&A with live web search capabilities for current information</p>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20 mt-4">
                    <p className="text-sm text-neutral-300">
                      <strong className="text-strategyand-accent">Multi-Model Strategy Rationale:</strong> This approach balances cost, speed, and reasoning depth across the 7-stage pipeline. Each model is selected based on task requirements—O3 for complex reasoning, O4-mini for cost-effective bulk processing, GPT-5 for low-hallucination decisions.
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="Why use multiple AI models instead of one?"
                category="technical"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    Using a single model for all tasks would be inefficient and costly. Our multi-model architecture optimizes for three key factors:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded border border-purple-600/30">
                      <strong className="text-purple-300 block mb-2">1. Cost Optimization</strong>
                      <p className="text-sm text-neutral-300">
                        O4-mini handles bulk tasks (citation analysis, document drafting) at significantly lower cost than premium models, while O3 is reserved for complex reasoning tasks that require it.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded border border-blue-600/30">
                      <strong className="text-blue-300 block mb-2">2. Specialized Capabilities</strong>
                      <p className="text-sm text-neutral-300">
                        O3-deep-research provides exhaustive web search with 180-min timeouts, GPT-5 has the lowest hallucination rate (2.1%) for critical decisions, gpt-4o offers real-time search.
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded border border-green-600/30">
                      <strong className="text-green-300 block mb-2">3. Performance vs. Speed</strong>
                      <p className="text-sm text-neutral-300">
                        Query elaboration needs deep reasoning (O3, 30s), but chat routing needs fast decisions (GPT-5, 5-10s). Right model for right task ensures optimal user experience.
                      </p>
                    </div>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Example:</strong> For a Full Analysis mode query, we use O3 for elaboration, O3-deep-research for 180-minute comprehensive research, O4-mini for batch document generation (7 deliverables), and GPT-5 for Q&A routing. This hybrid approach provides enterprise-grade quality at practical cost.
                  </p>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="How long does the deep research phase take and why?"
                category="technical"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Research Mode:</strong> 30-120 minutes<br/>
                    <strong>Full Analysis Mode:</strong> 120-180 minutes
                  </p>
                  <p className="text-neutral-300 leading-relaxed">
                    This extended timeframe is intentional and critical for comprehensive, evidence-based policy analysis:
                  </p>
                  <ul className="space-y-2 text-neutral-300">
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Exhaustive Web Search:</strong> O3-deep-research model conducts real-time searches across government portals, UN agencies, peer-reviewed journals, think tanks, and statistical databases</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Source Verification:</strong> Each potential citation is evaluated for credibility, relevance, and evidence quality before inclusion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>International Benchmarking:</strong> Research includes 5-7 comparable countries for policy context and best practices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span><strong>Background Processing:</strong> Polling mechanism with 10-second intervals allows deep research to run asynchronously on Azure infrastructure</span>
                    </li>
                  </ul>
                  <div className="bg-dark-900/50 p-4 rounded border border-dark-600 mt-4">
                    <p className="text-sm text-neutral-400">
                      <strong className="text-neutral-300">Technical Details:</strong> We use OpenAI's deep-research client with <code className="text-strategyand-accent bg-dark-800 px-2 py-1 rounded">tools: [&quot;web_search_preview&quot;, &quot;code_interpreter&quot;]</code> and <code className="text-strategyand-accent bg-dark-800 px-2 py-1 rounded">timeout: 180 minutes</code> in background mode for Azure compatibility.
                    </p>
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Result:</strong> 150+ verified citations from trusted sources, ensuring every policy recommendation is grounded in credible evidence. This depth cannot be achieved with generic AI chatbots that use cached knowledge or surface-level searches.
                  </p>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            {/* Quality Assurance */}
            <AnimatedSection>
              <FAQAccordion
                question="How do you verify citation quality and prevent unreliable sources?"
                category="quality"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    We use a <strong>two-stage verification process</strong> to ensure only credible, high-quality sources make it into final reports:
                  </p>

                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-5 rounded border border-green-600/30">
                    <strong className="text-green-300 block mb-3 text-lg">Stage 1: Source Filtering (During Research)</strong>
                    <p className="text-sm text-neutral-300 mb-3">Our deep research prompts contain explicit exclusion criteria that filter out unreliable sources before they're even considered:</p>

                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-red-400 font-medium mb-2">✗ Explicitly Excluded:</div>
                        <ul className="space-y-1 text-neutral-400">
                          <li>• Personal blogs and opinion pieces</li>
                          <li>• Social media posts (Twitter, Facebook, LinkedIn)</li>
                          <li>• Wikipedia and crowd-sourced content</li>
                          <li>• PR portals and marketing materials</li>
                          <li>• Forums and discussion boards</li>
                          <li>• Unverified news aggregators</li>
                          <li>• Partisan political sites</li>
                          <li>• Sources without editorial oversight</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-green-400 font-medium mb-2">✓ Trusted Sources Only:</div>
                        <ul className="space-y-1 text-neutral-300">
                          <li>• Government portals and agencies</li>
                          <li>• UN agencies (WHO, UNDP, UNICEF, UNESCO)</li>
                          <li>• Peer-reviewed academic journals</li>
                          <li>• Established think tanks and policy institutes</li>
                          <li>• National statistical offices</li>
                          <li>• Central banks and development banks</li>
                          <li>• International organizations (World Bank, IMF)</li>
                          <li>• Regulatory authorities</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-5 rounded border border-blue-600/30">
                    <strong className="text-blue-300 block mb-3 text-lg">Stage 2: Citation Analysis (After Research)</strong>
                    <p className="text-sm text-neutral-300 mb-3">Each citation undergoes batch analysis (10 citations per batch) with O4-mini model evaluating:</p>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-blue-300 font-medium mb-2">Trust Score (1-10)</div>
                        <ul className="space-y-1 text-neutral-300">
                          <li>• Publisher reputation and authority</li>
                          <li>• Content quality and depth</li>
                          <li>• Author credentials and expertise</li>
                          <li>• Editorial standards and peer review</li>
                          <li>• Source independence and objectivity</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-blue-300 font-medium mb-2">Sentiment Score (1-10)</div>
                        <ul className="space-y-1 text-neutral-300">
                          <li>• Stance on policy topic (supportive/neutral/critical)</li>
                          <li>• Bias detection and ideological positioning</li>
                          <li>• Evidence-based vs. opinion-driven content</li>
                          <li>• Balance of perspectives presented</li>
                          <li>• Transparency about limitations</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20">
                    <p className="text-sm text-neutral-300">
                      <strong className="text-strategyand-accent">Result:</strong> Only sources meeting credibility standards (Trust Score 7+ from trusted categories) are included. This ensures 150+ verified citations per Full Analysis are all traceable to authoritative, peer-reviewed, or official government sources.
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="How detailed are your AI instructions (prompts)?"
                category="quality"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed text-lg">
                    <strong>Extremely detailed.</strong> Policy Bot uses over <span className="text-strategyand-accent font-bold">1,200 lines</span> of carefully engineered prompts across 5 stages.
                  </p>
                  <p className="text-neutral-300 leading-relaxed">
                    This is not generic "write a policy analysis" prompting. Each stage has specific formatting requirements, exclusion criteria, and output structures to ensure comprehensive, enterprise-grade deliverables:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-dark-900/50 p-4 rounded border border-purple-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-purple-300">Elaboration Prompt</strong>
                        <span className="text-sm text-neutral-500">~35 lines</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-2">Defines 8 research dimensions with specific output format requirements</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Policy problem definition methodology</li>
                        <li>• International benchmarking framework (5-7 countries)</li>
                        <li>• Policy instrument taxonomy requirements</li>
                        <li>• Stakeholder analysis structure</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-blue-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-blue-300">Research System Prompt</strong>
                        <span className="text-sm text-neutral-500">~117 lines</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-2">Exhaustive source requirements and explicit exclusion list</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Trusted source categories (12 types defined)</li>
                        <li>• Explicit exclusion list (8 categories to avoid)</li>
                        <li>• International benchmarking requirements (5-7 countries minimum)</li>
                        <li>• Policy instrument taxonomy (REGULATORY, ECONOMIC, INFORMATION, VOLUNTARY, HYBRID)</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-green-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-green-300">Policy Drafting Prompt</strong>
                        <span className="text-sm text-neutral-500">~215 lines</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-2">13-section document structure with specific formatting</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Instrument-tagged recommendations with enforcement mechanisms</li>
                        <li>• Citation format requirements ([^1] format mandatory)</li>
                        <li>• Table templates for international comparisons</li>
                        <li>• Professional policy language guidelines</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-orange-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-orange-300">Simulation Prompt</strong>
                        <span className="text-sm text-neutral-500">~367 lines</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-2">5 scenario framework with detailed analysis dimensions</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Best Case, Likely Case, Worst Case, Resistance, Resource Constraint</li>
                        <li>• 10+ analysis dimensions per scenario (timeline, budget, stakeholders, risks)</li>
                        <li>• Timeline adaptivity based on policy complexity</li>
                        <li>• Quantitative projection requirements</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-red-600/30">
                      <div className="flex items-center justify-between mb-2">
                        <strong className="text-red-300">Data Analytics Prompt</strong>
                        <span className="text-sm text-neutral-500">~500+ lines</span>
                      </div>
                      <p className="text-sm text-neutral-300 mb-2">Visual data presentation mandate with pre-defined formats</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• 70-80% visual data requirement (tables, charts)</li>
                        <li>• Markdown table format templates</li>
                        <li>• 6+ report sections with structured output</li>
                        <li>• Source credibility standards and citation linking</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-strategyand-maroon/20 to-strategyand-accent/20 p-4 rounded border border-strategyand-accent/30 mt-4">
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      <strong className="text-strategyand-accent">Enterprise-Grade Philosophy:</strong> This prompt engineering depth ensures comprehensive, structured outputs that meet government and enterprise standards. No generic AI chatbot can match this level of specificity and quality control without extensive custom prompting infrastructure.
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="How do you prevent AI hallucinations in policy recommendations?"
                category="quality"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    We use a <strong>multi-layered approach</strong> to prevent fabricated information from appearing in policy recommendations:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded border border-purple-600/30">
                      <strong className="text-purple-300 block mb-3">1. Citation-Driven Approach</strong>
                      <p className="text-sm text-neutral-300 mb-2">Every claim requires [^1] format citation linking to verified source:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• 215-line policy drafting prompt mandates citations</li>
                        <li>• Unsupported claims flagged during quality review</li>
                        <li>• Citation verification in batch analysis stage</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded border border-blue-600/30">
                      <strong className="text-blue-300 block mb-3">2. Verified Source Requirements</strong>
                      <p className="text-sm text-neutral-300 mb-2">117-line research prompt with explicit exclusion criteria:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Only government, UN, peer-reviewed, think tank sources</li>
                        <li>• Social media, blogs, Wikipedia explicitly excluded</li>
                        <li>• Trust Score (1-10) validation for each citation</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded border border-green-600/30">
                      <strong className="text-green-300 block mb-3">3. Low-Hallucination Models</strong>
                      <p className="text-sm text-neutral-300 mb-2">Strategic model selection based on hallucination rates:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• GPT-5: 2.1% hallucination rate (lowest ever)</li>
                        <li>• O3: 4.8% hallucination rate (reasoning optimized)</li>
                        <li>• Multi-model redundancy for critical decisions</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-4 rounded border border-orange-600/30">
                      <strong className="text-orange-300 block mb-3">4. Real-Time Research</strong>
                      <p className="text-sm text-neutral-300 mb-2">O3-deep-research with live web search (not cached knowledge):</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• 180-minute timeout for exhaustive search</li>
                        <li>• Current data (not training data cutoff)</li>
                        <li>• Direct URL linking for verification</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20">
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      <strong className="text-strategyand-accent">Result:</strong> Every percentage, every statistic, every policy example in our reports is traceable to an official government source, UN agency, peer-reviewed journal, or established think tank. This is fundamentally different from generic AI chatbots that generate plausible-sounding but often fabricated "facts."
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            {/* Consistency & Reproducibility */}
            <AnimatedSection>
              <FAQAccordion
                question="Will we get the same results if we run the same query multiple times?"
                category="consistency"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed text-lg">
                    <strong className="text-orange-400">No.</strong> Results will vary between runs, and this is intentional for several important reasons:
                  </p>

                  <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-5 rounded border border-orange-600/30">
                    <strong className="text-orange-300 block mb-3 text-lg">Why Results Vary</strong>

                    <div className="space-y-3 text-sm text-neutral-300">
                      <div>
                        <strong className="text-orange-200">1. Real-Time Research (Not Cached Data)</strong>
                        <p className="text-neutral-400 mt-1">
                          Policy Bot conducts live web search using O3-deep-research, which means citations and findings reflect <strong>current information</strong> at the time of analysis. New government reports, updated statistics, and recent policy developments will appear in later runs.
                        </p>
                      </div>

                      <div>
                        <strong className="text-orange-200">2. Non-Deterministic AI Generation</strong>
                        <p className="text-neutral-400 mt-1">
                          AI models use probabilistic generation without fixed seed parameters. While the core findings remain consistent, phrasing, synthesis structure, and emphasis will vary. This is similar to how two policy analysts would write different reports on the same topic while reaching similar conclusions.
                        </p>
                      </div>

                      <div>
                        <strong className="text-orange-200">3. Evolving Evidence Base</strong>
                        <p className="text-neutral-400 mt-1">
                          Policy research sources update constantly—new peer-reviewed studies, updated government statistics, recent international examples. Each analysis captures the <strong>most current evidence</strong> available at that moment.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-5 rounded border border-green-600/30">
                    <strong className="text-green-300 block mb-3 text-lg">What Remains Consistent</strong>

                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Structured Methodology:</strong> Same 7-stage pipeline, same prompt engineering framework, same quality standards</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Source Quality:</strong> Only trusted sources (government, UN, peer-reviewed) every time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Document Structure:</strong> Same 13-section policy brief, 5 scenarios, analytics format</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span><strong>Evidence Standards:</strong> Every claim cited, every source verified</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-blue-600/30 mt-4">
                    <p className="text-sm text-neutral-300 leading-relaxed mb-2">
                      <strong className="text-blue-300">Storage & Retrieval:</strong> All outputs are permanently stored in Azure Blob Storage with unique query IDs, allowing you to retrieve and reference original analyses even if you run the same query again later.
                    </p>
                    <p className="text-xs text-neutral-400">
                      This design prioritizes <strong>fresh, current research</strong> over exact reproducibility. For audit purposes, you can always reference the original analysis by query ID.
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="How do you ensure consistency in policy recommendations despite AI variability?"
                category="consistency"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    While exact phrasing varies between runs, we ensure <strong>methodological consistency</strong> and <strong>evidence standards</strong> through structured frameworks:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-dark-900/50 p-4 rounded border border-purple-600/30">
                      <strong className="text-purple-300 block mb-2">1. Detailed Prompt Engineering</strong>
                      <p className="text-sm text-neutral-300 mb-2">1,200+ lines of prompts define specific frameworks:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Policy instrument taxonomy (5 types always used)</li>
                        <li>• 13-section document structure (same every time)</li>
                        <li>• International benchmarking (5-7 countries minimum)</li>
                        <li>• Citation format requirements ([^1] mandatory)</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-blue-600/30">
                      <strong className="text-blue-300 block mb-2">2. Multi-Stage Validation</strong>
                      <p className="text-sm text-neutral-300 mb-2">Quality checks at each stage prevent drift:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Stage 1: Elaboration against 8 research dimensions</li>
                        <li>• Stage 2: Source filtering (trusted only)</li>
                        <li>• Stage 3: Citation verification (Trust Score 7+)</li>
                        <li>• Stage 4: Output structure validation</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-green-600/30">
                      <strong className="text-green-300 block mb-2">3. Structured Output Formats</strong>
                      <p className="text-sm text-neutral-300 mb-2">Pre-defined templates ensure consistency:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• Policy Brief: 13 sections with specific headings</li>
                        <li>• Scenarios: 5 types with 10+ analysis dimensions each</li>
                        <li>• Analytics: 70-80% visual data with table templates</li>
                        <li>• Presentations: 3 formats (executive/technical/stakeholder)</li>
                      </ul>
                    </div>

                    <div className="bg-dark-900/50 p-4 rounded border border-orange-600/30">
                      <strong className="text-orange-300 block mb-2">4. Evidence-Based Grounding</strong>
                      <p className="text-sm text-neutral-300 mb-2">All recommendations must trace to sources:</p>
                      <ul className="text-xs text-neutral-400 space-y-1">
                        <li>• No unsupported claims allowed</li>
                        <li>• Citation requirements in every prompt</li>
                        <li>• Source verification (government, UN, peer-reviewed)</li>
                        <li>• Batch citation analysis with quality scoring</li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Practical Example:</strong> Two Full Analysis runs on "UAE healthcare access" will use the same 13-section structure, same policy instrument taxonomy, same 5 scenario types, and same source quality standards. Citations may differ (different studies found), but the framework, methodology, and evidence standards remain identical.
                  </p>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            {/* Methodology & Approach */}
            <AnimatedSection>
              <FAQAccordion
                question="Why use this 7-stage pipeline instead of simpler approaches?"
                category="methodology"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    The 7-stage pipeline prioritizes <strong>quality over speed</strong>, ensuring comprehensive evidence-based analysis that meets government and enterprise standards:
                  </p>

                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded border border-purple-600/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                        <strong className="text-purple-300">Query Understanding</strong>
                      </div>
                      <p className="text-sm text-neutral-300">
                        <strong>Why necessary:</strong> Raw user queries like "improve healthcare" are too vague for research. O3 reasoning model transforms this into specific research blueprint with 8 dimensions, preventing superficial analysis.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded border border-blue-600/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                        <strong className="text-blue-300">Deep Research</strong>
                      </div>
                      <p className="text-sm text-neutral-300">
                        <strong>Why 120-180 minutes:</strong> Policy analysis requires exhaustive evidence gathering from government portals, UN agencies, peer-reviewed journals, think tanks—not just Google's first page. O3-deep-research with 180-min timeout finds 150+ verified citations.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded border border-green-600/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                        <strong className="text-green-300">Policy Synthesis</strong>
                      </div>
                      <p className="text-sm text-neutral-300">
                        <strong>Why 7 deliverables:</strong> Government policy teams need multiple formats: executive brief, technical analysis, scenario simulations, data analytics, stakeholder presentations. One generic document isn't sufficient for enterprise use.
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-4 rounded border border-orange-600/30">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                        <strong className="text-orange-300">Interactive Q&A</strong>
                      </div>
                      <p className="text-sm text-neutral-300">
                        <strong>Why two modes:</strong> Follow-up questions require different depth. "What's the budget?" needs fast answer (gpt-4o-search, 5-10s), while "Analyze alternative approaches" needs research depth (O3-deep-research, 30-180 min).
                      </p>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-5 rounded border border-strategyand-accent/30 mt-4">
                    <strong className="text-strategyand-accent block mb-3">Comparison: Generic AI Chatbots vs. Policy Bot</strong>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-red-400 font-medium mb-2">Generic AI (Single-Stage)</div>
                        <ul className="space-y-1 text-neutral-400">
                          <li>• One-shot response from cached knowledge</li>
                          <li>• No source verification or citation requirements</li>
                          <li>• Generic recommendations without context</li>
                          <li>• Single format (chat response)</li>
                          <li>• No international benchmarking</li>
                          <li>• Training data cutoff (outdated info)</li>
                        </ul>
                      </div>
                      <div>
                        <div className="text-green-400 font-medium mb-2">Policy Bot (7-Stage Pipeline)</div>
                        <ul className="space-y-1 text-neutral-300">
                          <li>• Multi-stage validation and synthesis</li>
                          <li>• 150+ verified citations from trusted sources</li>
                          <li>• Context-specific with international comparisons</li>
                          <li>• 7 deliverable formats for different audiences</li>
                          <li>• 5-7 country benchmarking mandatory</li>
                          <li>• Real-time research (current information)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="text-neutral-300 leading-relaxed">
                    <strong>Bottom Line:</strong> Simpler approaches (like generic AI chatbots) can generate <em>plausible-sounding</em> policy recommendations quickly. Policy Bot's 7-stage pipeline generates <em>evidence-backed, implementation-ready</em> strategies that meet government and enterprise standards—this requires depth over speed.
                  </p>
                </div>
              </FAQAccordion>
            </AnimatedSection>

            <AnimatedSection>
              <FAQAccordion
                question="What makes your prompt engineering enterprise-grade?"
                category="methodology"
              >
                <div className="space-y-4">
                  <p className="text-neutral-300 leading-relaxed">
                    Enterprise-grade prompting goes far beyond "write a policy analysis." Our 1,200+ line prompt infrastructure includes:
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-4 rounded border border-purple-600/30">
                      <strong className="text-purple-300 block mb-2">1. Explicit Exclusion Criteria</strong>
                      <p className="text-sm text-neutral-300 mb-2">Research prompt (117 lines) lists forbidden sources:</p>
                      <div className="bg-dark-900/50 p-3 rounded text-xs text-neutral-400 font-mono">
                        Exclude: blogs, social media, Wikipedia,<br/>
                        PR portals, forums, unverified news,<br/>
                        partisan sites, sources without<br/>
                        editorial oversight
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-4 rounded border border-blue-600/30">
                      <strong className="text-blue-300 block mb-2">2. International Benchmarking</strong>
                      <p className="text-sm text-neutral-300 mb-2">Mandatory comparative analysis framework:</p>
                      <div className="bg-dark-900/50 p-3 rounded text-xs text-neutral-400 font-mono">
                        Requirement: 5-7 comparable countries<br/>
                        Priority: Similar development level,<br/>
                        geographic proximity, policy history<br/>
                        Format: Table with citations
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-4 rounded border border-green-600/30">
                      <strong className="text-green-300 block mb-2">3. Policy Instrument Tagging</strong>
                      <p className="text-sm text-neutral-300 mb-2">Structured taxonomy for recommendations:</p>
                      <div className="bg-dark-900/50 p-3 rounded text-xs text-neutral-400 font-mono">
                        Categories: REGULATORY, ECONOMIC,<br/>
                        INFORMATION, VOLUNTARY, HYBRID<br/>
                        Each recommendation tagged with type<br/>
                        + enforcement mechanism
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 p-4 rounded border border-orange-600/30">
                      <strong className="text-orange-300 block mb-2">4. Visual Data Mandate</strong>
                      <p className="text-sm text-neutral-300 mb-2">Analytics prompt (500+ lines) requires:</p>
                      <div className="bg-dark-900/50 p-3 rounded text-xs text-neutral-400 font-mono">
                        70-80% of data in visual format<br/>
                        (tables, charts, comparisons)<br/>
                        Pre-defined markdown table templates<br/>
                        Source citations for every data point
                      </div>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20 mt-4">
                    <p className="text-sm text-neutral-300 leading-relaxed">
                      <strong className="text-strategyand-accent">Why This Matters:</strong> Generic prompting produces generic output. Enterprise-grade prompting with explicit exclusions, mandatory frameworks, structured taxonomies, and visual data requirements ensures consistent, professional deliverables that meet government and institutional standards.
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/10 to-blue-800/5 p-4 rounded border border-blue-600/20 mt-4">
                    <p className="text-xs text-neutral-400 italic">
                      "The difference between a prompt that says 'analyze this policy' and our 215-line policy drafting prompt is like the difference between asking someone to 'write a report' and providing them a comprehensive methodology, structure, citation requirements, and quality standards."
                    </p>
                  </div>
                </div>
              </FAQAccordion>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedSection>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-gradient-to-br from-dark-800 to-dark-900 p-12 rounded-lg border-2 border-strategyand-accent/40 shadow-2xl shadow-strategyand-accent/10"
            >
              <h2 className="text-3xl font-bold text-neutral-50 mb-4 font-spectral">
                Ready to Transform Your Policy Ideas?
              </h2>
              <p className="text-neutral-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Experience the power of AI-driven policy analysis with evidence-backed research and implementation-ready strategies.
              </p>
              <Link
                href="/auth"
                className="inline-block px-12 py-4 bg-strategyand-accent hover:bg-strategyand-red text-white font-medium rounded-lg transition-all duration-300 shadow-lg shadow-strategyand-accent/30 hover:shadow-xl hover:shadow-strategyand-accent/40 hover:scale-105"
              >
                Get Started with Policy Bot
              </Link>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
