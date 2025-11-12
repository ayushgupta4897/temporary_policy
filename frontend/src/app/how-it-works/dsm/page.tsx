import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works: Dynamic Systems Modeler | The Ideation Center',
  description: 'Three-stage evidence-based systems modeling with custom taxonomy and intervention scenarios',
}

// Custom SVG Icons
const TaxonomyTreeIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="8" width="16" height="8" rx="2" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="32" y1="16" x2="32" y2="24" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="16" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="16" y1="24" x2="16" y2="32" stroke="currentColor" strokeWidth="2"/>
    <line x1="32" y1="24" x2="32" y2="32" stroke="currentColor" strokeWidth="2"/>
    <line x1="48" y1="24" x2="48" y2="32" stroke="currentColor" strokeWidth="2"/>
    <rect x="10" y="32" width="12" height="6" rx="1.5" fill="currentColor"/>
    <rect x="26" y="32" width="12" height="6" rx="1.5" fill="currentColor"/>
    <rect x="42" y="32" width="12" height="6" rx="1.5" fill="currentColor"/>
    <rect x="10" y="44" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.6"/>
    <rect x="26" y="44" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.6"/>
    <rect x="42" y="44" width="12" height="6" rx="1.5" fill="currentColor" opacity="0.6"/>
    <line x1="16" y1="38" x2="16" y2="44" stroke="currentColor" strokeWidth="2"/>
    <line x1="32" y1="38" x2="32" y2="44" stroke="currentColor" strokeWidth="2"/>
    <line x1="48" y1="38" x2="48" y2="44" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

const DenseNetworkIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="12" r="4" fill="currentColor"/>
    <circle cx="16" cy="24" r="4" fill="currentColor"/>
    <circle cx="48" cy="24" r="4" fill="currentColor"/>
    <circle cx="12" cy="40" r="4" fill="currentColor"/>
    <circle cx="32" cy="40" r="4" fill="currentColor"/>
    <circle cx="52" cy="40" r="4" fill="currentColor"/>
    <circle cx="22" cy="52" r="4" fill="currentColor"/>
    <circle cx="42" cy="52" r="4" fill="currentColor"/>
    <line x1="32" y1="16" x2="16" y2="20" stroke="currentColor" strokeWidth="2"/>
    <line x1="32" y1="16" x2="48" y2="20" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="28" x2="12" y2="36" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="16" y1="28" x2="32" y2="36" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="48" y1="28" x2="52" y2="36" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="48" y1="28" x2="32" y2="36" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="44" x2="22" y2="48" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="32" y1="44" x2="22" y2="48" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="32" y1="44" x2="42" y2="48" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="52" y1="44" x2="42" y2="48" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="16" y1="24" x2="48" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
    <line x1="12" y1="40" x2="52" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
  </svg>
)

const InterventionDeltaIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="32" r="16" stroke="currentColor" strokeWidth="2.5"/>
    <circle cx="40" cy="32" r="16" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2"/>
    <path d="M36 28 L44 28 L44 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M44 28 L52 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="24" cy="32" r="2" fill="currentColor"/>
    <circle cx="40" cy="32" r="2" fill="currentColor"/>
  </svg>
)

const KPIDataIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="12" width="48" height="40" rx="3" stroke="currentColor" strokeWidth="2.5"/>
    <line x1="16" y1="22" x2="48" y2="22" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="32" x2="36" y2="32" stroke="currentColor" strokeWidth="2"/>
    <line x1="16" y1="42" x2="42" y2="42" stroke="currentColor" strokeWidth="2"/>
    <rect x="38" y="28" width="14" height="18" fill="currentColor" opacity="0.3"/>
    <rect x="38" y="36" width="14" height="10" fill="currentColor"/>
  </svg>
)

export default function DSMHowItWorks() {
  return (
    <div className="min-h-screen bg-dark-800 text-neutral-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #C52A2F 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }}></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-strategyand-accent/10 text-strategyand-accent rounded-full border border-strategyand-accent/20">
            Dynamic Systems Modeler
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 font-spectral text-transparent bg-clip-text bg-gradient-to-r from-neutral-50 to-neutral-400">
            Evidence-Based <br/>Systems Modeling
          </h1>
          <p className="text-xl text-neutral-300 max-w-3xl leading-relaxed">
            Three-stage pipeline: custom taxonomy generation, dense graph construction with quantified nodes and edges, intervention scenario modeling with delta analysis. Every relationship grounded in citations.
          </p>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 font-spectral">What DSM Does</h2>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600">
              <div className="text-strategyand-accent text-4xl font-bold mb-2">60</div>
              <div className="text-sm text-neutral-400 uppercase tracking-wide mb-2">Custom Taxonomy Nodes</div>
              <p className="text-neutral-300 text-sm leading-relaxed">
                User defines 10 parent categories. System generates 5 child nodes per parent = 50 children + 10 parents = 60 total nodes
              </p>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600">
              <div className="text-strategyand-accent text-4xl font-bold mb-2">100-200</div>
              <div className="text-sm text-neutral-400 uppercase tracking-wide mb-2">Evidence-Based Edges</div>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Dense network with 2.0-4.0 edge-to-node ratio. Includes cross-category connections, feedback loops, and hub nodes
              </p>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm p-8 rounded-lg border border-dark-600">
              <div className="text-strategyand-accent text-4xl font-bold mb-2">Unlimited</div>
              <div className="text-sm text-neutral-400 uppercase tracking-wide mb-2">Intervention Scenarios</div>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Test multiple policy interventions on same base graph. Each generates modified graph with delta analysis of changes
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-800 to-dark-900 p-8 rounded-lg border border-dark-600">
            <h3 className="text-xl font-bold mb-4">Why It Matters</h3>
            <p className="text-neutral-300 leading-relaxed mb-4">
              Generic systems frameworks force every policy issue into the same template. DSM starts with user-defined categories specific to the domain, then generates granular child nodes tailored to the query. The result: systems models that match the actual structure of the problem.
            </p>
            <p className="text-neutral-300 leading-relaxed">
              Every node includes quantified KPIs with current values, units, years, and trends extracted from evidence. Every edge weight calculated from effect magnitude, evidence quality, recency, and relevance. Intervention scenarios show system-wide ripple effects with delta comparisons.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-dark-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4 font-spectral">The 3-Stage Pipeline</h2>
          <p className="text-neutral-400 mb-12 text-lg">Custom taxonomy → Evidence-based graph → Intervention scenarios</p>

          {/* Stage 1 */}
          <div className="mb-16">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-strategyand-accent/10 rounded-lg flex items-center justify-center border border-strategyand-accent/30">
                <TaxonomyTreeIcon />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-strategyand-accent uppercase tracking-wide">Stage 1</span>
                  <span className="text-2xl font-bold">Taxonomy Generation</span>
                </div>
                <p className="text-neutral-400 mb-4">User defines 10 parent categories. System generates 5 specific children per parent (2-3 minutes)</p>
              </div>
            </div>

            <div className="bg-dark-900/50 backdrop-blur-sm p-6 rounded-lg border border-dark-700 ml-22">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-bold mb-3">User Input Required</h4>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="text-strategyand-accent mt-1">•</span>
                      <span><strong>Main Query:</strong> The policy issue or system being modeled</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-strategyand-accent mt-1">•</span>
                      <span><strong>10 Parent Categories:</strong> High-level domains specific to the query</span>
                    </li>
                  </ul>
                  <div className="mt-4 bg-dark-800 p-3 rounded border border-dark-600 text-xs text-neutral-400">
                    <strong className="text-neutral-300">Example for UAE Healthcare:</strong>
                    <div className="mt-2 space-y-1">
                      <div>1. Healthcare Access</div>
                      <div>2. Disease Burden</div>
                      <div>3. Lifestyle Factors</div>
                      <div>4. Healthcare Quality</div>
                      <div>5. Economic Factors</div>
                      <div className="text-neutral-500">... 5 more categories</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold mb-3">System Generation Process</h4>
                  <ul className="space-y-2 text-sm text-neutral-300">
                    <li className="flex items-start gap-2">
                      <span className="text-strategyand-accent mt-1">•</span>
                      <span>High-reasoning model analyzes main query + each parent category</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-strategyand-accent mt-1">•</span>
                      <span>Generates 5 specific, measurable child nodes per parent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-strategyand-accent mt-1">•</span>
                      <span>Parallel generation across all 10 parents (5 workers)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-strategyand-accent mt-1">•</span>
                      <span>Validates 2-7 children per parent (target: 5)</span>
                    </li>
                  </ul>
                  <div className="mt-4 bg-dark-800 p-3 rounded border border-dark-600 text-xs text-neutral-400">
                    <strong className="text-neutral-300">Example Children (Healthcare Access):</strong>
                    <div className="mt-2 space-y-1">
                      <div>• Hospital density per capita</div>
                      <div>• Insurance coverage rate</div>
                      <div>• Wait times for specialists</div>
                      <div>• Geographic accessibility</div>
                      <div>• Primary care availability</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20">
                <h5 className="font-medium mb-2">Output: Custom Taxonomy JSON</h5>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">10 Parent Nodes</div>
                    <div className="text-neutral-400">Category groupings</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">50 Child Nodes</div>
                    <div className="text-neutral-400">Specific measurable factors</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">60 Total Nodes</div>
                    <div className="text-neutral-400">Ready for graph construction</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="mb-16">
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-strategyand-accent/10 rounded-lg flex items-center justify-center border border-strategyand-accent/30">
                <DenseNetworkIcon />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-strategyand-accent uppercase tracking-wide">Stage 2</span>
                  <span className="text-2xl font-bold">Base Graph Construction</span>
                </div>
                <p className="text-neutral-400 mb-4">Evidence extraction for all nodes, then high-reasoning synthesis into dense network (10-15 minutes)</p>
              </div>
            </div>

            <div className="bg-dark-900/50 backdrop-blur-sm p-6 rounded-lg border border-dark-700 ml-22">
              <div className="mb-6">
                <h4 className="font-bold mb-4 text-lg">Step 1: Citation Extraction (Web Search - Parallel)</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-2 text-strategyand-accent">Process</h5>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Searches evidence for each of 50 child nodes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>10 parallel searches at a time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Extracts KPIs (current values, units, trends)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Identifies relationships with other nodes</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-strategyand-accent">Extracted Data</h5>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>KPI name and current numeric value</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Unit of measurement and year</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Trend direction (up/down/flat)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Citations with DOI/URL</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold mb-4 text-lg">Step 2: Graph Construction (High-Reasoning Model)</h4>

                <div className="mb-6">
                  <h5 className="font-medium mb-3 text-strategyand-accent">Node Requirements (60 Total)</h5>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-dark-800/50 p-4 rounded border border-dark-600">
                      <div className="font-medium mb-2">Parent Nodes (10)</div>
                      <ul className="text-sm text-neutral-400 space-y-1">
                        <li>• Type: "category" (reserved)</li>
                        <li>• Connect only to own children</li>
                        <li>• No KPI data required</li>
                        <li>• Grouping function only</li>
                      </ul>
                    </div>

                    <div className="bg-dark-800/50 p-4 rounded border border-dark-600">
                      <div className="font-medium mb-2">Child Nodes (50)</div>
                      <ul className="text-sm text-neutral-400 space-y-1">
                        <li>• KPI: name, value, unit, year, trend</li>
                        <li>• Severity: 1-5 scale</li>
                        <li>• Type: driver/mediator/status/implication</li>
                        <li>• Citations: 1-3 sources</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-dark-600">
                    <h6 className="font-medium mb-2">Node Type Distribution</h6>
                    <div className="grid md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-strategyand-accent font-medium">Drivers (30-40%)</div>
                        <div className="text-neutral-400">Root causes</div>
                      </div>
                      <div>
                        <div className="text-strategyand-accent font-medium">Mediators (40-50%)</div>
                        <div className="text-neutral-400">Pathways</div>
                      </div>
                      <div>
                        <div className="text-strategyand-accent font-medium">Status Quo (10-15%)</div>
                        <div className="text-neutral-400">Current state</div>
                      </div>
                      <div>
                        <div className="text-strategyand-accent font-medium">Implications (5-10%)</div>
                        <div className="text-neutral-400">Outcomes</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-3 text-strategyand-accent">Edge Requirements (100-200)</h5>
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h6 className="font-medium mb-2">Connectivity Rules</h6>
                      <ul className="space-y-2 text-sm text-neutral-300">
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span>Edge-to-node ratio: 2.0-4.0 (dense network)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span>20-30 cross-category edges (connect different parents)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span>8-12 bidirectional feedback loops (A ↔ B)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span>5-8 hub nodes with degree ≥ 10</span>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h6 className="font-medium mb-2">Edge Properties</h6>
                      <ul className="space-y-2 text-sm text-neutral-300">
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span><strong>Weight (0-1):</strong> magnitude × quality × recency × relevance</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span><strong>Relation:</strong> causal, associational, feedback</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span><strong>Sign:</strong> + (positive) or - (negative)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-strategyand-accent mt-1">•</span>
                          <span><strong>Confidence:</strong> high, medium, low</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-dark-800 p-4 rounded border border-strategyand-accent/20">
                    <h6 className="font-medium mb-2">Edge Weight Formula</h6>
                    <div className="text-sm text-neutral-300 font-mono bg-dark-900 p-3 rounded">
                      weight = min(0.95, magnitude × quality × recency × relevance)
                    </div>
                    <div className="mt-3 text-xs text-neutral-400">
                      Each factor scored 0-1. Magnitude from effect sizes (OR, RR, correlation). Quality from methodology (RCT=0.95, meta-analysis=0.95, cohort=0.8). Recency ≤3yrs=1.0. Relevance from context match.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 p-4 rounded border border-dark-600">
                <h5 className="font-medium mb-2">Step 3: Outputs Generated</h5>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Base Graph JSON</div>
                    <div className="text-neutral-400">60 nodes, 100-200 edges, all metadata</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Interactive HTML</div>
                    <div className="text-neutral-400">Force-directed network visualization</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Taxonomy JSON</div>
                    <div className="text-neutral-400">Hierarchical category structure</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage 3 */}
          <div>
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0 w-16 h-16 bg-strategyand-accent/10 rounded-lg flex items-center justify-center border border-strategyand-accent/30">
                <InterventionDeltaIcon />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-strategyand-accent uppercase tracking-wide">Stage 3</span>
                  <span className="text-2xl font-bold">Intervention Scenarios</span>
                </div>
                <p className="text-neutral-400 mb-4">Test policy interventions on base graph. Repeatable for multiple scenarios (10-15 min each)</p>
              </div>
            </div>

            <div className="bg-dark-900/50 backdrop-blur-sm p-6 rounded-lg border border-dark-700 ml-22">
              <div className="mb-6">
                <h4 className="font-bold mb-4 text-lg">Step 1: Intervention Evidence Search (Web Search)</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-2 text-strategyand-accent">Search Strategy</h5>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Searches for intervention-specific evidence</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Focuses on impact of proposed intervention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Targets system nodes likely to be affected</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Parallel searches (5 workers)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-strategyand-accent">Evidence Extracted</h5>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Quantitative impact on specific nodes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Expected KPI value changes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>New relationships created by intervention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Edge weight modifications</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold mb-4 text-lg">Step 2: Graph Modification (High-Reasoning Model)</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-2 text-strategyand-accent">Modification Process</h5>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Takes base graph + intervention evidence</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Modifies node KPIs based on evidence</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Updates edge weights for affected relationships</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Maintains graph structure consistency</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium mb-2 text-strategyand-accent">Changes Tracked</h5>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Nodes with KPI value shifts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>Edges with weight changes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>New edges created</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-strategyand-accent mt-1">•</span>
                        <span>System-wide ripple effects</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-bold mb-4 text-lg">Step 3: Delta Calculation</h4>
                <div className="bg-dark-800/50 p-4 rounded border border-dark-600">
                  <p className="text-sm text-neutral-300 mb-3">
                    Compares base graph vs intervention graph to quantify changes:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-neutral-300">
                    <div>
                      <div className="font-medium text-strategyand-accent mb-2">Node-Level Deltas</div>
                      <ul className="space-y-1 text-neutral-400">
                        <li>• Original KPI value → Modified value</li>
                        <li>• Percentage change calculation</li>
                        <li>• Trend direction changes</li>
                        <li>• Severity rating shifts</li>
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-strategyand-accent mb-2">Edge-Level Deltas</div>
                      <ul className="space-y-1 text-neutral-400">
                        <li>• Original weight → Modified weight</li>
                        <li>• Relationship strength changes</li>
                        <li>• New relationships added</li>
                        <li>• Removed relationships</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-dark-800 p-4 rounded border border-dark-600">
                <h5 className="font-medium mb-2">Step 4: Outputs Generated</h5>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Modified Graph JSON</div>
                    <div className="text-neutral-400">Updated node KPIs and edge weights</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Delta Analysis JSON</div>
                    <div className="text-neutral-400">All changes from base to intervention</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Interactive Visualization</div>
                    <div className="text-neutral-400">Shows changes highlighted in network</div>
                  </div>
                  <div>
                    <div className="text-strategyand-accent font-medium mb-1">Executive Summary</div>
                    <div className="text-neutral-400">System-wide impacts explained</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-dark-900">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 font-spectral">Key Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
              <div className="flex items-start gap-3 mb-3">
                <KPIDataIcon />
                <h3 className="text-xl font-bold">Quantified Node KPIs</h3>
              </div>
              <p className="text-neutral-300">
                Every child node includes real KPI data: current numeric value, unit of measurement, year, and trend direction (up/down/flat). Data extracted from citations during evidence search. No placeholders.
              </p>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-full h-full max-w-[48px]">
                  <DenseNetworkIcon />
                </div>
                <h3 className="text-xl font-bold">Dense Network Structure</h3>
              </div>
              <p className="text-neutral-300">
                100-200 edges for 60 nodes (2.0-4.0 ratio). Includes 20-30 cross-category connections, 8-12 bidirectional feedback loops, and 5-8 hub nodes with high connectivity. Systems thinking at scale.
              </p>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-full h-full max-w-[48px]">
                  <TaxonomyTreeIcon />
                </div>
                <h3 className="text-xl font-bold">User-Defined Taxonomy</h3>
              </div>
              <p className="text-neutral-300">
                No generic frameworks. User specifies 10 parent categories tailored to domain. System generates 5 specific children per parent. Result: custom taxonomy that matches actual problem structure.
              </p>
            </div>

            <div className="bg-dark-800/50 backdrop-blur-sm p-6 rounded-lg border border-dark-600">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-full h-full max-w-[48px]">
                  <InterventionDeltaIcon />
                </div>
                <h3 className="text-xl font-bold">Intervention Delta Analysis</h3>
              </div>
              <p className="text-neutral-300">
                Test unlimited policy scenarios on same base graph. Each intervention generates modified graph with delta comparison showing KPI changes, edge weight shifts, new relationships, and system-wide ripple effects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators Section */}
      <section className="py-20 bg-dark-800 border-t border-dark-700">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 font-spectral text-center">Trust Indicators</h2>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-strategyand-accent mb-2">Custom</div>
              <div className="text-sm text-neutral-400">Taxonomy Per Query</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-strategyand-accent mb-2">2-4x</div>
              <div className="text-sm text-neutral-400">Edge-to-Node Ratio (Dense)</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-strategyand-accent mb-2">KPI</div>
              <div className="text-sm text-neutral-400">Quantified Nodes</div>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-strategyand-accent mb-2">Cited</div>
              <div className="text-sm text-neutral-400">Every Edge Weight</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-900 to-dark-800 p-8 rounded-lg border border-strategyand-accent/20 text-center">
            <p className="text-xl text-neutral-300 leading-relaxed max-w-4xl mx-auto">
              DSM doesn't force your problem into a generic template. Custom taxonomy generation ensures the model structure matches your domain. Every node has real KPI data. Every edge weight calculated from evidence. Intervention scenarios show quantified system-wide impacts.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
