import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import uuid
import asyncio
from concurrent.futures import ThreadPoolExecutor

sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "impact_analysis"))

from impact_analysis.impact_analyzer import ImpactAnalyzer
from impact_analysis_repository import ImpactAnalysisRepository

BATCH_SIZE = 10
ASYNC_TIMEOUT_SECONDS = 600
MAX_CONCURRENT_ANALYSES = 5

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
            'status': 'processing',
            'meta_prompt': '',
            'citations_count': 0,
            'citations': [],
            'impact_analysis': ''
        }
        
        self.repository.create(analysis_id, analysis_data)
        
        results = self.analyzer.analyze_impact(query)
        
        analysis_data.update({
            'status': 'completed',
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
            'status': 'processing',
            'meta_prompt': '',
            'citations_count': 0,
            'citations': [],
            'impact_analysis': ''
        }
        
        self.repository.create(analysis_id, analysis_data)
        
        loop = asyncio.get_event_loop()
        future = loop.run_in_executor(executor, self._run_analysis, analysis_id, query)
        active_tasks[analysis_id] = future
        
        return {
            'analysis_id': analysis_id,
            'status': 'processing',
            'message': 'Analysis started successfully'
        }
    
    def _run_analysis(self, analysis_id: str, query: str) -> Dict:
        results = self.analyzer.analyze_impact(query)
        
        analysis_data = {
            'status': 'completed',
            'meta_prompt': results.get('meta_prompt', ''),
            'citations_count': results.get('citations_count', 0),
            'citations': results.get('citations', []),
            'impact_analysis': results.get('impact_analysis', '')
        }
        
        updated = self.repository.update(analysis_id, analysis_data)
        
        if analysis_id in active_tasks:
            del active_tasks[analysis_id]
        
        return updated
    
    def get_analysis(self, analysis_id: str) -> Optional[Dict]:
        return self.repository.get_by_id(analysis_id)
    
    def list_analyses(self, limit: int = 50) -> List[Dict]:
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
            return {'status': 'not_found'}
        
        if analysis_id in active_tasks:
            future = active_tasks[analysis_id]
            if future.done():
                analysis = self.repository.get_by_id(analysis_id)
        
        return {
            'analysis_id': analysis_id,
            'status': analysis.get('status', 'unknown'),
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
            'status': 'processing',
            'meta_prompt': '',
            'citations_count': 0,
            'citations': [],
            'impact_analysis': ''
        }
        
        self.repository.update(analysis_id, analysis_data)
        
        results = self.analyzer.analyze_impact(query)
        
        analysis_data.update({
            'status': 'completed',
            'meta_prompt': results.get('meta_prompt', ''),
            'citations_count': results.get('citations_count', 0),
            'citations': results.get('citations', []),
            'impact_analysis': results.get('impact_analysis', '')
        })
        
        return self.repository.update(analysis_id, analysis_data)


impact_analysis_service = ImpactAnalysisService()
