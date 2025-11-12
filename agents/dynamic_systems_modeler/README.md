# Dynamic Systems Modeler (DSM)

**Strategy& PWC - New Product Line**

## Overview

Dynamic Systems Modeler is an intervention-based scenario analysis tool that allows users to:
1. Define custom taxonomy for their domain
2. Build evidence-based systems graphs
3. Model multiple intervention scenarios
4. Compare before/after impacts with delta analysis

## Key Differentiators

- **User-Defined Taxonomy**: Not limited to fixed categories
- **LLM-Generated Children**: AI suggests relevant factors for each parent category
- **Intervention Scenarios**: Model "what-if" scenarios with evidence
- **Delta Analysis**: See exactly what changes between base and intervention graphs
- **Multiple Scenarios**: Compare multiple interventions side-by-side

## Architecture

```
User Request
    ↓
Taxonomy Generator → LLM generates children for 10 parent categories
    ↓
Graph Builder → Builds base graph with citations (20-25 nodes, 30-50 edges)
    ↓
[Base Graph Created]
    ↓
Intervention Engine → For each intervention:
    ├── Search intervention evidence
    ├── Modify graph (hybrid approach)
    └── Compute delta
    ↓
[Intervention Graph + Delta]
```

## Modules

### 1. `taxonomy_generator.py`
- Generates custom taxonomy from 10 parent categories
- Uses web search + LLM to suggest 3-5 children per parent
- User can review/edit before graph construction
- Research-backed approach (Option B)

### 2. `graph_builder.py`
- Builds base graph from custom taxonomy
- Parallel citation extraction for all child nodes
- GPT-5 reasoning to construct dense graph
- 20-25 nodes, 30-50 edges with evidence

### 3. `intervention_engine.py`
- Generates intervention scenario graphs
- Hybrid approach (Option C):
  - Maintains same node structure
  - Targeted citation search for intervention impact
  - LLM modifies weights + KPIs
  - Computes delta

### 4. `delta_calculator.py`
- Computes differences between base and intervention
- Node-level changes (KPI values)
- Edge-level changes (weights)
- Summary statistics
- New/removed edges

### 5. `prompts.py`
- All prompts for DSM pipeline
- Base graph construction prompt
- Intervention modification prompt
- Citation search prompts

## API Endpoints

### Taxonomy Generation
```
POST /api/dsm/taxonomy
{
  "main_query": "High obesity rates in United States",
  "parent_categories": [
    "Food Environment",
    "Exercise & Physical Activity",
    "Healthcare Access",
    "Economic Factors",
    "Education System",
    "Cultural Norms",
    "Built Environment",
    "Policy & Regulation",
    "Technology & Media",
    "Mental Health"
  ]
}

Response: { "query_id": "uuid", "message": "..." }
```

### Base Graph Construction
```
POST /api/dsm/base-graph
{
  "main_query": "...",
  "taxonomy": { /* complete taxonomy with children */ }
}

Response: { "query_id": "uuid", "message": "..." }
```

### Intervention Creation
```
POST /api/dsm/intervention
{
  "base_graph_id": "uuid",
  "intervention_name": "FDA approves Ozempic for OTC use",
  "intervention_details": {
    "type": "policy_change",
    "timeframe": "12-24 months"
  }
}

Response: { "query_id": "uuid", "message": "..." }
```

### Get Query Status
```
GET /api/dsm/queries/{query_id}

Response: {
  "query_id": "...",
  "status": "done|processing|failed",
  "stage": "taxonomy_ready|base_graph_ready|intervention_ready",
  "node_count": 23,
  "edge_count": 38,
  ...
}
```

### List Base Graphs
```
GET /api/dsm/base-graphs

Response: [ { query_status }, ... ]
```

### List Interventions
```
GET /api/dsm/interventions/{base_graph_id}

Response: [ { intervention_status }, ... ]
```

### Get Content
```
GET /api/dsm/content/{query_id}/{content_type}

Content types:
- taxonomy: Custom taxonomy JSON
- base_graph: Base graph JSON
- intervention_graph: Modified graph JSON
- delta: Delta analysis JSON
- executive: Executive summary (markdown)
- csv: Data tables
- visualization: Interactive HTML

Response: { "content": "...", "content_type": "..." }
```

## Data Flow

### Phase 1: Taxonomy Generation (2-3 min)
```
User → 10 parents
  ↓
For each parent:
  - Web search for relevant factors
  - LLM selects top 3-5 children
  ↓
Return complete taxonomy (~30-50 children)
  ↓
User reviews/edits
```

### Phase 2: Base Graph (10-15 min)
```
Taxonomy + Main Query
  ↓
Parallel citation extraction (all children)
  ↓
GPT-5 reasoning: Build graph
  - Select 20-25 most impactful nodes
  - Create 30-50 edges with weights
  - Assign KPIs to nodes
  ↓
Store: base_graph.json
```

### Phase 3: Intervention (10-15 min per intervention)
```
Base Graph + Intervention Name
  ↓
Targeted evidence search
  - For top affected nodes
  - Find intervention-specific impact data
  ↓
GPT-5 reasoning: Modify graph
  - Update node KPIs
  - Adjust edge weights
  - Add/remove edges if justified
  ↓
Compute delta (base vs intervention)
  ↓
Store: intervention_graph.json, delta.json
```

## Delta Structure

```json
{
  "summary": {
    "nodes_changed": 12,
    "edges_changed": 18,
    "new_edges": 2,
    "removed_edges": 1,
    "avg_weight_change": 0.08
  },
  "node_changes": [
    {
      "node_id": "obesity_rate",
      "base_kpi": { "value": 42.4, "unit": "%" },
      "intervention_kpi": { "value": 38.2, "unit": "%" },
      "absolute_change": -4.2,
      "percent_change": -9.9,
      "confidence": "Medium"
    }
  ],
  "edge_changes": [
    {
      "source": "food_environment",
      "target": "obesity_rate",
      "base_weight": 0.72,
      "intervention_weight": 0.58,
      "absolute_change": -0.14,
      "direction": "weakened"
    }
  ],
  "new_edges": [...],
  "removed_edges": [...]
}
```

## Cost Analysis

**Per Base Graph:** ~$10
- Taxonomy generation: $2
- Citation extraction: $3
- Graph construction: $5

**Per Intervention:** ~$7
- Evidence search: $3
- Graph modification: $4

**Typical Use Case:** 1 base + 5 interventions = $45

## Usage Example

```python
from services.dsm_service import dsm_service

# Step 1: Generate taxonomy
taxonomy_id = dsm_service.submit_taxonomy_generation(
    "High obesity rates in US",
    ["Food Environment", "Exercise", ...]
)

# Wait for completion, get taxonomy
taxonomy_data = dsm_service.get_query(taxonomy_id)
taxonomy = taxonomy_data['taxonomy']

# Step 2: Build base graph
base_id = dsm_service.submit_base_graph(
    "High obesity rates in US",
    taxonomy
)

# Step 3: Add interventions
intervention_id_1 = dsm_service.submit_intervention(
    base_id,
    "FDA approves Ozempic for OTC use"
)

intervention_id_2 = dsm_service.submit_intervention(
    base_id,
    "National sugar tax implemented"
)

# Get comparison
interventions = dsm_service.list_interventions(base_id)
```

## Next Steps

1. **Frontend Components** (in progress)
   - TaxonomyBuilder
   - BaseGraphViewer
   - InterventionModal
   - DeltaVisualization
   - ComparisonView

2. **Visualization Enhancements**
   - Color-coded delta highlighting
   - Side-by-side comparison
   - Temporal slider animation
   - Export comparison reports

3. **Advanced Features**
   - Intervention templates
   - Sequential interventions (chaining)
   - Probabilistic scenarios
   - Sensitivity analysis

## Notes

- Built as completely separate product from System Compass
- Reuses infrastructure (Azure Tables, Blobs, GraphRepository)
- All graphs use same visualization library (Cytoscape.js)
- Can potentially import System Compass taxonomies later
