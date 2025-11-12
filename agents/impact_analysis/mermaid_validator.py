"""
Mermaid Diagram Validator and Corrector
Validates Mermaid syntax and uses LLM to fix invalid diagrams
"""

import re
from clients.openai_client import get_openai_client
from config.app_config import PolicyDrafterConfig


MERMAID_FIX_PROMPT_TEMPLATE = """You are a Mermaid diagram syntax expert. Your task is to fix the invalid Mermaid diagram below and return ONLY the corrected diagram.

CRITICAL RULE - NESTED BRACKETS:
- NEVER use square brackets inside node labels: A[Label [1]] is INVALID
- For citations, use parentheses: A["Label (1)"] or A[Label - ref 1]
- For any special characters inside labels, wrap the ENTIRE label in quotes: A["Complex label (citation 1)"]

MERMAID SYNTAX RULES:
1. Must start with "graph TD" (top-down) or "graph LR" (left-right)
2. Node formats (choose appropriate):
   - A[Rectangle label]
   - B(Rounded label)
   - C{{Diamond label}}
   - D[(Database)]
3. Arrow formats:
   - --> (solid arrow)
   - -.-> (dotted arrow)
   - ==> (thick arrow)
4. Special characters in labels:
   - ALWAYS use double quotes for labels with special chars: A["Label (citation)"]
   - Convert square bracket citations [1] to parentheses (1)
   - Example: A[GDP [1]] becomes A["GDP (1)"]
5. Line breaks: Use \\n between lines
6. Keep it simple: Maximum 12 nodes
7. Each line should be clean (no trailing spaces)

CONTEXT: {context}

INVALID DIAGRAM:
{diagram}

COMMON ERRORS TO FIX:
1. Nested square brackets: A[Label [1]] → A["Label (1)"]
2. Multiple citations: B[Text [1][2]] → B["Text (1,2)"]
3. Special characters: C[Text: value] → C["Text: value"]

TASK:
1. Identify syntax errors (especially nested brackets)
2. Fix them following the rules above
3. Return ONLY the corrected Mermaid diagram
4. Do NOT add explanations or markdown code blocks
5. Ensure every node is connected
6. Keep the same logical flow as the original

CORRECTED DIAGRAM:
"""


def validate_mermaid_syntax(diagram: str) -> tuple[bool, str]:
    """
    Validate Mermaid diagram syntax using pattern matching.

    Args:
        diagram: Mermaid diagram string

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not diagram or not diagram.strip():
        return False, "Empty diagram"

    lines = [line.strip() for line in diagram.split('\n') if line.strip()]

    if len(lines) == 0:
        return False, "No content in diagram"

    # Check for graph declaration
    first_line = lines[0].lower()
    if not (first_line.startswith('graph td') or first_line.startswith('graph lr') or
            first_line.startswith('graph bt') or first_line.startswith('graph rl')):
        return False, "Missing graph declaration (graph TD or graph LR)"

    errors = []

    # Check for nested brackets (critical error that breaks Mermaid)
    for i, line in enumerate(lines, start=1):
        # Look for patterns like A[text [1]] which have nested square brackets
        # Match node definitions with square brackets
        node_matches = re.finditer(r'[A-Z]\d*\[([^\]]*)\]', line)
        for match in node_matches:
            label_content = match.group(1)
            # Check if the label content has square brackets (unless it's quoted)
            if '[' in label_content and not (label_content.startswith('"') and label_content.endswith('"')):
                errors.append(f"Line {i}: Nested square brackets in label '{label_content[:50]}...' - use quotes or parentheses")

    # Valid node formats: A[label], B(label), C{label}, D((label)), E[(label)], etc.
    # Allow optional whitespace at start and quoted labels
    node_with_label_pattern = r'[A-Z]\d*[\[\(\{].*[\]\)\}]'
    node_id_pattern = r'[A-Z]\d*'

    # Valid arrow patterns
    arrow_patterns = [r'-->', r'\.\.>', r'==>', r'-\.->']

    for i, line in enumerate(lines[1:], start=2):  # Skip first line (graph declaration)
        # Skip empty lines
        if not line:
            continue

        # Check if line contains an arrow (connection)
        has_arrow = False
        for arrow_pattern in arrow_patterns:
            if re.search(arrow_pattern, line):
                has_arrow = True
                break

        if not has_arrow:
            # Could be a standalone node definition or comment - allow it
            # Just check it's not completely invalid
            continue

        # Line has arrow, find it and split
        arrow_match = None
        for arrow_pattern in arrow_patterns:
            match = re.search(arrow_pattern, line)
            if match:
                arrow_match = match
                break

        if not arrow_match:
            continue

        # Split on the arrow
        left_part = line[:arrow_match.start()].strip()
        right_part = line[arrow_match.end():].strip()

        # Check left side has a valid node reference
        if not (re.search(node_with_label_pattern, left_part) or re.match(node_id_pattern + r'$', left_part)):
            errors.append(f"Line {i}: Invalid source node '{left_part}'")

        # Check right side has a valid node reference
        if not (re.search(node_with_label_pattern, right_part) or re.match(node_id_pattern + r'$', right_part)):
            errors.append(f"Line {i}: Invalid target node '{right_part}'")

    if errors:
        return False, "; ".join(errors[:3])  # Return first 3 errors

    return True, ""


def fix_mermaid_diagram(diagram: str, context: str = "", max_retries: int = 1) -> str:
    """
    Fix invalid Mermaid diagram using LLM.

    Args:
        diagram: Invalid Mermaid diagram
        context: Context about what the diagram represents (title, subtitle)
        max_retries: Number of times to retry if fix is still invalid

    Returns:
        Corrected Mermaid diagram string
    """
    print(f"🔧 Attempting to fix Mermaid diagram...")

    client = get_openai_client()

    prompt = MERMAID_FIX_PROMPT_TEMPLATE.format(
        context=context or "Causal pathway diagram",
        diagram=diagram
    )

    try:
        # Use GPT-4o (cheaper and faster for syntax fixing)
        response = client.responses_create_and_wait(
            model="gpt-4o",  # Faster than GPT-5 for simple fixes
            system_message="You are a Mermaid diagram syntax expert. Fix diagrams and return ONLY the corrected Mermaid syntax.",
            user_message=prompt,
            reasoning=None  # No reasoning needed for syntax fixing
        )

        # Clean response
        fixed = response.strip()

        # Remove markdown code blocks if present
        if fixed.startswith("```"):
            lines = fixed.split('\n')
            # Remove first and last lines (``` markers)
            if len(lines) > 2:
                fixed = '\n'.join(lines[1:-1])
            fixed = fixed.replace("```mermaid", "").replace("```", "").strip()

        print(f"✅ LLM fix completed: {len(fixed)} characters")

        # Validate the fix
        is_valid, error = validate_mermaid_syntax(fixed)

        if is_valid:
            print(f"✅ Fixed diagram is valid")
            return fixed
        else:
            print(f"⚠️  Fixed diagram still invalid: {error}")

            # Retry once if still invalid
            if max_retries > 0:
                print(f"🔄 Retrying fix (attempts remaining: {max_retries})...")
                return fix_mermaid_diagram(fixed, context, max_retries - 1)
            else:
                print(f"❌ Could not fix diagram after retries, returning original")
                return diagram

    except Exception as e:
        print(f"❌ Error calling LLM for Mermaid fix: {e}")
        return diagram


def sanitize_mermaid_for_display(diagram: str) -> str:
    """
    Sanitize Mermaid diagram for safe display.
    Removes potentially problematic characters.

    Args:
        diagram: Mermaid diagram string

    Returns:
        Sanitized diagram
    """
    # Remove any HTML tags
    sanitized = re.sub(r'<[^>]+>', '', diagram)

    # Ensure proper line breaks
    sanitized = sanitized.replace('\\n', '\n')

    # Remove excessive whitespace
    lines = [line.strip() for line in sanitized.split('\n')]
    sanitized = '\n'.join(line for line in lines if line)

    return sanitized


if __name__ == "__main__":
    # Quick self-test
    test_cases = [
        ("Valid diagram", """graph TD
    A[Start] --> B[Process]
    B --> C[End]""", True),

        ("Missing graph declaration", """A[Start] --> B[End]""", False),

        ("Wrong brackets", """graph TD
    A{Start} -> B(End)""", False),

        ("Invalid arrow", """graph TD
    A[Start] => B[End]""", False),
    ]

    print("🧪 Running Mermaid validator self-tests...\n")

    for name, diagram, expected_valid in test_cases:
        is_valid, error = validate_mermaid_syntax(diagram)
        status = "✅" if is_valid == expected_valid else "❌"
        print(f"{status} {name}:")
        print(f"   Expected: {expected_valid}, Got: {is_valid}")
        if not is_valid:
            print(f"   Error: {error}")
        print()
