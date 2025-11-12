"""
Azure Storage Clients - Thin layer for Blob and Table Storage
Strategy& PWC - AI Policy Drafter UI
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from azure.data.tables import TableServiceClient, TableEntity
from azure.storage.blob import BlobServiceClient
import json
import time
from azure.core.exceptions import ServiceRequestTimeoutError, HttpResponseError

# Import config for Azure connection string fallback
sys.path.append(str(Path(__file__).parent.parent))
try:
    from config.app_config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING
except ImportError:
    CONFIG_AZURE_CONNECTION_STRING = None

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


class AzureTableClient:
    """Thin client for Azure Table Storage operations."""
    
    def _retry_operation(self, operation, max_retries=3, base_delay=1):
        """Retry an operation with exponential backoff."""
        for attempt in range(max_retries):
            try:
                return operation()
            except (ServiceRequestTimeoutError, HttpResponseError, Exception) as e:
                if attempt == max_retries - 1:
                    print(f"Azure Table operation failed after {max_retries} attempts: {e}")
                    raise e
                
                delay = base_delay * (2 ** attempt)  # Exponential backoff
                print(f"Azure Table operation failed (attempt {attempt + 1}/{max_retries}), retrying in {delay}s: {e}")
                time.sleep(delay)
    
    def __init__(self):
        # Try environment variable first, then fall back to config
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable or config is required")
        
        self.service = TableServiceClient.from_connection_string(self.connection_string)
        self.table_name = "PolicyQueries"
        
        # Create table if it doesn't exist
        try:
            self.service.create_table(self.table_name)
        except Exception:
            pass  # Table already exists
        
        # Get table client for operations
        self.table_client = self.service.get_table_client(self.table_name)
    
    def create_query(self, query_id: str, query_text: str, display_title: str = None,
                    analysis_mode: str = "full", metadata: Dict = None) -> bool:
        """Create a new query record."""
        entity = {
            "PartitionKey": "queries",
            "RowKey": query_id,
            "query": query_text,
            "displayTitle": display_title or query_text[:50],  # Fallback to first 50 chars
            "status": "processing",
            "createdAt": datetime.now(IST).isoformat(),
            "analysisMode": analysis_mode,
            "blobUrls": json.dumps([]),
            "progress": 0,
            "currentStep": "Initializing",
            "steps": json.dumps([])  # Initialize empty steps array
        }

        # Add metadata fields if provided
        if metadata:
            for key, value in metadata.items():
                entity[key] = value

        self.table_client.create_entity(entity=entity)
        return True
    
    def get_query(self, query_id: str) -> Optional[Dict]:
        """Get a query by ID."""
        entity = self.table_client.get_entity(
            partition_key="queries",
            row_key=query_id
        )

        # Convert to dict and parse JSON fields
        result = dict(entity)
        result["blobUrls"] = json.loads(result.get("blobUrls", "[]"))
        result["queryId"] = result.get("RowKey", query_id)
        result["durationMinutes"] = result.get("durationMinutes", 0)
        result["citationsCount"] = result.get("citationsCount", 0)
        result["displayTitle"] = result.get("displayTitle", result.get("query", "")[:50])
        result["analysisMode"] = result.get("analysisMode") or "full"  # Default to full for backward compatibility
        result["progress"] = result.get("progress", 0)
        result["currentStep"] = result.get("currentStep", "Initializing")
        # Handle steps - could be None, string, or missing
        steps_raw = result.get("steps")
        if steps_raw and isinstance(steps_raw, str):
            result["steps"] = json.loads(steps_raw)
        else:
            result["steps"] = []
        return result
    
    def update_query_status(self, query_id: str, status: str, error_message: str = None) -> bool:
        """Update query status."""
        entity = {
            "PartitionKey": "queries",
            "RowKey": query_id,
            "status": status
        }
        
        if status == "done":
            entity["completedAt"] = datetime.now(IST).isoformat()
        
        if error_message:
            entity["errorMessage"] = error_message
        
        try:
            def update_operation():
                self.table_client.update_entity(entity=entity, mode="merge")
                return True
            
            return self._retry_operation(update_operation)
        except Exception as e:
            print(f"Failed to update query status for {query_id}: {e}")
            return False
    
    def update_query_blob_urls(self, query_id: str, blob_urls: List[str]) -> bool:
        """Update query blob URLs."""
        entity = {
            "PartitionKey": "queries",
            "RowKey": query_id,
            "blobUrls": json.dumps(blob_urls)
        }
        
        try:
            def update_operation():
                self.table_client.update_entity(entity=entity, mode="merge")
                return True
            
            return self._retry_operation(update_operation)
        except Exception as e:
            print(f"Failed to update blob URLs for query {query_id}: {e}")
            return False
    
    def update_query_metadata(self, query_id: str, metadata: Dict) -> bool:
        """Update query with additional metadata."""
        entity = {
            "PartitionKey": "queries",
            "RowKey": query_id
        }

        # Add all metadata fields to the entity
        for key, value in metadata.items():
            entity[key] = value

        try:
            def update_operation():
                self.table_client.update_entity(entity=entity, mode="merge")
                return True

            return self._retry_operation(update_operation)
        except Exception as e:
            print(f"Failed to update metadata for query {query_id}: {e}")
            return False

    def update_query_progress(self, query_id: str, progress: int, current_step: str) -> bool:
        """Update query progress percentage and current step (legacy method)."""
        entity = {
            "PartitionKey": "queries",
            "RowKey": query_id,
            "progress": progress,
            "currentStep": current_step
        }

        try:
            def update_operation():
                self.table_client.update_entity(entity=entity, mode="merge")
                return True

            return self._retry_operation(update_operation)
        except Exception as e:
            print(f"Failed to update progress for query {query_id}: {e}")
            return False

    def update_query_steps(self, query_id: str, steps: List[Dict]) -> bool:
        """Update query with step-based progress."""
        entity = {
            "PartitionKey": "queries",
            "RowKey": query_id,
            "steps": json.dumps(steps)
        }

        try:
            def update_operation():
                self.table_client.update_entity(entity=entity, mode="merge")
                return True

            return self._retry_operation(update_operation)
        except Exception as e:
            print(f"Failed to update steps for query {query_id}: {e}")
            return False

    def list_queries(self, query_type: str = "policy") -> List[Dict]:
        """List queries filtered by type (policy, graph, contextual_search, news_scrape, foresight_radar, or dsm)."""
        if query_type == "policy":
            query_filter = "PartitionKey eq 'queries' and (analysisMode eq 'full' or analysisMode eq 'research_only')"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "durationMinutes", "citationsCount", "displayTitle", "analysisMode"]
        elif query_type == "graph":
            query_filter = "PartitionKey eq 'queries' and analysisMode eq 'graph'"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "durationMinutes", "citationsCount", "displayTitle", "analysisMode", "geography", "timeRange", "intervention", "nodeCount", "edgeCount", "progress", "currentStep", "steps"]
        elif query_type == "contextual_search":
            query_filter = "PartitionKey eq 'queries' and analysisMode eq 'contextual_search'"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "durationMinutes", "citationsCount", "displayTitle", "analysisMode", "totalSearches", "uniqueCitations", "sourceTiersCovered", "batchSize"]
        elif query_type == "news_scrape":
            query_filter = "PartitionKey eq 'queries' and analysisMode eq 'news_scrape'"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "durationMinutes", "displayTitle", "analysisMode", "totalCitations", "hierarchies", "geographiesCount", "timeline"]
        elif query_type == "foresight_radar":
            query_filter = "PartitionKey eq 'queries' and analysisMode eq 'foresight_radar'"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "durationMinutes", "displayTitle", "analysisMode", "totalSearches", "uniqueCitations", "signalsCount", "scenariosCount", "watchlistCount", "batchSize"]
        elif query_type == "dsm" or query_type == "dynamic_systems_modeler":
            query_filter = "PartitionKey eq 'queries' and analysisMode eq 'dsm'"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "displayTitle", "analysisMode", "query_type", "main_query", "stage", "is_base_graph", "base_graph_id", "intervention", "intervention_details", "node_count", "edge_count", "nodes_changed", "edges_changed", "total_children"]
        else:
            query_filter = "PartitionKey eq 'queries'"
            select_fields = ["RowKey", "query", "status", "createdAt", "completedAt", "errorMessage", "durationMinutes", "citationsCount", "displayTitle", "analysisMode"]
        
        entities = self.table_client.query_entities(
            query_filter=query_filter,
            select=select_fields
        )
        
        results = []
        for entity in entities:
            result = dict(entity)
            result["queryId"] = result["RowKey"]
            # Ensure all fields are present with defaults
            result["durationMinutes"] = result.get("durationMinutes", 0)
            result["citationsCount"] = result.get("citationsCount", 0)
            result["displayTitle"] = result.get("displayTitle", result.get("query", "")[:50])
            result["analysisMode"] = result.get("analysisMode") or "full"  # Default to full for backward compatibility
            
            if query_type == "graph":
                result["progress"] = result.get("progress", 0)
                result["currentStep"] = result.get("currentStep", "Initializing")
                # Handle steps - could be None, string, or missing
                steps_raw = result.get("steps")
                if steps_raw and isinstance(steps_raw, str):
                    result["steps"] = json.loads(steps_raw)
                else:
                    result["steps"] = []
                result["nodeCount"] = result.get("nodeCount", 0)
                result["edgeCount"] = result.get("edgeCount", 0)
            elif query_type == "contextual_search":
                result["totalSearches"] = result.get("totalSearches", 0)
                result["uniqueCitations"] = result.get("uniqueCitations", 0)
                result["sourceTiersCovered"] = result.get("sourceTiersCovered", 0)
                result["batchSize"] = result.get("batchSize", 10)
            elif query_type == "news_scrape":
                result["totalCitations"] = result.get("totalCitations", 0)
                result["hierarchies"] = result.get("hierarchies", "[]")
                result["geographiesCount"] = result.get("geographiesCount", 0)
                result["timeline"] = result.get("timeline", "last_6_months")
            elif query_type == "foresight_radar":
                result["totalSearches"] = result.get("totalSearches", 0)
                result["uniqueCitations"] = result.get("uniqueCitations", 0)
                result["signalsCount"] = result.get("signalsCount", 0)
                result["scenariosCount"] = result.get("scenariosCount", 0)
                result["watchlistCount"] = result.get("watchlistCount", 0)
                result["batchSize"] = result.get("batchSize", 10)
            
            results.append(result)
        
        # Sort by creation date (newest first)
        results.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
        return results
    
    def delete_query(self, query_id: str) -> bool:
        """Delete a query from table storage."""
        try:
            self.table_client.delete_entity(
                partition_key="queries",
                row_key=query_id
            )
            return True
        except Exception as e:
            print(f"Error deleting query {query_id} from table storage: {e}")
            return False


class AzureBlobClient:
    """Thin client for Azure Blob Storage operations."""
    
    def __init__(self):
        # Try environment variable first, then fall back to config
        self.connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
        if not self.connection_string:
            raise ValueError("AZURE_STORAGE_CONNECTION_STRING environment variable or config is required")
        
        self.service = BlobServiceClient.from_connection_string(self.connection_string)
        self.container_name = "policy-reports"
        
        # Create container if it doesn't exist
        try:
            self.service.create_container(self.container_name)
        except Exception:
            pass  # Container already exists
    
    def upload_report(self, query_id: str, report_name: str, content: str) -> Optional[str]:
        """Upload a report file and return the blob URL."""
        blob_name = f"{query_id}/{report_name}"
        
        blob_client = self.service.get_blob_client(
            container=self.container_name, 
            blob=blob_name
        )
        
        blob_client.upload_blob(content, overwrite=True, content_type="text/markdown")
        
        return blob_client.url
    
    def download_report(self, query_id: str, report_name: str) -> Optional[str]:
        """Download a report file."""
        blob_name = f"{query_id}/{report_name}"
        
        try:
            blob_client = self.service.get_blob_client(
                container=self.container_name, 
                blob=blob_name
            )
            
            return blob_client.download_blob().readall().decode('utf-8')
        except Exception:
            return None
    
    def list_reports(self, query_id: str) -> List[str]:
        """List all reports for a query."""
        blob_prefix = f"{query_id}/"
        
        blobs = self.service.get_container_client(self.container_name).list_blobs(
            name_starts_with=blob_prefix
        )
        
        return [blob.name.replace(blob_prefix, "") for blob in blobs]
    
    def delete_report(self, query_id: str, report_name: str) -> bool:
        """Delete a report from blob storage."""
        blob_name = f"{query_id}/{report_name}"
        
        try:
            blob_client = self.service.get_blob_client(
                container=self.container_name,
                blob=blob_name
            )
            blob_client.delete_blob()
            return True
        except Exception as e:
            print(f"Error deleting blob {blob_name}: {e}")
            return False
