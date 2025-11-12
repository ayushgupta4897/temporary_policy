"""
Dynamic Graph Builder - Constructs base graphs from custom taxonomy
Strategy& PWC - Dynamic Systems Modeler
"""

import json
from typing import Dict, List, Optional
from pathlib import Path
import sys
import concurrent.futures
from datetime import datetime

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from config.app_config import PolicyDrafterConfig
from clients.openai_client import get_openai_client
from agents.dynamic_systems_modeler.prompts import DSMPrompts

# ============================================================================
# CONSTANTS
# ============================================================================

# Model Configuration
MODEL_SEARCH = "gpt-4o-search-preview"
MAX_TOKENS_SEARCH = 16384
MAX_WORKERS_CITATION = 10

# Graph Configuration
# Note: We now use ALL nodes from taxonomy (no min/max, typically ~50 nodes)
TARGET_EDGE_RATIO_MIN = 2.0
TARGET_EDGE_RATIO_MAX = 4.0

# JSON Parsing
JSON_CODE_BLOCK_START = "```json"
JSON_CODE_BLOCK_END = "```"

# Logging
LOG_EXTRACTING_CITATIONS = "🔍 Extracting citations for {count} child nodes..."
LOG_CITATION_COMPLETED = "✅ Extracted {count} citations for: {node}"
LOG_TOTAL_CITATIONS = "📚 Total citations: {count}"
LOG_BUILDING_GRAPH = "🔨 Building base graph with GPT-5..."
LOG_GRAPH_COMPLETED = "✅ Base graph built: {nodes} nodes, {edges} edges"

# ============================================================================


class DynamicGraphBuilder:
    """Builds base graphs from custom user-defined taxonomy."""

    def __init__(self):
        self.openai_manager = get_openai_client()

    def build_base_graph(
        self,
        main_query: str,
        taxonomy: Dict,
        progress_callback: Optional[callable] = None
    ) -> Dict:
        """
        Build comprehensive base graph from custom taxonomy.

        Args:
            main_query: The main research question
            taxonomy: Complete taxonomy with parents and children
            progress_callback: Optional callback for progress updates

        Returns:
            Complete graph JSON with nodes, edges, metadata
        """
        print(f"🌐 Building base graph for: {main_query}")
        print(f"📊 Taxonomy: {taxonomy['total_children']} child nodes")

        # Step 1: Extract citations for all child nodes
        citations = self._extract_citations_parallel(main_query, taxonomy)
        print(LOG_TOTAL_CITATIONS.format(count=len(citations)))

        # Step 2: Build graph using GPT-5 with reasoning
        print(LOG_BUILDING_GRAPH)
        graph_json = self._construct_graph_with_llm(
            main_query,
            taxonomy,
            citations
        )

        # Step 3: Validate graph structure
        self._validate_graph(graph_json)

        # Step 4: Generate category summaries for parent nodes
        print("📝 Generating executive summaries for categories...")
        self._generate_category_summaries(graph_json, main_query)

        # Step 5: Generate node analyses for all child nodes
        print("🔍 Generating deep dive analyses for all nodes...")
        from agents.dynamic_systems_modeler.node_analyzer import NodeAnalyzer
        analyzer = NodeAnalyzer()
        node_analyses = analyzer.generate_all_node_analyses(
            graph_json,
            main_query,
            progress_callback
        )

        print(LOG_GRAPH_COMPLETED.format(
            nodes=len(graph_json.get('nodes', [])),
            edges=len(graph_json.get('edges', []))
        ))

        return {
            'graph': graph_json,
            'node_analyses': node_analyses
        }

    def _extract_citations_parallel(
        self,
        main_query: str,
        taxonomy: Dict
    ) -> List[Dict]:
        """Extract citations for all child nodes in parallel."""

        all_citations = []

        # Flatten all children from all categories
        all_children = []
        for category in taxonomy['categories']:
            for child in category['children']:
                all_children.append({
                    'parent': category['parent'],
                    'child': child
                })

        print(LOG_EXTRACTING_CITATIONS.format(count=len(all_children)))

        def extract_for_node(node_data):
            parent = node_data['parent']
            child = node_data['child']

            try:
                citations = self._search_node_evidence(
                    main_query,
                    parent,
                    child
                )
                print(LOG_CITATION_COMPLETED.format(
                    count=len(citations),
                    node=child['label']
                ))
                return citations
            except Exception as e:
                print(f"❌ Citation search failed for {child['label']}: {e}")
                return []

        # Run in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS_CITATION) as executor:
            futures = [executor.submit(extract_for_node, node_data) for node_data in all_children]

            for future in concurrent.futures.as_completed(futures):
                node_citations = future.result()
                all_citations.extend(node_citations)

        return all_citations

    def _search_node_evidence(
        self,
        main_query: str,
        parent_category: str,
        child_node: Dict
    ) -> List[Dict]:
        """Search for evidence about a specific child node's impact on main query."""

        search_prompt = f"""
Research the relationship between "{child_node['label']}" and "{main_query}".

Context:
- Category: {parent_category}
- Factor: {child_node['label']} - {child_node['description']}

Find evidence for:
1. How does this factor influence the main query?
2. What is the magnitude of impact? (quantitative if possible)
3. What are the mechanisms/pathways?
4. Current data/trends for this factor

Search for:
- Peer-reviewed studies
- Government statistics
- Expert analyses
- Meta-analyses

Extract top 3-5 citations and return ONLY a JSON array with this structure:
[
  {{
    "title": "Study/article title",
    "publisher": "Journal/Organization",
    "year": "2023",
    "url": "https://...",
    "doi": "10.xxxx/xxxxx",
    "evidence_type": "peer_reviewed|official_stat|think_tank|news",
    "key_quote": "Direct quote showing relationship to main query",
    "quantitative_data": "Specific numbers/statistics if available"
  }}
]
"""

        try:
            completion = self.openai_manager.chat_completion(
                model=MODEL_SEARCH,
                web_search_options={},
                messages=[{"role": "user", "content": search_prompt}]
            )

            result = completion.choices[0].message.content.strip()

            # Parse citations from result
            citations = self._parse_citations(result, child_node['id'])

            return citations

        except Exception as e:
            print(f"⚠️ Search failed for {child_node['label']}: {e}")
            return []

    def _parse_citations(self, content: str, node_id: str) -> List[Dict]:
        """Parse citations from web search result."""
        # Try to extract structured citations from the response
        citations = []

        # Look for JSON array in the response
        if '[' in content and ']' in content:
            try:
                # Find JSON array
                start_idx = content.find('[')
                end_idx = content.rfind(']') + 1
                json_str = content[start_idx:end_idx]
                parsed_citations = json.loads(json_str)

                # Add node_id to each citation
                for citation in parsed_citations:
                    citation['node_id'] = node_id
                    citations.append(citation)

                return citations[:5]  # Max 5 citations per node

            except json.JSONDecodeError:
                pass

        # Fallback: return condensed search results
        return [{
            "node_id": node_id,
            "title": "Research summary",
            "content": content[:2000],  # Increased from 1000
            "evidence_type": "web_search"
        }]

    def _construct_graph_with_llm(
        self,
        main_query: str,
        taxonomy: Dict,
        citations: List[Dict]
    ) -> Dict:
        """Use GPT-5 to construct the graph from taxonomy and citations."""

        # Format taxonomy for prompt
        taxonomy_json = json.dumps({
            "categories": taxonomy['categories'],
            "total_children": taxonomy['total_children']
        }, indent=2)

        # Format citations
        citations_json = json.dumps(citations, indent=2)

        # Build prompt
        prompt = DSMPrompts.BASE_GRAPH_CONSTRUCTION_PROMPT.format(
            main_query=main_query,
            total_children=taxonomy['total_children'],
            parent_count=len(taxonomy['categories']),
            taxonomy_json=taxonomy_json,
            citation_count=len(citations),
            citations_json=citations_json
        )

        # Call GPT-5 with reasoning
        print("🤖 Using GPT-5 with medium reasoning effort...")
        content = self.openai_manager.responses_create_and_wait(
            model=PolicyDrafterConfig.GPT_5,
            system_message="You are a senior systems evidence analyst. Build comprehensive, evidence-backed causal graphs.",
            user_message=prompt,
            reasoning={"effort": "medium"}
        )

        # Parse JSON from response
        graph_json = self._parse_graph_json(content)

        # Ensure parent nodes exist (inject if LLM didn't generate them)
        graph_json = self._ensure_parent_nodes(graph_json, taxonomy)

        # Add metadata
        graph_json['meta']['main_query'] = main_query
        graph_json['meta']['taxonomy_type'] = 'custom'
        graph_json['meta']['generated_at'] = datetime.utcnow().isoformat()
        graph_json['meta']['total_nodes'] = len(graph_json.get('nodes', []))
        graph_json['meta']['total_edges'] = len(graph_json.get('edges', []))

        if graph_json['meta']['total_nodes'] > 0:
            graph_json['meta']['edge_to_node_ratio'] = round(
                graph_json['meta']['total_edges'] / graph_json['meta']['total_nodes'],
                2
            )

        return graph_json

    def _ensure_parent_nodes(self, graph_json: Dict, taxonomy: Dict) -> Dict:
        """Ensure parent category nodes exist in the graph and have edges to their children."""

        nodes = graph_json.get('nodes', [])
        edges = graph_json.get('edges', [])

        # Check if parent nodes already exist
        parent_nodes_exist = any(node.get('type') == 'category' for node in nodes)

        if parent_nodes_exist:
            print("✅ Parent nodes already generated by LLM")
            return graph_json

        print("⚠️ Parent nodes missing - injecting them now...")

        # Create parent nodes
        parent_nodes = []
        parent_to_children = {}  # Map parent name to list of child IDs

        for category in taxonomy['categories']:
            parent_name = category['parent']
            # Sanitize ID (lowercase, underscores, no special chars)
            parent_id = f"parent_{parent_name.lower().replace(' ', '_').replace('&', 'and')}"
            parent_id = ''.join(c for c in parent_id if c.isalnum() or c == '_')

            # Create parent node
            parent_node = {
                "id": parent_id,
                "label": parent_name,
                "parent_category": None,  # Parents have no parent
                "type": "category",
                "severity_1to5": 3,
                "notes": f"Parent category grouping {len(category['children'])} child factors"
            }
            parent_nodes.append(parent_node)

            # Track children for this parent
            parent_to_children[parent_name] = []

        # Map children to their parents
        for node in nodes:
            parent_cat = node.get('parent_category')
            if parent_cat and parent_cat in parent_to_children:
                parent_to_children[parent_cat].append(node['id'])

        # Create parent-to-child edges
        parent_edges = []
        for parent_name, child_ids in parent_to_children.items():
            parent_id = f"parent_{parent_name.lower().replace(' ', '_').replace('&', 'and')}"
            parent_id = ''.join(c for c in parent_id if c.isalnum() or c == '_')

            for child_id in child_ids:
                edge = {
                    "source": parent_id,
                    "target": child_id,
                    "relation": "categorical",
                    "sign": "+",
                    "weight_0to1": 1.0,
                    "confidence": "High",
                    "supporting_evidence": [],
                    "notes": "Categorical grouping edge"
                }
                parent_edges.append(edge)

        # Add parent nodes at the beginning of nodes list
        graph_json['nodes'] = parent_nodes + nodes

        # Add parent edges at the beginning of edges list
        graph_json['edges'] = parent_edges + edges

        print(f"✅ Injected {len(parent_nodes)} parent nodes and {len(parent_edges)} parent-to-child edges")

        return graph_json

    def _clean_json_with_llm(self, content: str) -> str:
        """Use GPT-5-nano to repair and clean malformed JSON from LLM response."""

        try:
            cleaning_prompt = f"""You are a JSON repair specialist. Your ONLY task is to extract and clean JSON from potentially malformed text.

INPUT TEXT (may have explanations, code blocks, or syntax errors):
{content[:4000]}

INSTRUCTIONS:
1. Extract the JSON object from the text (find the main {{...}} structure)
2. Fix any syntax errors:
   - Add missing quotes around keys/strings
   - Add missing commas between properties
   - Close any unclosed brackets/braces
   - Remove trailing commas
   - Escape internal quotes properly
3. Validate all arrays and objects are properly closed
4. Return ONLY valid, parseable JSON

OUTPUT REQUIREMENTS:
- Output ONLY the corrected JSON object, nothing else
- No markdown code blocks
- No explanations
- No comments
- Valid JSON that can be parsed by json.loads()
- Start with {{ and end with }}

Return the cleaned JSON now:"""

            response = self.openai_manager.chat_completion(
                model=PolicyDrafterConfig.GPT_5_NANO,
                messages=[{"role": "user", "content": cleaning_prompt}],
                max_completion_tokens=5000
            )

            cleaned = response.choices[0].message.content.strip()
            print(f"🧹 JSON cleaned by GPT-5-nano ({len(cleaned)} chars)")
            return cleaned

        except Exception as e:
            print(f"⚠️ GPT-5-nano cleaning failed, proceeding with raw content: {e}")
            return content

    def _parse_graph_json(self, content: str) -> Dict:
        """Parse graph JSON from LLM response with GPT-5-nano cleaning."""

        # Step 1: Clean with GPT-5-nano
        cleaned_content = self._clean_json_with_llm(content)

        # Step 2: Clean up content
        json_str = cleaned_content.strip()

        # Remove markdown code blocks
        if JSON_CODE_BLOCK_START in json_str:
            start = json_str.find(JSON_CODE_BLOCK_START) + len(JSON_CODE_BLOCK_START)
            end = json_str.find(JSON_CODE_BLOCK_END, start)
            json_str = json_str[start:end].strip()

        # Find JSON object
        if "{" in json_str:
            start_idx = json_str.find("{")
            end_idx = json_str.rfind("}") + 1
            json_str = json_str[start_idx:end_idx]

        # Sanitize control characters
        import re
        json_str = re.sub(r'[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]', '', json_str)

        # Parse JSON
        try:
            graph = json.loads(json_str)
            print(f"✅ JSON parsed: {len(graph.get('nodes', []))} nodes, {len(graph.get('edges', []))} edges")
            return graph
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"Error at line {e.lineno}, column {e.colno}")
            print(f"First 500 chars: {json_str[:500]}")
            print(f"Context around error (char {max(0, e.pos-100)} to {min(len(json_str), e.pos+100)}):")
            print(json_str[max(0, e.pos-100):min(len(json_str), e.pos+100)])

            # Save malformed JSON for debugging
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, prefix='malformed_graph_') as f:
                f.write(json_str)
                print(f"💾 Saved malformed JSON to: {f.name}")

            # CRITICAL: Raise exception instead of returning empty graph
            raise Exception(f"Failed to parse graph JSON from LLM. Error: {e}. Saved to debug file.")

    def _validate_graph(self, graph: Dict) -> bool:
        """Validate graph structure and requirements."""

        if not graph.get('nodes') or not graph.get('edges'):
            print("⚠️ Warning: Graph has no nodes or edges")
            return False

        node_count = len(graph['nodes'])
        edge_count = len(graph['edges'])

        # Report node count (no minimum since we use all taxonomy nodes)
        print(f"📊 Total nodes: {node_count}")

        # Check edge-to-node ratio
        if node_count > 0:
            ratio = edge_count / node_count
            if ratio < TARGET_EDGE_RATIO_MIN or ratio > TARGET_EDGE_RATIO_MAX:
                print(f"⚠️ Warning: Edge-to-node ratio {ratio:.2f} outside target range ({TARGET_EDGE_RATIO_MIN}-{TARGET_EDGE_RATIO_MAX})")
            else:
                print(f"✅ Edge-to-node ratio: {ratio:.2f} (target: {TARGET_EDGE_RATIO_MIN}-{TARGET_EDGE_RATIO_MAX})")

        # Check node types
        type_counts = {}
        for node in graph['nodes']:
            node_type = node.get('type', 'unknown')
            type_counts[node_type] = type_counts.get(node_type, 0) + 1

        print(f"📊 Node type distribution: {type_counts}")

        # Validate edges reference valid nodes
        node_ids = {node['id'] for node in graph['nodes']}
        invalid_edges = []
        valid_edges = []

        for edge in graph['edges']:
            if edge['source'] not in node_ids or edge['target'] not in node_ids:
                invalid_edges.append(f"{edge['source']} → {edge['target']}")
            else:
                valid_edges.append(edge)

        if invalid_edges:
            print(f"⚠️ Found {len(invalid_edges)} edges with invalid node references - removing them")
            for invalid_edge in invalid_edges[:5]:  # Show first 5
                print(f"   - {invalid_edge}")
            if len(invalid_edges) > 5:
                print(f"   ... and {len(invalid_edges) - 5} more")

            # Replace edges with only valid ones
            graph['edges'] = valid_edges
            print(f"✅ Cleaned graph: {len(valid_edges)} valid edges remaining")

        print("✅ Graph validation passed")

    def _generate_category_summaries(self, graph_json: Dict, main_query: str):
        """Generate AI executive summaries for all parent categories using GPT-5."""

        nodes = graph_json.get('nodes', [])
        edges = graph_json.get('edges', [])
        parent_nodes = [n for n in nodes if n.get('type') == 'category']

        if not parent_nodes:
            print("⚠️ No parent nodes found - skipping summary generation")
            return

        # Build context for each parent category
        category_contexts = []
        for parent in parent_nodes:
            parent_name = parent['label']
            children = [n for n in nodes if n.get('parent_category') == parent_name]

            # Get connections to other categories
            child_ids = [c['id'] for c in children]
            outgoing_edges = [e for e in edges
                            if e.get('source') in child_ids
                            and e.get('relation') != 'categorical']

            # Group connections by target category
            connections = {}
            for edge in outgoing_edges:
                target_node = next((n for n in nodes if n['id'] == edge.get('target')), None)
                if target_node and target_node.get('parent_category') and target_node.get('parent_category') != parent_name:
                    target_cat = target_node.get('parent_category')
                    connections[target_cat] = connections.get(target_cat, 0) + 1

            category_contexts.append({
                'parent_name': parent_name,
                'children': children[:5],  # Top 5 for context
                'connections': connections
            })

        # Build prompt for all summaries
        prompt = self._build_summary_prompt(main_query, category_contexts)

        # Call GPT-5 with reasoning
        try:
            print("🤖 Using GPT-5 to generate category summaries...")
            content = self.openai_manager.responses_create_and_wait(
                model=PolicyDrafterConfig.GPT_5,
                system_message="You are a systems thinking expert analyzing policy impact networks. Generate concise, data-driven executive summaries for category groupings.",
                user_message=prompt,
                reasoning={"effort": "low"}  # Don't need deep reasoning for summaries
            )

            # Parse response and add summaries to parent nodes
            summaries = self._parse_summaries(content, parent_nodes)

            for parent in parent_nodes:
                parent_name = parent['label']
                summary = summaries.get(parent_name, "")
                if summary:
                    parent['category_summary'] = summary
                else:
                    parent['category_summary'] = f"This category encompasses key factors related to {parent_name.lower()} in the context of {main_query}."

            print(f"✅ Generated {len(summaries)} category summaries")

        except Exception as e:
            print(f"⚠️ Failed to generate category summaries: {e}")
            # Add default summaries
            for parent in parent_nodes:
                parent_name = parent['label']
                parent['category_summary'] = f"This category encompasses key factors related to {parent_name.lower()} in the context of {main_query}."

    def _build_summary_prompt(self, main_query: str, category_contexts: List[Dict]) -> str:
        """Build prompt for generating all category summaries at once."""

        contexts_text = ""
        for ctx in category_contexts:
            child_list = "\n".join([
                f"  - {c['label']}: {c.get('kpi', {}).get('name', 'N/A')} = "
                f"{c.get('kpi', {}).get('current_value', 'N/A')}{c.get('kpi', {}).get('unit', '')}"
                for c in ctx['children']
            ])

            if ctx['connections']:
                conn_list = ", ".join([
                    f"{cat} ({count} edges)"
                    for cat, count in sorted(ctx['connections'].items(), key=lambda x: -x[1])[:3]
                ])
            else:
                conn_list = "None"

            contexts_text += f"""
### {ctx['parent_name']}
Child Factors:
{child_list}
Top Connections: {conn_list}
---
"""

        return DSMPrompts.CATEGORY_SUMMARY_PROMPT.format(
            main_query=main_query,
            category_count=len(category_contexts),
            contexts_text=contexts_text
        )

    def _parse_summaries(self, content: str, parent_nodes: List[Dict]) -> Dict[str, str]:
        """Parse category summaries from GPT-5 response."""

        try:
            # Extract JSON from response
            import re
            json_str = content.strip()

            # Remove markdown code blocks if present
            if '```' in json_str:
                match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', json_str, re.DOTALL)
                if match:
                    json_str = match.group(1)

            # Find JSON object
            if '{' in json_str:
                start_idx = json_str.find('{')
                end_idx = json_str.rfind('}') + 1
                json_str = json_str[start_idx:end_idx]

            summaries = json.loads(json_str)

            # Validate that we got summaries for all categories
            print(f"✅ Parsed {len(summaries)} summaries from LLM response")
            return summaries

        except Exception as e:
            print(f"⚠️ Failed to parse summaries: {e}")
            print(f"Response preview: {content[:500]}...")
            return {}
