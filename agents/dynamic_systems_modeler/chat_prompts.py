"""
Prompts - Centralized prompt management for Dynamic Systems Modeler Chat
All system prompts and templates for DSM taxonomy and intervention Q&A
"""

from typing import List, Dict


class DSMChatPrompts:
    """Centralized storage for all Dynamic Systems Modeler chat-related prompts."""

    @staticmethod
    def get_system_prompt(documents_content: str) -> str:
        """
        Generate the system prompt for DSM chat.

        Args:
            documents_content: Formatted content of DSM outputs (base graph, interventions, taxonomy, etc.)

        Returns:
            Complete system prompt with instructions and document context
        """
        return f"""You are an expert systems modeler and intervention analyst helping users understand their Dynamic Systems Model.

CRITICAL INSTRUCTIONS:
- Answer questions based ONLY on the provided DSM outputs: taxonomy, base graph, intervention scenarios, and delta analysis
- The model uses custom user-defined taxonomy to build interconnected systems graphs
- ALWAYS format your responses in clean, structured **markdown**
- When discussing taxonomy, reference the parent categories and child nodes
- When comparing scenarios, use the delta analysis to show quantitative changes
- Explain intervention impacts using mechanism pathways and evidence
- If information is not in the DSM outputs, clearly state: "This information is not available in the current model"
- Use proper markdown formatting: headers (##, ###), bullet points (-), numbered lists (1.), bold (**text**), tables, code blocks

YOUR EXPERTISE:
- Custom taxonomy design and systems modeling
- Intervention scenario analysis and impact prediction
- Delta calculations and comparative analysis
- Evidence-based mechanism pathways
- Node and edge interpretation (types, weights, relationships)

AVAILABLE DSM OUTPUTS:

{documents_content}

---

RESPONSE FORMAT EXAMPLE:
## Taxonomy Overview

The model uses **4 parent categories** with **32 child nodes**:
- **Healthcare Access** (8 child factors)
- **Economic Drivers** (12 child factors)
- **Social Determinants** (7 child factors)
- **Environmental Factors** (5 child factors)

## Intervention Impact

The intervention **"GLP-1 Drug Approval"** affects **12 nodes** with an average weight change of **-0.14**:

| Node | Base KPI | Intervention KPI | % Change |
|------|----------|------------------|----------|
| Obesity Rate | 42.4% | 38.2% | -9.9% |
| Healthcare Costs | $2,400 | $2,100 | -12.5% |

**Key Mechanism:** GLP-1 drugs reduce appetite → lower caloric intake → sustained weight loss

Remember: ALWAYS use markdown formatting and cite specific nodes, edges, and delta values!"""

    @staticmethod
    def get_smart_decision_prompt(
        user_message: str,
        documents_content: str,
        chat_history: List[Dict]
    ) -> str:
        """
        OPTIMIZED: Single prompt for GPT-5 to make smart decision for DSM queries.
        Returns either complete answer (fast) or search plan (research) in JSON.
        """
        history_text = ""
        if chat_history:
            history_text = "\n## Recent Conversation\n"
            for turn in chat_history[-3:]:
                history_text += f"User: {turn['userMessage']}\n"
                history_text += f"Assistant: {turn['assistantResponse'][:150]}...\n\n"

        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You are an intelligent systems modeling assistant.

{history_text}

## Question
{user_message}

## DSM Outputs Available
{docs_truncated}

## Task
Choose strategy and execute:

**FAST MODE** - If answerable from DSM outputs (taxonomy, base graph, intervention scenarios):
→ Provide complete markdown answer in JSON

**RESEARCH MODE** - If needs external intervention evidence or comparative data:
→ Create detailed search plan in JSON

## Output JSON
{{
  "mode": "fast" | "research",
  "reasoning": "why this mode",
  "answer": "full markdown answer" (if fast),
  "search_plan": "what to search" (if research),
  "document_sources": ["base_graph", "intervention_scenarios", "taxonomy"]
}}

Return ONLY JSON."""

    @staticmethod
    def get_combined_search_synthesis_prompt(
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> str:
        """
        OPTIMIZED: Single prompt for gpt-4o-search-preview to search + synthesize for DSM.
        """
        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You have web search capabilities. Complete this systems modeling research and answer.

## Question
{user_message}

## Research Plan
{search_plan}

## Existing DSM Analysis
{docs_truncated}

## Task
1. Web search for intervention evidence, impact studies, or comparative data (focus on: RCTs, policy evaluations, econometric studies)
2. Combine with existing DSM outputs (taxonomy, base graph, interventions)
3. Create markdown answer with:
   - Direct answer to question
   - How it relates to the DSM model structure
   - Quantitative impact estimates if available
   - Tables for delta comparisons if applicable
   - **Model Sources:** section (what from DSM was used)
   - **Web Sources:** [Title](URL) section

Return complete markdown answer with proper citations and delta analysis where relevant."""

    @staticmethod
    def get_error_message(error_type: str) -> str:
        """
        Get standardized error messages for DSM chat.

        Args:
            error_type: Type of error (e.g., 'processing', 'not_found', 'timeout')

        Returns:
            User-friendly error message
        """
        error_messages = {
            "processing": "I apologize, but I encountered an error processing your question about the systems model. Please try again.",
            "not_found": "I couldn't find the requested information in the DSM analysis.",
            "timeout": "The request took too long to process. Please try again with a simpler question.",
            "model_error": "I'm having trouble connecting to the AI service. Please try again in a moment.",
            "documents_missing": "DSM outputs are not available yet. Please ensure the Dynamic Systems Modeler analysis has completed."
        }

        return error_messages.get(error_type, "An unexpected error occurred. Please try again.")

    # Document names for DSM outputs
    DSM_OUTPUTS = [
        "taxonomy",
        "base_graph",
        "intervention_scenarios",
        "delta_analysis",
        "interactive_html"
    ]

    # Document display name mapping
    DOCUMENT_NAMES = {
        "taxonomy": "CUSTOM TAXONOMY",
        "base_graph": "BASE GRAPH STRUCTURE",
        "intervention_scenarios": "INTERVENTION SCENARIOS",
        "delta_analysis": "DELTA ANALYSIS",
        "interactive_html": "INTERACTIVE VISUALIZATION"
    }

    @staticmethod
    def format_documents_content(documents: Dict[str, str]) -> str:
        """
        Format DSM outputs into a single concatenated string.

        Args:
            documents: Dict mapping document types to their content

        Returns:
            Formatted string with all outputs separated by headers
        """
        formatted = []

        for doc_type in DSMChatPrompts.DSM_OUTPUTS:
            if doc_type in documents:
                display_name = DSMChatPrompts.DOCUMENT_NAMES.get(doc_type, doc_type)
                separator = "=" * 80
                formatted.append(f"{separator}\nOUTPUT: {display_name}\n{separator}\n")
                formatted.append("")
                formatted.append(documents[doc_type])
                formatted.append("")

        return "\n".join(formatted)
