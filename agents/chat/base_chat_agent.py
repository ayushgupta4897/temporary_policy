"""
Base Chat Agent - Abstract base class for all specialized chat agents
Provides common 2-call architecture, web search, and response generation
"""

import sys
from pathlib import Path
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import json
import re
import time

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client

# ============================================================================
# CONSTANTS
# ============================================================================

# Timeout configuration (in seconds)
TIMEOUT_CONNECT = 15.0
TIMEOUT_READ = 600.0  # 10 minutes max
TIMEOUT_WRITE = 30.0
TIMEOUT_POOL = 60.0

# Token limits
MAX_COMPLETION_TOKENS_FAST = 4000
MAX_COMPLETION_TOKENS_RESEARCH = 15000

# Chat history limits
MAX_CHAT_HISTORY_TURNS = 5

# Error types
ERROR_TYPE_PROCESSING = "processing"

# Processing modes
MODE_FAST = "fast"
MODE_RESEARCH = "research"

# ============================================================================


class BaseChatAgent(ABC):
    """
    Abstract base class for specialized chat agents with 2-call architecture.

    Features:
    - Call 1: GPT-5 smart decision (returns answer OR search plan)
    - Call 2: gpt-4o-search-preview (web search + synthesis) - only if needed
    - Total time: 5-10s (fast) or 35-70s (research)

    Subclasses must implement:
    - get_system_prompt()
    - get_smart_decision_prompt()
    - get_combined_search_synthesis_prompt()
    - get_error_message()
    """

    def __init__(self):
        """Initialize base chat agent with multi-model configuration."""
        self.config = PolicyDrafterConfig()

        # Use centralized OpenAI client with custom timeout for chat
        timeout_config = {
            'connect': TIMEOUT_CONNECT,
            'read': TIMEOUT_READ,
            'write': TIMEOUT_WRITE,
            'pool': TIMEOUT_POOL
        }
        self.openai_manager = get_openai_client(timeout_config)

        # Multi-model strategy (optimized)
        self.fast_model = self.config.CHAT_FAST_MODEL  # O4-mini for simple lookups
        self.reasoning_model = self.config.CHAT_REASONING_MODEL  # GPT-5 for smart decisions
        self.search_model = self.config.CHAT_SEARCH_MODEL  # gpt-4o-search-preview for web search

        print(f"💬 {self.__class__.__name__} initialized (2-call max)")
        print(f"   🚀 Fast mode: {self.fast_model}")
        print(f"   🧠 Decision mode: {self.reasoning_model}")
        print(f"   🔍 Search mode: {self.search_model}")

    def generate_response(
        self,
        documents_content: str,
        chat_history: List[Dict[str, str]],
        user_message: str,
        enable_web_search: bool = True
    ) -> Dict[str, Any]:
        """
        Generate response with 2-call maximum architecture.

        Call 1: GPT-5 smart decision (fast answer OR search plan)
        Call 2: gpt-4o-search-preview (web search + synthesis) - only if needed

        Returns:
            Dict with response and metadata (max 2 LLM calls, 35-70 seconds for research)
        """
        start_time = time.time()

        try:
            # CALL 1: Smart Decision (GPT-5 with high reasoning)
            print(f"🧠 Call 1: GPT-5 smart decision on: {user_message[:80]}...")
            decision = self._smart_decision_call(user_message, documents_content, chat_history)

            print(f"   Decision: {decision['mode']} mode")
            print(f"   Reasoning: {decision['reasoning']}")

            # If FAST mode → Already have answer from Call 1
            if decision["mode"] == MODE_FAST:
                processing_time_ms = int((time.time() - start_time) * 1000)
                print(f"✅ Fast mode complete in {processing_time_ms}ms (1 LLM call)")

                return {
                    "response": decision["answer"],
                    "metadata": {
                        "mode": MODE_FAST,
                        "processingTimeMs": processing_time_ms,
                        "webSearchUsed": False,
                        "llmCalls": 1,
                        "documentSources": decision.get("document_sources", []),
                        "strategy": decision["reasoning"]
                    }
                }

            # If RESEARCH mode and web search enabled → Call 2
            if enable_web_search:
                print(f"🔬 Call 2: gpt-4o-search-preview with web search...")
                result = self._research_call(
                    decision["search_plan"],
                    documents_content,
                    user_message
                )

                processing_time_ms = int((time.time() - start_time) * 1000)
                print(f"✅ Research mode complete in {processing_time_ms}ms (2 LLM calls)")

                return {
                    "response": result["answer"],
                    "metadata": {
                        "mode": MODE_RESEARCH,
                        "processingTimeMs": processing_time_ms,
                        "webSearchUsed": True,
                        "llmCalls": 2,
                        "searchPlan": decision["search_plan"],
                        "citations": result["citations"],
                        "documentSources": decision.get("document_sources", []),
                        "strategy": decision["reasoning"]
                    }
                }
            else:
                # Research needed but web search disabled → fallback
                print(f"⚠️  Research mode needed but web search disabled")
                return self._fast_mode_response(documents_content, chat_history, user_message)

        except Exception as e:
            print(f"❌ Error generating chat response: {e}")
            import traceback
            traceback.print_exc()
            return {
                "response": self.get_error_message(ERROR_TYPE_PROCESSING),
                "metadata": {
                    "mode": "error",
                    "processingTimeMs": int((time.time() - start_time) * 1000),
                    "error": str(e),
                    "llmCalls": 0
                }
            }

    def _smart_decision_call(
        self,
        user_message: str,
        documents_content: str,
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        CALL 1: GPT-5 makes smart decision and returns answer OR search plan.

        Returns:
            {
                "mode": "fast" | "research",
                "reasoning": str,
                "answer": str (if fast mode),
                "search_plan": str (if research mode),
                "document_sources": List[str]
            }
        """
        prompt = self.get_smart_decision_prompt(
            user_message=user_message,
            documents_content=documents_content,
            chat_history=chat_history
        )

        try:
            response_text = self.openai_manager.responses_create_and_wait(
                model=self.reasoning_model,
                system_message="You are an intelligent assistant. Always return valid JSON.",
                user_message=prompt,
                reasoning={"effort": "high"}
            )

            # Parse JSON response
            decision = json.loads(response_text)
            return decision

        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parse error: {e}")
            print(f"   Raw response: {response_text[:200]}")
            # Fallback to fast mode with document-only answer
            return {
                "mode": MODE_FAST,
                "reasoning": "Failed to parse decision, using fast mode",
                "answer": self._fallback_answer(user_message, documents_content),
                "document_sources": []
            }
        except Exception as e:
            print(f"❌ Error in smart decision: {e}")
            raise

    def _research_call(
        self,
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> Dict[str, Any]:
        """
        CALL 2: gpt-4o-search-preview executes web search + synthesizes answer.

        Single combined call that replaces old 2-step process (search → synthesis).

        Returns:
            {
                "answer": str,
                "citations": List[Dict]
            }
        """
        prompt = self.get_combined_search_synthesis_prompt(
            search_plan=search_plan,
            documents_content=documents_content,
            user_message=user_message
        )

        try:
            # Call gpt-4o-search-preview with web_search_options (correct API)
            response = self.openai_manager.client.chat.completions.create(
                model=self.search_model,
                web_search_options={
                    "search_context_size": "high"
                },
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=MAX_COMPLETION_TOKENS_RESEARCH
            )

            answer_text = response.choices[0].message.content

            # Extract citations from answer
            citations = self._extract_web_citations(answer_text)

            print(f"   ✅ Web search completed ({len(citations)} citations found)")

            return {
                "answer": answer_text,
                "citations": citations
            }

        except Exception as e:
            print(f"⚠️ Web search failed: {e}")
            # Fallback to document-only answer
            return {
                "answer": f"I encountered an error during web search: {str(e)}\n\nBased on the available documents:\n\n{self._fallback_answer(user_message, documents_content)}",
                "citations": []
            }

    def _fast_mode_response(
        self,
        documents_content: str,
        chat_history: List[Dict[str, str]],
        user_message: str
    ) -> Dict[str, Any]:
        """
        Fallback: Quick document-only response using O4-mini.
        """
        print(f"⚡ Fallback to fast mode: Using {self.fast_model}")

        messages = self._build_context(documents_content, chat_history, user_message)

        try:
            response = self.openai_manager.chat_completion(
                model=self.fast_model,
                messages=messages,
                max_completion_tokens=MAX_COMPLETION_TOKENS_FAST
            )

            response_text = response.choices[0].message.content.strip()

            return {
                "response": response_text,
                "metadata": {
                    "mode": MODE_FAST,
                    "webSearchUsed": False,
                    "llmCalls": 1,
                    "documentSources": self._extract_document_sources(response_text),
                    "strategy": "Fallback fast mode"
                }
            }

        except Exception as e:
            print(f"❌ Fast mode failed: {e}")
            raise

    def _fallback_answer(self, user_message: str, documents_content: str) -> str:
        """Generate simple answer when JSON parsing fails."""
        return f"I apologize, but I encountered an issue processing your question: '{user_message}'. Please try rephrasing or ask a more specific question."

    def _extract_web_citations(self, answer_text: str) -> List[Dict[str, str]]:
        """
        Extract citations from answer text.
        Format: [Title](URL)
        """
        citations = []

        # Extract markdown links
        link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
        matches = re.findall(link_pattern, answer_text)

        for title, url in matches:
            if url.startswith('http'):
                citations.append({
                    "title": title,
                    "url": url,
                    "source_type": "web"
                })

        return citations

    def _extract_document_sources(self, response_text: str) -> List[str]:
        """Extract document filenames mentioned in response - must be implemented by subclasses."""
        return []

    def _build_context(
        self,
        documents_content: str,
        chat_history: List[Dict[str, str]],
        user_message: str
    ) -> List[Dict[str, str]]:
        """Build conversation context for the model."""
        messages = []

        # System message with document context
        system_prompt = self.get_system_prompt(documents_content)
        messages.append({"role": "system", "content": system_prompt})

        # Add recent chat history (last 5 turns)
        for turn in chat_history[-MAX_CHAT_HISTORY_TURNS:]:
            messages.append({"role": "user", "content": turn["userMessage"]})
            messages.append({"role": "assistant", "content": turn["assistantResponse"]})

        # Current user message
        messages.append({"role": "user", "content": user_message})

        return messages

    # ============================================================================
    # ABSTRACT METHODS - Must be implemented by subclasses
    # ============================================================================

    @abstractmethod
    def get_system_prompt(self, documents_content: str) -> str:
        """
        Generate the system prompt for this agent.

        Args:
            documents_content: Formatted content of all documents

        Returns:
            Complete system prompt with instructions and document context
        """
        pass

    @abstractmethod
    def get_smart_decision_prompt(
        self,
        user_message: str,
        documents_content: str,
        chat_history: List[Dict[str, str]]
    ) -> str:
        """
        Generate prompt for GPT-5 smart decision.

        Args:
            user_message: User's question
            documents_content: Formatted document context
            chat_history: Recent conversation history

        Returns:
            Prompt for decision-making (fast vs research mode)
        """
        pass

    @abstractmethod
    def get_combined_search_synthesis_prompt(
        self,
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> str:
        """
        Generate prompt for combined search and synthesis.

        Args:
            search_plan: Research plan from decision call
            documents_content: Formatted document context
            user_message: Original user question

        Returns:
            Prompt for web search and answer synthesis
        """
        pass

    @abstractmethod
    def get_error_message(self, error_type: str) -> str:
        """
        Get standardized error message for this agent.

        Args:
            error_type: Type of error (e.g., 'processing', 'not_found')

        Returns:
            User-friendly error message
        """
        pass

    @staticmethod
    @abstractmethod
    def format_documents_content(documents: Dict[str, str]) -> str:
        """
        Format documents specific to this agent type.

        Args:
            documents: Dict mapping document names to their content

        Returns:
            Formatted string with all documents
        """
        pass
