"""
File Operations Utilities for Systems Evidence Graph
Strategy& PWC - SEGB Feature
"""

from pathlib import Path
from typing import Dict

# ============================================================================
# CONSTANTS
# ============================================================================

# File Extensions
FILE_EXT_JSON = ".json"
FILE_EXT_CSV = ".csv"
FILE_EXT_MD = ".md"
FILE_EXT_HTML = ".html"
FILE_EXT_TXT = ".txt"

# Filename Prefixes
FILENAME_PREFIX_GRAPH_DATA = "graph_data"
FILENAME_PREFIX_GRAPH_TABLES = "graph_tables"
FILENAME_PREFIX_EXECUTIVE_SUMMARY = "executive_summary"
FILENAME_PREFIX_GRAPH_INTERACTIVE = "graph_interactive"
FILENAME_PREFIX_CITATIONS = "citations"

# Output Type Keys
OUTPUT_TYPE_GRAPH_JSON = "graph_json"
OUTPUT_TYPE_CSV_DATA = "csv_data"
OUTPUT_TYPE_EXECUTIVE_SUMMARY = "executive_summary"
OUTPUT_TYPE_INTERACTIVE_HTML = "interactive_html"
OUTPUT_TYPE_CITATIONS = "citations"

# File Encoding
FILE_ENCODING_UTF8 = "utf-8"

# ============================================================================


def save_graph_outputs(timestamp: str, outputs: Dict[str, str], output_dir: Path) -> Dict[str, str]:
    """Save all graph outputs to files.

    Args:
        timestamp: Timestamp string for filename generation
        outputs: Dictionary mapping output types to content
        output_dir: Directory to save outputs in

    Returns:
        Dictionary mapping output types to file paths
    """
    paths = {}

    for output_type, content in outputs.items():
        if output_type == OUTPUT_TYPE_GRAPH_JSON:
            filename = f"{FILENAME_PREFIX_GRAPH_DATA}_{timestamp}{FILE_EXT_JSON}"
        elif output_type == OUTPUT_TYPE_CSV_DATA:
            filename = f"{FILENAME_PREFIX_GRAPH_TABLES}_{timestamp}{FILE_EXT_CSV}"
        elif output_type == OUTPUT_TYPE_EXECUTIVE_SUMMARY:
            filename = f"{FILENAME_PREFIX_EXECUTIVE_SUMMARY}_{timestamp}{FILE_EXT_MD}"
        elif output_type == OUTPUT_TYPE_INTERACTIVE_HTML:
            filename = f"{FILENAME_PREFIX_GRAPH_INTERACTIVE}_{timestamp}{FILE_EXT_HTML}"
        elif output_type == OUTPUT_TYPE_CITATIONS:
            filename = f"{FILENAME_PREFIX_CITATIONS}_{timestamp}{FILE_EXT_JSON}"
        else:
            filename = f"{output_type}_{timestamp}{FILE_EXT_TXT}"

        file_path = output_dir / filename
        with open(file_path, 'w', encoding=FILE_ENCODING_UTF8) as f:
            f.write(content)

        paths[output_type] = str(file_path)

    return paths
