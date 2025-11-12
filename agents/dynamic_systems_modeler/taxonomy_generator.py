"""
Taxonomy Generator - Generates child nodes from parent categories
Strategy& PWC - Dynamic Systems Modeler
"""

import json
from typing import Dict, List, Optional
from pathlib import Path
import sys
import concurrent.futures

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client

# ============================================================================
# CONSTANTS
# ============================================================================

# Model Configuration
MODEL_SEARCH = "gpt-4o-search-preview"
MAX_TOKENS_SEARCH = 8192
MAX_TOKENS_GENERATION = 2048
MAX_WORKERS_PARALLEL = 5

# Validation
MIN_CHILDREN_PER_PARENT = 2
MAX_CHILDREN_PER_PARENT = 7
DEFAULT_CHILDREN_TARGET = 5

# JSON Parsing
JSON_CODE_BLOCK_START = "```json"
JSON_CODE_BLOCK_END = "```"

# Logging
LOG_GENERATING_CHILDREN = "🔍 Generating children for: {parent}"
LOG_CHILDREN_COMPLETED = "✅ Generated {count} children for: {parent}"
LOG_CHILDREN_FAILED = "❌ Failed to generate children for: {parent} - {error}"
LOG_TOTAL_CHILDREN = "📊 Total children generated: {count} across {parent_count} parents"

# ============================================================================

class TaxonomyGenerator:
    """Generates custom taxonomy for Dynamic Systems Modeler."""

    def __init__(self):
        self.openai_manager = get_openai_client()

    def suggest_parent_categories(self, main_query: str) -> List[str]:
        """
        Use LLM to suggest 10 intelligent parent categories based on the main query.

        This replaces hardcoded defaults with context-aware, domain-specific categories.

        Args:
            main_query: The research question or policy topic

        Returns:
            List of exactly 10 parent category names
        """
        from agents.dynamic_systems_modeler.prompts import DSMPrompts

        prompt = DSMPrompts.PARENT_CATEGORY_SUGGESTION_PROMPT.format(
            main_query=main_query
        )

        print("🤖 Calling GPT-5 to suggest parent categories...")

        response = self.openai_manager.responses_create_and_wait(
            model=PolicyDrafterConfig.GPT_5,
            system_message="You are a systems thinking expert specializing in policy analysis and causal mapping.",
            user_message=prompt,
            reasoning={"effort": "low"}  # Fast generation for UX
        )

        # Parse JSON response
        categories = self._parse_category_list(response)

        # Validate exactly 10 categories
        if len(categories) != 10:
            print(f"⚠️ LLM returned {len(categories)} categories, expected 10. Padding/truncating...")
            if len(categories) < 10:
                # Pad with generic categories
                generic_fillers = [
                    "Social Factors",
                    "Environmental Factors",
                    "Economic Systems",
                    "Cultural Context",
                    "Technology & Innovation",
                    "Policy Framework",
                    "Infrastructure",
                    "Community Networks",
                    "Individual Behavior",
                    "System Governance"
                ]
                while len(categories) < 10:
                    categories.append(generic_fillers[len(categories) - 1])
            else:
                categories = categories[:10]

        print(f"✅ Parent categories: {', '.join(categories)}")
        return categories

    def generate_taxonomy(
        self,
        main_query: str,
        parent_categories: List[str],
        children_per_parent: int = DEFAULT_CHILDREN_TARGET
    ) -> Dict:
        """
        Generate complete taxonomy with LLM-generated children.

        Args:
            main_query: The main research question/topic
            parent_categories: List of 10 parent category names
            children_per_parent: Target number of children per parent (3-5)

        Returns:
            Complete taxonomy dictionary with parents and children
        """
        print(f"🌳 Generating taxonomy for: {main_query}")
        print(f"📋 Parents: {len(parent_categories)}")

        # Generate children in parallel for all parents
        all_children = self._generate_children_parallel(
            main_query,
            parent_categories,
            children_per_parent
        )

        # Build taxonomy structure
        taxonomy = {
            "main_query": main_query,
            "categories": [
                {
                    "parent": parent,
                    "parent_id": self._to_snake_case(parent),
                    "children": all_children.get(parent, [])
                }
                for parent in parent_categories
            ],
            "total_children": sum(len(all_children.get(p, [])) for p in parent_categories)
        }

        print(LOG_TOTAL_CHILDREN.format(
            count=taxonomy["total_children"],
            parent_count=len(parent_categories)
        ))

        return taxonomy

    def _generate_children_parallel(
        self,
        main_query: str,
        parent_categories: List[str],
        children_per_parent: int
    ) -> Dict[str, List[Dict]]:
        """Generate children for all parents in parallel."""

        results = {}

        def generate_for_parent(parent: str):
            print(LOG_GENERATING_CHILDREN.format(parent=parent))
            try:
                children = self._generate_children_for_parent(
                    main_query,
                    parent,
                    children_per_parent
                )
                print(LOG_CHILDREN_COMPLETED.format(count=len(children), parent=parent))
                return parent, children
            except Exception as e:
                print(LOG_CHILDREN_FAILED.format(parent=parent, error=e))
                return parent, []

        # Run in parallel batches
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_PARALLEL) as executor:
            futures = [executor.submit(generate_for_parent, parent) for parent in parent_categories]

            for future in concurrent.futures.as_completed(futures):
                parent, children = future.result()
                results[parent] = children

        return results

    def _generate_children_for_parent(
        self,
        main_query: str,
        parent_category: str,
        target_count: int
    ) -> List[Dict]:
        """
        Generate children for a single parent category using research-backed approach.

        Process:
        1. Web search for relevant factors
        2. LLM analyzes and selects top children
        3. Return structured list
        """

        # Step 1: Web search for relevant factors
        search_results = self._research_factors(main_query, parent_category)

        # Step 2: LLM generates children based on research
        children_json = self._llm_generate_children(
            main_query,
            parent_category,
            search_results,
            target_count
        )

        return children_json

    def _research_factors(self, main_query: str, parent_category: str) -> str:
        """Research relevant factors via web search."""

        search_prompt = f"""
Find specific, measurable factors under the category "{parent_category}" that influence "{main_query}".

Focus on:
- Concrete, measurable factors (not vague concepts)
- Evidence-based factors from research literature
- Factors with quantifiable impacts
- Diverse mechanisms/pathways

Search for academic papers, government reports, and expert analyses.
Extract 8-10 relevant factors with brief evidence.
"""

        try:
            completion = self.openai_manager.chat_completion(
                model=MODEL_SEARCH,
                web_search_options={},
                messages=[{"role": "user", "content": search_prompt}],
            )

            return completion.choices[0].message.content.strip()

        except Exception as e:
            print(f"⚠️ Web search failed for {parent_category}: {e}")
            return ""

    def _llm_generate_children(
        self,
        main_query: str,
        parent_category: str,
        research_context: str,
        target_count: int
    ) -> List[Dict]:
        """Use LLM to generate structured child nodes from research."""
        from agents.dynamic_systems_modeler.prompts import DSMPrompts

        generation_prompt = DSMPrompts.CHILDREN_GENERATION_PROMPT.format(
            main_query=main_query,
            parent_category=parent_category,
            research_context=research_context,
            target_count=target_count
        )

        try:
            completion = self.openai_manager.chat_completion(
                model=PolicyDrafterConfig.O4_MINI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise data generator. Return ONLY valid JSON with no additional text."
                    },
                    {
                        "role": "user",
                        "content": generation_prompt
                    }
                ]
            )

            response = completion.choices[0].message.content.strip()

            # Parse JSON
            children_data = self._parse_children_json(response)

            # Validate and return
            return self._validate_children(children_data, parent_category)

        except Exception as e:
            print(f"❌ LLM generation failed for {parent_category}: {e}")
            return []

    def _parse_category_list(self, response: str) -> List[str]:
        """Parse category list from LLM response."""

        # Clean up response
        json_str = response.strip()

        # Remove markdown code blocks if present
        if JSON_CODE_BLOCK_START in json_str:
            start = json_str.find(JSON_CODE_BLOCK_START) + len(JSON_CODE_BLOCK_START)
            end = json_str.find(JSON_CODE_BLOCK_END, start)
            json_str = json_str[start:end].strip()

        # Find JSON array
        if "[" in json_str:
            start_idx = json_str.find("[")
            end_idx = json_str.rfind("]") + 1
            json_str = json_str[start_idx:end_idx]

        # Parse
        categories = json.loads(json_str)

        if not isinstance(categories, list):
            raise ValueError("Expected JSON array of category names")

        return [str(cat).strip() for cat in categories if cat]

    def _parse_children_json(self, response: str) -> List[Dict]:
        """Parse children JSON from LLM response."""

        # Clean up response
        json_str = response.strip()

        # Remove markdown code blocks if present
        if JSON_CODE_BLOCK_START in json_str:
            start = json_str.find(JSON_CODE_BLOCK_START) + len(JSON_CODE_BLOCK_START)
            end = json_str.find(JSON_CODE_BLOCK_END, start)
            json_str = json_str[start:end].strip()

        # Find JSON object
        if "{" in json_str:
            start_idx = json_str.find("{")
            end_idx = json_str.rfind("}") + 1
            json_str = json_str[start_idx:end_idx]

        # Parse
        data = json.loads(json_str)

        # Extract children array
        if "children" in data:
            return data["children"]
        elif isinstance(data, list):
            return data
        else:
            raise ValueError("No 'children' array found in JSON")

    def _validate_children(self, children: List[Dict], parent_name: str) -> List[Dict]:
        """Validate and clean children data."""

        validated = []

        for child in children:
            # Check required fields
            if not all(k in child for k in ["id", "label", "description", "evidence_strength", "measurability"]):
                print(f"⚠️ Skipping invalid child (missing fields): {child}")
                continue

            # Ensure ID is snake_case
            child_id = self._to_snake_case(child["id"])

            validated.append({
                "id": child_id,
                "label": child["label"],
                "description": child["description"],
                "evidence_strength": child["evidence_strength"],
                "measurability": child["measurability"],
                "parent": parent_name
            })

        return validated

    def validate_taxonomy(self, taxonomy: Dict) -> bool:
        """Validate complete taxonomy structure."""

        # Check required top-level fields
        if not all(k in taxonomy for k in ["main_query", "categories", "total_children"]):
            print("❌ Invalid taxonomy: missing required fields")
            return False

        # Check parent count
        if len(taxonomy["categories"]) != 10:
            print(f"⚠️ Warning: Expected 10 parent categories, got {len(taxonomy['categories'])}")

        # Check each category
        for category in taxonomy["categories"]:
            if not all(k in category for k in ["parent", "parent_id", "children"]):
                print(f"❌ Invalid category: {category}")
                return False

            # Check children count
            child_count = len(category["children"])
            if child_count < MIN_CHILDREN_PER_PARENT:
                print(f"⚠️ Warning: {category['parent']} has only {child_count} children (min {MIN_CHILDREN_PER_PARENT})")

            if child_count > MAX_CHILDREN_PER_PARENT:
                print(f"⚠️ Warning: {category['parent']} has {child_count} children (max {MAX_CHILDREN_PER_PARENT})")

        print(f"✅ Taxonomy validated: {taxonomy['total_children']} total children")
        return True

    @staticmethod
    def _to_snake_case(text: str) -> str:
        """Convert text to snake_case."""
        import re
        # Replace non-alphanumeric with underscore
        text = re.sub(r'[^a-zA-Z0-9]+', '_', text)
        # Convert to lowercase
        text = text.lower()
        # Remove leading/trailing underscores
        text = text.strip('_')
        return text
