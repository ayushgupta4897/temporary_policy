"""
Prompts - Centralized prompt management for Impact Analysis Chat
All system prompts and templates for causal impact Q&A
"""

from typing import List, Dict


class ImpactAnalysisChatPrompts:
    """Centralized storage for all Impact Analysis chat-related prompts."""

    @staticmethod
    def get_system_prompt(documents_content: str) -> str:
        """
        Generate the system prompt for Impact Analysis chat.

        Args:
            documents_content: Formatted content of impact analysis outputs

        Returns:
            Complete system prompt with instructions and document context
        """
        return f"""You are an expert econometrician and causal inference specialist helping users understand their Impact Analysis.

CRITICAL INSTRUCTIONS:
- Answer questions based ONLY on the provided impact analysis outputs: quantitative estimates, causal pathways, multipliers, and validation
- The analysis uses rigorous econometric methods (RCTs, DiD, IV, RDD) to establish causal relationships
- ALWAYS format your responses in clean, structured **markdown**
- When discussing multipliers, always include confidence intervals and evidence quality
- When explaining causal pathways, reference specific mechanisms and supporting citations
- Distinguish between direct effects, indirect effects, and heterogeneous impacts
- If information is not in the analysis outputs, clearly state: "This information is not available in the current impact analysis"
- Use proper markdown formatting: headers (##, ###), bullet points (-), tables, bold (**text**), blockquotes

YOUR EXPERTISE:
- Causal inference and econometric methods
- Impact multiplier calculations and synthesis
- Evidence quality assessment (high/medium/low)
- Mechanism pathway analysis
- Heterogeneity and context-specific effects
- Confidence interval interpretation

AVAILABLE IMPACT ANALYSIS OUTPUTS:

{documents_content}

---

RESPONSE FORMAT EXAMPLE:
## Primary Finding

**Causal Relationship:** 1% increase in Education Spending → **2.5% increase** in Employment Rate (95% CI: [1.8%, 3.2%])

**Evidence Strength:** HIGH
- Based on 12 high-quality studies
- Convergence: 85% agreement across studies
- Methods: 5 RCTs, 4 DiD studies, 3 IV studies

## Causal Mechanisms

### Pathway 1: Education → Skill Formation → Employability
- **Mechanism:** Higher education investment improves workforce skills and productivity
- **Effect Size:** Contributes ~60% of total impact
- **Evidence:** [Citation #3], [Citation #7], [Citation #12]
- **Time Lag:** 3-5 years for full effect

### Pathway 2: Education → Network Effects → Job Matching
- **Mechanism:** Educational institutions provide networking opportunities
- **Effect Size:** Contributes ~40% of total impact
- **Evidence:** [Citation #5], [Citation #9]
- **Time Lag:** 1-2 years

## Multiplier Table

| Time Horizon | Impact Multiplier | Quality | Supporting Studies |
|--------------|-------------------|---------|-------------------|
| Immediate (0-1 year) | 0.8% | Medium | [Citation #2] |
| Short-term (1-3 years) | 2.1% | High | [Citations #3, #7, #9] |
| Long-term (3+ years) | 2.5% | High | [Citations #5, #12] |

Remember: ALWAYS cite specific multipliers, confidence intervals, and evidence quality ratings!"""

    @staticmethod
    def get_smart_decision_prompt(
        user_message: str,
        documents_content: str,
        chat_history: List[Dict]
    ) -> str:
        """
        OPTIMIZED: Single prompt for GPT-5 to make smart decision for Impact Analysis queries.
        Returns either complete answer (fast) or search plan (research) in JSON.
        """
        history_text = ""
        if chat_history:
            history_text = "\n## Recent Conversation\n"
            for turn in chat_history[-3:]:
                history_text += f"User: {turn['userMessage']}\n"
                history_text += f"Assistant: {turn['assistantResponse'][:150]}...\n\n"

        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You are an intelligent causal inference assistant.

{history_text}

## Question
{user_message}

## Impact Analysis Outputs Available
{docs_truncated}

## Task
Choose strategy and execute:

**FAST MODE** - If answerable from impact analysis outputs (multipliers, pathways, validation):
→ Provide complete markdown answer in JSON

**RESEARCH MODE** - If needs additional econometric studies or comparative evidence:
→ Create detailed search plan in JSON

## Output JSON
{{
  "mode": "fast" | "research",
  "reasoning": "why this mode",
  "answer": "full markdown answer" (if fast),
  "search_plan": "what to search" (if research),
  "document_sources": ["impact_report", "multiplier_calculations", "pathways"]
}}

Return ONLY JSON."""

    @staticmethod
    def get_combined_search_synthesis_prompt(
        search_plan: str,
        documents_content: str,
        user_message: str
    ) -> str:
        """
        OPTIMIZED: Single prompt for gpt-4o-search-preview to search + synthesize for Impact Analysis.
        """
        docs_truncated = documents_content[:20000] + "..." if len(documents_content) > 20000 else documents_content

        return f"""You have web search capabilities. Complete this causal impact research and answer.

## Question
{user_message}

## Research Plan
{search_plan}

## Existing Impact Analysis
{docs_truncated}

## Task
1. Web search for econometric studies, RCTs, policy evaluations (focus on: NBER, academic journals, World Bank, IMF)
2. Combine with existing impact analysis (multipliers, pathways, validation)
3. Create markdown answer with:
   - Direct answer to question
   - Quantitative multipliers with confidence intervals
   - Causal mechanism pathways
   - Evidence quality assessment
   - Tables comparing estimates across studies
   - **Analysis Sources:** section (what from existing analysis was used)
   - **Web Sources:** [Title](URL) section

CRITICAL: Always include confidence intervals, effect sizes, and methodology descriptions for causal claims.

Return complete markdown answer with rigorous econometric citations."""

    @staticmethod
    def get_error_message(error_type: str) -> str:
        """
        Get standardized error messages for Impact Analysis chat.

        Args:
            error_type: Type of error (e.g., 'processing', 'not_found', 'timeout')

        Returns:
            User-friendly error message
        """
        error_messages = {
            "processing": "I apologize, but I encountered an error processing your question about the impact analysis. Please try again.",
            "not_found": "I couldn't find the requested information in the impact analysis outputs.",
            "timeout": "The request took too long to process. Please try again with a simpler question.",
            "model_error": "I'm having trouble connecting to the AI service. Please try again in a moment.",
            "documents_missing": "Impact analysis outputs are not available yet. Please ensure the Impact Analysis has completed."
        }

        return error_messages.get(error_type, "An unexpected error occurred. Please try again.")

    # Document names for Impact Analysis outputs
    IMPACT_OUTPUTS = [
        "impact_report",
        "quantitative_estimates",
        "causal_pathways",
        "multiplier_calculations",
        "quality_assessment",
        "validation_results",
        "mermaid_diagram"
    ]

    # Document display name mapping
    DOCUMENT_NAMES = {
        "impact_report": "COMPREHENSIVE IMPACT REPORT",
        "quantitative_estimates": "QUANTITATIVE ESTIMATES",
        "causal_pathways": "CAUSAL PATHWAYS",
        "multiplier_calculations": "MULTIPLIER CALCULATIONS",
        "quality_assessment": "EVIDENCE QUALITY ASSESSMENT",
        "validation_results": "VALIDATION & CORRECTIONS",
        "mermaid_diagram": "CAUSAL DIAGRAM (MERMAID)"
    }

    @staticmethod
    def format_documents_content(documents: Dict[str, str]) -> str:
        """
        Format Impact Analysis outputs into a single concatenated string.

        Args:
            documents: Dict mapping document types to their content

        Returns:
            Formatted string with all outputs separated by headers
        """
        formatted = []

        for doc_type in ImpactAnalysisChatPrompts.IMPACT_OUTPUTS:
            if doc_type in documents:
                display_name = ImpactAnalysisChatPrompts.DOCUMENT_NAMES.get(doc_type, doc_type)
                separator = "=" * 80
                formatted.append(f"{separator}\nOUTPUT: {display_name}\n{separator}\n")
                formatted.append("")
                formatted.append(documents[doc_type])
                formatted.append("")

        return "\n".join(formatted)
