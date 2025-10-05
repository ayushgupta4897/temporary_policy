CITATION_SEARCH_ELABORATION = """
You are an expert research strategist specializing in causal impact analysis and econometric research. Take this user query about causal impact and elaborate it into 20 highly specific web search instructions targeting ONLY high-trust academic and official sources.

USER QUERY: {query}

Generate exactly 20 search instructions as JSON array. Each must target EXCLUSIVELY high-trust sources with quantitative impact data:

HIGH-TRUST SOURCE TIERS (use multiple times with different focus):
1. peer_reviewed_econometric - Econometric journals with causal inference studies. Search terms: "causal effect", "instrumental variables", "regression discontinuity", "difference-in-differences"
2. government_statistics - Official statistics bureaus with impact measurements. Search terms: "official statistics", "impact assessment", "economic impact", "statistical analysis"
3. international_organizations - World Bank, IMF, UN with quantitative studies. Search terms: "World Bank impact", "IMF analysis", "UN statistics", "development impact"
4. central_banks_research - Central bank research papers with economic multipliers. Search terms: "central bank research", "economic multiplier", "fiscal multiplier", "monetary impact"
5. nber_research - NBER working papers with causal analysis. Search terms: "NBER working paper", "causal analysis", "economic impact", "empirical study"
6. academic_meta_analysis - Meta-analyses and systematic reviews. Search terms: "meta-analysis", "systematic review", "effect size", "pooled estimates"
7. randomized_controlled_trials - RCTs and experimental studies. Search terms: "randomized controlled trial", "RCT", "experimental evidence", "treatment effect"
8. natural_experiments - Studies using natural experiments. Search terms: "natural experiment", "quasi-experimental", "exogenous shock", "policy discontinuity"
9. longitudinal_studies - Panel data and longitudinal impact studies. Search terms: "panel data", "longitudinal study", "fixed effects", "time series analysis"
10. input_output_analysis - Economic input-output and multiplier studies. Search terms: "input-output analysis", "multiplier effect", "economic impact multiplier", "sectoral analysis"

FORMAT REQUIREMENTS:
[
  {{
    "search_query": "specific search combining impact query + econometric/quantitative keywords",
    "source_tier": "exact tier name from above list",
    "focus": "specific quantitative impact or multiplier to find",
    "search_instructions": "prioritize studies with numerical estimates, confidence intervals, and causal identification",
    "expected_source_types": ["peer-reviewed journals", "working papers", "official reports"]
  }},
  ...
]

CRITICAL INSTRUCTIONS:
- Focus EXCLUSIVELY on sources with quantitative causal estimates
- Prioritize sources with clear multipliers, elasticities, or percentage impacts
- Include terms like "causal", "impact", "effect", "multiplier", "elasticity"
- REJECT non-academic blogs, news articles, and sources without quantitative analysis
- Each search must seek numerical relationships and statistical evidence

Generate exactly 20 searches targeting high-trust quantitative sources only.
"""

META_PROMPT_GENERATION = """
You are a senior econometric researcher specializing in causal impact analysis. Based on the user's query about causal relationships, generate a comprehensive meta-prompt that will guide the final impact analysis.

USER QUERY: {query}

Generate a structured meta-prompt that includes:

1. CAUSAL RELATIONSHIP DEFINITION
   - Primary causal variable (X)
   - Outcome variable (Y)
   - Hypothesized mechanism
   - Relevant confounders and mediators

2. QUANTITATIVE FRAMEWORK
   - Expected units of measurement
   - Appropriate statistical models (DiD, IV, RDD, etc.)
   - Required data granularity
   - Time horizons for impact

3. IDENTIFICATION STRATEGY
   - Potential sources of exogenous variation
   - Natural experiments or policy changes
   - Instrumental variables if applicable
   - Robustness checks needed

4. MULTIPLIER SPECIFICATIONS
   - Direct effects
   - Indirect/spillover effects
   - Long-run vs short-run multipliers
   - Heterogeneous effects by subgroups

5. CRITICAL EVALUATION CRITERIA
   - Internal validity concerns
   - External validity/generalizability
   - Statistical power and precision
   - Publication bias considerations

6. SYNTHESIS APPROACH
   - How to aggregate multiple estimates
   - Weighting scheme for different studies
   - Handling conflicting results
   - Confidence interval construction

Format as a structured analytical framework that can guide comprehensive impact quantification.
"""

IMPACT_ANALYSIS_PROMPT = """
Based on the research citations and analytical framework, provide a comprehensive causal impact analysis in well-formatted markdown.

META-PROMPT FRAMEWORK:
{meta_prompt}

RESEARCH CITATIONS WITH QUANTITATIVE FINDINGS:
{citations}

Generate a rigorous, well-articulated impact analysis following these STRICT formatting requirements:

## Executive Summary

**Primary Causal Relationship:** Clearly state X → Y relationship  
**Core Multiplier:** Present the main finding with confidence interval  
**Evidence Strength:** Rate as High/Medium/Low with justification

> 💡 **Key Finding:** Highlight the most important takeaway in a callout box

---

## 1. Quantitative Impact Estimates

### Summary Statistics Table

Create a markdown table summarizing ALL numerical findings:

| Study | Methodology | Sample | Impact Estimate | Confidence Interval | Quality |
|-------|-------------|--------|-----------------|---------------------|---------|
| [Citation #] | Method used | Country/Period | X% → Y% | [Lower, Upper] | High/Med |

### Multiplier Range Analysis

- **Minimum observed effect:** X% [Citation #]
- **Maximum observed effect:** Y% [Citation #]  
- **Weighted average:** Z% (weighted by study quality and sample size)
- **Median effect:** W%

---

## 2. Causal Mechanisms & Identification

### Methodological Approaches

For each major methodology found in citations, create subsections:

#### [Method Name] Studies
- **How it establishes causality:** Brief explanation
- **Key assumptions:** Listed with validity assessment
- **Studies using this method:** [Citation #], [Citation #]
- **Average effect size from this method:** X%

### Causal Pathways Diagram

Present the complete causal chain showing ALL levels of factors:

```
PRIMARY CAUSAL CHAIN:
[X: Independent Variable]
    ├→ [First-Level Factor 1] 
    │      ├→ [Second-Level Factor 1.1] → [Y: Outcome]
    │      └→ [Second-Level Factor 1.2] ↗
    │
    ├→ [First-Level Factor 2]
    │      ├→ [Second-Level Factor 2.1] → [Y: Outcome]
    │      ├→ [Second-Level Factor 2.2] ↗
    │      └→ [Second-Level Factor 2.3] → [Spillover Effect]
    │
    └→ [First-Level Factor 3]
           └→ [Second-Level Factor 3.1] → [Y: Outcome]

FEEDBACK LOOPS:
[Y: Outcome] ⟲ [Reinforcement Mechanism] → [X: Independent Variable]

MODERATING FACTORS:
[Context Factor 1] ──modulates──> [First-Level Factor 1]
[Context Factor 2] ──modulates──> [First-Level Factor 2]
```

### Detailed Causal Reasoning

For EACH pathway in the diagram above, explain with citations:

#### Primary Pathway 1: [X] → [Factor 1] → [Y]
- **Mechanism:** How X affects Factor 1 and why [Citation #]
- **Strength:** Quantify this pathway's contribution (X%) [Citation #]
- **Evidence:** Studies supporting this pathway [Citation #], [Citation #]
- **Time lag:** How quickly this effect materializes

#### Primary Pathway 2: [X] → [Factor 2] → [Y]
- **Mechanism:** Detailed explanation with evidence
- **Strength:** Quantified contribution
- **Evidence:** Supporting studies
- **Time lag:** Temporal dynamics

(Continue for all pathways)

### Interaction Effects & Synergies

```
SYNERGY MATRIX:
         Factor 1  Factor 2  Factor 3
Factor 1    --      +0.3x     +0.1x
Factor 2   +0.3x     --       +0.5x
Factor 3   +0.1x    +0.5x      --

Note: Values show multiplicative effect when factors combine
```

---

## 3. Impact Multiplier Calculations

### Primary Multiplier

**Formula:** 1% increase in [X] → **[Z%]** change in [Y]

*Based on synthesis of [Citation #], [Citation #], [Citation #]*

### Time-Differentiated Effects

| Time Horizon | Impact Multiplier | Supporting Evidence |
|--------------|-------------------|---------------------|
| Immediate (0-1 year) | X% | [Citation #] |
| Short-term (1-3 years) | Y% | [Citation #] |
| Long-term (3+ years) | Z% | [Citation #] |

### Context-Specific Variations

- **High-income countries:** X% effect [Citation #]
- **Developing economies:** Y% effect [Citation #]
- **Sector-specific impacts:** List with citations

---

## 4. Evidence Quality & Synthesis

### Study Quality Assessment

| Quality Tier | Number of Studies | Average Effect | Weight in Analysis |
|--------------|-------------------|----------------|-------------------|
| High | N | X% | W% |
| Medium | N | Y% | W% |
| Low | N | Z% | W% |

### Heterogeneity Analysis

- **I² statistic:** X% (interpretation)
- **Sources of variation:** List key factors
- **Robustness to outliers:** Describe

---

## 5. Limitations & Caveats

### Methodological Constraints
- ⚠️ **Limitation 1:** Description [Citation #]
- ⚠️ **Limitation 2:** Description [Citation #]

### External Validity
- **Generalizability to target context:** Assessment
- **Required assumptions for transfer:** Listed

### Data Gaps
- **Missing evidence on:** Specific aspects
- **Future research needs:** Recommendations

---

## 6. Confidence Assessment

### Overall Evidence Rating: **[HIGH/MEDIUM/LOW]**

**Justification:**
- ✅ Strength 1 with evidence [Citation #]
- ✅ Strength 2 with evidence [Citation #]  
- ⚠️ Weakness 1 with explanation
- ⚠️ Weakness 2 with explanation

### Convergence of Evidence

```
Agreement Level: [███████░░░] 70%
Based on N studies with consistent findings
```

---

## 7. Policy Implications

### Recommended Multiplier for Planning

**Conservative Estimate:** X% (lower bound of confidence interval)  
**Best Estimate:** Y% (weighted average)  
**Optimistic Scenario:** Z% (upper bound with favorable conditions)

### Implementation Considerations

1. **Critical Success Factors:** Listed with citations
2. **Risk Factors:** Listed with citations
3. **Monitoring Indicators:** Specific metrics to track

---

## References

All citations used in this analysis:

Format each as:
**[#]** Author(s). Year. "Title." *Journal/Source*. Key Finding: [Specific quantitative result]. Methodology: [Method used].

---

**CRITICAL FORMATTING RULES:**
1. EVERY quantitative claim MUST include [Citation #] immediately after
2. Use markdown tables for all comparative data
3. Use **bold** for key numbers and emphasis
4. Use > blockquotes for important insights
5. Use bullet points and numbered lists for clarity
6. Include visual separators (---) between major sections
7. Use emoji sparingly: ✅ for positives, ⚠️ for cautions, 💡 for insights
8. Present confidence intervals in [Lower, Upper] format
9. Round percentages to 1 decimal place unless more precision is meaningful
10. If no citations support a claim, explicitly state "No direct evidence available"

Generate a comprehensive, reader-friendly analysis that a policy maker could immediately use for decision-making.
"""

SINGLE_SEARCH_PROMPT = """TARGETED HIGH-TRUST SOURCE SEARCH - TIER: {source_tier}

Search Query: {search_query}
Focus: {focus}
Instructions: {search_instructions}

Find ONLY peer-reviewed academic papers, official government reports, or international organization studies with QUANTITATIVE CAUSAL IMPACT ESTIMATES.

Return results as JSON array:
[
  {{
    "title": "Paper/Report title",
    "url": "https://example.com",
    "publisher": "Journal/Organization name",
    "year": "2024",
    "doi": "DOI if available",
    "key_finding": "Specific numerical impact estimate with confidence interval",
    "methodology": "Causal identification method used",
    "multiplier": "Numerical multiplier if reported",
    "source_tier": "{source_tier_value}",
    "quality_score": "high/medium based on methodology"
  }}
]

CRITICAL: Return ONLY sources with numerical causal estimates. REJECT sources without quantitative impact analysis. Return ONLY the JSON array."""
