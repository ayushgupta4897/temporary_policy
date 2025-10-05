"""
Contextual Search Service - Orchestrates contextual web search operations
Strategy& PWC - Enhanced Web Search Component
"""

import uuid
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import threading
import time
import openai
import os
import json

# IST timezone
IST = timezone(timedelta(hours=5, minutes=30))

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

# Import config for API key
from policy_drafter.config import PolicyDrafterConfig
# Import contextual web search from parent directory
sys.path.append(str(Path(__file__).parent.parent / "contextual_web_search"))
from contextual_web_search.simple_web_search import SimpleWebSearch

from azure_clients import AzureTableClient, AzureBlobClient


class ContextualSearchTableClient(AzureTableClient):
    """Specialized table client for contextual search operations."""
    
    def __init__(self):
        # Use the same connection logic as parent but different table name
        from policy_drafter.config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING
        
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable or config is required")
        
        from azure.data.tables import TableServiceClient
        self.service = TableServiceClient.from_connection_string(self.connection_string)
        self.table_name = "ContextualSearchQueries"  # Separate table for contextual searches
        
        # Create table if it doesn't exist
        try:
            self.service.create_table(self.table_name)
        except Exception:
            pass  # Table already exists
        
        # Get table client for operations
        self.table_client = self.service.get_table_client(self.table_name)


class ContextualSearchService:
    """Service layer for managing contextual web search lifecycle."""
    
    # Configuration constants
    DEFAULT_BATCH_SIZE = 10  # Configurable batch size for parallel searches
    MAX_CONCURRENT_SEARCHES = 3  # Maximum concurrent search processing
    
    def __init__(self):
        self.table_client = ContextualSearchTableClient()
        self.blob_client = AzureBlobClient()
        self.executor = ThreadPoolExecutor(max_workers=self.MAX_CONCURRENT_SEARCHES)
    
    def submit_contextual_search(self, query_text: str) -> str:
        """Submit a new contextual search query."""
        query_id = str(uuid.uuid4())
        
        # Generate display title
        display_title = self._generate_display_title(query_text)
        
        # Create record in table storage with type 'contextual_search'
        metadata = {
            'queryType': 'contextual_search',
            'batchSize': self.DEFAULT_BATCH_SIZE,
            'totalSearches': 0,
            'uniqueCitations': 0,
            'sourceTiersCovered': 0
        }
        
        success = self.table_client.create_query(
            query_id, query_text, display_title, 
            analysis_mode='contextual_search',
            metadata=metadata
        )
        
        if not success:
            raise Exception("Failed to create contextual search record")
        
        # Start background processing
        self.executor.submit(
            self._process_contextual_search_background, 
            query_id, query_text
        )
        
        return query_id
    
    def get_contextual_search_status(self, query_id: str) -> Optional[Dict]:
        """Get contextual search status and metadata."""
        query_data = self.table_client.get_query(query_id)
        if query_data and query_data.get('analysisMode') == 'contextual_search':
            return query_data
        return None
    
    def list_contextual_searches(self) -> List[Dict]:
        """List all contextual search queries."""
        return self.table_client.list_queries(query_type="contextual_search")
    
    def get_contextual_search_content(self, query_id: str, content_type: str) -> Optional[str]:
        """Get contextual search content from blob storage."""
        # Map content types to file names
        type_map = {
            'results': 'contextual_search_results.json',
            'citations': 'citations_summary.json',
            'tier_analysis': 'source_tier_analysis.json',
            'raw_data': 'raw_search_data.json'
        }
        
        filename = type_map.get(content_type)
        if not filename:
            return None
        
        return self.blob_client.download_report(query_id, filename)
    
    def delete_contextual_search(self, query_id: str) -> bool:
        """Delete a contextual search query and all its associated content."""
        try:
            # Get all search result files
            files = ['contextual_search_results.json', 'citations_summary.json', 
                    'source_tier_analysis.json', 'raw_search_data.json']
            
            # Delete from blob storage
            for file in files:
                self.blob_client.delete_report(query_id, file)
            
            # Delete from table storage
            return self.table_client.delete_query(query_id)
        except Exception as e:
            print(f"Error deleting contextual search {query_id}: {e}")
            return False
    
    def _process_contextual_search_background(self, query_id: str, query_text: str):
        """Background task to process contextual search query."""
        try:
            print(f"🚀 Starting contextual search processing for query {query_id}")
            
            # Initialize search agent with configured batch size
            search_agent = SimpleWebSearch(batch_size=self.DEFAULT_BATCH_SIZE)
            
            # Run contextual search
            search_results = search_agent.search(query_text)
            
            # Process and upload results
            processed_data = self._process_search_results(search_results)
            blob_urls = self._upload_search_outputs(query_id, processed_data)
            
            # Update query completion
            self._update_search_completion(query_id, blob_urls, search_results)
            
            print(f"✅ Contextual search {query_id} completed successfully")
            
        except Exception as e:
            print(f"❌ Error processing contextual search {query_id}: {e}")
            try:
                self.table_client.update_query_status(query_id, "failed", str(e))
            except Exception:
                pass
    
    def _process_search_results(self, search_results: Dict) -> Dict:
        """Process and organize search results into different content types."""
        citations = search_results.get('citations', [])
        
        # Main results summary
        results_summary = {
            'query': search_results.get('query'),
            'total_searches': search_results.get('total_searches', 0),
            'total_citations': search_results.get('total_citations', 0),
            'timestamp': search_results.get('timestamp'),
            'top_citations': citations[:20],  # Top 20 for summary
            'search_metadata': {
                'unique_sources': len(set(c.get('url', '') for c in citations)),
                'year_range': self._get_year_range(citations),
                'source_types': self._get_source_type_distribution(citations)
            }
        }
        
        # Source tier analysis
        tier_analysis = self._analyze_source_tiers(citations)
        
        # Citation database (all citations)
        citations_db = {
            'total_count': len(citations),
            'citations': citations,
            'by_year': self._group_citations_by_year(citations),
            'by_source_tier': self._group_citations_by_tier(citations)
        }
        
        return {
            'results': json.dumps(results_summary, indent=2),
            'tier_analysis': json.dumps(tier_analysis, indent=2),
            'citations': json.dumps(citations_db, indent=2),
            'raw_data': json.dumps(search_results, indent=2)
        }
    
    def _analyze_source_tiers(self, citations: List[Dict]) -> Dict:
        """Analyze source tier coverage and quality."""
        tier_counts = {}
        tier_quality = {}
        
        for citation in citations:
            tier = citation.get('source_tier', 'unknown')
            tier_counts[tier] = tier_counts.get(tier, 0) + 1
            
            # Track quality metrics per tier
            if tier not in tier_quality:
                tier_quality[tier] = {'total': 0, 'with_doi': 0, 'recent': 0}
            
            tier_quality[tier]['total'] += 1
            
            if citation.get('doi'):
                tier_quality[tier]['with_doi'] += 1
                
            try:
                year = int(citation.get('year', '0'))
                if year >= 2020:
                    tier_quality[tier]['recent'] += 1
            except:
                pass
        
        return {
            'tier_coverage': len(tier_counts),
            'tier_distribution': dict(sorted(tier_counts.items(), key=lambda x: x[1], reverse=True)),
            'tier_quality_metrics': tier_quality,
            'top_performing_tiers': sorted(
                tier_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:10]
        }
    
    def _get_year_range(self, citations: List[Dict]) -> Dict:
        """Get year range from citations."""
        years = []
        for citation in citations:
            try:
                year = int(citation.get('year', '0'))
                if year > 1990:  # Filter out invalid years
                    years.append(year)
            except:
                pass
        
        if years:
            return {
                'earliest': min(years),
                'latest': max(years),
                'span': max(years) - min(years) + 1
            }
        return {'earliest': None, 'latest': None, 'span': 0}
    
    def _get_source_type_distribution(self, citations: List[Dict]) -> Dict:
        """Get distribution of source types."""
        types = {}
        for citation in citations:
            source_type = citation.get('source_type', 'unknown')
            types[source_type] = types.get(source_type, 0) + 1
        
        return dict(sorted(types.items(), key=lambda x: x[1], reverse=True))
    
    def _group_citations_by_year(self, citations: List[Dict]) -> Dict:
        """Group citations by publication year."""
        by_year = {}
        for citation in citations:
            year = citation.get('year', 'unknown')
            if year not in by_year:
                by_year[year] = []
            by_year[year].append(citation)
        
        return dict(sorted(by_year.items(), reverse=True))
    
    def _group_citations_by_tier(self, citations: List[Dict]) -> Dict:
        """Group citations by source tier."""
        by_tier = {}
        for citation in citations:
            tier = citation.get('source_tier', 'unknown')
            if tier not in by_tier:
                by_tier[tier] = []
            by_tier[tier].append(citation)
        
        return dict(sorted(by_tier.items(), key=lambda x: len(x[1]), reverse=True))
    
    def _upload_search_outputs(self, query_id: str, processed_data: Dict[str, str]) -> List[Dict]:
        """Upload search outputs to blob storage."""
        blob_urls = []
        
        # Map internal names to storage names and display types
        name_map = {
            'results': ('contextual_search_results.json', 'results'),
            'citations': ('citations_summary.json', 'citations'),
            'tier_analysis': ('source_tier_analysis.json', 'analysis'),
            'raw_data': ('raw_search_data.json', 'raw')
        }
        
        for content_type, content in processed_data.items():
            if content_type not in name_map:
                continue
            
            storage_name, display_type = name_map[content_type]
            
            if not content:
                continue
            
            # Upload to blob storage
            blob_url = self.blob_client.upload_report(query_id, storage_name, content)
            
            if blob_url:
                blob_urls.append({
                    "type": display_type,
                    "filename": storage_name,
                    "url": blob_url
                })
        
        return blob_urls
    
    def _update_search_completion(self, query_id: str, blob_urls: List[Dict], search_results: Dict):
        """Update contextual search status to completed."""
        self.table_client.update_query_blob_urls(query_id, blob_urls)
        
        # Calculate completion time
        query = self.table_client.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(IST)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=IST)).total_seconds() / 60)
            
            # Extract stats from search results
            citations = search_results.get('citations', [])
            source_tiers = set(c.get('source_tier', 'unknown') for c in citations)
            
            # Update metadata
            self.table_client.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'totalSearches': search_results.get('total_searches', 0),
                'uniqueCitations': len(citations),
                'sourceTiersCovered': len(source_tiers),
                'citationsCount': len(citations)  # For compatibility with existing UI
            })
        
        self.table_client.update_query_status(query_id, "done")
    
    def _generate_display_title(self, query_text: str) -> str:
        """Generate a concise display title for contextual search."""
        try:
            client = openai.OpenAI(api_key=PolicyDrafterConfig.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a concise search title (5-7 words) for a contextual web search query."
                    },
                    {
                        "role": "user",
                        "content": f"Generate title for: {query_text}"
                    }
                ],
                temperature=0.3,
                max_tokens=40
            )
            
            title = response.choices[0].message.content.strip()
            if len(title.split()) > 7:
                title = ' '.join(title.split()[:7])
            
            return title
            
        except Exception:
            # Fallback to simple extraction
            words = query_text.replace(',', '').replace('.', '').split()[:6]
            return ' '.join(words) if words else query_text[:40]


# Global service instance
contextual_search_service = ContextualSearchService()
