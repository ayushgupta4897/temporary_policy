#!/usr/bin/env python3
"""
Strategy& PWC - AI Policy Drafter
Simple script to generate policy documents
"""

import sys
from pathlib import Path

# Add current directory to path to import our modules
sys.path.append(str(Path(__file__).parent))

from policy_agent import PolicyDraftingAgent

# Configuration - Edit these variables to customize
POLICY_QUERY = "Draft a policy for Government of Saudi Arabia for health department for infants up to 24 months"
OUTPUT_DIR = "output"
VERBOSE = True

def main():
    """Main function to generate policy document"""
    
    print("🏛️  Strategy& PWC - AI Policy Drafting System")
    print("="*60)
    print(f"📝 Policy Request: {POLICY_QUERY}")
    print()
    
    try:
        # Initialize the policy agent
        agent = PolicyDraftingAgent()
        
        # Update output directory if needed
        if OUTPUT_DIR != 'output':
            agent.config.OUTPUT_DIR = OUTPUT_DIR
            Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
        
        # Run the complete pipeline
        report_path = agent.run_complete_pipeline(POLICY_QUERY)
        
        print(f"\n🎉 SUCCESS!")
        print(f"📄 Policy report generated: {report_path}")
        print(f"📁 Check the output directory for your comprehensive policy document")
        
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️  Process interrupted by user")
        return 1
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if VERBOSE:
            import traceback
            traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())