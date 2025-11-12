"""
Intervention Engine - Generates intervention scenario graphs
Strategy& PWC - Dynamic Systems Modeler
"""

import json
from typing import Dict, List, Optional
from pathlib import Path
import sys
import concurrent.futures
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from agents.dynamic_systems_modeler.prompts import DSMPrompts
from agents.dynamic_systems_modeler.delta_calculator import DeltaCalculator

# ============================================================================
# CONSTANTS
# ============================================================================

MODEL_SEARCH = "gpt-4o-search-preview"
MAX_TOKENS_SEARCH = 16384
MAX_WORKERS_SEARCH = 5

JSON_CODE_BLOCK_START = "```json"
JSON_CODE_BLOCK_END = "```"

LOG_SEARCHING_INTERVENTION = "🔍 Searching intervention evidence for {count} nodes..."
LOG_INTERVENTION_SEARCH_DONE = "✅ Intervention evidence collected: {count} citations"
LOG_MODIFYING_GRAPH = "🔨 Modifying graph with GPT-5 for intervention scenario..."
LOG_INTERVENTION_COMPLETE = "✅ Intervention graph complete: {changed_nodes} nodes changed, {changed_edges} edges modified"

# ============================================================================


class InterventionEngine:
    """Generates modified graphs based on intervention scenarios."""

    def __init__(self):
        self.openai_manager = get_openai_client()
        self.delta_calculator = DeltaCalculator()

    def generate_intervention_graph(
        self,
        base_graph: Dict,
        intervention_name: str,
        intervention_details: Optional[Dict] = None,
        base_node_analyses: Optional[Dict] = None,
        progress_callback: Optional[callable] = None
    ) -> tuple[Dict, Dict, Dict]:
        """
        Generate intervention scenario graph from base graph.

        Args:
            base_graph: The base graph JSON
            intervention_name: Name/description of the intervention
            intervention_details: Optional structured details about intervention
            base_node_analyses: Optional node analyses from base graph
            progress_callback: Optional callback for progress updates

        Returns:
            Tuple of (modified_graph_json, delta_json, node_analyses_json)
        """
        print(f"🎯 Generating intervention scenario: {intervention_name}")

        # Step 1: Search for intervention-specific evidence
        intervention_citations = self._search_intervention_evidence(
            base_graph,
            intervention_name,
            intervention_details
        )

        print(LOG_INTERVENTION_SEARCH_DONE.format(count=len(intervention_citations)))

        # Step 2: Use GPT-5 to modify graph based on intervention
        print(LOG_MODIFYING_GRAPH)
        result = self._modify_graph_with_llm(
            base_graph,
            intervention_name,
            intervention_details or {},
            intervention_citations
        )

        modified_graph = result['modified_graph']
        delta = result['delta']

        # Step 3: Validate modified graph (remove invalid edges)
        self._validate_intervention_graph(modified_graph)

        # Step 4: Validate and enrich delta
        self._enrich_delta(delta, base_graph, modified_graph)

        # Step 5: Generate intervention-aware node analyses
        main_query = base_graph.get('meta', {}).get('main_query', '')
        print("🔍 Generating intervention impact analyses...")
        from agents.dynamic_systems_modeler.node_analyzer import NodeAnalyzer
        analyzer = NodeAnalyzer()

        # Use base analyses if provided, otherwise empty dict
        base_analyses = base_node_analyses or {}

        node_analyses = analyzer.generate_intervention_node_analyses(
            modified_graph,
            base_graph,
            delta,
            intervention_name,
            main_query,
            base_analyses
        )

        print(LOG_INTERVENTION_COMPLETE.format(
            changed_nodes=delta['summary']['nodes_changed'],
            changed_edges=delta['summary']['edges_changed']
        ))

        return modified_graph, delta, node_analyses

    def _search_intervention_evidence(
        self,
        base_graph: Dict,
        intervention_name: str,
        intervention_details: Optional[Dict]
    ) -> List[Dict]:
        """Search for evidence about how intervention affects graph nodes."""

        nodes = base_graph.get('nodes', [])
        main_query = base_graph.get('meta', {}).get('main_query', '')

        print(LOG_SEARCHING_INTERVENTION.format(count=len(nodes)))

        # Search for top affected nodes (sample to reduce cost)
        # In production, could be smarter about which nodes to research
        top_nodes = nodes[:15]  # Research top 15 nodes

        all_citations = []

        def search_for_node(node):
            try:
                citations = self._search_node_intervention_impact(
                    intervention_name,
                    intervention_details,
                    node,
                    main_query
                )
                return citations
            except Exception as e:
                print(f"⚠️ Search failed for {node['label']}: {e}")
                return []

        # Parallel search
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_SEARCH) as executor:
            futures = [executor.submit(search_for_node, node) for node in top_nodes]

            for future in concurrent.futures.as_completed(futures):
                citations = future.result()
                all_citations.extend(citations)

        return all_citations

    def _search_node_intervention_impact(
        self,
        intervention_name: str,
        intervention_details: Optional[Dict],
        node: Dict,
        main_query: str
    ) -> List[Dict]:
        """Search for evidence of intervention's impact on specific node."""

        details_str = json.dumps(intervention_details, indent=2) if intervention_details else "Not provided"

        prompt = DSMPrompts.INTERVENTION_CITATION_SEARCH_PROMPT.format(
            intervention_name=intervention_name,
            intervention_details=details_str,
            factor_name=node['label'],
            parent_category=node.get('parent_category', 'Unknown'),
            main_query=main_query
        )

        try:
            completion = self.openai_manager.chat_completion(
                model=MODEL_SEARCH,
                web_search_options={},
                messages=[{"role": "user", "content": prompt}]
            )

            result = completion.choices[0].message.content.strip()

            # Simple parsing - store raw content
            return [{
                "node_id": node['id'],
                "intervention": intervention_name,
                "content": result[:1000]
            }]

        except Exception as e:
            print(f"⚠️ Intervention search failed for {node['label']}: {e}")
            return []

    def _modify_graph_with_llm(
        self,
        base_graph: Dict,
        intervention_name: str,
        intervention_details: Dict,
        intervention_citations: List[Dict]
    ) -> Dict:
        """Use GPT-5 to generate modified graph and delta."""

        # Format inputs for prompt
        base_graph_json = json.dumps(base_graph, indent=2)
        intervention_details_json = json.dumps(intervention_details, indent=2)
        intervention_citations_json = json.dumps(intervention_citations, indent=2)

        prompt = DSMPrompts.INTERVENTION_MODIFICATION_PROMPT.format(
            base_graph_json=base_graph_json,
            intervention_name=intervention_name,
            intervention_details=intervention_details_json,
            intervention_citations=intervention_citations_json
        )

        # Call GPT-5 with reasoning
        print("🤖 Using GPT-5 with medium reasoning effort for intervention analysis...")
        content = self.openai_manager.responses_create_and_wait(
            model=PolicyDrafterConfig.GPT_5,
            system_message="You are a scenario modeling expert. Predict intervention impacts with evidence-based reasoning.",
            user_message=prompt,
            reasoning={"effort": "medium"}
        )

        # Parse JSON response
        result = self._parse_intervention_result(content)

        # Add intervention metadata
        result['modified_graph']['meta']['intervention'] = intervention_name
        result['modified_graph']['meta']['intervention_details'] = intervention_details
        result['modified_graph']['meta']['generated_at'] = datetime.utcnow().isoformat()

        # Copy category summaries from base graph to intervention graph
        self._copy_category_summaries(base_graph, result['modified_graph'])

        return result

    def _parse_intervention_result(self, content: str) -> Dict:
        """Parse intervention result JSON from LLM response."""

        # Clean up content
        json_str = content.strip()

        # Remove markdown code blocks
        if JSON_CODE_BLOCK_START in json_str:
            start = json_str.find(JSON_CODE_BLOCK_START) + len(JSON_CODE_BLOCK_START)
            end = json_str.find(JSON_CODE_BLOCK_END, start)
            json_str = json_str[start:end].strip()

        # Find JSON object
        if "{" in json_str:
            start_idx = json_str.find("{")
            end_idx = json_str.rfind("}") + 1
            json_str = json_str[start_idx:end_idx]

        # Sanitize
        import re
        json_str = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', json_str)

        # Parse
        try:
            result = json.loads(json_str)

            if 'modified_graph' not in result or 'delta' not in result:
                raise ValueError("Missing 'modified_graph' or 'delta' in response")

            return result

        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"First 500 chars: {json_str[:500]}")

            # Return minimal structure
            return {
                "modified_graph": {"meta": {}, "nodes": [], "edges": []},
                "delta": {"summary": {}, "node_changes": [], "edge_changes": []}
            }

    def _validate_intervention_graph(self, graph: Dict):
        """Validate intervention graph and remove invalid edges."""

        nodes = graph.get('nodes', [])
        edges = graph.get('edges', [])

        # Get all valid node IDs
        node_ids = {node['id'] for node in nodes}

        # Check for invalid edges
        invalid_edges = []
        valid_edges = []

        for edge in edges:
            source = edge.get('source')
            target = edge.get('target')

            if source not in node_ids or target not in node_ids:
                invalid_edges.append(f"{source} → {target}")
            else:
                valid_edges.append(edge)

        if invalid_edges:
            print(f"⚠️ Found {len(invalid_edges)} edges with invalid node references in intervention graph - removing them")
            print(f"   Invalid edges: {invalid_edges[:5]}")  # Show first 5
            graph['edges'] = valid_edges
            print(f"✅ Cleaned intervention graph: {len(valid_edges)} valid edges remaining")
        else:
            print(f"✅ Intervention graph validation passed: all {len(edges)} edges are valid")

    def _enrich_delta(self, delta: Dict, base_graph: Dict, modified_graph: Dict):
        """Enrich delta with computed statistics."""

        # Use DeltaCalculator to compute additional metrics
        computed_delta = self.delta_calculator.compute_delta(base_graph, modified_graph)

        # Merge computed stats into LLM-generated delta
        if 'summary' in computed_delta:
            delta['summary'].update(computed_delta['summary'])

        # Add comparison stats
        delta['comparison_stats'] = computed_delta.get('comparison_stats', {})

        print(f"✅ Delta enriched with computed statistics")

    def _copy_category_summaries(self, base_graph: Dict, intervention_graph: Dict):
        """Copy category summaries from base graph to intervention graph."""

        base_nodes = base_graph.get('nodes', [])
        intervention_nodes = intervention_graph.get('nodes', [])

        # Create mapping of parent names to their summaries in base graph
        base_summaries = {}
        for node in base_nodes:
            if node.get('type') == 'category' and node.get('category_summary'):
                base_summaries[node['label']] = node['category_summary']

        # Copy summaries to intervention graph parent nodes
        copied_count = 0
        for node in intervention_nodes:
            if node.get('type') == 'category':
                parent_name = node['label']
                if parent_name in base_summaries:
                    node['category_summary'] = base_summaries[parent_name]
                    copied_count += 1

        if copied_count > 0:
            print(f"✅ Copied {copied_count} category summaries to intervention graph")
