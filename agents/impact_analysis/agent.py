import json
import sys
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import concurrent.futures

sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from agents.impact_analysis.prompts import (
    CITATION_SEARCH_ELABORATION,
    META_PROMPT_GENERATION,
    IMPACT_ANALYSIS_PROMPT,
    SINGLE_SEARCH_PROMPT,
    QUANTITATIVE_EXTRACTION_PROMPT,
    CAUSAL_PATHWAY_PROMPT,
    MULTIPLIER_CALCULATION_PROMPT,
    QUALITY_ASSESSMENT_PROMPT,
    SYNTHESIS_PROMPT,
    VALIDATION_JUDGE_PROMPT,
    CORRECTION_APPLICATION_PROMPT
)
from agents.impact_analysis.helpers import (
    extract_text_from_response,
    parse_json_from_text,
    format_citations_for_analysis,
    deduplicate_citations,
    filter_low_quality_citations,
    validate_citation_fields
)

# ============================================================================
# CONSTANTS
# ============================================================================

# Timeout Configuration (in seconds)
TIMEOUT_CONNECT = 15.0
TIMEOUT_READ = 10800.0  # 3 hours
TIMEOUT_WRITE = 120.0
TIMEOUT_POOL = 60.0

# Batch Processing
DEFAULT_BATCH_SIZE = 2  # Conservative limit to avoid rate limits (previously 5)

# Thread Pool Configuration
META_PROMPT_MAX_WORKERS = 1

# Model Configuration
#SEARCH_MODEL = "gpt-5-search-api"
SEARCH_MODEL = "gpt-4o-search-preview"


# Search Configuration
SEARCH_CONTEXT_SIZE = "high"
SEARCH_MAX_TOKENS = 16384

# Message Roles
ROLE_DEVELOPER = "developer"
ROLE_USER = "user"

# Content Type
CONTENT_TYPE_INPUT_TEXT = "input_text"

# File Output Configuration
OUTPUT_DIRECTORY = "impact_analysis_outputs"
OUTPUT_FILENAME_FORMAT = "impact_analysis_{timestamp}.json"
TIMESTAMP_FORMAT = "%Y%m%d_%H%M%S"

# JSON Formatting
JSON_INDENT = 2
JSON_ENSURE_ASCII = False

# File Encoding
FILE_ENCODING = "utf-8"

# ============================================================================


class ImpactAnalyzer:
    
    def __init__(self, batch_size: int = DEFAULT_BATCH_SIZE):
        # Use centralized OpenAI client with long timeout for impact analysis
        timeout_config = {
            'connect': TIMEOUT_CONNECT,
            'read': TIMEOUT_READ,
            'write': TIMEOUT_WRITE,
            'pool': TIMEOUT_POOL
        }
        self.openai_manager = get_openai_client(timeout_config)
        self.batch_size = batch_size
    
    def analyze_impact(self, query: str) -> Dict[str, Any]:
        print(f"Starting impact analysis for: '{query}'")

        search_instructions = self._elaborate_search_query(query)

        # Check if we got search instructions
        if not search_instructions or len(search_instructions) == 0:
            print("⚠ Warning: No search instructions generated. Analysis may be limited.")
            return {
                'query': query,
                'meta_prompt': '',
                'citations_count': 0,
                'citations': [],
                'impact_analysis': 'Error: Unable to generate search instructions for this query. Please try rephrasing or providing more specific details.',
                'timestamp': datetime.now().isoformat()
            }

        meta_prompt_future = concurrent.futures.ThreadPoolExecutor(max_workers=META_PROMPT_MAX_WORKERS).submit(
            self._generate_meta_prompt, query
        )

        citations = self._run_parallel_searches(search_instructions)
        meta_prompt = meta_prompt_future.result()

        # Check if we got any citations
        if not citations or len(citations) == 0:
            print("⚠ Warning: No citations found. Cannot proceed with analysis.")
            return {
                'query': query,
                'meta_prompt': meta_prompt,
                'citations_count': 0,
                'citations': [],
                'impact_analysis': 'Error: No high-quality citations found for this query. The search did not return sufficient academic sources to perform impact analysis. Please try a different query or check if the topic has published research available.',
                'timestamp': datetime.now().isoformat()
            }

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

        # Use responses_create_and_wait - it returns text directly
        text = self.openai_manager.responses_create_and_wait(
            model=model,
            system_message=system_text or "",
            user_message=user_text
        )
        return text.strip() if text else ""
    
    def _elaborate_search_query(self, query: str) -> List[Dict]:
        prompt = CITATION_SEARCH_ELABORATION.format(query=query)
        content = self._generate_with_responses_api(prompt)

        # Debug: Show what we got back
        if not content:
            print("⚠ WARNING: Empty response from search instruction generation!")
            return []

        print(f"Received response ({len(content)} chars). First 200 chars:")
        print(content[:200])

        instructions = parse_json_from_text(content)
        print(f"Generated {len(instructions)} search instructions")

        if len(instructions) == 0 and content:
            print("⚠ WARNING: Got content but parsed 0 instructions. Content preview:")
            print(content[:500])

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
            # Ensure max_workers doesn't exceed batch size to respect rate limits
            max_workers = min(len(batch), self.batch_size)

            print(f"Processing batch {i//self.batch_size + 1}: {len(batch)} searches with max {max_workers} parallel workers")

            with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = [executor.submit(self._single_search, instruction) for instruction in batch]

                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    if result:
                        all_results.extend(result)

        # Deduplicate first
        unique_citations = deduplicate_citations(all_results)

        # Filter low-quality citations (minimum score of 40 = medium quality)
        high_quality_citations = filter_low_quality_citations(unique_citations, min_score=40)

        print(f"Citations: {len(all_results)} total → {len(unique_citations)} unique → {len(high_quality_citations)} high-quality")

        return high_quality_citations
    
    def _single_search(self, instruction: Dict) -> List[Dict]:
        prompt = SINGLE_SEARCH_PROMPT.format(
            source_tier=instruction.get('source_tier', '').upper(),
            search_query=instruction.get('search_query', ''),
            focus=instruction.get('focus', ''),
            search_instructions=instruction.get('search_instructions', ''),
            source_tier_value=instruction.get('source_tier', '')
        )

        try:
            response = self.openai_manager.chat_completion(
                model=SEARCH_MODEL,
                web_search_options={"search_context_size": SEARCH_CONTEXT_SIZE},
                messages=[{"role": ROLE_USER, "content": prompt}],
                max_tokens=SEARCH_MAX_TOKENS
            )

            content = response.choices[0].message.content.strip()
            return parse_json_from_text(content)

        except Exception as e:
            print(f"✗ Search error: {str(e)[:100]}")
            return []
    
    def _generate_impact_analysis(self, meta_prompt: str, citations: List[Dict]) -> str:
        """
        Multi-stage parallel analysis pipeline with LLM-based validation.
        Stages: Quantitative Extraction → Causal Pathways → Multipliers → Quality → Synthesis → Validation → Correction
        """
        citations_text = format_citations_for_analysis(citations)

        print("Stage 1: Running parallel specialized analysis...")

        # Run 4 specialized analyses in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_quant = executor.submit(
                self._extract_quantitative_data,
                citations_text,
                meta_prompt
            )
            future_pathways = executor.submit(
                self._identify_causal_pathways,
                citations_text,
                meta_prompt
            )
            future_quality = executor.submit(
                self._assess_evidence_quality,
                citations_text,
                meta_prompt
            )

            # Wait for all to complete
            quantitative_findings = future_quant.result()
            causal_pathways = future_pathways.result()
            quality_assessment = future_quality.result()

        print("Stage 2: Calculating multipliers...")
        # Multiplier calculation depends on quantitative findings
        multiplier_calculations = self._calculate_multipliers(
            quantitative_findings,
            meta_prompt
        )

        print("Stage 3: Synthesizing initial report...")
        # Initial synthesis combines all components
        initial_report = self._synthesize_final_report(
            query=meta_prompt,
            quantitative_findings=quantitative_findings,
            causal_pathways=causal_pathways,
            multiplier_calculations=multiplier_calculations,
            quality_assessment=quality_assessment,
            citations=citations_text
        )

        print("Stage 4: Validating report with GPT-5 judge...")
        # LLM-based validation
        validation_results = self._validate_with_llm_judge(
            report=initial_report,
            citations=citations_text,
            quantitative_findings=quantitative_findings,
            causal_pathways=causal_pathways,
            multiplier_calculations=multiplier_calculations,
            quality_assessment=quality_assessment
        )

        print("Stage 5: Applying corrections...")
        # Apply corrections based on validation
        final_report = self._apply_corrections(
            original_report=initial_report,
            validation_results=validation_results
        )

        print("✓ Validation complete - Report corrected and verified")

        return final_report

    def _extract_quantitative_data(self, citations: str, query: str) -> str:
        """Extract all numerical estimates from citations."""
        prompt = QUANTITATIVE_EXTRACTION_PROMPT.format(
            citations=citations,
            query=query
        )
        return self._generate_with_responses_api(prompt)

    def _identify_causal_pathways(self, citations: str, query: str) -> str:
        """Identify causal mechanisms and pathways."""
        prompt = CAUSAL_PATHWAY_PROMPT.format(
            citations=citations,
            query=query
        )
        return self._generate_with_responses_api(prompt)

    def _calculate_multipliers(self, quantitative_estimates: str, query: str) -> str:
        """Calculate synthesized impact multipliers."""
        prompt = MULTIPLIER_CALCULATION_PROMPT.format(
            quantitative_estimates=quantitative_estimates,
            query=query
        )
        return self._generate_with_responses_api(prompt)

    def _assess_evidence_quality(self, citations: str, query: str) -> str:
        """Assess methodological quality and evidence strength."""
        prompt = QUALITY_ASSESSMENT_PROMPT.format(
            citations=citations,
            query=query
        )
        return self._generate_with_responses_api(prompt)

    def _synthesize_final_report(
        self,
        query: str,
        quantitative_findings: str,
        causal_pathways: str,
        multiplier_calculations: str,
        quality_assessment: str,
        citations: str
    ) -> str:
        """Synthesize all components into final markdown report."""
        prompt = SYNTHESIS_PROMPT.format(
            query=query,
            quantitative_findings=quantitative_findings,
            causal_pathways=causal_pathways,
            multiplier_calculations=multiplier_calculations,
            quality_assessment=quality_assessment,
            citations=citations
        )
        return self._generate_with_responses_api(prompt)

    def _validate_with_llm_judge(
        self,
        report: str,
        citations: str,
        quantitative_findings: str,
        causal_pathways: str,
        multiplier_calculations: str,
        quality_assessment: str
    ) -> str:
        """
        Use GPT-5 as a judge to validate the report for:
        - Numerical consistency
        - Citation support
        - Hallucinations
        - Logical coherence
        - Uncertainty handling
        """
        prompt = VALIDATION_JUDGE_PROMPT.format(
            citations=citations,
            quantitative_findings=quantitative_findings,
            causal_pathways=causal_pathways,
            multiplier_calculations=multiplier_calculations,
            quality_assessment=quality_assessment,
            report=report
        )

        # Use GPT-5 for high-reasoning validation
        validation_json = self._generate_with_responses_api(prompt, model=PolicyDrafterConfig.GPT_5)

        print("Validation findings:")
        # Parse validation to show status
        try:
            validation = parse_json_from_text(validation_json)
            if isinstance(validation, dict):
                status = validation.get('validation_status', 'UNKNOWN')
                print(f"  Status: {status}")

                # Count issues
                num_consistency_issues = len(validation.get('numerical_consistency', {}).get('issues', []))
                num_unsupported = len(validation.get('citation_support', {}).get('unsupported_claims', []))
                num_hallucinations = len(validation.get('hallucinations', []))
                num_pathway_issues = len(validation.get('causal_pathway_issues', []))
                num_uncertainty_flags = len(validation.get('uncertainty_flags', []))

                print(f"  Numerical consistency issues: {num_consistency_issues}")
                print(f"  Unsupported claims: {num_unsupported}")
                print(f"  Hallucinations detected: {num_hallucinations}")
                print(f"  Pathway issues: {num_pathway_issues}")
                print(f"  Uncertainty flags: {num_uncertainty_flags}")

                if status == "PASS":
                    print("  ✓ Report validated successfully - no corrections needed")
                elif status == "PASS_WITH_WARNINGS":
                    print("  ⚠ Report passed with minor warnings")
                else:
                    print("  ✗ Report has issues - applying corrections")

        except Exception as e:
            print(f"  Could not parse validation results: {e}")

        return validation_json

    def _apply_corrections(self, original_report: str, validation_results: str) -> str:
        """
        Apply corrections identified by the validation judge.
        Uses GPT-5 to intelligently apply all corrections while preserving structure.
        """
        prompt = CORRECTION_APPLICATION_PROMPT.format(
            original_report=original_report,
            validation_results=validation_results
        )

        # Use GPT-5 for correction application
        corrected_report = self._generate_with_responses_api(prompt, model=PolicyDrafterConfig.GPT_5)

        return corrected_report
    
    def save_results(self, results: Dict, filename: str = None) -> str:
        if not filename:
            timestamp = datetime.now().strftime(TIMESTAMP_FORMAT)
            filename = OUTPUT_FILENAME_FORMAT.format(timestamp=timestamp)

        filepath = Path(OUTPUT_DIRECTORY) / filename
        filepath.parent.mkdir(exist_ok=True)

        with open(filepath, 'w', encoding=FILE_ENCODING) as f:
            json.dump(results, f, indent=JSON_INDENT, ensure_ascii=JSON_ENSURE_ASCII)

        print(f"Results saved to: {filepath}")
        return str(filepath)