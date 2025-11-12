"""
Node Analyzer - Generates AI-powered deep dive analyses for graph nodes
Strategy& PWC - Dynamic Systems Modeler
"""

import json
from typing import Dict, List, Optional
from pathlib import Path
import sys
import concurrent.futures

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from agents.dynamic_systems_modeler.prompts import DSMPrompts

# ============================================================================
# CONSTANTS
# ============================================================================

MAX_WORKERS_ANALYSIS = 10  # Parallel analysis for multiple nodes
JSON_CODE_BLOCK_START = "```json"
JSON_CODE_BLOCK_END = "```"

# Logging
LOG_ANALYZING_NODES = "🔍 Generating deep dive analyses for {count} nodes..."
LOG_NODE_ANALYZED = "✅ Analyzed: {node}"
LOG_TOTAL_ANALYSES = "✅ Generated {count} node analyses"


class NodeAnalyzer:
    """Generates AI-powered deep dive analyses for individual graph nodes."""

    def __init__(self):
        self.openai_manager = get_openai_client()

    def generate_all_node_analyses(
        self,
        graph_json: Dict,
        main_query: str,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Dict]:
        """
        Generate analyses for all child nodes in the graph (parallel).

        Args:
            graph_json: Complete graph JSON with nodes and edges
            main_query: The main research question
            progress_callback: Optional callback for progress updates

        Returns:
            Dictionary mapping node_id -> analysis JSON
        """
        nodes = graph_json.get('nodes', [])
        edges = graph_json.get('edges', [])

        # Only analyze child nodes (not parent categories)
        child_nodes = [n for n in nodes if n.get('type') != 'category']

        print(LOG_ANALYZING_NODES.format(count=len(child_nodes)))

        node_analyses = {}

        def analyze_node_wrapper(node):
            """Wrapper for parallel execution."""
            try:
                analysis = self._analyze_single_node(
                    node,
                    graph_json,
                    main_query
                )
                print(LOG_NODE_ANALYZED.format(node=node['label']))
                return (node['id'], analysis)
            except Exception as e:
                print(f"❌ Analysis failed for {node['label']}: {e}")
                return (node['id'], None)

        # Run analyses in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_ANALYSIS) as executor:
            futures = [executor.submit(analyze_node_wrapper, node) for node in child_nodes]

            for future in concurrent.futures.as_completed(futures):
                node_id, analysis = future.result()
                if analysis:
                    node_analyses[node_id] = analysis

        print(LOG_TOTAL_ANALYSES.format(count=len(node_analyses)))
        return node_analyses

    def _analyze_single_node(
        self,
        node: Dict,
        graph_json: Dict,
        main_query: str
    ) -> Dict:
        """
        Analyze a single node with GPT-5.

        Args:
            node: Node data (id, label, type, kpi, citations, etc.)
            graph_json: Complete graph for context (edges, other nodes)
            main_query: Main research question

        Returns:
            Analysis JSON with overview, connections, severity, implications
        """
        # Extract context for this node
        node_id = node['id']
        node_label = node.get('label', node_id)
        node_type = node.get('type', 'unknown')
        parent_category = node.get('parent_category', 'N/A')
        kpi = node.get('kpi', {})
        severity = node.get('severity_1to5', 3)
        citations = node.get('citations', [])

        # Get all edges connected to this node
        all_edges = graph_json.get('edges', [])
        connected_edges = [
            e for e in all_edges
            if e.get('source') == node_id or e.get('target') == node_id
        ]

        # Filter out categorical edges (parent-child grouping)
        connected_edges = [e for e in connected_edges if e.get('relation') != 'categorical']

        # Build context strings
        kpi_info = self._format_kpi(kpi)
        edges_json = json.dumps(connected_edges, indent=2)
        citations_json = json.dumps(citations, indent=2)

        # Build prompt
        prompt = DSMPrompts.NODE_ANALYSIS_PROMPT.format(
            main_query=main_query,
            node_label=node_label,
            node_id=node_id,
            node_type=node_type,
            parent_category=parent_category,
            kpi_info=kpi_info,
            severity=severity,
            edges_json=edges_json,
            citations_json=citations_json
        )

        # Call GPT-5 with medium reasoning
        content = self.openai_manager.responses_create_and_wait(
            model=PolicyDrafterConfig.GPT_5,
            system_message="You are a systems analysis expert providing evidence-based node analyses for causal graphs.",
            user_message=prompt,
            reasoning={"effort": "medium"}  # Balance quality/speed
        )

        # Parse JSON response
        analysis = self._parse_analysis_json(content, node_id)

        return analysis

    def generate_intervention_node_analyses(
        self,
        intervention_graph: Dict,
        base_graph: Dict,
        delta: Dict,
        intervention_name: str,
        main_query: str,
        base_node_analyses: Dict
    ) -> Dict[str, Dict]:
        """
        Generate intervention-aware analyses for changed nodes.

        Only regenerates analyses for nodes that changed due to intervention.
        Copies base analyses for unchanged nodes.

        Args:
            intervention_graph: Modified intervention graph
            base_graph: Original base graph
            delta: Delta analysis with node_changes, edge_changes
            intervention_name: Name of the intervention
            main_query: Main research question
            base_node_analyses: Analyses from base graph

        Returns:
            Dictionary mapping node_id -> analysis JSON (intervention-aware)
        """
        # Start with base analyses
        intervention_analyses = base_node_analyses.copy()

        # Get changed nodes from delta
        changed_nodes = delta.get('node_changes', [])

        if not changed_nodes:
            print("ℹ️ No node changes detected - using base analyses")
            return intervention_analyses

        print(f"🔍 Regenerating analyses for {len(changed_nodes)} changed nodes...")

        def analyze_intervention_node_wrapper(node_change):
            """Wrapper for parallel execution."""
            node_id = node_change['node_id']
            try:
                # Get node from intervention graph
                node = next(
                    (n for n in intervention_graph['nodes'] if n['id'] == node_id),
                    None
                )
                if not node:
                    print(f"⚠️ Node {node_id} not found in intervention graph")
                    return (node_id, None)

                analysis = self._analyze_intervention_node(
                    node,
                    intervention_graph,
                    base_graph,
                    node_change,
                    intervention_name,
                    main_query
                )
                print(LOG_NODE_ANALYZED.format(node=node.get('label', node_id)))
                return (node_id, analysis)
            except Exception as e:
                print(f"❌ Intervention analysis failed for {node_id}: {e}")
                return (node_id, None)

        # Run intervention analyses in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_ANALYSIS) as executor:
            futures = [
                executor.submit(analyze_intervention_node_wrapper, node_change)
                for node_change in changed_nodes
            ]

            for future in concurrent.futures.as_completed(futures):
                node_id, analysis = future.result()
                if analysis:
                    intervention_analyses[node_id] = analysis

        print(LOG_TOTAL_ANALYSES.format(count=len(intervention_analyses)))
        return intervention_analyses

    def _analyze_intervention_node(
        self,
        node: Dict,
        intervention_graph: Dict,
        base_graph: Dict,
        delta_node_change: Dict,
        intervention_name: str,
        main_query: str
    ) -> Dict:
        """
        Analyze how intervention affected this specific node.

        Args:
            node: Node from intervention graph
            intervention_graph: Complete intervention graph
            base_graph: Original base graph
            delta_node_change: Delta entry for this node (base/intervention KPIs, change stats)
            intervention_name: Name of intervention
            main_query: Main research question

        Returns:
            Intervention-focused analysis JSON
        """
        node_id = node['id']
        node_label = node.get('label', node_id)

        # Extract base state
        base_kpi = delta_node_change.get('base_kpi', {})
        base_severity = self._find_base_severity(node_id, base_graph)

        # Extract intervention state
        intervention_kpi = delta_node_change.get('intervention_kpi', {})
        intervention_severity = node.get('severity_1to5', 3)

        # Extract change metrics
        absolute_change = delta_node_change.get('absolute_change', 0)
        percent_change = delta_node_change.get('percent_change', 0)
        mechanism = delta_node_change.get('mechanism', 'N/A')
        confidence = delta_node_change.get('confidence', 'Medium')
        timeframe = delta_node_change.get('timeframe', 'Unknown')

        # Get changed edges (from delta.edge_changes)
        edge_changes = self._find_edge_changes_for_node(node_id, intervention_graph)

        # Build context
        delta_context = {
            'absolute_change': absolute_change,
            'percent_change': percent_change,
            'mechanism': mechanism,
            'confidence': confidence,
            'timeframe': timeframe
        }

        # Build prompt
        prompt = DSMPrompts.INTERVENTION_NODE_ANALYSIS_PROMPT.format(
            main_query=main_query,
            intervention_name=intervention_name,
            node_label=node_label,
            node_id=node_id,
            base_kpi=self._format_kpi(base_kpi),
            base_severity=base_severity,
            intervention_kpi=self._format_kpi(intervention_kpi),
            intervention_severity=intervention_severity,
            absolute_change=absolute_change,
            percent_change=percent_change,
            mechanism=mechanism,
            edge_changes_json=json.dumps(edge_changes, indent=2),
            delta_context=json.dumps(delta_context, indent=2)
        )

        # Call GPT-5 with medium reasoning
        content = self.openai_manager.responses_create_and_wait(
            model=PolicyDrafterConfig.GPT_5,
            system_message="You are a systems analysis expert analyzing intervention impacts on causal graphs.",
            user_message=prompt,
            reasoning={"effort": "medium"}
        )

        # Parse JSON response
        analysis = self._parse_analysis_json(content, node_id)

        return analysis

    def _format_kpi(self, kpi: Dict) -> str:
        """Format KPI data as readable string."""
        if not kpi:
            return "No KPI data available"

        name = kpi.get('name', 'N/A')
        value = kpi.get('current_value', 'N/A')
        unit = kpi.get('unit', '')
        year = kpi.get('year', 'N/A')
        trend = kpi.get('trend', 'N/A')

        return f"{name} = {value}{unit} ({year}, trend: {trend})"

    def _find_base_severity(self, node_id: str, base_graph: Dict) -> int:
        """Find severity of node in base graph."""
        for node in base_graph.get('nodes', []):
            if node['id'] == node_id:
                return node.get('severity_1to5', 3)
        return 3  # Default

    def _find_edge_changes_for_node(self, node_id: str, graph: Dict) -> List[Dict]:
        """Find edges connected to this node (for intervention analysis)."""
        edges = graph.get('edges', [])
        return [
            e for e in edges
            if (e.get('source') == node_id or e.get('target') == node_id)
            and e.get('relation') != 'categorical'
        ]

    def _parse_analysis_json(self, content: str, node_id: str) -> Dict:
        """Parse analysis JSON from LLM response."""

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

        # Sanitize control characters
        import re
        json_str = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', json_str)

        # Parse JSON
        try:
            analysis = json.loads(json_str)
            return analysis
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error for node {node_id}: {e}")
            print(f"First 500 chars: {json_str[:500]}")

            # Return fallback analysis
            return {
                "overview": "Analysis parsing failed.",
                "connections": [],
                "severity_explanation": "Unable to generate analysis.",
                "strategic_implications": []
            }
