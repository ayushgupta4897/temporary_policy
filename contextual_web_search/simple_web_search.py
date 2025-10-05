"""
Simple Contextual Web Search - Minimal Implementation
Strategy& PWC

Simple workflow:
1. User query -> GPT-5 elaborates to JSON search instructions
2. Each instruction -> 4o web search with format requirements 
3. Extract and merge all JSON results
"""

import json
import sys
from pathlib import Path
from typing import List, Dict
from datetime import datetime
import concurrent.futures
from openai import OpenAI

# Add parent directory to import config
sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import PolicyDrafterConfig
from .prompts import get_query_elaboration_prompt, get_single_search_prompt


class SimpleWebSearch:
    """Simple contextual web search with minimal complexity."""
    
    def __init__(self, batch_size: int = 10):
        self.client = OpenAI(api_key=PolicyDrafterConfig.OPENAI_API_KEY)
        self.batch_size = batch_size
    
    def search(self, query: str) -> Dict:
        print(f"Starting search for: '{query}'")
        
        # Step 1: GPT-5 elaborates query into search instructions
        search_instructions = self._elaborate_query(query)
        print(f"Generated {len(search_instructions)} search instructions")
        
        # Step 2: Run parallel 4o web searches
        all_results = self._run_parallel_searches(search_instructions)
        print(f"Collected {len(all_results)} total citations")
        
        # Step 3: Merge and deduplicate
        merged_results = self._merge_results(all_results)
        print(f"Final result: {len(merged_results)} unique citations")
        
        return {
            'query': query,
            'total_searches': len(search_instructions),
            'total_citations': len(merged_results),
            'citations': merged_results,
            'timestamp': datetime.now().isoformat()
        }
    
    def _elaborate_query(self, query: str) -> List[Dict]:
        """Step 1: GPT-5 elaborates query into search instructions with detailed source tiering."""
        
        prompt = get_query_elaboration_prompt(query)
        
        response = self.client.chat.completions.create(
            model=PolicyDrafterConfig.GPT_5,
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.choices[0].message.content.strip()
        
        # Extract JSON
        if '```json' in content:
            start = content.find('```json') + 7
            end = content.find('```', start)
            json_content = content[start:end].strip()
        elif '[' in content and ']' in content:
            start = content.find('[')
            end = content.rfind(']') + 1
            json_content = content[start:end]
        else:
            json_content = content
        
        try:
            return json.loads(json_content)
        except:
            print("Failed to parse GPT-5 response, using fallback")
            return [{"search_query": query, "focus": "general search", "priority": 1}]
    
    def _run_parallel_searches(self, instructions: List[Dict]) -> List[Dict]:
        """Step 2: Run parallel 4o web searches."""
        
        all_results = []
        
        # Process in batches
        for i in range(0, len(instructions), self.batch_size):
            batch = instructions[i:i + self.batch_size]
            print(f"Processing batch {i//self.batch_size + 1} ({len(batch)} searches)")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.batch_size) as executor:
                futures = [executor.submit(self._single_search, instruction) for instruction in batch]
                
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        all_results.extend(result)
        
        return all_results
    
    def _single_search(self, instruction: Dict) -> List[Dict]:
        """Execute single 4o web search with detailed source tier instructions."""
        
        prompt = get_single_search_prompt(instruction)
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-search-preview",
                web_search_options={
                    "search_context_size": "high",
                },
                messages=[{"role": "user", "content": prompt}],
                max_tokens=16384
            )
            
            content = response.choices[0].message.content.strip()
            return self._parse_json_response(content)
            
        except Exception as e:
            print(f"Search failed: {e}")
            return []
    
    def _parse_json_response(self, content: str) -> List[Dict]:
        """Extract JSON from response."""
        try:
            # Clean up response
            if '```json' in content:
                start = content.find('```json') + 7
                end = content.find('```', start)
                json_content = content[start:end].strip()
            elif '[' in content and ']' in content:
                start = content.find('[')
                end = content.rfind(']') + 1
                json_content = content[start:end]
            else:
                json_content = content
            
            return json.loads(json_content)
        except:
            return []
    
    def _merge_results(self, all_results: List[Dict]) -> List[Dict]:
        """Step 3: Merge and deduplicate by URL."""
        
        seen_urls = set()
        unique_results = []
        
        for result in all_results:
            url = result.get('url', '').strip().lower()
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
        
        # Sort by year (newest first)
        unique_results.sort(key=lambda x: x.get('year', '0'), reverse=True)
        
        return unique_results
    
    def save_results(self, results: Dict, filename: str = None) -> str:
        """Save results to file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"contextual_search_{timestamp}.json"
        
        filepath = Path("contextual_search_outputs") / filename
        filepath.parent.mkdir(exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"Saved to: {filepath}")
        return str(filepath)


def main():
    """Test function showcasing enhanced source tier capabilities."""
    searcher = SimpleWebSearch(batch_size=10)
    results = searcher.search("UAE digital transformation policy 2024")
    searcher.save_results(results)
    
    print(f"\nENHANCED CONTEXTUAL WEB SEARCH RESULTS")
    print(f"Query: {results['query']}")
    print(f"Total Searches: {results['total_searches']} (across 30 source tiers)")
    print(f"Citations Found: {len(results['citations'])} unique sources")
    
    # Show source tier diversity
    tiers = set(c.get('source_tier', 'unknown') for c in results['citations'])
    print(f"Source Tiers Covered: {len(tiers)} different types")
    
    print(f"\nTOP CITATIONS BY SOURCE TIER:")
    for i, citation in enumerate(results['citations'][:8], 1):
        print(f"\n{i}. {citation.get('title', 'N/A')[:80]}...")
        print(f"   Source Tier: {citation.get('source_tier', 'unknown').replace('_', ' ').title()}")
        print(f"   Publisher: {citation.get('publisher', 'N/A')} ({citation.get('year', 'N/A')})")


if __name__ == "__main__":
    main()
