import json
import sys
from pathlib import Path
from typing import List, Dict
from datetime import datetime, timezone, timedelta
import concurrent.futures
from dateutil import parser as date_parser

sys.path.append(str(Path(__file__).parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from .prompts import get_source_search_prompt, get_single_search_prompt, get_enrichment_prompt


# ============================================================================
# CONSTANTS
# ============================================================================

# Batch processing
SEARCH_BATCH_SIZE = 10
ENRICHMENT_BATCH_SIZE = 10
ENRICHMENT_CONCURRENCY = 10

# Models
MODEL_SEARCH = "gpt-4o-search-preview"

# Web search configuration
SEARCH_CONTEXT_SIZE = "high"

# Timeline configurations
TIMELINE_LAST_1_MONTH = "last_1_month"
TIMELINE_LAST_3_MONTHS = "last_3_months"
TIMELINE_LAST_6_MONTHS = "last_6_months"
TIMELINE_LAST_1_YEAR = "last_1_year"
TIMELINE_LAST_2_YEARS = "last_2_years"
TIMELINE_LAST_3_YEARS = "last_3_years"

# Timeline keywords for search
TIMELINE_KEYWORDS_1_MONTH = "last month, recent, 2025"
TIMELINE_KEYWORDS_3_MONTHS = "last 3 months, Q4 2025, recent"
TIMELINE_KEYWORDS_6_MONTHS = "last 6 months, H2 2025"
TIMELINE_KEYWORDS_1_YEAR = "2025, past year"
TIMELINE_KEYWORDS_2_YEARS = "2024-2025"
TIMELINE_KEYWORDS_3_YEARS = "2023-2025"

# Timeline cutoff days
DAYS_IN_1_MONTH = 30
DAYS_IN_3_MONTHS = 90
DAYS_IN_6_MONTHS = 180
DAYS_IN_1_YEAR = 365
DAYS_IN_2_YEARS = 730
DAYS_IN_3_YEARS = 1095

# JSON parsing markers
JSON_CODE_BLOCK_MARKER = "```json"
CODE_BLOCK_MARKER = "```"
JSON_CODE_BLOCK_MARKER_LENGTH = 7
CODE_BLOCK_MARKER_LENGTH = 3

# Special values
UNKNOWN_DATE_MARKER = "??"
DEFAULT_TIMELINE_KEYWORDS = "recent"
DEFAULT_YEAR_MONTH = 1
DEFAULT_YEAR_DAY = 1

# Message roles
ROLE_USER = "user"

# Dictionary keys
KEY_QUERY = "query"
KEY_TIMELINE = "timeline"
KEY_CITATIONS = "citations"
KEY_TOTAL_CITATIONS = "total_citations"
KEY_TIMESTAMP = "timestamp"
KEY_DATE = "date"
KEY_YEAR = "year"
KEY_URL = "url"
KEY_ROLE = "role"
KEY_CONTENT = "content"

# JSON delimiters
DELIMITER_ARRAY_START = "["
DELIMITER_ARRAY_END = "]"
DELIMITER_OBJECT_START = "{"
DELIMITER_OBJECT_END = "}"

# ============================================================================


class NewsHorizonAgent:
    def __init__(self):
        self.openai_manager = get_openai_client()
    
    def analyze(self, query: str, timeline: str = TIMELINE_LAST_6_MONTHS) -> Dict:
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
            KEY_QUERY: query,
            KEY_TIMELINE: timeline,
            KEY_CITATIONS: deduplicated,
            KEY_TOTAL_CITATIONS: len(deduplicated),
            KEY_TIMESTAMP: datetime.now(timezone.utc).isoformat()
        }
    
    def _generate_search_instructions(self, query: str, timeline: str) -> List[Dict]:
        timeline_map = {
            TIMELINE_LAST_1_MONTH: TIMELINE_KEYWORDS_1_MONTH,
            TIMELINE_LAST_3_MONTHS: TIMELINE_KEYWORDS_3_MONTHS,
            TIMELINE_LAST_6_MONTHS: TIMELINE_KEYWORDS_6_MONTHS,
            TIMELINE_LAST_1_YEAR: TIMELINE_KEYWORDS_1_YEAR,
            TIMELINE_LAST_2_YEARS: TIMELINE_KEYWORDS_2_YEARS,
            TIMELINE_LAST_3_YEARS: TIMELINE_KEYWORDS_3_YEARS
        }
        timeline_keywords = timeline_map.get(timeline, DEFAULT_TIMELINE_KEYWORDS)

        prompt = get_source_search_prompt(query, timeline_keywords)

        response = self.openai_manager.chat_completion(
            model=PolicyDrafterConfig.GPT_5,
            messages=[{KEY_ROLE: ROLE_USER, KEY_CONTENT: prompt}]
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

        response = self.openai_manager.chat_completion(
            model=MODEL_SEARCH,
            web_search_options={"search_context_size": SEARCH_CONTEXT_SIZE},
            messages=[{KEY_ROLE: ROLE_USER, KEY_CONTENT: prompt}]
        )

        content = response.choices[0].message.content
        if not content or not content.strip():
            return []

        return self._parse_json(content)
    
    def _filter_by_timeline(self, citations: List[Dict], timeline: str) -> List[Dict]:
        now = datetime.now(timezone.utc)

        cutoffs = {
            TIMELINE_LAST_1_MONTH: now - timedelta(days=DAYS_IN_1_MONTH),
            TIMELINE_LAST_3_MONTHS: now - timedelta(days=DAYS_IN_3_MONTHS),
            TIMELINE_LAST_6_MONTHS: now - timedelta(days=DAYS_IN_6_MONTHS),
            TIMELINE_LAST_1_YEAR: now - timedelta(days=DAYS_IN_1_YEAR),
            TIMELINE_LAST_2_YEARS: now - timedelta(days=DAYS_IN_2_YEARS),
            TIMELINE_LAST_3_YEARS: now - timedelta(days=DAYS_IN_3_YEARS)
        }

        cutoff_date = cutoffs.get(timeline)
        if not cutoff_date:
            return citations

        filtered = []
        for citation in citations:
            article_date = self._parse_date(citation.get(KEY_DATE, ''), citation.get(KEY_YEAR, ''))
            if article_date and article_date >= cutoff_date:
                filtered.append(citation)

        return filtered
    
    def _parse_date(self, date_str: str, year_str: str) -> datetime:
        if date_str and date_str != UNKNOWN_DATE_MARKER:
            parsed = date_parser.parse(date_str, fuzzy=True)
            return parsed.replace(tzinfo=timezone.utc)
        elif year_str:
            return datetime(int(year_str), DEFAULT_YEAR_MONTH, DEFAULT_YEAR_DAY, tzinfo=timezone.utc)
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

        response = self.openai_manager.chat_completion(
            model=PolicyDrafterConfig.GPT_5,
            messages=[{KEY_ROLE: ROLE_USER, KEY_CONTENT: prompt}]
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
            url = citation.get(KEY_URL, '').strip().lower()
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique.append(citation)

        return unique
    
    def _parse_json(self, content: str) -> any:
        if not content or not content.strip():
            return []

        content = content.strip()

        if JSON_CODE_BLOCK_MARKER in content:
            start = content.find(JSON_CODE_BLOCK_MARKER) + JSON_CODE_BLOCK_MARKER_LENGTH
            end = content.find(CODE_BLOCK_MARKER, start)
            content = content[start:end].strip()
        elif CODE_BLOCK_MARKER in content:
            start = content.find(CODE_BLOCK_MARKER) + CODE_BLOCK_MARKER_LENGTH
            end = content.find(CODE_BLOCK_MARKER, start)
            if end > start:
                content = content[start:end].strip()

        content = content.strip()

        if content.startswith(DELIMITER_ARRAY_START):
            bracket_count = 0
            for i, char in enumerate(content):
                if char == DELIMITER_ARRAY_START:
                    bracket_count += 1
                elif char == DELIMITER_ARRAY_END:
                    bracket_count -= 1
                    if bracket_count == 0:
                        try:
                            return json.loads(content[:i+1])
                        except:
                            return []
        elif content.startswith(DELIMITER_OBJECT_START):
            brace_count = 0
            for i, char in enumerate(content):
                if char == DELIMITER_OBJECT_START:
                    brace_count += 1
                elif char == DELIMITER_OBJECT_END:
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
