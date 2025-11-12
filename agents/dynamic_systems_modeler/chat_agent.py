"""
Dynamic Systems Modeler Chat Agent - Specialized chat for DSM taxonomy and intervention Q&A
Extends BaseChatAgent with DSM-specific prompts and document handling
"""

import sys
from pathlib import Path
from typing import List, Dict

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from agents.chat.base_chat_agent import BaseChatAgent
from agents.dynamic_systems_modeler.chat_prompts import DSMChatPrompts


class DSMChatAgent(BaseChatAgent):
    """
    Specialized chat agent for Dynamic Systems Modeler.

    Handles questions about:
    - Custom taxonomy structure
    - Base graph and intervention scenarios
    - Delta analysis and impact prediction
    - Node/edge modifications across scenarios
    """

    def __init__(self):
        """Initialize DSM chat agent."""
        super().__init__()
        self.prompts = DSMChatPrompts()
        print("🔧 Dynamic Systems Modeler Chat Agent ready")

    def get_system_prompt(self, documents_content: str) -> str:
        """Generate system prompt for DSM chat."""
        return self.prompts.get_system_prompt(documents_content)

    def get_smart_decision_prompt(
        self,
        user_message: str,
        documents_content: str,
        chat_history: List[Dict[str, str]]
    ) -> str:
        """Generate smart decision prompt for DSM queries."""
        return self.prompts.get_smart_decision_prompt(
            user_message, documents_content, chat_history
        )

    def get_combined_search_synthesis_prompt(
        self,
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> str:
        """Generate combined search/synthesis prompt for DSM."""
        return self.prompts.get_combined_search_synthesis_prompt(
            search_plan, documents_content, user_message
        )

    def get_error_message(self, error_type: str) -> str:
        """Get error message for DSM chat."""
        return self.prompts.get_error_message(error_type)

    @staticmethod
    def format_documents_content(documents: Dict[str, str]) -> str:
        """Format DSM outputs."""
        return DSMChatPrompts.format_documents_content(documents)

    def _extract_document_sources(self, response_text: str) -> List[str]:
        """Extract DSM output sources mentioned in response."""
        sources = []
        output_types = [
            "taxonomy",
            "base_graph",
            "intervention_scenarios",
            "delta_analysis",
            "interactive_html"
        ]

        for output_type in output_types:
            if output_type in response_text or output_type.replace('_', ' ') in response_text:
                sources.append(output_type)

        return sources
