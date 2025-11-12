import json
import re
from typing import List, Dict, Any, Optional, Tuple

# ============================================================================
# CONSTANTS
# ============================================================================

# Markdown code block markers
MARKDOWN_JSON_MARKER = '```json'
MARKDOWN_JSON_MARKER_LENGTH = 7

# JSON delimiters
JSON_ARRAY_START = '['
JSON_ARRAY_END = ']'
JSON_OBJECT_START = '{'
JSON_OBJECT_END = '}'

# Default messages
DEFAULT_NO_CITATIONS_MESSAGE = "No quantitative citations found"

# Quality score sorting
QUALITY_SCORE_KEY = 'quality_score'
QUALITY_SCORE_HIGH = 'high'
QUALITY_SCORE_MEDIUM = 'medium'
QUALITY_SCORE_LOW = 'low'

# Citation field names
FIELD_TITLE = 'title'
FIELD_PUBLISHER = 'publisher'
FIELD_YEAR = 'year'
FIELD_DOI = 'doi'
FIELD_KEY_FINDING = 'key_finding'
FIELD_MULTIPLIER = 'multiplier'
FIELD_METHODOLOGY = 'methodology'
FIELD_URL = 'url'

# Default field values
DEFAULT_TITLE = 'Unknown'
DEFAULT_PUBLISHER = 'Unknown'
DEFAULT_YEAR = 'N/A'
DEFAULT_METHODOLOGY = 'Not specified'
DEFAULT_QUALITY = 'Not assessed'

# Model mapping
MODEL_MAPPING = {
    "gpt-5": "gpt-4o",
    "o3": "gpt-4o",
    "o4-mini": "gpt-4o-mini"
}

# High-trust publisher patterns
HIGH_TRUST_PUBLISHERS = [
    'nber', 'world bank', 'imf', 'international monetary fund', 'oecd',
    'federal reserve', 'ecb', 'european central bank', 'boe', 'bank of england',
    'journal of', 'quarterly journal', 'review of', 'american economic',
    'nature', 'science', 'pnas', 'lancet', 'bmj', 'jama',
    'brookings', 'rand corporation', 'urban institute',
    'national bureau', 'census bureau', 'statistics'
]

# High-quality methodologies (ordered by causal strength)
HIGH_QUALITY_METHODS = [
    'randomized controlled trial', 'rct', 'randomized experiment',
    'instrumental variables', 'instrumental variable', 'iv estimation',
    'regression discontinuity', 'rdd', 'discontinuity design',
    'difference-in-differences', 'diff-in-diff', 'did', 'differences-in-differences',
    'natural experiment', 'quasi-experimental'
]

MEDIUM_QUALITY_METHODS = [
    'panel data', 'fixed effects', 'panel regression',
    'propensity score matching', 'psm', 'matching estimator',
    'synthetic control', 'event study',
    'time series', 'vector autoregression', 'var'
]

# Minimum year threshold for citations
MIN_YEAR_THRESHOLD = 1990

# ============================================================================


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
    if not content.startswith(JSON_ARRAY_START) and not content.startswith(JSON_OBJECT_START) and MARKDOWN_JSON_MARKER not in content:
        return []

    if MARKDOWN_JSON_MARKER in content:
        start = content.find(MARKDOWN_JSON_MARKER) + MARKDOWN_JSON_MARKER_LENGTH
        end = content.find('```', start)
        json_content = content[start:end].strip()
    elif JSON_ARRAY_START in content and JSON_ARRAY_END in content:
        start = content.find(JSON_ARRAY_START)
        end = content.rfind(JSON_ARRAY_END) + 1
        json_content = content[start:end]
    else:
        json_content = content

    if not json_content or not json_content.strip():
        return []

    # Final check before parsing
    json_content = json_content.strip()
    if not json_content.startswith(JSON_ARRAY_START) and not json_content.startswith(JSON_OBJECT_START):
        return []
    
    return json.loads(json_content)


def format_citations_for_analysis(citations: List[Dict]) -> str:
    if not citations:
        return DEFAULT_NO_CITATIONS_MESSAGE

    formatted = ""
    for i, citation in enumerate(citations, 1):
        formatted += f"[{i}] {citation.get(FIELD_TITLE, DEFAULT_TITLE)}\n"
        formatted += f"    Source: {citation.get(FIELD_PUBLISHER, DEFAULT_PUBLISHER)} ({citation.get(FIELD_YEAR, DEFAULT_YEAR)})\n"
        if citation.get(FIELD_DOI):
            formatted += f"    DOI: {citation.get(FIELD_DOI)}\n"
        formatted += f"    Key Finding: {citation.get(FIELD_KEY_FINDING, DEFAULT_METHODOLOGY)}\n"
        if citation.get(FIELD_MULTIPLIER):
            formatted += f"    Multiplier: {citation.get(FIELD_MULTIPLIER)}\n"
        formatted += f"    Method: {citation.get(FIELD_METHODOLOGY, DEFAULT_METHODOLOGY)}\n"
        formatted += f"    Quality: {citation.get(QUALITY_SCORE_KEY, DEFAULT_QUALITY)}\n\n"

    return formatted


def deduplicate_citations(citations: List[Dict]) -> List[Dict]:
    seen_urls = set()
    unique_citations = []

    for citation in citations:
        url = citation.get(FIELD_URL, '').strip().lower()
        if url and url not in seen_urls:
            seen_urls.add(url)
            unique_citations.append(citation)

    unique_citations.sort(key=lambda x: x.get(QUALITY_SCORE_KEY, QUALITY_SCORE_MEDIUM) == QUALITY_SCORE_HIGH, reverse=True)

    return unique_citations


# ============================================================================
# CITATION QUALITY VALIDATION & SCORING
# ============================================================================

def has_quantitative_finding(citation: Dict) -> bool:
    """Check if citation contains actual numerical findings."""
    key_finding = citation.get(FIELD_KEY_FINDING, '').lower()

    # Look for percentage patterns
    percentage_pattern = r'\d+\.?\d*\s*%'
    if re.search(percentage_pattern, key_finding):
        return True

    # Look for decimal numbers that might be elasticities or multipliers
    decimal_pattern = r'\d+\.?\d+'
    if re.search(decimal_pattern, key_finding):
        return True

    # Check if multiplier field has content
    multiplier = citation.get(FIELD_MULTIPLIER, '').strip()
    if multiplier and multiplier.lower() not in ['', 'n/a', 'not available', 'not reported']:
        return True

    return False


def is_high_trust_publisher(citation: Dict) -> bool:
    """Check if citation is from a high-trust publisher."""
    publisher = citation.get(FIELD_PUBLISHER, '').lower()

    for trusted in HIGH_TRUST_PUBLISHERS:
        if trusted in publisher:
            return True

    return False


def assess_methodology_quality(citation: Dict) -> str:
    """Assess the quality of methodology used in the citation."""
    methodology = citation.get(FIELD_METHODOLOGY, '').lower()

    # Check for high-quality methods
    for method in HIGH_QUALITY_METHODS:
        if method in methodology:
            return QUALITY_SCORE_HIGH

    # Check for medium-quality methods
    for method in MEDIUM_QUALITY_METHODS:
        if method in methodology:
            return QUALITY_SCORE_MEDIUM

    return QUALITY_SCORE_LOW


def calculate_citation_quality_score(citation: Dict) -> Tuple[str, int]:
    """
    Calculate overall quality score for a citation.
    Returns (quality_label, numerical_score) where higher is better.
    """
    score = 0

    # Methodology quality (0-40 points)
    method_quality = assess_methodology_quality(citation)
    if method_quality == QUALITY_SCORE_HIGH:
        score += 40
    elif method_quality == QUALITY_SCORE_MEDIUM:
        score += 25
    else:
        score += 10

    # Publisher trust (0-30 points)
    if is_high_trust_publisher(citation):
        score += 30

    # Quantitative finding present (0-20 points)
    if has_quantitative_finding(citation):
        score += 20

    # Has DOI (0-10 points)
    doi = citation.get(FIELD_DOI, '').strip()
    if doi and doi.lower() not in ['', 'n/a', 'not available']:
        score += 10

    # Determine quality label
    if score >= 70:
        quality = QUALITY_SCORE_HIGH
    elif score >= 40:
        quality = QUALITY_SCORE_MEDIUM
    else:
        quality = QUALITY_SCORE_LOW

    return quality, score


def filter_low_quality_citations(citations: List[Dict], min_score: int = 40) -> List[Dict]:
    """
    Filter out citations that don't meet minimum quality threshold.
    Default threshold of 40 corresponds to 'medium' quality minimum.
    """
    filtered = []

    for citation in citations:
        # Calculate quality score
        quality_label, numerical_score = calculate_citation_quality_score(citation)

        # Update citation with calculated quality if not already set
        if not citation.get(QUALITY_SCORE_KEY):
            citation[QUALITY_SCORE_KEY] = quality_label

        # Add numerical score for sorting
        citation['_quality_score_numerical'] = numerical_score

        # Only include if meets minimum threshold
        if numerical_score >= min_score:
            filtered.append(citation)

    # Sort by quality score (highest first)
    filtered.sort(key=lambda x: x.get('_quality_score_numerical', 0), reverse=True)

    return filtered


def validate_citation_fields(citation: Dict) -> bool:
    """Validate that citation has all required fields with meaningful content."""
    required_fields = [FIELD_TITLE, FIELD_URL, FIELD_PUBLISHER, FIELD_KEY_FINDING, FIELD_METHODOLOGY]

    for field in required_fields:
        value = citation.get(field, '').strip()
        if not value or value.lower() in ['unknown', 'n/a', 'not available', 'not specified']:
            return False

    # Validate URL format
    url = citation.get(FIELD_URL, '')
    if not url.startswith('http'):
        return False

    return True


def extract_numerical_multipliers(citations: List[Dict]) -> List[Dict]:
    """
    Extract and parse numerical multipliers from citations for validation.
    Returns list of dicts with citation info and parsed multiplier.
    """
    multipliers = []

    for i, citation in enumerate(citations):
        # Try to extract from key_finding
        key_finding = citation.get(FIELD_KEY_FINDING, '')

        # Look for patterns like "1% increase leads to 2.5% decrease"
        pattern = r'(\d+\.?\d*)\s*%.*?(\d+\.?\d*)\s*%'
        matches = re.findall(pattern, key_finding)

        if matches:
            for match in matches:
                try:
                    input_pct = float(match[0])
                    output_pct = float(match[1])
                    if input_pct > 0:
                        multiplier = output_pct / input_pct
                        multipliers.append({
                            'citation_index': i,
                            'citation_title': citation.get(FIELD_TITLE, ''),
                            'input_change': input_pct,
                            'output_change': output_pct,
                            'multiplier': multiplier,
                            'raw_finding': key_finding
                        })
                except (ValueError, ZeroDivisionError):
                    continue

        # Also check explicit multiplier field
        multiplier_field = citation.get(FIELD_MULTIPLIER, '').strip()
        if multiplier_field:
            try:
                # Try to extract number from multiplier field
                num_match = re.search(r'[-+]?\d+\.?\d*', multiplier_field)
                if num_match:
                    mult_value = float(num_match.group())
                    multipliers.append({
                        'citation_index': i,
                        'citation_title': citation.get(FIELD_TITLE, ''),
                        'multiplier': mult_value,
                        'raw_multiplier': multiplier_field
                    })
            except ValueError:
                continue

    return multipliers


# ============================================================================
# NUMERICAL CONSISTENCY VALIDATION
# ============================================================================

def validate_multiplier_consistency(
    executive_summary_multiplier: str,
    table_multipliers: List[float],
    time_multipliers: Dict[str, float]
) -> Dict[str, Any]:
    """
    Validate that multipliers are consistent across different sections.
    Returns validation report with issues found.
    """
    issues = []
    warnings = []

    try:
        # Extract numerical value from executive summary
        exec_match = re.search(r'(\d+\.?\d*)\s*%', executive_summary_multiplier)
        if not exec_match:
            issues.append("Executive summary multiplier does not contain a clear numerical value")
            return {"valid": False, "issues": issues, "warnings": warnings}

        exec_value = float(exec_match.group(1))

        # Check if it's within range of table multipliers
        if table_multipliers:
            min_table = min(table_multipliers)
            max_table = max(table_multipliers)

            if exec_value < min_table or exec_value > max_table:
                warnings.append(
                    f"Executive summary multiplier ({exec_value}%) is outside the range of "
                    f"table multipliers ({min_table}% - {max_table}%)"
                )

        # Check time-differentiated multipliers
        if time_multipliers:
            time_values = [v for v in time_multipliers.values() if v is not None]
            if time_values:
                # Executive summary should generally be close to one of the time horizons
                closest_time_value = min(time_values, key=lambda x: abs(x - exec_value))
                if abs(closest_time_value - exec_value) > exec_value * 0.5:  # More than 50% different
                    warnings.append(
                        f"Executive summary multiplier ({exec_value}%) differs significantly from "
                        f"closest time-horizon multiplier ({closest_time_value}%)"
                    )

    except Exception as e:
        issues.append(f"Error validating multipliers: {str(e)}")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings
    }


def extract_numbers_from_text(text: str) -> List[float]:
    """Extract all numerical values from text."""
    # Pattern for percentages, decimals, and integers
    pattern = r'[-+]?\d+\.?\d*'
    matches = re.findall(pattern, text)

    numbers = []
    for match in matches:
        try:
            numbers.append(float(match))
        except ValueError:
            continue

    return numbers


def detect_hallucinated_statistics(
    report_text: str,
    citation_data: List[Dict]
) -> List[Dict[str, str]]:
    """
    Detect potential hallucinated statistics by checking if claimed values
    appear in the citations.
    Returns list of suspicious claims.
    """
    suspicious = []

    # Extract all numerical claims with citation markers from report
    # Pattern: number followed by [Citation #]
    claim_pattern = r'(\d+\.?\d*\s*%?).*?\[(\d+)\]'
    claims = re.findall(claim_pattern, report_text)

    for claimed_value, citation_num in claims:
        try:
            cit_idx = int(citation_num) - 1
            if 0 <= cit_idx < len(citation_data):
                citation = citation_data[cit_idx]
                key_finding = citation.get(FIELD_KEY_FINDING, '')

                # Check if the claimed value appears in the citation's key finding
                if claimed_value.strip() not in key_finding:
                    suspicious.append({
                        "claimed_value": claimed_value,
                        "citation_number": citation_num,
                        "citation_title": citation.get(FIELD_TITLE, 'Unknown'),
                        "issue": "Claimed numerical value not found in citation's key finding"
                    })
        except (ValueError, IndexError):
            continue

    return suspicious
