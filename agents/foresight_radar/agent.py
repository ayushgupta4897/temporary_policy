"""
Foresight Radar Agent - High-Trust Sources Only
Decision-Ready Foresight Analysis

Workflow:
1. Elaborate query into 25 high-trust source searches
2. Run parallel web searches (gpt-4o-search-preview)
3. Generate comprehensive foresight radar using GPT-5
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import concurrent.futures

sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from agents.foresight_radar.prompts import (
    get_search_elaboration_prompt,
    get_single_search_prompt,
    get_radar_analysis_prompt
)
from agents.foresight_radar.helpers import (
    parse_json_from_text,
    extract_radar_json_and_brief,
    format_citations_for_analysis,
    deduplicate_citations,
    validate_high_trust_source,
    sort_signals_by_priority,
    extract_text_from_response
)


# ============================================================================
# CONSTANTS
# ============================================================================

# Timeout Configuration (in seconds)
TIMEOUT_CONNECT = 15.0
TIMEOUT_READ = 10800.0  # 3 hours for long searches
TIMEOUT_WRITE = 120.0
TIMEOUT_POOL = 60.0

# Model Configuration
MODEL_SEARCH = "gpt-4o-search-preview"
SEARCH_CONTEXT_SIZE = "high"
MAX_TOKENS_SEARCH = 16384

# Batch Processing
DEFAULT_BATCH_SIZE = 10

# Message Roles
ROLE_DEVELOPER = "developer"
ROLE_USER = "user"

# Content Types
CONTENT_TYPE_INPUT_TEXT = "input_text"

# File System
OUTPUT_DIRECTORY = "foresight_radar_outputs"
RESULTS_FILENAME_PATTERN = "foresight_radar_{timestamp}.json"
BRIEF_FILENAME_PATTERN = "foresight_radar_brief_{timestamp}.md"
TIMESTAMP_FORMAT = "%Y%m%d_%H%M%S"
FILE_ENCODING = "utf-8"
JSON_INDENT = 2

# Display Strings
EMOJI_RADAR = "🔮"
EMOJI_CHECKMARK = "✓"
EMOJI_SIGNAL = "📡"
EMOJI_SAVE = "💾"
EMOJI_DOCUMENT = "📄"

# Test Configuration
TEST_QUERY = "UAE digital transformation policy 2025"
SEPARATOR_LINE = "=" * 80

# ============================================================================


class ForesightRadarAgent:
    """
    Foresight Radar Agent for high-trust source foresight analysis.

    Uses structured workflow to generate decision-ready foresight radar
    with STEEP-G taxonomy, signal scoring, scenarios, and monitoring framework.
    """

    def __init__(self, batch_size: int = DEFAULT_BATCH_SIZE):
        """
        Initialize the Foresight Radar Agent.

        Args:
            batch_size: Number of concurrent web searches to run
        """
        # Use centralized OpenAI client with long timeout for foresight radar
        timeout_config = {
            'connect': TIMEOUT_CONNECT,
            'read': TIMEOUT_READ,
            'write': TIMEOUT_WRITE,
            'pool': TIMEOUT_POOL
        }
        self.openai_manager = get_openai_client(timeout_config)
        self.batch_size = batch_size

    def analyze(self, query: str) -> Dict[str, Any]:
        """
        Run full foresight radar analysis on a query.

        Args:
            query: User query for foresight analysis

        Returns:
            Dictionary containing radar_json, brief_markdown, and metadata
        """
        print(f"{EMOJI_RADAR} Starting Foresight Radar for: '{query}'")

        # Step 1: Elaborate query into high-trust source searches
        search_instructions = self._elaborate_search_query(query)
        print(f"{EMOJI_CHECKMARK} Generated {len(search_instructions)} high-trust source searches")

        # Step 2: Run parallel web searches
        all_citations = self._run_parallel_searches(search_instructions)
        print(f"{EMOJI_CHECKMARK} Collected {len(all_citations)} total citations")

        # Filter for high-trust sources only
        high_trust_citations = [
            c for c in all_citations if validate_high_trust_source(c)
        ]
        print(f"{EMOJI_CHECKMARK} Validated {len(high_trust_citations)} high-trust sources")

        # Deduplicate
        unique_citations = deduplicate_citations(high_trust_citations)
        print(f"{EMOJI_CHECKMARK} Deduplicated to {len(unique_citations)} unique citations")

        # Step 3: Generate foresight radar analysis
        radar_result = self._generate_radar_analysis(query, unique_citations)
        print(f"{EMOJI_CHECKMARK} Generated foresight radar with {len(radar_result.get('radar_json', {}).get('radar_items', []))} signals")

        # Step 4: Sort signals by priority
        if 'radar_items' in radar_result.get('radar_json', {}):
            sorted_items = sort_signals_by_priority(radar_result['radar_json']['radar_items'])
            radar_result['radar_json']['radar_items'] = sorted_items

        # Compile final result
        result = {
            'query': query,
            'timestamp': datetime.now().isoformat(),
            'citations_count': len(unique_citations),
            'citations': unique_citations,
            'radar_json': radar_result.get('radar_json', {}),
            'brief_markdown': radar_result.get('brief_markdown', ''),
        }

        print(f"{EMOJI_CHECKMARK} Foresight Radar completed")

        return result

    def _generate_with_responses_api(self, user_text: str, system_text: str = "", model: str = None) -> str:
        """
        Generate text using OpenAI Responses API.

        Args:
            user_text: User prompt text
            system_text: Optional system prompt
            model: Model to use (defaults to GPT-5)

        Returns:
            Generated text
        """
        if not model:
            model = PolicyDrafterConfig.GPT_5

        input_messages = []

        if system_text:
            input_messages.append({
                "role": ROLE_DEVELOPER,
                "content": [{"type": CONTENT_TYPE_INPUT_TEXT, "text": system_text}]
            })

        input_messages.append({
            "role": ROLE_USER,
            "content": [{"type": CONTENT_TYPE_INPUT_TEXT, "text": user_text}]
        })

        response = self.openai_manager.responses_create(
            model=model,
            input_messages=input_messages
        )
        text = extract_text_from_response(response)
        return text.strip()

    def _elaborate_search_query(self, query: str) -> List[Dict]:
        """
        Elaborate query into 25 high-trust source searches using GPT-5.

        Args:
            query: User query

        Returns:
            List of search instruction dictionaries
        """
        prompt = get_search_elaboration_prompt(query)
        content = self._generate_with_responses_api(prompt)
        instructions = parse_json_from_text(content)

        assert isinstance(instructions, list), f"Search elaboration must return a list, got {type(instructions)}"

        return instructions

    def _run_parallel_searches(self, instructions: List[Dict]) -> List[Dict]:
        """
        Run parallel web searches using gpt-4o-search-preview.

        Args:
            instructions: List of search instruction dictionaries

        Returns:
            List of all citation dictionaries
        """
        all_results = []

        # Process in batches
        for i in range(0, len(instructions), self.batch_size):
            batch = instructions[i:i + self.batch_size]
            print(f"  {EMOJI_SIGNAL} Batch {i//self.batch_size + 1}: {len(batch)} searches")

            with concurrent.futures.ThreadPoolExecutor(max_workers=self.batch_size) as executor:
                futures = [executor.submit(self._single_search, instruction) for instruction in batch]

                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        all_results.extend(result)

        return all_results

    def _single_search(self, instruction: Dict) -> List[Dict]:
        """
        Execute a single web search using gpt-4o-search-preview.

        Args:
            instruction: Search instruction dictionary

        Returns:
            List of citation dictionaries from this search
        """
        prompt = get_single_search_prompt(instruction)

        response = self.openai_manager.chat_completion(
            model=MODEL_SEARCH,
            messages=[{"role": ROLE_USER, "content": prompt}],
            web_search_options={"search_context_size": SEARCH_CONTEXT_SIZE},
            max_tokens=MAX_TOKENS_SEARCH
        )

        content = response.choices[0].message.content.strip()
        return parse_json_from_text(content)

    def _generate_radar_analysis(self, query: str, citations: List[Dict]) -> Dict[str, Any]:
        """
        Generate comprehensive foresight radar analysis using GPT-5.

        Args:
            query: User query
            citations: List of high-trust citation dictionaries

        Returns:
            Dictionary with 'radar_json' and 'brief_markdown'
        """
        citations_text = format_citations_for_analysis(citations)
        prompt = get_radar_analysis_prompt(query, citations_text)

        content = self._generate_with_responses_api(prompt)
        result = extract_radar_json_and_brief(content)

        return result

    def save_results(self, results: Dict, filename: str = None) -> str:
        """
        Save foresight radar results to file.

        Args:
            results: Results dictionary from analyze()
            filename: Optional filename (auto-generated if not provided)

        Returns:
            Path to saved file
        """
        if not filename:
            timestamp = datetime.now().strftime(TIMESTAMP_FORMAT)
            filename = RESULTS_FILENAME_PATTERN.format(timestamp=timestamp)

        filepath = Path(OUTPUT_DIRECTORY) / filename
        filepath.parent.mkdir(exist_ok=True)

        with open(filepath, 'w', encoding=FILE_ENCODING) as f:
            json.dump(results, f, indent=JSON_INDENT, ensure_ascii=False)

        print(f"{EMOJI_SAVE} Saved to: {filepath}")
        return str(filepath)

    def save_brief(self, results: Dict, filename: str = None) -> str:
        """
        Save the markdown brief to a separate file.

        Args:
            results: Results dictionary from analyze()
            filename: Optional filename (auto-generated if not provided)

        Returns:
            Path to saved file
        """
        if not filename:
            timestamp = datetime.now().strftime(TIMESTAMP_FORMAT)
            filename = BRIEF_FILENAME_PATTERN.format(timestamp=timestamp)

        filepath = Path(OUTPUT_DIRECTORY) / filename
        filepath.parent.mkdir(exist_ok=True)

        brief_content = f"""# Foresight Radar Analysis

**Query:** {results.get('query', 'N/A')}
**Generated:** {results.get('timestamp', 'N/A')}
**Citations:** {results.get('citations_count', 0)} high-trust sources

---

{results.get('brief_markdown', 'No brief available.')}
"""

        with open(filepath, 'w', encoding=FILE_ENCODING) as f:
            f.write(brief_content)

        print(f"{EMOJI_DOCUMENT} Brief saved to: {filepath}")
        return str(filepath)


def main():
    """Test function for Foresight Radar Agent."""
    agent = ForesightRadarAgent(batch_size=DEFAULT_BATCH_SIZE)

    # Test query
    query = TEST_QUERY

    print(f"\n{SEPARATOR_LINE}")
    print(f"FORESIGHT RADAR - HIGH-TRUST SOURCES ONLY")
    print(f"{SEPARATOR_LINE}\n")

    # Run analysis
    results = agent.analyze(query)

    # Save results
    agent.save_results(results)
    agent.save_brief(results)

    # Print summary
    print(f"\n{SEPARATOR_LINE}")
    print(f"ANALYSIS SUMMARY")
    print(f"{SEPARATOR_LINE}")
    print(f"Query: {results['query']}")
    print(f"Citations: {results['citations_count']} high-trust sources")

    radar_json = results.get('radar_json', {})
    print(f"Signals: {len(radar_json.get('radar_items', []))}")
    print(f"Scenarios: {len(radar_json.get('scenarios', []))}")
    print(f"Watchlist: {len(radar_json.get('watchlist', []))}")

    # Print top 3 signals
    radar_items = radar_json.get('radar_items', [])
    if radar_items:
        print(f"\nTOP 3 SIGNALS:")
        for i, signal in enumerate(radar_items[:3], 1):
            print(f"\n{i}. {signal.get('title', 'N/A')}")
            print(f"   Ring: {signal.get('ring', 'N/A')} | Quadrant: {signal.get('quadrant', 'N/A')}")
            print(f"   Impact: {signal.get('impact_0to5', 0):.1f} | Likelihood: {signal.get('likelihood_0to5', 0):.1f} | Confidence: {signal.get('confidence_0to5', 0):.1f}")
            print(f"   Priority: {signal.get('priority_score', 0):.2f}")


if __name__ == "__main__":
    main()
