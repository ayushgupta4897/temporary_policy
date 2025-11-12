"""
Delta Calculator - Computes differences between base and intervention graphs
Strategy& PWC - Dynamic Systems Modeler
"""

from typing import Dict, List, Optional


class DeltaCalculator:
    """Calculates deltas between base and intervention graphs."""

    def compute_delta(self, base_graph: Dict, intervention_graph: Dict) -> Dict:
        """
        Compute comprehensive delta between base and intervention graphs.

        Args:
            base_graph: Original base graph
            intervention_graph: Modified intervention graph

        Returns:
            Delta dictionary with changes, statistics, and insights
        """

        delta = {
            "summary": self._compute_summary(base_graph, intervention_graph),
            "node_changes": self._compute_node_changes(base_graph, intervention_graph),
            "edge_changes": self._compute_edge_changes(base_graph, intervention_graph),
            "new_edges": self._find_new_edges(base_graph, intervention_graph),
            "removed_edges": self._find_removed_edges(base_graph, intervention_graph),
            "comparison_stats": self._compute_comparison_stats(base_graph, intervention_graph)
        }

        return delta

    def _compute_summary(self, base: Dict, intervention: Dict) -> Dict:
        """Compute high-level summary statistics."""

        base_nodes = {n['id']: n for n in base.get('nodes', [])}
        intervention_nodes = {n['id']: n for n in intervention.get('nodes', [])}

        base_edges = self._edge_dict(base.get('edges', []))
        intervention_edges = self._edge_dict(intervention.get('edges', []))

        # Count changes
        nodes_changed = 0
        for node_id in base_nodes:
            if node_id in intervention_nodes:
                if self._node_changed(base_nodes[node_id], intervention_nodes[node_id]):
                    nodes_changed += 1

        edges_changed = 0
        for edge_key in base_edges:
            if edge_key in intervention_edges:
                if self._edge_changed(base_edges[edge_key], intervention_edges[edge_key]):
                    edges_changed += 1

        new_edges = len(set(intervention_edges.keys()) - set(base_edges.keys()))
        removed_edges = len(set(base_edges.keys()) - set(intervention_edges.keys()))

        # Compute average weight change
        total_weight_change = 0
        edge_comparison_count = 0

        for edge_key in base_edges:
            if edge_key in intervention_edges:
                base_weight = base_edges[edge_key].get('weight_0to1', 0)
                intervention_weight = intervention_edges[edge_key].get('weight_0to1', 0)
                total_weight_change += (intervention_weight - base_weight)
                edge_comparison_count += 1

        avg_weight_change = total_weight_change / edge_comparison_count if edge_comparison_count > 0 else 0

        return {
            "nodes_changed": nodes_changed,
            "edges_changed": edges_changed,
            "new_edges": new_edges,
            "removed_edges": removed_edges,
            "avg_weight_change": round(avg_weight_change, 3),
            "total_nodes": len(base_nodes),
            "total_edges": len(base_edges)
        }

    def _compute_node_changes(self, base: Dict, intervention: Dict) -> List[Dict]:
        """Compute detailed changes for each node."""

        base_nodes = {n['id']: n for n in base.get('nodes', [])}
        intervention_nodes = {n['id']: n for n in intervention.get('nodes', [])}

        changes = []

        for node_id in base_nodes:
            if node_id not in intervention_nodes:
                continue  # Node removed (shouldn't happen in hybrid approach)

            base_node = base_nodes[node_id]
            intervention_node = intervention_nodes[node_id]

            # Check if KPI changed
            base_kpi = base_node.get('kpi', {})
            intervention_kpi = intervention_node.get('kpi', {})

            base_value = base_kpi.get('current_value')
            intervention_value = intervention_kpi.get('current_value')

            if base_value is not None and intervention_value is not None:
                if base_value != intervention_value:
                    absolute_change = intervention_value - base_value
                    percent_change = (absolute_change / base_value * 100) if base_value != 0 else 0

                    changes.append({
                        "node_id": node_id,
                        "node_label": base_node.get('label', ''),
                        "base_kpi": {
                            "value": base_value,
                            "unit": base_kpi.get('unit', ''),
                            "year": base_kpi.get('year', '')
                        },
                        "intervention_kpi": {
                            "value": intervention_value,
                            "unit": intervention_kpi.get('unit', ''),
                            "year": intervention_kpi.get('year', '')
                        },
                        "absolute_change": round(absolute_change, 2),
                        "percent_change": round(percent_change, 2),
                        "direction": "increase" if absolute_change > 0 else "decrease"
                    })

        # Sort by absolute percent change (descending)
        changes.sort(key=lambda x: abs(x.get('percent_change', 0)), reverse=True)

        return changes

    def _compute_edge_changes(self, base: Dict, intervention: Dict) -> List[Dict]:
        """Compute detailed changes for each edge."""

        base_edges = self._edge_dict(base.get('edges', []))
        intervention_edges = self._edge_dict(intervention.get('edges', []))

        changes = []

        for edge_key in base_edges:
            if edge_key not in intervention_edges:
                continue  # Edge removed

            base_edge = base_edges[edge_key]
            intervention_edge = intervention_edges[edge_key]

            base_weight = base_edge.get('weight_0to1', 0)
            intervention_weight = intervention_edge.get('weight_0to1', 0)

            if base_weight != intervention_weight:
                absolute_change = intervention_weight - base_weight
                percent_change = (absolute_change / base_weight * 100) if base_weight != 0 else 0

                changes.append({
                    "source": base_edge['source'],
                    "target": base_edge['target'],
                    "base_weight": round(base_weight, 3),
                    "intervention_weight": round(intervention_weight, 3),
                    "absolute_change": round(absolute_change, 3),
                    "percent_change": round(percent_change, 2),
                    "direction": "strengthened" if absolute_change > 0 else "weakened"
                })

        # Sort by absolute change (descending)
        changes.sort(key=lambda x: abs(x.get('absolute_change', 0)), reverse=True)

        return changes

    def _find_new_edges(self, base: Dict, intervention: Dict) -> List[Dict]:
        """Find edges that exist in intervention but not in base."""

        base_edges = self._edge_dict(base.get('edges', []))
        intervention_edges = self._edge_dict(intervention.get('edges', []))

        new_edge_keys = set(intervention_edges.keys()) - set(base_edges.keys())

        new_edges = []
        for edge_key in new_edge_keys:
            edge = intervention_edges[edge_key]
            new_edges.append({
                "source": edge['source'],
                "target": edge['target'],
                "weight": edge.get('weight_0to1', 0),
                "sign": edge.get('sign', '+'),
                "relation": edge.get('relation', 'causal')
            })

        return new_edges

    def _find_removed_edges(self, base: Dict, intervention: Dict) -> List[Dict]:
        """Find edges that exist in base but not in intervention."""

        base_edges = self._edge_dict(base.get('edges', []))
        intervention_edges = self._edge_dict(intervention.get('edges', []))

        removed_edge_keys = set(base_edges.keys()) - set(intervention_edges.keys())

        removed_edges = []
        for edge_key in removed_edge_keys:
            edge = base_edges[edge_key]
            removed_edges.append({
                "source": edge['source'],
                "target": edge['target'],
                "base_weight": edge.get('weight_0to1', 0)
            })

        return removed_edges

    def _compute_comparison_stats(self, base: Dict, intervention: Dict) -> Dict:
        """Compute additional comparison statistics."""

        base_edges = base.get('edges', [])
        intervention_edges = intervention.get('edges', [])

        # Average edge weights
        base_avg_weight = sum(e.get('weight_0to1', 0) for e in base_edges) / len(base_edges) if base_edges else 0
        intervention_avg_weight = sum(e.get('weight_0to1', 0) for e in intervention_edges) / len(intervention_edges) if intervention_edges else 0

        # Severity changes
        base_nodes = base.get('nodes', [])
        intervention_nodes = intervention.get('nodes', [])

        base_avg_severity = sum(n.get('severity_1to5', 0) for n in base_nodes) / len(base_nodes) if base_nodes else 0
        intervention_avg_severity = sum(n.get('severity_1to5', 0) for n in intervention_nodes) / len(intervention_nodes) if intervention_nodes else 0

        return {
            "base_avg_edge_weight": round(base_avg_weight, 3),
            "intervention_avg_edge_weight": round(intervention_avg_weight, 3),
            "edge_weight_change": round(intervention_avg_weight - base_avg_weight, 3),
            "base_avg_severity": round(base_avg_severity, 2),
            "intervention_avg_severity": round(intervention_avg_severity, 2),
            "severity_change": round(intervention_avg_severity - base_avg_severity, 2)
        }

    @staticmethod
    def _edge_dict(edges: List[Dict]) -> Dict[str, Dict]:
        """Convert edge list to dictionary keyed by (source, target)."""
        return {
            (e['source'], e['target']): e
            for e in edges
        }

    @staticmethod
    def _node_changed(base_node: Dict, intervention_node: Dict) -> bool:
        """Check if a node has changed between base and intervention."""

        # Check KPI changes
        base_kpi = base_node.get('kpi', {}).get('current_value')
        intervention_kpi = intervention_node.get('kpi', {}).get('current_value')

        if base_kpi != intervention_kpi:
            return True

        # Check severity changes
        if base_node.get('severity_1to5') != intervention_node.get('severity_1to5'):
            return True

        return False

    @staticmethod
    def _edge_changed(base_edge: Dict, intervention_edge: Dict) -> bool:
        """Check if an edge has changed between base and intervention."""

        # Check weight change
        if base_edge.get('weight_0to1') != intervention_edge.get('weight_0to1'):
            return True

        # Check sign change
        if base_edge.get('sign') != intervention_edge.get('sign'):
            return True

        return False
