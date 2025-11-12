from typing import Dict, Optional
from datetime import datetime, timezone, timedelta
from azure.data.tables import TableServiceClient, TableEntity
import json
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from config.app_config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING
from repositories.impact_visualization_blob_repository import get_impact_visualization_blob_repository

TABLE_NAME = "impactvisualization"
PARTITION_KEY = "viz"

IST = timezone(timedelta(hours=5, minutes=30))


class ImpactVisualizationRepository:

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable or config is required")

        self.table_service_client = TableServiceClient.from_connection_string(self.connection_string)
        self.table_client = self.table_service_client.get_table_client(TABLE_NAME)

        # Get blob repository for storing actual visualization data
        self.blob_repository = get_impact_visualization_blob_repository()

        # Create table if it doesn't exist
        try:
            self.table_service_client.create_table_if_not_exists(TABLE_NAME)
        except Exception as e:
            print(f"Warning: Could not create table {TABLE_NAME}: {e}")

    def create(self, analysis_id: str, visualization_data: Dict) -> Dict:
        """Create a new visualization cache entry."""
        # Store visualization data in blob storage
        blob_url = self.blob_repository.upload(analysis_id, visualization_data)

        # Store metadata and blob reference in table storage
        entity = {
            'PartitionKey': PARTITION_KEY,
            'RowKey': analysis_id,
            'blob_url': blob_url,
            'storage_type': 'blob',  # Indicate this uses blob storage
            'data_size': len(json.dumps(visualization_data, ensure_ascii=False)),
            'created_at': datetime.now(IST).isoformat(),
            'updated_at': datetime.now(IST).isoformat()
        }

        self.table_client.create_entity(entity)
        return self._entity_to_dict(entity, visualization_data)

    def get_by_analysis_id(self, analysis_id: str) -> Optional[Dict]:
        """Get visualization data for a specific analysis."""
        try:
            entity = self.table_client.get_entity(PARTITION_KEY, analysis_id)
            if entity:
                # Check if this uses blob storage (new format) or inline storage (legacy)
                if entity.get('storage_type') == 'blob':
                    # Fetch actual data from blob storage
                    visualization_data = self.blob_repository.download(analysis_id)
                    if visualization_data:
                        return self._entity_to_dict(entity, visualization_data)
                    else:
                        print(f"Warning: Blob data not found for analysis {analysis_id}")
                        return None
                else:
                    # Legacy format: data stored inline (for backward compatibility)
                    return self._entity_to_dict(entity, None)
        except Exception as e:
            # Entity not found or other error
            return None
        return None

    def update(self, analysis_id: str, visualization_data: Dict) -> Dict:
        """Update an existing visualization cache entry."""
        try:
            entity = self.table_client.get_entity(PARTITION_KEY, analysis_id)
        except Exception:
            # If entity doesn't exist, create it
            return self.create(analysis_id, visualization_data)

        # Update visualization data in blob storage
        blob_url = self.blob_repository.upload(analysis_id, visualization_data)

        # Update metadata in table storage
        entity['blob_url'] = blob_url
        entity['storage_type'] = 'blob'
        entity['data_size'] = len(json.dumps(visualization_data, ensure_ascii=False))
        entity['updated_at'] = datetime.now(IST).isoformat()

        # Remove old inline data if it exists (migration from legacy format)
        if 'visualization_data' in entity:
            del entity['visualization_data']

        self.table_client.update_entity(entity, mode='replace')
        return self._entity_to_dict(entity, visualization_data)

    def delete(self, analysis_id: str) -> bool:
        """Delete a visualization cache entry."""
        try:
            # Delete from table storage
            self.table_client.delete_entity(PARTITION_KEY, analysis_id)

            # Delete from blob storage
            self.blob_repository.delete(analysis_id)

            return True
        except Exception as e:
            print(f"Error deleting visualization for analysis {analysis_id}: {e}")
            return False

    def exists(self, analysis_id: str) -> bool:
        """Check if visualization data exists for an analysis."""
        return self.get_by_analysis_id(analysis_id) is not None

    def _entity_to_dict(self, entity: TableEntity, visualization_data: Optional[Dict] = None) -> Dict:
        """
        Convert Azure Table entity to dictionary.

        Args:
            entity: Table entity containing metadata
            visualization_data: Optional pre-fetched visualization data (for blob storage)
        """
        result = {
            'analysis_id': entity.get('RowKey'),
            'created_at': entity.get('created_at'),
            'updated_at': entity.get('updated_at')
        }

        # Add visualization data
        if visualization_data:
            # Data provided (from blob storage)
            result['visualization_data'] = visualization_data
        elif entity.get('storage_type') == 'blob':
            # Blob storage format but data not provided (shouldn't happen)
            result['visualization_data'] = {}
            result['blob_url'] = entity.get('blob_url')
        else:
            # Legacy format: data stored inline
            result['visualization_data'] = json.loads(entity.get('visualization_data', '{}'))

        # Add metadata for blob storage entries
        if entity.get('storage_type') == 'blob':
            result['storage_type'] = 'blob'
            result['blob_url'] = entity.get('blob_url')
            result['data_size'] = entity.get('data_size')

        return result


# Singleton instance
_repository_instance = None

def get_impact_visualization_repository() -> ImpactVisualizationRepository:
    """Get or create singleton repository instance."""
    global _repository_instance
    if _repository_instance is None:
        _repository_instance = ImpactVisualizationRepository()
    return _repository_instance
