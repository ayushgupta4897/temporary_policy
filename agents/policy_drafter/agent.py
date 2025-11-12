import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import sys
import os

from config.app_config import PolicyDrafterConfig, AgentRoles
from .prompts import PolicyPrompts
from .report_templates import ReportTemplates
from clients.openai_deep_research_client import OpenAIDeepResearchClient
from clients.openai_client import get_openai_client

# ============================================================================
# CONSTANTS
# ============================================================================

# Retry and fallback settings
MAX_RETRIES = 2
ENABLE_REASONING = True
ENABLE_REASONING_OFF = False

# Token limits
MAX_COMPLETION_TOKENS_ELABORATION = 15000
MAX_COMPLETION_TOKENS_CITATION = 38000

# Timeout settings (in minutes)
DEEP_RESEARCH_TIMEOUT_MINUTES = 180
MAX_WAIT_TIME_SECONDS = 10800  # 180 minutes in seconds

# Polling settings (in seconds)
INITIAL_POLL_INTERVAL = 30
MAX_POLL_INTERVAL = 120
POLL_INTERVAL_MULTIPLIER = 1.2

# Batch processing settings
CITATION_BATCH_SIZE = 10

# File naming patterns
RESEARCH_REPORT_FILENAME_PATTERN = "deep_research_report_{}.md"
POLICY_REPORT_FILENAME_PATTERN = "policy_document_report_{}.md"
SIMULATION_REPORT_FILENAME_PATTERN = "simulation_report_{}.md"
ANALYTICS_REPORT_FILENAME_PATTERN = "data_analytics_report_{}.md"

# Report messages and formatting
SYSTEM_MESSAGE_POLICY_CONSULTANT = "You are a senior policy consultant at Strategy& PWC."
SYSTEM_MESSAGE_POLICY_ADVISOR = "You are a senior policy advisor at Strategy& PWC, expert in drafting comprehensive policy documents."
SYSTEM_MESSAGE_RESEARCH_ANALYST = "You are a senior research quality analyst at Strategy& PWC specializing in source verification and content analysis."
SYSTEM_MESSAGE_RISK_ANALYST = "You are a senior strategic risk analyst and policy simulation specialist at Strategy& PWC with expertise in scenario planning, risk assessment, and implementation modeling."
SYSTEM_MESSAGE_DATA_ANALYST = "You are a senior policy data analyst and research director at Strategy& PWC, specializing in quantitative policy analysis and visual data presentation."

# Display messages
MSG_INITIALIZATION_SUCCESS = "🚀 Policy Drafting Agent initialized successfully"
MSG_READY = "🏛️  Ready to draft policies for governments and organizations"
MSG_STAGE_1 = "\n📋 Stage 1: Policy Elaboration"
MSG_STAGE_2 = "\n🔍 Stage 2: Deep Research Analysis"
MSG_STAGE_2_ASYNC = "\n🔍 Stage 2: Deep Research Analysis (Async)"
MSG_STAGE_2_5 = "\n🔍 Stage 2.5: Detailed Citation Analysis"
MSG_STAGE_3 = "\n📝 Stage 3: Policy Document Drafting"
MSG_STAGE_4 = "\n🎯 Stage 4: Policy Scenario Simulations"
MSG_STAGE_5 = "\n📊 Stage 5: Data Analytics Report Generation"
MSG_QUERY = "🎯 Query: {}"
MSG_AGENT = "🤖 Agent: {}"
MSG_ELABORATION_SUCCESS = "✅ Policy elaboration completed successfully"
MSG_RESEARCH_SUCCESS = "✅ Deep research completed - Found {} citations"
MSG_RESEARCH_STARTED = "🚀 Deep research started asynchronously (Task ID: {}...)"
MSG_RESEARCH_RETRIEVED = "✅ Deep research retrieved - Found {} citations"
MSG_AZURE_DETECTED = "🌐 Azure environment detected - using async deep research with polling"
MSG_LOCAL_DETECTED = "🖥️  Local environment detected - using synchronous deep research"
MSG_POLLING_START = "⏳ Polling for deep research completion (max wait: {} minutes)"
MSG_ASYNC_RESEARCH_COMPLETE = "✅ Async deep research completed in {} seconds"
MSG_CITATION_ANALYSIS_BATCH = "📊 Analyzing {} citations in batches of {}"
MSG_BATCH_PROCESSING = "  📦 Processing batch {}/{} ({} citations)"
MSG_CITATION_ANALYSIS_SUCCESS = "✅ Detailed citation analysis completed for {} sources"
MSG_DRAFT_SUCCESS = "✅ Policy document drafted successfully"
MSG_SIMULATION_PROMPT = "🔮 Generating 5 detailed implementation scenarios"
MSG_SIMULATION_SUCCESS = "✅ Policy scenario simulations completed successfully"
MSG_SCENARIOS_GENERATED = "  📊 Generated {} detailed scenarios"
MSG_SCENARIO_TYPES = "  🎭 Scenarios: Best-Case, Most Likely, Worst-Case, Resistance, Resource Constraint"
MSG_ANALYTICS_PROMPT = "📈 Generating comprehensive data-driven policy analysis"
MSG_ANALYTICS_SUCCESS = "✅ Data analytics report generated successfully"
MSG_ANALYTICS_STATS = "  📋 Report contains {} data tables and {} visual elements"
MSG_GENERATING_REPORTS = "\n📊 Generating Final Reports"
MSG_GENERATING_RESEARCH_REPORT = "\n📊 Generating Research Report"
MSG_RESEARCH_REPORT_GENERATED = "✅ Deep research report generated: {}"
MSG_POLICY_REPORT_GENERATED = "✅ Policy document report generated: {}"
MSG_SIMULATION_REPORT_GENERATED = "✅ Simulation analysis report generated: {}"
MSG_ANALYTICS_REPORT_GENERATED = "✅ Data analytics report generated: {}"

# Pipeline messages
PIPELINE_HEADER = "="*80
PIPELINE_TITLE_RESEARCH = "🏛️  STRATEGY& PWC - AI POLICY RESEARCH SYSTEM"
PIPELINE_TITLE_COMPLETE = "🏛️  STRATEGY& PWC - AI POLICY DRAFTING SYSTEM"
PIPELINE_REQUEST = "📝 Request: {}"
PIPELINE_STARTED = "⏰ Started: {}"
PIPELINE_MODE_RESEARCH = "🔍 Mode: Research Only (Steps 1-2)"
PIPELINE_COMPLETE_RESEARCH = "🎉 POLICY RESEARCH COMPLETED SUCCESSFULLY!"
PIPELINE_COMPLETE_FULL = "🎉 POLICY DRAFTING & ANALYTICS COMPLETED SUCCESSFULLY!"
PIPELINE_RESEARCH_SAVED = "📊 Research report saved to: {}"
PIPELINE_POLICY_SAVED = "📄 Policy document saved to: {}"
PIPELINE_SIMULATION_SAVED = "🔮 Simulation analysis saved to: {}"
PIPELINE_ANALYTICS_SAVED = "📈 Data analytics report saved to: {}"

# Date/time formats
DATETIME_FORMAT_DISPLAY = '%Y-%m-%d %H:%M:%S'
DATETIME_FORMAT_REPORT = '%B %d, %Y at %I:%M %p'

# Status tracking
STATUS_COMPLETED = 'completed'
STATUS_FAILED = 'failed'
STATUS_IN_PROGRESS = 'in_progress'

# Progress messages
PROGRESS_STATUS_TEMPLATE = "   Status: {} | Elapsed: {}s | Progress: {} updates"

# Error messages
ERROR_RESEARCH_TASK = "Research task error: {}"
ERROR_NO_RESULT = "Research completed but no result available"
ERROR_RESEARCH_FAILED = "Deep research failed: {}"
ERROR_RESEARCH_TIMEOUT = "Deep research timed out after {} minutes"

# Citation formatting
CITATION_SEPARATOR = "---"
CITATION_INDEX_TRUNCATE = 8
NO_CITATIONS_MSG = "No citations available"
NO_CITATIONS_REPORT = "No citations were found during research."
BASIC_CITATION_MSG = "Basic citation information only.\n\n"

# Counting thresholds
TABLE_COUNT_DIVISOR = 10
SCENARIO_COUNT_MARKER = "### Scenario Name:"

# Sample query for testing
SAMPLE_QUERY = "I have to draft a policy for Government of Saudi Arabia for health department for infants up to 24 months"

# Success messages for main()
SUCCESS_HEADER = "\n🎯 SUCCESS! Reports generated:"
SUCCESS_RESEARCH = "📊 Research Report: {}"
SUCCESS_POLICY = "📄 Policy Document: {}"
SUCCESS_SIMULATION = "🔮 Simulation Analysis: {}"
SUCCESS_ANALYTICS = "📈 Data Analytics Report: {}"

# ============================================================================

class PolicyDraftingAgent:
    """Main orchestrator for the AI-powered policy drafting system."""
    
    def __init__(self):
        """Initialize the policy drafting system."""
        self.config = PolicyDrafterConfig()
        self.prompts = PolicyPrompts()

        # Use centralized OpenAI client
        self.openai_manager = get_openai_client()
        self.deep_research_client = OpenAIDeepResearchClient()

        # Ensure output directory exists
        Path(self.config.OUTPUT_DIR).mkdir(exist_ok=True)

        print(MSG_INITIALIZATION_SUCCESS)
        print(MSG_READY)
    
    def elaborate_query(self, user_query: str) -> str:
        print(MSG_STAGE_1)
        print(MSG_QUERY.format(user_query))
        print(MSG_AGENT.format(AgentRoles.ELABORATION_AGENT['name']))

        prompt = self.prompts.ELABORATION_PROMPT.format(user_query=user_query)

        response = self.openai_manager.responses_create_and_wait(
            model=self.config.O3_MODEL,
            system_message=SYSTEM_MESSAGE_POLICY_CONSULTANT,
            user_message=prompt,
        )

        print(MSG_ELABORATION_SUCCESS)
        return response
    
    def start_deep_research_async(self, elaboration: str, original_query: str) -> str:
        """Start deep research asynchronously and return task ID."""
        print(MSG_STAGE_2_ASYNC)
        print(MSG_AGENT.format(AgentRoles.RESEARCH_AGENT['name']))

        research_query = self.prompts.RESEARCH_QUERY_TEMPLATE.format(
            original_query=original_query,
            elaboration=elaboration
        )

        # Start async research
        task_id = self.deep_research_client.start_async_research(
            user_query=research_query,
            system_message=self.prompts.RESEARCH_SYSTEM_PROMPT,
            timeout_minutes=DEEP_RESEARCH_TIMEOUT_MINUTES
        )

        print(MSG_RESEARCH_STARTED.format(task_id[:CITATION_INDEX_TRUNCATE]))
        return task_id
    
    def get_deep_research_status(self, task_id: str) -> Dict[str, Any]:
        """Get status of async deep research task."""
        return self.deep_research_client.get_research_status(task_id)
    
    def get_deep_research_result(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get completed deep research result."""
        response = self.deep_research_client.get_research_result(task_id)
        if response is None:
            return None

        # Extract research content
        research_content = self.deep_research_client.get_final_report(response)
        citations = self.deep_research_client.get_citations(response)

        print(MSG_RESEARCH_RETRIEVED.format(len(citations)))

        return {
            "content": research_content,
            "citations": citations,
            "raw_response": response
        }

    def _conduct_deep_research_with_azure_handling(self, elaboration: str, original_query: str) -> Dict[str, Any]:
        return self._conduct_deep_research_async_with_polling(elaboration, original_query)

    
    def _conduct_deep_research_async_with_polling(self, elaboration: str, original_query: str) -> Dict[str, Any]:
        """Conduct deep research asynchronously with internal polling for Azure."""
        import time

        # Start async research
        task_id = self.start_deep_research_async(elaboration, original_query)

        # Poll for completion with exponential backoff
        poll_interval = INITIAL_POLL_INTERVAL
        max_poll_interval = MAX_POLL_INTERVAL
        max_wait_time = MAX_WAIT_TIME_SECONDS
        start_time = time.time()

        print(MSG_POLLING_START.format(max_wait_time//60))

        while time.time() - start_time < max_wait_time:
            status = self.get_deep_research_status(task_id)

            if status.get('error'):
                raise Exception(ERROR_RESEARCH_TASK.format(status['error']))

            if status['status'] == STATUS_COMPLETED:
                result = self.get_deep_research_result(task_id)
                if result:
                    elapsed = int(time.time() - start_time)
                    print(MSG_ASYNC_RESEARCH_COMPLETE.format(elapsed))
                    return result
                else:
                    raise Exception(ERROR_NO_RESULT)

            elif status['status'] == STATUS_FAILED:
                raise Exception(ERROR_RESEARCH_FAILED.format(status.get('error', 'Unknown error')))

            # Show progress
            elapsed = int(time.time() - start_time)
            print(PROGRESS_STATUS_TEMPLATE.format(status['status'], elapsed, len(status.get('progress_messages', []))))

            # Wait with exponential backoff
            time.sleep(poll_interval)
            poll_interval = min(poll_interval * POLL_INTERVAL_MULTIPLIER, max_poll_interval)

        # Timeout
        raise Exception(ERROR_RESEARCH_TIMEOUT.format(max_wait_time//60))
    
    def analyze_citations_detailed(self, citations: list) -> list:
        print(MSG_STAGE_2_5)
        print(MSG_AGENT.format(AgentRoles.CITATION_AGENT['name']))
        print(MSG_CITATION_ANALYSIS_BATCH.format(len(citations), CITATION_BATCH_SIZE))

        enhanced_citations = []
        batch_size = CITATION_BATCH_SIZE

        # Process citations in batches
        for batch_start in range(0, len(citations), batch_size):
            batch_end = min(batch_start + batch_size, len(citations))
            batch_citations = citations[batch_start:batch_end]
            batch_num = (batch_start // batch_size) + 1
            total_batches = (len(citations) + batch_size - 1) // batch_size

            print(MSG_BATCH_PROCESSING.format(batch_num, total_batches, len(batch_citations)))
            
            # Format citations batch for the prompt
            citations_batch_text = ""
            for citation in batch_citations:
                citations_batch_text += f"Index: {citation.get('index', 'N/A')}\n"
                citations_batch_text += f"Title: {citation.get('title', 'No title available')}\n"
                citations_batch_text += f"URL: {citation.get('url', 'No URL available')}\n\n"
            
            prompt = self.prompts.CITATION_BATCH_ANALYSIS_PROMPT.format(
                citation_index="[INDEX]",
                citation_title="[TITLE]",
                citations_batch=citations_batch_text.strip()
            )
            
            response = self.openai_manager.responses_create_and_wait(
                model=self.config.O4_MINI_MODEL,
                system_message=SYSTEM_MESSAGE_RESEARCH_ANALYST,
                user_message=prompt,
            )

            batch_analysis = response

            # Split the batch analysis by citation and assign to respective citations
            analysis_sections = batch_analysis.split(CITATION_SEPARATOR)
            
            for i, citation in enumerate(batch_citations):
                # Find the corresponding analysis section for this citation
                citation_analysis = ""
                if i < len(analysis_sections):
                    citation_analysis = analysis_sections[i].strip()
                
                enhanced_citation = {
                    "index": citation.get('index', 'N/A'),
                    "title": citation.get('title', 'No title available'),
                    "url": citation.get('url', 'No URL available'),
                    "detailed_analysis": citation_analysis,
                    "analysis_timestamp": self.config.get_timestamp()
                }
                
                enhanced_citations.append(enhanced_citation)

        print(MSG_CITATION_ANALYSIS_SUCCESS.format(len(enhanced_citations)))
        return enhanced_citations
    
    def draft_policy(self, elaboration: str, research: Dict[str, Any], original_query: str) -> str:
        print(MSG_STAGE_3)
        print(MSG_AGENT.format(AgentRoles.DRAFTING_AGENT['name']))

        # Use enhanced citations if available, otherwise fall back to original citations
        citations_for_drafting = research.get('citations')

        drafting_context = ReportTemplates.DRAFTING_CONTEXT_TEMPLATE.format(
            original_query=original_query,
            elaboration=elaboration,
            research_content=research['content'],
            formatted_citations=self._format_citations_for_drafting(citations_for_drafting)
        )

        system_message = SYSTEM_MESSAGE_POLICY_ADVISOR
        user_text = f"{self.prompts.POLICY_DRAFTING_PROMPT}\n\n{drafting_context}"
        response = self.openai_manager.responses_create_and_wait(
            model=self.config.O3_MODEL,
            system_message=SYSTEM_MESSAGE_POLICY_ADVISOR,
            user_message=f"{self.prompts.POLICY_DRAFTING_PROMPT}\n\n{drafting_context}",
        )
        policy_document = response
        print(MSG_DRAFT_SUCCESS)
        return policy_document
    
    def simulate_policy_scenarios(self, policy_document: str, elaboration: str, original_query: str) -> str:
        print(MSG_STAGE_4)
        print(MSG_AGENT.format(AgentRoles.SIMULATION_AGENT['name']))
        print(MSG_SIMULATION_PROMPT)

        simulation_prompt = self.prompts.POLICY_SIMULATION_PROMPT.format(
            policy_document=policy_document,
            elaboration=elaboration,
            original_query=original_query
        )

        response = self.openai_manager.responses_create_and_wait(
            model=self.config.O3_MODEL,
            system_message=SYSTEM_MESSAGE_RISK_ANALYST,
            user_message=simulation_prompt,
        )

        simulation_results = response
        print(MSG_SIMULATION_SUCCESS)

        # Parse scenarios for summary statistics
        scenario_count = simulation_results.count(SCENARIO_COUNT_MARKER)
        print(MSG_SCENARIOS_GENERATED.format(scenario_count))
        print(MSG_SCENARIO_TYPES)

        return simulation_results
    
    def generate_data_analytics_report(self, policy_document: str, research: Dict[str, Any]) -> str:
        print(MSG_STAGE_5)
        print(MSG_AGENT.format("Data Analytics Specialist"))
        print(MSG_ANALYTICS_PROMPT)

        # Format the research content for the data analytics prompt
        research_content = research.get('content')

        analytics_prompt = self.prompts.DATA_ANALYTICS_REPORT_PROMPT.format(
            policy_document=policy_document,
            research=research_content
        )

        response = self.openai_manager.responses_create_and_wait(
            model=self.config.O3_MODEL,
            system_message=SYSTEM_MESSAGE_DATA_ANALYST,
            user_message=analytics_prompt,
        )
        analytics_report = response
        print(MSG_ANALYTICS_SUCCESS)

        # Count the number of tables/visual elements for reporting
        table_count = analytics_report.count("|")
        visual_elements = analytics_report.count("📊") + analytics_report.count("📈") + analytics_report.count("🎯")
        print(MSG_ANALYTICS_STATS.format(table_count//TABLE_COUNT_DIVISOR, visual_elements))

        return analytics_report
    
    def generate_final_report(self,
                            original_query: str,
                            elaboration: str,
                            research: Dict[str, Any],
                            policy_document: str,
                            simulation_results: str = None,
                            analytics_report: str = None) -> Dict[str, str]:
        print(MSG_GENERATING_REPORTS)

        timestamp = self.config.get_timestamp()
        timestamp_formatted = datetime.now().strftime(DATETIME_FORMAT_REPORT)

        # Use enhanced citations if available, otherwise fall back to original citations
        citations_to_use = research.get('enhanced_citations', research.get('citations', []))

        # Build citations reference section
        citations_section = self._build_citations_section(citations_to_use)

        # Generate Deep Research Report
        research_filename = RESEARCH_REPORT_FILENAME_PATTERN.format(timestamp)
        research_filepath = Path(self.config.OUTPUT_DIR) / research_filename

        research_report_content = ReportTemplates.DEEP_RESEARCH_REPORT_TEMPLATE.format(
            timestamp=timestamp_formatted,
            original_query=original_query,
            citations_count=len(citations_to_use),
            research_content=research['content'],
            citations_section=citations_section
        )

        with open(research_filepath, 'w', encoding='utf-8') as f:
            f.write(research_report_content)

        print(MSG_RESEARCH_REPORT_GENERATED.format(research_filepath))

        # Generate Policy Document Report
        policy_filename = POLICY_REPORT_FILENAME_PATTERN.format(timestamp)
        policy_filepath = Path(self.config.OUTPUT_DIR) / policy_filename

        policy_report_content = ReportTemplates.POLICY_DOCUMENT_REPORT_TEMPLATE.format(
            timestamp=timestamp_formatted,
            original_query=original_query,
            policy_document=policy_document
        )

        with open(policy_filepath, 'w', encoding='utf-8') as f:
            f.write(policy_report_content)

        print(MSG_POLICY_REPORT_GENERATED.format(policy_filepath))

        # Generate Simulation Report if simulation results are provided
        reports = {
            "research_report": str(research_filepath),
            "policy_report": str(policy_filepath)
        }

        if simulation_results:
            simulation_filename = SIMULATION_REPORT_FILENAME_PATTERN.format(timestamp)
            simulation_filepath = Path(self.config.OUTPUT_DIR) / simulation_filename

            simulation_report_content = ReportTemplates.SIMULATION_REPORT_TEMPLATE.format(
                timestamp=timestamp_formatted,
                original_query=original_query,
                simulation_results=simulation_results
            )

            with open(simulation_filepath, 'w', encoding='utf-8') as f:
                f.write(simulation_report_content)

            print(MSG_SIMULATION_REPORT_GENERATED.format(simulation_filepath))
            reports["simulation_report"] = str(simulation_filepath)

        # Generate Data Analytics Report if analytics report is provided
        if analytics_report:
            analytics_filename = ANALYTICS_REPORT_FILENAME_PATTERN.format(timestamp)
            analytics_filepath = Path(self.config.OUTPUT_DIR) / analytics_filename

            analytics_report_content = ReportTemplates.DATA_ANALYTICS_REPORT_TEMPLATE.format(
                timestamp=timestamp_formatted,
                original_query=original_query,
                analytics_report=analytics_report
            )

            with open(analytics_filepath, 'w', encoding='utf-8') as f:
                f.write(analytics_report_content)

            print(MSG_ANALYTICS_REPORT_GENERATED.format(analytics_filepath))
            reports["analytics_report"] = str(analytics_filepath)

        return reports
    
    def run_research_pipeline(self, user_query: str) -> Dict[str, str]:
        """Run only the research pipeline (elaboration + deep research)."""
        print(PIPELINE_HEADER)
        print(PIPELINE_TITLE_RESEARCH)
        print(PIPELINE_HEADER)
        print(PIPELINE_REQUEST.format(user_query))
        print(PIPELINE_STARTED.format(datetime.now().strftime(DATETIME_FORMAT_DISPLAY)))
        print(PIPELINE_MODE_RESEARCH)

        # Stage 1: Elaborate the query
        elaboration = self.elaborate_query(user_query)

        # Stage 2: Conduct deep research (with Azure timeout handling)
        research = self._conduct_deep_research_with_azure_handling(elaboration, user_query)

        # Stage 2.5: Analyze citations in detail
        enhanced_citations = self.analyze_citations_detailed(research['citations'])
        research['enhanced_citations'] = enhanced_citations  # Update research with enhanced citations

        # Generate research report only
        report_paths = self.generate_research_only_report(user_query, elaboration, research)

        print("\n" + PIPELINE_HEADER)
        print(PIPELINE_COMPLETE_RESEARCH)
        print(PIPELINE_RESEARCH_SAVED.format(report_paths['research_report']))
        print(PIPELINE_HEADER)

        return report_paths
    
    def generate_research_only_report(self,
                                    original_query: str,
                                    elaboration: str,
                                    research: Dict[str, Any]) -> Dict[str, str]:
        """Generate only the research report for research-only mode."""
        print(MSG_GENERATING_RESEARCH_REPORT)

        timestamp = self.config.get_timestamp()
        timestamp_formatted = datetime.now().strftime(DATETIME_FORMAT_REPORT)

        # Use enhanced citations if available, otherwise fall back to original citations
        citations_to_use = research.get('enhanced_citations', research.get('citations', []))

        # Build citations reference section
        citations_section = self._build_citations_section(citations_to_use)

        # Generate Deep Research Report
        research_filename = RESEARCH_REPORT_FILENAME_PATTERN.format(timestamp)
        research_filepath = Path(self.config.OUTPUT_DIR) / research_filename

        research_report_content = ReportTemplates.DEEP_RESEARCH_REPORT_TEMPLATE.format(
            timestamp=timestamp_formatted,
            original_query=original_query,
            citations_count=len(citations_to_use),
            research_content=research['content'],
            citations_section=citations_section
        )

        with open(research_filepath, 'w', encoding='utf-8') as f:
            f.write(research_report_content)

        print(MSG_RESEARCH_REPORT_GENERATED.format(research_filepath))

        return {"research_report": str(research_filepath)}
    
    def run_complete_pipeline(self, user_query: str) -> Dict[str, str]:
        print(PIPELINE_HEADER)
        print(PIPELINE_TITLE_COMPLETE)
        print(PIPELINE_HEADER)
        print(PIPELINE_REQUEST.format(user_query))
        print(PIPELINE_STARTED.format(datetime.now().strftime(DATETIME_FORMAT_DISPLAY)))

        # Stage 1: Elaborate the query
        elaboration = self.elaborate_query(user_query)

        # Stage 2: Conduct deep research (with Azure timeout handling)
        research = self._conduct_deep_research_with_azure_handling(elaboration, user_query)

        # Stage 2.5: Analyze citations in detail
        enhanced_citations = self.analyze_citations_detailed(research['citations'])
        research['enhanced_citations'] = enhanced_citations  # Update research with enhanced citations

        # Stage 3: Draft the policy
        policy_document = self.draft_policy(elaboration, research, user_query)

        # Stage 4: Simulate policy scenarios
        simulation_results = self.simulate_policy_scenarios(policy_document, elaboration, user_query)

        # Stage 5: Generate data analytics report
        analytics_report = self.generate_data_analytics_report(policy_document, research)

        # Generate final reports
        report_paths = self.generate_final_report(user_query, elaboration, research, policy_document, simulation_results, analytics_report)

        print("\n" + PIPELINE_HEADER)
        print(PIPELINE_COMPLETE_FULL)
        print(PIPELINE_RESEARCH_SAVED.format(report_paths['research_report']))
        print(PIPELINE_POLICY_SAVED.format(report_paths['policy_report']))

        if 'simulation_report' in report_paths:
            print(PIPELINE_SIMULATION_SAVED.format(report_paths['simulation_report']))

        if 'analytics_report' in report_paths:
            print(PIPELINE_ANALYTICS_SAVED.format(report_paths['analytics_report']))

        print(PIPELINE_HEADER)

        return report_paths
    
    def _format_citations_for_drafting(self, citations: list) -> str:
        """Format enhanced citations for use in policy drafting prompt."""
        if not citations:
            return NO_CITATIONS_MSG

        formatted = "Available Citation References with Quality Analysis:\n\n"
        for citation in citations:
            formatted += f"[^{citation.get('index', 'N/A')}]: {citation.get('title', 'Unknown title')}\n"
            formatted += f"URL: {citation.get('url', 'No URL available')}\n"
            formatted += f"Quality: Basic citation data available\n"

            formatted += "\n"

        return formatted
    
    def _build_citations_section(self, citations: list) -> str:
        """Build the citations section for the final report with detailed analysis."""
        if not citations:
            return NO_CITATIONS_REPORT

        citations_text = "### Sources and References\n\n"

        for citation in citations:
            citations_text += f"**[{citation.get('index', 'N/A')}]** {citation.get('title', 'Unknown title')}\n"
            citations_text += f"**URL:** {citation.get('url', 'No URL available')}\n\n"

            # Add detailed analysis if available
            if 'detailed_analysis' in citation and citation['detailed_analysis']:
                citations_text += citation['detailed_analysis']
                citations_text += f"\n\n{CITATION_SEPARATOR}\n\n"
            else:
                citations_text += BASIC_CITATION_MSG

        return citations_text

def main():
    # Example usage
    agent = PolicyDraftingAgent()

    # Example query from the user's description
    sample_query = SAMPLE_QUERY

    report_paths = agent.run_complete_pipeline(sample_query)
    print(SUCCESS_HEADER)
    print(SUCCESS_RESEARCH.format(report_paths['research_report']))
    print(SUCCESS_POLICY.format(report_paths['policy_report']))

    if 'simulation_report' in report_paths:
        print(SUCCESS_SIMULATION.format(report_paths['simulation_report']))

    if 'analytics_report' in report_paths:
        print(SUCCESS_ANALYTICS.format(report_paths['analytics_report']))

if __name__ == "__main__":
    main()