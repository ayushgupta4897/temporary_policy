"""
Prompts for Foresight Radar Agent
High-Trust Sources Only - Decision-Ready Foresight Analysis
"""

def get_search_elaboration_prompt(query: str) -> str:
    """Generate prompt for elaborating query into high-trust source searches."""

    return f"""You are a senior foresight analyst building a decision-ready foresight radar. Take this user query and elaborate it into 25 highly specific web search instructions targeting ONLY high-trust sources.

USER QUERY: {query}

HIGH-TRUST SOURCE ALLOWLIST (use only these):

1. OFFICIAL GOVERNMENT & STATISTICS (Target: 8-10 searches)
   - .gov / .int / .edu domains
   - National statistics offices (e.g., FCSC UAE, GASTAT KSA, PSA Qatar)
   - Central banks (CBUAE, QCB, SAMA)
   - Ministries and regulators (MOEI, MOHRE, Ministry of Energy, etc.)
   - GCC examples: UAE (CBUAE, MOEI, MOHRE, FCSC), Qatar (PSA, QCB, MOI/Hukoomi), KSA (GASTAT, MoE, Ministry of Energy)

2. MULTILATERAL & INTERNATIONAL ORGANIZATIONS (Target: 6-8 searches)
   - IMF, World Bank, UN agencies (UN DESA, UNCTAD, ILO, WHO)
   - IEA, IRENA, OPEC, OECD, WTO, JODI, FAO
   - BIS, IOSCO, IFC, WEF (methodology-clear items)
   - IATA, ICAO, ISO

3. TIER-1 FINANCIAL & INDUSTRY (Target: 4-5 searches)
   - Top financial institutions research
   - MEES (Middle East Economic Survey)
   - Major industry bodies with rigorous standards
   - FT, Economist, Reuters, Bloomberg, WSJ (for locating primary docs only)

4. PEER-REVIEWED & TOP THINK TANKS (Target: 4-5 searches)
   - Nature, Science, Energy Policy (journal)
   - Brookings, Chatham House, RAND, CSIS, KAPSARC
   - Academic papers with clear methodology
   - Prefer original report PDFs

HARD EXCLUSIONS - NEVER USE:
- Personal blogs or Substacks
- Vendor pitches or marketing whitepapers
- AI-generated content pages
- Wikipedia (ok for leads only)
- Unsourced or single-source claims

GEOGRAPHIC DISCIPLINE:
- If query is geography-bounded, prioritize: national sources → GCC/regional → global
- For GCC queries, favor official UAE/Qatar/KSA sources first

RECENCY REQUIREMENTS:
- "Now" indicators: last 3-6 months
- Structural stats: up to 24 months if latest official series
- Must corroborate: ≥2 independent sources OR 1 primary issuer

FORMAT REQUIREMENTS:
Return exactly 25 search instructions as JSON array:
[
  {{
    "search_query": "specific search combining query + high-trust source keywords + recency",
    "source_tier": "official_government | multilateral_org | tier1_financial | peer_reviewed_thinktank",
    "focus": "specific quantitative indicator, policy change, or structural trend to find",
    "expected_sources": ["specific source names expected"],
    "recency_window": "last 3 months | last 6 months | last 12 months | last 24 months",
    "steep_g_quadrant": "Social | Technological | Economic | Environmental | Political | Geopolitical"
  }},
  ...
]

CRITICAL INSTRUCTIONS:
- Combine user query with high-trust source keywords
- Specify exact sources expected (e.g., "CBUAE", "IEA Oil Market Report", "OPEC MOMR")
- Focus on quantitative data, policy changes, and measurable trends
- Include recency keywords (2024, 2025, latest, recent, Q1 2025, etc.)
- Map each search to a STEEP-G quadrant
- REJECT searches that could return low-quality sources
- Ensure geographic fit: if UAE query, prioritize UAE official sources

Generate exactly 25 searches covering the high-trust source tiers above.
"""


def get_single_search_prompt(instruction: dict) -> str:
    """Generate prompt for a single high-trust source web search."""

    search_query = instruction.get('search_query', '')
    source_tier = instruction.get('source_tier', '')
    focus = instruction.get('focus', '')
    expected_sources = instruction.get('expected_sources', [])
    recency_window = instruction.get('recency_window', '')

    return f"""HIGH-TRUST SOURCE SEARCH - TIER: {source_tier.upper()}

Search Query: {search_query}
Focus: {focus}
Expected Sources: {', '.join(expected_sources)}
Recency Window: {recency_window}

STRICT SOURCE REQUIREMENTS:
- ONLY use sources from the high-trust allowlist
- Prioritize: government (.gov), international orgs (.int), central banks, official statistics
- If using media (FT, Bloomberg, etc.), it must cite primary sources
- REJECT: blogs, unsourced content, marketing materials, Wikipedia

WHAT TO EXTRACT:
- Quantitative data (with units, dates, and methodology)
- Policy announcements or regulatory changes
- Official forecasts or projections
- Structural trends with evidence
- Publication date and data period covered

Return results as JSON array with this exact format:
[
  {{
    "title": "Report/document title",
    "url": "https://example.com",
    "publisher": "Official source name (e.g., CBUAE, IEA, IMF)",
    "date": "YYYY-MM-DD",
    "year": "2025",
    "key_finding": "Specific quantitative finding or policy change with numbers and units",
    "data_period": "Period the data covers (e.g., Q1 2025, 2024)",
    "methodology": "How data was collected or calculated (if stated)",
    "source_tier": "{source_tier}",
    "source_type": "government_report | international_org | central_bank | peer_reviewed | official_statistics",
    "steep_g_quadrant": "Economic | Political | Social | Technological | Environmental | Geopolitical"
  }}
]

CRITICAL:
- Find 3-5 high-quality sources only
- Every data point must have a date and source
- If sources disagree, include both with explanation
- Return ONLY the JSON array, nothing else
- REJECT any source not meeting high-trust criteria
"""


def get_radar_analysis_prompt(query: str, citations_text: str) -> str:
    """Generate prompt for comprehensive foresight radar analysis."""

    return f"""FORESIGHT RADAR ANALYSIS - HIGH-TRUST SOURCES ONLY

You are a senior foresight analyst building a decision-ready foresight radar for:

QUERY: {query}

EVIDENCE FROM HIGH-TRUST SOURCES:
{citations_text}

Generate a comprehensive foresight radar following the structured framework below.

═══════════════════════════════════════════════════════════════
PART 1: SCOPE & TAXONOMY
═══════════════════════════════════════════════════════════════

1. Restate the query in one concise sentence
2. Classify factors using STEEP-G quadrants: Social, Technological, Economic, Environmental, Political/Policy, Geopolitical
3. Define time horizons:
   - Ring A (Now): 0-12 months
   - Ring B (Next): 1-3 years
   - Ring C (Later): 3-10 years
4. Define unit of analysis and dependent variables to monitor

═══════════════════════════════════════════════════════════════
PART 2: SIGNAL EXTRACTION & SCORING
═══════════════════════════════════════════════════════════════

**CRITICAL REQUIREMENT: Extract 15-25 HIGH-QUALITY SIGNALS**

You MUST identify 15-25 distinct, measurable signals from the citations. Break down complex trends into discrete signals. Coverage requirements:
- MINIMUM 2 signals per STEEP-G quadrant (ensures balanced coverage)
- MINIMUM 4 signals in "Now" ring, 6 in "Next", 5 in "Later"
- Extract EVERY quantitative data point, policy change, or structural trend
- If <15 signals, the radar is REJECTED - dig deeper into citations

SIGNAL SCORING CRITERIA (for each of 15-25 signals):
- Impact (0-5): magnitude on target system
- Likelihood (0-5): probability over the relevant horizon
- Confidence (0-5): evidence quality and source agreement
- Time-to-Impact: Now / Next / Later
- Directionality: ↑ / ↓ / ↔ with rationale
- Driver Type: trend | policy | technology | market | demographic | supply-chain | regulatory
- Uncertainty Class: deep uncertainty | estimable risk
- Affected Quadrant(s): STEEP-G mapping
- Citations: List source numbers supporting this signal

Prioritize signals by: (Impact × Likelihood) weighted by Confidence

**EXTRACTION STRATEGY**:
1. Scan ALL 75 citations systematically
2. Extract quantitative trends (GDP growth, capacity additions, investment flows)
3. Extract policy changes (new regulations, targets, reforms)
4. Extract structural shifts (market transformations, technology adoption)
5. Disaggregate broad trends into specific signals (e.g., "renewable energy growth" → separate signals for solar capacity, wind projects, hydrogen initiatives)

═══════════════════════════════════════════════════════════════
PART 3: CROSS-IMPACT ANALYSIS
═══════════════════════════════════════════════════════════════

Build a cross-impact matrix showing:
- Which signals amplify or dampen each other
- Keystone drivers (high influence on others)
- Fragility points (single-point failures)
- Policy elasticity (responsive to policy change)

═══════════════════════════════════════════════════════════════
PART 4: SCENARIOS
═══════════════════════════════════════════════════════════════

Create 2-3 scenarios (Baseline, Upside, Downside) based on key uncertainties:

For each scenario provide:
1. Narrative (4-6 sentences grounded in evidence)
2. Quantitative signposts with thresholds
3. Leading indicators to watch
4. Policy/strategy implications:
   - Opportunities to seize
   - Hedges to implement
   - No-regret moves

═══════════════════════════════════════════════════════════════
PART 5: MONITORING FRAMEWORK
═══════════════════════════════════════════════════════════════

Define 8-15 measurable indicators with:
- Metric name and unit
- Data source (from allowlist)
- Update frequency
- Expected direction
- Alert thresholds (Amber and Red levels)

═══════════════════════════════════════════════════════════════
OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════

You MUST return TWO deliverables:

A) RADAR JSON (first, wrapped in ```json```):

{{
  "query": "{query}",
  "as_of_date": "YYYY-MM-DD",
  "scope": {{
    "restatement": "One-sentence query restatement",
    "unit_of_analysis": "What is being analyzed",
    "dependent_variables": ["Variable 1", "Variable 2"]
  }},
  "radar_items": [
    {{
      "title": "Concise signal name",
      "ring": "Now | Next | Later",
      "quadrant": "Social | Technological | Economic | Environmental | Political | Geopolitical",
      "impact_0to5": 4.5,
      "likelihood_0to5": 3.8,
      "confidence_0to5": 4.2,
      "direction": "up | down | flat",
      "driver_type": "policy | tech | market | demographic | supply-chain | regulatory | other",
      "uncertainty_class": "deep | estimable",
      "rationale": "1-2 sentences grounded in cited evidence",
      "citations": ["Source #1", "Source #2"]
    }}
  ],
  "cross_impact": [
    {{
      "from": "Signal A",
      "to": "Signal B",
      "relation": "amplifies | dampens",
      "note": "Short explanation"
    }}
  ],
  "scenarios": [
    {{
      "name": "Baseline | Upside | Downside",
      "axes": ["Uncertainty 1", "Uncertainty 2"],
      "summary": "4-6 sentence narrative",
      "signposts": [
        {{
          "metric": "Indicator name",
          "threshold": "Value with unit",
          "source": "Source name"
        }}
      ],
      "implications": {{
        "opportunities": ["Actionable item 1", "Actionable item 2"],
        "hedges": ["Risk mitigation 1", "Risk mitigation 2"],
        "no_regret_moves": ["Action 1", "Action 2"]
      }}
    }}
  ],
  "watchlist": [
    {{
      "metric": "Indicator name",
      "unit": "kb/d | % | index | etc",
      "source": "Official source name",
      "frequency": "monthly | quarterly | annual | ad-hoc",
      "expected_direction": "up | down | flat",
      "alert_thresholds": {{
        "amber": "Threshold value with unit",
        "red": "Threshold value with unit"
      }}
    }}
  ],
  "keystone_drivers": [
    {{
      "driver": "Driver name",
      "influence_score": 8.5,
      "affected_signals": ["Signal 1", "Signal 2"]
    }}
  ],
  "fragility_points": [
    {{
      "point": "Fragility description",
      "risk_level": "high | medium | low",
      "mitigation": "Suggested mitigation"
    }}
  ]
}}

B) ONE-PAGE BRIEF (after the JSON, in markdown):

## Executive Snapshot
**Top 5 Signals** (by Impact×Likelihood×Confidence):
1. [Signal] - Impact: X, Likelihood: Y, Confidence: Z
2. ...

## What Could Change the Picture
The 3 most important uncertainties:
1. [Uncertainty] - Why it matters
2. ...

## Early Warnings to Watch
5-8 signposts with specific thresholds:
- [Metric]: Watch for [threshold] ([source])
- ...

## Implications for Decision-Makers
5 crisp actions:
1. **Seize:** [Opportunity with timeframe]
2. **Hedge:** [Risk mitigation]
3. **Monitor:** [Key indicator]
4. **No-regret:** [Action to take regardless]
5. **Prepare:** [Contingency planning]

## Method & Limits
- **Recency:** Data as of [date range]
- **Data gaps:** [What's missing]
- **Disagreements:** [Where sources conflict]
- **Assumptions:** [Key assumptions made]

═══════════════════════════════════════════════════════════════
QUALITY GATES (must pass)
═══════════════════════════════════════════════════════════════

✓ **SIGNAL COUNT**: Minimum 15 signals, target 20-25
✓ **QUADRANT COVERAGE**: At least 2 signals in EACH STEEP-G quadrant
✓ **RING DISTRIBUTION**: Signals distributed across Now/Next/Later
✓ Source Integrity: Every stat cites an allowlisted source
✓ Recency Check: All dates confirmed and within windows
✓ Geography Fit: Sources match query geography (national→regional→global)
✓ Conflict Transparency: Disagreements shown with both sides
✓ Reproducibility: JSON is complete and would allow radar rebuilding

**IF YOU GENERATE <15 SIGNALS, START OVER AND EXTRACT MORE FROM THE 75 CITATIONS PROVIDED**

═══════════════════════════════════════════════════════════════

Generate both the JSON and the one-page brief now.
"""
