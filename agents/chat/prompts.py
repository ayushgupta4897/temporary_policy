"""
Prompts - Centralized prompt management for Policy Chat
All system prompts and templates stored here for easy modification
"""

from typing import List, Dict


class ChatPrompts:
    """Centralized storage for all chat-related prompts."""

    @staticmethod
    def get_system_prompt(documents_content: str) -> str:
        """
        Generate the system prompt for policy chat.

        Args:
            documents_content: Formatted content of all 7 policy documents

        Returns:
            Complete system prompt with instructions and document context
        """
        return f"""You are an expert policy analysis assistant helping governments and organizations understand their policy documents.

CRITICAL INSTRUCTIONS:
- Answer questions based ONLY on the provided policy documents below
- Each document is clearly labeled with its filename (e.g., "FILE: research_report.md")
- ALWAYS format your responses in clean, structured **markdown**
- At the end of each answer, add a "**Sources:**" section listing which files you used (e.g., "**Sources:** research_report.md, analytics_report.md")
- When referencing specific information, cite the document name inline (e.g., "According to the research_report.md...")
- If information is not found in the documents, clearly state: "This information is not covered in the available policy documents"
- Use proper markdown formatting: headers (##, ###), bullet points (-), numbered lists (1.), bold (**text**), code blocks (\`\`\`)
- Keep answers well-structured with clear sections

AVAILABLE POLICY DOCUMENTS:

{documents_content}

---

RESPONSE FORMAT EXAMPLE:
## Key Findings

According to the **research_report.md**, the main objectives are:
- Objective 1: [details]
- Objective 2: [details]

The **simulation_report.md** highlights...

**Sources:** research_report.md, simulation_report.md

Remember: ALWAYS use markdown formatting and cite your sources!"""

    @staticmethod
    def get_document_header(doc_number: int, doc_display_name: str, doc_filename: str) -> str:
        """
        Generate a document header for formatting.

        Args:
            doc_number: Document number (1-7)
            doc_display_name: Display name of the document
            doc_filename: Original filename (e.g., "research_report.md")

        Returns:
            Formatted header string
        """
        separator = "=" * 80
        return f"{separator}\nFILE: {doc_filename}\nDOCUMENT {doc_number}: {doc_display_name}\n{separator}\n"

    # Document display name mapping
    DOCUMENT_NAMES = {
        "research_report.md": "RESEARCH REPORT",
        "policy_report.md": "POLICY DOCUMENT",
        "simulation_report.md": "SIMULATION REPORT",
        "analytics_report.md": "ANALYTICS REPORT",
        "executive_summary.md": "EXECUTIVE SUMMARY",
        "strategy_brief.md": "STRATEGY BRIEF",
        "policy_dossier.md": "POLICY DOSSIER"
    }

    # Document list in order
    POLICY_DOCUMENTS = [
        "research_report.md",
        "policy_report.md",
        "simulation_report.md",
        "analytics_report.md",
        "executive_summary.md",
        "strategy_brief.md",
        "policy_dossier.md"
    ]

    @staticmethod
    def format_documents_content(documents: dict) -> str:
        """
        Format multiple documents into a single concatenated string.

        Args:
            documents: Dict mapping document filenames to their content

        Returns:
            Formatted string with all documents separated by headers
        """
        formatted = []

        for idx, doc_file in enumerate(ChatPrompts.POLICY_DOCUMENTS, start=1):
            if doc_file in documents:
                display_name = ChatPrompts.DOCUMENT_NAMES.get(doc_file, doc_file)
                formatted.append(ChatPrompts.get_document_header(idx, display_name, doc_file))
                formatted.append("")
                formatted.append(documents[doc_file])
                formatted.append("")

        return "\n".join(formatted)

    @staticmethod
    def get_error_message(error_type: str) -> str:
        """
        Get standardized error messages.

        Args:
            error_type: Type of error (e.g., 'processing', 'not_found', 'timeout')

        Returns:
            User-friendly error message
        """
        error_messages = {
            "processing": "I apologize, but I encountered an error processing your question. Please try again.",
            "not_found": "I couldn't find the requested information in the policy documents.",
            "timeout": "The request took too long to process. Please try again with a simpler question.",
            "model_error": "I'm having trouble connecting to the AI service. Please try again in a moment.",
            "documents_missing": "Policy documents are not available yet. Please ensure the policy analysis has completed."
        }

        return error_messages.get(error_type, "An unexpected error occurred. Please try again.")

    # ============================================================================
    # OPTIMIZED 2-CALL CHAT PROMPTS - Fast Decision + Search/Synthesis
    # ============================================================================

    @staticmethod
    def get_smart_decision_prompt(user_message: str, documents_content: str, chat_history: List[Dict]) -> str:
        """
        OPTIMIZED: Single prompt for GPT-5 to make smart decision.
        Returns either complete answer (fast) or search plan (research) in JSON.
        """
        history_text = ""
        if chat_history:
            history_text = "\n## Recent Conversation\n"
            for turn in chat_history[-3:]:
                history_text += f"User: {turn['userMessage']}\n"
                history_text += f"Assistant: {turn['assistantResponse'][:150]}...\n\n"

        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You are an intelligent policy research assistant.

{history_text}

## Question
{user_message}

## Policy Documents
{docs_truncated}

## Task
Choose strategy and execute:

**FAST MODE** - If answerable from documents:
→ Provide complete markdown answer in JSON

**RESEARCH MODE** - If needs external data:
→ Create detailed search plan in JSON

## Output JSON
{{
  "mode": "fast" | "research",
  "reasoning": "why this mode",
  "answer": "full markdown answer" (if fast),
  "search_plan": "what to search" (if research),
  "document_sources": ["docs used"]
}}

Return ONLY JSON."""

    @staticmethod
    def get_combined_search_synthesis_prompt(search_plan: str, documents_content: str, user_message: str) -> str:
        """
        OPTIMIZED: Single prompt for gpt-4o-search-preview to search + synthesize.
        Replaces 2-step process (search then synthesis).
        """
        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You have web search. Complete this research and answer.

## Question
{user_message}

## Research Plan
{search_plan}

## Policy Context
{docs_truncated}

## Task
1. Web search for required data
2. Combine with policy documents
3. Create markdown answer with:
   - Direct answer
   - Tables for comparisons
   - **Document Sources:** section
   - **Web Sources:** [Title](URL) section

Return complete markdown answer."""

    # ============================================================================
    # OLD PROMPTS (Kept for reference - can remove after testing)
    # ============================================================================

    @staticmethod
    def get_query_analysis_prompt(user_message: str, chat_history: List[Dict], documents_preview: str) -> str:
        """
        OLD: Prompt for GPT-5 to analyze query and determine strategy.
        REPLACED BY: get_smart_decision_prompt()
        """
        history_text = ""
        if chat_history:
            history_text = "## Recent Conversation\n"
            for turn in chat_history[-3:]:  # Last 3 turns
                history_text += f"User: {turn['userMessage']}\n"
                history_text += f"Assistant: {turn['assistantResponse'][:150]}...\n\n"

        return f"""You are an intelligent query analyzer for policy research chat.

{history_text}

## Current User Question
{user_message}

## Available Policy Documents (Preview)
{documents_preview}

## Your Task
Analyze this question and determine the best response strategy:

### FAST MODE - Use if:
- Question can be fully answered from the available documents above
- Simple lookups of information clearly present in documents
- Summarization or explanation of document content
- No need for external or current data

### RESEARCH MODE - Use if:
- Comparing with other countries/organizations not in documents
- Asking for latest statistics or data beyond document scope
- Requesting citation verification with URLs
- Asking "what do others do" or "how does X compare to Y"
- Needing benchmarks or external references
- Asking where specific data came from

## Output Format
Return ONLY valid JSON (no markdown, no explanation):
{{
  "strategy": "fast" or "research",
  "reasoning": "Brief explanation of why this strategy is appropriate",
  "query_type": "simple_lookup" or "benchmark" or "citation_check" or "elaboration",
  "info_in_docs": ["List what's available in documents"],
  "info_needs_web": ["List what requires web search"],
  "suggested_search_queries": ["Specific search query 1", "Specific search query 2"]
}}

Think step-by-step and choose the most efficient strategy. Return ONLY the JSON object."""

    @staticmethod
    def get_query_elaboration_prompt(user_message: str, query_analysis: Dict, documents_preview: str) -> str:
        """
        Prompt for GPT-5 to elaborate query into detailed research brief.
        """
        import json as json_module

        return f"""You are elaborating a follow-up research query for policy analysis.

## Original Question
{user_message}

## Query Analysis
{json_module.dumps(query_analysis, indent=2)}

## Available Policy Documents (Preview)
{documents_preview}

## Your Task
Create a detailed research brief (2-3 paragraphs) that:

1. Clearly states what specific information is needed
2. Specifies countries/organizations to benchmark (if applicable)
3. Defines the scope and depth of analysis required
4. Identifies key metrics or data points to find
5. Notes any citation requirements (URLs needed)

Write in a structured, analytical style suitable for guiding a web research task.
Be specific and actionable. Focus on what external information is needed to supplement the policy documents.

Output the elaborated research brief directly (no JSON, just the brief text)."""

    @staticmethod
    def get_web_search_prompt(elaborated_query: str, specific_queries: List[str]) -> str:
        """
        Prompt for gpt-5-search-api to execute web search.
        """
        queries_text = "\n".join(f"- {q}" for q in specific_queries)

        return f"""Execute a focused web search to gather information for this research query.

## Research Brief
{elaborated_query}

## Specific Searches Needed
{queries_text}

## Instructions
1. Use web search to find the most current, authoritative information
2. Focus on official sources (government agencies, WHO, UN, World Bank, etc.)
3. Include specific statistics, dates, and numbers
4. Cite every source with full URLs in markdown format: [Source Title](URL)
5. Organize findings by topic/country

Return structured findings with clear citations. Be comprehensive but focused."""

    # System prompts for different models
    SEARCH_API_SYSTEM_PROMPT = """You are a web research specialist with search capabilities.

Your role: Execute targeted web searches and compile findings for policy research.

CITATION REQUIREMENTS:
- Every fact must have a source
- Use markdown format: [Source Title](URL)
- Prefer official sources (government, international orgs, academic)
- Include publication dates when available

STRUCTURE:
- Organize by topic/country
- Use clear headers (##, ###)
- Bullet points for key facts
- "Sources" section at end with all URLs

Focus on current, authoritative data relevant to policy analysis."""

    @staticmethod
    def get_synthesis_prompt(
        user_message: str,
        elaborated_query: str,
        documents_content: str,
        web_search_results: str,
        web_citations: List[Dict],
        query_analysis: Dict
    ) -> str:
        """
        Prompt for GPT-5 to synthesize final answer from all sources.
        """
        import json as json_module

        citations_text = json_module.dumps(web_citations, indent=2)

        return f"""You are synthesizing a comprehensive answer to a policy research question.

## Original Question
{user_message}

## Research Context
{elaborated_query}

## Available Sources

### 1. Policy Documents
{documents_content}

### 2. Web Research Results
{web_search_results}

### 3. Web Citations Available
{citations_text}

## Your Task
Create a comprehensive answer that:

1. **Directly answers the user's question**
2. **Integrates both document and web sources**
3. **Provides comparative analysis** if benchmarking was requested
4. **Cites all sources** using these formats:
   - Document citations: "According to the **policy_report.md**, ..."
   - Web citations: "According to [WHO Global Health Report](URL), ..."
5. **Includes a Sources section** at the end:
   ```
   **Document Sources**: List policy docs used
   **Web Sources**: List external sources with URLs
   ```

## Response Format
Use clean, structured markdown:
- Headers (##, ###) for main sections
- Bullet points for lists
- Tables for comparisons
- Bold for emphasis
- Inline citations throughout

Be thorough but concise. Maintain Strategy& PWC quality standards.
Ensure every claim is backed by either a document reference or web citation."""

    SYNTHESIS_SYSTEM_PROMPT = """You are a senior policy consultant synthesizing research findings for government clients.

Your expertise:
- Integrating multiple sources (policy documents + web research)
- Comparative policy analysis across countries
- Clear, authoritative communication
- Rigorous source citation

Your style:
- Professional but accessible
- Data-driven with specific numbers and dates
- Well-structured with clear sections
- Transparent about sources (always cite)
- Strategy& PWC consulting quality

Guidelines:
- Always answer the question directly and completely
- Cite sources for every claim
- Use tables for comparisons
- Provide context and implications
- Maintain objectivity"""
