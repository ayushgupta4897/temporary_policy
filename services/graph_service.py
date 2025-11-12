"""
Graph Service - Orchestrates systems evidence graph building
Strategy& PWC - SEGB Feature
"""

import uuid
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import threading
import time
import os

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

# Import config and OpenAI client
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client

from agents.system_compass.agent import GraphBuildingAgent
from repositories.graph_repository import GraphRepository

# ============================================================================
# CONSTANTS
# ============================================================================

# Timezone
IST = timezone(timedelta(hours=5, minutes=30))

# Thread pool configuration
MAX_WORKERS = 2

# Query types
QUERY_TYPE_GRAPH = "graph"
ANALYSIS_MODE_GRAPH = "graph"

# Query statuses
STATUS_PROCESSING = "processing"
STATUS_FAILED = "failed"
STATUS_DONE = "done"

# Graph file types
GRAPH_FILE_INTERACTIVE = "graph_interactive.html"
GRAPH_FILE_JSON = "graph_data.json"
GRAPH_FILE_CSV = "graph_tables.csv"
GRAPH_FILE_EXECUTIVE = "executive_summary.md"
GRAPH_FILE_FULL = "full_analysis.md"

# Graph content type mapping
GRAPH_TYPE_MAP = {
    'interactive': GRAPH_FILE_INTERACTIVE,
    'json': GRAPH_FILE_JSON,
    'csv': GRAPH_FILE_CSV,
    'executive': GRAPH_FILE_EXECUTIVE,
    'full': GRAPH_FILE_FULL
}

# Graph output name mapping (internal -> storage)
GRAPH_OUTPUT_NAME_MAP = {
    'interactive_html': (GRAPH_FILE_INTERACTIVE, 'interactive'),
    'graph_json': (GRAPH_FILE_JSON, 'data'),
    'csv_data': (GRAPH_FILE_CSV, 'tables'),
    'executive_summary': (GRAPH_FILE_EXECUTIVE, 'executive'),
    'full_analysis': (GRAPH_FILE_FULL, 'analysis')
}

# OpenAI configuration
OPENAI_MODEL = "gpt-4o"
OPENAI_TEMPERATURE = 0.3
OPENAI_MAX_TOKENS = 40
TITLE_MAX_WORDS = 7

# ============================================================================


class GraphService:
    """Service layer for managing graph building lifecycle."""

    def __init__(self, repository: GraphRepository = None):
        self.repository = repository or GraphRepository()
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
        # Use centralized OpenAI client for title generation
        self.openai_manager = get_openai_client()
    
    def submit_graph_query(self, query_text: str, geography: str ,
                           time_range: str, 
                           intervention: Optional[str] = None) -> str:
        """Submit a new graph building query."""
        query_id = str(uuid.uuid4())
        
        # Generate display title
        title_parts = [query_text, geography, time_range]
        if intervention:
            title_parts.append(intervention)
        display_title = self._generate_display_title(" ".join(title_parts))
        
        # Create record in table storage with type 'graph'
        metadata = {
            'queryType': QUERY_TYPE_GRAPH,
            'geography': geography,
            'timeRange': time_range,
            'intervention': intervention or ''
        }
        
        success = self.repository.create_query(
            query_id, query_text, display_title,
            analysis_mode=ANALYSIS_MODE_GRAPH,  # Use analysis_mode to distinguish
            metadata=metadata
        )

        if not success:
            raise Exception("Failed to create graph query record")

        # Start background processing
        self.executor.submit(
            self._process_graph_background,
            query_id, query_text, geography, time_range, intervention
        )

        return query_id

    def get_graph_status(self, query_id: str) -> Optional[Dict]:
        """Get graph query status and metadata."""
        query_data = self.repository.get_query(query_id)
        if query_data and query_data.get('analysisMode') == ANALYSIS_MODE_GRAPH:
            return query_data
        return None

    def list_graph_queries(self) -> List[Dict]:
        """List all graph queries."""
        return self.repository.list_queries(query_type=QUERY_TYPE_GRAPH)

    def get_graph_content(self, query_id: str, content_type: str) -> Optional[str]:
        """Get graph content from blob storage."""
        filename = GRAPH_TYPE_MAP.get(content_type)
        if not filename:
            return None

        return self.repository.download_report(query_id, filename)

    def delete_graph_query(self, query_id: str) -> bool:
        """Delete a graph query and all its associated content."""
        try:
            # Get all graph files
            files = [
                GRAPH_FILE_INTERACTIVE,
                GRAPH_FILE_JSON,
                GRAPH_FILE_CSV,
                GRAPH_FILE_EXECUTIVE,
                GRAPH_FILE_FULL
            ]

            # Delete from blob storage
            for file in files:
                self.repository.delete_report(query_id, file)

            # Delete from table storage
            return self.repository.delete_query(query_id)
        except Exception as e:
            print(f"Error deleting graph query {query_id}: {e}")
            return False

    def _update_progress(self, query_id: str, steps: List[Dict]):
        """Helper to update step-based progress during processing."""
        try:
            self.repository.update_query_steps(query_id, steps)
            # Find current step for logging
            current_step = next((s for s in steps if s['state'] == 'in_progress'), None)
            if current_step:
                print(f"📊 Step: {current_step['name']} - {current_step['description']}")
        except Exception as e:
            print(f"⚠️ Failed to update progress: {e}")
            # Don't fail the entire pipeline if progress update fails

    def _process_graph_background(self, query_id: str, query_text: str,
                                 geography: str, time_range: str,
                                 intervention: Optional[str]):
        """Background task to process graph query."""
        try:
            print(f"🚀 Starting graph processing for query {query_id}")

            # Create progress callback for step-based tracking
            def update_progress(steps: List[Dict]):
                self._update_progress(query_id, steps)

            graph_agent = GraphBuildingAgent()

            # Run graph pipeline with progress tracking
            output_paths = graph_agent.run_graph_pipeline(
                query_text, geography, time_range, intervention,
                progress_callback=update_progress
            )

            # Upload outputs to blob storage
            blob_urls = self._upload_graph_outputs(query_id, output_paths)

            # Update query completion
            self._update_graph_completion(query_id, blob_urls)

            print(f"✅ Graph query {query_id} completed successfully")

        except Exception as e:
            print(f"❌ Error processing graph query {query_id}: {e}")
            try:
                self.repository.update_query_status(query_id, STATUS_FAILED, str(e))
            except Exception:
                pass

    def _upload_graph_outputs(self, query_id: str, output_paths: Dict[str, str]) -> List[Dict]:
        """Upload graph outputs to blob storage."""
        blob_urls = []

        for output_type, file_path in output_paths.items():
            if output_type not in GRAPH_OUTPUT_NAME_MAP:
                continue

            storage_name, display_type = GRAPH_OUTPUT_NAME_MAP[output_type]
            
            # Read file content
            file_obj = Path(file_path)
            if not file_obj.exists() or file_obj.stat().st_size == 0:
                continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if not content:
                continue
            
            # Upload to blob storage
            blob_url = self.repository.upload_report(query_id, storage_name, content)

            if blob_url:
                blob_urls.append({
                    "type": display_type,
                    "filename": storage_name,
                    "url": blob_url
                })

        return blob_urls

    def _update_graph_completion(self, query_id: str, blob_urls: List[Dict]):
        """Update graph query status to completed."""
        self.repository.update_query_blob_urls(query_id, blob_urls)

        # Calculate completion time
        query = self.repository.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(IST)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=IST)).total_seconds() / 60)
            
            # Count nodes and edges from JSON if available
            stats = self._extract_graph_stats(query_id)
            
            # Update metadata
            self.repository.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'nodeCount': stats.get('nodes', 0),
                'edgeCount': stats.get('edges', 0)
            })

        self.repository.update_query_status(query_id, STATUS_DONE)
    
    def _extract_graph_stats(self, query_id: str) -> Dict:
        """Extract statistics from graph JSON."""
        try:
            import json
            json_content = self.get_graph_content(query_id, 'json')
            if json_content:
                data = json.loads(json_content)
                return {
                    'nodes': len(data.get('nodes', [])),
                    'edges': len(data.get('edges', []))
                }
        except Exception:
            pass
        return {'nodes': 0, 'edges': 0}
    
    def _generate_display_title(self, query_text: str) -> str:
        """Generate a concise display title for graph query."""
        try:
            response = self.openai_manager.chat_completion(
                model=OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": f"Generate a concise title (5-{TITLE_MAX_WORDS} words) for a systems evidence graph query."
                    },
                    {
                        "role": "user",
                        "content": f"Generate title for: {query_text}"
                    }
                ],
                temperature=OPENAI_TEMPERATURE,
                max_tokens=OPENAI_MAX_TOKENS
            )

            title = response.choices[0].message.content.strip()
            if len(title.split()) > TITLE_MAX_WORDS:
                title = ' '.join(title.split()[:TITLE_MAX_WORDS])

            return title

        except Exception:
            # Fallback to simple extraction
            words = query_text.replace(',', '').replace('.', '').split()[:TITLE_MAX_WORDS-1]
            return ' '.join(words) if words else query_text[:OPENAI_MAX_TOKENS]


# Global service instance
graph_service = GraphService()
