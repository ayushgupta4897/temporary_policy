import json
import sys
from pathlib import Path
from typing import List, Dict
from datetime import datetime, timezone, timedelta
from openai import OpenAI
import concurrent.futures
from dateutil import parser as date_parser

sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import PolicyDrafterConfig
from .prompts import get_source_search_prompt, get_single_search_prompt, get_enrichment_prompt


SEARCH_BATCH_SIZE = 10
ENRICHMENT_BATCH_SIZE = 10
ENRICHMENT_CONCURRENCY = 10


class NewsHorizonAgent:
    def __init__(self):
        self.client = OpenAI(api_key=PolicyDrafterConfig.OPENAI_API_KEY)
    
    def analyze(self, query: str, timeline: str = "last_6_months") -> Dict:
        print(f"✓ Starting: '{query}' ({timeline})")
        
        search_instructions = self._generate_search_instructions(query, timeline)
        print(f"✓ Generated {len(search_instructions)} search instructions")
        
        all_citations = self._run_parallel_searches(search_instructions)
        print(f"✓ Collected {len(all_citations)} citations")
        
        filtered_citations = self._filter_by_timeline(all_citations, timeline)
        print(f"✓ Timeline filtered: {len(filtered_citations)} kept, {len(all_citations) - len(filtered_citations)} removed")
        
        enriched_citations = self._enrich_citations(filtered_citations)
        print(f"✓ Enriched {len(enriched_citations)} citations")
        
        deduplicated = self._deduplicate(enriched_citations)
        print(f"✓ Final: {len(deduplicated)} unique citations")
        
        return {
            'query': query,
            'timeline': timeline,
            'citations': deduplicated,
            'total_citations': len(deduplicated),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
    
    def _generate_search_instructions(self, query: str, timeline: str) -> List[Dict]:
        timeline_map = {
            "last_1_month": "last month, recent, 2025",
            "last_3_months": "last 3 months, Q4 2025, recent",
            "last_6_months": "last 6 months, H2 2025",
            "last_1_year": "2025, past year",
            "last_2_years": "2024-2025",
            "last_3_years": "2023-2025"
        }
        timeline_keywords = timeline_map.get(timeline, "recent")
        
        prompt = get_source_search_prompt(query, timeline_keywords)
        
        response = self.client.chat.completions.create(
            model=PolicyDrafterConfig.GPT_5,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return self._parse_json(response.choices[0].message.content)
    
    def _run_parallel_searches(self, instructions: List[Dict]) -> List[Dict]:
        all_results = []
        
        for i in range(0, len(instructions), SEARCH_BATCH_SIZE):
            batch = instructions[i:i + SEARCH_BATCH_SIZE]
            print(f"  Batch {i//SEARCH_BATCH_SIZE + 1}: {len(batch)} searches")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=SEARCH_BATCH_SIZE) as executor:
                futures = [executor.submit(self._single_search, inst) for inst in batch]
                
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        all_results.extend(result)
        
        return all_results
    
    def _single_search(self, instruction: Dict) -> List[Dict]:
        prompt = get_single_search_prompt(instruction)
        
        response = self.client.chat.completions.create(
            model="gpt-4o-search-preview",
            web_search_options={"search_context_size": "high"},
            messages=[{"role": "user", "content": prompt}]
        )
        
        content = response.choices[0].message.content
        if not content or not content.strip():
            return []
        
        return self._parse_json(content)
    
    def _filter_by_timeline(self, citations: List[Dict], timeline: str) -> List[Dict]:
        now = datetime.now(timezone.utc)
        
        cutoffs = {
            "last_1_month": now - timedelta(days=30),
            "last_3_months": now - timedelta(days=90),
            "last_6_months": now - timedelta(days=180),
            "last_1_year": now - timedelta(days=365),
            "last_2_years": now - timedelta(days=730),
            "last_3_years": now - timedelta(days=1095)
        }
        
        cutoff_date = cutoffs.get(timeline)
        if not cutoff_date:
            return citations
        
        filtered = []
        for citation in citations:
            article_date = self._parse_date(citation.get('date', ''), citation.get('year', ''))
            if article_date and article_date >= cutoff_date:
                filtered.append(citation)
        
        return filtered
    
    def _parse_date(self, date_str: str, year_str: str) -> datetime:
        if date_str and date_str != '??':
            parsed = date_parser.parse(date_str, fuzzy=True)
            return parsed.replace(tzinfo=timezone.utc)
        elif year_str:
            return datetime(int(year_str), 1, 1, tzinfo=timezone.utc)
        return None
    
    def _enrich_citations(self, citations: List[Dict]) -> List[Dict]:
        if not citations:
            return citations
        
        enriched = []
        
        for i in range(0, len(citations), ENRICHMENT_BATCH_SIZE):
            batch = citations[i:i + ENRICHMENT_BATCH_SIZE]
            print(f"  Enrichment batch {i//ENRICHMENT_BATCH_SIZE + 1}: {len(batch)} citations")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=ENRICHMENT_CONCURRENCY) as executor:
                future = executor.submit(self._enrich_batch, batch)
                result = future.result()
                enriched.extend(result)
        
        return enriched
    
    def _enrich_batch(self, batch: List[Dict]) -> List[Dict]:
        prompt = get_enrichment_prompt(batch)
        
        response = self.client.chat.completions.create(
            model=PolicyDrafterConfig.GPT_5,
            messages=[{"role": "user", "content": prompt}]
        )
        
        enrichment_data = self._parse_json(response.choices[0].message.content)
        
        if len(enrichment_data) == len(batch):
            for citation, enrichment in zip(batch, enrichment_data):
                citation.update(enrichment)
        
        return batch
    
    def _deduplicate(self, citations: List[Dict]) -> List[Dict]:
        seen_urls = set()
        unique = []
        
        for citation in citations:
            url = citation.get('url', '').strip().lower()
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique.append(citation)
        
        return unique
    
    def _parse_json(self, content: str) -> any:
        if not content or not content.strip():
            return []
        
        content = content.strip()
        
        if '```json' in content:
            start = content.find('```json') + 7
            end = content.find('```', start)
            content = content[start:end].strip()
        elif '```' in content:
            start = content.find('```') + 3
            end = content.find('```', start)
            if end > start:
                content = content[start:end].strip()
        
        content = content.strip()
        
        if content.startswith('['):
            bracket_count = 0
            for i, char in enumerate(content):
                if char == '[':
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                    if bracket_count == 0:
                        try:
                            return json.loads(content[:i+1])
                        except:
                            return []
        elif content.startswith('{'):
            brace_count = 0
            for i, char in enumerate(content):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        try:
                            return json.loads(content[:i+1])
                        except:
                            return []
        
        try:
            return json.loads(content)
        except:
            return []
