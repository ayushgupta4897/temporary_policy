"""
DSM Repository - Data access layer for Dynamic Systems Modeler
Strategy& PWC - DSM Product Line

Handles Azure Table Storage and Blob Storage operations for DSM queries
"""

import json
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from repositories.graph_repository import GraphRepository

# ============================================================================
# CONSTANTS
# ============================================================================

UTC = timezone.utc
QUERY_TYPE_DSM = "dynamic_systems_modeler"
STATUS_PROCESSING = "processing"

# ============================================================================


class DSMRepository:
    """Repository for DSM query data access."""

    def __init__(self):
        # Reuse the existing GraphRepository infrastructure
        # but with DSM-specific logic
        self.graph_repo = GraphRepository()

    def create_query(
        self,
        query_id: str,
        query_text: str,
        display_title: str,
        metadata: Optional[Dict] = None
    ) -> bool:
        """Create a new DSM query record."""

        # Use graph repository's create_query method
        # with analysis_mode to distinguish DSM queries
        return self.graph_repo.create_query(
            query_id,
            query_text,
            display_title,
            analysis_mode="dsm",  # Use this to distinguish from graph queries
            metadata=metadata or {}
        )

    def get_query(self, query_id: str) -> Optional[Dict]:
        """Get query record by ID."""
        return self.graph_repo.get_query(query_id)

    def list_queries(self, query_type: str = QUERY_TYPE_DSM) -> List[Dict]:
        """List all DSM queries."""
        # Get all queries with analysis_mode='dsm' - pass "dsm" as query_type to get the right filter
        return self.graph_repo.list_queries(query_type="dsm")

    def update_query_status(
        self,
        query_id: str,
        status: str,
        error_message: Optional[str] = None
    ) -> bool:
        """Update query status."""
        return self.graph_repo.update_query_status(query_id, status, error_message)

    def update_query_metadata(self, query_id: str, metadata: Dict) -> bool:
        """Update query metadata."""
        return self.graph_repo.update_query_metadata(query_id, metadata)

    def delete_query(self, query_id: str) -> bool:
        """Delete query record."""
        return self.graph_repo.delete_query(query_id)

    # ========================================================================
    # Blob Storage Operations
    # ========================================================================

    def upload_json(self, query_id: str, filename: str, data: Dict) -> Optional[str]:
        """Upload JSON data to blob storage."""
        try:
            json_content = json.dumps(data, indent=2)
            return self.graph_repo.upload_report(query_id, filename, json_content)
        except Exception as e:
            print(f"Failed to upload JSON {filename} for {query_id}: {e}")
            return None

    def download_json(self, query_id: str, filename: str) -> Optional[str]:
        """Download JSON data from blob storage."""
        try:
            return self.graph_repo.download_report(query_id, filename)
        except Exception as e:
            print(f"Failed to download JSON {filename} for {query_id}: {e}")
            return None

    def upload_file(self, query_id: str, filename: str, content: str) -> Optional[str]:
        """Upload file content to blob storage."""
        try:
            return self.graph_repo.upload_report(query_id, filename, content)
        except Exception as e:
            print(f"Failed to upload file {filename} for {query_id}: {e}")
            return None

    def download_file(self, query_id: str, filename: str) -> Optional[str]:
        """Download file from blob storage."""
        try:
            return self.graph_repo.download_report(query_id, filename)
        except Exception as e:
            print(f"Failed to download file {filename} for {query_id}: {e}")
            return None

    def delete_file(self, query_id: str, filename: str) -> bool:
        """Delete file from blob storage."""
        try:
            return self.graph_repo.delete_report(query_id, filename)
        except Exception as e:
            print(f"Failed to delete file {filename} for {query_id}: {e}")
            return False

    def list_files(self, query_id: str) -> List[str]:
        """List all files for a query."""
        try:
            # This would require extending GraphRepository
            # For now, return empty list
            return []
        except Exception as e:
            print(f"Failed to list files for {query_id}: {e}")
            return []
