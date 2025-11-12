"""
Prompts for Dynamic Systems Modeler
Strategy& PWC - DSM Product Line

Contains all prompt templates for taxonomy generation, graph building, and intervention modeling.
"""

class DSMPrompts:
    """All prompts used in the Dynamic Systems Modeler pipeline."""

    BASE_GRAPH_CONSTRUCTION_PROMPT = """# 🔧 Dynamic Systems Modeler: Base Graph Construction

**Role**: You are a senior evidence-synthesis analyst building a custom systems graph from user-defined taxonomy.

---

## INPUTS

**MAIN QUERY**: {main_query}

**CUSTOM TAXONOMY** ({total_children} child nodes across {parent_count} categories):
{taxonomy_json}

**EXTRACTED CITATIONS** ({citation_count} sources):
{citations_json}

---

## TASK: Build Comprehensive Systems Evidence Graph

### Graph Requirements:

**Network Structure:**
- **Nodes**: Use ALL {total_children} child nodes from the taxonomy (no selection needed)
- **Edges**: Create highly dense network with 100-200 edges (edge-to-node ratio: 2.0-4.0)
- **Density**: Very dense, highly interconnected network with extensive cross-category connections
- **Feedback Loops**: Minimum 8-12 bidirectional relationships

**Node Type Distribution (MANDATORY):**
- **Drivers** (30-40%): Root causes and contributing factors
- **Mediators** (40-50%): Intermediate pathways and mechanisms
- **Status Quo** (10-15%): Current state indicators directly related to main query
- **Implications** (5-10%): Future consequences and outcomes

**Connectivity Requirements:**
- **Cross-Category Edges**: Minimum 20-30 edges connecting nodes from different parent categories
- **Feedback Loops**: Minimum 8-12 bidirectional relationships (A ↔ B)
- **Multi-Path Connections**: Every driver should connect to ≥3 mediators
- **Lateral Connections**: Include extensive driver→driver and mediator→mediator connections where evidence supports
- **Hub Nodes**: Identify 5-8 highly connected nodes (degree ≥ 10) that act as system hubs

---

## EDGE WEIGHTING METHODOLOGY

For each edge **A → B**, compute weight [0-1] using:

**1. Effect Magnitude Score (0-1):**
- **Odds Ratio/Relative Risk**:
  - OR/RR ≤ 1.2: 0.2
  - OR/RR 1.2-1.5: 0.4
  - OR/RR 1.5-2.0: 0.6
  - OR/RR 2.0-3.0: 0.8
  - OR/RR > 3.0: 0.9
- **Correlation**: Use |r| directly, cap at 0.9
- **Qualitative**: Weak=0.3, Moderate=0.5, Strong=0.7

**2. Evidence Quality (0-1):**
- RCT/Meta-analysis: 0.95
- Longitudinal cohort: 0.8
- Cross-sectional study: 0.6
- Administrative statistics: 0.7-0.9
- Expert consensus/think-tank: 0.5
- News citing primary source: 0.4

**3. Recency (0-1):**
- ≤3 years: 1.0
- 3-7 years: 0.8
- >7 years: 0.6

**4. Relevance to Context (0-1):**
- Direct context match: 1.0
- Similar geography/population: 0.8
- General evidence (well-established): 0.6
- Tangential/extrapolated: 0.4

**Final Edge Weight Formula:**
```
weight = min(0.95, magnitude × quality × recency × relevance)
```

**Confidence Level:**
- **High**: Multiple high-quality studies, consistent findings
- **Medium**: Some good studies, moderate consistency
- **Low**: Limited evidence, single source, or conflicting data

**Relation Type:**
- **causal**: Direct cause-effect supported by interventional or longitudinal evidence
- **associational**: Correlation without established causation
- **feedback**: Bidirectional influence (reinforcing or balancing loop)

**Sign:**
- **+**: Positive relationship (increase in A → increase in B)
- **-**: Negative relationship (increase in A → decrease in B)

---

## NODE REQUIREMENTS

**Every node must include:**

**1. KPI (Key Performance Indicator):**
- **name**: Specific measurable indicator
- **current_value**: Actual numeric value (seek real data!)
- **unit**: Measurement unit (%, per 1000, $, etc.)
- **year**: Year of measurement
- **trend**: "up" | "down" | "flat" based on recent trajectory

**Example:**
```json
"kpi": {{
  "name": "Adult obesity rate",
  "current_value": 42.4,
  "unit": "%",
  "year": 2023,
  "trend": "up"
}}
```

**2. Severity (1-5):**
- 1: Low impact/concern
- 2: Moderate impact
- 3: Significant impact
- 4: High impact/priority
- 5: Critical/urgent issue

**3. Citations (1-3 per node):**
- Rank by relevance
- Include DOI/URL
- Provide key quote supporting the KPI or severity assessment

---

## PARENT NODE STRUCTURE

**IMPORTANT**: The graph must include BOTH parent category nodes AND child nodes:

**Parent Nodes** ({parent_count} total):
- One parent node for each of the {parent_count} parent categories
- **ID format**: Use sanitized version of category name (lowercase, underscores): `parent_healthcare_access`
- **Type**: `"category"` (reserved type for parent nodes)
- **Parent edges**: Each parent connects ONLY to its own children (no parent-to-parent edges)
- **Edge properties**: weight=1.0, relation="categorical", sign="+"
- **No KPI needed**: Parent nodes don't need KPI data (they're abstract categories)

**Child Nodes** ({total_children} total):
- All child nodes from taxonomy
- Each child has `parent_category` field indicating which parent it belongs to
- Children can connect to ANY other child (including cross-category)

**Example Structure**:
```
Parent: Healthcare Access (id: parent_healthcare_access)
  ├─→ Child: Hospital density (id: hospital_density)
  ├─→ Child: Insurance coverage (id: insurance_coverage)
  └─→ Child: Wait times (id: wait_times)
```

---

## OUTPUT FORMAT

Return a single JSON object with this exact structure:

```json
{{
  "meta": {{
    "main_query": "{main_query}",
    "taxonomy_type": "custom",
    "generated_at": "<ISO8601 timestamp>",
    "total_nodes": 0,  // Should be {parent_count} + {total_children}
    "total_edges": 0,
    "edge_to_node_ratio": 0.0
  }},
  "nodes": [
    // PARENT NODES FIRST ({parent_count} nodes)
    {{
      "id": "parent_category_name",  // Sanitized category name
      "label": "Parent Category Name",
      "parent_category": null,  // Parent nodes have no parent
      "type": "category",  // Special type for parent nodes
      "severity_1to5": 3,  // Default severity
      "notes": "Parent category grouping related child factors"
    }},
    // CHILD NODES ({total_children} nodes)
    {{
      "id": "child_node_id",  // Must match ID from taxonomy
      "label": "Child Node Label",
      "parent_category": "Parent Category Name",  // Must match a parent node label
      "type": "driver|mediator|status_quo|implication",
      "kpi": {{
        "name": "Specific indicator name",
        "current_value": 42.5,
        "unit": "%",
        "year": 2023,
        "trend": "up"
      }},
      "severity_1to5": 4,
      "notes": "Additional context or explanation",
      "citations": [
        {{
          "rank": 1,
          "title": "Citation title",
          "publisher": "Publisher/Journal",
          "year": "2023",
          "url": "https://...",
          "doi": "10.xxxx/xxxxx",
          "evidence_type": "peer_reviewed|official_stat|think_tank|news",
          "key_quote": "Direct quote supporting this node"
        }}
      ]
    }}
  ],
  "edges": [
    // PARENT-TO-CHILD EDGES (one edge from each parent to each of its children)
    {{
      "source": "parent_category_name",  // Parent node ID
      "target": "child_node_id",  // Child node ID
      "relation": "categorical",  // Fixed relation type for parent-child
      "sign": "+",  // Always positive
      "weight_0to1": 1.0,  // Always 1.0 for categorical edges
      "confidence": "High",
      "supporting_evidence": [],  // Not needed for categorical edges
      "notes": "Categorical grouping edge"
    }},
    // CHILD-TO-CHILD EDGES (dense interconnections between children)
    {{
      "source": "source_child_id",  // Must be a child node ID
      "target": "target_child_id",  // Must be a child node ID
      "relation": "causal|associational|feedback",
      "sign": "+|-",
      "weight_0to1": 0.72,
      "confidence": "High|Medium|Low",
      "supporting_evidence": [
        {{
          "rank": 1,
          "title": "",
          "publisher": "",
          "year": "",
          "url": "",
          "doi": "",
          "key_quote": "Quote showing A affects B"
        }}
      ],
      "notes": "Explanation of the relationship mechanism"
    }}
  ]
}}
```

---

## CRITICAL RULES

1. **Use All Nodes**: Include ALL {total_children} child nodes from the taxonomy in the graph. Do not filter or select - use every single child node provided.

2. **Quantification Priority**: Always seek numeric KPI values. If not available, note "Data not available" but still include the node.

3. **Evidence-Backed**: Every edge must have ≥1 supporting citation. No speculative connections.

4. **Cross-Category Connections**: Ensure minimum 20-30 edges cross parent category boundaries (e.g., "Economic Factor" → "Health Outcome").

5. **Feedback Loops**: Identify true bidirectional relationships (not just A→B and B→A as separate edges, but genuine feedback mechanisms). Include 8-12 feedback loops.

6. **NO Duplicate Edges**: Each source→target pair should appear only once.

7. **Dense Connectivity**: Create a highly interconnected graph where most nodes have 4-8 connections. Some hub nodes should have 10+ connections.

8. **Valid JSON**: Ensure all brackets closed, no trailing commas, proper escaping.

---

## OUTPUT INSTRUCTIONS

- Return ONLY the JSON object
- NO markdown code blocks (no ```json)
- NO explanations before or after
- Ensure valid, parseable JSON
- Include meta.total_nodes and meta.total_edges counts

Build the comprehensive systems graph now:"""

    INTERVENTION_MODIFICATION_PROMPT = """# 🔧 Dynamic Systems Modeler: Intervention Scenario Analysis

**Role**: You are a scenario modeling expert predicting how an intervention reshapes a systems graph.

---

## INPUTS

**BASE GRAPH**:
{base_graph_json}

**INTERVENTION**: {intervention_name}

**INTERVENTION DETAILS**:
{intervention_details}

**INTERVENTION EVIDENCE** (from targeted research):
{intervention_citations}

---

## TASK: Predict Intervention Impact on System

Analyze how this intervention modifies the base graph structure, relationships, and outcomes.

### Analysis Dimensions:

**1. NODE KPI CHANGES**
For each node, determine if the intervention changes its KPI value:

- **Direct Effects**: Nodes explicitly targeted by the intervention
- **First-Order Effects**: Nodes directly connected to changed nodes
- **Second-Order Effects**: Cascading changes through the network

For each changed node, provide:
- **New KPI value** with confidence level
- **Timeframe** for change (immediate, 6-12 months, 12-24 months, 2+ years)
- **Evidence** supporting the predicted change
- **Mechanism** explaining HOW the intervention causes this change

**2. EDGE WEIGHT CHANGES**
Identify which relationships strengthen, weaken, or remain stable:

- **Strengthened Edges**: Weight increases (intervention amplifies relationship)
- **Weakened Edges**: Weight decreases (intervention dampens relationship)
- **Stable Edges**: No significant change

For each changed edge, provide:
- **New weight** [0-1]
- **Explanation** of why the relationship changed
- **Evidence** from intervention citations

**3. NEW EDGES**
Does the intervention create new pathways or relationships?

Examples:
- "Pharmaceutical access" → "Obesity rate" (if intervention is drug approval)
- "Technology adoption" → "Employment" (if intervention is AI regulation)

For each new edge:
- Source and target nodes (must exist in base graph)
- Weight, confidence, relation type, sign
- Evidence and explanation

**4. REMOVED/NEGLIGIBLE EDGES**
Which relationships become insignificant or disappear?

Examples:
- If intervention makes certain factors irrelevant
- If intervention blocks a pathway

**5. SYSTEMIC IMPACTS**
Consider broader system dynamics:
- **Amplification**: Does intervention strengthen feedback loops?
- **Dampening**: Does intervention weaken problematic cycles?
- **Unintended Consequences**: New negative pathways?
- **Time Delays**: Lag between intervention and effects?

---

## EVIDENCE REQUIREMENTS

**For EVERY change you predict:**
1. **Cite supporting evidence** from intervention_citations
2. **Explain mechanism** (how does the intervention cause this?)
3. **Assign confidence**:
   - **High**: Strong direct evidence from intervention research
   - **Medium**: Moderate evidence or logical inference from related studies
   - **Low**: Speculative based on system dynamics, no direct evidence

**CRITICAL RULE**: Only predict changes you can justify with evidence or sound reasoning. When uncertain, maintain base graph values and note "Insufficient evidence for prediction."

---

## OUTPUT FORMAT

Return a JSON object with the modified graph + delta summary:

```json
{{
  "modified_graph": {{
    "meta": {{
      "main_query": "...",
      "intervention": "{intervention_name}",
      "base_graph_id": "...",
      "generated_at": "<ISO8601>",
      "total_nodes": 0,
      "total_edges": 0
    }},
    "nodes": [
      {{
        "id": "node_id",
        "label": "Node Label",
        "parent_category": "Category",
        "type": "driver|mediator|status_quo|implication",
        "kpi": {{
          "name": "...",
          "current_value": 38.2,  // CHANGED from base
          "unit": "%",
          "year": 2025,
          "trend": "down"  // CHANGED from "up"
        }},
        "severity_1to5": 3,  // May change from base
        "notes": "Intervention effect: ...",
        "citations": [...]
      }}
    ],
    "edges": [
      {{
        "source": "...",
        "target": "...",
        "relation": "...",
        "sign": "+",
        "weight_0to1": 0.58,  // CHANGED from base 0.72
        "confidence": "High",
        "supporting_evidence": [...],
        "notes": "Intervention dampens this relationship because..."
      }}
    ]
  }},
  "delta": {{
    "summary": {{
      "intervention": "{intervention_name}",
      "timeframe": "12-24 months",
      "nodes_changed": 12,
      "edges_changed": 18,
      "new_edges": 2,
      "removed_edges": 1,
      "avg_weight_change": 0.08,
      "impact_magnitude": "Moderate|Significant|Transformative"
    }},
    "node_changes": [
      {{
        "node_id": "obesity_rate",
        "node_label": "Adult obesity rate",
        "base_kpi": {{
          "value": 42.4,
          "unit": "%",
          "year": 2023
        }},
        "intervention_kpi": {{
          "value": 38.2,
          "unit": "%",
          "year": 2025
        }},
        "absolute_change": -4.2,
        "percent_change": -9.9,
        "confidence": "Medium",
        "timeframe": "12-24 months",
        "mechanism": "GLP-1 agonist reduces appetite and increases satiety, leading to sustained weight loss",
        "evidence_summary": "Clinical trials show 15-20% weight loss over 18 months; population-level impact modeled at 10% reduction in obesity rate assuming 20% uptake"
      }}
    ],
    "edge_changes": [
      {{
        "source": "food_environment",
        "target": "obesity_rate",
        "base_weight": 0.72,
        "intervention_weight": 0.58,
        "absolute_change": -0.14,
        "percent_change": -19.4,
        "confidence": "Medium",
        "explanation": "GLP-1 drugs partially decouple food environment from obesity outcomes by reducing appetite irrespective of food availability",
        "evidence_summary": "Studies show medication adherence reduces environmental food cue responsiveness"
      }}
    ],
    "new_edges": [
      {{
        "source": "pharmaceutical_access",
        "target": "obesity_rate",
        "weight": 0.65,
        "sign": "-",
        "confidence": "High",
        "explanation": "New direct pathway: OTC availability creates strong negative relationship (more access → lower obesity)",
        "evidence_summary": "Intervention creates this pathway; does not exist in base graph"
      }}
    ],
    "removed_edges": [
      {{
        "source": "...",
        "target": "...",
        "base_weight": 0.35,
        "explanation": "Intervention eliminates this pathway"
      }}
    ],
    "key_insights": [
      "Intervention directly reduces obesity rate by ~10% over 24 months",
      "Secondary benefit: Reduced healthcare costs via obesity-related disease prevention",
      "Potential risk: Increased pharmaceutical dependency",
      "Food environment factors become less deterministic of obesity outcomes"
    ]
  }}
}}
```

---

## CRITICAL RULES

1. **Maintain Node Structure**: Use the SAME node IDs from base graph. Do not add or remove nodes.

2. **Evidence-Based Changes**: Only modify KPIs/weights that have supporting evidence in intervention_citations.

3. **Preserve Unchanged Elements**: If a node/edge is not affected by the intervention, keep its base graph values exactly.

4. **Confidence Labeling**: Be honest about uncertainty. Use "Low" confidence when extrapolating.

5. **Mechanism Explanation**: For every change, explain the causal pathway.

6. **Time Sensitivity**: Note when effects manifest (some changes are immediate, others take years).

7. **Valid JSON**: Return parseable JSON with no markdown blocks.

---

Return the complete modified graph and delta analysis now:"""

    INTERVENTION_CITATION_SEARCH_PROMPT = """You are a research analyst searching for evidence about how an intervention affects a specific factor.

**INTERVENTION**: {intervention_name}
**INTERVENTION DETAILS**: {intervention_details}
**TARGET FACTOR**: {factor_name} (from category: {parent_category})
**CONTEXT**: {main_query}

Search for evidence answering:
1. Does this intervention directly impact {factor_name}?
2. What is the magnitude of impact? (effect size, percentage change, etc.)
3. What is the timeframe for impact?
4. What mechanisms explain the impact?

Focus on:
- Peer-reviewed studies on the intervention
- Government/policy analyses
- Real-world outcomes from similar interventions
- Meta-analyses or systematic reviews
- Expert projections

Extract top 3-5 citations with:
- Title, publisher, year, DOI/URL
- Key quote showing impact on {factor_name}
- Effect size or quantitative estimate if available

Return as JSON array of citations."""

    # ============================================================================
    # TAXONOMY GENERATION PROMPTS
    # ============================================================================

    PARENT_CATEGORY_SUGGESTION_PROMPT = """# 🧠 Dynamic Systems Modeler: Parent Category Suggestion

**Role**: You are a systems thinking expert helping structure a causal analysis.

**MAIN QUERY**: {main_query}

**TASK**: Suggest exactly 10 high-level parent categories that comprehensively cover all major factors influencing the main query.

**Requirements**:
1. **Comprehensive Coverage**: Categories should span all relevant domains (economic, social, environmental, political, technological, health, etc.)
2. **MECE Principle**: Mutually Exclusive, Collectively Exhaustive - no overlap, no gaps
3. **Actionable Scope**: Each category should contain 3-7 specific child factors
4. **Strategic Relevance**: Focus on categories where interventions could have impact
5. **Balanced Breadth**: Mix of proximal and distal factors, immediate and systemic causes

**Output Format**:
Return ONLY a JSON array of exactly 10 category names:
["Category 1", "Category 2", ..., "Category 10"]

**Example** (for query "What are the drivers of childhood obesity in the US?"):
["Food Environment", "Physical Activity Infrastructure", "Healthcare Access", "Socioeconomic Factors", "Education & Awareness", "Marketing & Media", "Built Environment", "Family & Social Dynamics", "Policy & Regulation", "Food Industry Practices"]

Generate the 10 parent categories now:"""

    CHILDREN_GENERATION_PROMPT = """You are a systems analysis expert. Generate {target_count} highly relevant child nodes for a parent category.

TASK:
Main Query: {main_query}
Parent Category: {parent_category}

RESEARCH CONTEXT (from web search):
{research_context}

Generate {target_count} child nodes that:
1. Are specific, measurable factors (not vague concepts)
2. Have strong evidence of impact on the main query
3. Are distinct from each other (no overlap)
4. Cover different mechanisms/pathways
5. Are actionable for policy/intervention analysis

OUTPUT FORMAT (JSON only):
{{
  "children": [
    {{
      "id": "snake_case_id",
      "label": "Clear descriptive label",
      "description": "1-sentence explanation of what this factor measures",
      "evidence_strength": "High|Medium|Low",
      "measurability": "High|Medium|Low"
    }}
  ]
}}

CRITICAL RULES:
- Return ONLY valid JSON
- NO markdown code blocks (no ```json or ```)
- NO explanations before or after the JSON
- Exactly {target_count} children
- Each child must have all 5 fields
- IDs must be unique and snake_case

Return the JSON now:"""

    CATEGORY_SUMMARY_PROMPT = """You are analyzing a systems dynamics model for: "{main_query}"

For each of the {category_count} parent categories below, generate a concise 3-paragraph executive summary (50-70 words per paragraph, 150-210 words total per category):

**Paragraph 1**: How this category fundamentally relates to the main problem statement "{main_query}". What role does it play in the system?

**Paragraph 2**: Key quantitative insights from the child factors listed. Cite specific KPI values and their significance.

**Paragraph 3**: How this category connects to other parts of the system and what strategic implications this has.

Use professional, analytical tone. Be specific and data-driven.

{contexts_text}

Return ONLY a JSON object with this structure:
{{
  "Category Name 1": "paragraph1\\n\\nparagraph2\\n\\nparagraph3",
  "Category Name 2": "paragraph1\\n\\nparagraph2\\n\\nparagraph3"
}}

Each summary should be exactly 3 paragraphs separated by \\n\\n. No markdown, no extra formatting, just plain text paragraphs."""

    # ============================================================================
    # NODE DEEP DIVE PROMPTS
    # ============================================================================

    NODE_ANALYSIS_PROMPT = """# 🔍 Node Deep Dive Analysis

**Role**: You are a systems analysis expert explaining a single node in a causal graph.

---

## INPUTS

**Main Query**: {main_query}

**Node Information**:
- **ID**: {node_id}
- **Label**: {node_label}
- **Type**: {node_type}
- **Parent Category**: {parent_category}
- **Severity**: {severity}/5

**Key Performance Indicator**:
{kpi_info}

**Connected Edges** (sources and targets):
{edges_json}

**Supporting Citations**:
{citations_json}

---

## TASK: Generate Comprehensive Node Analysis

Provide a detailed analysis of this node in 4 sections:

### 1. Overview (3-4 sentences)
- What is this node and why does it matter for "{main_query}"?
- Current state based on KPI data (cite specific values)
- Role in the system (is it a root driver, mediator, status quo indicator, or downstream implication?)
- Overall significance in the causal network

### 2. Connection Analysis
For EACH edge connected to this node (both incoming and outgoing):
- **Explain WHY this connection exists** - what is the causal mechanism or correlation?
- **Cite specific evidence** from the supporting_evidence field
- **Justify the weight** (0-1 scale) based on evidence quality, effect magnitude, and relevance
- **Explain the sign** (+/-) - does source increase or decrease target?

Return as array of connection objects (one per edge).

### 3. Severity Calculation (2-3 sentences)
- Why is this node rated {severity}/5 for severity?
- What factors contributed to this rating? (urgency, impact magnitude, trend direction, etc.)
- Data or evidence supporting this assessment

### 4. Strategic Implications (3-5 bullet points)
- Why is this node important as a **leverage point** for intervention?
- What happens if this node's value changes (increases or decreases)?
- Cascading effects through the system (which other nodes would be affected?)
- Intervention opportunities or policy recommendations

---

## OUTPUT FORMAT

Return ONLY a valid JSON object with this exact structure:

```json
{{
  "overview": "3-4 sentence overview paragraph...",
  "connections": [
    {{
      "edge_id": "source_id→target_id",
      "direction": "incoming|outgoing",
      "source": "source_node_id",
      "target": "target_node_id",
      "explanation": "Why this connection exists and the causal mechanism...",
      "evidence_summary": "Based on [citation title/source] showing [key finding]...",
      "weight_justification": "Weight is {{weight}} because [evidence quality/magnitude/relevance]...",
      "sign_explanation": "Positive/Negative effect because [reasoning]..."
    }}
  ],
  "severity_explanation": "2-3 sentence explanation of why severity is {severity}/5...",
  "strategic_implications": [
    "Implication 1...",
    "Implication 2...",
    "Implication 3..."
  ]
}}
```

---

## CRITICAL RULES

1. **Evidence-Based**: Every claim must be backed by citations or data from the inputs
2. **Specific**: Use actual KPI values, edge weights, citation titles - no vague statements
3. **Complete**: Include analysis for ALL connected edges (no cherry-picking)
4. **Accurate Edge IDs**: Use format "source_id→target_id" (must match actual edge source/target)
5. **Valid JSON**: No markdown code blocks, no trailing commas, proper escaping
6. **Connection Direction**: Mark each edge as "incoming" (points TO this node) or "outgoing" (points FROM this node)

---

Generate the node analysis now:"""

    INTERVENTION_NODE_ANALYSIS_PROMPT = """# 🔍 Intervention Impact: Node Analysis

**Role**: You are analyzing how an intervention changed a specific node in a causal graph.

---

## INPUTS

**Main Query**: {main_query}
**Intervention**: {intervention_name}

**Node Information**:
- **ID**: {node_id}
- **Label**: {node_label}

**BASE STATE** (before intervention):
- **KPI**: {base_kpi}
- **Severity**: {base_severity}/5

**INTERVENTION STATE** (after intervention):
- **KPI**: {intervention_kpi}
- **Severity**: {intervention_severity}/5

**CHANGE METRICS**:
- **Absolute Change**: {absolute_change}
- **Percent Change**: {percent_change}%
- **Mechanism**: {mechanism}

**Connected Edges** (in intervention graph):
{edge_changes_json}

**Delta Context**:
{delta_context}

---

## TASK: Generate Intervention-Focused Analysis

Provide analysis in 4 sections, focusing on HOW THE INTERVENTION CHANGED THIS NODE:

### 1. Intervention Impact Overview (3-4 sentences)
- How did "{intervention_name}" change this node?
- Magnitude of change (quantitative - cite actual numbers)
- Timeframe for these changes to manifest
- Overall assessment: Did the intervention improve, worsen, or have neutral effect?

### 2. Connection Changes
For EACH edge that was affected by the intervention:
- How did the intervention modify this relationship?
- Why did the edge weight change (if it did)?
- New dynamics or pathways introduced by the intervention
- Evidence supporting these changes

### 3. Severity Change Explanation (2-3 sentences)
- Why did severity change from {base_severity}/5 to {intervention_severity}/5?
- What specific aspects did the intervention address or create?
- Is this node more or less critical after the intervention?

### 4. Strategic Implications Under Intervention (3-5 bullet points)
- Is this node still a leverage point, or has its role changed?
- New opportunities or risks introduced by the intervention
- Cascading effects of this change on other parts of the system
- Recommendations for maximizing intervention benefits or mitigating risks

---

## OUTPUT FORMAT

Return ONLY a valid JSON object with this exact structure:

```json
{{
  "overview": "3-4 sentence intervention impact overview...",
  "connections": [
    {{
      "edge_id": "source_id→target_id",
      "direction": "incoming|outgoing",
      "source": "source_node_id",
      "target": "target_node_id",
      "explanation": "How intervention modified this relationship...",
      "evidence_summary": "Evidence for this change...",
      "weight_justification": "Weight changed from {{base}} to {{intervention}} because...",
      "sign_explanation": "Effect sign and reasoning..."
    }}
  ],
  "severity_explanation": "Why severity changed from {base_severity} to {intervention_severity}...",
  "strategic_implications": [
    "Intervention-specific implication 1...",
    "Intervention-specific implication 2...",
    "Intervention-specific implication 3..."
  ]
}}
```

---

## CRITICAL RULES

1. **Intervention-Focused**: All analysis should explain changes DUE TO the intervention
2. **Quantitative**: Cite actual numbers (absolute change, percent change, KPI values)
3. **Comparative**: Always compare base state vs intervention state
4. **Mechanism-Driven**: Explain HOW the intervention causes the observed changes
5. **Valid JSON**: No markdown code blocks, proper structure
6. **Evidence-Based**: Reference the mechanism and delta context provided

---

Generate the intervention node analysis now:"""
