'use client'

import type { Metadata } from 'next'
import Link from 'next/link'
import { motion, useInView, useAnimation } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

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

const Accordion = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
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

// Custom SVG Icons
const CitationNetworkIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="12" r="4" fill="currentColor"/>
    <circle cx="16" cy="28" r="4" fill="currentColor"/>
    <circle cx="48" cy="28" r="4" fill="currentColor"/>
    <circle cx="12" cy="48" r="4" fill="currentColor"/>
    <circle cx="32" cy="52" r="4" fill="currentColor"/>
    <circle cx="52" cy="48" r="4" fill="currentColor"/>
    <line x1="32" y1="16" x2="16" y2="24" stroke="currentColor" strokeWidth="2"/>
    <line x1="32" y1="16" x2="48" y2="24" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="32" x2="12" y2="44" stroke="currentColor" strokeWidth="2"/>
    <line x1="48" y1="32" x2="52" y2="44" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="32" x2="32" y2="48" stroke="currentColor" strokeWidth="2"/>
    <line x1="48" y1="32" x2="32" y2="48" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const BrainReasoningIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12 C20 12 14 18 14 28 C14 32 16 36 18 38 L18 48 C18 52 22 56 32 56 C42 56 46 52 46 48 L46 38 C48 36 50 32 50 28 C50 18 44 12 32 12 Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="26" cy="26" r="2" fill="currentColor"/>
    <circle cx="38" cy="26" r="2" fill="currentColor"/>
    <path d="M26 34 Q32 38 38 34" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M20 24 Q16 20 18 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M44 24 Q48 20 46 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const DataExtractionIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="20" y1="22" x2="44" y2="22" stroke="currentColor" strokeWidth="2"/>
    <line x1="20" y1="30" x2="38" y2="30" stroke="currentColor" strokeWidth="2"/>
    <line x1="20" y1="38" x2="42" y2="38" stroke="currentColor" strokeWidth="2"/>
    <circle cx="48" cy="48" r="8" fill="currentColor"/>
    <path d="M45 48 L47 50 L51 44" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const InteractiveGraphIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="48" height="38" rx="2" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="8" y1="52" x2="32" y2="56" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="56" y1="52" x2="32" y2="56" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="26" y1="56" x2="38" y2="56" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="20" cy="20" r="3" fill="currentColor"/>
    <circle cx="32" cy="28" r="3" fill="currentColor"/>
    <circle cx="44" cy="20" r="3" fill="currentColor"/>
    <circle cx="32" cy="36" r="3" fill="currentColor"/>
    <line x1="20" y1="23" x2="29" y2="26" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="35" y1="26" x2="41" y2="22" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="32" y1="31" x2="32" y2="33" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

// USP Icons
const ShieldIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 8 L12 16 L12 32 C12 44 20 52 32 56 C44 52 52 44 52 32 L52 16 Z" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <path d="M22 32 L28 38 L42 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2.5"/>
    <ellipse cx="32" cy="32" rx="8" ry="20" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="12" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="2.5"/>
    <path d="M32 12 Q40 20 40 32 Q40 44 32 52" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M32 12 Q24 20 24 32 Q24 44 32 52" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
)

const GraphIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="48" cy="16" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="16" cy="48" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="48" cy="48" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="32" cy="32" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <line x1="20" y1="19" x2="28" y2="29" stroke="currentColor" strokeWidth="2"/>
    <line x1="36" y1="29" x2="44" y2="19" stroke="currentColor" strokeWidth="2"/>
    <line x1="20" y1="45" x2="28" y2="35" stroke="currentColor" strokeWidth="2"/>
    <line x1="36" y1="35" x2="44" y2="45" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const LightningIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M36 8 L20 36 L32 36 L28 56 L48 28 L36 28 Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

export default function SystemCompassHowItWorks() {
  return (
    <div className="min-h-screen bg-dark-800 text-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #A32020 1px, transparent 0)',
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
              System Compass
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 font-spectral text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 to-neutral-400">
              Evidence-Based <br/>Systems Modeling
            </h1>
            <p className="text-xl text-neutral-300 max-w-3xl leading-relaxed">
              Parallel citation extraction from 12 high-trust source tiers. Geographic relevance tiering ensures local evidence primacy. Build comprehensive systems graphs with quantified relationships and KPI tracking.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Overview Section with Animated Stats */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-12 font-spectral text-center">What System Compass Does</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                number: 12,
                suffix: '',
                label: 'High-Trust Source Tiers',
                description: 'Official government statistics, UN/World Bank data, peer-reviewed journals, meta-analyses, and regional economic organizations'
              },
              {
                number: 4,
                suffix: '',
                label: 'Geographic Tiers',
                description: 'Query geography → Regional peers → Broader region → Global evidence with local validation needed'
              },
              {
                number: 100,
                suffix: '+',
                label: 'Evidence-Based Edges',
                description: 'Weighted relationships (0-1) based on effect magnitude, evidence quality, recency, and contextual relevance'
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(163, 32, 32, 0.2)' }}
                className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600 transition-all duration-300"
              >
                <div className="text-5xl font-bold text-strategyand-accent mb-2">
                  <CountUpStat end={stat.number} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-neutral-400 uppercase tracking-wide mb-2">{stat.label}</div>
                <p className="text-neutral-300 text-sm leading-relaxed">{stat.description}</p>
              </motion.div>
            ))}
          </div>

          <AnimatedSection>
            <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-8 rounded-lg border border-dark-600">
              <h3 className="text-xl font-bold mb-4">Why It Matters</h3>
              <p className="text-neutral-300 leading-relaxed mb-4">
                Traditional systems mapping relies on expert intuition and generic frameworks. System Compass grounds every node, edge, and relationship in published evidence from official sources. Geographic tiering ensures local evidence takes precedence over global generalizations.
              </p>
              <p className="text-neutral-300 leading-relaxed">
                The result: systems graphs where every connection is traceable to peer-reviewed research, government statistics, or international organization data. No assumptions. No placeholders. Pure evidence synthesis.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Workflow Section with Timeline */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-4 font-spectral">The Workflow</h2>
            <p className="text-neutral-400 mb-12 text-lg">Four parallel and sequential stages extracting, synthesizing, and visualizing systems evidence</p>
          </AnimatedSection>

          {/* Stage 1 */}
          <div className="relative mb-20">
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-strategyand-accent to-transparent hidden md:block"></div>

            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <div className="w-10 h-10 text-white">
                    <CitationNetworkIcon />
                  </div>
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 1: Parallel Citation Extraction</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">Batch Processing</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    Web search model extracts evidence from 12 high-trust source categories simultaneously
                  </p>

                  <Accordion title="View All 12 Source Categories" defaultOpen={false}>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      {[
                        { title: '1. Official Government Statistics', desc: 'Dubai Statistics Center, MOHAP UAE, national statistical offices' },
                        { title: '2. UN/World Bank/WHO Data', desc: 'Country profiles, development indicators, health statistics' },
                        { title: '3. High-Impact Journals', desc: 'Nature, Science, Lancet, JAMA, NEJM, BMJ' },
                        { title: '4. Peer-Reviewed General', desc: 'PubMed, PLOS, domain-specific academic journals' },
                        { title: '5. Regional Health Authorities', desc: 'Health ministries, public health centers, surveillance data' },
                        { title: '6. Universities & Research Institutes', desc: 'Institutional repositories, research centers, faculty publications' },
                        { title: '7. Think Tanks & Policy Institutes', desc: 'Emirates Policy Center, Dubai Future Foundation, regional centers' },
                        { title: '8. International Organizations', desc: 'UNDP, UNICEF, UNESCO, ILO country offices and assessments' },
                        { title: '9. Professional Associations', desc: 'Medical societies, clinical guidelines, position statements' },
                        { title: '10. National Surveys & Censuses', desc: 'Health surveys, demographic studies, validated survey instruments' },
                        { title: '11. Meta-Analyses & Reviews', desc: 'Cochrane reviews, systematic reviews, evidence synthesis' },
                        { title: '12. Regional Economic Organizations', desc: 'GCC-STAT, Arab Monetary Fund, development banks' }
                      ].map((source, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.02 }}
                          className="bg-dark-800/50 p-4 rounded border border-dark-600 transition-all duration-300"
                        >
                          <div className="font-medium text-strategyand-accent mb-2">{source.title}</div>
                          <p className="text-sm text-neutral-400">{source.desc}</p>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20">
                      <h5 className="font-medium mb-3">Geographic Tiering Strategy</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-strategyand-accent font-medium min-w-[80px]">Tier 1:</span>
                          <span className="text-neutral-300">Query geography-specific (e.g., UAE for UAE query)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-strategyand-accent font-medium min-w-[80px]">Tier 2:</span>
                          <span className="text-neutral-300">Regional peer countries (e.g., GCC for UAE)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-strategyand-accent font-medium min-w-[80px]">Tier 3:</span>
                          <span className="text-neutral-300">Broader region with comparable development levels</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-strategyand-accent font-medium min-w-[80px]">Tier 4:</span>
                          <span className="text-neutral-300">Global evidence with local validation needed (labeled clearly)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-neutral-400">
                      <span className="font-medium text-neutral-300">Processing:</span> 10 parallel searches, batch size 10, extracts structured citations with metadata
                    </div>
                  </Accordion>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Stage 2 */}
          <div className="relative mb-20">
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-strategyand-accent to-transparent hidden md:block"></div>

            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <div className="w-10 h-10 text-white">
                    <BrainReasoningIcon />
                  </div>
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 2: Evidence Synthesis</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">Deep Reasoning</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    High-reasoning model analyzes all citations to build comprehensive systems graph
                  </p>

                  <div className="bg-dark-900/50 backdrop-blur-sm p-6 rounded-lg border border-dark-700">
                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
                        <h4 className="font-bold mb-3">Inputs</h4>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>All extracted citations from 12 source categories</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Query focus issue</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Geographic context</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Time range parameters</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Optional intervention scenario</span>
                          </li>
                        </ul>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
                        <h4 className="font-bold mb-3">Reasoning Approach</h4>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Medium reasoning effort for deep analysis</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Synthesizes relationships from evidence</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Identifies causal pathways with citations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Quantifies edge weights from effect sizes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Extracts KPIs with current values and trends</span>
                          </li>
                        </ul>
                      </motion.div>
                    </div>

                    <div className="mt-6 bg-dark-800 p-4 rounded border border-dark-600">
                      <h5 className="font-medium mb-2">Three Integrated Outputs</h5>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-strategyand-accent font-medium mb-1">Output A</div>
                          <div className="text-neutral-400">Executive summary narrative</div>
                        </div>
                        <div>
                          <div className="text-strategyand-accent font-medium mb-1">Output B</div>
                          <div className="text-neutral-400">System graph JSON (nodes/edges)</div>
                        </div>
                        <div>
                          <div className="text-strategyand-accent font-medium mb-1">Output C</div>
                          <div className="text-neutral-400">Data tables CSV analytics</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Stage 3 */}
          <div className="relative mb-20">
            <div className="absolute left-8 top-20 bottom-0 w-0.5 bg-gradient-to-b from-strategyand-accent to-transparent hidden md:block"></div>

            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <div className="w-10 h-10 text-white">
                    <DataExtractionIcon />
                  </div>
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 3: Parallel Data Extraction</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">Max 3 Workers</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    Specialized extraction model parses three outputs simultaneously
                  </p>

                  <div className="bg-dark-900/50 backdrop-blur-sm p-6 rounded-lg border border-dark-700">
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        {
                          title: 'Extraction 1: Graph JSON',
                          items: ['Nodes with KPIs', 'Edge relationships', 'Metadata fields', 'Citation references']
                        },
                        {
                          title: 'Extraction 2: CSV Tables',
                          items: ['Node attributes table', 'Edge weights table', 'KPI values table', 'Analytics summaries']
                        },
                        {
                          title: 'Extraction 3: Summary',
                          items: ['Executive narrative', 'Key findings', 'System insights', 'Markdown formatting']
                        }
                      ].map((extraction, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className="bg-dark-800/50 p-4 rounded border border-dark-600 transition-all duration-300"
                        >
                          <div className="font-medium mb-2">{extraction.title}</div>
                          <ul className="text-sm text-neutral-400 space-y-1">
                            {extraction.items.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-4 text-sm text-neutral-400">
                      <span className="font-medium text-neutral-300">Parallel Processing:</span> All three extractions run simultaneously (max 3 workers) for optimal speed
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Stage 4 */}
          <div className="relative">
            <AnimatedSection>
              <div className="flex flex-col md:flex-row items-start gap-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-strategyand-maroon to-strategyand-accent flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-strategyand-accent/30 relative z-10"
                >
                  <div className="w-10 h-10 text-white">
                    <InteractiveGraphIcon />
                  </div>
                </motion.div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-4 mb-4">
                    <h3 className="text-2xl font-bold text-neutral-50 font-spectral">Stage 4: Interactive Visualization</h3>
                    <span className="text-sm text-neutral-400 px-3 py-1 bg-dark-800 rounded-full w-fit">HTML Output</span>
                  </div>
                  <p className="text-neutral-300 mb-6 leading-relaxed">
                    Transform graph JSON into interactive HTML network visualization
                  </p>

                  <div className="bg-dark-900/50 backdrop-blur-sm p-6 rounded-lg border border-dark-700">
                    <div className="grid md:grid-cols-2 gap-6">
                      <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
                        <h4 className="font-bold mb-3">Visualization Features</h4>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Network graph with force-directed layout</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Node sizing by severity (1-5 scale)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Edge thickness by weight (0-1)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Color coding by node type (driver/mediator/status/implication)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Hover tooltips with KPI data and citations</span>
                          </li>
                        </ul>
                      </motion.div>

                      <motion.div whileHover={{ scale: 1.02 }} className="transition-transform">
                        <h4 className="font-bold mb-3">Interaction Capabilities</h4>
                        <ul className="space-y-2 text-sm text-neutral-300">
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Zoom and pan navigation</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Click nodes to view detailed information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Filter by node type or edge strength</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Search nodes by label</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-strategyand-accent mt-1">•</span>
                            <span>Export as PNG or SVG</span>
                          </li>
                        </ul>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-12 font-spectral text-center">Key Features</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'Geographic Relevance Tiering',
                description: 'Prioritizes local evidence over global generalizations. Four-tier search strategy ensures query geography takes precedence, followed by regional peers, broader region, and finally global evidence with validation flags.'
              },
              {
                title: 'Evidence-Based Edge Weights',
                description: 'Every edge weight (0-1) calculated from four factors: effect magnitude from studies, evidence quality (RCT/meta-analysis highest), publication recency, and contextual relevance to query geography.'
              },
              {
                title: 'Quantified Node KPIs',
                description: 'Each node includes measurable KPI with current value, unit, year, and trend direction. Data extracted from official statistics, peer-reviewed studies, or international organization reports.'
              },
              {
                title: 'Parallel Processing Pipeline',
                description: '12 source category searches run in parallel (batch 10), followed by parallel extraction of graph JSON, CSV tables, and executive summary. Optimized for speed without sacrificing evidence quality.'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03, boxShadow: '0 20px 40px rgba(163, 32, 32, 0.15)' }}
                className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600 transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-neutral-300 mb-4">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outputs Section */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-4 font-spectral">What You Receive</h2>
            <p className="text-neutral-400 mb-12 text-lg">Comprehensive systems evidence package with multiple formats</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Interactive HTML Visualization',
                description: 'Force-directed network graph with zoom, pan, filtering, and detailed node/edge information on hover',
                format: 'HTML (self-contained, works offline)'
              },
              {
                title: 'Graph Data JSON',
                description: 'Complete graph structure with nodes, edges, metadata, KPIs, and citation references for programmatic analysis',
                format: 'JSON (machine-readable)'
              },
              {
                title: 'Analytics Tables CSV',
                description: 'Node attributes, edge weights, KPI values, and summary statistics for spreadsheet analysis',
                format: 'CSV (Excel/Numbers compatible)'
              },
              {
                title: 'Executive Summary',
                description: 'Narrative synthesis of key system dynamics, critical pathways, and evidence-based insights',
                format: 'Markdown (human-readable)'
              },
              {
                title: 'Full Analysis Document',
                description: 'Complete synthesis including all three outputs (summary, graph specification, data tables)',
                format: 'Markdown (comprehensive)'
              },
              {
                title: 'Citation Database',
                description: 'All extracted citations with metadata (source tier, geographic tier, DOI/URL, key findings)',
                format: 'JSON (structured references)'
              }
            ].map((output, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 2) * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="bg-dark-900 p-6 rounded-lg border border-dark-600 transition-all duration-300"
              >
                <div className="text-strategyand-accent font-bold mb-2">{output.title}</div>
                <p className="text-neutral-300 text-sm mb-3">{output.description}</p>
                <div className="text-xs text-neutral-500">Format: {output.format}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* USP Section - Why System Compass is Unique */}
      <section className="py-24 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-1.5 mb-4 text-sm font-medium bg-strategyand-accent/10 text-strategyand-accent rounded-full border border-strategyand-accent/20">
                What Makes Us Different
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 font-spectral text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 to-neutral-400">
                The System Compass Advantage
              </h2>
              <p className="text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
                Beyond traditional systems mapping: evidence-grounded, geographically-aware, and built for policy practitioners
              </p>
            </div>
          </AnimatedSection>

          {/* Core Differentiators */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {[
              {
                icon: <ShieldIcon />,
                title: 'Zero Assumptions',
                subtitle: 'Pure Evidence Synthesis',
                description: 'Traditional systems mapping relies on expert intuition, frameworks imported from other contexts, and assumptions about relationships. System Compass grounds every single node, edge, and relationship weight in published, peer-reviewed evidence or official government statistics.',
                highlights: [
                  'Every edge has a traceable citation',
                  'Node KPIs from official sources only',
                  'No placeholder relationships',
                  'Geographic context always specified'
                ]
              },
              {
                icon: <GlobeIcon />,
                title: 'Geographic Intelligence',
                subtitle: '4-Tier Relevance Hierarchy',
                description: 'Global evidence doesn\'t always apply locally. Our 4-tier geographic search strategy prioritizes local evidence first, then regional peers, broader region, and finally flags global evidence that requires local validation.',
                highlights: [
                  'Query geography takes absolute precedence',
                  'Regional peer comparison (e.g., GCC for UAE)',
                  'Comparable development-level contexts',
                  'Global evidence clearly labeled'
                ]
              },
              {
                icon: <GraphIcon />,
                title: 'Quantified Relationships',
                subtitle: 'Evidence-Based Edge Weights',
                description: 'Not all relationships are equal. We calculate edge weights (0-1) from four evidence factors: effect magnitude from studies, evidence quality (RCT/meta-analysis highest), publication recency, and contextual relevance to your query geography.',
                highlights: [
                  'Effect sizes from peer-reviewed studies',
                  'Quality-weighted by study design',
                  'Recency decay for time-sensitive topics',
                  'Contextual relevance scoring'
                ]
              },
              {
                icon: <LightningIcon />,
                title: 'Parallel Architecture',
                subtitle: 'Speed Without Compromise',
                description: 'Most evidence synthesis tools are sequential bottlenecks. We run 12 source category searches in parallel, then extract graph JSON, CSV tables, and executive summary simultaneously. Get comprehensive evidence analysis in minutes, not days.',
                highlights: [
                  'Batch-10 parallel search execution',
                  'Max-3 workers for data extraction',
                  'No trade-off between speed and depth',
                  'Optimized for policy timelines'
                ]
              }
            ].map((differentiator, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: (index % 2) * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-strategyand-accent/5 to-strategyand-maroon/5 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                <div className="relative bg-dark-800/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600 group-hover:border-strategyand-accent/40 transition-all duration-300 h-full">
                  <div className="flex items-start gap-4 mb-6">
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                      className="w-14 h-14 flex-shrink-0 rounded-lg bg-strategyand-accent/10 border border-strategyand-accent/30 flex items-center justify-center text-strategyand-accent"
                    >
                      {differentiator.icon}
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-50 mb-1">{differentiator.title}</h3>
                      <div className="text-sm text-strategyand-accent font-medium">{differentiator.subtitle}</div>
                    </div>
                  </div>

                  <p className="text-neutral-300 leading-relaxed mb-6">{differentiator.description}</p>

                  <div className="space-y-2">
                    {differentiator.highlights.map((highlight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        viewport={{ once: true }}
                        className="flex items-start gap-2 text-sm text-neutral-400"
                      >
                        <svg className="w-5 h-5 text-strategyand-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{highlight}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <AnimatedSection>
            <div className="bg-dark-800/50 backdrop-blur-sm rounded-lg border border-dark-600 overflow-hidden">
              <div className="bg-dark-900/80 px-8 py-4 border-b border-dark-700">
                <h3 className="text-2xl font-bold font-spectral">How System Compass Compares</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-900/50">
                    <tr>
                      <th className="px-8 py-4 text-left text-sm font-medium text-neutral-400 uppercase tracking-wide">Capability</th>
                      <th className="px-8 py-4 text-center text-sm font-medium text-strategyand-accent uppercase tracking-wide">System Compass</th>
                      <th className="px-8 py-4 text-center text-sm font-medium text-neutral-500 uppercase tracking-wide">Traditional Tools</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {[
                      {
                        capability: 'Evidence Grounding',
                        systemCompass: 'Every node and edge cited',
                        traditional: 'Expert intuition based'
                      },
                      {
                        capability: 'Geographic Awareness',
                        systemCompass: '4-tier relevance hierarchy',
                        traditional: 'Generic global frameworks'
                      },
                      {
                        capability: 'Relationship Quantification',
                        systemCompass: 'Calculated from effect sizes',
                        traditional: 'Binary or assumed strength'
                      },
                      {
                        capability: 'Source Diversity',
                        systemCompass: '12 parallel high-trust tiers',
                        traditional: 'Single database searches'
                      },
                      {
                        capability: 'Processing Speed',
                        systemCompass: 'Parallel architecture',
                        traditional: 'Sequential bottlenecks'
                      },
                      {
                        capability: 'Output Formats',
                        systemCompass: '6 formats (HTML, JSON, CSV, etc.)',
                        traditional: '1-2 static formats'
                      },
                      {
                        capability: 'KPI Tracking',
                        systemCompass: 'Current values with trends',
                        traditional: 'Conceptual labels only'
                      },
                      {
                        capability: 'Validation Transparency',
                        systemCompass: 'Full citation metadata',
                        traditional: 'Black box methodology'
                      }
                    ].map((row, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        viewport={{ once: true }}
                        className="hover:bg-dark-700/30 transition-colors"
                      >
                        <td className="px-8 py-4 text-neutral-300 font-medium">{row.capability}</td>
                        <td className="px-8 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-neutral-300 text-sm">{row.systemCompass}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span className="text-neutral-500 text-sm">{row.traditional}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>

          {/* Final Value Proposition */}
          <AnimatedSection>
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="mt-16 bg-gradient-to-br from-strategyand-maroon/20 via-dark-800/50 to-strategyand-accent/20 p-10 rounded-lg border border-strategyand-accent/30 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #A32020 1px, transparent 0)',
                  backgroundSize: '32px 32px'
                }}></div>
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-3 mb-6">
                  <div className="w-1 h-12 bg-strategyand-accent rounded-full"></div>
                  <h3 className="text-3xl font-bold font-spectral text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 to-neutral-400">
                    Built for Policy Practitioners
                  </h3>
                  <div className="w-1 h-12 bg-strategyand-accent rounded-full"></div>
                </div>

                <p className="text-xl text-neutral-300 leading-relaxed max-w-4xl mx-auto mb-8">
                  System Compass doesn't force you to choose between academic rigor and policy timelines. We deliver comprehensive, evidence-grounded systems analysis at the speed decision-makers need—without sacrificing depth, transparency, or geographic relevance.
                </p>

                <div className="flex flex-wrap justify-center gap-6 text-sm">
                  {[
                    '100% Evidence-Based',
                    'Geographic Priority',
                    'Quantified Relationships',
                    'Parallel Processing',
                    'Multiple Output Formats',
                    'Full Transparency'
                  ].map((badge, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.1 }}
                      className="px-4 py-2 bg-dark-800/80 backdrop-blur-sm rounded-full border border-strategyand-accent/40 text-strategyand-accent font-medium"
                    >
                      {badge}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 bg-dark-900 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <AnimatedSection>
            <h2 className="text-3xl font-bold mb-12 font-spectral text-center">Trust Indicators</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { stat: '100%', label: 'Official or Peer-Reviewed Sources' },
              { stat: '4-Tier', label: 'Geographic Relevance Hierarchy' },
              { stat: '12', label: 'Parallel Source Category Searches' },
              { stat: 'Cited', label: 'Every Node and Edge' }
            ].map((indicator, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="text-center transition-transform"
              >
                <div className="text-4xl font-bold text-strategyand-accent mb-2">{indicator.stat}</div>
                <div className="text-sm text-neutral-400">{indicator.label}</div>
              </motion.div>
            ))}
          </div>

          <AnimatedSection>
            <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-8 rounded-lg border border-strategyand-accent/20 text-center">
              <p className="text-xl text-neutral-300 leading-relaxed max-w-4xl mx-auto">
                System Compass doesn't make assumptions about system structure. Every node, every edge, every KPI value traces back to published evidence from government agencies, international organizations, or peer-reviewed academic journals. Geographic tiering ensures local evidence always takes priority.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}
