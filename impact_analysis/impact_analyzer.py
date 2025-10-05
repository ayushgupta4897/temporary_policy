import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import concurrent.futures
from openai import OpenAI
import httpx

sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import PolicyDrafterConfig
from impact_analysis.prompts import (
    CITATION_SEARCH_ELABORATION,
    META_PROMPT_GENERATION,
    IMPACT_ANALYSIS_PROMPT,
    SINGLE_SEARCH_PROMPT
)
from impact_analysis.helpers import (
    extract_text_from_response,
    parse_json_from_text,
    format_citations_for_analysis,
    deduplicate_citations,
    get_actual_model
)


class ImpactAnalyzer:
    
    def __init__(self, batch_size: int = 10):
        http_timeout = httpx.Timeout(connect=15.0, read=10800.0, write=120.0, pool=60.0)
        http_client = httpx.Client(timeout=http_timeout, http2=False, trust_env=True)
        
        self.client = OpenAI(
            api_key=PolicyDrafterConfig.OPENAI_API_KEY,
            http_client=http_client
        )
        self.batch_size = batch_size
    
    def analyze_impact(self, query: str) -> Dict[str, Any]:
        print(f"Starting impact analysis for: '{query}'")
        
        search_instructions = self._elaborate_search_query(query)
        meta_prompt_future = concurrent.futures.ThreadPoolExecutor(max_workers=1).submit(
            self._generate_meta_prompt, query
        )
        
        citations = self._run_parallel_searches(search_instructions)
        meta_prompt = meta_prompt_future.result()
        
        impact_analysis = self._generate_impact_analysis(meta_prompt, citations)
        
        print(f"Analysis completed: {len(citations)} citations used")
        
        return {
            'query': query,
            'meta_prompt': meta_prompt,
            'citations_count': len(citations),
            'citations': citations,
            'impact_analysis': impact_analysis,
            'timestamp': datetime.now().isoformat()
        }
    
    def _generate_with_responses_api(self, user_text: str, system_text: str = "", model: str = None) -> str:
        if not model:
            model = PolicyDrafterConfig.GPT_5
        
        actual_model = get_actual_model(model)
        
        request_params = {
            "model": actual_model,
            "input": []
        }
        
        if system_text:
            request_params["input"].append({
                "role": "developer", 
                "content": [{"type": "input_text", "text": system_text}]
            })
        
        request_params["input"].append({
            "role": "user", 
            "content": [{"type": "input_text", "text": user_text}]
        })
        
        response = self.client.responses.create(**request_params)
        text = extract_text_from_response(response)
        return text.strip()
    
    def _elaborate_search_query(self, query: str) -> List[Dict]:
        prompt = CITATION_SEARCH_ELABORATION.format(query=query)
        content = self._generate_with_responses_api(prompt)
        instructions = parse_json_from_text(content)
        print(f"Generated {len(instructions)} search instructions")
        return instructions
    
    def _generate_meta_prompt(self, query: str) -> str:
        prompt = META_PROMPT_GENERATION.format(query=query)
        meta_prompt = self._generate_with_responses_api(prompt)
        print("Meta-prompt framework generated")
        return meta_prompt
    
    def _run_parallel_searches(self, instructions: List[Dict]) -> List[Dict]:
        all_results = []
        
        for i in range(0, len(instructions), self.batch_size):
            batch = instructions[i:i + self.batch_size]
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.batch_size) as executor:
                futures = [executor.submit(self._single_search, instruction) for instruction in batch]
                
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        all_results.extend(result)
        
        return deduplicate_citations(all_results)
    
    def _single_search(self, instruction: Dict) -> List[Dict]:
        prompt = SINGLE_SEARCH_PROMPT.format(
            source_tier=instruction.get('source_tier', '').upper(),
            search_query=instruction.get('search_query', ''),
            focus=instruction.get('focus', ''),
            search_instructions=instruction.get('search_instructions', ''),
            source_tier_value=instruction.get('source_tier', '')
        )
        
        response = self.client.chat.completions.create(
            model="gpt-4o-search-preview",
            web_search_options={"search_context_size": "high"},
            messages=[{"role": "user", "content": prompt}],
            max_tokens=16384
        )
        
        content = response.choices[0].message.content.strip()
        return parse_json_from_text(content)
    
    def _generate_impact_analysis(self, meta_prompt: str, citations: List[Dict]) -> str:
        citations_text = format_citations_for_analysis(citations)
        
        prompt = IMPACT_ANALYSIS_PROMPT.format(
            meta_prompt=meta_prompt,
            citations=citations_text
        )
        
        return self._generate_with_responses_api(prompt)
    
    def save_results(self, results: Dict, filename: str = None) -> str:
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"impact_analysis_{timestamp}.json"
        
        filepath = Path("impact_analysis_outputs") / filename
        filepath.parent.mkdir(exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"Results saved to: {filepath}")
        return str(filepath)