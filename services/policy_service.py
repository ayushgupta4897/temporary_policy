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

# Add project root to path so policy_drafter module can be found
sys.path.append(str(Path(__file__).parent.parent))

from agents.policy_drafter.agent import PolicyDraftingAgent
from agents.policy_drafter.policy_presentation_agent import PolicyPresentationAgent
from agents.policy_drafter.prompts import PolicyPrompts
from agents.chart_analytics_agent import extract_chart_data
from config.app_config import PolicyDrafterConfig
from repositories.policy_repository import PolicyRepository
import openai
import os
import json

# ============================================================================
# CONSTANTS
# ============================================================================

# Timezone
IST = timezone(timedelta(hours=5, minutes=30))

# Production backend URL for syncing reports
# Load from environment variable, fallback to container app name discovery
PRODUCTION_BACKEND_URL = os.environ.get("BACKEND_URL", "")

# Thread pool configuration
MAX_WORKERS = 2

# Timeout configuration (in minutes)
QUERY_TIMEOUT_MINUTES = 180
MONITOR_CHECK_INTERVAL_SECONDS = 300  # 5 minutes
STUCK_QUERY_CHECK_CYCLES = 6  # Every 6 cycles (30 minutes)

# HTTP request timeout (in seconds)
PRODUCTION_FETCH_TIMEOUT_SECONDS = 30

# Report requirements
MINIMUM_REPORTS_COUNT = 3
CORE_REPORTS = {'executive_summary.md', 'policy_report.md', 'research_report.md'}

# Analysis modes
ANALYSIS_MODE_FULL = "full"
ANALYSIS_MODE_RESEARCH_ONLY = "research_only"

# Query types
QUERY_TYPE_POLICY = "policy"

# Query statuses
STATUS_PROCESSING = "processing"
STATUS_FAILED = "failed"
STATUS_DONE = "done"

# ============================================================================


class PolicyService:
    """Service layer for managing policy drafting lifecycle."""

    def __init__(self, repository: PolicyRepository = None):
        self.repository = repository or PolicyRepository()
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

        # Start timeout monitoring thread
        self.timeout_monitor_thread = threading.Thread(target=self._monitor_timeouts, daemon=True)
        self.timeout_monitor_thread.start()
    
    def submit_query(self, query_text: str, analysis_mode: str = "full") -> str:
        """Submit a new policy query and return query ID."""
        query_id = str(uuid.uuid4())

        # Generate display title using GPT-4o
        display_title = self._generate_display_title(query_text)

        # Create record in table storage with display title and analysis mode
        success = self.repository.create_query(query_id, query_text, display_title, analysis_mode)
        if not success:
            raise Exception("Failed to create query record")

        # Start background processing with analysis mode
        self.executor.submit(self._process_query_background, query_id, query_text, analysis_mode)

        return query_id

    def get_query_status(self, query_id: str) -> Optional[Dict]:
        """Get query status and metadata."""
        return self.repository.get_query(query_id)

    def list_queries(self) -> List[Dict]:
        """List all policy queries (filtered to exclude graph queries)."""
        return self.repository.list_queries(query_type=QUERY_TYPE_POLICY)

    def _monitor_timeouts(self):
        """Monitor policy queries for timeout and mark them as failed."""
        cycles = 0
        while True:
            try:
                current_time = datetime.now(IST)
                # Only monitor policy queries, not graph queries
                for query in self.list_queries():
                    if query.get('status') == STATUS_PROCESSING:
                        self._check_query_timeout(query, current_time)

                cycles += 1
                if cycles % STUCK_QUERY_CHECK_CYCLES == 0:
                    self.fix_stuck_queries()

            except Exception as e:
                print(f"Error in timeout monitor: {e}")

            time.sleep(MONITOR_CHECK_INTERVAL_SECONDS)
    
    def _check_query_timeout(self, query: Dict, current_time: datetime):
        """Check if a single query has timed out."""
        try:
            created_at = datetime.fromisoformat(query['createdAt'])
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc).astimezone(IST)

            elapsed_minutes = (current_time - created_at).total_seconds() / 60
            if elapsed_minutes > QUERY_TIMEOUT_MINUTES:
                self.repository.update_query_status(
                    query['queryId'],
                    STATUS_FAILED,
                    f"Query processing timed out after {elapsed_minutes:.1f} minutes."
                )
        except (ValueError, KeyError):
            pass
    
    def get_report_content(self, query_id: str, report_name: str) -> Optional[str]:
        """Get report content from blob storage with production fallback."""
        # Try Azure blob storage first
        content = self.repository.download_report(query_id, report_name)
        
        # If content not found, try production as fallback
        if content is None or content == '':
            content = self._fetch_from_production(query_id, report_name)
        
        # Return None if content is empty string
        return content if content else None
    
    def _fetch_from_production(self, query_id: str, report_name: str) -> Optional[str]:
        """Fetch report content from production backend."""
        # Only try production fallback if PRODUCTION_BACKEND_URL is configured
        if not PRODUCTION_BACKEND_URL:
            return None

        try:
            response = requests.get(
                f"{PRODUCTION_BACKEND_URL}/queries/{query_id}/reports/{report_name}",
                timeout=PRODUCTION_FETCH_TIMEOUT_SECONDS
            )
            if response.status_code == 200:
                return response.json().get('content', '')
        except Exception:
            pass
        return None
    


    def list_reports(self, query_id: str) -> List[str]:
        """List all reports for a query."""
        return self.repository.list_reports(query_id)

    def delete_query(self, query_id: str) -> bool:
        """Delete a query and all its associated reports."""
        try:
            # Delete all reports from blob storage
            reports = self.list_reports(query_id)
            for report in reports:
                self.repository.delete_report(query_id, report)

            # Delete query from table storage
            return self.repository.delete_query(query_id)
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

            self.repository.update_query_blob_urls(query_id, blob_urls)
            self.repository.update_query_status(query_id, STATUS_DONE)

    def _should_sync_reports(self, status: str, local_reports: List[str]) -> bool:
        """Check if reports should be synced from production."""
        return (status == STATUS_DONE and len(local_reports) == 0) or status in [STATUS_PROCESSING, STATUS_FAILED]

    def _has_sufficient_reports(self, reports: List[str]) -> bool:
        """Check if query has sufficient reports to mark as complete."""
        return len(reports) >= MINIMUM_REPORTS_COUNT and any(report in CORE_REPORTS for report in reports)
    
    def _process_query_background(self, query_id: str, query_text: str, analysis_mode: str = ANALYSIS_MODE_FULL):
        """Background task to process policy query."""
        try:
            policy_agent = PolicyDraftingAgent()

            if analysis_mode == ANALYSIS_MODE_RESEARCH_ONLY:
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
                self.repository.update_query_status(query_id, STATUS_FAILED, str(e))
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
            blob_url = self.repository.upload_report(query_id, report_filename, content)
            
            if blob_url:
                blob_urls.append({"type": normalized_type, "filename": report_filename, "url": blob_url})
        
        return blob_urls
    
    def _normalize_report_name(self, report_type: str) -> tuple[str, str]:
        """Normalize report filename and type."""
        # Map from internal report keys to standardized filenames expected by chat service
        filename_map = {
            # Core policy reports
            'research_report': ('research_report.md', 'research_report'),
            'policy_report': ('policy_report.md', 'policy_report'),
            'simulation_report': ('simulation_report.md', 'simulation_report'),
            'analytics_report': ('analytics_report.md', 'analytics_report'),
            # Presentation documents
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
        self.repository.update_query_blob_urls(query_id, blob_urls)

        # Calculate completion time
        query = self.repository.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(IST)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=IST)).total_seconds() / 60)
            
            # Extract citations count from research report
            citations_count = self._extract_citations_count(query_id)
            
            # Update with additional metadata
            self.repository.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'citationsCount': citations_count
            })

        self.repository.update_query_status(query_id, STATUS_DONE)
    
    def _extract_citations_count(self, query_id: str) -> int:
        """Extract the number of citations from the research report."""
        try:
            # Try to read the research report
            content = self.get_report_content(query_id, 'research_report.md')
            if content:
                # Count citations using numbered references like [1], [2], etc.
                # These represent the actual citation count in deep research reports
                import re

                reference_numbers = re.findall(r'\[(\d+)\]', content)
                if reference_numbers:
                    # Get the highest reference number as it represents total citations
                    max_ref_number = max(int(num) for num in reference_numbers)
                    return max_ref_number

                # Fallback: If no numbered references, count unique markdown citation links
                # Only count markdown links to avoid double-counting URLs
                markdown_links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
                unique_citation_urls = set()
                for _, url in markdown_links:
                    if url and url.startswith(('http://', 'https://')):
                        unique_citation_urls.add(url)

                return len(unique_citation_urls) if unique_citation_urls else 0

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

    def generate_visualization(self, query_id: str, force_regenerate: bool = False) -> Optional[Dict]:
        """
        Generate or retrieve visualization data for a query.

        Args:
            query_id: The query ID
            force_regenerate: If True, regenerate even if cached data exists

        Returns:
            Dict with 'data' (visualization JSON) and 'cached' (bool) keys, or None if failed
        """
        try:
            visualization_filename = "chart_data.json"

            # Check if cached visualization exists
            if not force_regenerate:
                cached_data = self.repository.download_report(query_id, visualization_filename)
                if cached_data:
                    print(f"✅ Using cached visualization data for query {query_id}")
                    try:
                        return {
                            "data": json.loads(cached_data),
                            "cached": True
                        }
                    except json.JSONDecodeError:
                        print(f"⚠️  Cached visualization data is corrupted, regenerating...")

            # Generate new visualization data
            print(f"📊 Generating new visualization data for query {query_id}...")

            # Get analytics report content
            analytics_content = self.get_report_content(query_id, "analytics_report.md")
            if not analytics_content:
                print(f"❌ Analytics report not found for query {query_id}")
                return None

            # Extract chart data using LLM
            chart_data = extract_chart_data(analytics_content)

            # Cache the result
            chart_data_json = json.dumps(chart_data, indent=2)
            blob_url = self.repository.upload_report(query_id, visualization_filename, chart_data_json)

            if blob_url:
                print(f"✅ Visualization data cached for query {query_id}")
            else:
                print(f"⚠️  Failed to cache visualization data for query {query_id}")

            return {
                "data": chart_data,
                "cached": False
            }

        except Exception as e:
            print(f"❌ Error generating visualization for query {query_id}: {e}")
            return None

    def has_cached_visualization(self, query_id: str) -> bool:
        """
        Check if cached visualization data exists for a query.

        Args:
            query_id: The query ID

        Returns:
            True if cached visualization exists, False otherwise
        """
        try:
            visualization_filename = "chart_data.json"
            cached_data = self.repository.download_report(query_id, visualization_filename)
            return cached_data is not None and len(cached_data) > 0
        except Exception:
            return False


# Global service instance
policy_service = PolicyService()
