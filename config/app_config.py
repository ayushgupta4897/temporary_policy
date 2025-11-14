"""
Configuration for Policy Drafter System
Strategy& PWC - AI-Powered Policy Drafting Agent
"""

import os
import sys
from datetime import datetime
from pathlib import Path

# Add parent directory to path to import from main config
parent_dir = Path(__file__).parent.parent
sys.path.append(str(parent_dir))

# ============================================================================
# CONFIGURATION - Environment Variable Based
# ============================================================================
# These values are loaded from environment variables (set by Azure Container Apps)
# Fallback to hardcoded values for local development only
# ============================================================================

# Load from environment variables (set by Azure Container Apps or .env.azure)
# SECURITY: No fallback values - fail fast if environment variables are not set
# This prevents accidental use of hardcoded/outdated credentials
try:
    OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
except KeyError:
    raise ValueError(
        "OPENAI_API_KEY environment variable is required. "
        "Please set it in your .env.azure file or Azure Container App secrets."
    )

# Azure Storage Configuration
try:
    AZURE_STORAGE_CONNECTION_STRING = os.environ["AZURE_STORAGE_CONNECTION_STRING"]
except KeyError:
    raise ValueError(
        "AZURE_STORAGE_CONNECTION_STRING environment variable is required. "
        "Please set it in your .env.azure file or Azure Container App secrets."
    )

class PolicyDrafterConfig:
    """Main configuration for the policy drafting system."""
    
    # API Configuration  
    OPENAI_API_KEY = OPENAI_API_KEY
    
    # Azure Storage Configuration
    AZURE_STORAGE_CONNECTION_STRING = AZURE_STORAGE_CONNECTION_STRING
    
    # Model Configuration
    O3_MODEL = "o3"  # Use O3 as requested
    O4_MINI_MODEL = "o4-mini"
    GPT_5 = "gpt-5"
    GPT_5_NANO = "gpt-5-nano"
    GPT_5_SEARCH_API = "gpt-5-search-api"  # GPT-5 with web search capabilities
    O4_MINI_DEEP_RESEARCH = "o4-mini-deep-research"

    # Chat-specific Model Configuration
    CHAT_FAST_MODEL = O4_MINI_MODEL  # For simple document lookups
    CHAT_REASONING_MODEL = GPT_5  # For smart decision (fast answer or research plan)
    CHAT_SEARCH_MODEL = "gpt-4o-search-preview"  # For web search + synthesis (correct model)
    
    # Output Configuration
    OUTPUT_DIR = "output"
    TIMESTAMP_FORMAT = "%Y%m%d_%H%M%S"
    
    @staticmethod
    def get_timestamp():
        return datetime.now().strftime(PolicyDrafterConfig.TIMESTAMP_FORMAT)

class AgentRoles:
    """Defines the roles and responsibilities of different agents in the pipeline."""
    
    ELABORATION_AGENT = {
        "name": "Policy Strategist",
        "role": "Senior Strategy Consultant",
        "responsibility": "Transform user queries into comprehensive policy blueprints",
        "expertise": ["Policy Framework Design", "Strategic Planning", "Stakeholder Analysis"]
    }
    
    RESEARCH_AGENT = {
        "name": "Research Analyst", 
        "role": "Senior Research Professional",
        "responsibility": "Conduct exhaustive research with citations on policy domains",
        "expertise": ["Comparative Policy Analysis", "Data Research", "Best Practices Identification"]
    }
    
    DRAFTING_AGENT = {
        "name": "Policy Drafter",
        "role": "Senior Policy Advisor", 
        "responsibility": "Draft comprehensive, implementation-ready policy documents",
        "expertise": ["Policy Writing", "Legal Framework Design", "Implementation Planning"]
    }
    
    CITATION_AGENT = {
        "name": "Citation Analyst",
        "role": "Senior Research Quality Analyst",
        "responsibility": "Analyze and enhance citations with detailed metadata and quality scores",
        "expertise": ["Source Verification", "Content Analysis", "Research Quality Assessment"]
    }
    
    SIMULATION_AGENT = {
        "name": "Policy Simulation Specialist",
        "role": "Senior Strategic Risk Analyst", 
        "responsibility": "Conduct detailed scenario simulations and impact analysis for policy implementation",
        "expertise": ["Scenario Planning", "Risk Assessment", "Implementation Modeling", "Stakeholder Impact Analysis"]
    }