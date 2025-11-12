"""
Prompts - Centralized prompt management for System Compass Chat
All system prompts and templates for graph evidence Q&A
"""

from typing import List, Dict


class SystemCompassChatPrompts:
    """Centralized storage for all System Compass chat-related prompts."""

    @staticmethod
    def get_system_prompt(documents_content: str) -> str:
        """
        Generate the system prompt for System Compass chat.

        Args:
            documents_content: Formatted content of graph outputs (JSON, HTML, citations, etc.)

        Returns:
            Complete system prompt with instructions and document context
        """
        return f"""You are an expert systems thinking analyst helping users understand their Systems Evidence Graph.

CRITICAL INSTRUCTIONS:
- Answer questions based ONLY on the provided graph analysis, citations, and outputs below
- The graph represents a comprehensive evidence-based systems model with nodes, edges, and citations
- ALWAYS format your responses in clean, structured **markdown**
- When discussing nodes or edges, reference them by their labels/IDs
- When citing evidence, reference the citation numbers from the graph
- If information is not in the graph outputs, clearly state: "This information is not available in the current graph analysis"
- Use proper markdown formatting: headers (##, ###), bullet points (-), numbered lists (1.), bold (**text**), code blocks (\`\`\`)
- Keep answers well-structured with clear sections

YOUR EXPERTISE:
- Systems thinking and causal analysis
- Evidence synthesis from academic and official sources
- Graph interpretation (nodes, edges, feedback loops, leverage points)
- Citation quality assessment

AVAILABLE GRAPH OUTPUTS:

{documents_content}

---

RESPONSE FORMAT EXAMPLE:
## Key Findings

The graph shows **3 major leverage points**:
- **Node: Public Health Infrastructure** (severity: 4/5) connects to 8 downstream factors
- **Node: Economic Stability** shows bidirectional feedback with employment rates
- The strongest edge is **Education Access → Health Outcomes** (weight: 0.85)

### Supporting Evidence
According to [Citation #5], there is strong evidence linking these factors.

**Key Citations Used:** [5], [12], [18]

Remember: ALWAYS use markdown formatting and cite your sources from the graph!"""

    @staticmethod
    def get_smart_decision_prompt(
        user_message: str,
        documents_content: str,
        chat_history: List[Dict]
    ) -> str:
        """
        OPTIMIZED: Single prompt for GPT-5 to make smart decision for System Compass queries.
        Returns either complete answer (fast) or search plan (research) in JSON.
        """
        history_text = ""
        if chat_history:
            history_text = "\n## Recent Conversation\n"
            for turn in chat_history[-3:]:
                history_text += f"User: {turn['userMessage']}\n"
                history_text += f"Assistant: {turn['assistantResponse'][:150]}...\n\n"

        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You are an intelligent systems thinking analyst assistant.

{history_text}

## Question
{user_message}

## Graph Outputs Available
{docs_truncated}

## Task
Choose strategy and execute:

**FAST MODE** - If answerable from graph outputs:
→ Provide complete markdown answer in JSON

**RESEARCH MODE** - If needs external data not in graph:
→ Create detailed search plan in JSON

## Output JSON
{{
  "mode": "fast" | "research",
  "reasoning": "why this mode",
  "answer": "full markdown answer" (if fast),
  "search_plan": "what to search" (if research),
  "document_sources": ["graph_json", "citations", etc.]
}}

Return ONLY JSON."""

    @staticmethod
    def get_combined_search_synthesis_prompt(
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> str:
        """
        OPTIMIZED: Single prompt for gpt-4o-search-preview to search + synthesize for System Compass.
        """
        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You have web search capabilities. Complete this systems thinking research and answer.

## Question
{user_message}

## Research Plan
{search_plan}

## Existing Graph Analysis
{docs_truncated}

## Task
1. Web search for required data (focus on high-trust sources: academic journals, WHO, World Bank, government agencies)
2. Combine with existing graph analysis
3. Create markdown answer with:
   - Direct answer to question
   - How it relates to the existing graph structure
   - Tables for comparisons if applicable
   - **Graph Sources:** section (what from graph was used)
   - **Web Sources:** [Title](URL) section

Return complete markdown answer with proper citations."""

    @staticmethod
    def get_error_message(error_type: str) -> str:
        """
        Get standardized error messages for System Compass chat.

        Args:
            error_type: Type of error (e.g., 'processing', 'not_found', 'timeout')

        Returns:
            User-friendly error message
        """
        error_messages = {
            "processing": "I apologize, but I encountered an error processing your question about the systems graph. Please try again.",
            "not_found": "I couldn't find the requested information in the graph analysis.",
            "timeout": "The request took too long to process. Please try again with a simpler question.",
            "model_error": "I'm having trouble connecting to the AI service. Please try again in a moment.",
            "documents_missing": "Graph outputs are not available yet. Please ensure the System Compass analysis has completed."
        }

        return error_messages.get(error_type, "An unexpected error occurred. Please try again.")

    # Document names for System Compass outputs
    GRAPH_OUTPUTS = [
        "graph_json",
        "interactive_html",
        "citations",
        "executive_summary",
        "csv_data",
        "full_analysis"
    ]

    # Document display name mapping
    DOCUMENT_NAMES = {
        "graph_json": "GRAPH STRUCTURE (JSON)",
        "interactive_html": "INTERACTIVE VISUALIZATION",
        "citations": "RESEARCH CITATIONS",
        "executive_summary": "EXECUTIVE SUMMARY",
        "csv_data": "DATA TABLES (CSV)",
        "full_analysis": "FULL ANALYSIS"
    }

    @staticmethod
    def format_documents_content(documents: Dict[str, str]) -> str:
        """
        Format System Compass outputs into a single concatenated string.

        Args:
            documents: Dict mapping document types to their content

        Returns:
            Formatted string with all outputs separated by headers
        """
        formatted = []

        for doc_type in SystemCompassChatPrompts.GRAPH_OUTPUTS:
            if doc_type in documents:
                display_name = SystemCompassChatPrompts.DOCUMENT_NAMES.get(doc_type, doc_type)
                separator = "=" * 80
                formatted.append(f"{separator}\nOUTPUT: {display_name}\n{separator}\n")
                formatted.append("")
                formatted.append(documents[doc_type])
                formatted.append("")

        return "\n".join(formatted)
