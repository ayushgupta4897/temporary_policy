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
  {{{{
    "search_query": "specific search combining impact query + econometric/quantitative keywords",
    "source_tier": "exact tier name from above list",
    "focus": "specific quantitative impact or multiplier to find",
    "search_instructions": "prioritize studies with numerical estimates, confidence intervals, and causal identification",
    "expected_source_types": ["peer-reviewed journals", "working papers", "official reports"]
  }}}},
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

REQUIRED SOURCE CHARACTERISTICS:
- Must contain specific numerical estimates (percentages, elasticities, multipliers)
- Must use rigorous causal identification (RCT, DiD, IV, RDD, Natural Experiments)
- Must be from reputable publishers (peer-reviewed journals, World Bank, IMF, NBER, government agencies)
- Must include methodology details
- Prioritize sources with confidence intervals or standard errors

ACCEPTABLE PUBLISHERS:
- Peer-reviewed academic journals (Economics, Policy, Public Health)
- NBER, World Bank, IMF, OECD, UN agencies
- Central bank research departments
- Government statistical agencies
- University research centers

REJECT:
- News articles, blogs, opinion pieces
- Sources without specific numerical estimates
- Non-academic sources without rigorous methodology
- Sources that only describe correlations without causal claims

Return results as JSON array (return ONLY the JSON, no other text):
[
  {{{{
    "title": "Full paper/report title",
    "url": "Direct URL to paper/report",
    "publisher": "Journal name or Organization",
    "year": "Publication year (YYYY)",
    "doi": "DOI identifier if available, otherwise empty string",
    "key_finding": "MUST include specific numbers: e.g., '1% increase in X leads to 2.5% decrease in Y (95% CI: 1.8-3.2%)'",
    "methodology": "Specific method: e.g., 'Difference-in-Differences', 'Instrumental Variables with [instrument]', 'Randomized Controlled Trial'",
    "multiplier": "Extract numerical multiplier if stated: e.g., '2.5', 'elasticity of -0.4', or empty string if not explicitly stated",
    "source_tier": "{source_tier_value}",
    "quality_score": "high if RCT/strong IV/good DiD with parallel trends, medium if credible observational with controls"
  }}}}
]

CRITICAL INSTRUCTIONS:
1. Return ONLY sources where you can extract a specific numerical causal estimate
2. The key_finding field MUST contain actual numbers from the study
3. If a source lacks quantitative estimates, DO NOT include it
4. Prefer recent studies (2015+) unless older studies are seminal
5. Return 1-5 highest quality sources found
6. Return ONLY the JSON array, no explanatory text before or after
"""

# ============================================================================
# SPECIALIZED PROMPTS FOR PARALLEL ANALYSIS PIPELINE
# ============================================================================

QUANTITATIVE_EXTRACTION_PROMPT = """You are a quantitative research analyst. Extract ALL numerical findings from these research citations.

RESEARCH CITATIONS:
{citations}

USER QUERY: {query}

Extract EVERY quantitative estimate related to the causal relationship in the query. For each citation, extract:

1. **Effect sizes** - Any percentage changes, elasticities, or multipliers
2. **Confidence intervals** - If reported (e.g., 95% CI: [1.2, 3.4])
3. **Statistical significance** - P-values or significance levels if mentioned
4. **Sample characteristics** - Sample size, time period, geographic scope
5. **Magnitude of treatment** - Size of the intervention or change in X

Return as JSON array:
[
  {{
    "citation_number": 1,
    "citation_title": "Title from citation",
    "estimates": [
      {{
        "effect_type": "percentage_change | elasticity | multiplier | absolute_change",
        "input_variable": "What changed (X)",
        "input_magnitude": "How much X changed",
        "output_variable": "What was affected (Y)",
        "output_magnitude": "How much Y changed",
        "numerical_value": "Calculated multiplier or effect size",
        "confidence_interval_lower": "If available",
        "confidence_interval_upper": "If available",
        "standard_error": "If available",
        "p_value": "If available",
        "time_horizon": "immediate | short-term | long-term | not specified",
        "context": "Any important context (e.g., 'for low-income countries')"
      }}
    ],
    "sample_size": "If mentioned",
    "study_period": "If mentioned",
    "geographic_scope": "If mentioned"
  }}
]

CRITICAL RULES:
- Extract ONLY what is explicitly stated in the citations
- Do NOT infer or calculate values not present in the citations
- If multiple estimates are given for different contexts, extract all of them
- Be precise with numbers - include decimals as stated
- If confidence intervals aren't provided, leave those fields as empty strings
- Return ONLY the JSON array
"""

CAUSAL_PATHWAY_PROMPT = """You are a causal inference specialist. Identify the specific causal mechanisms described in these research citations.

RESEARCH CITATIONS:
{citations}

USER QUERY: {query}

Identify ALL causal pathways from X → Y mentioned in the citations. For each pathway:

1. Identify intermediate variables/mechanisms
2. Note which citations support each pathway
3. Extract any quantitative evidence for each step
4. Identify moderating or mediating factors

Return as JSON:
{{
  "primary_pathways": [
    {{
      "pathway_name": "Short descriptive name",
      "chain": ["X: Input Variable", "Mechanism 1", "Mechanism 2", "Y: Outcome Variable"],
      "description": "How this pathway works",
      "supporting_citations": [1, 3, 5],
      "quantitative_evidence": [
        {{
          "step": "X → Mechanism 1",
          "evidence": "Specific finding from citation",
          "citation_number": 1
        }}
      ],
      "strength": "strong | moderate | weak",
      "time_lag": "How long this pathway takes to manifest"
    }}
  ],
  "moderating_factors": [
    {{
      "factor": "Factor name (e.g., income level, institutional quality)",
      "pathways_affected": ["Which pathways this modulates"],
      "evidence": "Description of how it moderates",
      "supporting_citations": [2, 4]
    }}
  ],
  "interaction_effects": [
    {{
      "description": "Description of synergy or interaction",
      "pathways_involved": ["Pathway 1", "Pathway 2"],
      "evidence": "Specific evidence from citations",
      "supporting_citations": [6]
    }}
  ]
}}

CRITICAL RULES:
- Base EVERY pathway on actual citation content
- Do NOT create generic pathways - be specific to the citations
- If citations don't describe mechanisms, state that explicitly
- Only include interaction effects if explicitly mentioned
- Return ONLY the JSON object
"""

MULTIPLIER_CALCULATION_PROMPT = """You are an econometrician specializing in effect size synthesis. Calculate synthesized impact multipliers from these estimates.

EXTRACTED QUANTITATIVE ESTIMATES:
{quantitative_estimates}

USER QUERY: {query}

Synthesize the estimates to provide:

1. **Range of estimates** - Min, max, median
2. **Quality-weighted average** - Weight by methodology quality
3. **Context-specific estimates** - By subgroup if available
4. **Time-differentiated estimates** - Short-term vs long-term if available

Return as JSON:
{{
  "primary_multiplier": {{
    "formula": "1% increase in X → Z% change in Y",
    "numerical_value": "The Z value",
    "basis": "Brief explanation of how calculated",
    "supporting_estimates": [1, 2, 3]
  }},
  "estimate_range": {{
    "minimum": {{
      "value": "Minimum observed effect",
      "citation_number": 1,
      "context": "Any context for this estimate"
    }},
    "maximum": {{
      "value": "Maximum observed effect",
      "citation_number": 5,
      "context": "Any context"
    }},
    "median": "Median value",
    "weighted_average": {{
      "value": "Quality-weighted mean",
      "weighting_scheme": "How weights were assigned"
    }}
  }},
  "time_differentiated": {{
    "immediate": {{
      "value": "0-1 year effect",
      "supporting_citations": [2]
    }},
    "short_term": {{
      "value": "1-3 year effect",
      "supporting_citations": [3, 4]
    }},
    "long_term": {{
      "value": "3+ year effect",
      "supporting_citations": [5]
    }}
  }},
  "context_specific": [
    {{
      "context": "e.g., High-income countries",
      "value": "Effect size",
      "supporting_citations": [1, 2]
    }}
  ],
  "heterogeneity": {{
    "variance": "Measure of spread if calculable",
    "explanation": "Why estimates vary (e.g., different contexts, methodologies)"
  }},
  "recommended_multiplier": {{
    "conservative": "Lower bound estimate",
    "best_estimate": "Most likely value",
    "optimistic": "Upper bound estimate",
    "justification": "Why these values"
  }}
}}

CRITICAL RULES:
- Base calculations ONLY on provided estimates
- Show which citations support each calculated value
- If you cannot calculate something, explicitly state why
- Be transparent about uncertainty
- Return ONLY the JSON object
"""

QUALITY_ASSESSMENT_PROMPT = """You are a research quality evaluator. Assess the methodological rigor and evidence strength.

RESEARCH CITATIONS:
{citations}

USER QUERY: {query}

Evaluate:

1. **Methodological strength** of each study
2. **Internal validity** concerns
3. **External validity** / generalizability
4. **Publication bias** indicators
5. **Overall evidence strength**

Return as JSON:
{{
  "study_quality_breakdown": [
    {{
      "citation_number": 1,
      "methodology": "Method used",
      "quality_tier": "high | medium | low",
      "strengths": ["Specific strengths"],
      "limitations": ["Specific limitations"],
      "internal_validity_concerns": ["e.g., potential confounders"],
      "external_validity": "Assessment of generalizability",
      "sample_size_adequacy": "adequate | limited | unclear",
      "causal_identification_strength": "strong | moderate | weak"
    }}
  ],
  "overall_assessment": {{
    "evidence_rating": "HIGH | MEDIUM | LOW",
    "justification": "Why this rating",
    "convergence_level": "Percentage agreement across studies (0-100)",
    "heterogeneity": "high | medium | low",
    "heterogeneity_sources": ["Why studies differ"],
    "publication_bias_risk": "high | medium | low",
    "confidence_assessment": {{
      "strengths": ["What we can be confident about"],
      "weaknesses": ["What reduces confidence"],
      "data_gaps": ["What evidence is missing"]
    }}
  }},
  "methodological_distribution": {{
    "high_quality_count": "Number of high-quality studies",
    "medium_quality_count": "Number of medium-quality studies",
    "low_quality_count": "Number of low-quality studies",
    "dominant_methods": ["Most common methodologies"]
  }}
}}

CRITICAL RULES:
- Be specific about methodological concerns
- Base quality ratings on actual methodology described
- Consider both internal and external validity
- Be honest about limitations
- Return ONLY the JSON object
"""

SYNTHESIS_PROMPT = """You are a senior policy analyst. Synthesize the quantitative analysis, causal pathways, and quality assessment into a comprehensive impact analysis report.

USER QUERY: {query}

QUANTITATIVE FINDINGS:
{quantitative_findings}

CAUSAL PATHWAYS:
{causal_pathways}

MULTIPLIER CALCULATIONS:
{multiplier_calculations}

QUALITY ASSESSMENT:
{quality_assessment}

ORIGINAL CITATIONS:
{citations}

Generate a comprehensive markdown report following this structure:

## Executive Summary

**Primary Causal Relationship:** [X → Y]
**Core Multiplier:** [From multiplier_calculations.primary_multiplier]
**Evidence Strength:** [From quality_assessment.overall_assessment.evidence_rating]

> 💡 **Key Finding:** [Most important takeaway]

---

## 1. Quantitative Impact Estimates

### Summary Statistics Table

| Study | Methodology | Sample | Impact Estimate | Confidence Interval | Quality |
|-------|-------------|--------|-----------------|---------------------|---------|
[Populate from quantitative_findings - one row per major estimate]

### Multiplier Range Analysis

[Use multiplier_calculations.estimate_range]

---

## 2. Causal Mechanisms & Identification

### Methodological Approaches

[For each major methodology, create a subsection describing how it establishes causality]

### Causal Pathways Diagram

```
[Create visual representation from causal_pathways.primary_pathways]
```

### Detailed Causal Reasoning

[For EACH pathway in causal_pathways.primary_pathways, explain with citations]

---

## 3. Impact Multiplier Calculations

[Use multiplier_calculations structure]

---

## 4. Evidence Quality & Synthesis

[Use quality_assessment structure]

---

## 5. Limitations & Caveats

[From quality_assessment.overall_assessment.confidence_assessment]

---

## 6. Confidence Assessment

[From quality_assessment.overall_assessment]

---

## 7. Policy Implications

### Recommended Multiplier for Planning

[Use multiplier_calculations.recommended_multiplier]

---

## References

[Format ALL citations used]

---

CRITICAL FORMATTING RULES:
1. EVERY quantitative claim MUST include [Citation #]
2. Use markdown tables for comparative data
3. Use **bold** for key numbers
4. ONLY include findings that are in the provided data
5. If the provided analysis lacks data for a section, state "No direct evidence available" rather than making something up
6. Ensure multipliers are CONSISTENT across all sections
7. Cross-reference between sections to ensure coherence
"""


# ============================================================================
# VALIDATION AND CORRECTION PROMPT (GPT-5 JUDGE)
# ============================================================================

VALIDATION_JUDGE_PROMPT = """You are a senior research quality auditor with expertise in econometrics, causal inference, and policy analysis. Your role is to rigorously validate an impact analysis report for consistency, accuracy, and proper citation support.

You will receive:
1. The generated impact analysis report
2. The original research citations with their key findings
3. The intermediate analysis components (quantitative findings, pathways, multipliers, quality assessment)

Your task is to:
1. **Validate numerical consistency** - Check that all numbers align across sections
2. **Verify citation support** - Ensure every claim is properly supported by citations
3. **Detect hallucinations** - Flag any statistics or findings not present in the source citations
4. **Check logical coherence** - Ensure pathways, multipliers, and conclusions make sense
5. **Identify uncertainties** - Call out anything that seems uncertain or speculative
6. **Fix issues** - If problems are found, provide corrected versions

---

## ORIGINAL RESEARCH CITATIONS

{citations}

---

## INTERMEDIATE ANALYSIS COMPONENTS

### Quantitative Findings:
{quantitative_findings}

### Causal Pathways:
{causal_pathways}

### Multiplier Calculations:
{multiplier_calculations}

### Quality Assessment:
{quality_assessment}

---

## GENERATED REPORT TO VALIDATE

{report}

---

## VALIDATION INSTRUCTIONS

### 1. NUMERICAL CONSISTENCY CHECK

Examine ALL numerical values mentioned in the report:

**Executive Summary multiplier** - Extract the core multiplier stated
**Table values** - List all impact estimates from tables
**Time-differentiated multipliers** - Check immediate/short-term/long-term values
**Range statistics** - Verify min, max, median, weighted average

**Validation Rules:**
- The executive summary multiplier MUST fall within the range of cited estimates
- Weighted averages MUST be calculable from the provided estimates
- Time-differentiated effects MUST be supported by specific citations
- All percentages must be internally consistent (e.g., if exec says 2%, tables shouldn't show 5%)

**If inconsistent:**
- Identify the specific inconsistency
- Determine which value is correct based on citations
- Provide corrected values

### 2. CITATION SUPPORT VERIFICATION

For EVERY quantitative claim in the report:

**Check:**
- Is there a [Citation #] marker?
- Does that citation actually contain this number?
- Is the claim accurately representing the citation?

**Common issues to catch:**
- Claims citing [Citation 5] but the number doesn't appear in Citation 5's key finding
- Synthesis claims (e.g., "weighted average of 3.5%") without showing the calculation
- Confidence intervals mentioned without citation support
- "Synergy matrices" or "I² statistics" generated without basis

**If unsupported:**
- Flag the specific claim
- Show what the citation actually says
- Provide corrected claim with proper citation, or remove if no support exists

### 3. HALLUCINATION DETECTION

Compare the report against the original citations:

**Look for:**
- Statistics that don't appear in any citation
- Methodologies not mentioned in the source papers
- Sample sizes, time periods, or contexts fabricated
- Confidence intervals invented rather than cited
- Effect sizes that are interpolated without stating it

**Be especially vigilant for:**
- Tables with precise numbers that aren't in citations
- Synergy matrices with specific multiplier values
- Heterogeneity statistics (I², variance) calculated without data
- Specific p-values or significance levels not in sources

**If hallucinated:**
- Clearly identify what was invented
- State that it's unsupported
- Either remove it or replace with "Not reported in available evidence"

### 4. CAUSAL PATHWAY VALIDATION

Review the causal pathways section:

**Check:**
- Are pathways described as generic templates or specific to citations?
- Do citations actually discuss these mechanisms?
- Are pathway "strengths" (e.g., "contributes 40%") supported?
- Are moderating factors explicitly mentioned in citations?

**If pathways are generic/unsupported:**
- Flag which pathways lack citation support
- Show what citations actually say about mechanisms
- Revise to accurately reflect citation content or state "Mechanisms not explicitly detailed in available evidence"

### 5. UNCERTAINTY AND SPECULATION

Identify any claims that are:
- Speculative rather than evidence-based
- Extrapolated beyond what citations support
- Based on weak evidence but stated confidently

**For uncertain claims:**
- Add qualifiers: "Limited evidence suggests...", "Based on a single study...", "Extrapolating from..."
- Downgrade confidence ratings if overstated
- Add caveats in the limitations section

### 6. LOGICAL COHERENCE

Check that:
- Conclusions follow from evidence presented
- Quality ratings match the methodology descriptions
- Time horizons are consistent (don't mix immediate and long-term effects)
- Context-specific findings are properly qualified

---

## OUTPUT FORMAT

Return your validation as JSON:

{{
  "validation_status": "PASS | FAIL | PASS_WITH_WARNINGS",
  "overall_assessment": "Brief summary of validation findings",
  
  "numerical_consistency": {{
    "status": "consistent | inconsistent",
    "issues": [
      {{
        "issue": "Description of inconsistency",
        "location": "Where in report (section name)",
        "details": "Specific numbers that conflict",
        "severity": "critical | moderate | minor"
      }}
    ],
    "corrections": {{
      "executive_summary_multiplier": "Corrected value if needed",
      "explanation": "Why this value is correct"
    }}
  }},
  
  "citation_support": {{
    "unsupported_claims": [
      {{
        "claim": "The exact claim from report",
        "location": "Section where it appears",
        "issue": "What citation says vs what report claims",
        "citation_number": "Which citation was referenced",
        "severity": "critical | moderate | minor",
        "correction": "How to fix this claim"
      }}
    ]
  }},
  
  "hallucinations": [
    {{
      "hallucinated_content": "What appears to be invented",
      "location": "Where it appears",
      "why_suspicious": "Why this seems fabricated",
      "evidence_check": "What citations actually say",
      "severity": "critical | moderate | minor",
      "recommended_action": "remove | replace | qualify"
    }}
  ],
  
  "causal_pathway_issues": [
    {{
      "pathway": "Which pathway has issues",
      "issue": "What's wrong with it",
      "citation_evidence": "What citations actually say",
      "correction": "How to fix or what to state instead"
    }}
  ],
  
  "uncertainty_flags": [
    {{
      "claim": "Claim that needs uncertainty qualification",
      "current_confidence": "How it's currently stated",
      "appropriate_confidence": "How it should be stated",
      "reasoning": "Why this change is needed"
    }}
  ],
  
  "corrected_report_sections": {{
    "executive_summary": "Corrected version if changes needed, otherwise null",
    "section_1_quantitative": "Corrected version if changes needed, otherwise null",
    "section_2_mechanisms": "Corrected version if changes needed, otherwise null",
    "section_3_multipliers": "Corrected version if changes needed, otherwise null",
    "other_corrections": [
      {{
        "section": "Section name",
        "original": "Original text with issue",
        "corrected": "Corrected text"
      }}
    ]
  }},
  
  "required_additions": [
    {{
      "section": "Where to add",
      "content": "What uncertainty qualifier or caveat to add",
      "reason": "Why this is needed"
    }}
  ],
  
  "confidence_rating": {{
    "original_rating": "What report claims (HIGH/MEDIUM/LOW)",
    "validated_rating": "What it should be based on evidence",
    "justification": "Why rating should change or stay same"
  }}
}}

---

## CRITICAL RULES FOR VALIDATION

1. **Be Rigorous** - Even small inconsistencies matter. Don't let anything slide.

2. **Check Every Number** - Every percentage, multiplier, confidence interval must be traceable to a citation.

3. **Don't Assume** - If you can't verify a claim from the citations, flag it as unsupported.

4. **Be Specific** - Don't just say "there are issues" - point to exact locations and numbers.

5. **Provide Corrections** - Don't just identify problems, provide the corrected version.

6. **Call Out Uncertainty** - If something is speculative or based on thin evidence, say so explicitly.

7. **Preserve What Works** - If sections are accurate and well-supported, acknowledge that.

8. **Be Transparent** - If you're unsure about something, state that uncertainty clearly.

---

Return ONLY the JSON object with your comprehensive validation findings and corrections.
"""

# ============================================================================
# REPORT CORRECTION PROMPT
# ============================================================================

CORRECTION_APPLICATION_PROMPT = """You are a technical editor applying validated corrections to an impact analysis report.

You have received a validation report with specific issues and corrections. Your job is to apply ALL corrections to produce a final, validated report.

---

## ORIGINAL REPORT

{original_report}

---

## VALIDATION FINDINGS AND CORRECTIONS

{validation_results}

---

## YOUR TASK

1. Apply ALL corrections specified in the validation results
2. Add uncertainty qualifiers where flagged
3. Remove or replace hallucinated content
4. Ensure numerical consistency across all sections
5. Add caveats and limitations identified

**CRITICAL RULES:**

1. **Apply Every Correction** - Don't skip any corrections from the validation results
2. **Maintain Structure** - Keep the same markdown structure and section organization
3. **Preserve Good Content** - Don't change sections that validated as correct
4. **Be Precise** - Use exact corrected values provided
5. **Add Uncertainty Language** - Include all uncertainty flags and qualifications
6. **Remove Unsupported Claims** - If validation says something is hallucinated and can't be fixed, remove it
7. **Consistency First** - Ensure the final report has no internal contradictions

**OUTPUT:**

Return the COMPLETE corrected markdown report. Include:
- All sections from the original report
- All corrections applied
- All uncertainty qualifiers added
- All hallucinations removed or replaced
- Consistent numerical values throughout

**DO NOT include any explanatory text.** Return ONLY the corrected markdown report.
"""
