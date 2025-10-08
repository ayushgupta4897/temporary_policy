import uuid
import os
import json
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from azure.storage.blob import BlobServiceClient
from azure.data.tables import TableServiceClient

sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING
from news_horizon.analytics_engine import AnalyticsEngine


class NewsAnalyticsTableClient:
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

    def create_analytics_record(self, query_id: str) -> str:
        analytics_id = str(uuid.uuid4())

        entity = {
            'PartitionKey': query_id,
            'RowKey': analytics_id,
            'status': 'processing',
            'createdAt': datetime.now(timezone.utc).isoformat(),
            'articlesFetched': 0,
            'clusterCount': 0,
            'entityCount': 0
        }

        self.table_client.create_entity(entity=entity)
        return analytics_id

    def update_analytics_status(self, query_id: str, analytics_id: str, status: str, metadata: Dict = None):
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

        self.table_client.update_entity(entity=entity, mode='merge')

    def get_analytics(self, query_id: str, analytics_id: str) -> Optional[Dict]:
        entity = self.table_client.get_entity(
            partition_key=query_id,
            row_key=analytics_id
        )
        return dict(entity) if entity else None


class NewsAnalyticsBlobClient:
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
        blob_name = f"{query_id}/{analytics_type}.json"
        blob_client = self.service.get_blob_client(
            container=self.analytics_container,
            blob=blob_name
        )

        content = json.dumps(data, indent=2)
        blob_client.upload_blob(content, overwrite=True, content_type="application/json")
        return blob_client.url

    def download_analytics(self, query_id: str, analytics_type: str) -> Optional[Dict]:
        blob_name = f"{query_id}/{analytics_type}.json"

        blob_client = self.service.get_blob_client(
            container=self.analytics_container,
            blob=blob_name
        )

        data = blob_client.download_blob().readall().decode('utf-8')
        return json.loads(data)


class NewsAnalyticsService:
    def __init__(self):
        self.table_client = NewsAnalyticsTableClient()
        self.blob_client = NewsAnalyticsBlobClient()
        self.engine = AnalyticsEngine()
        self.executor = ThreadPoolExecutor(max_workers=2)

    def submit_analytics_job(self, query_id: str, citations: List[Dict]) -> str:
        analytics_id = self.table_client.create_analytics_record(query_id)

        self.executor.submit(self._process_analytics, query_id, analytics_id, citations)

        return analytics_id

    def get_latest_analytics(self, query_id: str) -> Optional[Dict]:
        entities = self.table_client.table_client.query_entities(
            query_filter=f"PartitionKey eq '{query_id}'"
        )

        analytics_list = list(entities)
        if not analytics_list:
            return None

        analytics_list.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        latest = dict(analytics_list[0])
        latest['analytics_id'] = latest.get('RowKey')
        return latest

    def get_analytics_status(self, query_id: str, analytics_id: str) -> Optional[Dict]:
        return self.table_client.get_analytics(query_id, analytics_id)

    def get_analytics_results(self, query_id: str, analytics_type: str) -> Optional[Dict]:
        return self.blob_client.download_analytics(query_id, analytics_type)

    def _process_analytics(self, query_id: str, analytics_id: str, citations: List[Dict]):
        print(f"[AnalyticsService] Starting analytics for query {query_id}")

        results = self.engine.run_full_analytics(citations)

        if results.get('status') == 'insufficient_data':
            print(f"[AnalyticsService] Insufficient data for analytics")
            self.table_client.update_analytics_status(
                query_id, analytics_id, 'failed',
                {'errorMessage': results.get('message')}
            )
            return

        print(f"[AnalyticsService] Uploading articles to blob storage...")
        self.blob_client.upload_articles(query_id, results.get('articles', {}))

        print(f"[AnalyticsService] Uploading analytics results...")
        analytics_types = ['clustering', 'trends', 'entities', 'geo', 'sentiment', 'summary']

        for atype in analytics_types:
            data = results.get(atype, results.get('summary') if atype == 'summary' else {})
            if data:
                self.blob_client.upload_analytics(query_id, atype, data)

        metadata = {
            'articlesFetched': results.get('articles_scraped', 0),
            'processingTimeSeconds': results.get('processing_time_seconds', 0),
            'clusterCount': results.get('clustering', {}).get('cluster_count', 0),
            'entityCount': results.get('entities', {}).get('total_unique_entities', 0),
            'regionsCount': results.get('geo', {}).get('total_regions', 0),
            'countriesCount': results.get('geo', {}).get('total_countries', 0)
        }

        self.table_client.update_analytics_status(query_id, analytics_id, 'done', metadata)

        print(f"[AnalyticsService] Analytics completed for query {query_id}")


news_analytics_service = NewsAnalyticsService()
