"""
Foresight Radar Repository - DUMB CRUD operations only
No business logic, validation, or orchestration
"""

from typing import Dict, List, Optional
from clients.azure import AzureTableClient, AzureBlobClient


class ForesightRadarRepository:
    """Repository for foresight radar query data persistence."""

    def __init__(self, table_client: AzureTableClient = None, blob_client: AzureBlobClient = None):
        """Initialize with Azure clients."""
        self.table_client = table_client or AzureTableClient()
        self.blob_client = blob_client or AzureBlobClient()

    # Query CRUD operations

    def create_query(self, query_id: str, query_text: str, display_title: str,
                    analysis_mode: str = "foresight_radar", metadata: Dict = None) -> bool:
        """Create a new foresight radar query record."""
        return self.table_client.create_query(
            query_id, query_text, display_title, analysis_mode, metadata
        )

    def get_query(self, query_id: str) -> Optional[Dict]:
        """Get a foresight radar query by ID."""
        return self.table_client.get_query(query_id)

    def list_queries(self, query_type: str = "foresight_radar") -> List[Dict]:
        """List all foresight radar queries."""
        return self.table_client.list_queries(query_type=query_type)

    def update_query_status(self, query_id: str, status: str, error_message: str = None) -> bool:
        """Update query status."""
        return self.table_client.update_query_status(query_id, status, error_message)

    def update_query_blob_urls(self, query_id: str, blob_urls: List[Dict]) -> bool:
        """Update query with blob URLs."""
        return self.table_client.update_query_blob_urls(query_id, blob_urls)

    def update_query_metadata(self, query_id: str, metadata: Dict) -> bool:
        """Update query metadata."""
        return self.table_client.update_query_metadata(query_id, metadata)

    def delete_query(self, query_id: str) -> bool:
        """Delete a foresight radar query."""
        return self.table_client.delete_query(query_id)

    # Report/Blob CRUD operations

    def upload_report(self, query_id: str, filename: str, content: str) -> str:
        """Upload a radar result to blob storage."""
        return self.blob_client.upload_report(query_id, filename, content)

    def download_report(self, query_id: str, filename: str) -> Optional[str]:
        """Download a radar result from blob storage."""
        return self.blob_client.download_report(query_id, filename)

    def list_reports(self, query_id: str) -> List[str]:
        """List all radar results for a query."""
        return self.blob_client.list_reports(query_id)

    def delete_report(self, query_id: str, filename: str) -> bool:
        """Delete a radar result from blob storage."""
        return self.blob_client.delete_report(query_id, filename)
