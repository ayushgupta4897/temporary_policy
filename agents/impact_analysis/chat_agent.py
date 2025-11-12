"""
Impact Analysis Chat Agent - Specialized chat for causal impact Q&A
Extends BaseChatAgent with impact analysis-specific prompts and document handling
"""

import sys
from pathlib import Path
from typing import List, Dict

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from agents.chat.base_chat_agent import BaseChatAgent
from agents.impact_analysis.chat_prompts import ImpactAnalysisChatPrompts


class ImpactAnalysisChatAgent(BaseChatAgent):
    """
    Specialized chat agent for Impact Analysis.

    Handles questions about:
    - Causal multipliers and effect sizes
    - Mechanism pathways
    - Evidence quality and validation
    - Confidence intervals and heterogeneous effects
    - Quantitative estimates and time horizons
    """

    def __init__(self):
        """Initialize Impact Analysis chat agent."""
        super().__init__()
        self.prompts = ImpactAnalysisChatPrompts()
        print("📈 Impact Analysis Chat Agent ready")

    def get_system_prompt(self, documents_content: str) -> str:
        """Generate system prompt for Impact Analysis chat."""
        return self.prompts.get_system_prompt(documents_content)

    def get_smart_decision_prompt(
        self,
        user_message: str,
        documents_content: str,
        chat_history: List[Dict[str, str]]
    ) -> str:
        """Generate smart decision prompt for Impact Analysis queries."""
        return self.prompts.get_smart_decision_prompt(
            user_message, documents_content, chat_history
        )

    def get_combined_search_synthesis_prompt(
        self,
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> str:
        """Generate combined search/synthesis prompt for Impact Analysis."""
        return self.prompts.get_combined_search_synthesis_prompt(
            search_plan, documents_content, user_message
        )

    def get_error_message(self, error_type: str) -> str:
        """Get error message for Impact Analysis chat."""
        return self.prompts.get_error_message(error_type)

    @staticmethod
    def format_documents_content(documents: Dict[str, str]) -> str:
        """Format Impact Analysis outputs."""
        return ImpactAnalysisChatPrompts.format_documents_content(documents)

    def _extract_document_sources(self, response_text: str) -> List[str]:
        """Extract impact analysis output sources mentioned in response."""
        sources = []
        output_types = [
            "impact_report",
            "quantitative_estimates",
            "causal_pathways",
            "multiplier_calculations",
            "quality_assessment",
            "validation_results",
            "mermaid_diagram"
        ]

        for output_type in output_types:
            if output_type in response_text or output_type.replace('_', ' ') in response_text:
                sources.append(output_type)

        return sources
