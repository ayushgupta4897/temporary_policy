import json
import openai
import httpx
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import sys
import os

from .config import PolicyDrafterConfig, AgentRoles
from .prompts import PolicyPrompts
from .report_templates import ReportTemplates
from .openai_deep_research_client import OpenAIDeepResearchClient

class PolicyDraftingAgent:
    """Main orchestrator for the AI-powered policy drafting system."""
    
    def __init__(self):
        """Initialize the policy drafting system."""
        self.config = PolicyDrafterConfig()
        self.prompts = PolicyPrompts()
        
        # Initialize OpenAI clients with Azure-resilient configuration
        openai.api_key = self.config.OPENAI_API_KEY
        
        # Configure resilient HTTP client for Azure environment with extended timeout for 180-minute operations
        http_timeout = httpx.Timeout(connect=15.0, read=10800.0, write=120.0, pool=60.0)
        http_client = httpx.Client(timeout=http_timeout, http2=False, trust_env=True)
        
        self.openai_client = openai.OpenAI(
            api_key=self.config.OPENAI_API_KEY,
            http_client=http_client,
            max_retries=2
        )
        self.deep_research_client = OpenAIDeepResearchClient()
        
        # Ensure output directory exists
        Path(self.config.OUTPUT_DIR).mkdir(exist_ok=True)
        
        print("🚀 Policy Drafting Agent initialized successfully")
        print("🏛️  Ready to draft policies for governments and organizations")
    
    def _extract_text_from_response(self, response: Any) -> Optional[str]:
        """Extract final text from Responses API response."""
        try:
            if not response or not getattr(response, 'output', None):
                return None
            final_output = response.output[-1]
            if hasattr(final_output, 'content') and final_output.content:
                content0 = final_output.content[0]
                if hasattr(content0, 'text'):
                    return content0.text
            return None
        except Exception:
            return None

    def _generate_text_safe(self, system_message: str, user_text: str, model: str) -> str:
        """Generate text using Responses API with streaming in Azure; fallback to Chat Completions."""
        request_params = {
            "model": model,
            "input": [
                {"role": "developer", "content": [{"type": "input_text", "text": system_message}]},
                {"role": "user", "content": [{"type": "input_text", "text": user_text}]},
            ],
        }

        # Add reasoning summary to force periodic frames (like deep research)
        try:
            request_params["reasoning"] = {"summary": "auto"}
            
            if self._is_running_in_azure():
                with self.openai_client.responses.stream(**request_params) as stream:
                    for _ in stream:
                        pass
                    response = stream.get_final_response()
            else:
                response = self.openai_client.responses.create(**request_params)

            text = self._extract_text_from_response(response)
            if text and len(text.strip()) > 0:
                return text.strip()
        except Exception as e:
            # If reasoning summary fails, retry without it
            if "reasoning.summary" in str(e):
                print(f"⚠️ Organization not verified for reasoning summaries, retrying without reasoning...")
                return self._generate_text_safe_no_reasoning(system_message, user_text, model)
            print(f"⚠️ Responses API failed for model {model}, falling back to Chat Completions: {e}")

        # Final fallback: Chat Completions
        fallback = self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_text},
            ],
        )
        return fallback.choices[0].message.content.strip()
    
    def _generate_text_safe_no_reasoning(self, system_message: str, user_text: str, model: str) -> str:
        """Generate text using Responses API without reasoning summaries."""
        request_params = {
            "model": model,
            "input": [
                {"role": "developer", "content": [{"type": "input_text", "text": system_message}]},
                {"role": "user", "content": [{"type": "input_text", "text": user_text}]},
            ],
        }

        try:
            if self._is_running_in_azure():
                with self.openai_client.responses.stream(**request_params) as stream:
                    for _ in stream:
                        pass
                    response = stream.get_final_response()
            else:
                response = self.openai_client.responses.create(**request_params)

            text = self._extract_text_from_response(response)
            if text and len(text.strip()) > 0:
                return text.strip()
        except Exception as e:
            print(f"⚠️ Responses API without reasoning failed for model {model}, falling back to Chat Completions: {e}")

        # Fallback: Chat Completions
        fallback = self.openai_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_text},
            ],
        )
        return fallback.choices[0].message.content.strip()

    def elaborate_query(self, user_query: str) -> str:
        print(f"\n📋 Stage 1: Policy Elaboration")
        print(f"🎯 Query: {user_query}")
        print(f"🤖 Agent: {AgentRoles.ELABORATION_AGENT['name']}")
        
        prompt = self.prompts.ELABORATION_PROMPT.format(user_query=user_query)
        
        response = self.openai_client.chat.completions.create(
            model=self.config.O3_MODEL,
            messages=[
                {"role": "system", "content": "You are a senior policy consultant at Strategy& PWC."},
                {"role": "user", "content": prompt}
            ],
            max_completion_tokens=5000
        )
        
        elaboration = response.choices[0].message.content.strip()
        print("✅ Policy elaboration completed successfully")
        return elaboration
    
    def conduct_deep_research(self, elaboration: str, original_query: str) -> Dict[str, Any]:
        print(f"\n🔍 Stage 2: Deep Research Analysis")
        print(f"🤖 Agent: {AgentRoles.RESEARCH_AGENT['name']}")

        # ## TODO: Remove this once the API is working
        # file_path = 'policy_drafter/response_data.json'

        # # 2. Load the data from the file
        # with open(file_path, 'r', encoding='utf-8') as f:
        #     loaded_data = json.load(f)

        # research = loaded_data
        # return research
        
        research_query = self.prompts.RESEARCH_QUERY_TEMPLATE.format(
            original_query=original_query,
            elaboration=elaboration
        )
        
        # Use the deep research API
        response = self.deep_research_client.make_request(
            user_query=research_query,
            system_message=self.prompts.RESEARCH_SYSTEM_PROMPT
        )
        
        # Extract research content
        research_content = self.deep_research_client.get_final_report(response)
        citations = self.deep_research_client.get_citations(response)
        
        print(f"✅ Deep research completed - Found {len(citations)} citations")
        
        return {
            "content": research_content,
            "citations": citations,
            "raw_response": response
        }
    
    def start_deep_research_async(self, elaboration: str, original_query: str) -> str:
        """Start deep research asynchronously and return task ID."""
        print(f"\n🔍 Stage 2: Deep Research Analysis (Async)")
        print(f"🤖 Agent: {AgentRoles.RESEARCH_AGENT['name']}")
        
        research_query = self.prompts.RESEARCH_QUERY_TEMPLATE.format(
            original_query=original_query,
            elaboration=elaboration
        )
        
        # Start async research
        task_id = self.deep_research_client.start_async_research(
            user_query=research_query,
            system_message=self.prompts.RESEARCH_SYSTEM_PROMPT,
            timeout_minutes=180  # Full timeout for Azure deep research
        )
        
        print(f"🚀 Deep research started asynchronously (Task ID: {task_id[:8]}...)")
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
        
        print(f"✅ Deep research retrieved - Found {len(citations)} citations")
        
        return {
            "content": research_content,
            "citations": citations,
            "raw_response": response
        }
    
    def _is_running_in_azure(self) -> bool:
        """Detect if running in Azure Container Apps environment."""
        import os
        # Check for Azure Container Apps environment variables
        azure_indicators = [
            'CONTAINER_APP_NAME',
            'CONTAINER_APP_REPLICA_NAME', 
            'CONTAINER_APP_REVISION_NAME',
            'AZURE_CLIENT_ID',
            'WEBSITES_ENABLE_APP_SERVICE_STORAGE'  # Also works for Container Apps
        ]
        return any(os.getenv(var) for var in azure_indicators)
    
    def _conduct_deep_research_with_azure_handling(self, elaboration: str, original_query: str) -> Dict[str, Any]:
        """Conduct deep research with Azure timeout handling."""
        if self._is_running_in_azure():
            print("🌐 Azure environment detected - using async deep research with polling")
            return self._conduct_deep_research_async_with_polling(elaboration, original_query)
        else:
            print("🖥️  Local environment detected - using synchronous deep research")
            return self.conduct_deep_research(elaboration, original_query)
    
    def _conduct_deep_research_async_with_polling(self, elaboration: str, original_query: str) -> Dict[str, Any]:
        """Conduct deep research asynchronously with internal polling for Azure."""
        import time
        
        # Start async research
        task_id = self.start_deep_research_async(elaboration, original_query)
        
        # Poll for completion with exponential backoff
        poll_interval = 30  # Start with 30 seconds
        max_poll_interval = 120  # Max 2 minutes between polls
        max_wait_time = 10800  # Max 180 minutes total
        start_time = time.time()
        
        print(f"⏳ Polling for deep research completion (max wait: {max_wait_time//60} minutes)")
        
        while time.time() - start_time < max_wait_time:
            status = self.get_deep_research_status(task_id)
            
            if status.get('error'):
                raise Exception(f"Research task error: {status['error']}")
            
            if status['status'] == 'completed':
                result = self.get_deep_research_result(task_id)
                if result:
                    elapsed = int(time.time() - start_time)
                    print(f"✅ Async deep research completed in {elapsed} seconds")
                    return result
                else:
                    raise Exception("Research completed but no result available")
            
            elif status['status'] == 'failed':
                raise Exception(f"Deep research failed: {status.get('error', 'Unknown error')}")
            
            # Show progress
            elapsed = int(time.time() - start_time)
            print(f"   Status: {status['status']} | Elapsed: {elapsed}s | Progress: {len(status.get('progress_messages', []))} updates")
            
            # Wait with exponential backoff
            time.sleep(poll_interval)
            poll_interval = min(poll_interval * 1.2, max_poll_interval)
        
        # Timeout
        raise Exception(f"Deep research timed out after {max_wait_time//60} minutes")
    
    def analyze_citations_detailed(self, citations: list) -> list:
        print(f"\n🔍 Stage 2.5: Detailed Citation Analysis")
        print(f"🤖 Agent: {AgentRoles.CITATION_AGENT['name']}")
        print(f"📊 Analyzing {len(citations)} citations in batches of 10")
        
        enhanced_citations = []
        batch_size = 10
        
        # Process citations in batches
        for batch_start in range(0, len(citations), batch_size):
            batch_end = min(batch_start + batch_size, len(citations))
            batch_citations = citations[batch_start:batch_end]
            batch_num = (batch_start // batch_size) + 1
            total_batches = (len(citations) + batch_size - 1) // batch_size
            
            print(f"  📦 Processing batch {batch_num}/{total_batches} ({len(batch_citations)} citations)")
            
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
            
            response = self.openai_client.chat.completions.create(
                model=self.config.O4_MINI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a senior research quality analyst at Strategy& PWC specializing in source verification and content analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_completion_tokens=8000  # Increased for batch processing
            )
            
            batch_analysis = response.choices[0].message.content.strip()
            
            # Split the batch analysis by citation and assign to respective citations
            analysis_sections = batch_analysis.split("---")
            
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
        
        print(f"✅ Detailed citation analysis completed for {len(enhanced_citations)} sources")
        return enhanced_citations
    
    def draft_policy(self, elaboration: str, research: Dict[str, Any], original_query: str) -> str:
        print(f"\n📝 Stage 3: Policy Document Drafting")
        print(f"🤖 Agent: {AgentRoles.DRAFTING_AGENT['name']}")
        
        # Use enhanced citations if available, otherwise fall back to original citations
        citations_for_drafting = research.get('citations')
        
        drafting_context = ReportTemplates.DRAFTING_CONTEXT_TEMPLATE.format(
            original_query=original_query,
            elaboration=elaboration,
            research_content=research['content'],
            formatted_citations=self._format_citations_for_drafting(citations_for_drafting)
        )
        
        system_message = "You are a senior policy advisor at Strategy& PWC, expert in drafting comprehensive policy documents."
        user_text = f"{self.prompts.POLICY_DRAFTING_PROMPT}\n\n{drafting_context}"
        policy_document = self._generate_text_safe(system_message, user_text, self.config.GPT_5)
        print("✅ Policy document drafted successfully")
        return policy_document
    
    def simulate_policy_scenarios(self, policy_document: str, elaboration: str, original_query: str) -> str:
        print(f"\n🎯 Stage 4: Policy Scenario Simulations")
        print(f"🤖 Agent: {AgentRoles.SIMULATION_AGENT['name']}")
        print("🔮 Generating 5 detailed implementation scenarios")
        
        simulation_prompt = self.prompts.POLICY_SIMULATION_PROMPT.format(
            policy_document=policy_document,
            elaboration=elaboration,
            original_query=original_query
        )
        
        response = self.openai_client.chat.completions.create(
            model=self.config.O3_MODEL,
            messages=[
                {"role": "system", "content": "You are a senior strategic risk analyst and policy simulation specialist at Strategy& PWC with expertise in scenario planning, risk assessment, and implementation modeling."},
                {"role": "user", "content": simulation_prompt}
            ],
        )
        
        simulation_results = response.choices[0].message.content.strip()
        print("✅ Policy scenario simulations completed successfully")
        
        # Parse scenarios for summary statistics
        scenario_count = simulation_results.count("### Scenario Name:")
        print(f"  📊 Generated {scenario_count} detailed scenarios")
        print("  🎭 Scenarios: Best-Case, Most Likely, Worst-Case, Resistance, Resource Constraint")
        
        return simulation_results
    
    def generate_data_analytics_report(self, policy_document: str, research: Dict[str, Any]) -> str:
        print(f"\n📊 Stage 5: Data Analytics Report Generation")
        print(f"🤖 Agent: Data Analytics Specialist")
        print("📈 Generating comprehensive data-driven policy analysis")
        
        # Format the research content for the data analytics prompt
        research_content = research.get('content')
        
        analytics_prompt = self.prompts.DATA_ANALYTICS_REPORT_PROMPT.format(
            policy_document=policy_document,
            research=research_content
        )
        
        system_message = "You are a senior policy data analyst and research director at Strategy& PWC, specializing in quantitative policy analysis and visual data presentation."
        analytics_report = self._generate_text_safe(system_message, analytics_prompt, self.config.GPT_5)
        print("✅ Data analytics report generated successfully")
        
        # Count the number of tables/visual elements for reporting
        table_count = analytics_report.count("|")
        visual_elements = analytics_report.count("📊") + analytics_report.count("📈") + analytics_report.count("🎯")
        print(f"  📋 Report contains {table_count//10} data tables and {visual_elements} visual elements")
        
        return analytics_report
    
    def generate_final_report(self, 
                            original_query: str,
                            elaboration: str, 
                            research: Dict[str, Any], 
                            policy_document: str,
                            simulation_results: str = None,
                            analytics_report: str = None) -> Dict[str, str]:
        print(f"\n📊 Generating Final Reports")
        
        timestamp = self.config.get_timestamp()
        timestamp_formatted = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        # Use enhanced citations if available, otherwise fall back to original citations
        citations_to_use = research.get('enhanced_citations', research.get('citations', []))
        
        # Build citations reference section
        citations_section = self._build_citations_section(citations_to_use)
        
        # Generate Deep Research Report
        research_filename = f"deep_research_report_{timestamp}.md"
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
        
        print(f"✅ Deep research report generated: {research_filepath}")
        
        # Generate Policy Document Report
        policy_filename = f"policy_document_report_{timestamp}.md"
        policy_filepath = Path(self.config.OUTPUT_DIR) / policy_filename
        
        policy_report_content = ReportTemplates.POLICY_DOCUMENT_REPORT_TEMPLATE.format(
            timestamp=timestamp_formatted,
            original_query=original_query,
            policy_document=policy_document
        )
        
        with open(policy_filepath, 'w', encoding='utf-8') as f:
            f.write(policy_report_content)
        
        print(f"✅ Policy document report generated: {policy_filepath}")
        
        # Generate Simulation Report if simulation results are provided
        reports = {
            "research_report": str(research_filepath),
            "policy_report": str(policy_filepath)
        }
        
        if simulation_results:
            simulation_filename = f"simulation_report_{timestamp}.md"
            simulation_filepath = Path(self.config.OUTPUT_DIR) / simulation_filename
            
            simulation_report_content = ReportTemplates.SIMULATION_REPORT_TEMPLATE.format(
                timestamp=timestamp_formatted,
                original_query=original_query,
                simulation_results=simulation_results
            )
            
            with open(simulation_filepath, 'w', encoding='utf-8') as f:
                f.write(simulation_report_content)
            
            print(f"✅ Simulation analysis report generated: {simulation_filepath}")
            reports["simulation_report"] = str(simulation_filepath)
        
        # Generate Data Analytics Report if analytics report is provided
        if analytics_report:
            analytics_filename = f"data_analytics_report_{timestamp}.md"
            analytics_filepath = Path(self.config.OUTPUT_DIR) / analytics_filename
            
            analytics_report_content = ReportTemplates.DATA_ANALYTICS_REPORT_TEMPLATE.format(
                timestamp=timestamp_formatted,
                original_query=original_query,
                analytics_report=analytics_report
            )
            
            with open(analytics_filepath, 'w', encoding='utf-8') as f:
                f.write(analytics_report_content)
            
            print(f"✅ Data analytics report generated: {analytics_filepath}")
            reports["analytics_report"] = str(analytics_filepath)
        
        return reports
    
    def run_research_pipeline(self, user_query: str) -> Dict[str, str]:
        """Run only the research pipeline (elaboration + deep research)."""
        print("="*80)
        print("🏛️  STRATEGY& PWC - AI POLICY RESEARCH SYSTEM")
        print("="*80)
        print(f"📝 Request: {user_query}")
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("🔍 Mode: Research Only (Steps 1-2)")
        
        # Stage 1: Elaborate the query
        elaboration = self.elaborate_query(user_query)
        
        # Stage 2: Conduct deep research (with Azure timeout handling)
        research = self._conduct_deep_research_with_azure_handling(elaboration, user_query)
        
        # Stage 2.5: Analyze citations in detail
        enhanced_citations = self.analyze_citations_detailed(research['citations'])
        research['enhanced_citations'] = enhanced_citations  # Update research with enhanced citations
        
        # Generate research report only
        report_paths = self.generate_research_only_report(user_query, elaboration, research)
        
        print("\n" + "="*80)
        print("🎉 POLICY RESEARCH COMPLETED SUCCESSFULLY!")
        print(f"📊 Research report saved to: {report_paths['research_report']}")
        print("="*80)
        
        return report_paths
    
    def generate_research_only_report(self, 
                                    original_query: str,
                                    elaboration: str, 
                                    research: Dict[str, Any]) -> Dict[str, str]:
        """Generate only the research report for research-only mode."""
        print(f"\n📊 Generating Research Report")
        
        timestamp = self.config.get_timestamp()
        timestamp_formatted = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        # Use enhanced citations if available, otherwise fall back to original citations
        citations_to_use = research.get('enhanced_citations', research.get('citations', []))
        
        # Build citations reference section
        citations_section = self._build_citations_section(citations_to_use)
        
        # Generate Deep Research Report
        research_filename = f"deep_research_report_{timestamp}.md"
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
        
        print(f"✅ Deep research report generated: {research_filepath}")
        
        return {"research_report": str(research_filepath)}
    
    def run_complete_pipeline(self, user_query: str) -> Dict[str, str]:
        print("="*80)
        print("🏛️  STRATEGY& PWC - AI POLICY DRAFTING SYSTEM")
        print("="*80)
        print(f"📝 Request: {user_query}")
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
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
        
        print("\n" + "="*80)
        print("🎉 POLICY DRAFTING & ANALYTICS COMPLETED SUCCESSFULLY!")
        print(f"📊 Research report saved to: {report_paths['research_report']}")
        print(f"📄 Policy document saved to: {report_paths['policy_report']}")
        
        if 'simulation_report' in report_paths:
            print(f"🔮 Simulation analysis saved to: {report_paths['simulation_report']}")
        
        if 'analytics_report' in report_paths:
            print(f"📈 Data analytics report saved to: {report_paths['analytics_report']}")
        
        print("="*80)
        
        return report_paths
    
    def _format_citations_for_drafting(self, citations: list) -> str:
        """Format enhanced citations for use in policy drafting prompt."""
        if not citations:
            return "No citations available"
        
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
            return "No citations were found during research."
        
        citations_text = "### Sources and References\n\n"
        
        for citation in citations:
            citations_text += f"**[{citation.get('index', 'N/A')}]** {citation.get('title', 'Unknown title')}\n"
            citations_text += f"**URL:** {citation.get('url', 'No URL available')}\n\n"
            
            # Add detailed analysis if available
            if 'detailed_analysis' in citation and citation['detailed_analysis']:
                citations_text += citation['detailed_analysis']
                citations_text += "\n\n---\n\n"
            else:
                citations_text += "Basic citation information only.\n\n"
        
        return citations_text

def main():
    # Example usage
    agent = PolicyDraftingAgent()
    
    # Example query from the user's description
    sample_query = "I have to draft a policy for Government of Saudi Arabia for health department for infants up to 24 months"
    
    report_paths = agent.run_complete_pipeline(sample_query)
    print(f"\n🎯 SUCCESS! Reports generated:")
    print(f"📊 Research Report: {report_paths['research_report']}")
    print(f"📄 Policy Document: {report_paths['policy_report']}")
    
    if 'simulation_report' in report_paths:
        print(f"🔮 Simulation Analysis: {report_paths['simulation_report']}")
    
    if 'analytics_report' in report_paths:
        print(f"📈 Data Analytics Report: {report_paths['analytics_report']}")

if __name__ == "__main__":
    main()