"""
Policy Service - Orchestrates policy drafting with Azure storage
Strategy& PWC - AI Policy Drafter UI
"""

import uuid
import asyncio
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import threading
import time
import requests

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Production backend URL for syncing reports
PRODUCTION_BACKEND_URL = "https://ca-policy-backend.whitestone-31d90b86.eastus.azurecontainerapps.io"

# Add project root to path so policy_drafter module can be found
sys.path.append(str(Path(__file__).parent.parent))

from policy_drafter.policy_agent import PolicyDraftingAgent
from policy_drafter.policy_presentation_agent import PolicyPresentationAgent
from policy_drafter.prompts import PolicyPrompts
from policy_drafter.config import PolicyDrafterConfig
from azure_clients import AzureTableClient, AzureBlobClient
import openai
import os


class PolicyService:
    """Service layer for managing policy drafting lifecycle."""
    
    def __init__(self):
        self.table_client = AzureTableClient()
        self.blob_client = AzureBlobClient()
        self.executor = ThreadPoolExecutor(max_workers=2)
        
        # Start timeout monitoring thread
        self.timeout_monitor_thread = threading.Thread(target=self._monitor_timeouts, daemon=True)
        self.timeout_monitor_thread.start()
    
    def submit_query(self, query_text: str, analysis_mode: str = "full") -> str:
        """Submit a new policy query and return query ID."""
        query_id = str(uuid.uuid4())
        
        # Generate display title using GPT-4o
        display_title = self._generate_display_title(query_text)
        
        # Create record in table storage with display title and analysis mode
        success = self.table_client.create_query(query_id, query_text, display_title, analysis_mode)
        if not success:
            raise Exception("Failed to create query record")
        
        # Start background processing with analysis mode
        self.executor.submit(self._process_query_background, query_id, query_text, analysis_mode)
        
        return query_id
    
    def get_query_status(self, query_id: str) -> Optional[Dict]:
        """Get query status and metadata."""
        return self.table_client.get_query(query_id)
    
    def list_queries(self) -> List[Dict]:
        """List all policy queries (filtered to exclude graph queries)."""
        return self.table_client.list_queries(query_type="policy")
    
    def _monitor_timeouts(self):
        """Monitor policy queries for timeout (60 minutes) and mark them as failed."""
        cycles = 0
        while True:
            try:
                current_time = datetime.now(IST)
                # Only monitor policy queries, not graph queries
                for query in self.list_queries():
                    if query.get('status') == 'processing':
                        self._check_query_timeout(query, current_time)
                
                cycles += 1
                if cycles % 6 == 0:  # Every 30 minutes
                    self.fix_stuck_queries()
                    
            except Exception as e:
                print(f"Error in timeout monitor: {e}")
            
            time.sleep(300)  # 5 minutes
    
    def _check_query_timeout(self, query: Dict, current_time: datetime):
        """Check if a single query has timed out."""
        try:
            created_at = datetime.fromisoformat(query['createdAt'])
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc).astimezone(IST)
            
            elapsed_minutes = (current_time - created_at).total_seconds() / 60
            if elapsed_minutes > 180:
                self.table_client.update_query_status(
                    query['queryId'], 
                    "failed", 
                    f"Query processing timed out after {elapsed_minutes:.1f} minutes."
                )
        except (ValueError, KeyError):
            pass
    
    def get_report_content(self, query_id: str, report_name: str) -> Optional[str]:
        """Get report content from blob storage with production fallback."""
        # Try Azure blob storage first
        content = self.blob_client.download_report(query_id, report_name)
        
        # If content not found, try production as fallback
        if content is None or content == '':
            content = self._fetch_from_production(query_id, report_name)
        
        # Return None if content is empty string
        return content if content else None
    
    def _fetch_from_production(self, query_id: str, report_name: str) -> Optional[str]:
        """Fetch report content from production backend."""
        try:
            response = requests.get(f"{PRODUCTION_BACKEND_URL}/queries/{query_id}/reports/{report_name}", timeout=30)
            if response.status_code == 200:
                return response.json().get('content', '')
        except Exception:
            pass
        return None
    

    
    def list_reports(self, query_id: str) -> List[str]:
        """List all reports for a query."""
        return self.blob_client.list_reports(query_id)
    
    def delete_query(self, query_id: str) -> bool:
        """Delete a query and all its associated reports."""
        try:
            # Delete all reports from blob storage
            reports = self.list_reports(query_id)
            for report in reports:
                self.blob_client.delete_report(query_id, report)
            
            # Delete query from table storage
            return self.table_client.delete_query(query_id)
        except Exception as e:
            print(f"Error deleting query {query_id}: {e}")
            return False
    
    def sync_reports_from_production(self, query_id: str) -> List[str]:
        """Sync reports from production backend (no longer needed with Azure storage)."""
        # With Azure storage, production fallback is handled in get_report_content()
        # This function is maintained for API compatibility but returns empty list
        return []

    def fix_stuck_queries(self):
        """Find and fix policy queries that are stuck but have available reports."""
        try:
            # Only fix policy queries, not graph queries
            for query in self.list_queries():
                if query.get('status') in ['processing', 'failed', 'done']:
                    self._fix_single_query(query)
        except Exception as e:
            print(f"Error checking for stuck policy queries: {e}")
    
    def _fix_single_query(self, query: Dict):
        """Fix a single stuck query if it has available reports."""
        query_id = query['queryId']
        status = query.get('status')
        
        # Sync reports if needed
        local_reports = self.list_reports(query_id)
        if self._should_sync_reports(status, local_reports):
            self.sync_reports_from_production(query_id)
            local_reports = self.list_reports(query_id)
        
        # Fix status if reports are available
        if self._has_sufficient_reports(local_reports):
            blob_urls = [{"type": name.replace('.md', ''), "filename": name, 
                         "url": f"/queries/{query_id}/reports/{name}"} for name in local_reports]
            
            self.table_client.update_query_blob_urls(query_id, blob_urls)
            self.table_client.update_query_status(query_id, "done")
    
    def _should_sync_reports(self, status: str, local_reports: List[str]) -> bool:
        """Check if reports should be synced from production."""
        return (status == 'done' and len(local_reports) == 0) or status in ['processing', 'failed']
    
    def _has_sufficient_reports(self, reports: List[str]) -> bool:
        """Check if query has sufficient reports to mark as complete."""
        core_reports = {'executive_summary.md', 'policy_report.md', 'research_report.md'}
        return len(reports) >= 3 and any(report in core_reports for report in reports)
    
    def _process_query_background(self, query_id: str, query_text: str, analysis_mode: str = "full"):
        """Background task to process policy query."""
        try:
            policy_agent = PolicyDraftingAgent()
            
            if analysis_mode == "research_only":
                # Run only elaboration + deep research (steps 1-2)
                report_paths = policy_agent.run_research_pipeline(query_text)
            else:
                # Run complete pipeline (all steps)
                report_paths = policy_agent.run_complete_pipeline(query_text)
                
                # Generate presentation documents for full analysis
                elaboration = policy_agent.elaborate_query(query_text)
                timestamp = self._extract_timestamp_from_path(report_paths['research_report'])
                
                presentation_agent = PolicyPresentationAgent()
                presentation_paths = presentation_agent.generate_presentation_suite(timestamp, query_text, elaboration)
                report_paths.update(presentation_paths)
            
            # Upload reports and update status
            blob_urls = self._upload_reports(query_id, report_paths)
            self._update_query_completion(query_id, blob_urls)
            
        except Exception as e:
            print(f"❌ Error processing query {query_id}: {e}")
            try:
                self.table_client.update_query_status(query_id, "failed", str(e))
            except Exception:
                pass
    
    def _upload_reports(self, query_id: str, all_reports: Dict[str, str]) -> List[Dict]:
        """Upload all reports and return blob URLs."""
        blob_urls = []
        
        for report_type, file_path in all_reports.items():
            # Check if file exists and has content
            from pathlib import Path
            file_obj = Path(file_path)
            if not file_obj.exists():
                print(f"  ⚠️  Skipping non-existent file: {report_type}")
                continue
                
            file_size = file_obj.stat().st_size
            if file_size == 0:
                print(f"  ⚠️  Skipping empty file: {report_type}")
                continue  # DON'T upload empty files
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Double check content isn't empty
            if not content or len(content) == 0:
                print(f"  ⚠️  Skipping empty content: {report_type}")
                continue
            
            report_filename, normalized_type = self._normalize_report_name(report_type)
            blob_url = self.blob_client.upload_report(query_id, report_filename, content)
            
            if blob_url:
                blob_urls.append({"type": normalized_type, "filename": report_filename, "url": blob_url})
        
        return blob_urls
    
    def _normalize_report_name(self, report_type: str) -> tuple[str, str]:
        """Normalize report filename and type."""
        # The presentation agent returns keys like 'executive_summary', 'strategy_brief', 'policy_dossier'
        # NOT 'executive_summary_presentation' etc.
        filename_map = {
            'executive_summary': ('executive_summary.md', 'executive_summary'),
            'strategy_brief': ('strategy_brief.md', 'strategy_brief'), 
            'policy_dossier': ('policy_dossier.md', 'policy_dossier'),
            # Keep old mappings for backwards compatibility
            'executive_summary_presentation': ('executive_summary.md', 'executive_summary'),
            'strategy_brief_presentation': ('strategy_brief.md', 'strategy_brief'),
            'full_policy_dossier_presentation': ('policy_dossier.md', 'policy_dossier')
        }
        
        if report_type in filename_map:
            return filename_map[report_type]
        return f"{report_type}.md", report_type
    
    def _update_query_completion(self, query_id: str, blob_urls: List[Dict]):
        """Update query status to completed with blob URLs."""
        self.table_client.update_query_blob_urls(query_id, blob_urls)
        
        # Calculate completion time
        query = self.table_client.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(IST)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=IST)).total_seconds() / 60)
            
            # Extract citations count from research report
            citations_count = self._extract_citations_count(query_id)
            
            # Update with additional metadata
            self.table_client.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'citationsCount': citations_count
            })
        
        self.table_client.update_query_status(query_id, "done")
    
    def _extract_citations_count(self, query_id: str) -> int:
        """Extract the number of citations from the research report."""
        try:
            # Try to read the research report
            content = self.get_report_content(query_id, 'research_report.md')
            if content:
                # Count citations/sources (look for URLs, references, etc.)
                import re
                
                # Collect all unique URLs (both markdown links and plain URLs)
                unique_urls = set()
                
                # Extract URLs from markdown links [text](url)
                markdown_links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
                for _, url in markdown_links:
                    if url and url.startswith(('http://', 'https://')):
                        unique_urls.add(url)
                
                # Extract plain URLs
                plain_urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', content)
                unique_urls.update(plain_urls)
                
                # Count numbered references like [1], [2], etc. 
                # These often represent unique citations at the end of documents
                reference_numbers = re.findall(r'\[(\d+)\]', content)
                max_ref_number = 0
                if reference_numbers:
                    # Get the highest reference number as it represents total citations
                    max_ref_number = max(int(num) for num in reference_numbers)
                
                # Use the maximum of unique URLs count or highest reference number
                # This handles both inline citations and numbered reference lists
                total_citations = max(len(unique_urls), max_ref_number)
                
                return total_citations  # Return actual count without any cap
        except Exception as e:
            print(f"Error extracting citations count: {e}")
        
        # Return 0 if extraction fails - will show as "--" in UI
        return 0
    
    def _generate_display_title(self, query_text: str) -> str:
        """Generate a concise display title using GPT-4o."""
        try:
            # Initialize OpenAI client using config
            openai.api_key = PolicyDrafterConfig.OPENAI_API_KEY
            client = openai.OpenAI(api_key=PolicyDrafterConfig.OPENAI_API_KEY)
            
            # Generate title using GPT-4o for cost effectiveness with flag emojis
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a senior policy analyst who generates concise policy titles with appropriate country flag emoji prefixes. Follow the instructions precisely."
                    },
                    {
                        "role": "user", 
                        "content": PolicyPrompts.QUERY_TITLE_GENERATION_PROMPT.format(query_text=query_text)
                    }
                ],
                temperature=0.3,
                max_tokens=80  # Increased to accommodate flag emojis
            )
            
            title = response.choices[0].message.content.strip()
            # Ensure title is not too long (fallback to truncation)
            if len(title.split()) > 7:
                title = ' '.join(title.split()[:7])
            
            return title
            
        except Exception as e:
            print(f"Error generating display title: {e}")
            # Fallback to simple extraction from query
            words = query_text.replace(',', '').replace('.', '').split()
            # Filter out common words and take first 6-7 meaningful words
            stop_words = {'a', 'an', 'the', 'for', 'to', 'on', 'in', 'with', 'and', 'or', 'of', 'develop', 'create', 'policy', 'design'}
            meaningful_words = [w for w in words if w.lower() not in stop_words][:7]
            return ' '.join(meaningful_words) if meaningful_words else query_text[:50]
    
    def _extract_timestamp_from_path(self, file_path: str) -> str:
        """Extract timestamp from file path."""
        # Extract timestamp from filename like "deep_research_report_20250811_144114.md"
        filename = Path(file_path).stem
        parts = filename.split('_')
        
        if len(parts) >= 2:
            # Look for timestamp pattern (YYYYMMDD_HHMMSS)
            for i, part in enumerate(parts):
                if len(part) == 8 and part.isdigit():  # Date part
                    if i + 1 < len(parts) and len(parts[i + 1]) == 6 and parts[i + 1].isdigit():  # Time part
                        return f"{part}_{parts[i + 1]}"
        
        # Fallback - generate current timestamp in IST
        return datetime.now(IST).strftime("%Y%m%d_%H%M%S")


# Global service instance
policy_service = PolicyService()
