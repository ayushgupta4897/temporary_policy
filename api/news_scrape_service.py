import uuid
import os
import json
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from azure.storage.blob import BlobServiceClient

sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING
from azure_clients import AzureTableClient
from news_horizon import NewsHorizonAgent as NewsScrapeAgent


class NewsScrapeTableClient(AzureTableClient):
    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING required")
        
        from azure.data.tables import TableServiceClient
        self.service = TableServiceClient.from_connection_string(self.connection_string)
        self.table_name = "NewsScrapeQueries"
        
        try:
            self.service.create_table(self.table_name)
        except Exception:
            pass
        
        self.table_client = self.service.get_table_client(self.table_name)


class NewsScrapeBlobClient:
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
        blob_name = f"{query_id}/{report_name}"
        blob_client = self.service.get_blob_client(container=self.container_name, blob=blob_name)
        blob_client.upload_blob(content, overwrite=True, content_type="application/json")
        return blob_client.url
    
    def download_report(self, query_id: str, report_name: str) -> Optional[str]:
        blob_name = f"{query_id}/{report_name}"
        try:
            blob_client = self.service.get_blob_client(container=self.container_name, blob=blob_name)
            return blob_client.download_blob().readall().decode('utf-8')
        except Exception:
            return None
    
    def delete_report(self, query_id: str, report_name: str) -> bool:
        blob_name = f"{query_id}/{report_name}"
        try:
            blob_client = self.service.get_blob_client(container=self.container_name, blob=blob_name)
            blob_client.delete_blob()
            return True
        except Exception:
            return False


class NewsScrapeService:
    DEFAULT_BATCH_SIZE = 10
    MAX_CONCURRENT_SEARCHES = 3
    
    def __init__(self):
        self.table_client = NewsScrapeTableClient()
        self.blob_client = NewsScrapeBlobClient()
        self.executor = ThreadPoolExecutor(max_workers=self.MAX_CONCURRENT_SEARCHES)
    
    def submit_news_scrape(self, query: str, timeline: str = "last_6_months") -> str:
        query_id = str(uuid.uuid4())
        
        metadata = {
            'queryType': 'news_scrape',
            'timeline': timeline,
            'totalCitations': 0,
            'hierarchies': json.dumps([]),
            'geographiesCount': 0
        }
        
        success = self.table_client.create_query(
            query_id, query, query[:60],
            analysis_mode='news_scrape',
            metadata=metadata
        )
        
        if not success:
            raise Exception("Failed to create news scrape record")
        
        self.executor.submit(self._process_news_scrape, query_id, query, timeline)
        
        return query_id
    
    def get_news_scrape_status(self, query_id: str) -> Optional[Dict]:
        query_data = self.table_client.get_query(query_id)
        if query_data and query_data.get('analysisMode') == 'news_scrape':
            return query_data
        return None
    
    def list_news_scrapes(self) -> List[Dict]:
        return self.table_client.list_queries(query_type="news_scrape")
    
    def get_news_scrape_content(self, query_id: str, content_type: str) -> Optional[str]:
        type_map = {
            'full': 'news_scrape_full.json',
            'hierarchy': 'hierarchy_structure.json',
            'summaries': 'executive_summaries.json',
            'citations': 'all_citations.json'
        }
        
        filename = type_map.get(content_type)
        if not filename:
            return None
        
        return self.blob_client.download_report(query_id, filename)
    
    def delete_news_scrape(self, query_id: str) -> bool:
        try:
            files = ['news_scrape_full.json', 'hierarchy_structure.json', 
                    'executive_summaries.json', 'all_citations.json']
            
            for file in files:
                self.blob_client.delete_report(query_id, file)
            
            return self.table_client.delete_query(query_id)
        except Exception as e:
            print(f"Error deleting news scrape {query_id}: {e}")
            return False
    
    def _process_news_scrape(self, query_id: str, query: str, timeline: str):
        try:
            print(f"Starting news scrape for query {query_id} (timeline: {timeline})")
            
            agent = NewsScrapeAgent()
            results = agent.analyze(query, timeline)
            
            blob_urls = self._upload_results(query_id, results)
            self._update_completion(query_id, blob_urls, results)
            
            print(f"News scrape {query_id} completed")
            
        except Exception as e:
            print(f"Error processing news scrape {query_id}: {e}")
            import traceback
            traceback.print_exc()
            try:
                self.table_client.update_query_status(query_id, "failed", str(e))
            except Exception:
                pass
    
    def _upload_results(self, query_id: str, results: Dict) -> List[Dict]:
        blob_urls = []
        
        full_data = json.dumps(results, indent=2)
        blob_url = self.blob_client.upload_report(query_id, 'news_scrape_full.json', full_data)
        if blob_url:
            blob_urls.append({"type": "full", "filename": "news_scrape_full.json", "url": blob_url})
        
        hierarchy_data = json.dumps({
            'hierarchy': results.get('hierarchy', {}),
            'news_by_geography': results.get('news_by_geography', {})
        }, indent=2)
        blob_url = self.blob_client.upload_report(query_id, 'hierarchy_structure.json', hierarchy_data)
        if blob_url:
            blob_urls.append({"type": "hierarchy", "filename": "hierarchy_structure.json", "url": blob_url})
        
        summaries_data = json.dumps(results.get('executive_summaries', {}), indent=2)
        blob_url = self.blob_client.upload_report(query_id, 'executive_summaries.json', summaries_data)
        if blob_url:
            blob_urls.append({"type": "summaries", "filename": "executive_summaries.json", "url": blob_url})
        
        all_citations = results.get('citations', [])
        if not all_citations:
            for level, geos in results.get('news_by_geography', {}).items():
                for geo_name, citations in geos.items():
                    for citation in citations:
                        citation['hierarchy_level'] = level
                        citation['geography'] = geo_name
                        all_citations.append(citation)
        
        citations_data = json.dumps({'citations': all_citations, 'total': len(all_citations)}, indent=2)
        blob_url = self.blob_client.upload_report(query_id, 'all_citations.json', citations_data)
        if blob_url:
            blob_urls.append({"type": "citations", "filename": "all_citations.json", "url": blob_url})
        
        return blob_urls
    
    def _update_completion(self, query_id: str, blob_urls: List[Dict], results: Dict):
        self.table_client.update_query_blob_urls(query_id, blob_urls)
        
        query = self.table_client.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(timezone.utc)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60)
            
            hierarchies = results.get('hierarchy', {}).get('hierarchies', [])
            countries = results.get('hierarchy', {}).get('countries', [])
            regions = results.get('hierarchy', {}).get('regions', [])
            total_geos = len(countries) + len(regions) + (1 if 'globe' in hierarchies else 0)
            
            print(f"Updating metadata: citations={results.get('total_citations', 0)}, hierarchies={hierarchies}, geos={total_geos}")
            
            self.table_client.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'totalCitations': results.get('total_citations', 0),
                'hierarchies': json.dumps(hierarchies),
                'geographiesCount': total_geos,
                'timeline': results.get('timeline', 'last_6_months')
            })
            
            print(f"Metadata updated successfully for query {query_id}")
        
        self.table_client.update_query_status(query_id, "done")


news_scrape_service = NewsScrapeService()

