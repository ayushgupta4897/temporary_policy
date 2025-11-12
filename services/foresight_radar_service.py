"""
Foresight Radar Service - Orchestrates foresight radar analysis operations
Strategy& PWC - Foresight Radar Component
"""

import uuid
from pathlib import Path
import sys
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta
import threading
import time
import os
import json

# Add project root to path
sys.path.append(str(Path(__file__).parent.parent))

# Import config and OpenAI client
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client

# Import foresight radar agent
from agents.foresight_radar.agent import ForesightRadarAgent
from repositories.foresight_radar_repository import ForesightRadarRepository

# ============================================================================
# CONSTANTS
# ============================================================================

# Timezone
IST = timezone(timedelta(hours=5, minutes=30))

# Thread pool configuration
DEFAULT_BATCH_SIZE = 10
MAX_CONCURRENT_ANALYSES = 2

# Query types
QUERY_TYPE_FORESIGHT_RADAR = "foresight_radar"
ANALYSIS_MODE_FORESIGHT_RADAR = "foresight_radar"

# Query statuses
STATUS_PROCESSING = "processing"
STATUS_FAILED = "failed"
STATUS_DONE = "done"

# OpenAI configuration
OPENAI_MODEL = "gpt-4o"
OPENAI_TEMPERATURE = 0.3
OPENAI_MAX_TOKENS = 40
TITLE_MAX_WORDS = 7

# ============================================================================


class ForesightRadarService:
    """Service layer for managing foresight radar lifecycle."""

    def __init__(self, repository: ForesightRadarRepository = None):
        self.repository = repository or ForesightRadarRepository()
        self.executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_ANALYSES)
        # Use centralized OpenAI client for title generation
        self.openai_manager = get_openai_client()

    def submit_foresight_radar(self, query_text: str) -> str:
        """Submit a new foresight radar query."""
        query_id = str(uuid.uuid4())

        # Generate display title
        display_title = self._generate_display_title(query_text)

        # Create record in table storage with type 'foresight_radar'
        metadata = {
            'queryType': QUERY_TYPE_FORESIGHT_RADAR,
            'batchSize': DEFAULT_BATCH_SIZE,
            'totalSearches': 0,
            'uniqueCitations': 0,
            'signalsCount': 0,
            'scenariosCount': 0,
            'watchlistCount': 0
        }

        success = self.repository.create_query(
            query_id, query_text, display_title,
            analysis_mode=ANALYSIS_MODE_FORESIGHT_RADAR,
            metadata=metadata
        )

        if not success:
            raise Exception("Failed to create foresight radar record")

        # Start background processing
        self.executor.submit(
            self._process_foresight_radar_background,
            query_id, query_text
        )

        return query_id

    def get_foresight_radar_status(self, query_id: str) -> Optional[Dict]:
        """Get foresight radar status and metadata."""
        query_data = self.repository.get_query(query_id)
        if query_data and query_data.get('analysisMode') == ANALYSIS_MODE_FORESIGHT_RADAR:
            return query_data
        return None

    def list_foresight_radars(self) -> List[Dict]:
        """List all foresight radar queries."""
        return self.repository.list_queries(query_type=QUERY_TYPE_FORESIGHT_RADAR)

    def get_foresight_radar_content(self, query_id: str, content_type: str) -> Optional[str]:
        """Get foresight radar content from blob storage."""
        # Map content types to file names
        type_map = {
            'radar_json': 'foresight_radar.json',
            'brief': 'foresight_radar_brief.md',
            'citations': 'citations_database.json',
            'signals': 'signals_analysis.json',
            'scenarios': 'scenarios_analysis.json',
            'watchlist': 'monitoring_watchlist.json'
        }

        filename = type_map.get(content_type)
        if not filename:
            return None

        return self.repository.download_report(query_id, filename)

    def delete_foresight_radar(self, query_id: str) -> bool:
        """Delete a foresight radar query and all its associated content."""
        # Get all foresight radar result files
        files = [
            'foresight_radar.json',
            'foresight_radar_brief.md',
            'citations_database.json',
            'signals_analysis.json',
            'scenarios_analysis.json',
            'monitoring_watchlist.json'
        ]

        # Delete from blob storage
        for file in files:
            self.repository.delete_report(query_id, file)

        # Delete from table storage
        return self.repository.delete_query(query_id)

    def _process_foresight_radar_background(self, query_id: str, query_text: str):
        """Background task to process foresight radar query."""
        try:
            print(f"🔮 Starting foresight radar processing for query {query_id}")

            # Initialize radar agent with configured batch size
            radar_agent = ForesightRadarAgent(batch_size=self.DEFAULT_BATCH_SIZE)

            # Run foresight radar analysis
            radar_results = radar_agent.analyze(query_text)

            # Process and upload results
            processed_data = self._process_radar_results(radar_results)
            blob_urls = self._upload_radar_outputs(query_id, processed_data)

            # Update query completion
            self._update_radar_completion(query_id, blob_urls, radar_results)

            print(f"✅ Foresight radar {query_id} completed successfully")

        except Exception as e:
            print(f"❌ Error processing foresight radar {query_id}: {e}")
            import traceback
            traceback.print_exc()
            try:
                self.repository.update_query_status(query_id, STATUS_FAILED, str(e))
            except Exception:
                pass

    def _process_radar_results(self, radar_results: Dict) -> Dict:
        """Process and organize radar results into different content types."""
        radar_json = radar_results.get('radar_json', {})
        citations = radar_results.get('citations', [])

        # Main radar JSON (complete structured output)
        full_radar_json = json.dumps(radar_results, indent=2, ensure_ascii=False)

        # Brief markdown
        brief_markdown = radar_results.get('brief_markdown', '')

        # Citations database
        citations_db = {
            'total_count': len(citations),
            'citations': citations,
            'by_source_tier': self._group_by_source_tier(citations),
            'by_steep_g': self._group_by_steep_g(citations)
        }

        # Signals analysis (sorted by priority)
        signals_data = {
            'total_signals': len(radar_json.get('radar_items', [])),
            'signals': radar_json.get('radar_items', []),
            'by_ring': self._group_signals_by_ring(radar_json.get('radar_items', [])),
            'by_quadrant': self._group_signals_by_quadrant(radar_json.get('radar_items', [])),
            'keystone_drivers': radar_json.get('keystone_drivers', []),
            'fragility_points': radar_json.get('fragility_points', [])
        }

        # Scenarios analysis
        scenarios_data = {
            'total_scenarios': len(radar_json.get('scenarios', [])),
            'scenarios': radar_json.get('scenarios', []),
            'cross_impact': radar_json.get('cross_impact', [])
        }

        # Watchlist (monitoring framework)
        watchlist_data = {
            'total_indicators': len(radar_json.get('watchlist', [])),
            'watchlist': radar_json.get('watchlist', []),
            'scope': radar_json.get('scope', {})
        }

        return {
            'radar_json': full_radar_json,
            'brief': brief_markdown,
            'citations': json.dumps(citations_db, indent=2, ensure_ascii=False),
            'signals': json.dumps(signals_data, indent=2, ensure_ascii=False),
            'scenarios': json.dumps(scenarios_data, indent=2, ensure_ascii=False),
            'watchlist': json.dumps(watchlist_data, indent=2, ensure_ascii=False)
        }

    def _group_by_source_tier(self, citations: List[Dict]) -> Dict:
        """Group citations by source tier."""
        by_tier = {}
        for citation in citations:
            tier = citation.get('source_tier', 'unknown')
            if tier not in by_tier:
                by_tier[tier] = []
            by_tier[tier].append(citation)

        return dict(sorted(by_tier.items(), key=lambda x: len(x[1]), reverse=True))

    def _group_by_steep_g(self, citations: List[Dict]) -> Dict:
        """Group citations by STEEP-G quadrant."""
        by_quadrant = {}
        for citation in citations:
            quadrant = citation.get('steep_g_quadrant', 'unknown')
            if quadrant not in by_quadrant:
                by_quadrant[quadrant] = []
            by_quadrant[quadrant].append(citation)

        return dict(sorted(by_quadrant.items(), key=lambda x: len(x[1]), reverse=True))

    def _group_signals_by_ring(self, signals: List[Dict]) -> Dict:
        """Group signals by time ring (Now/Next/Later)."""
        by_ring = {'Now': [], 'Next': [], 'Later': []}
        for signal in signals:
            ring = signal.get('ring', 'Later')
            if ring in by_ring:
                by_ring[ring].append(signal)

        return by_ring

    def _group_signals_by_quadrant(self, signals: List[Dict]) -> Dict:
        """Group signals by STEEP-G quadrant."""
        by_quadrant = {}
        for signal in signals:
            quadrant = signal.get('quadrant', 'unknown')
            if quadrant not in by_quadrant:
                by_quadrant[quadrant] = []
            by_quadrant[quadrant].append(signal)

        return dict(sorted(by_quadrant.items(), key=lambda x: len(x[1]), reverse=True))

    def _upload_radar_outputs(self, query_id: str, processed_data: Dict[str, str]) -> List[Dict]:
        """Upload radar outputs to blob storage."""
        blob_urls = []

        # Map internal names to storage names and display types
        name_map = {
            'radar_json': ('foresight_radar.json', 'radar'),
            'brief': ('foresight_radar_brief.md', 'brief'),
            'citations': ('citations_database.json', 'citations'),
            'signals': ('signals_analysis.json', 'signals'),
            'scenarios': ('scenarios_analysis.json', 'scenarios'),
            'watchlist': ('monitoring_watchlist.json', 'watchlist')
        }

        for content_type, content in processed_data.items():
            if content_type not in name_map:
                continue

            storage_name, display_type = name_map[content_type]

            if not content:
                continue

            # Upload to blob storage
            blob_url = self.repository.upload_report(query_id, storage_name, content)

            if blob_url:
                blob_urls.append({
                    "type": display_type,
                    "filename": storage_name,
                    "url": blob_url
                })

        return blob_urls

    def _update_radar_completion(self, query_id: str, blob_urls: List[Dict], radar_results: Dict):
        """Update foresight radar status to completed."""
        self.repository.update_query_blob_urls(query_id, blob_urls)

        # Calculate completion time
        query = self.repository.get_query(query_id)
        if query:
            created_at = datetime.fromisoformat(query['createdAt'])
            completed_at = datetime.now(IST)
            duration_minutes = int((completed_at - created_at.replace(tzinfo=IST)).total_seconds() / 60)

            # Extract stats from radar results
            radar_json = radar_results.get('radar_json', {})
            citations = radar_results.get('citations', [])

            # Update metadata
            self.repository.update_query_metadata(query_id, {
                'completedAt': completed_at.isoformat(),
                'durationMinutes': duration_minutes,
                'totalSearches': 25,  # Default number of searches
                'uniqueCitations': len(citations),
                'signalsCount': len(radar_json.get('radar_items', [])),
                'scenariosCount': len(radar_json.get('scenarios', [])),
                'watchlistCount': len(radar_json.get('watchlist', [])),
                'citationsCount': len(citations)  # For compatibility with existing UI
            })

        self.repository.update_query_status(query_id, STATUS_DONE)

    def _generate_display_title(self, query_text: str) -> str:
        """Generate a concise display title for foresight radar."""
        try:
            response = self.openai_manager.chat_completion(
                model=OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Generate a concise foresight radar title (5-7 words) for a strategic foresight query."
                    },
                    {
                        "role": "user",
                        "content": f"Generate title for: {query_text}"
                    }
                ],
                temperature=OPENAI_TEMPERATURE,
                max_tokens=OPENAI_MAX_TOKENS
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
foresight_radar_service = ForesightRadarService()
