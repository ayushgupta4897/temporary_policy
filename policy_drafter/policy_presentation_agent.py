"""
Policy Presentation Agent
Strategy& PWC - AI-Powered Policy Presentation Generator

Generates 3 client-ready presentation documents:
1. Executive Summary (2 pages) - For leadership briefings (uses policy document only)
2. Strategy Brief (3-5 pages) - For internal teams and client-facing presentations (uses policy + simulations + analytics)
3. Full Policy Dossier - Complete reference-grade document with annexes and citations (uses all documents)

Uses existing policy analysis outputs as input to create presentation-ready documents.
"""

import json
import openai
import httpx
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import sys
import os

# Import existing components
from .config import PolicyDrafterConfig
from .prompts import PolicyPrompts
from .policy_agent import PolicyDraftingAgent


class PolicyPresentationAgent:
    """Generates presentation-ready documents from existing policy analysis outputs."""
    
    def __init__(self):
        """Initialize the policy presentation system."""
        self.config = PolicyDrafterConfig()
        self.prompts = PolicyPrompts()
        
        # Initialize OpenAI client with Azure-resilient configuration
        openai.api_key = self.config.OPENAI_API_KEY
        
        # Configure resilient HTTP client for Azure environment with extended timeout for 180-minute operations
        http_timeout = httpx.Timeout(connect=15.0, read=10800.0, write=120.0, pool=60.0)
        http_client = httpx.Client(timeout=http_timeout, http2=False, trust_env=True)
        
        self.openai_client = openai.OpenAI(
            api_key=self.config.OPENAI_API_KEY,
            http_client=http_client,
            max_retries=2
        )
        
        # Ensure output directory exists
        Path(self.config.OUTPUT_DIR).mkdir(exist_ok=True)
        
        print("🎨 Policy Presentation Agent initialized successfully")
        print("📊 Ready to generate client-ready presentation documents")
    
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
    
    def read_existing_outputs(self, timestamp: str) -> Dict[str, str]:
        print(f"\n📁 Reading existing policy analysis outputs (timestamp: {timestamp})")
        
        output_dir = Path(self.config.OUTPUT_DIR)
        
        # Define expected filenames
        filenames = {
            'deep_research': f"deep_research_report_{timestamp}.md",
            'policy_document': f"policy_document_report_{timestamp}.md", 
            'simulation': f"simulation_report_{timestamp}.md",
            'data_analytics': f"data_analytics_report_{timestamp}.md"
        }
        
        outputs = {}
        
        for key, filename in filenames.items():
            filepath = output_dir / filename
            
            if filepath.exists():
                print(f"  ✅ Reading {filename}")
                with open(filepath, 'r', encoding='utf-8') as f:
                    outputs[key] = f.read()
            else:
                print(f"  ❌ File not found: {filename}")
                outputs[key] = f"File not found: {filename}"
        
        print(f"✅ Successfully read {len([v for v in outputs.values() if 'File not found' not in v])}/4 files")
        return outputs
    
    def generate_executive_summary(self, 
                                 policy_document: str,
                                 original_query: str, 
                                 elaboration: str,
                                 timestamp: str) -> str:
        print(f"\n📋 Generating Executive Summary (2 pages)")
        print(f"🤖 Model: {self.config.GPT_5}")
        print(f"📄 Source: Policy Document Only")
        
        try:
            # Format timestamp for display
            timestamp_formatted = datetime.now().strftime('%B %d, %Y at %I:%M %p')
            
            prompt = self.prompts.EXECUTIVE_SUMMARY_PROMPT.format(
                timestamp=timestamp_formatted,
                policy_document=policy_document,
                original_query=original_query,
                elaboration=elaboration
            )
            
            system_message = "You are a senior executive consultant at Strategy& PWC, expert in creating concise, impactful executive summaries for C-suite leadership."
            executive_summary = self._generate_text_safe(system_message, prompt, self.config.GPT_5)
            
            # Validate content is not empty
            if not executive_summary:
                raise ValueError("OpenAI returned empty executive summary")
            
            print(f"✅ Executive Summary generated successfully ({len(executive_summary)} characters)")
            return executive_summary
            
        except Exception as e:
            print(f"❌ Failed to generate executive summary: {e}")
            raise Exception(f"Executive summary generation failed: {str(e)}")
    
    def generate_strategy_brief(self, 
                              policy_document: str,
                              simulation_content: str,
                              data_analytics_content: str,
                              original_query: str, 
                              elaboration: str,
                              timestamp: str) -> str:
        print(f"\n📊 Generating Strategy Brief (3-5 pages)")
        print(f"🤖 Model: {self.config.GPT_5}")
        print(f"📄 Sources: Policy Document + Simulations + Analytics")
        
        # Format timestamp for display
        timestamp_formatted = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        prompt = self.prompts.STRATEGY_BRIEF_PROMPT.format(
            timestamp=timestamp_formatted,
            deep_research_content="",  # Not used for strategy brief
            policy_document=policy_document,
            data_analytics_content=data_analytics_content,
            simulation_content=simulation_content,
            original_query=original_query,
            elaboration=elaboration
        )
        
        try:
            system_message = "You are a senior strategy consultant at Strategy& PWC, expert in creating comprehensive strategy briefs for internal teams and client presentations."
            strategy_brief = self._generate_text_safe(system_message, prompt, self.config.GPT_5)
            
            if not strategy_brief:
                raise ValueError("OpenAI returned empty strategy brief")
            
            print(f"✅ Strategy Brief generated successfully ({len(strategy_brief)} characters)")
            return strategy_brief
            
        except Exception as e:
            print(f"❌ Failed to generate strategy brief: {e}")
            raise Exception(f"Strategy brief generation failed: {str(e)}")
    
    def generate_full_policy_dossier(self, 
                                   deep_research_content: str,
                                   policy_document: str,
                                   simulation_content: str,
                                   data_analytics_content: str,
                                   original_query: str, 
                                   elaboration: str,
                                   timestamp: str) -> str:
        print(f"\n📚 Generating Full Policy Dossier (Comprehensive)")
        print(f"🤖 Model: {self.config.GPT_5}")
        print(f"📄 Sources: All Documents (Complete Content)")
        
        # Format timestamp for display
        timestamp_formatted = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        
        prompt = self.prompts.FULL_POLICY_DOSSIER_PROMPT.format(
            timestamp=timestamp_formatted,
            deep_research_content=deep_research_content,
            policy_document=policy_document,
            data_analytics_content=data_analytics_content,
            simulation_content=simulation_content,
            original_query=original_query,
            elaboration=elaboration
        )
        
        try:
            system_message = "You are a senior policy director at Strategy& PWC, expert in creating comprehensive, government-ready policy dossiers with full citations and operational detail."
            policy_dossier = self._generate_text_safe(system_message, prompt, self.config.GPT_5)
            
            if not policy_dossier:
                raise ValueError("OpenAI returned empty policy dossier")
            
            print(f"✅ Full Policy Dossier generated successfully ({len(policy_dossier)} characters)")
            return policy_dossier
            
        except Exception as e:
            print(f"❌ Failed to generate policy dossier: {e}")
            raise Exception(f"Policy dossier generation failed: {str(e)}")
    
    def save_presentation_documents(self, 
                                  executive_summary: str,
                                  strategy_brief: str, 
                                  policy_dossier: str,
                                  timestamp: str) -> Dict[str, str]:
        print(f"\n💾 Saving presentation documents...")
        
        output_dir = Path(self.config.OUTPUT_DIR)
        
        # Generate filenames
        executive_summary_filename = f"executive_summary_presentation_{timestamp}.md"
        strategy_brief_filename = f"strategy_brief_presentation_{timestamp}.md"
        policy_dossier_filename = f"full_policy_dossier_presentation_{timestamp}.md"
        
        # Save files - but validate content first
        files_saved = {}
        
        # Executive Summary
        if executive_summary and len(executive_summary.strip()) > 0:
            executive_path = output_dir / executive_summary_filename
            with open(executive_path, 'w', encoding='utf-8') as f:
                f.write(executive_summary)
            files_saved['executive_summary'] = str(executive_path)
            print(f"  ✅ Executive Summary: {executive_summary_filename} ({len(executive_summary)} chars)")
        else:
            print(f"  ❌ Executive Summary: SKIPPED (empty content)")
        
        # Strategy Brief
        if strategy_brief and len(strategy_brief.strip()) > 0:
            strategy_path = output_dir / strategy_brief_filename
            with open(strategy_path, 'w', encoding='utf-8') as f:
                f.write(strategy_brief)
            files_saved['strategy_brief'] = str(strategy_path)
            print(f"  ✅ Strategy Brief: {strategy_brief_filename} ({len(strategy_brief)} chars)")
        else:
            print(f"  ❌ Strategy Brief: SKIPPED (empty content)")
        
        # Policy Dossier
        if policy_dossier and len(policy_dossier.strip()) > 0:
            dossier_path = output_dir / policy_dossier_filename
            with open(dossier_path, 'w', encoding='utf-8') as f:
                f.write(policy_dossier)
            files_saved['policy_dossier'] = str(dossier_path)
            print(f"  ✅ Full Policy Dossier: {policy_dossier_filename} ({len(policy_dossier)} chars)")
        else:
            print(f"  ❌ Full Policy Dossier: SKIPPED (empty content)")
        
        print(f"✅ Saved {len(files_saved)}/3 presentation documents")
        return files_saved
    
    def generate_presentation_suite(self, 
                                  timestamp: str,
                                  original_query: str,
                                  elaboration: str) -> Dict[str, str]:
        print("="*80)
        print("STRATEGY& PWC - POLICY PRESENTATION GENERATOR")
        print("="*80)
        print(f"📅 Input timestamp: {timestamp}")
        print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🎯 Original Query: {original_query}")
        
        # Step 1: Read existing outputs
        outputs = self.read_existing_outputs(timestamp)
        
        # Verify all files were read successfully
        missing_files = [key for key, content in outputs.items() if "File not found" in content]
        if missing_files:
            raise FileNotFoundError(f"Missing required files: {missing_files}")
        
        # Step 2: Generate Executive Summary (Policy Document Only)
        executive_summary = self.generate_executive_summary(
            policy_document=outputs['policy_document'],
            original_query=original_query, 
            elaboration=elaboration, 
            timestamp=timestamp
        )
        
        # Step 3: Generate Strategy Brief (Policy + Simulations + Analytics)
        strategy_brief = self.generate_strategy_brief(
            policy_document=outputs['policy_document'],
            simulation_content=outputs['simulation'],
            data_analytics_content=outputs['data_analytics'],
            original_query=original_query, 
            elaboration=elaboration, 
            timestamp=timestamp
        )
        
        # Step 4: Generate Full Policy Dossier (All Documents)
        policy_dossier = self.generate_full_policy_dossier(
            deep_research_content=outputs['deep_research'],
            policy_document=outputs['policy_document'],
            simulation_content=outputs['simulation'],
            data_analytics_content=outputs['data_analytics'],
            original_query=original_query, 
            elaboration=elaboration, 
            timestamp=timestamp
        )
        
        # Step 5: Save all documents
        file_paths = self.save_presentation_documents(executive_summary, strategy_brief, policy_dossier, timestamp)
        
        print("\n" + "="*80)
        print("🎉 PRESENTATION SUITE GENERATION COMPLETED!")
        print(f"📋 Executive Summary (2 pages): {file_paths['executive_summary']}")
        print(f"📊 Strategy Brief (3-5 pages): {file_paths['strategy_brief']}")
        print(f"📚 Full Policy Dossier (Comprehensive): {file_paths['policy_dossier']}")
        print("="*80)
        
        return file_paths


def generate_presentation_documents(timestamp: str, original_query: str, elaboration: str) -> Dict[str, str]:
    agent = PolicyPresentationAgent()
    return agent.generate_presentation_suite(timestamp, original_query, elaboration)


def main():
    """Example usage of the Policy Presentation Agent."""
    agent = PolicyPresentationAgent()
    
    # Example: Use the timestamp from existing analysis files
    timestamp = "20250811_144114"  # Example timestamp - adjust as needed
    original_query = "I have to draft a policy for Government of Saudi Arabia for health department for infants up to 24 months"
    elaboration = "Comprehensive policy framework for infant health and development in Saudi Arabia covering all aspects from birth to 24 months"
    
    presentation_files = agent.generate_presentation_suite(timestamp, original_query, elaboration)
    
    print(f"\n🎯 SUCCESS! Presentation documents generated:")
    print(f"📋 Executive Summary: {presentation_files['executive_summary']}")
    print(f"📊 Strategy Brief: {presentation_files['strategy_brief']}")
    print(f"📚 Policy Dossier: {presentation_files['policy_dossier']}")


if __name__ == "__main__":
    main()