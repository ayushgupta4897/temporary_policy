from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from azure.data.tables import TableServiceClient, TableEntity
import json
import os
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING

TABLE_NAME = "impactanalysis"
PARTITION_KEY = "impact"

IST = timezone(timedelta(hours=5, minutes=30))


class ImpactAnalysisRepository:
    
    def __init__(self):
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable or config is required")
        
        self.table_service_client = TableServiceClient.from_connection_string(self.connection_string)
        self.table_client = self.table_service_client.get_table_client(TABLE_NAME)
        
        self.table_service_client.create_table_if_not_exists(TABLE_NAME)
    
    def create(self, analysis_id: str, data: Dict) -> Dict:
        entity = {
            'PartitionKey': PARTITION_KEY,
            'RowKey': analysis_id,
            'query': data.get('query', ''),
            'meta_prompt': data.get('meta_prompt', ''),
            'citations_count': data.get('citations_count', 0),
            'citations': json.dumps(data.get('citations', [])),
            'impact_analysis': data.get('impact_analysis', ''),
            'status': data.get('status', 'completed'),
            'created_at': datetime.now(IST).isoformat(),
            'updated_at': datetime.now(IST).isoformat()
        }
        
        self.table_client.create_entity(entity)
        return self._entity_to_dict(entity)
    
    def get_by_id(self, analysis_id: str) -> Optional[Dict]:
        entity = self.table_client.get_entity(PARTITION_KEY, analysis_id)
        if entity:
            return self._entity_to_dict(entity)
        return None
    
    def list_all(self, limit: int = 100) -> List[Dict]:
        query_filter = f"PartitionKey eq '{PARTITION_KEY}'"
        entities = self.table_client.query_entities(query_filter, results_per_page=limit)
        
        results = []
        count = 0
        for entity in entities:
            if count >= limit:
                break
            results.append(self._entity_to_dict(entity))
            count += 1
        
        return results
    
    def update(self, analysis_id: str, data: Dict) -> Dict:
        entity = self.table_client.get_entity(PARTITION_KEY, analysis_id)
        
        if 'query' in data:
            entity['query'] = data['query']
        if 'meta_prompt' in data:
            entity['meta_prompt'] = data['meta_prompt']
        if 'citations_count' in data:
            entity['citations_count'] = data['citations_count']
        if 'citations' in data:
            entity['citations'] = json.dumps(data['citations'])
        if 'impact_analysis' in data:
            entity['impact_analysis'] = data['impact_analysis']
        if 'status' in data:
            entity['status'] = data['status']
        
        entity['updated_at'] = datetime.now(IST).isoformat()
        
        self.table_client.update_entity(entity, mode='replace')
        return self._entity_to_dict(entity)
    
    def delete(self, analysis_id: str) -> bool:
        self.table_client.delete_entity(PARTITION_KEY, analysis_id)
        return True
    
    def _entity_to_dict(self, entity: TableEntity) -> Dict:
        return {
            'analysis_id': entity.get('RowKey'),
            'query': entity.get('query'),
            'meta_prompt': entity.get('meta_prompt'),
            'citations_count': entity.get('citations_count', 0),
            'citations': json.loads(entity.get('citations', '[]')),
            'impact_analysis': entity.get('impact_analysis'),
            'status': entity.get('status'),
            'created_at': entity.get('created_at'),
            'updated_at': entity.get('updated_at')
        }