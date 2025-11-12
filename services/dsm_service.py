"""
Dynamic Systems Modeler Service - Orchestrates DSM pipeline
Strategy& PWC - DSM Product Line
"""

import uuid
import json
import time
import os
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

from agents.dynamic_systems_modeler.taxonomy_generator import TaxonomyGenerator
from agents.dynamic_systems_modeler.graph_builder import DynamicGraphBuilder
from agents.dynamic_systems_modeler.intervention_engine import InterventionEngine
from agents.impact_analysis.visualization_utils import generate_html_visualization
from repositories.dsm_repository import DSMRepository

# ============================================================================
# CONSTANTS
# ============================================================================

# Timezone
UTC = timezone.utc

# Thread pool
MAX_WORKERS = 2

# Query types
QUERY_TYPE_DSM = "dynamic_systems_modeler"

# Query statuses
STATUS_PROCESSING = "processing"
STATUS_FAILED = "failed"
STATUS_DONE = "done"

# File types for storage
FILE_TAXONOMY = "taxonomy.json"
FILE_BASE_GRAPH = "base_graph.json"
FILE_INTERVENTION_GRAPH = "intervention_graph.json"
FILE_DELTA = "delta.json"
FILE_EXECUTIVE = "executive_summary.md"
FILE_CSV = "data_tables.csv"
FILE_VISUALIZATION = "interactive.html"

# ============================================================================


class DSMService:
    """Service layer for Dynamic Systems Modeler lifecycle management."""

    def __init__(self, repository: DSMRepository = None):
        self.repository = repository or DSMRepository()
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
        self.taxonomy_generator = TaxonomyGenerator()
        self.graph_builder = DynamicGraphBuilder()
        self.intervention_engine = InterventionEngine()

    # ========================================================================
    # Parent Category Suggestion
    # ========================================================================

    def suggest_parent_categories(self, main_query: str) -> List[str]:
        """
        Use LLM to suggest 10 intelligent parent categories based on the main query.

        This replaces hardcoded defaults with context-aware suggestions.
        """
        print(f"🧠 Suggesting parent categories for: {main_query}")

        categories = self.taxonomy_generator.suggest_parent_categories(main_query)

        print(f"✅ Generated {len(categories)} parent categories")
        return categories

    # ========================================================================
    # Taxonomy Generation
    # ========================================================================

    def submit_taxonomy_generation(
        self,
        main_query: str,
        parent_categories: List[str]
    ) -> str:
        """
        Submit taxonomy generation request.

        Args:
            main_query: The main research question
            parent_categories: List of 10 parent category names

        Returns:
            Query ID (returns immediately, processing happens in background)
        """
        query_id = str(uuid.uuid4())

        # Create record in Azure Table SYNCHRONOUSLY before returning
        # Azure Table doesn't support list types, so serialize to JSON string
        metadata = {
            "query_type": QUERY_TYPE_DSM,
            "main_query": main_query,
            "parent_categories": json.dumps(parent_categories),  # Serialize list to JSON string
            "stage": "taxonomy_generation"
        }

        success = self.repository.create_query(
            query_id,
            main_query,
            f"Taxonomy: {main_query[:50]}...",
            metadata=metadata
        )

        if not success:
            raise Exception("Failed to create taxonomy generation record")

        # Wait for Azure Table Storage write to propagate (eventual consistency)
        time.sleep(2)

        # Start background processing for LLM taxonomy generation
        self.executor.submit(
            self._process_taxonomy_generation_background,
            query_id, main_query, parent_categories
        )

        return query_id

    def _process_taxonomy_generation_background(
        self,
        query_id: str,
        main_query: str,
        parent_categories: List[str]
    ):
        """Background task to generate taxonomy (record already created)."""
        try:
            print(f"🚀 Starting taxonomy generation for query {query_id}")
            print(f"📋 Main query: {main_query}")
            print(f"📋 Parents: {parent_categories}")

            # Generate taxonomy
            taxonomy = self.taxonomy_generator.generate_taxonomy(
                main_query,
                parent_categories
            )

            # Validate
            if not self.taxonomy_generator.validate_taxonomy(taxonomy):
                raise Exception("Taxonomy validation failed")

            # Upload to storage
            self.repository.upload_json(query_id, FILE_TAXONOMY, taxonomy)

            # Update metadata
            self.repository.update_query_metadata(query_id, {
                "taxonomy": json.dumps(taxonomy),  # Serialize to JSON string
                "total_children": taxonomy["total_children"],
                "stage": "taxonomy_ready"
            })

            self.repository.update_query_status(query_id, STATUS_DONE)

            print(f"✅ Taxonomy generation {query_id} completed")

        except Exception as e:
            print(f"❌ Error in taxonomy generation {query_id}: {e}")
            self.repository.update_query_status(query_id, STATUS_FAILED, str(e))

    # ========================================================================
    # Base Graph Construction
    # ========================================================================

    def submit_base_graph(
        self,
        main_query: str,
        taxonomy: Dict
    ) -> str:
        """
        Submit base graph construction request.

        Args:
            main_query: The main research question
            taxonomy: Complete taxonomy dictionary

        Returns:
            Query ID (returns immediately)
        """
        query_id = str(uuid.uuid4())

        # Create record in Azure Table SYNCHRONOUSLY before returning
        # Azure Table doesn't support complex types, so serialize taxonomy to JSON string
        metadata = {
            "query_type": QUERY_TYPE_DSM,
            "main_query": main_query,
            "taxonomy": json.dumps(taxonomy),  # Serialize dict to JSON string
            "is_base_graph": True,
            "stage": "base_graph_building"
        }

        success = self.repository.create_query(
            query_id,
            main_query,
            f"Base Graph: {main_query[:50]}...",
            metadata=metadata
        )

        if not success:
            raise Exception("Failed to create base graph record")

        # Wait for Azure Table Storage write to propagate (eventual consistency)
        time.sleep(2)

        # Start background processing for LLM graph building
        self.executor.submit(
            self._process_base_graph_background,
            query_id, main_query, taxonomy
        )

        return query_id

    def _process_base_graph_background(
        self,
        query_id: str,
        main_query: str,
        taxonomy: Dict
    ):
        """Background task to build base graph (record already created)."""
        try:
            print(f"🚀 Starting base graph construction for query {query_id}")

            # Build graph (now returns dict with 'graph' and 'node_analyses')
            result = self.graph_builder.build_base_graph(
                main_query,
                taxonomy
            )

            graph_json = result['graph']
            node_analyses = result['node_analyses']

            # Generate interactive HTML visualization
            api_base_url = os.getenv('BACKEND_URL', '')
            html_visualization = generate_html_visualization(graph_json, query_id, api_base_url)

            # Upload outputs
            self.repository.upload_json(query_id, FILE_BASE_GRAPH, graph_json)
            self.repository.upload_json(query_id, FILE_TAXONOMY, taxonomy)
            self.repository.upload_json(query_id, "node_analyses.json", node_analyses)
            self.repository.upload_file(query_id, FILE_VISUALIZATION, html_visualization)

            # TODO: Generate executive summary and CSV

            # Update metadata
            self.repository.update_query_metadata(query_id, {
                "node_count": len(graph_json.get('nodes', [])),
                "edge_count": len(graph_json.get('edges', [])),
                "stage": "base_graph_ready",
                "completedAt": datetime.now(UTC).isoformat()
            })

            self.repository.update_query_status(query_id, STATUS_DONE)

            print(f"✅ Base graph construction {query_id} completed")

        except Exception as e:
            print(f"❌ Error in base graph construction {query_id}: {e}")
            self.repository.update_query_status(query_id, STATUS_FAILED, str(e))

    # ========================================================================
    # Intervention Scenarios
    # ========================================================================

    def submit_intervention(
        self,
        base_graph_id: str,
        intervention_name: str,
        intervention_details: Optional[Dict] = None
    ) -> str:
        """
        Submit intervention scenario generation.

        Args:
            base_graph_id: ID of the base graph
            intervention_name: Name of the intervention
            intervention_details: Optional structured details

        Returns:
            Intervention query ID (returns immediately)
        """
        query_id = str(uuid.uuid4())

        # Get base graph info synchronously
        base_query = self.repository.get_query(base_graph_id)
        if not base_query:
            raise Exception(f"Base graph {base_graph_id} not found")

        # Create record in Azure Table SYNCHRONOUSLY before returning
        # Azure Table doesn't support complex types, so serialize to JSON string
        metadata = {
            "query_type": QUERY_TYPE_DSM,
            "main_query": base_query.get("query", ""),
            "is_base_graph": False,
            "base_graph_id": base_graph_id,
            "intervention": intervention_name,
            "intervention_details": json.dumps(intervention_details or {}),  # Serialize dict to JSON string
            "stage": "intervention_building"
        }

        success = self.repository.create_query(
            query_id,
            base_query.get("query", ""),
            f"Intervention: {intervention_name[:50]}...",
            metadata=metadata
        )

        if not success:
            raise Exception("Failed to create intervention record")

        # Wait for Azure Table Storage write to propagate (eventual consistency)
        time.sleep(2)

        # Start background processing for LLM intervention generation
        self.executor.submit(
            self._process_intervention_background,
            query_id, base_graph_id, intervention_name, intervention_details or {}
        )

        return query_id

    def _process_intervention_background(
        self,
        query_id: str,
        base_graph_id: str,
        intervention_name: str,
        intervention_details: Dict
    ):
        """Background task to generate intervention graph (record already created)."""
        try:
            print(f"🚀 Starting intervention generation for query {query_id}")

            # Load base graph
            base_graph_json = self.repository.download_json(base_graph_id, FILE_BASE_GRAPH)
            if not base_graph_json:
                raise Exception(f"Failed to load base graph from {base_graph_id}")

            base_graph = json.loads(base_graph_json)

            # Load base node analyses (if available)
            base_node_analyses = None
            try:
                base_analyses_json = self.repository.download_json(base_graph_id, "node_analyses.json")
                if base_analyses_json:
                    base_node_analyses = json.loads(base_analyses_json)
                    print(f"✅ Loaded {len(base_node_analyses)} base node analyses")
            except Exception as e:
                print(f"⚠️ Could not load base node analyses: {e}")

            # Generate intervention graph (now returns 3 values)
            modified_graph, delta, node_analyses = self.intervention_engine.generate_intervention_graph(
                base_graph,
                intervention_name,
                intervention_details,
                base_node_analyses
            )

            # Generate interactive HTML visualization for intervention graph
            api_base_url = os.getenv('BACKEND_URL', '')
            html_visualization = generate_html_visualization(modified_graph, query_id, api_base_url)

            # Upload outputs
            self.repository.upload_json(query_id, FILE_INTERVENTION_GRAPH, modified_graph)
            self.repository.upload_json(query_id, FILE_DELTA, delta)
            self.repository.upload_json(query_id, "node_analyses.json", node_analyses)
            self.repository.upload_file(query_id, FILE_VISUALIZATION, html_visualization)

            # Update metadata
            self.repository.update_query_metadata(query_id, {
                "node_count": len(modified_graph.get('nodes', [])),
                "edge_count": len(modified_graph.get('edges', [])),
                "nodes_changed": delta.get('summary', {}).get('nodes_changed', 0),
                "edges_changed": delta.get('summary', {}).get('edges_changed', 0),
                "stage": "intervention_ready",
                "completedAt": datetime.now(UTC).isoformat()
            })

            self.repository.update_query_status(query_id, STATUS_DONE)

            print(f"✅ Intervention generation {query_id} completed")

        except Exception as e:
            print(f"❌ Error in intervention generation {query_id}: {e}")
            self.repository.update_query_status(query_id, STATUS_FAILED, str(e))

    # ========================================================================
    # Query Management
    # ========================================================================

    def get_query(self, query_id: str) -> Optional[Dict]:
        """Get query status and metadata."""
        return self.repository.get_query(query_id)

    def list_base_graphs(self) -> List[Dict]:
        """List all base graphs."""
        queries = self.repository.list_queries(query_type=QUERY_TYPE_DSM)
        return [q for q in queries if q.get("is_base_graph", False)]

    def list_interventions(self, base_graph_id: str) -> List[Dict]:
        """List all interventions for a base graph."""
        queries = self.repository.list_queries(query_type=QUERY_TYPE_DSM)
        return [
            q for q in queries
            if not q.get("is_base_graph", False) and q.get("base_graph_id") == base_graph_id
        ]

    def get_graph_content(self, query_id: str, content_type: str) -> Optional[str]:
        """Get graph content from storage."""

        # Handle hierarchical view dynamically
        if content_type == "hierarchical":
            return self.get_hierarchical_visualization(query_id)

        file_map = {
            "taxonomy": FILE_TAXONOMY,
            "base_graph": FILE_BASE_GRAPH,
            "intervention_graph": FILE_INTERVENTION_GRAPH,
            "delta": FILE_DELTA,
            "executive": FILE_EXECUTIVE,
            "csv": FILE_CSV,
            "visualization": FILE_VISUALIZATION,
            "node_analyses": "node_analyses.json"
        }

        filename = file_map.get(content_type)
        if not filename:
            return None

        # Use appropriate download method based on file type
        if content_type in ["visualization", "executive", "csv"]:
            return self.repository.download_file(query_id, filename)
        else:
            return self.repository.download_json(query_id, filename)

    def get_hierarchical_visualization(self, query_id: str) -> Optional[str]:
        """
        Generate hierarchical HTML visualization dynamically from graph JSON.

        This is NOT stored in blob storage - it's generated on-demand to avoid duplication.
        """
        try:
            # Determine if this is a base graph or intervention
            query = self.repository.get_query(query_id)
            if not query:
                return None

            is_base = query.get('is_base_graph', False)

            # Load appropriate graph JSON
            if is_base:
                graph_json_str = self.repository.download_json(query_id, FILE_BASE_GRAPH)
            else:
                graph_json_str = self.repository.download_json(query_id, FILE_INTERVENTION_GRAPH)

            if not graph_json_str:
                return None

            graph_json = json.loads(graph_json_str)

            # Generate hierarchical visualization HTML
            from agents.impact_analysis.visualization_utils import generate_hierarchical_html_visualization
            hierarchical_html = generate_hierarchical_html_visualization(graph_json)

            return hierarchical_html

        except Exception as e:
            print(f"❌ Error generating hierarchical visualization for {query_id}: {e}")
            import traceback
            traceback.print_exc()
            return None

    def delete_query(self, query_id: str) -> bool:
        """Delete a query and all associated content."""
        try:
            # Delete all files
            files = [
                FILE_TAXONOMY,
                FILE_BASE_GRAPH,
                FILE_INTERVENTION_GRAPH,
                FILE_DELTA,
                FILE_EXECUTIVE,
                FILE_CSV,
                FILE_VISUALIZATION
            ]

            for file in files:
                self.repository.delete_file(query_id, file)

            # Delete query record
            return self.repository.delete_query(query_id)

        except Exception as e:
            print(f"Error deleting query {query_id}: {e}")
            return False


# Global service instance
dsm_service = DSMService()
