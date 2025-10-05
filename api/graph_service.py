"""
Graph Service - Orchestrates systems evidence graph building
Strategy& PWC - SEGB Feature
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

# IST timezone
IST = timezone(timedelta(hours=5, minutes=30))

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

# Import config for API key
from policy_drafter.config import PolicyDrafterConfig

from graph_agent import GraphBuildingAgent
from azure_clients import AzureTableClient, AzureBlobClient


class GraphService:
    """Service layer for managing graph building lifecycle."""
    
    def __init__(self):
        self.table_client = AzureTableClient()
        self.blob_client = AzureBlobClient()
        self.executor = ThreadPoolExecutor(max_workers=2)
        
        # Start timeout monitoring thread
        # No timeout monitoring needed
    
    def submit_graph_query(self, query_text: str, geography: str ,
                           time_range: str, 
                           intervention: Optional[str] = None) -> str:
        """Submit a new graph building query."""
        query_id = str(uuid.uuid4())
        
        # Generate display title
        title_parts = [query_text, geography, time_range]
        if intervention:
            title_parts.append(intervention)
        display_title = self._generate_display_title(" ".join(title_parts))
        
        # Create record in table storage with type 'graph'
        metadata = {
            'queryType': 'graph',
            'geography': geography,
            'timeRange': time_range,
            'intervention': intervention or ''
        }
        
        success = self.table_client.create_query(
            query_id, query_text, display_title, 
            analysis_mode='graph',  # Use analysis_mode to distinguish
            metadata=metadata
        )
        
        if not success:
            raise Exception("Failed to create graph query record")
        
        # Start background processing
        self.executor.submit(
            self._process_graph_background, 
            query_id, query_text, geography, time_range, intervention
        )
        
        return query_id
    
    def get_graph_status(self, query_id: str) -> Optional[Dict]:
        """Get graph query status and metadata."""
        query_data = self.table_client.get_query(query_id)
        if query_data and query_data.get('analysisMode') == 'graph':
            return query_data
        return None
    
    def list_graph_queries(self) -> List[Dict]:
        """List all graph queries."""
        return self.table_client.list_queries(query_type="graph")
    
    def get_graph_content(self, query_id: str, content_type: str) -> Optional[str]:
        """Get graph content from blob storage."""
        # Map content types to file names
        type_map = {
            'interactive': 'graph_interactive.html',
            'json': 'graph_data.json',
            'csv': 'graph_tables.csv',
            'executive': 'executive_summary.md',
            'full': 'full_analysis.md'
        }
        
        filename = type_map.get(content_type)
        if not filename:
            return None
        
        return self.blob_client.download_report(query_id, filename)
    
    def delete_graph_query(self, query_id: str) -> bool:
        """Delete a graph query and all its associated content."""
        try:
            # Get all graph files
            files = ['graph_interactive.html', 'graph_data.json', 'graph_tables.csv', 
                    'executive_summary.md', 'full_analysis.md']
            
            # Delete from blob storage
            for file in files:
                self.blob_client.delete_report(query_id, file)
            
            # Delete from table storage
            return self.table_client.delete_query(query_id)
        except Exception as e:
            print(f"Error deleting graph query {query_id}: {e}")
            return False
    
    
    def _process_graph_background(self, query_id: str, query_text: str,
                                 geography: str, time_range: str, 
                                 intervention: Optional[str]):
        """Background task to process graph query."""
        try:
            print(f"🚀 Starting graph processing for query {query_id}")
            
            graph_agent = GraphBuildingAgent()
            
            # Run graph pipeline
            output_paths = graph_agent.run_graph_pipeline(
                query_text, geography, time_range, intervention
            )
            
            # Upload outputs to blob storage
            blob_urls = self._upload_graph_outputs(query_id, output_paths)
            
            # Update query completion
            self._update_graph_completion(query_id, blob_urls)
            
            print(f"✅ Graph query {query_id} completed successfully")
            
        except Exception as e:
            print(f"❌ Error processing graph query {query_id}: {e}")
            try:
                self.table_client.update_query_status(query_id, "failed", str(e))
            except Exception:
                pass
    
    def _upload_graph_outputs(self, query_id: str, output_paths: Dict[str, str]) -> List[Dict]:
        """Upload graph outputs to blob storage."""
        blob_urls = []
        
        # Map internal names to storage names
        name_map = {
            'interactive_html': ('graph_interactive.html', 'interactive'),
            'graph_json': ('graph_data.json', 'data'),
            'csv_data': ('graph_tables.csv', 'tables'),
            'executive_summary': ('executive_summary.md', 'executive'),
            'full_analysis': ('full_analysis.md', 'analysis')
        }
        
        for output_type, file_path in output_paths.items():
            if output_type not in name_map:
                continue
            
            storage_name, display_type = name_map[output_type]
            
            # Read file content
            file_obj = Path(file_path)
            if not file_obj.exists() or file_obj.stat().st_size == 0:
                continue
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
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
    
    def _update_graph_completion(self, query_id: str, blob_urls: List[Dict]):
        """Update graph query status to completed."""
        self.table_client.update_query_blob_urls(query_id, blob_urls)
        
        # Calculate completion time
        query = self.table_client.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(IST)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=IST)).total_seconds() / 60)
            
            # Count nodes and edges from JSON if available
            stats = self._extract_graph_stats(query_id)
            
            # Update metadata
            self.table_client.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'nodeCount': stats.get('nodes', 0),
                'edgeCount': stats.get('edges', 0)
            })
        
        self.table_client.update_query_status(query_id, "done")
    
    def _extract_graph_stats(self, query_id: str) -> Dict:
        """Extract statistics from graph JSON."""
        try:
            import json
            json_content = self.get_graph_content(query_id, 'json')
            if json_content:
                data = json.loads(json_content)
                return {
                    'nodes': len(data.get('nodes', [])),
                    'edges': len(data.get('edges', []))
                }
        except Exception:
            pass
        return {'nodes': 0, 'edges': 0}
    
    def _generate_display_title(self, query_text: str) -> str:
        """Generate a concise display title for graph query."""
        try:
            client = openai.OpenAI(api_key=PolicyDrafterConfig.OPENAI_API_KEY)
            
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a concise title (5-7 words) for a systems evidence graph query."
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
graph_service = GraphService()
