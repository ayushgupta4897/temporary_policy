"""
Graph Agent - Handles Systems Evidence Graph Building
Strategy& PWC - SEGB Feature
"""

import os
import json
import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from pathlib import Path
import sys
import openai
from openai import OpenAI
import csv
from io import StringIO
import concurrent.futures

# Add parent directory to path to import config
sys.path.append(str(Path(__file__).parent.parent))
from policy_drafter.config import PolicyDrafterConfig
from policy_drafter.prompts import PolicyPrompts

class GraphBuildingAgent:
    """Agent for building systems evidence graphs using GPT-4."""
    
    def __init__(self):
        # Use API key from config
        self.client = OpenAI(api_key=PolicyDrafterConfig.OPENAI_API_KEY)
        self.output_dir = Path("graph_outputs")
        self.output_dir.mkdir(exist_ok=True)
        
        # Define high-trust source categories for parallel search
        self.source_categories = [
            {
                "name": "official_government_stats",
                "instruction": "Search ONLY UAE government statistics first, then GCC if needed. Priority search terms: 'UAE statistics', 'Dubai Statistics Center', 'Abu Dhabi Department of Economic Development', 'UAE Federal Competitiveness Statistics', 'MOHAP UAE health data', 'UAE government health reports'. REJECT global statistics without UAE context."
            },
            {
                "name": "un_world_bank_who",
                "instruction": "Search UN/WHO/World Bank data BUT only for UAE-specific statistics. Priority search terms: 'UAE WHO country profile', 'World Bank UAE data', 'OECD UAE statistics', 'UN Statistics UAE'. REJECT generic global data without UAE breakdown."
            },
            {
                "name": "peer_reviewed_journals_nature",
                "instruction": "Search Nature Human Behaviour for UAE/GCC-specific studies only. Priority search terms: 'UAE population study Nature', 'Gulf region mental health Nature', 'Emirates research Nature Human Behaviour'. REJECT global studies without Middle East context."
            },
            {
                "name": "peer_reviewed_journals_pnas",
                "instruction": "Search PNAS for UAE/Middle East studies only. Priority search terms: 'UAE PNAS study', 'Middle East PNAS research', 'Gulf region PNAS', 'Arab population PNAS'. REJECT global studies without regional relevance."
            },
            {
                "name": "peer_reviewed_general",
                "instruction": "Search peer-reviewed journals for UAE/GCC studies only. Priority search terms: 'UAE health study PubMed', 'Emirates population research', 'Gulf region health BMJ', 'UAE Lancet study'. REJECT global studies without UAE/GCC populations."
            },
            {
                "name": "regional_health_authorities",
                "instruction": "Search UAE health authorities FIRST, then GCC. Priority search terms: 'Dubai Health Authority reports', 'UAE Ministry of Health data', 'MOHAP statistics', 'DHA health indicators'. GCC sources only if UAE data unavailable."
            },
            {
                "name": "universities_research_institutes",
                "instruction": "Search UAE universities FIRST for local research. Priority search terms: 'UAE University research', 'American University Sharjah study', 'Zayed University health research', 'UAE academic publications'. Expand to GCC universities only if UAE research insufficient."
            },
            {
                "name": "think_tanks_policy_institutes",
                "instruction": "Search UAE think tanks FIRST, then Gulf region. Priority search terms: 'Emirates Policy Center UAE', 'UAE research institutes', 'Dubai policy studies', 'Gulf Research Center UAE data'. Focus on UAE-specific policy analysis."
            },
            {
                "name": "international_organizations",
                "instruction": "Search international orgs for UAE-specific programs and data. Priority search terms: 'UNDP UAE country office', 'UNICEF UAE reports', 'UNESCO UAE statistics', 'WHO UAE country profile'. REJECT generic regional data without UAE specifics."
            },
            {
                "name": "professional_associations",
                "instruction": "Search UAE medical associations FIRST. Priority search terms: 'UAE Medical Association data', 'Emirates Medical Society reports', 'Dubai medical professionals survey', 'UAE psychiatry association statistics'. GCC associations only as secondary sources."
            }
        ]
    
    def run_graph_pipeline(self, query: str, geography: str, 
                          time_range: str, 
                          intervention: Optional[str] = None) -> Dict[str, str]:
        """Run complete graph building pipeline with parallel citation extraction."""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Step 1: Extract citations in parallel from all high-trust sources
        print(f"🌐 Extracting citations from {len(self.source_categories)} source categories...")
        all_citations = self._extract_citations_parallel(query, geography, time_range, intervention)
        
        # Step 2: Main analysis with GPT-5 using extracted citations
        print(f"🔍 Running main analysis with {len(all_citations)} citations...")
        main_response = self._run_main_analysis_with_citations(query, geography, time_range, intervention, all_citations)
        
        # Step 3: Parallel extraction of JSON, CSV, and executive takeaways
        print("📊 Extracting structured data...")
        graph_json, csv_data, executive_summary = self._extract_structured_data(main_response)
        
        # Step 4: Generate interactive HTML
        print("🎨 Generating interactive visualization...")
        html_content = self._generate_html_visualization(graph_json)
        
        # Step 5: Save all outputs including citations
        output_paths = self._save_outputs(timestamp, {
            'full_analysis': main_response,
            'graph_json': json.dumps(graph_json, indent=2),
            'csv_data': csv_data,
            'executive_summary': executive_summary,
            'interactive_html': html_content,
            'citations': json.dumps(all_citations, indent=2)
        })
        
        return output_paths
    
    def _extract_citations_parallel(self, query: str, geography: str, time_range: str, intervention: Optional[str]) -> List[Dict]:
        """Extract citations in parallel from all source categories."""
        
        def extract_from_source(source_config):
            """Extract citations from a single source category."""
            name = source_config["name"]
            instruction = source_config["instruction"]
            
            print(f"   🔍 Searching {name}...")
            
            try:
                # Format the citation extraction prompt
                prompt = PolicyPrompts.SEGB_CITATIONS_ONLY_PROMPT.format(
                    focus_issue=query,
                    geography=geography,
                    time_range=time_range,
                    intervention=intervention or "None",
                    source_type=name,
                    source_instruction=instruction
                )
                
                # Use gpt-4o-search-preview for real web search
                completion = self.client.chat.completions.create(
                    model="gpt-4o-search-preview",
                    web_search_options={},
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=30000
                )
                
                result = completion.choices[0].message.content.strip()
                print(f"   ✅ {name} search completed")
                return name, result
                
            except Exception as e:
                print(f"   ❌ {name} search failed: {e}")
                return name, None
        
        # Run all extractions in parallel (batches of 10)
        all_citations = []
        batch_size = 10
        
        for i in range(0, len(self.source_categories), batch_size):
            batch = self.source_categories[i:i+batch_size]
            print(f"🔄 Processing batch {i//batch_size + 1} ({len(batch)} sources)...")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(extract_from_source, source) for source in batch]
                
                for future in concurrent.futures.as_completed(futures):
                    source_name, result = future.result()
                    if result:
                        # Parse JSON from result
                        citations = self._parse_citations_from_response(result, source_name)
                        all_citations.extend(citations)
        
        print(f"📚 Total citations extracted: {len(all_citations)}")
        return all_citations
    
    def _parse_citations_from_response(self, content: str, source_name: str) -> List[Dict]:
        """Parse citations from web search response."""
        try:
            # Extract JSON from response
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
            
            citations = json.loads(json_content)
            
            # Add source tracking
            for citation in citations:
                citation['source_search'] = source_name
            
            return citations
            
        except Exception as e:
            print(f"   ⚠️ Failed to parse {source_name}: {e}")
            return []
    
    def _run_main_analysis_with_citations(self, query: str, geography: str, time_range: str, 
                                        intervention: Optional[str], citations: List[Dict]) -> str:
        """Run main analysis with pre-extracted citations."""
        
        # Format citations for inclusion in prompt
        citations_text = json.dumps(citations, indent=2)
        
        # Use the updated SEGB_MAIN_PROMPT with citations
        user_prompt = PolicyPrompts.SEGB_MAIN_PROMPT.format(
            focus_issue=query,
            geography=geography,
            time_range=time_range,
            intervention=intervention if intervention else "None",
            extracted_citations=citations_text
        )
        
        print("🔄 Running GPT-5 analysis with citation integration...")
        
        # Direct GPT-5 call with streaming
        response = self.client.chat.completions.create(
            model=PolicyDrafterConfig.GPT_5,
            messages=[
                {"role": "system", "content": "You are a senior evidence-synthesis analyst and systems-thinking model. Use the provided citations as evidence in your analysis."},
                {"role": "user", "content": user_prompt}
            ],
            stream=True
        )
        
        # Collect streamed response
        full_response = []
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                full_response.append(chunk.choices[0].delta.content)
        
        result = ''.join(full_response)
        print("✅ GPT-5 analysis with citations completed")
        return result
    
    def _run_main_analysis(self, query: str, geography: str, 
                          time_range: str, intervention: Optional[str]) -> str:
        """Run main analysis with GPT-5 - no fallbacks, no limits."""
        
        # Use the exact SEGB prompt from prompts.py
        user_prompt = PolicyPrompts.SEGB_MAIN_PROMPT.format(
            focus_issue=query,
            geography=geography,
            time_range=time_range,
            intervention=intervention if intervention else "None"
        )
        
        print("🔄 Running GPT-5 analysis...")
        
        # Direct GPT-5 call with streaming for better connection stability
        response = self.client.chat.completions.create(
            model=PolicyDrafterConfig.GPT_5,
            messages=[
                {"role": "system", "content": "You are a senior evidence-synthesis analyst and systems-thinking model. Provide comprehensive analysis with specific quantifiable data."},
                {"role": "user", "content": user_prompt}
            ],
            stream=True
        )
        
        # Collect streamed response
        full_response = []
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                full_response.append(chunk.choices[0].delta.content)
        
        result = ''.join(full_response)
        print("✅ GPT-5 analysis completed")
        return result
    
    def _extract_structured_data(self, main_response: str) -> Tuple[Dict, str, str]:
        """Extract JSON, CSV, and executive summary from main response."""
        import concurrent.futures
        
        # Define extraction tasks
        tasks = [
            ("Extract ONLY the graph JSON from Output B. Return valid JSON only, no markdown.", "json"),
            ("Extract ONLY the CSV data tables from Output C. Return CSV format only.", "csv"),
            ("Extract ONLY the executive narrative from Output A. Format as markdown.", "summary")
        ]
        
        results = {}
        
        def extract_single(instruction, key):
            """Extract a single component from the response."""
            response = self.client.chat.completions.create(
                model=PolicyDrafterConfig.O4_MINI_MODEL,
                messages=[
                    {"role": "system", "content": "Extract and return only the requested data format."},
                    {"role": "user", "content": f"{instruction}\n\nSource content:\n{main_response}"}
                ]
            )
            return key, response.choices[0].message.content
        
        # Run extractions in parallel for speed
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(extract_single, instruction, key) for instruction, key in tasks]
            for future in concurrent.futures.as_completed(futures):
                key, content = future.result()
                results[key] = content
        
        # Parse JSON
        try:
            json_str = results.get('json', '{}')
            # Clean up the JSON string
            json_str = json_str.replace('```json', '').replace('```', '').strip()
            # Try to find JSON object in the response
            if '{' in json_str and '}' in json_str:
                start_idx = json_str.find('{')
                end_idx = json_str.rfind('}') + 1
                json_str = json_str[start_idx:end_idx]
            graph_json = json.loads(json_str)
        except Exception as e:
            print(f"⚠️ Failed to parse JSON: {e}")
            # Fallback to a minimal structure
            graph_json = self._create_fallback_json()
        
        return graph_json, results['csv'], results['summary']
    
    def _generate_html_visualization(self, graph_json: Dict) -> str:
        """Generate interactive HTML visualization."""
        
        html_template = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Systems Evidence Graph - {title}</title>
  <script src="https://unpkg.com/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
  <style>
    body {{ font-family: Inter, system-ui, sans-serif; margin:0; display:flex; height:100vh; background:#f8fafc; }}
    #cy {{ flex: 1; background: linear-gradient(to bottom right, #f8fafc, #e0e7ff); }}
    #panel {{ width: 450px; border-left: 2px solid #e2e8f0; padding: 24px; overflow:auto; background:white; box-shadow: -4px 0 16px rgba(0,0,0,0.05); }}
    .legend div {{ margin-bottom: 10px; display: flex; align-items: center; }}
    .pill {{ display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:500; }}
    .color-box {{ width: 20px; height: 20px; border-radius: 4px; margin-right: 12px; border: 1px solid #e2e8f0; }}
    .line-example {{ width: 40px; height: 2px; margin-right: 12px; }}
    h2 {{ color: #1e293b; font-size: 20px; margin-top: 0; }}
    h3 {{ color: #475569; font-size: 16px; margin: 16px 0 8px; }}
    .citation {{ background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 8px 0; }}
    .citation strong {{ color: #1e293b; }}
    .citation a {{ color: #3b82f6; text-decoration: none; }}
    .citation a:hover {{ text-decoration: underline; }}
    blockquote {{ margin: 8px 0; padding-left: 12px; border-left: 3px solid #cbd5e1; color: #64748b; font-size: 13px; }}
    .meta-info {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }}
    .kpi-box {{ background: #f0f9ff; padding: 12px; border-radius: 8px; margin: 12px 0; border-left: 3px solid #3b82f6; }}
    .metric-value {{ font-size: 20px; font-weight: bold; color: #1e40af; }}
    .node-stats {{ display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }}
    .stat-item {{ background: #f8fafc; padding: 8px; border-radius: 6px; }}
    .stat-label {{ font-size: 11px; color: #64748b; text-transform: uppercase; }}
    .stat-value {{ font-size: 16px; font-weight: 600; color: #1e293b; }}
  </style>
</head>
<body>
  <div id="cy"></div>
  <aside id="panel">
    <div class="meta-info">
      <h2 style="margin-bottom: 12px; color: white;">📊 Systems Evidence Graph</h2>
      <div style="color: rgba(255,255,255,0.9); font-size: 14px;">
        <div><strong>Focus:</strong> {focus}</div>
        <div><strong>Geography:</strong> {geography}</div>
        <div><strong>Period:</strong> {time_range}</div>
      </div>
    </div>
    
    <div class="legend">
      <h3>🎨 Node Types</h3>
      <div><span class="color-box" style="background:#60a5fa"></span> <strong>Driver</strong> - Root causes & contributing factors</div>
      <div><span class="color-box" style="background:#94a3b8"></span> <strong>Status Quo</strong> - Current state indicators</div>
      <div><span class="color-box" style="background:#c084fc"></span> <strong>Implication</strong> - Future consequences</div>
      <div><span class="color-box" style="background:#34d399"></span> <strong>Intervention</strong> - Policy actions</div>
      
      <h3 style="margin-top: 20px;">🔗 Edge Types</h3>
      <div><span class="line-example" style="background:#10b981; height:3px;"></span> <strong>Positive</strong> - Promotes/increases target</div>
      <div><span class="line-example" style="background:#ef4444; height:3px;"></span> <strong>Negative</strong> - Reduces/inhibits target</div>
      
      <h3 style="margin-top: 20px;">📐 Relationship Types</h3>
      <div><span class="line-example" style="background:#64748b; border-bottom: 2px solid;"></span> <strong>Causal</strong> - Direct cause-effect</div>
      <div><span class="line-example" style="background:#64748b; border-bottom: 2px dashed;"></span> <strong>Associational</strong> - Correlated but not causal</div>
      <div><span class="line-example" style="background:#64748b; border-bottom: 2px dotted;"></span> <strong>Feedback</strong> - Bidirectional influence</div>
      
      <div style="margin-top: 16px; padding: 12px; background: #f1f5f9; border-radius: 8px; font-size: 12px;">
        <strong>💡 Tips:</strong><br>
        • Edge thickness = relationship strength (0-1)<br>
        • Node size = severity/importance (1-5)<br>
        • 📈📉 = Quantifiable trend indicators
      </div>
    </div>
    
    <div id="info" style="margin-top: 24px;">
      <p style="color: #94a3b8;">Click any node or edge to view detailed metrics and citations.</p>
    </div>
  </aside>

  <script>
    const GRAPH_DATA = {graph_json};

    // Updated colors for better visibility
    const colorByType = {{
      driver: "#60a5fa",      // Brighter blue
      status_quo: "#94a3b8",  // Neutral gray
      implication: "#c084fc", // Vibrant purple
      intervention: "#34d399", // Fresh green
      mediator: "#fbbf24"     // Yellow for mediators
    }};

    // Function to add trend emoji to label if quantifiable
    function getNodeLabel(node) {{
      let label = node.label || node.id;
      if (node.kpi && node.kpi.trend) {{
        if (node.kpi.trend === 'up') label += ' 📈';
        else if (node.kpi.trend === 'down') label += ' 📉';
        else if (node.kpi.trend === 'flat') label += ' ➡️';
      }}
      // Add quantifiable value if available
      if (node.kpi && node.kpi.current_value !== null && node.kpi.current_value !== undefined) {{
        label += '\\n(' + node.kpi.current_value + (node.kpi.unit || '') + ')';
      }}
      return label;
    }}

    const elements = {{
      nodes: GRAPH_DATA.nodes.map(n => ({{
        data: {{
          id: n.id, 
          label: getNodeLabel(n), 
          type: n.type, 
          category: n.category,
          kpi: n.kpi, 
          citations: n.citations, 
          severity: n.severity_1to5, 
          notes: n.notes
        }}
      }})),
      edges: GRAPH_DATA.edges.map(e => ({{
        data: {{
          id: (e.source + "_" + e.target),
          source: e.source, 
          target: e.target,
          sign: e.sign, 
          relation: e.relation, 
          weight: e.weight_0to1,
          confidence: e.confidence, 
          citations: e.supporting_evidence, 
          notes: e.notes
        }}
      }}))
    }};

    const cy = cytoscape({{
      container: document.getElementById('cy'),
      elements,
      layout: {{ 
        name: 'cose', 
        idealEdgeLength: 180,
        nodeRepulsion: 12000,
        numIter: 1000,
        animate: true,
        animationDuration: 1000,
        gravity: 1,
        padding: 30,
        componentSpacing: 100,
        nodeOverlap: 64,
        edgeElasticity: 100
      }},
      style: [
        {{
          selector: 'node',
          style: {{
            'background-color': ele => colorByType[ele.data('type')] || '#94a3b8',
            'label': 'data(label)',
            'font-size': 10,
            'text-wrap': 'wrap',
            'text-max-width': 140,
            'text-valign': 'center',
            'text-halign': 'center',
            'width': ele => {{
              const base = 60;
              const severity = ele.data('severity') || 1;
              const hasValue = ele.data('kpi')?.current_value ? 20 : 0;
              return base + (severity * 12) + hasValue;
            }},
            'height': ele => {{
              const base = 50;
              const severity = ele.data('severity') || 1;
              const hasValue = ele.data('kpi')?.current_value ? 15 : 0;
              return base + (severity * 10) + hasValue;
            }},
            'padding': 8,
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 0.8,
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.7,
            'text-background-padding': 2,
            'shape': 'roundrectangle'
          }}
        }},
        {{
          selector: 'edge',
          style: {{
            'width': ele => Math.max(1.5, 1 + 6*(ele.data('weight')||0.2)),
            'line-color': ele => ele.data('sign') === '-' ? '#ef4444' : '#10b981',
            'target-arrow-color': ele => ele.data('sign') === '-' ? '#ef4444' : '#10b981',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-style': ele => {{
              if (ele.data('relation') === 'feedback') return 'dotted';
              if (ele.data('relation') === 'associational') return 'dashed';
              return 'solid';
            }},
            'opacity': 0.75,
            'arrow-scale': 1.2
          }}
        }},
        {{
          selector: 'node:selected',
          style: {{
            'border-width': 4,
            'border-color': '#3b82f6',
            'overlay-color': '#3b82f6',
            'overlay-opacity': 0.1,
            'overlay-padding': 8
          }}
        }}
      ]
    }});

    function renderCitations(title, items=[]) {{
      if (!items || !items.length) return `<p style="color: #94a3b8;">No citations available.</p>`;
      return `
        <h3>${{title}}</h3>
        ${{items.slice(0,3).map(c => {{
          // Format URL properly
          let link = '';
          let linkText = '';
          
          if (c.doi && c.doi !== '') {{
            // Handle DOI - could be just the DOI or a full URL
            if (c.doi.startsWith('http')) {{
              link = c.doi;
              linkText = c.doi;
            }} else if (c.doi.startsWith('10.')) {{
              // Convert DOI to URL
              link = 'https://doi.org/' + c.doi;
              linkText = 'DOI: ' + c.doi;
            }} else {{
              link = c.doi;
              linkText = c.doi;
            }}
          }} else if (c.url && c.url !== '') {{
            // Handle regular URL
            link = c.url;
            if (!link.startsWith('http')) {{
              link = 'https://' + link;
            }}
            // Truncate long URLs for display
            linkText = c.url.length > 60 ? c.url.substring(0, 60) + '...' : c.url;
          }}
          
          return `
            <div class="citation">
              <div><strong>${{c.title || 'Untitled'}}</strong></div>
              <div style="color: #64748b; font-size: 13px; margin: 4px 0;">${{c.publisher||''}} • ${{c.year||''}}</div>
              ${{link ? `<div><a href="${{link}}" target="_blank" style="word-break: break-all;">${{linkText}}</a></div>` : '<div style="color: #94a3b8;">No link available</div>'}}
              ${{c.key_quote ? `<blockquote>${{c.key_quote}}</blockquote>` : ''}}
            </div>
          `;
        }}).join('')}}
      `;
    }}

    cy.on('tap', 'node', evt => {{
      const n = evt.target.data();
      const nodeData = GRAPH_DATA.nodes.find(node => node.id === n.id) || {{}};
      
      // Build comprehensive node info with quantifiable data
      let kpiSection = '';
      if (n.kpi) {{
        kpiSection = `
          <div class="kpi-box">
            <h4 style="margin: 0 0 8px 0; color: #1e40af;">📊 Key Metrics</h4>
            <div class="metric-value">
              ${{n.kpi.current_value !== null && n.kpi.current_value !== undefined ? 
                n.kpi.current_value + (n.kpi.unit || '') : 'Not quantified'}}
            </div>
            <div style="margin-top: 8px;">
              <strong>Indicator:</strong> ${{n.kpi.name || 'N/A'}}<br>
              ${{n.kpi.year ? `<strong>Year:</strong> ${{n.kpi.year}}<br>` : ''}}
              ${{n.kpi.trend ? `<strong>Trend:</strong> ${{
                n.kpi.trend === 'up' ? '📈 Increasing' :
                n.kpi.trend === 'down' ? '📉 Decreasing' :
                '➡️ Stable'
              }}<br>` : ''}}
            </div>
          </div>
        `;
      }}
      
      // Build node statistics
      const connectedEdges = cy.edges().filter(edge => 
        edge.data('source') === n.id || edge.data('target') === n.id
      );
      
      const outgoingEdges = connectedEdges.filter(e => e.data('source') === n.id);
      const incomingEdges = connectedEdges.filter(e => e.data('target') === n.id);
      
      const statsSection = `
        <div class="node-stats">
          <div class="stat-item">
            <div class="stat-label">Severity</div>
            <div class="stat-value">${{n.severity || 1}}/5</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Connections</div>
            <div class="stat-value">${{connectedEdges.length}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Influences</div>
            <div class="stat-value">${{outgoingEdges.length}}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Influenced by</div>
            <div class="stat-value">${{incomingEdges.length}}</div>
          </div>
        </div>
      `;
      
      document.getElementById('info').innerHTML = `
        <span class="pill" style="background: ${{colorByType[n.type]}}; color: white;">${{n.type?.toUpperCase() || 'NODE'}}</span>
        <h2 style="margin: 12px 0 8px;">${{nodeData.label || n.id}}</h2>
        <div style="color: #64748b; font-style: italic; margin-bottom: 12px;">${{n.category}}</div>
        
        ${{kpiSection}}
        ${{statsSection}}
        
        ${{n.notes ? `
          <div style="margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong style="color: #475569;">Notes:</strong><br>
            <div style="margin-top: 4px; color: #64748b;">${{n.notes}}</div>
          </div>
        ` : ''}}
        
        ${{renderCitations('📚 Supporting Evidence', n.citations)}}
      `;
    }});

    cy.on('tap', 'edge', evt => {{
      const e = evt.target.data();
      
      // Calculate effect size description
      const effectSize = e.weight > 0.7 ? 'Strong' : 
                         e.weight > 0.4 ? 'Moderate' : 'Weak';
      
      // Build relationship type explanation
      const relationExplanation = {{
        'causal': '🔗 Direct cause-and-effect relationship',
        'associational': '📊 Statistical correlation (not necessarily causal)',
        'feedback': '🔄 Bidirectional feedback loop'
      }}[e.relation] || '❓ Unknown relationship type';
      
      document.getElementById('info').innerHTML = `
        <span class="pill" style="background: #f1f5f9;">${{e.relation?.toUpperCase() || 'EDGE'}}</span>
        <h2 style="margin: 12px 0 8px;">${{e.source}} → ${{e.target}}</h2>
        
        <div style="margin: 12px 0; padding: 12px; background: #f0f9ff; border-radius: 8px; border-left: 3px solid #3b82f6;">
          <div style="margin-bottom: 8px;">${{relationExplanation}}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px;">
            <div>
              <strong>Direction:</strong><br>
              <span style="color: ${{e.sign === '+' ? '#059669' : '#dc2626'}};">
                ${{e.sign === '+' ? '➕ Positive/Increases' : '➖ Negative/Decreases'}}
              </span>
            </div>
            <div>
              <strong>Effect Size:</strong><br>
              <span style="color: #1e40af;">${{effectSize}} (${{(e.weight||0).toFixed(2)}})</span>
            </div>
            <div>
              <strong>Confidence:</strong><br>
              <span style="color: ${{
                e.confidence === 'High' ? '#059669' :
                e.confidence === 'Medium' ? '#d97706' : '#dc2626'
              }};">${{e.confidence || 'Unknown'}}</span>
            </div>
            <div>
              <strong>Evidence Type:</strong><br>
              <span>${{e.relation}}</span>
            </div>
          </div>
        </div>
        
        ${{e.notes ? `
          <div style="margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong style="color: #475569;">Additional Notes:</strong><br>
            <div style="margin-top: 4px; color: #64748b;">${{e.notes}}</div>
          </div>
        ` : ''}}
        
        ${{renderCitations('📚 Supporting Evidence', e.citations || e.supporting_evidence)}}
      `;
    }});
  </script>
</body>
</html>'''
        
        # Format the template with actual data
        meta = graph_json.get('meta', {})
        formatted_html = html_template.format(
            title=meta.get('focus_issue', 'Analysis'),
            focus=meta.get('focus_issue', ''),
            geography=meta.get('geography', ''),
            time_range=meta.get('time_range', ''),
            graph_json=json.dumps(graph_json)
        )
        
        return formatted_html
    
    def _create_fallback_json(self) -> Dict:
        """Create minimal fallback JSON structure."""
        return {
            "meta": {
                "focus_issue": "Analysis",
                "geography": "Dubai, UAE",
                "time_range": "2015–present",
                "generated_at": datetime.now().isoformat(),
                "legend": {
                    "colors": {
                        "driver": "#60a5fa",
                        "mediator": "#fbbf24",
                        "status_quo": "#94a3b8",
                        "implication": "#c084fc",
                        "intervention": "#34d399",
                        "negative": "#ef4444",
                        "positive": "#10b981"
                    }
                }
            },
            "nodes": [],
            "edges": []
        }
    
    def _save_outputs(self, timestamp: str, outputs: Dict[str, str]) -> Dict[str, str]:
        """Save all outputs to files."""
        paths = {}
        
        for output_type, content in outputs.items():
            if output_type == 'graph_json':
                filename = f"graph_data_{timestamp}.json"
            elif output_type == 'csv_data':
                filename = f"graph_tables_{timestamp}.csv"
            elif output_type == 'executive_summary':
                filename = f"executive_summary_{timestamp}.md"
            elif output_type == 'interactive_html':
                filename = f"graph_interactive_{timestamp}.html"
            elif output_type == 'citations':
                filename = f"citations_{timestamp}.json"
            else:
                filename = f"{output_type}_{timestamp}.txt"
            
            file_path = self.output_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            paths[output_type] = str(file_path)
        
        return paths
