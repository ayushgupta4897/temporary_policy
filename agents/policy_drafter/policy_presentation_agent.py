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
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import sys
import os

# Import existing components
from config.app_config import PolicyDrafterConfig
from .prompts import PolicyPrompts
from .agent import PolicyDraftingAgent
from clients.openai_client import get_openai_client


# ============================================================================
# CONSTANTS
# ============================================================================

# Timeout Configuration (in seconds)
TIMEOUT_CONNECT = 30.0
TIMEOUT_READ = 14400.0  # 4 hours
TIMEOUT_WRITE = 180.0
TIMEOUT_POOL = 90.0

# Retry Configuration
MAX_RETRIES_DEFAULT = 2

# Document Types
DOC_TYPE_DEEP_RESEARCH = 'deep_research'
DOC_TYPE_POLICY_DOCUMENT = 'policy_document'
DOC_TYPE_SIMULATION = 'simulation'
DOC_TYPE_DATA_ANALYTICS = 'data_analytics'

# File Name Templates
FILENAME_DEEP_RESEARCH = "deep_research_report_{timestamp}.md"
FILENAME_POLICY_DOCUMENT = "policy_document_report_{timestamp}.md"
FILENAME_SIMULATION = "simulation_report_{timestamp}.md"
FILENAME_DATA_ANALYTICS = "data_analytics_report_{timestamp}.md"
FILENAME_EXECUTIVE_SUMMARY = "executive_summary_presentation_{timestamp}.md"
FILENAME_STRATEGY_BRIEF = "strategy_brief_presentation_{timestamp}.md"
FILENAME_POLICY_DOSSIER = "full_policy_dossier_presentation_{timestamp}.md"

# Display Messages
MSG_INIT_SUCCESS = "🎨 Policy Presentation Agent initialized successfully"
MSG_READY = "📊 Ready to generate client-ready presentation documents"
MSG_FILE_NOT_FOUND = "File not found: {filename}"

# System Messages
SYSTEM_MSG_EXECUTIVE = "You are a senior executive consultant at Strategy& PWC, expert in creating concise, impactful executive summaries for C-suite leadership."
SYSTEM_MSG_STRATEGY = "You are a senior strategy consultant at Strategy& PWC, expert in creating comprehensive strategy briefs for internal teams and client presentations."
SYSTEM_MSG_DOSSIER = "You are a senior policy director at Strategy& PWC, expert in creating comprehensive, government-ready policy dossiers with full citations and operational detail."

# Timestamp Formats
TIMESTAMP_DISPLAY_FORMAT = '%B %d, %Y at %I:%M %p'
TIMESTAMP_LOG_FORMAT = '%Y-%m-%d %H:%M:%S'

# Validation
MIN_CONTENT_LENGTH = 0

# File Encoding
FILE_ENCODING = 'utf-8'

# Document Counts
TOTAL_INPUT_FILES = 4
TOTAL_OUTPUT_FILES = 3

# Presentation Descriptions
DESC_EXECUTIVE_SUMMARY = "Executive Summary (2 pages)"
DESC_STRATEGY_BRIEF = "Strategy Brief (3-5 pages)"
DESC_POLICY_DOSSIER = "Full Policy Dossier (Comprehensive)"

# Source Descriptions
SOURCE_POLICY_ONLY = "Policy Document Only"
SOURCE_POLICY_SIMS_ANALYTICS = "Policy Document + Simulations + Analytics"
SOURCE_ALL_DOCUMENTS = "All Documents (Complete Content)"

# Separator
SEPARATOR_LINE = "=" * 80

# Header Text
HEADER_PRESENTATION_GEN = "STRATEGY& PWC - POLICY PRESENTATION GENERATOR"
HEADER_COMPLETION = "🎉 PRESENTATION SUITE GENERATION COMPLETED!"

# Example Values (for main function)
EXAMPLE_TIMESTAMP = "20250811_144114"
EXAMPLE_QUERY = "I have to draft a policy for Government of Saudi Arabia for health department for infants up to 24 months"
EXAMPLE_ELABORATION = "Comprehensive policy framework for infant health and development in Saudi Arabia covering all aspects from birth to 24 months"

# ============================================================================


class PolicyPresentationAgent:
    """Generates presentation-ready documents from existing policy analysis outputs."""
    
    def __init__(self):
        """Initialize the policy presentation system."""
        self.config = PolicyDrafterConfig()
        self.prompts = PolicyPrompts()

        # Use centralized OpenAI client with custom timeout for presentations
        # Increased timeouts: connect=30s, read=4h, write=3min for large policy dossiers
        timeout_config = {
            'connect': TIMEOUT_CONNECT,
            'read': TIMEOUT_READ,
            'write': TIMEOUT_WRITE,
            'pool': TIMEOUT_POOL
        }
        self.openai_manager = get_openai_client(timeout_config)

        # Ensure output directory exists
        Path(self.config.OUTPUT_DIR).mkdir(exist_ok=True)

        print(MSG_INIT_SUCCESS)
        print(MSG_READY)
    
    
    def read_existing_outputs(self, timestamp: str) -> Dict[str, str]:
        print(f"\n📁 Reading existing policy analysis outputs (timestamp: {timestamp})")
        
        output_dir = Path(self.config.OUTPUT_DIR)
        
        # Define expected filenames
        filenames = {
            DOC_TYPE_DEEP_RESEARCH: FILENAME_DEEP_RESEARCH.format(timestamp=timestamp),
            DOC_TYPE_POLICY_DOCUMENT: FILENAME_POLICY_DOCUMENT.format(timestamp=timestamp),
            DOC_TYPE_SIMULATION: FILENAME_SIMULATION.format(timestamp=timestamp),
            DOC_TYPE_DATA_ANALYTICS: FILENAME_DATA_ANALYTICS.format(timestamp=timestamp)
        }

        outputs = {}

        for key, filename in filenames.items():
            filepath = output_dir / filename

            if filepath.exists():
                print(f"  ✅ Reading {filename}")
                with open(filepath, 'r', encoding=FILE_ENCODING) as f:
                    outputs[key] = f.read()
            else:
                print(f"  ❌ File not found: {filename}")
                outputs[key] = MSG_FILE_NOT_FOUND.format(filename=filename)

        print(f"✅ Successfully read {len([v for v in outputs.values() if 'File not found' not in v])}/{TOTAL_INPUT_FILES} files")
        return outputs
    
    def generate_executive_summary(self,
                                 policy_document: str,
                                 original_query: str,
                                 elaboration: str,
                                 timestamp: str) -> str:
        print(f"\n📋 Generating {DESC_EXECUTIVE_SUMMARY}")
        print(f"🤖 Model: {self.config.GPT_5}")
        print(f"📄 Source: {SOURCE_POLICY_ONLY}")

        timestamp_formatted = datetime.now().strftime(TIMESTAMP_DISPLAY_FORMAT)

        prompt = self.prompts.EXECUTIVE_SUMMARY_PROMPT.format(
            timestamp=timestamp_formatted,
            policy_document=policy_document,
            original_query=original_query,
            elaboration=elaboration
        )

        executive_summary = self.openai_manager.responses_create_and_wait(
            model=self.config.GPT_5,
            system_message=SYSTEM_MSG_EXECUTIVE,
            user_message=prompt,
        )
        return executive_summary
    
    def generate_strategy_brief(self,
                              policy_document: str,
                              simulation_content: str,
                              data_analytics_content: str,
                              original_query: str,
                              elaboration: str,
                              timestamp: str) -> str:
        print(f"\n📊 Generating {DESC_STRATEGY_BRIEF}")
        print(f"🤖 Model: {self.config.GPT_5}")
        print(f"📄 Sources: {SOURCE_POLICY_SIMS_ANALYTICS}")

        # Format timestamp for display
        timestamp_formatted = datetime.now().strftime(TIMESTAMP_DISPLAY_FORMAT)

        prompt = self.prompts.STRATEGY_BRIEF_PROMPT.format(
            timestamp=timestamp_formatted,
            deep_research_content="",  # Not used for strategy brief
            policy_document=policy_document,
            data_analytics_content=data_analytics_content,
            simulation_content=simulation_content,
            original_query=original_query,
            elaboration=elaboration
        )


        strategy_brief = self.openai_manager.responses_create_and_wait(
            model=self.config.GPT_5,
            system_message=SYSTEM_MSG_STRATEGY,
            user_message=prompt,
        )
        return strategy_brief
    
    def generate_full_policy_dossier(self,
                                   deep_research_content: str,
                                   policy_document: str,
                                   simulation_content: str,
                                   data_analytics_content: str,
                                   original_query: str,
                                   elaboration: str,
                                   timestamp: str) -> str:
        print(f"\n📚 Generating {DESC_POLICY_DOSSIER}")
        print(f"🤖 Model: {self.config.GPT_5}")
        print(f"📄 Sources: {SOURCE_ALL_DOCUMENTS}")

        # Format timestamp for display
        timestamp_formatted = datetime.now().strftime(TIMESTAMP_DISPLAY_FORMAT)

        prompt = self.prompts.FULL_POLICY_DOSSIER_PROMPT.format(
            timestamp=timestamp_formatted,
            deep_research_content=deep_research_content,
            policy_document=policy_document,
            data_analytics_content=data_analytics_content,
            simulation_content=simulation_content,
            original_query=original_query,
            elaboration=elaboration
        )

        policy_dossier = self.openai_manager.responses_create_and_wait(
            model=self.config.GPT_5,
            system_message=SYSTEM_MSG_DOSSIER,
            user_message=prompt,
        )
        return policy_dossier
    
    def save_presentation_documents(self,
                                  executive_summary: str,
                                  strategy_brief: str,
                                  policy_dossier: str,
                                  timestamp: str) -> Dict[str, str]:
        print(f"\n💾 Saving presentation documents...")

        output_dir = Path(self.config.OUTPUT_DIR)

        # Generate filenames
        executive_summary_filename = FILENAME_EXECUTIVE_SUMMARY.format(timestamp=timestamp)
        strategy_brief_filename = FILENAME_STRATEGY_BRIEF.format(timestamp=timestamp)
        policy_dossier_filename = FILENAME_POLICY_DOSSIER.format(timestamp=timestamp)

        # Save files - but validate content first
        files_saved = {}

        # Executive Summary
        if executive_summary and len(executive_summary.strip()) > MIN_CONTENT_LENGTH:
            executive_path = output_dir / executive_summary_filename
            with open(executive_path, 'w', encoding=FILE_ENCODING) as f:
                f.write(executive_summary)
            files_saved['executive_summary'] = str(executive_path)
            print(f"  ✅ Executive Summary: {executive_summary_filename} ({len(executive_summary)} chars)")
        else:
            print(f"  ❌ Executive Summary: SKIPPED (empty content)")

        # Strategy Brief
        if strategy_brief and len(strategy_brief.strip()) > MIN_CONTENT_LENGTH:
            strategy_path = output_dir / strategy_brief_filename
            with open(strategy_path, 'w', encoding=FILE_ENCODING) as f:
                f.write(strategy_brief)
            files_saved['strategy_brief'] = str(strategy_path)
            print(f"  ✅ Strategy Brief: {strategy_brief_filename} ({len(strategy_brief)} chars)")
        else:
            print(f"  ❌ Strategy Brief: SKIPPED (empty content)")

        # Policy Dossier
        if policy_dossier and len(policy_dossier.strip()) > MIN_CONTENT_LENGTH:
            dossier_path = output_dir / policy_dossier_filename
            with open(dossier_path, 'w', encoding=FILE_ENCODING) as f:
                f.write(policy_dossier)
            files_saved['policy_dossier'] = str(dossier_path)
            print(f"  ✅ Full Policy Dossier: {policy_dossier_filename} ({len(policy_dossier)} chars)")
        else:
            print(f"  ❌ Full Policy Dossier: SKIPPED (empty content)")

        print(f"✅ Saved {len(files_saved)}/{TOTAL_OUTPUT_FILES} presentation documents")
        return files_saved
    
    def generate_presentation_suite(self,
                                  timestamp: str,
                                  original_query: str,
                                  elaboration: str) -> Dict[str, str]:
        print(SEPARATOR_LINE)
        print(HEADER_PRESENTATION_GEN)
        print(SEPARATOR_LINE)
        print(f"📅 Input timestamp: {timestamp}")
        print(f"⏰ Started: {datetime.now().strftime(TIMESTAMP_LOG_FORMAT)}")
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

        print("\n" + SEPARATOR_LINE)
        print(HEADER_COMPLETION)
        print(f"📋 {DESC_EXECUTIVE_SUMMARY}: {file_paths['executive_summary']}")
        print(f"📊 {DESC_STRATEGY_BRIEF}: {file_paths['strategy_brief']}")
        print(f"📚 {DESC_POLICY_DOSSIER}: {file_paths['policy_dossier']}")
        print(SEPARATOR_LINE)

        return file_paths


def generate_presentation_documents(timestamp: str, original_query: str, elaboration: str) -> Dict[str, str]:
    agent = PolicyPresentationAgent()
    return agent.generate_presentation_suite(timestamp, original_query, elaboration)


def main():
    """Example usage of the Policy Presentation Agent."""
    agent = PolicyPresentationAgent()

    # Example: Use the timestamp from existing analysis files
    timestamp = EXAMPLE_TIMESTAMP
    original_query = EXAMPLE_QUERY
    elaboration = EXAMPLE_ELABORATION

    presentation_files = agent.generate_presentation_suite(timestamp, original_query, elaboration)

    print(f"\n🎯 SUCCESS! Presentation documents generated:")
    print(f"📋 Executive Summary: {presentation_files['executive_summary']}")
    print(f"📊 Strategy Brief: {presentation_files['strategy_brief']}")
    print(f"📚 Policy Dossier: {presentation_files['policy_dossier']}")


if __name__ == "__main__":
    main()