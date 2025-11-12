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
from agents.news_horizon.analytics_engine import AnalyticsEngine
from repositories.analytics_repository import AnalyticsRepository

# ============================================================================
# CONSTANTS
# ============================================================================

# Thread pool configuration
MAX_WORKERS = 2

# Analytics statuses
STATUS_INSUFFICIENT_DATA = "insufficient_data"
STATUS_FAILED = "failed"
STATUS_DONE = "done"

# Analytics types
ANALYTICS_TYPES = ['clustering', 'trends', 'entities', 'geo', 'sentiment', 'summary']

# ============================================================================


class NewsAnalyticsService:
    def __init__(self, repository: AnalyticsRepository = None):
        self.repository = repository or AnalyticsRepository()
        self.engine = AnalyticsEngine()
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

    def submit_analytics_job(self, query_id: str, citations: List[Dict]) -> str:
        analytics_id = self.repository.create_analytics_record(query_id)

        self.executor.submit(self._process_analytics, query_id, analytics_id, citations)

        return analytics_id

    def get_latest_analytics(self, query_id: str) -> Optional[Dict]:
        analytics_list = self.repository.query_analytics(query_id)

        if not analytics_list:
            return None

        analytics_list.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        latest = analytics_list[0]
        latest['analytics_id'] = latest.get('RowKey')
        return latest

    def get_analytics_status(self, query_id: str, analytics_id: str) -> Optional[Dict]:
        return self.repository.get_analytics(query_id, analytics_id)

    def get_analytics_results(self, query_id: str, analytics_type: str) -> Optional[Dict]:
        return self.repository.download_analytics(query_id, analytics_type)

    def _process_analytics(self, query_id: str, analytics_id: str, citations: List[Dict]):
        print(f"[AnalyticsService] Starting analytics for query {query_id}")

        results = self.engine.run_full_analytics(citations)

        if results.get('status') == STATUS_INSUFFICIENT_DATA:
            print(f"[AnalyticsService] Insufficient data for analytics")
            self.repository.update_analytics_status(
                query_id, analytics_id, STATUS_FAILED,
                {'errorMessage': results.get('message')}
            )
            return

        print(f"[AnalyticsService] Uploading articles to blob storage...")
        self.repository.upload_articles(query_id, results.get('articles', {}))

        print(f"[AnalyticsService] Uploading analytics results...")
        analytics_types = ANALYTICS_TYPES

        for atype in analytics_types:
            data = results.get(atype, results.get('summary') if atype == 'summary' else {})
            if data:
                self.repository.upload_analytics(query_id, atype, data)

        metadata = {
            'articlesFetched': results.get('articles_scraped', 0),
            'processingTimeSeconds': results.get('processing_time_seconds', 0),
            'clusterCount': results.get('clustering', {}).get('cluster_count', 0),
            'entityCount': results.get('entities', {}).get('total_unique_entities', 0),
            'regionsCount': results.get('geo', {}).get('total_regions', 0),
            'countriesCount': results.get('geo', {}).get('total_countries', 0)
        }

        self.repository.update_analytics_status(query_id, analytics_id, STATUS_DONE, metadata)

        print(f"[AnalyticsService] Analytics completed for query {query_id}")


news_analytics_service = NewsAnalyticsService()
