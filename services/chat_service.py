"""
Service - Orchestrates chat operations with Azure storage
Manages document retrieval, chat history, and conversation persistence
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from ulid import ULID

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from clients.azure import AzureTableClient, AzureBlobClient
from repositories.chat_repository import ChatRepository
from agents.chat.chat_agent import PolicyChatAgent
from agents.chat.prompts import ChatPrompts

# ============================================================================
# CONSTANTS
# ============================================================================

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Default chat history limit
DEFAULT_CHAT_HISTORY_LIMIT = 5

# Analysis modes
ANALYSIS_MODE_FULL = "full"
ANALYSIS_MODE_RESEARCH_ONLY = "research_only"

# Document count requirements
FULL_MODE_DOCUMENT_COUNT = 7
RESEARCH_ONLY_DOCUMENT_COUNT = 1

# Document names
RESEARCH_REPORT_DOC = "research_report.md"

# ============================================================================


class PolicyChatService:
    """Service layer for managing policy chat operations."""

    def __init__(self, chat_repository: ChatRepository = None,
                 table_client: AzureTableClient = None,
                 blob_client: AzureBlobClient = None):
        """Initialize chat service with repositories and chat agent."""
        self.chat_repository = chat_repository or ChatRepository()
        self.table_client = table_client or AzureTableClient()  # For policy query info
        self.blob_client = blob_client or AzureBlobClient()  # For policy documents
        self.chat_agent = PolicyChatAgent()

        print("💬 Policy Chat Service initialized")

    def send_message(
        self,
        query_id: str,
        session_id: str,
        user_message: str,
        enable_web_search: bool = True
    ) -> Dict[str, any]:
        """
        Process a user message and generate an enhanced response.

        Args:
            query_id: Policy query ID
            session_id: Chat session ID (ULID)
            user_message: User's question
            enable_web_search: Whether to enable research mode with web search

        Returns:
            Dict with response, messageId, timestamp, and metadata
        """
        # Fetch all policy documents
        documents = self._fetch_policy_documents(query_id)
        if not documents:
            return {
                "error": "Policy documents not found. Please ensure the policy analysis has completed.",
                "messageId": None,
                "timestamp": None,
                "metadata": {}
            }

        # Format documents content
        documents_content = PolicyChatAgent.format_documents_content(documents)

        # Get chat history (last 5 turns)
        chat_history = self.get_chat_history(query_id, session_id, limit=DEFAULT_CHAT_HISTORY_LIMIT)

        # Generate enhanced response with metadata
        result = self.chat_agent.generate_response(
            documents_content=documents_content,
            chat_history=chat_history,
            user_message=user_message,
            enable_web_search=enable_web_search
        )

        # Store the conversation turn with metadata
        from ulid import ULID
        message_id = str(ULID())
        self.chat_repository.create_message_with_metadata(
            query_id=query_id,
            session_id=session_id,
            message_id=message_id,
            user_message=user_message,
            assistant_response=result["response"],
            metadata=result["metadata"]
        )

        return {
            "response": result["response"],
            "messageId": message_id,
            "timestamp": datetime.now(IST).isoformat(),
            "metadata": result["metadata"]
        }

    def get_chat_history(
        self,
        query_id: str,
        session_id: str,
        limit: int = 5
    ) -> List[Dict[str, str]]:
        """
        Retrieve chat history for a session.

        Args:
            query_id: Policy query ID
            session_id: Chat session ID
            limit: Maximum number of conversation turns to retrieve

        Returns:
            List of conversation turns (newest first)
        """
        try:
            messages = self.chat_repository.list_messages(query_id, session_id)

            # Convert to expected format
            history = []
            for msg in messages:
                history.append({
                    "messageId": msg["RowKey"],
                    "userMessage": msg["userMessage"],
                    "assistantResponse": msg["assistantResponse"],
                    "timestamp": msg["timestamp"]
                })

            # Sort by ULID (newest first) and take last N
            history.sort(key=lambda x: x["messageId"], reverse=True)
            return history[:limit][::-1]  # Reverse to get chronological order

        except Exception as e:
            print(f"⚠️ Error retrieving chat history: {e}")
            return []

    def _fetch_policy_documents(self, query_id: str) -> Optional[Dict[str, str]]:
        """
        Fetch policy documents from blob storage based on analysis mode.

        Full mode: 7 documents (research, policy, simulation, analytics, executive_summary, strategy_brief, policy_dossier)
        Research-only mode: 1 document (research_report.md)

        Returns:
            Dict mapping document names to their content, or None if requirements not met
        """
        # Get query metadata to determine analysis mode
        query = self.table_client.get_query(query_id)
        if not query:
            print(f"❌ Query {query_id} not found")
            return None

        analysis_mode = query.get('analysisMode', ANALYSIS_MODE_FULL)
        documents = {}

        for doc_name in ChatPrompts.POLICY_DOCUMENTS:
            content = self.blob_client.download_report(query_id, doc_name)
            if content:
                documents[doc_name] = content
            else:
                print(f"⚠️ Document not found: {doc_name}")

        # Validate based on analysis mode
        if analysis_mode == ANALYSIS_MODE_RESEARCH_ONLY:
            # Research-only: expect only research_report.md
            if len(documents) == RESEARCH_ONLY_DOCUMENT_COUNT and RESEARCH_REPORT_DOC in documents:
                return documents
            else:
                print(f"❌ Research-only mode expects 1 document (research_report.md), found {len(documents)}")
                return None
        else:
            # Full mode: expect all 7 documents
            if len(documents) == FULL_MODE_DOCUMENT_COUNT:
                return documents
            else:
                print(f"❌ Full mode expects 7 documents, found {len(documents)}")
                return None

