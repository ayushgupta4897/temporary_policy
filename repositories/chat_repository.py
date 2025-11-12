"""
Chat Repository - DUMB CRUD operations only
No business logic, validation, or orchestration
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone, timedelta
from azure.data.tables import TableServiceClient
from config.app_config import AZURE_STORAGE_CONNECTION_STRING as CONFIG_AZURE_CONNECTION_STRING

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))


class ChatRepository:
    """Repository for chat message data persistence."""

    def __init__(self, table_service: TableServiceClient = None):
        """Initialize with Azure table service."""
        if table_service:
            self.service = table_service
        else:
            connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING") or CONFIG_AZURE_CONNECTION_STRING
            if not connection_string:
                raise ValueError("AZURE_STORAGE_CONNECTION_STRING required")
            self.service = TableServiceClient.from_connection_string(connection_string)

        self.table_name = "PolicyChatMessages"
        self._ensure_table()

    def _ensure_table(self):
        """Ensure the chat messages table exists."""
        try:
            self.service.create_table(self.table_name)
        except Exception:
            pass  # Table already exists

    def create_message(self, query_id: str, session_id: str, message_id: str,
                      user_message: str, assistant_response: str) -> bool:
        """Create a new chat message record (basic version)."""
        partition_key = f"{query_id}_{session_id}"
        timestamp = datetime.now(IST).isoformat()

        entity = {
            "PartitionKey": partition_key,
            "RowKey": message_id,
            "queryId": query_id,
            "sessionId": session_id,
            "userMessage": user_message,
            "assistantResponse": assistant_response,
            "timestamp": timestamp
        }

        try:
            chat_table = self.service.get_table_client(self.table_name)
            chat_table.create_entity(entity=entity)
            return True
        except Exception:
            return False

    def create_message_with_metadata(
        self,
        query_id: str,
        session_id: str,
        message_id: str,
        user_message: str,
        assistant_response: str,
        metadata: Dict[str, Any],
        agent_type: str = "policy"
    ) -> bool:
        """
        Create a new chat message record with enhanced metadata.

        Metadata fields:
        - mode: "fast" | "research"
        - webSearchUsed: bool
        - elaboratedQuery: str | None
        - citations: List[Dict]
        - documentSources: List[str]
        - strategy: str
        - processingTimeMs: int

        agent_type: Type of agent (policy, system_compass, dsm, impact_analysis)
        """
        partition_key = f"{query_id}_{session_id}_{agent_type}"
        timestamp = datetime.now(IST).isoformat()

        entity = {
            "PartitionKey": partition_key,
            "RowKey": message_id,
            "queryId": query_id,
            "sessionId": session_id,
            "agentType": agent_type,
            "userMessage": user_message,
            "assistantResponse": assistant_response,
            "timestamp": timestamp,
            # Enhanced metadata fields
            "processingMode": metadata.get("mode", "fast"),
            "webSearchUsed": metadata.get("webSearchUsed", False),
            "elaboratedQuery": metadata.get("elaboratedQuery", ""),
            "citationsJson": json.dumps(metadata.get("citations", [])),
            "documentSourcesJson": json.dumps(metadata.get("documentSources", [])),
            "processingTimeMs": metadata.get("processingTimeMs", 0),
            "strategy": metadata.get("strategy", ""),
            "reasoningUsed": metadata.get("reasoningUsed", False),
        }

        try:
            chat_table = self.service.get_table_client(self.table_name)
            chat_table.create_entity(entity=entity)
            return True
        except Exception as e:
            print(f"❌ Error creating message with metadata: {e}")
            return False

    def get_message(self, query_id: str, session_id: str, message_id: str) -> Optional[Dict]:
        """Get a single chat message."""
        partition_key = f"{query_id}_{session_id}"

        try:
            chat_table = self.service.get_table_client(self.table_name)
            entity = chat_table.get_entity(partition_key=partition_key, row_key=message_id)
            return dict(entity)
        except Exception:
            return None

    def list_messages(self, query_id: str, session_id: str, agent_type: str = "policy") -> List[Dict]:
        """List all messages for a chat session and agent type."""
        partition_key = f"{query_id}_{session_id}_{agent_type}"

        try:
            chat_table = self.service.get_table_client(self.table_name)
            entities = chat_table.query_entities(
                query_filter=f"PartitionKey eq '{partition_key}'"
            )
            return [dict(e) for e in entities]
        except Exception:
            return []

    def delete_message(self, query_id: str, session_id: str, message_id: str) -> bool:
        """Delete a chat message."""
        partition_key = f"{query_id}_{session_id}"

        try:
            chat_table = self.service.get_table_client(self.table_name)
            chat_table.delete_entity(partition_key=partition_key, row_key=message_id)
            return True
        except Exception:
            return False

    def delete_session(self, query_id: str, session_id: str) -> bool:
        """Delete all messages in a chat session."""
        partition_key = f"{query_id}_{session_id}"

        try:
            chat_table = self.service.get_table_client(self.table_name)
            entities = chat_table.query_entities(
                query_filter=f"PartitionKey eq '{partition_key}'"
            )

            for entity in entities:
                chat_table.delete_entity(
                    partition_key=entity['PartitionKey'],
                    row_key=entity['RowKey']
                )

            return True
        except Exception:
            return False
