"""
Graph Builder - Handles Systems Evidence Graph Building
Strategy& PWC - SEGB Feature
"""

import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path
import sys
import concurrent.futures

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from agents.policy_drafter.prompts import PolicyPrompts
from agents.system_compass.visualization_utils import generate_html_visualization, create_fallback_json
from agents.system_compass.file_utils import save_graph_outputs

# ============================================================================
# CONSTANTS
# ============================================================================

# Timeout Configuration (in seconds)
TIMEOUT_CONNECT = 15.0
TIMEOUT_READ = 1200.0  # 20 minutes for long graph building operations
TIMEOUT_WRITE = 120.0
TIMEOUT_POOL = 60.0

# Directory Configuration
OUTPUT_DIR_NAME = "graph_outputs"

# Pipeline Steps Configuration
STEP_STATES = {
    'PENDING': 'pending',
    'IN_PROGRESS': 'in_progress',
    'COMPLETED': 'completed',
    'ERROR': 'error'
}

PIPELINE_STEPS = [
    {
        'id': 'extract_citations',
        'name': 'Extracting Citations',
        'description': 'Searching high-trust sources (Nature, WHO, government databases)'
    },
    {
        'id': 'process_citations',
        'name': 'Processing Citations',
        'description': 'Parsing and validating citation data'
    },
    {
        'id': 'gpt5_analysis',
        'name': 'Running Analysis',
        'description': 'Deep reasoning on evidence synthesis with citations'
    },
    {
        'id': 'extract_graph',
        'name': 'Extracting Graph Structure',
        'description': 'Parsing JSON nodes and edges from analysis'
    },
    {
        'id': 'extract_tables',
        'name': 'Extracting Data Tables',
        'description': 'Generating CSV analytics and quantitative data'
    },
    {
        'id': 'extract_summary',
        'name': 'Creating Executive Summary',
        'description': 'Synthesizing key findings and insights'
    },
    {
        'id': 'generate_visualization',
        'name': 'Building Visualization',
        'description': 'Generating interactive HTML graph'
    }
]

# Model Configuration
MODEL_SEARCH = "gpt-4o-search-preview"
MAX_TOKENS_SEARCH = 16384
MAX_WORKERS_PARALLEL_EXTRACTION = 10
BATCH_SIZE_SOURCE_CATEGORIES = 10
MAX_WORKERS_DATA_EXTRACTION = 3

# JSON Parsing Markers
JSON_CODE_BLOCK_START = "```json"
JSON_CODE_BLOCK_END = "```"
JSON_ARRAY_START = "["
JSON_ARRAY_END = "]"
JSON_OBJECT_START = "{"
JSON_OBJECT_END = "}"

# System Messages
SYSTEM_MESSAGE_EVIDENCE_ANALYST = "You are a senior evidence-synthesis analyst and systems-thinking model. Use the provided citations as evidence in your analysis."
SYSTEM_MESSAGE_COMPREHENSIVE_ANALYST = "You are a senior evidence-synthesis analyst and systems-thinking model. Provide comprehensive analysis with specific quantifiable data."
SYSTEM_MESSAGE_DATA_EXTRACTOR = """You are a precise data extraction assistant. Your ONLY job is to extract the requested format from the source content and return it with NOTHING else.

CRITICAL RULES:
- Return ONLY the requested data format
- NO markdown code blocks (no ```json or ```)
- NO explanations, comments, or additional text before or after
- NO multiple objects - only ONE complete object
- If extracting JSON, ensure it's valid and complete
- Your entire response should be parseable as the requested format"""

# Extraction Instructions
INSTRUCTION_EXTRACT_JSON = """Extract ONLY the graph JSON from Output B.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - nothing before or after it
2. Do NOT wrap in markdown code blocks (no ```json or ```)
3. Do NOT add any explanatory text before or after the JSON
4. Return exactly ONE complete JSON object starting with { and ending with }
5. Ensure all brackets are properly closed
6. The JSON MUST include the "meta" object with "focus_issue", "geography", and "time_range" fields
7. The JSON MUST include "nodes" array and "edges" array
8. Your ENTIRE response must be valid JSON that can be parsed directly

The JSON must have this top-level structure:
{
  "meta": { "focus_issue": "...", "geography": "...", "time_range": "..." },
  "nodes": [...],
  "edges": [...]
}

Return the complete JSON now:"""
INSTRUCTION_EXTRACT_CSV = "Extract ONLY the CSV data tables from Output C. Return CSV format only."
INSTRUCTION_EXTRACT_SUMMARY = "Extract ONLY the executive narrative from Output A. Format as markdown."

# Default Values
DEFAULT_INTERVENTION = "None"

# High-Trust Source Categories with Smart Geographic Expansion
# CRITICAL: ALL tiers are HIGH-TRUST official sources. We expand geography, NOT quality.
# Geographic relevance: {geography} > Regional > Broader Region (ALL from official/peer-reviewed sources ONLY)
# NOTE: {geography} placeholder will be replaced with actual query geography at runtime
SOURCE_CATEGORIES = [
    {
        "name": "official_government_stats",
        "instruction": """GEOGRAPHIC EXPANSION (ALL TIERS = Official Government Sources ONLY - HIGH TRUST):
SEARCH TIER 1: {geography} government - '{geography} Statistics Center', '{geography} national statistics', '{geography} Federal Competitiveness', '{geography} Ministry of Health data'
  Examples if UAE: Dubai Statistics Center, Abu Dhabi Department of Economic Development, MOHAP UAE
  Examples if India: Ministry of Statistics India, NITI Aayog, Ministry of Health India
  Examples if Singapore: Department of Statistics Singapore, Ministry of Health Singapore
SEARCH TIER 2: Regional peer governments - GCC-STAT (if GCC country), ASEAN stats (if ASEAN), comparable peer countries
SEARCH TIER 3: Broader regional government sources with similar development levels
ALL sources must be OFFICIAL GOVERNMENT. Try {geography} first, expand geographically if needed. NEVER use blogs/media/unofficial."""
    },
    {
        "name": "un_world_bank_who",
        "instruction": """GEOGRAPHIC EXPANSION (ALL TIERS = UN/World Bank/WHO Official Data ONLY - HIGH TRUST):
SEARCH TIER 1: {geography} country-specific data - 'WHO {geography} country profile', 'World Bank {geography} indicators', 'OECD {geography} data'
SEARCH TIER 2: Regional comparative data - Use {geography}'s regional grouping (e.g., if GCC, use WHO GCC; if ASEAN, use WHO ASEAN)
SEARCH TIER 3: Broader regional aggregates with {geography} mentioned - 'World Bank region data {geography}', 'WHO regional report {geography}'
ALL sources must be from UN/World Bank/WHO/OECD. Geographic expansion ONLY. NEVER use unofficial sources."""
    },
    {
        "name": "peer_reviewed_journals_high_impact",
        "instruction": """GEOGRAPHIC EXPANSION (ALL TIERS = High-Impact Peer-Reviewed Journals ONLY - HIGH TRUST):
SEARCH TIER 1: {geography}-specific studies in Nature/Science/Lancet/JAMA - '{geography} population study', '{geography} health research', '{geography} cohort study'
SEARCH TIER 2: Regional studies including {geography}'s region - Use {geography}'s regional grouping for comparative studies
SEARCH TIER 3: Broader regional studies with comparable populations - '{geography} region health', 'regional study {geography} context'
ALL sources must be from Nature, Science, Lancet, JAMA, NEJM, BMJ (high-impact peer-reviewed). Geographic expansion ONLY."""
    },
    {
        "name": "peer_reviewed_general",
        "instruction": """TIERED SEARCH STRATEGY for general peer-reviewed journals (PubMed, BMJ, PLOS, etc.):
TIER 1 (BEST): UAE-specific publications - 'UAE health study PubMed', 'Emirates medical research', 'Dubai clinical study'
TIER 2 (VERY GOOD): GCC comparative studies - 'GCC health BMJ', 'Gulf countries PubMed', 'Saudi-UAE comparison'
TIER 3 (GOOD): MENA/Arab populations - 'MENA health outcomes', 'Arab population epidemiology', 'Middle East public health'
TIER 4 (ACCEPTABLE): High-quality systematic reviews/meta-analyses applicable globally - Label clearly as 'global evidence pending local validation'
Target 5-8 citations per tier, starting from TIER 1."""
    },
    {
        "name": "regional_health_authorities",
        "instruction": """TIERED SEARCH STRATEGY:
TIER 1 (BEST): UAE health ministries - 'Dubai Health Authority reports', 'MOHAP statistics', 'Abu Dhabi Public Health Center'
TIER 2 (VERY GOOD): GCC health authorities - 'Saudi Ministry of Health', 'Qatar Public Health', 'Kuwait MOH'
TIER 3 (GOOD): Regional health organizations - 'Arab Health Ministers Council', 'Eastern Mediterranean Public Health Network'
TIER 4 (ACCEPTABLE): International health agencies with Gulf programs - 'WHO EMRO UAE programs', 'CDC Middle East initiatives'
Focus on official reports, health indicators, and surveillance data."""
    },
    {
        "name": "universities_research_institutes",
        "instruction": """TIERED SEARCH STRATEGY for academic research:
TIER 1 (BEST): UAE universities - 'UAE University research', 'American University Sharjah', 'Zayed University', 'Khalifa University', 'NYU Abu Dhabi'
TIER 2 (VERY GOOD): GCC universities - 'King Abdullah University', 'Qatar University', 'Kuwait University', 'Sultan Qaboos University'
TIER 3 (GOOD): MENA research institutes - 'American University Beirut', 'Cairo University', 'King Saud University'
TIER 4 (ACCEPTABLE): International collaborations with Gulf partners - 'Harvard-Dubai collaboration', 'Oxford Gulf studies'
Search institutional repositories, research centers, and faculty publications."""
    },
    {
        "name": "think_tanks_policy_institutes",
        "instruction": """TIERED SEARCH STRATEGY for policy research:
TIER 1 (BEST): UAE policy institutes - 'Emirates Policy Center', 'Dubai Future Foundation', 'Sheikh Saud bin Saqr Al Qasimi Foundation'
TIER 2 (VERY GOOD): GCC think tanks - 'Gulf Research Center', 'King Faisal Center', 'Qatar Policy Institute'
TIER 3 (GOOD): MENA policy organizations - 'Carnegie Middle East', 'Brookings Doha', 'Arab Center Washington DC'
TIER 4 (ACCEPTABLE): Global institutes with UAE focus - 'Chatham House UAE papers', 'RAND Corporation Gulf studies', 'McKinsey Middle East'
Prioritize data-driven policy briefs and impact assessments."""
    },
    {
        "name": "international_organizations",
        "instruction": """TIERED SEARCH STRATEGY:
TIER 1 (BEST): UAE country offices - 'UNDP UAE', 'UNICEF UAE', 'UNESCO UAE', 'ILO UAE'
TIER 2 (VERY GOOD): GCC/Gulf regional programs - 'UNDP Gulf States', 'UNICEF GCC', 'ILO Arab States'
TIER 3 (GOOD): MENA regional reports with UAE data - 'ESCWA UAE statistics', 'Arab Development Report UAE'
TIER 4 (ACCEPTABLE): Global reports with substantial UAE coverage - 'Human Development Report UAE chapter', 'Global Education Monitoring UAE case'
Search country assessments, program evaluations, and development indicators."""
    },
    {
        "name": "professional_associations",
        "instruction": """TIERED SEARCH STRATEGY for medical/professional bodies:
TIER 1 (BEST): UAE associations - 'UAE Medical Association', 'Emirates Medical Society', 'Dubai Medical Society'
TIER 2 (VERY GOOD): GCC professional bodies - 'Gulf Cooperation Council Health Ministers', 'GCC Medical Colleges'
TIER 3 (GOOD): Pan-Arab associations - 'Arab Medical Association', 'Arab Board Medical Specializations'
TIER 4 (ACCEPTABLE): International chapters with Gulf presence - 'APA Middle East', 'WHO-EMRO professional networks'
Search clinical guidelines, position statements, and member surveys."""
    },
    {
        "name": "national_surveys_censuses",
        "instruction": """TIERED SEARCH STRATEGY for demographic/social data:
TIER 1 (BEST): UAE national surveys - 'UAE National Health Survey', 'Dubai Household Income and Expenditure Survey', 'UAE Census data'
TIER 2 (VERY GOOD): GCC comparative surveys - 'GCC Labour Force Survey', 'Gulf Family Health Survey'
TIER 3 (GOOD): Regional demographic studies - 'Arab Barometer UAE', 'MENA Youth Survey', 'Gallup Middle East'
TIER 4 (ACCEPTABLE): International surveys with UAE samples - 'World Values Survey UAE', 'PISA UAE results'
Focus on representative samples and validated survey instruments."""
    },
    {
        "name": "meta_analyses_systematic_reviews",
        "instruction": """TIERED SEARCH STRATEGY for high-quality evidence synthesis:
TIER 1 (BEST): MENA/Arab-focused reviews - 'systematic review Middle East', 'meta-analysis Arab populations', 'GCC health meta-analysis'
TIER 2 (VERY GOOD): Global reviews with MENA subsample analysis - 'Cochrane review MENA data', 'global meta-analysis UAE subgroup'
TIER 3 (GOOD): High-quality global reviews on universal relationships - 'Cochrane mental health unemployment', 'substance abuse systematic review'
TIER 4 (ACCEPTABLE): Well-cited reviews (100+ citations) on established causal mechanisms - Tag as 'global evidence, local validation needed'
Prioritize Cochrane, JAMA Network, BMJ systematic reviews."""
    },
    {
        "name": "regional_economic_organizations",
        "instruction": """TIERED SEARCH STRATEGY for economic/development data:
TIER 1 (BEST): GCC economic bodies - 'GCC-STAT', 'Gulf Investment Corporation', 'Arab Monetary Fund'
TIER 2 (VERY GOOD): MENA regional banks - 'Islamic Development Bank UAE', 'Arab Development Bank data'
TIER 3 (GOOD): Regional economic reports - 'Arab Economic Outlook UAE', 'MENA Economic Monitor'
TIER 4 (ACCEPTABLE): International financial institutions with UAE focus - 'IMF UAE Article IV', 'ADB Middle East reports'
Search economic indicators, labor market data, and financial statistics."""
    }
]

# Logging Messages
LOG_EXTRACTING_CITATIONS = "🌐 Extracting citations from {count} source categories..."
LOG_RUNNING_MAIN_ANALYSIS = "🔍 Running main analysis with {count} citations..."
LOG_EXTRACTING_STRUCTURED_DATA = "📊 Extracting structured data..."
LOG_GENERATING_VISUALIZATION = "🎨 Generating interactive visualization..."
LOG_SEARCHING_SOURCE = "   🔍 Searching {name}..."
LOG_SOURCE_COMPLETED = "   ✅ {name} search completed"
LOG_SOURCE_FAILED = "   ❌ {name} search failed: {error}"
LOG_PROCESSING_BATCH = "🔄 Processing batch {batch_num} ({count} sources)..."
LOG_TOTAL_CITATIONS = "📚 Total citations extracted: {count}"
LOG_PARSE_FAILED = "   ⚠️ Failed to parse {name}: {error}"
LOG_RUNNING_GPT5_CITATIONS = "🔄 Running GPT-5 analysis with citation integration..."
LOG_GPT5_CITATIONS_COMPLETED = "✅ GPT-5 analysis with citations completed"
LOG_RUNNING_GPT5 = "🔄 Running GPT-5 analysis..."
LOG_GPT5_COMPLETED = "✅ GPT-5 analysis completed"
LOG_JSON_PARSE_FAILED = "⚠️ Failed to parse JSON: {error}"

# Source Tracking Keys
KEY_SOURCE_SEARCH = "source_search"
KEY_NAME = "name"
KEY_INSTRUCTION = "instruction"

# Response Keys
KEY_JSON = "json"
KEY_CSV = "csv"
KEY_SUMMARY = "summary"

# Default Fallback Values
DEFAULT_JSON_FALLBACK = "{}"
JSON_OFFSET_CODE_BLOCK = 7

# ============================================================================

class GraphBuildingAgent:
    """Agent for building systems evidence graphs using GPT-4."""
    
    def __init__(self):
        # Use centralized OpenAI client with extended timeout for long graph operations
        self.openai_manager = get_openai_client()
        self.output_dir = Path(OUTPUT_DIR_NAME)
        self.output_dir.mkdir(exist_ok=True)

        # Define high-trust source categories for parallel search
        self.source_categories = SOURCE_CATEGORIES

    def run_graph_pipeline(self, query: str, geography: str,
                          time_range: str,
                          intervention: Optional[str] = None,
                          progress_callback: Optional[callable] = None) -> Dict[str, str]:
        """Run complete graph building pipeline with step-based progress tracking."""

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        # Initialize steps with pending state
        steps = [{**step, 'state': STEP_STATES['PENDING'], 'timestamp': None} for step in PIPELINE_STEPS]

        # Helper to update step state
        def update_step(step_id: str, state: str):
            if progress_callback:
                try:
                    # Find and update the step
                    for step in steps:
                        if step['id'] == step_id:
                            step['state'] = state
                            if state in [STEP_STATES['COMPLETED'], STEP_STATES['ERROR']]:
                                step['timestamp'] = datetime.now().isoformat()
                            break
                    progress_callback(steps)
                except Exception as e:
                    print(f"⚠️ Progress callback failed: {e}")

        # Step 1: Extract citations in parallel from all high-trust sources
        update_step('extract_citations', STEP_STATES['IN_PROGRESS'])
        print(LOG_EXTRACTING_CITATIONS.format(count=len(self.source_categories)))
        all_citations = self._extract_citations_parallel(query, geography, time_range, intervention)
        update_step('extract_citations', STEP_STATES['COMPLETED'])

        # Step 2: Process citations
        update_step('process_citations', STEP_STATES['IN_PROGRESS'])
        print(LOG_TOTAL_CITATIONS.format(count=len(all_citations)))
        update_step('process_citations', STEP_STATES['COMPLETED'])

        # Step 3: Main analysis with GPT-5 using extracted citations
        update_step('gpt5_analysis', STEP_STATES['IN_PROGRESS'])
        print(LOG_RUNNING_MAIN_ANALYSIS.format(count=len(all_citations)))
        main_response = self._run_main_analysis_with_citations(query, geography, time_range, intervention, all_citations)
        update_step('gpt5_analysis', STEP_STATES['COMPLETED'])

        # Step 4-6: Parallel extraction of JSON, CSV, and executive takeaways
        update_step('extract_graph', STEP_STATES['IN_PROGRESS'])
        update_step('extract_tables', STEP_STATES['IN_PROGRESS'])
        update_step('extract_summary', STEP_STATES['IN_PROGRESS'])
        print(LOG_EXTRACTING_STRUCTURED_DATA)
        graph_json, csv_data, executive_summary = self._extract_structured_data(main_response)
        update_step('extract_graph', STEP_STATES['COMPLETED'])
        update_step('extract_tables', STEP_STATES['COMPLETED'])
        update_step('extract_summary', STEP_STATES['COMPLETED'])

        # Step 7: Generate interactive HTML
        update_step('generate_visualization', STEP_STATES['IN_PROGRESS'])
        print(LOG_GENERATING_VISUALIZATION)
        print(f"📝 Graph JSON keys before visualization: {list(graph_json.keys())}")
        print(f"📝 Meta keys: {list(graph_json.get('meta', {}).keys())}")
        html_content = generate_html_visualization(graph_json)
        update_step('generate_visualization', STEP_STATES['COMPLETED'])

        # Save all outputs including citations
        output_paths = save_graph_outputs(timestamp, {
            'full_analysis': main_response,
            'graph_json': json.dumps(graph_json, indent=2),
            'csv_data': csv_data,
            'executive_summary': executive_summary,
            'interactive_html': html_content,
            'citations': json.dumps(all_citations, indent=2)
        }, self.output_dir)

        return output_paths
    
    def _extract_citations_parallel(self, query: str, geography: str, time_range: str, intervention: Optional[str]) -> List[Dict]:
        """Extract citations in parallel from all source categories."""
        
        def extract_from_source(source_config):
            """Extract citations from a single source category."""
            name = source_config[KEY_NAME]
            instruction = source_config[KEY_INSTRUCTION]

            # Replace {geography} placeholder with actual geography from query
            instruction = instruction.format(geography=geography)

            print(LOG_SEARCHING_SOURCE.format(name=name))

            try:
                # Format the citation extraction prompt
                prompt = PolicyPrompts.SEGB_CITATIONS_ONLY_PROMPT.format(
                    focus_issue=query,
                    geography=geography,
                    time_range=time_range,
                    intervention=intervention or DEFAULT_INTERVENTION,
                    source_type=name,
                    source_instruction=instruction
                )

                # Use gpt-4o-search-preview for real web search
                completion = self.openai_manager.chat_completion(
                    model=MODEL_SEARCH,
                    web_search_options={},
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=MAX_TOKENS_SEARCH
                )

                result = completion.choices[0].message.content.strip()
                print(LOG_SOURCE_COMPLETED.format(name=name))
                return name, result

            except Exception as e:
                print(LOG_SOURCE_FAILED.format(name=name, error=e))
                return name, None

        # Run all extractions in parallel (batches of 10)
        all_citations = []
        batch_size = BATCH_SIZE_SOURCE_CATEGORIES

        for i in range(0, len(self.source_categories), batch_size):
            batch = self.source_categories[i:i+batch_size]
            print(LOG_PROCESSING_BATCH.format(batch_num=i//batch_size + 1, count=len(batch)))

            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_PARALLEL_EXTRACTION) as executor:
                futures = [executor.submit(extract_from_source, source) for source in batch]
                
                for future in concurrent.futures.as_completed(futures):
                    source_name, result = future.result()
                    if result:
                        # Parse JSON from result
                        citations = self._parse_citations_from_response(result, source_name)
                        all_citations.extend(citations)

        print(LOG_TOTAL_CITATIONS.format(count=len(all_citations)))
        return all_citations
    
    def _parse_citations_from_response(self, content: str, source_name: str) -> List[Dict]:
        """Parse citations from web search response."""
        try:
            # Extract JSON from response
            if JSON_CODE_BLOCK_START in content:
                start = content.find(JSON_CODE_BLOCK_START) + JSON_OFFSET_CODE_BLOCK
                end = content.find(JSON_CODE_BLOCK_END, start)
                json_content = content[start:end].strip()
            elif JSON_ARRAY_START in content and JSON_ARRAY_END in content:
                start = content.find(JSON_ARRAY_START)
                end = content.rfind(JSON_ARRAY_END) + 1
                json_content = content[start:end]
            else:
                json_content = content

            citations = json.loads(json_content)

            # Add source tracking
            for citation in citations:
                citation[KEY_SOURCE_SEARCH] = source_name

            return citations

        except Exception as e:
            print(LOG_PARSE_FAILED.format(name=source_name, error=e))
            return []
    
    def _run_main_analysis_with_citations(self, query: str, geography: str, time_range: str,
                                        intervention: Optional[str], citations: List[Dict]) -> str:
        """Run main analysis with pre-extracted citations using GPT-5 with high reasoning effort."""

        # Format citations for inclusion in prompt
        citations_text = json.dumps(citations, indent=2)

        # Use the updated SEGB_MAIN_PROMPT with citations
        user_prompt = PolicyPrompts.SEGB_MAIN_PROMPT.format(
            focus_issue=query,
            geography=geography,
            time_range=time_range,
            intervention=intervention if intervention else DEFAULT_INTERVENTION,
            extracted_citations=citations_text
        )

        print(LOG_RUNNING_GPT5_CITATIONS)
        print("🤖 Using GPT-5 with auto-streaming for Azure")

        content = self.openai_manager.responses_create_and_wait(
            model=PolicyDrafterConfig.GPT_5,
            system_message=SYSTEM_MESSAGE_EVIDENCE_ANALYST,
            user_message=user_prompt,
            reasoning={"effort": "medium"}
        )
        print(LOG_GPT5_CITATIONS_COMPLETED)
        return content.strip()
    
    def _extract_structured_data(self, main_response: str) -> Tuple[Dict, str, str]:
        """Extract JSON, CSV, and executive summary from main response."""
        import concurrent.futures

        # Define extraction tasks
        tasks = [
            (INSTRUCTION_EXTRACT_JSON, KEY_JSON),
            (INSTRUCTION_EXTRACT_CSV, KEY_CSV),
            (INSTRUCTION_EXTRACT_SUMMARY, KEY_SUMMARY)
        ]

        results = {}

        def extract_single(instruction, key):
            response = self.openai_manager.responses_create_and_wait(
                model=PolicyDrafterConfig.O4_MINI_MODEL,
                user_message=f"{instruction}\n\nSource content:\n{main_response}",
                system_message=SYSTEM_MESSAGE_DATA_EXTRACTOR,
            )
            return key, response

        # Run extractions in parallel for speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_DATA_EXTRACTION) as executor:
            futures = [executor.submit(extract_single, instruction, key) for instruction, key in tasks]
            for future in concurrent.futures.as_completed(futures):
                key, content = future.result()
                results[key] = content

        # Parse JSON with sanitization
        json_str = results.get(KEY_JSON, DEFAULT_JSON_FALLBACK)
        # Clean up the JSON string
        json_str = json_str.replace(JSON_CODE_BLOCK_START, '').replace(JSON_CODE_BLOCK_END, '').strip()
        # Try to find JSON object in the response
        if JSON_OBJECT_START in json_str and JSON_OBJECT_END in json_str:
            start_idx = json_str.find(JSON_OBJECT_START)
            end_idx = json_str.rfind(JSON_OBJECT_END) + 1
            json_str = json_str[start_idx:end_idx]

        # Sanitize JSON string to remove control characters
        import re
        # Remove control characters except newline, tab, and carriage return (which should be escaped)
        json_str = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', json_str)

        try:
            graph_json = json.loads(json_str)
            print(f"✅ JSON parsed successfully. Keys: {list(graph_json.keys())}")
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON parsing failed: {e}")
            print(f"⚠️ Attempting to fix with strict=False...")
            # Try with strict=False to allow control characters
            try:
                graph_json = json.loads(json_str, strict=False)
                print(f"✅ JSON parsed with strict=False. Keys: {list(graph_json.keys())}")
            except json.JSONDecodeError as e2:
                print(f"❌ JSON parsing failed even with strict=False: {e2}")
                print(f"❌ First 500 chars of problematic JSON: {json_str[:500]}")
                raise

        return graph_json, results[KEY_CSV], results[KEY_SUMMARY]
