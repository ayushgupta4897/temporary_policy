"""
Repository for storing large impact visualization data in Azure Blob Storage.
This repository handles unlimited-size visualization JSON data that exceeds Table Storage limits.
"""
from typing import Dict, Optional
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient, ContentSettings
import json
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from config.app_config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING

CONTAINER_NAME = "impact-visualizations"
BLOB_NAME_FORMAT = "{analysis_id}.json"  # e.g., "abc123.json"


class ImpactVisualizationBlobRepository:
    """Repository for storing visualization data in Azure Blob Storage."""

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable or config is required")

        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        self.container_client = self._get_or_create_container()

    def _get_or_create_container(self) -> ContainerClient:
        """Get container client and create container if it doesn't exist."""
        container_client = self.blob_service_client.get_container_client(CONTAINER_NAME)

        try:
            # Check if container exists
            container_client.get_container_properties()
        except Exception:
            # Container doesn't exist, create it
            try:
                container_client.create_container()
                print(f"Created blob container: {CONTAINER_NAME}")
            except Exception as e:
                print(f"Warning: Could not create container {CONTAINER_NAME}: {e}")

        return container_client

    def _get_blob_name(self, analysis_id: str) -> str:
        """Generate blob name from analysis ID."""
        return BLOB_NAME_FORMAT.format(analysis_id=analysis_id)

    def upload(self, analysis_id: str, visualization_data: Dict) -> str:
        """
        Upload visualization data to blob storage.

        Args:
            analysis_id: Unique identifier for the analysis
            visualization_data: Dictionary containing visualization data

        Returns:
            Blob URL
        """
        blob_name = self._get_blob_name(analysis_id)
        blob_client = self.container_client.get_blob_client(blob_name)

        # Convert dict to JSON string
        json_data = json.dumps(visualization_data, ensure_ascii=False, indent=2)

        # Upload as JSON blob with appropriate content type
        blob_client.upload_blob(
            json_data,
            overwrite=True,
            content_settings=ContentSettings(content_type='application/json')
        )

        return blob_client.url

    def download(self, analysis_id: str) -> Optional[Dict]:
        """
        Download visualization data from blob storage.

        Args:
            analysis_id: Unique identifier for the analysis

        Returns:
            Dictionary containing visualization data, or None if not found
        """
        blob_name = self._get_blob_name(analysis_id)
        blob_client = self.container_client.get_blob_client(blob_name)

        try:
            # Download blob as string
            blob_data = blob_client.download_blob().readall()

            # Parse JSON
            visualization_data = json.loads(blob_data)
            return visualization_data

        except Exception as e:
            print(f"Error downloading visualization for analysis {analysis_id}: {e}")
            return None

    def exists(self, analysis_id: str) -> bool:
        """
        Check if visualization data exists for an analysis.

        Args:
            analysis_id: Unique identifier for the analysis

        Returns:
            True if blob exists, False otherwise
        """
        blob_name = self._get_blob_name(analysis_id)
        blob_client = self.container_client.get_blob_client(blob_name)

        try:
            blob_client.get_blob_properties()
            return True
        except Exception:
            return False

    def delete(self, analysis_id: str) -> bool:
        """
        Delete visualization data from blob storage.

        Args:
            analysis_id: Unique identifier for the analysis

        Returns:
            True if deleted successfully, False otherwise
        """
        blob_name = self._get_blob_name(analysis_id)
        blob_client = self.container_client.get_blob_client(blob_name)

        try:
            blob_client.delete_blob()
            return True
        except Exception as e:
            print(f"Error deleting visualization for analysis {analysis_id}: {e}")
            return False

    def get_blob_url(self, analysis_id: str) -> Optional[str]:
        """
        Get the URL for a visualization blob.

        Args:
            analysis_id: Unique identifier for the analysis

        Returns:
            Blob URL if exists, None otherwise
        """
        if not self.exists(analysis_id):
            return None

        blob_name = self._get_blob_name(analysis_id)
        blob_client = self.container_client.get_blob_client(blob_name)
        return blob_client.url


# Singleton instance
_blob_repository_instance = None

def get_impact_visualization_blob_repository() -> ImpactVisualizationBlobRepository:
    """Get or create singleton blob repository instance."""
    global _blob_repository_instance
    if _blob_repository_instance is None:
        _blob_repository_instance = ImpactVisualizationBlobRepository()
    return _blob_repository_instance
