"""
Analytics Repository - DUMB CRUD operations only
No business logic, validation, or orchestration
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime, timezone
from azure.storage.blob import BlobServiceClient
from azure.data.tables import TableServiceClient
from config.app_config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING


class NewsAnalyticsTableClient:
    """Table client for news analytics."""

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING required")

        self.service = TableServiceClient.from_connection_string(self.connection_string)
        self.table_name = "NewsAnalytics"

        try:
            self.service.create_table(self.table_name)
        except Exception:
            pass

        self.table_client = self.service.get_table_client(self.table_name)

    def create_analytics_record(self, query_id: str, analytics_id: str) -> bool:
        """Create a new analytics record."""
        entity = {
            'PartitionKey': query_id,
            'RowKey': analytics_id,
            'status': 'processing',
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'articlesFetched': 0,
            'clusterCount': 0,
            'entityCount': 0
        }

        try:
            self.table_client.create_entity(entity=entity)
            return True
        except Exception:
            return False

    def update_analytics_status(self, query_id: str, analytics_id: str,
                               status: str, metadata: Dict = None) -> bool:
        """Update analytics status."""
        entity = {
            'PartitionKey': query_id,
            'RowKey': analytics_id,
            'status': status
        }

        if status == 'done':
            entity['completedAt'] = datetime.now(timezone.utc).isoformat()

        if metadata:
            for key, value in metadata.items():
                entity[key] = value

        try:
            self.table_client.update_entity(entity=entity, mode='merge')
            return True
        except Exception:
            return False

    def get_analytics(self, query_id: str, analytics_id: str) -> Optional[Dict]:
        """Get an analytics record."""
        try:
            entity = self.table_client.get_entity(
                partition_key=query_id,
                row_key=analytics_id
            )
            return dict(entity)
        except Exception:
            return None

    def query_analytics(self, query_id: str) -> List[Dict]:
        """Query all analytics for a query."""
        try:
            entities = self.table_client.query_entities(
                query_filter=f"PartitionKey eq '{query_id}'"
            )
            return [dict(e) for e in entities]
        except Exception:
            return []


class NewsAnalyticsBlobClient:
    """Blob client for news analytics."""

    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING required")

        self.service = BlobServiceClient.from_connection_string(self.connection_string)
        self.articles_container = "news-articles"
        self.analytics_container = "news-analytics"

        for container in [self.articles_container, self.analytics_container]:
            try:
                self.service.create_container(container)
            except Exception:
                pass

    def upload_articles(self, query_id: str, articles: Dict) -> List[str]:
        """Upload articles to blob storage."""
        uploaded = []

        for article_hash, article_data in articles.items():
            blob_name = f"{query_id}/{article_hash}.json"
            blob_client = self.service.get_blob_client(
                container=self.articles_container,
                blob=blob_name
            )

            content = json.dumps(article_data, indent=2)
            blob_client.upload_blob(content, overwrite=True, content_type="application/json")
            uploaded.append(blob_name)

        return uploaded

    def upload_analytics(self, query_id: str, analytics_type: str, data: Dict) -> str:
        """Upload analytics data to blob storage."""
        blob_name = f"{query_id}/{analytics_type}.json"
        blob_client = self.service.get_blob_client(
            container=self.analytics_container,
            blob=blob_name
        )

        content = json.dumps(data, indent=2)
        blob_client.upload_blob(content, overwrite=True, content_type="application/json")
        return blob_client.url

    def download_analytics(self, query_id: str, analytics_type: str) -> Optional[Dict]:
        """Download analytics data from blob storage."""
        blob_name = f"{query_id}/{analytics_type}.json"

        try:
            blob_client = self.service.get_blob_client(
                container=self.analytics_container,
                blob=blob_name
            )

            data = blob_client.download_blob().readall().decode('utf-8')
            return json.loads(data)
        except Exception:
            return None


class AnalyticsRepository:
    """Repository for analytics data persistence."""

    def __init__(self, table_client: NewsAnalyticsTableClient = None,
                 blob_client: NewsAnalyticsBlobClient = None):
        """Initialize with Azure clients."""
        self.table_client = table_client or NewsAnalyticsTableClient()
        self.blob_client = blob_client or NewsAnalyticsBlobClient()

    # Analytics CRUD operations

    def create_analytics_record(self, query_id: str, analytics_id: str) -> bool:
        """Create a new analytics record."""
        return self.table_client.create_analytics_record(query_id, analytics_id)

    def update_analytics_status(self, query_id: str, analytics_id: str,
                               status: str, metadata: Dict = None) -> bool:
        """Update analytics status."""
        return self.table_client.update_analytics_status(query_id, analytics_id, status, metadata)

    def get_analytics(self, query_id: str, analytics_id: str) -> Optional[Dict]:
        """Get an analytics record."""
        return self.table_client.get_analytics(query_id, analytics_id)

    def query_analytics(self, query_id: str) -> List[Dict]:
        """Query all analytics for a query."""
        return self.table_client.query_analytics(query_id)

    # Blob CRUD operations

    def upload_articles(self, query_id: str, articles: Dict) -> List[str]:
        """Upload articles to blob storage."""
        return self.blob_client.upload_articles(query_id, articles)

    def upload_analytics(self, query_id: str, analytics_type: str, data: Dict) -> str:
        """Upload analytics data to blob storage."""
        return self.blob_client.upload_analytics(query_id, analytics_type, data)

    def download_analytics(self, query_id: str, analytics_type: str) -> Optional[Dict]:
        """Download analytics data from blob storage."""
        return self.blob_client.download_analytics(query_id, analytics_type)
