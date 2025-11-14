import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
import threading

sys.path.append(str(Path(__file__).parent.parent))

from agents.impact_analysis.agent import ImpactAnalyzer
from repositories.impact_analysis_repository import ImpactAnalysisRepository

# ============================================================================
# CONSTANTS
# ============================================================================

# Thread pool and batch configuration
BATCH_SIZE = 10
ASYNC_TIMEOUT_SECONDS = 3600  # 40 minutes
MAX_CONCURRENT_ANALYSES = 5

# Default list limit
DEFAULT_LIST_LIMIT = 50

# Analysis statuses
STATUS_PROCESSING = "processing"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"
STATUS_NOT_FOUND = "not_found"
STATUS_UNKNOWN = "unknown"

# Analysis default values
DEFAULT_META_PROMPT = ""
DEFAULT_CITATIONS_COUNT = 0
DEFAULT_IMPACT_ANALYSIS = ""

# ============================================================================

executor = ThreadPoolExecutor(max_workers=MAX_CONCURRENT_ANALYSES)
active_tasks = {}


class ImpactAnalysisService:
    
    def __init__(self):
        self.repository = ImpactAnalysisRepository()
        self.analyzer = ImpactAnalyzer(batch_size=BATCH_SIZE)
    
    def create_analysis(self, query: str) -> Dict:
        analysis_id = str(uuid.uuid4())
        
        analysis_data = {
            'query': query,
            'status': STATUS_PROCESSING,
            'meta_prompt': DEFAULT_META_PROMPT,
            'citations_count': DEFAULT_CITATIONS_COUNT,
            'citations': [],
            'impact_analysis': DEFAULT_IMPACT_ANALYSIS
        }
        
        self.repository.create(analysis_id, analysis_data)
        
        results = self.analyzer.analyze_impact(query)
        
        analysis_data.update({
            'status': STATUS_COMPLETED,
            'meta_prompt': results.get('meta_prompt', ''),
            'citations_count': results.get('citations_count', 0),
            'citations': results.get('citations', []),
            'impact_analysis': results.get('impact_analysis', '')
        })
        
        return self.repository.update(analysis_id, analysis_data)
    
    async def create_analysis_async(self, query: str) -> Dict:
        analysis_id = str(uuid.uuid4())
        
        analysis_data = {
            'query': query,
            'status': STATUS_PROCESSING,
            'meta_prompt': DEFAULT_META_PROMPT,
            'citations_count': DEFAULT_CITATIONS_COUNT,
            'citations': [],
            'impact_analysis': DEFAULT_IMPACT_ANALYSIS
        }
        
        self.repository.create(analysis_id, analysis_data)
        
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(executor, self._run_analysis, analysis_id, query)
        active_tasks[analysis_id] = future
        
        return {
            'analysis_id': analysis_id,
            'status': STATUS_PROCESSING,
            'message': 'Analysis started successfully'
        }
    
    def _run_analysis(self, analysis_id: str, query: str) -> Dict:
        result_container = {'completed': False, 'results': None}
        error_container = {'error': None}

        def run_with_timeout():
            try:
                results = self.analyzer.analyze_impact(query)
                result_container['results'] = results
                result_container['completed'] = True
            except Exception as e:
                error_container['error'] = str(e)

        # Start the analysis in a thread
        analysis_thread = threading.Thread(target=run_with_timeout)
        analysis_thread.daemon = True
        analysis_thread.start()

        # Wait for the thread to complete with timeout
        analysis_thread.join(timeout=ASYNC_TIMEOUT_SECONDS)

        # Check if analysis completed successfully
        if result_container['completed'] and result_container['results']:
            analysis_data = {
                'status': STATUS_COMPLETED,
                'meta_prompt': result_container['results'].get('meta_prompt', ''),
                'citations_count': result_container['results'].get('citations_count', 0),
                'citations': result_container['results'].get('citations', []),
                'impact_analysis': result_container['results'].get('impact_analysis', ''),
                'error_message': ''
            }
        elif error_container['error']:
            # Analysis failed with an error
            analysis_data = {
                'status': STATUS_FAILED,
                'error_message': f'Analysis failed: {error_container["error"]}'
            }
        else:
            # Analysis timed out
            analysis_data = {
                'status': STATUS_FAILED,
                'error_message': 'Analysis timed out after 30 minutes'
            }

        updated = self.repository.update(analysis_id, analysis_data)

        if analysis_id in active_tasks:
            del active_tasks[analysis_id]

        return updated
    
    def get_analysis(self, analysis_id: str) -> Optional[Dict]:
        return self.repository.get_by_id(analysis_id)
    
    def list_analyses(self, limit: int = DEFAULT_LIST_LIMIT) -> List[Dict]:
        analyses = self.repository.list_all(limit)
        analyses.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return analyses
    
    def delete_analysis(self, analysis_id: str) -> bool:
        if analysis_id in active_tasks:
            future = active_tasks[analysis_id]
            future.cancel()
            del active_tasks[analysis_id]
        
        return self.repository.delete(analysis_id)
    
    def get_analysis_status(self, analysis_id: str) -> Dict:
        analysis = self.repository.get_by_id(analysis_id)
        if not analysis:
            return {'status': STATUS_NOT_FOUND}
        
        if analysis_id in active_tasks:
            future = active_tasks[analysis_id]
            if future.done():
                analysis = self.repository.get_by_id(analysis_id)
        
        return {
            'analysis_id': analysis_id,
            'status': analysis.get('status', STATUS_UNKNOWN),
            'query': analysis.get('query', ''),
            'citations_count': analysis.get('citations_count', 0),
            'created_at': analysis.get('created_at')
        }
    
    def regenerate_analysis(self, analysis_id: str) -> Dict:
        existing = self.repository.get_by_id(analysis_id)
        if not existing:
            return None
        
        query = existing.get('query')
        
        analysis_data = {
            'status': STATUS_PROCESSING,
            'meta_prompt': DEFAULT_META_PROMPT,
            'citations_count': DEFAULT_CITATIONS_COUNT,
            'citations': [],
            'impact_analysis': DEFAULT_IMPACT_ANALYSIS
        }
        
        self.repository.update(analysis_id, analysis_data)
        
        results = self.analyzer.analyze_impact(query)
        
        analysis_data.update({
            'status': STATUS_COMPLETED,
            'meta_prompt': results.get('meta_prompt', ''),
            'citations_count': results.get('citations_count', 0),
            'citations': results.get('citations', []),
            'impact_analysis': results.get('impact_analysis', '')
        })
        
        return self.repository.update(analysis_id, analysis_data)


impact_analysis_service = ImpactAnalysisService()
