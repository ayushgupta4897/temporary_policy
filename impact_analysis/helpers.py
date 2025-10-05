import json
from typing import List, Dict, Any, Optional


def extract_text_from_response(response: Any) -> Optional[str]:
    if not response or not getattr(response, 'output', None):
        return None
    final_output = response.output[-1]
    if hasattr(final_output, 'content') and final_output.content:
        content0 = final_output.content[0]
        if hasattr(content0, 'text'):
            return content0.text
    return None


def parse_json_from_text(content: str) -> Any:
    if not content or not content.strip():
        return []
    
    content = content.strip()
    
    # If content doesn't start with JSON-like characters, it's probably an explanation
    if not content.startswith('[') and not content.startswith('{') and '```json' not in content:
        return []
    
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
    
    if not json_content or not json_content.strip():
        return []
    
    # Final check before parsing
    json_content = json_content.strip()
    if not json_content.startswith('[') and not json_content.startswith('{'):
        return []
    
    return json.loads(json_content)


def format_citations_for_analysis(citations: List[Dict]) -> str:
    if not citations:
        return "No quantitative citations found"
    
    formatted = ""
    for i, citation in enumerate(citations, 1):
        formatted += f"[{i}] {citation.get('title', 'Unknown')}\n"
        formatted += f"    Source: {citation.get('publisher', 'Unknown')} ({citation.get('year', 'N/A')})\n"
        if citation.get('doi'):
            formatted += f"    DOI: {citation.get('doi')}\n"
        formatted += f"    Key Finding: {citation.get('key_finding', 'Not specified')}\n"
        if citation.get('multiplier'):
            formatted += f"    Multiplier: {citation.get('multiplier')}\n"
        formatted += f"    Method: {citation.get('methodology', 'Not specified')}\n"
        formatted += f"    Quality: {citation.get('quality_score', 'Not assessed')}\n\n"
    
    return formatted


def deduplicate_citations(citations: List[Dict]) -> List[Dict]:
    seen_urls = set()
    unique_citations = []
    
    for citation in citations:
        url = citation.get('url', '').strip().lower()
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_citations.append(citation)
    
    unique_citations.sort(key=lambda x: x.get('quality_score', 'medium') == 'high', reverse=True)
    
    return unique_citations


def get_actual_model(config_model: str) -> str:
    from policy_drafter.config import PolicyDrafterConfig
    
    model_mapping = {
        PolicyDrafterConfig.GPT_5: "gpt-4o",
        PolicyDrafterConfig.O3_MODEL: "gpt-4o",
        PolicyDrafterConfig.O4_MINI_MODEL: "gpt-4o-mini",
        "gpt-5": "gpt-4o",
        "o3": "gpt-4o",
        "o4-mini": "gpt-4o-mini"
    }
    return model_mapping.get(config_model, config_model)
