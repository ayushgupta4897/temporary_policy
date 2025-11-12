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
from agents.news_horizon.agent import NewsHorizonAgent as NewsScrapeAgent
from repositories.news_scrape_repository import NewsScrapeRepository

# ============================================================================
# CONSTANTS
# ============================================================================

# Thread pool configuration
DEFAULT_BATCH_SIZE = 10
MAX_CONCURRENT_SEARCHES = 3

# Query types
QUERY_TYPE_NEWS_SCRAPE = "news_scrape"
ANALYSIS_MODE_NEWS_SCRAPE = "news_scrape"

# Query statuses
STATUS_PROCESSING = "processing"
STATUS_FAILED = "failed"
STATUS_DONE = "done"

# Timeline options
TIMELINE_DEFAULT = "last_6_months"

# Title truncation
TITLE_MAX_LENGTH = 60

# News scrape file types
NEWS_FILE_FULL = "news_scrape_full.json"
NEWS_FILE_HIERARCHY = "hierarchy_structure.json"
NEWS_FILE_SUMMARIES = "executive_summaries.json"
NEWS_FILE_CITATIONS = "all_citations.json"

# News content type mapping
NEWS_TYPE_MAP = {
    'full': NEWS_FILE_FULL,
    'hierarchy': NEWS_FILE_HIERARCHY,
    'summaries': NEWS_FILE_SUMMARIES,
    'citations': NEWS_FILE_CITATIONS
}

# ============================================================================


class NewsScrapeService:

    def __init__(self, repository: NewsScrapeRepository = None):
        self.repository = repository or NewsScrapeRepository()
        self.executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_SEARCHES)
    
    def submit_news_scrape(self, query: str, timeline: str = TIMELINE_DEFAULT) -> str:
        query_id = str(uuid.uuid4())
        
        metadata = {
            'queryType': QUERY_TYPE_NEWS_SCRAPE,
            'timeline': timeline,
            'totalCitations': 0,
            'hierarchies': json.dumps([]),
            'geographiesCount': 0
        }
        
        success = self.repository.create_query(
            query_id, query, query[:TITLE_MAX_LENGTH],
            analysis_mode=ANALYSIS_MODE_NEWS_SCRAPE,
            metadata=metadata
        )
        
        if not success:
            raise Exception("Failed to create news scrape record")
        
        self.executor.submit(self._process_news_scrape, query_id, query, timeline)
        
        return query_id
    
    def get_news_scrape_status(self, query_id: str) -> Optional[Dict]:
        query_data = self.repository.get_query(query_id)
        if query_data and query_data.get('analysisMode') == ANALYSIS_MODE_NEWS_SCRAPE:
            return query_data
        return None
    
    def list_news_scrapes(self) -> List[Dict]:
        return self.repository.list_queries(query_type=QUERY_TYPE_NEWS_SCRAPE)
    
    def get_news_scrape_content(self, query_id: str, content_type: str) -> Optional[str]:
        filename = NEWS_TYPE_MAP.get(content_type)
        if not filename:
            return None

        return self.repository.download_report(query_id, filename)

    def delete_news_scrape(self, query_id: str) -> bool:
        try:
            files = [
                NEWS_FILE_FULL,
                NEWS_FILE_HIERARCHY,
                NEWS_FILE_SUMMARIES,
                NEWS_FILE_CITATIONS
            ]

            for file in files:
                self.repository.delete_report(query_id, file)

            return self.repository.delete_query(query_id)
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
                self.repository.update_query_status(query_id, STATUS_FAILED, str(e))
            except Exception:
                pass
    
    def _upload_results(self, query_id: str, results: Dict) -> List[Dict]:
        blob_urls = []

        full_data = json.dumps(results, indent=2)
        blob_url = self.repository.upload_report(query_id, NEWS_FILE_FULL, full_data)
        if blob_url:
            blob_urls.append({"type": "full", "filename": NEWS_FILE_FULL, "url": blob_url})

        hierarchy_data = json.dumps({
            'hierarchy': results.get('hierarchy', {}),
            'news_by_geography': results.get('news_by_geography', {})
        }, indent=2)
        blob_url = self.repository.upload_report(query_id, NEWS_FILE_HIERARCHY, hierarchy_data)
        if blob_url:
            blob_urls.append({"type": "hierarchy", "filename": NEWS_FILE_HIERARCHY, "url": blob_url})

        summaries_data = json.dumps(results.get('executive_summaries', {}), indent=2)
        blob_url = self.repository.upload_report(query_id, NEWS_FILE_SUMMARIES, summaries_data)
        if blob_url:
            blob_urls.append({"type": "summaries", "filename": NEWS_FILE_SUMMARIES, "url": blob_url})
        
        all_citations = results.get('citations', [])
        if not all_citations:
            for level, geos in results.get('news_by_geography', {}).items():
                for geo_name, citations in geos.items():
                    for citation in citations:
                        citation['hierarchy_level'] = level
                        citation['geography'] = geo_name
                        all_citations.append(citation)
        
        citations_data = json.dumps({'citations': all_citations, 'total': len(all_citations)}, indent=2)
        blob_url = self.repository.upload_report(query_id, NEWS_FILE_CITATIONS, citations_data)
        if blob_url:
            blob_urls.append({"type": "citations", "filename": NEWS_FILE_CITATIONS, "url": blob_url})
        
        return blob_urls
    
    def _update_completion(self, query_id: str, blob_urls: List[Dict], results: Dict):
        self.repository.update_query_blob_urls(query_id, blob_urls)
        
        query = self.repository.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(timezone.utc)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60)
            
            hierarchies = results.get('hierarchy', {}).get('hierarchies', [])
            countries = results.get('hierarchy', {}).get('countries', [])
            regions = results.get('hierarchy', {}).get('regions', [])
            total_geos = len(countries) + len(regions) + (1 if 'globe' in hierarchies else 0)
            
            print(f"Updating metadata: citations={results.get('total_citations', 0)}, hierarchies={hierarchies}, geos={total_geos}")
            
            self.repository.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'totalCitations': results.get('total_citations', 0),
                'hierarchies': json.dumps(hierarchies),
                'geographiesCount': total_geos,
                'timeline': results.get('timeline', TIMELINE_DEFAULT)
            })
            
            print(f"Metadata updated successfully for query {query_id}")
        
        self.repository.update_query_status(query_id, STATUS_DONE)


news_scrape_service = NewsScrapeService()

