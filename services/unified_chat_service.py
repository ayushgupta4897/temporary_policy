"""
Unified Chat Service - Orchestrates chat operations across all specialized agents
Factory pattern for routing to appropriate chat agent based on agent type
"""

import sys
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timezone, timedelta
from enum import Enum

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from clients.azure import AzureTableClient, AzureBlobClient
from repositories.chat_repository import ChatRepository
from repositories.impact_analysis_repository import ImpactAnalysisRepository
from agents.chat.chat_agent import PolicyChatAgent
from agents.system_compass.chat_agent import SystemCompassChatAgent
from agents.dynamic_systems_modeler.chat_agent import DSMChatAgent
from agents.impact_analysis.chat_agent import ImpactAnalysisChatAgent

# ============================================================================
# CONSTANTS
# ============================================================================

# IST timezone (UTC+5:30)
IST = timezone(timedelta(hours=5, minutes=30))

# Default chat history limit
DEFAULT_CHAT_HISTORY_LIMIT = 5

# Agent types
class AgentType(str, Enum):
    POLICY = "policy"
    SYSTEM_COMPASS = "system_compass"
    DSM = "dsm"
    IMPACT_ANALYSIS = "impact_analysis"

# ============================================================================


class UnifiedChatService:
    """
    Unified service layer for managing chat operations across all agents.

    Supports:
    - Policy Chat (existing)
    - System Compass Chat
    - Dynamic Systems Modeler Chat
    - Impact Analysis Chat
    """

    def __init__(self, chat_repository: ChatRepository = None,
                 table_client: AzureTableClient = None,
                 blob_client: AzureBlobClient = None,
                 impact_repository: ImpactAnalysisRepository = None):
        """Initialize unified chat service with repositories and all chat agents."""
        self.chat_repository = chat_repository or ChatRepository()
        self.table_client = table_client or AzureTableClient()
        self.blob_client = blob_client or AzureBlobClient()
        self.impact_repository = impact_repository or ImpactAnalysisRepository()

        # Initialize all chat agents (lazy loading alternative could be used)
        self.agents = {
            AgentType.POLICY: PolicyChatAgent(),
            AgentType.SYSTEM_COMPASS: SystemCompassChatAgent(),
            AgentType.DSM: DSMChatAgent(),
            AgentType.IMPACT_ANALYSIS: ImpactAnalysisChatAgent()
        }

        print("💬 Unified Chat Service initialized with 4 agents")

    def send_message(
        self,
        query_id: str,
        session_id: str,
        user_message: str,
        agent_type: AgentType,
        enable_web_search: bool = True
    ) -> Dict[str, any]:
        """
        Process a user message using the appropriate chat agent.

        Args:
            query_id: Query ID
            session_id: Chat session ID (ULID)
            user_message: User's question
            agent_type: Which agent to use (policy, system_compass, dsm, impact_analysis)
            enable_web_search: Whether to enable research mode with web search

        Returns:
            Dict with response, messageId, timestamp, and metadata
        """
        # Get the appropriate agent
        agent = self.agents.get(agent_type)
        if not agent:
            return {
                "error": f"Unknown agent type: {agent_type}",
                "messageId": None,
                "timestamp": None,
                "metadata": {}
            }

        # Fetch documents for this agent type
        documents = self._fetch_documents(query_id, agent_type)
        if not documents:
            return {
                "error": f"Documents not found for {agent_type}. Please ensure the analysis has completed.",
                "messageId": None,
                "timestamp": None,
                "metadata": {}
            }

        # Format documents using agent's formatter
        documents_content = agent.format_documents_content(documents)

        # Get chat history
        chat_history = self.get_chat_history(query_id, session_id, agent_type, limit=DEFAULT_CHAT_HISTORY_LIMIT)

        # Generate response using agent
        result = agent.generate_response(
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
            metadata=result["metadata"],
            agent_type=agent_type.value
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
        agent_type: AgentType,
        limit: int = 5
    ) -> List[Dict[str, str]]:
        """
        Retrieve chat history for a session and agent type.

        Args:
            query_id: Query ID
            session_id: Chat session ID
            agent_type: Agent type to filter by
            limit: Maximum number of conversation turns to retrieve

        Returns:
            List of conversation turns (newest first)
        """
        try:
            messages = self.chat_repository.list_messages(query_id, session_id, agent_type=agent_type.value)

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

    def _fetch_documents(self, query_id: str, agent_type: AgentType) -> Optional[Dict[str, str]]:
        """
        Fetch documents from blob storage based on agent type.

        Args:
            query_id: Query ID
            agent_type: Type of agent (determines which documents to fetch)

        Returns:
            Dict mapping document names to their content, or None if not found
        """
        documents = {}

        if agent_type == AgentType.POLICY:
            # Policy chat uses 7 policy documents
            doc_names = [
                "research_report.md",
                "policy_report.md",
                "simulation_report.md",
                "analytics_report.md",
                "executive_summary.md",
                "strategy_brief.md",
                "policy_dossier.md"
            ]
            for doc_name in doc_names:
                content = self.blob_client.download_report(query_id, doc_name)
                if content:
                    documents[doc_name] = content

            return documents if len(documents) > 0 else None

        elif agent_type == AgentType.SYSTEM_COMPASS:
            # System Compass uses graph outputs stored with specific filenames
            # From graph_service.py: GRAPH_FILE_INTERACTIVE, GRAPH_FILE_JSON, GRAPH_FILE_CSV, etc.
            output_names = {
                "graph_json": "graph_data.json",
                "executive_summary": "executive_summary.md",
                "csv_data": "graph_tables.csv",
                "full_analysis": "full_analysis.md",
                "interactive_html": "graph_interactive.html"
            }

            for key, filename in output_names.items():
                content = self.blob_client.download_report(query_id, filename)
                if content:
                    documents[key] = content

            return documents if len(documents) > 0 else None

        elif agent_type == AgentType.DSM:
            # DSM uses taxonomy, base graph, intervention scenarios
            # From dsm_service.py: FILE_TAXONOMY, FILE_BASE_GRAPH, FILE_INTERVENTION_GRAPH, FILE_DELTA, etc.
            output_names = {
                "taxonomy": "taxonomy.json",
                "base_graph": "base_graph.json",
                "intervention_graph": "intervention_graph.json",
                "delta": "delta.json",
                "executive_summary": "executive_summary.md",
                "csv_data": "data_tables.csv",
                "interactive_html": "interactive.html"
            }

            for key, filename in output_names.items():
                content = self.blob_client.download_report(query_id, filename)
                if content:
                    documents[key] = content

            return documents if len(documents) > 0 else None

        elif agent_type == AgentType.IMPACT_ANALYSIS:
            # Impact Analysis stores data in Table Storage, not blob storage
            # query_id is actually the analysis_id for impact analysis
            try:
                analysis_data = self.impact_repository.get_by_id(query_id)
                if not analysis_data:
                    return None

                # Format the analysis data into documents structure
                documents = {
                    "query": analysis_data.get("query", ""),
                    "impact_analysis": analysis_data.get("impact_analysis", ""),
                    "meta_prompt": analysis_data.get("meta_prompt", ""),
                    "citations": analysis_data.get("citations", []),
                    "citations_count": analysis_data.get("citations_count", 0)
                }

                return documents if documents.get("impact_analysis") else None

            except Exception as e:
                print(f"⚠️ Error fetching Impact Analysis data: {e}")
                return None

        return None
