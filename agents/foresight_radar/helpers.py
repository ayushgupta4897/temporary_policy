"""
Helper functions for Foresight Radar Agent
"""

import json
from typing import List, Dict, Any

# ============================================================================
# CONSTANTS
# ============================================================================

# Markdown code block markers
MARKDOWN_JSON_MARKER = '```json'
MARKDOWN_CODE_MARKER = '```'
MARKDOWN_JSON_MARKER_LENGTH = 7
MARKDOWN_CODE_MARKER_LENGTH = 3

# JSON delimiters
JSON_ARRAY_START = '['
JSON_ARRAY_END = ']'
JSON_OBJECT_START = '{'
JSON_OBJECT_END = '}'

# Separator characters
SEPARATOR_LINE = "=" * 80

# Source number format
SOURCE_NUMBER_PREFIX = "SOURCE #"

# High-trust domains
HIGH_TRUST_DOMAINS = [
    '.gov', '.int', '.edu',
    'imf.org', 'worldbank.org', 'oecd.org',
    'un.org', 'who.int', 'iea.org', 'opec.org',
    'centralbank', 'federal reserve',
    'nature.com', 'science.org',
    'brookings.edu', 'rand.org', 'chathamhouse.org'
]

# Excluded keywords for source validation
EXCLUDED_KEYWORDS = [
    'blog', 'wordpress', 'medium.com', 'substack',
    'wikipedia.org'
]

# Valid source types
VALID_SOURCE_TYPES = [
    'government_report', 'international_org', 'central_bank',
    'peer_reviewed', 'official_statistics'
]

# Model mapping
MODEL_MAPPING = {
    "gpt-5": "gpt-4o-2024-11-20",
    "o3": "o3-mini",
    "o4-mini": "o1-mini",
    "o4-mini-deep-research": "o1-mini"
}

# Default messages
DEFAULT_NO_CITATIONS_MESSAGE = "No citations available."

# Score scaling factor
CONFIDENCE_SCALE_FACTOR = 5.0

# ============================================================================


def parse_json_from_text(text: str) -> Any:
    """
    Extract and parse JSON from text that may contain markdown code blocks or extra text.

    Args:
        text: Text containing JSON

    Returns:
        Parsed JSON object (list or dict)
    """
    if not text or not text.strip():
        return []

    text = text.strip()

    # Try to extract from markdown code block
    if MARKDOWN_JSON_MARKER in text:
        start = text.find(MARKDOWN_JSON_MARKER) + MARKDOWN_JSON_MARKER_LENGTH
        end = text.find(MARKDOWN_CODE_MARKER, start)
        if end > start:
            text = text[start:end].strip()
    elif MARKDOWN_CODE_MARKER in text:
        start = text.find(MARKDOWN_CODE_MARKER) + MARKDOWN_CODE_MARKER_LENGTH
        end = text.find(MARKDOWN_CODE_MARKER, start)
        if end > start:
            text = text[start:end].strip()

    # Try to find JSON array
    if JSON_ARRAY_START in text and JSON_ARRAY_END in text:
        start = text.find(JSON_ARRAY_START)
        # Find matching closing bracket
        bracket_count = 0
        for i in range(start, len(text)):
            if text[i] == JSON_ARRAY_START:
                bracket_count += 1
            elif text[i] == JSON_ARRAY_END:
                bracket_count -= 1
                if bracket_count == 0:
                    try:
                        return json.loads(text[start:i+1])
                    except json.JSONDecodeError:
                        pass

    # Try to find JSON object
    if JSON_OBJECT_START in text and JSON_OBJECT_END in text:
        start = text.find(JSON_OBJECT_START)
        # Find matching closing brace
        brace_count = 0
        for i in range(start, len(text)):
            if text[i] == JSON_OBJECT_START:
                brace_count += 1
            elif text[i] == JSON_OBJECT_END:
                brace_count -= 1
                if brace_count == 0:
                    try:
                        return json.loads(text[start:i+1])
                    except json.JSONDecodeError:
                        pass

    # Try to parse the entire text as JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return []


def extract_radar_json_and_brief(content: str) -> Dict[str, Any]:
    """
    Extract both the radar JSON and markdown brief from the response.

    Args:
        content: Full response text containing both JSON and brief

    Returns:
        Dict with 'radar_json' and 'brief_markdown' keys
    """
    radar_json = None
    brief_markdown = ""

    # Try to extract JSON from markdown code block
    if MARKDOWN_JSON_MARKER in content:
        json_start = content.find(MARKDOWN_JSON_MARKER) + MARKDOWN_JSON_MARKER_LENGTH
        json_end = content.find(MARKDOWN_CODE_MARKER, json_start)
        if json_end > json_start:
            json_text = content[json_start:json_end].strip()
            try:
                radar_json = json.loads(json_text)
            except json.JSONDecodeError:
                radar_json = parse_json_from_text(json_text)

            # Everything after the JSON block is the brief
            brief_start = json_end + MARKDOWN_CODE_MARKER_LENGTH
            brief_markdown = content[brief_start:].strip()
    else:
        # Try to parse the whole thing
        radar_json = parse_json_from_text(content)

    return {
        'radar_json': radar_json if radar_json else {},
        'brief_markdown': brief_markdown
    }


def format_citations_for_analysis(citations: List[Dict]) -> str:
    """
    Format citations into a structured text for the radar analysis prompt.

    Args:
        citations: List of citation dictionaries

    Returns:
        Formatted citation text
    """
    if not citations:
        return DEFAULT_NO_CITATIONS_MESSAGE

    formatted = []
    for i, citation in enumerate(citations, 1):
        formatted.append(f"""
{SOURCE_NUMBER_PREFIX}{i}
Title: {citation.get('title', 'N/A')}
Publisher: {citation.get('publisher', 'N/A')}
Date: {citation.get('date', 'N/A')} (Year: {citation.get('year', 'N/A')})
URL: {citation.get('url', 'N/A')}
Source Tier: {citation.get('source_tier', 'N/A')}
Source Type: {citation.get('source_type', 'N/A')}
STEEP-G Quadrant: {citation.get('steep_g_quadrant', 'N/A')}

Key Finding: {citation.get('key_finding', 'N/A')}
Data Period: {citation.get('data_period', 'N/A')}
Methodology: {citation.get('methodology', 'Not specified')}
        """.strip())

    return "\n\n" + SEPARATOR_LINE + "\n\n".join(formatted)


def deduplicate_citations(citations: List[Dict]) -> List[Dict]:
    """
    Remove duplicate citations based on URL.

    Args:
        citations: List of citation dictionaries

    Returns:
        Deduplicated list of citations
    """
    seen_urls = set()
    unique_citations = []

    for citation in citations:
        url = citation.get('url', '').strip().lower()
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_citations.append(citation)

    return unique_citations


def validate_high_trust_source(citation: Dict) -> bool:
    """
    Validate if a citation is from a high-trust source.

    Args:
        citation: Citation dictionary

    Returns:
        True if from high-trust source, False otherwise
    """
    url = citation.get('url', '').lower()
    publisher = citation.get('publisher', '').lower()
    source_type = citation.get('source_type', '').lower()

    # Check if excluded
    for excluded in EXCLUDED_KEYWORDS:
        if excluded in url or excluded in publisher:
            return False

    # Check if high-trust
    for domain in HIGH_TRUST_DOMAINS:
        if domain in url or domain in publisher:
            return True

    # Check source type
    return source_type in VALID_SOURCE_TYPES


def calculate_signal_priority(impact: float, likelihood: float, confidence: float) -> float:
    """
    Calculate signal priority score.

    Args:
        impact: Impact score (0-5)
        likelihood: Likelihood score (0-5)
        confidence: Confidence score (0-5)

    Returns:
        Priority score
    """
    return (impact * likelihood) * (confidence / CONFIDENCE_SCALE_FACTOR)


def sort_signals_by_priority(radar_items: List[Dict]) -> List[Dict]:
    """
    Sort radar signals by priority score.

    Args:
        radar_items: List of radar item dictionaries

    Returns:
        Sorted list of radar items
    """
    for item in radar_items:
        item['priority_score'] = calculate_signal_priority(
            item.get('impact_0to5', 0),
            item.get('likelihood_0to5', 0),
            item.get('confidence_0to5', 0)
        )

    return sorted(radar_items, key=lambda x: x.get('priority_score', 0), reverse=True)


def extract_text_from_response(response) -> str:
    """
    Extract text from OpenAI API response (handles both chat and responses API).

    Args:
        response: OpenAI API response object

    Returns:
        Extracted text content
    """
    # Try responses API format first
    if hasattr(response, 'output'):
        if isinstance(response.output, list):
            for item in response.output:
                if hasattr(item, 'content') and isinstance(item.content, list):
                    for content_item in item.content:
                        if hasattr(content_item, 'text'):
                            return content_item.text
                        elif isinstance(content_item, dict) and 'text' in content_item:
                            return content_item['text']

    # Try chat completions format
    if hasattr(response, 'choices') and len(response.choices) > 0:
        choice = response.choices[0]
        if hasattr(choice, 'message') and hasattr(choice.message, 'content'):
            return choice.message.content

    return ""