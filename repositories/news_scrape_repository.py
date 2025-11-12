"""
News Scrape Repository - DUMB CRUD operations only
No business logic, validation, or orchestration
"""

import os
from typing import Dict, List, Optional
from azure.storage.blob import BlobServiceClient
from azure.data.tables import TableServiceClient
from config.app_config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING


class NewsScrapeTableClient:
    """Table client for news scrape queries."""

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING required")

        self.service = TableServiceClient.from_connection_string(self.connection_string)
        self.table_name = "NewsScrapeQueries"

        try:
            self.service.create_table(self.table_name)
        except Exception:
            pass

        self.table_client = self.service.get_table_client(self.table_name)

    def create_query(self, query_id: str, query_text: str, display_title: str,
                    analysis_mode: str = "news_scrape", metadata: Dict = None) -> bool:
        """Create a new news scrape query record."""
        from datetime import datetime, timezone

        entity = {
            'PartitionKey': 'news_scrape',
            'RowKey': query_id,
            'queryId': query_id,
            'queryText': query_text,
            'displayTitle': display_title,
            'status': 'processing',
            'analysisMode': analysis_mode,
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'blobUrls': '[]'
        }

        if metadata:
            entity.update(metadata)

        try:
            self.table_client.create_entity(entity=entity)
            return True
        except Exception:
            return False

    def get_query(self, query_id: str) -> Optional[Dict]:
        """Get a news scrape query by ID."""
        try:
            entity = self.table_client.get_entity(partition_key='news_scrape', row_key=query_id)
            return dict(entity)
        except Exception:
            return None

    def list_queries(self, query_type: str = "news_scrape") -> List[Dict]:
        """List all news scrape queries."""
        try:
            entities = self.table_client.query_entities(
                query_filter=f"analysisMode eq '{query_type}'"
            )
            return [dict(e) for e in entities]
        except Exception:
            return []

    def update_query_status(self, query_id: str, status: str, error_message: str = None) -> bool:
        """Update query status."""
        entity = {
            'PartitionKey': 'news_scrape',
            'RowKey': query_id,
            'status': status
        }

        if error_message:
            entity['errorMessage'] = error_message

        try:
            self.table_client.update_entity(entity=entity, mode='merge')
            return True
        except Exception:
            return False

    def update_query_blob_urls(self, query_id: str, blob_urls: List[Dict]) -> bool:
        """Update query with blob URLs."""
        import json

        entity = {
            'PartitionKey': 'news_scrape',
            'RowKey': query_id,
            'blobUrls': json.dumps(blob_urls)
        }

        try:
            self.table_client.update_entity(entity=entity, mode='merge')
            return True
        except Exception:
            return False

    def update_query_metadata(self, query_id: str, metadata: Dict) -> bool:
        """Update query metadata."""
        entity = {
            'PartitionKey': 'news_scrape',
            'RowKey': query_id
        }
        entity.update(metadata)

        try:
            self.table_client.update_entity(entity=entity, mode='merge')
            return True
        except Exception:
            return False

    def delete_query(self, query_id: str) -> bool:
        """Delete a news scrape query."""
        try:
            self.table_client.delete_entity(partition_key='news_scrape', row_key=query_id)
            return True
        except Exception:
            return False


class NewsScrapeBlobClient:
    """Blob client for news scrape results."""

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING required")

        self.service = BlobServiceClient.from_connection_string(self.connection_string)
        self.container_name = "news-scrape-results"

        try:
            self.service.create_container(self.container_name)
        except Exception:
            pass

    def upload_report(self, query_id: str, report_name: str, content: str) -> Optional[str]:
        """Upload a news scrape result to blob storage."""
        blob_name = f"{query_id}/{report_name}"
        blob_client = self.service.get_blob_client(container=self.container_name, blob=blob_name)
        blob_client.upload_blob(content, overwrite=True, content_type="application/json")
        return blob_client.url

    def download_report(self, query_id: str, report_name: str) -> Optional[str]:
        """Download a news scrape result from blob storage."""
        blob_name = f"{query_id}/{report_name}"
        try:
            blob_client = self.service.get_blob_client(container=self.container_name, blob=blob_name)
            return blob_client.download_blob().readall().decode('utf-8')
        except Exception:
            return None

    def delete_report(self, query_id: str, report_name: str) -> bool:
        """Delete a news scrape result from blob storage."""
        blob_name = f"{query_id}/{report_name}"
        try:
            blob_client = self.service.get_blob_client(container=self.container_name, blob=blob_name)
            blob_client.delete_blob()
            return True
        except Exception:
            return False


class NewsScrapeRepository:
    """Repository for news scrape query data persistence."""

    def __init__(self, table_client: NewsScrapeTableClient = None,
                 blob_client: NewsScrapeBlobClient = None):
        """Initialize with Azure clients."""
        self.table_client = table_client or NewsScrapeTableClient()
        self.blob_client = blob_client or NewsScrapeBlobClient()

    # Query CRUD operations

    def create_query(self, query_id: str, query_text: str, display_title: str,
                    analysis_mode: str = "news_scrape", metadata: Dict = None) -> bool:
        """Create a new news scrape query record."""
        return self.table_client.create_query(
            query_id, query_text, display_title, analysis_mode, metadata
        )

    def get_query(self, query_id: str) -> Optional[Dict]:
        """Get a news scrape query by ID."""
        return self.table_client.get_query(query_id)

    def list_queries(self, query_type: str = "news_scrape") -> List[Dict]:
        """List all news scrape queries."""
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
        """Delete a news scrape query."""
        return self.table_client.delete_query(query_id)

    # Report/Blob CRUD operations

    def upload_report(self, query_id: str, filename: str, content: str) -> str:
        """Upload a news scrape result to blob storage."""
        return self.blob_client.upload_report(query_id, filename, content)

    def download_report(self, query_id: str, filename: str) -> Optional[str]:
        """Download a news scrape result from blob storage."""
        return self.blob_client.download_report(query_id, filename)

    def delete_report(self, query_id: str, filename: str) -> bool:
        """Delete a news scrape result from blob storage."""
        return self.blob_client.delete_report(query_id, filename)
