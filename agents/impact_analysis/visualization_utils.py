"""
HTML Visualization Utilities for Dynamic Systems Modeler
Monument Valley-inspired calm, zen aesthetic with taxonomy-based colors
"""

import json
from typing import Dict, List, Tuple
from datetime import datetime
from collections import Counter

def generate_html_visualization(graph_json: Dict, query_id: str = "", api_base_url: str = "") -> str:
    """Generate interactive HTML visualization for DSM graph data with 4-color type-based system."""

    # Get type counts for legend
    type_counts = _build_type_color_map(graph_json)

    # Generate legend panel HTML
    legend_html = _generate_legend_panel(type_counts)

    # No need to assign taxonomy_color anymore - will use type-based colors in JavaScript

    html_template = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Dynamic Systems Model - {title}</title>
  <script src="https://unpkg.com/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
  <style>
    * {{ letter-spacing: -0.02em; }} /* Zen typography */

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif;
      margin: 0;
      display: flex;
      height: 100vh;
      background: #F5F0E8; /* Monument Valley sand background */
      position: relative;
    }}

    #cy {{
      flex: 1;
      background: #F5F0E8; /* Off-white canvas */
      position: relative;
    }}

    #panel {{
      width: 420px;
      border-left: 1px solid #E5DFD5;
      padding: 32px 28px;
      overflow-y: auto;
      background: #FAFAFA; /* Near white panel */
      box-shadow: -2px 0 12px rgba(0,0,0,0.04);
      transition: transform 0.3s cubic-bezier(0.2, 0.6, 0.2, 1);
    }}

    #panel.hidden {{ transform: translateX(100%); }}

    .controls {{
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    }}

    .btn {{
      padding: 10px 18px;
      background: white;
      border: 1px solid #E5DFD5;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #4A4A4A; /* Monument stone */
      transition: all 0.28s cubic-bezier(0.2, 0.6, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    .btn:hover {{
      background: #7FC4B3; /* Monument mint on hover */
      color: white;
      border-color: #7FC4B3;
      box-shadow: 0 2px 8px rgba(127, 196, 179, 0.25);
      transform: translateY(-1px);
    }}

    .btn:active {{ transform: translateY(0px); }}
    .btn-icon {{ font-size: 16px; }}

    body.fullscreen #cy {{ position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; }}
    body.fullscreen #panel {{ position: fixed; top: 0; right: 0; bottom: 0; z-index: 10000; }}

    /* Typography - Monument Valley zen style */
    h2 {{
      color: #4A4A4A; /* Monument stone */
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 6px 0;
      line-height: 1.4;
    }}

    h3 {{
      color: #525252;
      font-size: 14px;
      font-weight: 600;
      margin: 24px 0 12px;
      line-height: 1.4;
    }}

    .meta-info {{
      background: #A32020; /* Strategy& maroon */
      color: white;
      padding: 28px 24px;
      border-radius: 0;
      margin-bottom: 0;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }}

    .meta-info h2 {{
      color: #F5F3EE;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.02em;
    }}

    .meta-subtitle {{
      color: rgba(245,243,238,0.85);
      font-size: 12px;
      line-height: 1.7;
      font-weight: 400;
    }}

    .meta-subtitle strong {{
      color: #F5F3EE;
      font-weight: 600;
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
    }}

    .legend-section {{
      padding: 24px;
      background: white;
      border-bottom: 1px solid #E5DFD5;
    }}

    .legend-section h3 {{
      color: #333333;
      font-size: 13px;
      font-weight: 600;
      margin: 24px 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .legend-section h3:first-child {{
      margin-top: 0;
    }}

    .legend-list {{
      margin: 0;
      padding: 0;
    }}

    .legend-item {{
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
      padding: 10px;
      background: #FAFAFA;
      border-radius: 8px;
      transition: all 0.2s ease;
    }}

    .legend-item:hover {{
      background: #F0F0F0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }}

    .legend-color-box {{
      min-width: 24px;
      height: 24px;
      border-radius: 6px;
      margin-top: 2px;
      border: 2px solid rgba(255,255,255,0.9);
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }}

    .legend-content {{
      flex: 1;
    }}

    .legend-header {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }}

    .legend-header strong {{
      color: #333333;
      font-size: 12px;
    }}

    .legend-count {{
      color: #737373;
      font-size: 11px;
      font-weight: 500;
      background: #E5E5E5;
      padding: 2px 8px;
      border-radius: 10px;
    }}

    .legend-description {{
      color: #666666;
      font-size: 11px;
      line-height: 1.5;
    }}

    .legend-tips {{
      margin-top: 12px;
    }}

    .legend-tip {{
      padding: 10px;
      background: #F0F9FF;
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 11px;
      line-height: 1.5;
      color: #525252;
      border-left: 3px solid #3B82F6;
    }}

    .legend-tip:last-child {{
      margin-bottom: 0;
    }}

    .legend-tip strong {{
      color: #1E3A8A;
    }}

    .visual-guide {{
      padding: 24px;
      background: #F5F3EE;
      border-bottom: 1px solid #E5DFD5;
    }}

    .visual-guide h3 {{
      margin: 0 0 16px 0;
      font-size: 13px;
      font-weight: 600;
      color: #333333;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .guide-item {{
      color: #525252;
      font-size: 11px;
      line-height: 2;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }}

    .guide-item:last-child {{
      margin-bottom: 0;
    }}

    .guide-dot {{
      width: 5px;
      height: 5px;
      background: #A32020;
      border-radius: 50%;
      flex-shrink: 0;
    }}

    /* Node detail panel */
    #info {{
      margin-top: 28px;
      animation: fadeIn 0.28s ease-out;
    }}

    .pill {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }}

    .citation {{
      background: white;
      padding: 14px;
      border-radius: 8px;
      margin: 10px 0;
      border-left: 3px solid #7FC4B3;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }}

    .citation strong {{ color: #4A4A4A; }}
    .citation a {{ color: #7FC4B3; text-decoration: none; font-weight: 500; }}
    .citation a:hover {{ text-decoration: underline; }}

    blockquote {{
      margin: 8px 0;
      padding-left: 14px;
      border-left: 2px solid #E5DFD5;
      color: #737373;
      font-size: 12px;
      font-style: italic;
    }}

    .kpi-box {{
      background: #F0F9FF;
      padding: 14px;
      border-radius: 8px;
      margin: 14px 0;
      border-left: 3px solid #A8D4FF;
    }}

    .metric-value {{
      font-size: 22px;
      font-weight: 600;
      color: #4A4A4A;
      margin: 4px 0;
    }}

    .node-stats {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 14px 0;
    }}

    .stat-item {{
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #E5DFD5;
    }}

    .stat-label {{
      font-size: 10px;
      color: #737373;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.03em;
    }}

    .stat-value {{
      font-size: 18px;
      font-weight: 600;
      color: #4A4A4A;
      margin-top: 4px;
    }}

    @keyframes fadeIn {{
      from {{ opacity: 0; transform: translateY(4px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}
  </style>
</head>
<body>
  <div id="cy">
    <div class="controls">
      <button class="btn" onclick="toggleFullscreen()" title="Maximize graph">
        <span class="btn-icon" id="fullscreen-icon">⛶</span>
        <span id="fullscreen-text">Maximize</span>
      </button>
      <button class="btn" onclick="togglePanel()" title="Hide/Show panel">
        <span class="btn-icon" id="panel-icon">◧</span>
        <span id="panel-text">Hide Panel</span>
      </button>
      <button class="btn" onclick="exportImage()" title="Download as PNG">
        <span class="btn-icon">⬳</span>
        <span>Export PNG</span>
      </button>
    </div>
  </div>
  <aside id="panel">
    <div class="meta-info">
      <h2>System Analysis</h2>
      <div class="meta-subtitle">
        <strong>{focus}</strong>
        <div style="opacity: 0.85;">{node_count} nodes • {edge_count} edges • {taxonomy_count} node types</div>
      </div>
    </div>

    {taxonomy_section}

    <div class="visual-guide">
      <h3>Visual Guide</h3>
      <div class="guide-item"><div class="guide-dot"></div> Thicker edges = stronger relationships</div>
      <div class="guide-item"><div class="guide-dot"></div> Node size = importance (severity 1-5)</div>
      <div class="guide-item"><div class="guide-dot"></div> Dotted lines = feedback loops</div>
      <div class="guide-item"><div class="guide-dot"></div> Click any node for detailed insights</div>
    </div>

    <div id="info" style="padding: 24px; color: #737373; font-size: 12px; text-align: center; background: white;">
      Select a node or edge to view details
    </div>
  </aside>

  <script>
    const GRAPH_DATA = {graph_json};
    window.QUERY_ID = '{query_id}';
    window.API_BASE_URL = '{api_base_url}';

    // 4-color type-based system (pastel palette with dark text)
    const colorByType = {{
      driver: '#F4C2C2',        // Muted Rose - Root causes & urgent factors
      status_quo: '#C2D4F4',    // Muted Sky Blue - Current state & facts
      implication: '#E6D2E6',   // Muted Lavender - Future consequences
      mediator: '#D0E8D8',      // Muted Sage - Interventions & actions
      intervention: '#D0E8D8'   // Same as mediator
    }};

    function getNodeLabel(node) {{
      let label = node.label || node.id;
      // No emoji indicators - clean professional labels
      return label;
    }}

    const elements = {{
      nodes: GRAPH_DATA.nodes
        .filter(n => n.type !== 'category')  // Filter out parent nodes
        .map(n => ({{
          data: {{
            id: n.id,
            label: getNodeLabel(n),
            type: n.type,
            parent_category: n.parent_category,
            kpi: n.kpi,
            citations: n.citations,
            severity: n.severity_1to5,
            notes: n.notes
          }}
        }})),
      edges: GRAPH_DATA.edges
        .filter(e => e.relation !== 'categorical')  // Filter out parent-child categorical edges
        .map(e => ({{
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
        idealEdgeLength: 120,
        nodeRepulsion: 8000,
        nodeOverlap: 20,
        numIter: 2000,
        edgeElasticity: 200,
        nestingFactor: 5,
        gravity: 0.3,
        animate: true,
        animationDuration: 1500,
        animationEasing: 'ease-out',
        padding: 40,
        componentSpacing: 100,
        initialEnergyOnIncremental: 0.3
      }},
      style: [
        {{
          selector: 'node',
          style: {{
            'background-color': ele => colorByType[ele.data('type')] || '#94a3b8',
            'label': 'data(label)',
            'font-size': 11,
            'font-weight': 600,
            'color': '#1A1A1A',  /* Dark text on pastel background */
            'text-wrap': 'wrap',
            'text-max-width': 140,
            'text-valign': 'center',
            'text-halign': 'center',
            'width': ele => {{
              const base = 65;
              const severity = ele.data('severity') || 1;
              return base + (severity * 14);
            }},
            'height': ele => {{
              const base = 55;
              const severity = ele.data('severity') || 1;
              return base + (severity * 12);
            }},
            'padding': 10,
            'border-width': 3,
            'border-color': '#8A8A8A',  /* Darker border for better contrast */
            'border-opacity': 0.6,
            'shape': 'roundrectangle'
          }}
        }},
        {{
          selector: 'edge',
          style: {{
            'width': ele => {{
              const weight = ele.data('weight') || 0.2;
              return Math.max(1.5, 1.5 + 8.5 * weight);
            }},
            'line-color': ele => ele.data('sign') === '-' ? '#FF8A80' : '#81C784', /* Pastel coral negative / Soft green positive */
            'target-arrow-color': ele => ele.data('sign') === '-' ? '#FF8A80' : '#81C784',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'line-style': ele => {{
              if (ele.data('relation') === 'feedback') return 'dotted';
              if (ele.data('relation') === 'associational') return 'dashed';
              return 'solid';
            }},
            'opacity': 0.7,
            'arrow-scale': 1.3
          }}
        }},
        {{
          selector: 'node:selected',
          style: {{
            'border-width': 4,
            'border-color': '#3B82F6', /* Blue highlight */
            'overlay-color': '#3B82F6',
            'overlay-opacity': 0.2,
            'overlay-padding': 12
          }}
        }}
      ]
    }});

    function renderCitations(title, items=[]) {{
      if (!items || !items.length) return `<p style="color: #737373; font-size: 13px; text-align: center;">No citations available</p>`;
      return `
        <h3>${{title}}</h3>
        ${{items.slice(0,3).map(c => {{
          let link = '';
          let linkText = '';

          if (c.doi && c.doi !== '') {{
            if (c.doi.startsWith('http')) {{
              link = c.doi;
              linkText = c.doi;
            }} else if (c.doi.startsWith('10.')) {{
              link = 'https://doi.org/' + c.doi;
              linkText = 'DOI: ' + c.doi;
            }} else {{
              link = c.doi;
              linkText = c.doi;
            }}
          }} else if (c.url && c.url !== '') {{
            link = c.url;
            if (!link.startsWith('http')) {{
              link = 'https://' + link;
            }}
            linkText = c.url.length > 50 ? c.url.substring(0, 50) + '...' : c.url;
          }}

          return `
            <div class="citation">
              <div><strong>${{c.title || 'Untitled'}}</strong></div>
              <div style="color: #737373; font-size: 12px; margin: 6px 0;">${{c.publisher||''}} • ${{c.year||''}}</div>
              ${{link ? `<div><a href="${{link}}" target="_blank">${{linkText}}</a></div>` : '<div style="color: #94a3b8; font-size: 12px;">No link available</div>'}}
              ${{c.key_quote ? `<blockquote>${{c.key_quote}}</blockquote>` : ''}}
            </div>
          `;
        }}).join('')}}
      `;
    }}

    // Load node analyses at page load
    window.NODE_ANALYSES_CACHE = null;

    async function loadAllNodeAnalyses() {{
      try {{
        const queryId = window.QUERY_ID || '';
        if (!queryId) {{
          console.warn('No QUERY_ID available, skipping node analyses load');
          return;
        }}

        // Use API_BASE_URL if available (production), otherwise use relative path (dev)
        const baseUrl = window.API_BASE_URL || '';
        const response = await fetch(`${{baseUrl}}/api/dsm/content/${{queryId}}/node_analyses`);

        if (!response.ok) {{
          console.warn(`Failed to fetch node analyses: ${{response.statusText}}`);
          return;
        }}

        const responseData = await response.json();
        window.NODE_ANALYSES_CACHE = JSON.parse(responseData.content);
        console.log(`✅ Loaded ${{Object.keys(window.NODE_ANALYSES_CACHE).length}} node analyses`);
      }} catch (error) {{
        console.error('Failed to load node analyses:', error);
      }}
    }}

    // Load analyses when page loads
    loadAllNodeAnalyses();

    function renderAnalysis(analysis) {{
      if (!analysis) return '';

      return `
        <div style="margin: 16px 0; padding: 16px; background: linear-gradient(135deg, #F0F9FF 0%, #FAF5FF 100%); border-radius: 10px; border: 2px solid #E0E7FF;">
          <h3 style="margin: 0 0 12px 0; color: #3730A3; font-size: 14px; display: flex; align-items: center; gap: 6px;">
            🔍 Deep Dive Analysis
          </h3>

          <div style="margin-bottom: 14px;">
            <h4 style="color: #4338CA; margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Overview</h4>
            <p style="color: #4B5563; font-size: 12px; line-height: 1.7; margin: 0;">${{analysis.overview || 'No overview available.'}}</p>
          </div>

          ${{analysis.connections && analysis.connections.length > 0 ? `
            <div style="margin-bottom: 14px;">
              <h4 style="color: #4338CA; margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Connection Analysis (${{analysis.connections.length}})</h4>
              ${{analysis.connections.map(conn => `
                <details style="margin-bottom: 6px; background: white; padding: 10px; border-radius: 6px; border: 1px solid #E0E7FF; cursor: pointer;">
                  <summary style="font-weight: 600; font-size: 11px; color: #525252; user-select: none; list-style-position: outside;">
                    ${{conn.direction === 'incoming' ? '⬅️' : '➡️'}} ${{conn.source}} → ${{conn.target}}
                  </summary>
                  <div style="margin-top: 8px; color: #6B7280; font-size: 11px; line-height: 1.6; padding-left: 4px;">
                    <p style="margin: 4px 0;"><strong>Why:</strong> ${{conn.explanation || 'N/A'}}</p>
                    <p style="margin: 4px 0;"><strong>Evidence:</strong> ${{conn.evidence_summary || 'N/A'}}</p>
                    <p style="margin: 4px 0;"><strong>Weight:</strong> ${{conn.weight_justification || 'N/A'}}</p>
                    <p style="margin: 4px 0;"><strong>Effect:</strong> ${{conn.sign_explanation || 'N/A'}}</p>
                  </div>
                </details>
              `).join('')}}
            </div>
          ` : ''}}

          <div style="margin-bottom: 14px;">
            <h4 style="color: #4338CA; margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Severity Calculation</h4>
            <p style="color: #4B5563; font-size: 12px; line-height: 1.7; margin: 0;">${{analysis.severity_explanation || 'No severity explanation available.'}}</p>
          </div>

          ${{analysis.strategic_implications && analysis.strategic_implications.length > 0 ? `
            <div>
              <h4 style="color: #4338CA; margin: 0 0 6px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Strategic Implications</h4>
              <ul style="margin: 0; padding-left: 20px; color: #4B5563; font-size: 12px; line-height: 1.7;">
                ${{analysis.strategic_implications.map(imp => `<li style="margin: 4px 0;">${{imp}}</li>`).join('')}}
              </ul>
            </div>
          ` : ''}}

        </div>
      `;
    }}

    cy.on('tap', 'node', evt => {{
      const n = evt.target.data();
      const nodeData = GRAPH_DATA.nodes.find(node => node.id === n.id) || {{}};

      // Get parent category information
      const parentName = n.parent_category;
      const parentNode = GRAPH_DATA.nodes.find(node =>
        node.type === 'category' && node.label === parentName
      );

      // Type display names and colors
      const typeLabels = {{
        driver: 'DRIVER',
        status_quo: 'STATUS QUO',
        implication: 'IMPLICATION',
        mediator: 'MEDIATOR',
        intervention: 'INTERVENTION'
      }};

      let kpiSection = '';
      if (n.kpi) {{
        kpiSection = `
          <div class="kpi-box">
            <h4 style="margin: 0 0 8px 0; color: #525252; font-size: 13px;">📊 Key Performance Indicator</h4>
            <div class="metric-value">
              ${{n.kpi.current_value !== null && n.kpi.current_value !== undefined ?
                n.kpi.current_value + (n.kpi.unit || '') : 'Not quantified'}}
            </div>
            <div style="margin-top: 8px; color: #737373; font-size: 12px; line-height: 1.6;">
              <strong>Indicator:</strong> ${{n.kpi.name || 'N/A'}}<br>
              ${{n.kpi.year ? `<strong>Year:</strong> ${{n.kpi.year}}<br>` : ''}}
              ${{n.kpi.trend ? `<strong>Trend:</strong> ${{
                n.kpi.trend === 'up' ? 'Increasing' :
                n.kpi.trend === 'down' ? 'Decreasing' :
                'Stable'
              }}<br>` : ''}}
            </div>
          </div>
        `;
      }}

      // Parent Category Section with AI Summary
      let parentSection = '';
      if (parentNode && parentNode.category_summary) {{
        parentSection = `
          <div style="margin: 16px 0; padding: 16px; background: linear-gradient(135deg, #F0F9FF 0%, #FAF5FF 100%); border-radius: 10px; border: 2px solid #E0E7FF;">
            <h3 style="margin: 0 0 10px 0; color: #3730A3; font-size: 14px; display: flex; align-items: center; gap: 6px;">
              📁 Parent Category: <span style="color: #6366F1;">${{parentName}}</span>
            </h3>
            <div style="color: #4B5563; font-size: 12px; line-height: 1.7; max-height: 200px; overflow-y: auto;">
              ${{parentNode.category_summary}}
            </div>
          </div>
        `;
      }} else if (parentName) {{
        parentSection = `
          <div style="margin: 16px 0; padding: 12px; background: #F3F4F6; border-radius: 8px; border-left: 3px solid #9CA3AF;">
            <div style="color: #6B7280; font-size: 12px;">
              <strong>Parent Category:</strong> ${{parentName}}
            </div>
          </div>
        `;
      }}

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
            <div class="stat-label">Influenced By</div>
            <div class="stat-value">${{incomingEdges.length}}</div>
          </div>
        </div>
      `;

      document.getElementById('info').innerHTML = `
        <span class="pill" style="background: ${{colorByType[n.type] || '#94a3b8'}}; color: white; font-weight: 600;">
          ${{typeLabels[n.type] || 'UNKNOWN'}}
        </span>
        <h2 style="margin: 12px 0 8px;">${{nodeData.label || n.id}}</h2>

        ${{parentSection}}
        ${{kpiSection}}
        ${{statsSection}}

        ${{n.notes ? `
          <div style="margin: 16px 0; padding: 14px; background: white; border-radius: 8px; border: 1px solid #E5DFD5;">
            <strong style="color: #525252; font-size: 13px;">Notes:</strong><br>
            <div style="margin-top: 8px; color: #737373; font-size: 12px; line-height: 1.6;">${{n.notes}}</div>
          </div>
        ` : ''}}

        ${{renderCitations('📚 Supporting Evidence', n.citations)}}

        ${{(() => {{
          // Get node analysis if available
          if (window.NODE_ANALYSES_CACHE && window.NODE_ANALYSES_CACHE[n.id]) {{
            return renderAnalysis(window.NODE_ANALYSES_CACHE[n.id]);
          }} else {{
            return `
              <div style="margin: 16px 0; padding: 12px; background: #FEF3C7; border-radius: 8px; border-left: 3px solid #F59E0B;">
                <div style="color: #92400E; font-size: 12px; line-height: 1.6;">
                  <strong>🔍 Deep Dive Analysis</strong><br>
                  <span style="color: #78350F;">Loading analysis...</span>
                </div>
              </div>
            `;
          }}
        }})()}}
      `;
    }});

    cy.on('tap', 'edge', evt => {{
      const e = evt.target.data();

      const effectSize = e.weight > 0.7 ? 'Strong' :
                         e.weight > 0.4 ? 'Moderate' : 'Weak';

      const relationExplanation = {{
        'causal': '🔗 Direct cause-and-effect relationship',
        'associational': '📊 Statistical correlation (not necessarily causal)',
        'feedback': '🔄 Bidirectional feedback loop'
      }}[e.relation] || '❓ Unknown relationship type';

      document.getElementById('info').innerHTML = `
        <span class="pill" style="background: #F5F3EE; color: #525252;">${{e.relation?.toUpperCase() || 'EDGE'}}</span>
        <h2 style="margin: 12px 0 8px;">${{e.source}} → ${{e.target}}</h2>

        <div style="margin: 14px 0; padding: 14px; background: #F0F9FF; border-radius: 8px; border-left: 3px solid #A8D4FF;">
          <div style="margin-bottom: 10px; color: #525252; font-size: 13px;">${{relationExplanation}}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
            <div>
              <strong style="color: #4A4A4A; font-size: 12px;">Direction:</strong><br>
              <span style="color: ${{e.sign === '+' ? '#7FC4B3' : '#FFB893'}}; font-size: 13px; font-weight: 500;">
                ${{e.sign === '+' ? '➕ Positive' : '➖ Negative'}}
              </span>
            </div>
            <div>
              <strong style="color: #4A4A4A; font-size: 12px;">Effect Size:</strong><br>
              <span style="color: #525252; font-size: 13px; font-weight: 500;">${{effectSize}} (${{(e.weight||0).toFixed(2)}})</span>
            </div>
            <div>
              <strong style="color: #4A4A4A; font-size: 12px;">Confidence:</strong><br>
              <span style="color: ${{
                e.confidence === 'High' ? '#7FC4B3' :
                e.confidence === 'Medium' ? '#FFD8A5' : '#FFB893'
              }}; font-size: 13px; font-weight: 500;">${{e.confidence || 'Unknown'}}</span>
            </div>
            <div>
              <strong style="color: #4A4A4A; font-size: 12px;">Type:</strong><br>
              <span style="color: #525252; font-size: 13px;">${{e.relation}}</span>
            </div>
          </div>
        </div>

        ${{e.notes ? `
          <div style="margin: 16px 0; padding: 14px; background: white; border-radius: 8px; border: 1px solid #E5DFD5;">
            <strong style="color: #525252; font-size: 13px;">Additional Notes:</strong><br>
            <div style="margin-top: 8px; color: #737373; font-size: 12px; line-height: 1.6;">${{e.notes}}</div>
          </div>
        ` : ''}}

        ${{renderCitations('📚 Supporting Evidence', e.citations || e.supporting_evidence)}}
      `;
    }});

    function toggleFullscreen() {{
      const isFullscreen = document.body.classList.toggle('fullscreen');
      const icon = document.getElementById('fullscreen-icon');
      const text = document.getElementById('fullscreen-text');

      if (isFullscreen) {{
        icon.innerHTML = '⛋';
        text.textContent = 'Exit';
      }} else {{
        icon.innerHTML = '⛶';
        text.textContent = 'Maximize';
      }}

      setTimeout(() => cy.resize(), 100);
    }}

    function togglePanel() {{
      const panel = document.getElementById('panel');
      const isPanelHidden = panel.classList.toggle('hidden');
      const icon = document.getElementById('panel-icon');
      const text = document.getElementById('panel-text');

      if (isPanelHidden) {{
        icon.innerHTML = '◨';
        text.textContent = 'Show';
      }} else {{
        icon.innerHTML = '◧';
        text.textContent = 'Hide';
      }}

      setTimeout(() => cy.resize(), 350);
    }}

    function exportImage() {{
      const png64 = cy.png({{
        output: 'blob',
        bg: '#F5F0E8',
        full: true,
        scale: 3
      }});

      const url = URL.createObjectURL(png64);
      const link = document.createElement('a');
      link.download = 'dsm-graph-{{Date.now()}}.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }}
  </script>
</body>
</html>'''

    # Format the template
    meta = graph_json.get('meta', {})
    # Count only child nodes (exclude parent category nodes)
    child_nodes = [n for n in graph_json.get('nodes', []) if n.get('type') != 'category']
    # Count only non-categorical edges
    real_edges = [e for e in graph_json.get('edges', []) if e.get('relation') != 'categorical']

    formatted_html = html_template.format(
        title=meta.get('main_query', 'Dynamic Systems Model'),
        focus=meta.get('main_query', 'Dynamic Systems Model'),
        node_count=len(child_nodes),
        edge_count=len(real_edges),
        taxonomy_count=len(type_counts),
        taxonomy_section=legend_html,
        graph_json=json.dumps(graph_json),
        query_id=query_id
    )

    return formatted_html


def _build_type_color_map(graph_json: Dict) -> Dict[str, int]:
    """
    Build type-based statistics for the 4-color node type system.

    Returns:
        Dict of {node_type: count} for legend display
    """
    # Count nodes per type (exclude parent category nodes)
    node_types = [node.get('type', 'unknown')
                  for node in graph_json.get('nodes', [])
                  if node.get('type') != 'category']
    type_counts = dict(Counter(node_types))

    return type_counts


def _build_parent_category_colors(graph_json: Dict) -> Tuple[Dict[str, int], Dict[str, str]]:
    """
    Build color mapping for parent categories (used by hierarchical view only).

    Returns:
        Tuple of (taxonomy_map, color_assignments)
    """
    # Count nodes per parent category
    parent_categories = [node.get('parent_category', 'Unknown')
                        for node in graph_json.get('nodes', [])
                        if node.get('parent_category') is not None]
    taxonomy_map = dict(Counter(parent_categories))

    # Pastel color palette for hierarchical view parents
    base_colors = [
        '#F4C2C2',  # Muted Rose
        '#FFDFBA',  # Pastel Peach
        '#FFFFBA',  # Pastel Yellow
        '#D0E8D8',  # Muted Sage
        '#C2D4F4',  # Muted Sky Blue
        '#E6D2E6',  # Muted Lavender
        '#FEC8D8',  # Pastel Rose
        '#D4F1F4',  # Pastel Cyan
        '#FFE5D9',  # Pastel Apricot
        '#C9E4DE',  # Pastel Sage
    ]

    # Assign colors to parent categories
    sorted_parents = sorted(taxonomy_map.keys())
    color_assignments = {
        parent: base_colors[i % len(base_colors)]
        for i, parent in enumerate(sorted_parents)
    }

    return taxonomy_map, color_assignments


def _generate_legend_panel(type_counts: Dict[str, int]) -> str:
    """
    Generate HTML for 4-color type-based legend panel.
    Inspired by System Compass but with more detail for DSM complexity.
    """

    # Define the 4-color system with descriptions (pastel palette)
    type_definitions = {
        'driver': {
            'color': '#F4C2C2',
            'label': 'Driver',
            'description': 'Root causes and contributing factors that initiate systemic changes'
        },
        'status_quo': {
            'color': '#C2D4F4',
            'label': 'Status Quo',
            'description': 'Current state indicators and existing system conditions'
        },
        'implication': {
            'color': '#E6D2E6',
            'label': 'Implication',
            'description': 'Future consequences and downstream effects of system changes'
        },
        'mediator': {
            'color': '#D0E8D8',
            'label': 'Mediator',
            'description': 'Intermediate pathways and policy intervention points'
        },
        'intervention': {
            'color': '#D0E8D8',
            'label': 'Intervention',
            'description': 'Policy actions and strategic intervention opportunities'
        }
    }

    legend_html = '''
<div class="legend-section">
  <h3>Node Types</h3>
  <div class="legend-list">
'''

    # Show node types with counts
    for node_type in ['driver', 'status_quo', 'implication', 'mediator']:
        if node_type in type_definitions:
            type_def = type_definitions[node_type]
            count = type_counts.get(node_type, 0) + (type_counts.get('intervention', 0) if node_type == 'mediator' else 0)
            legend_html += f'''
    <div class="legend-item">
      <div class="legend-color-box" style="background-color: {type_def['color']};"></div>
      <div class="legend-content">
        <div class="legend-header">
          <strong>{type_def['label']}</strong>
          <span class="legend-count">({count})</span>
        </div>
        <div class="legend-description">{type_def['description']}</div>
      </div>
    </div>
'''

    legend_html += '''
  </div>

  <h3>Edge Types</h3>
  <div class="legend-list">
    <div class="legend-item">
      <div class="legend-color-box" style="background-color: #81C784;"></div>
      <div class="legend-content">
        <strong>Positive Relationship</strong>
        <div class="legend-description">Increase in source leads to increase in target</div>
      </div>
    </div>
    <div class="legend-item">
      <div class="legend-color-box" style="background-color: #FF8A80;"></div>
      <div class="legend-content">
        <strong>Negative Relationship</strong>
        <div class="legend-description">Increase in source leads to decrease in target</div>
      </div>
    </div>
  </div>

  <h3>Relationship Types</h3>
  <div class="legend-list">
    <div class="legend-item">
      <div style="width: 30px; height: 2px; background: #64748B; margin-right: 8px;"></div>
      <div class="legend-content">
        <strong>Causal</strong> - Direct cause-effect relationship
      </div>
    </div>
    <div class="legend-item">
      <div style="width: 30px; height: 2px; background: #64748B; margin-right: 8px; border-top: 2px dashed #64748B; background: none;"></div>
      <div class="legend-content">
        <strong>Associational</strong> - Correlated but not necessarily causal
      </div>
    </div>
    <div class="legend-item">
      <div style="width: 30px; height: 2px; background: #64748B; margin-right: 8px; border-top: 2px dotted #64748B; background: none;"></div>
      <div class="legend-content">
        <strong>Feedback</strong> - Bidirectional or reinforcing loop
      </div>
    </div>
  </div>

  <h3>Visual Guide</h3>
  <div class="legend-tips">
    <div class="legend-tip">
      <strong>Edge Thickness:</strong> Represents relationship strength (thicker = stronger connection)
    </div>
    <div class="legend-tip">
      <strong>Node Size:</strong> Scaled by severity/impact level (1-5 scale)
    </div>
    <div class="legend-tip">
      <strong>Click Node:</strong> View detailed information, KPIs, parent category, and citations
    </div>
  </div>
</div>
'''

    return legend_html


def generate_hierarchical_html_visualization(graph_json: Dict) -> str:
    """
    Generate interactive hierarchical HTML visualization with collapsible parent nodes.

    Features:
    - Initial view: 10 parent nodes with inter-parent edges
    - Click parent to expand: Shows 5 child nodes + edges to other parents
    - Executive summary panel on right side
    """

    # Extract taxonomy structure and assign colors
    taxonomy_map, color_assignments = _build_parent_category_colors(graph_json)

    # Calculate parent-to-parent edges (aggregated from child connections)
    parent_edges = _calculate_parent_edges(graph_json, color_assignments)

    # Prepare hierarchical data structure
    hierarchical_data = _prepare_hierarchical_data(graph_json, color_assignments, parent_edges)

    html_template = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Hierarchical Systems View - {title}</title>
  <script src="https://unpkg.com/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
  <style>
    * {{ letter-spacing: -0.02em; }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Helvetica, Arial, sans-serif;
      margin: 0;
      display: flex;
      height: 100vh;
      background: #F5F0E8;
      position: relative;
    }}

    #cy {{
      flex: 1;
      background: #F5F0E8;
      position: relative;
    }}

    #summary-panel {{
      width: 420px;
      border-left: 1px solid #E5DFD5;
      padding: 32px 28px;
      overflow-y: auto;
      background: #FAFAFA;
      box-shadow: -2px 0 12px rgba(0,0,0,0.04);
      transition: all 0.3s ease;
    }}

    .controls {{
      position: absolute;
      top: 20px;
      right: 440px;
      z-index: 1000;
      display: flex;
      gap: 10px;
    }}

    .btn {{
      padding: 10px 18px;
      background: white;
      border: 1px solid #E5DFD5;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #4A4A4A;
      transition: all 0.28s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }}

    .btn:hover {{
      background: #7FC4B3;
      color: white;
      border-color: #7FC4B3;
      transform: translateY(-1px);
    }}

    .summary-header {{
      background: #A32020;
      color: white;
      padding: 28px 24px;
      margin: -32px -28px 24px;
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }}

    .summary-header h2 {{
      color: #F5F3EE;
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
    }}

    .summary-header .subtitle {{
      color: rgba(245,243,238,0.85);
      font-size: 12px;
      line-height: 1.6;
    }}

    .summary-section {{
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid #E5DFD5;
    }}

    .summary-section:last-child {{
      border-bottom: none;
    }}

    .summary-section h3 {{
      color: #333333;
      font-size: 13px;
      font-weight: 600;
      margin: 0 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}

    .factor-item {{
      background: white;
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      border-left: 3px solid #7FC4B3;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }}

    .factor-name {{
      font-weight: 600;
      color: #4A4A4A;
      font-size: 13px;
      margin-bottom: 6px;
    }}

    .factor-meta {{
      color: #737373;
      font-size: 11px;
      display: flex;
      gap: 12px;
    }}

    .connection-item {{
      background: white;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid #E5DFD5;
    }}

    .connection-name {{
      font-weight: 500;
      color: #4A4A4A;
      font-size: 12px;
    }}

    .connection-badge {{
      background: #7FC4B3;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }}

    .empty-state {{
      text-align: center;
      padding: 40px 20px;
      color: #737373;
      font-size: 13px;
      line-height: 1.8;
    }}

    .empty-state-icon {{
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.3;
    }}

    .pill {{
      display: inline-block;
      padding: 6px 14px;
      border-radius: 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 12px;
    }}

    .instruction-box {{
      background: linear-gradient(135deg, #7FC4B3 0%, #A8D4FF 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.8;
      box-shadow: 0 4px 12px rgba(127, 196, 179, 0.2);
    }}

    .instruction-box strong {{
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
    }}
  </style>
</head>
<body>
  <div id="cy">
    <div class="controls">
      <button class="btn" onclick="collapseAll()" title="Collapse all nodes">
        <span>⊟</span> Collapse All
      </button>
      <button class="btn" onclick="expandAll()" title="Expand all nodes">
        <span>⊞</span> Expand All
      </button>
      <button class="btn" onclick="resetView()" title="Reset layout">
        <span>⟲</span> Reset Layout
      </button>
    </div>
  </div>

  <aside id="summary-panel">
    <div class="summary-header">
      <h2>System Overview</h2>
      <div class="subtitle">{node_count} nodes • {edge_count} edges • {taxonomy_count} categories</div>
    </div>

    <div class="instruction-box">
      <strong>Interactive Hierarchical View</strong>
      Click any parent node (large circles) to expand and view its child factors. The executive summary will update to show detailed insights.
    </div>

    <div id="summary-content">
      <div class="empty-state">
        <div class="empty-state-icon">○</div>
        <div>Click a parent node to explore its factors and connections</div>
      </div>
    </div>
  </aside>

  <script>
    const HIERARCHICAL_DATA = {hierarchical_data};
    const COLOR_MAP = {color_map};

    let expandedNodes = new Set();

    // Initialize with only parent nodes
    const initialElements = {{
      nodes: HIERARCHICAL_DATA.parent_nodes.map(p => ({{
        data: {{
          id: p.id,
          label: p.label,
          color: p.color,
          type: 'parent',
          parent_name: p.label,
          child_count: p.child_count,
          expanded: false
        }}
      }})),
      edges: HIERARCHICAL_DATA.parent_edges.map(e => ({{
        data: {{
          id: e.id,
          source: e.source,
          target: e.target,
          weight: e.weight,
          edge_count: e.edge_count,
          type: 'parent-to-parent'
        }}
      }}))
    }};

    const cy = cytoscape({{
      container: document.getElementById('cy'),
      elements: initialElements,
      layout: {{
        name: 'circle',
        radius: 560,
        padding: 80,
        animate: true,
        animationDuration: 800,
        animationEasing: 'ease-out'
      }},
      style: [
        {{
          selector: 'node[type="parent"]',
          style: {{
            'background-color': 'data(color)',
            'label': 'data(label)',
            'font-size': 14,
            'font-weight': 400,
            'color': '#333333',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 110,
            'height': 110,
            'border-width': 4,
            'border-color': '#FFFFFF',
            'border-opacity': 0.9,
            'shape': 'ellipse'
          }}
        }},
        {{
          selector: 'node[type="parent"][?expanded]',
          style: {{
            'border-style': 'dashed',
            'border-width': 5,
            'border-color': '#FFD8A5'
          }}
        }},
        {{
          selector: 'node[type="child"]',
          style: {{
            'background-color': 'data(color)',
            'label': 'data(label)',
            'font-size': 9,
            'font-weight': 500,
            'color': '#4A4A4A',
            'text-wrap': 'wrap',
            'text-max-width': 80,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'text-background-color': '#FAFAFA',
            'text-background-opacity': 0.9,
            'text-background-padding': 4,
            'text-background-shape': 'roundrectangle',
            'width': 45,
            'height': 45,
            'border-width': 2,
            'border-color': '#FFFFFF',
            'opacity': 0.85,
            'shape': 'roundrectangle'
          }}
        }},
        {{
          selector: 'edge[type="parent-to-parent"]',
          style: {{
            'width': ele => Math.max(2, 2 + 8*(ele.data('weight')||0.3)),
            'line-color': '#A8D4FF',
            'target-arrow-color': '#A8D4FF',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.5,
            'arrow-scale': 1.5
          }}
        }},
        {{
          selector: 'edge[type="child-to-parent"]',
          style: {{
            'width': 2,
            'line-color': '#7FC4B3',
            'line-style': 'dashed',
            'opacity': 0.6
          }}
        }},
        {{
          selector: 'node:selected',
          style: {{
            'overlay-color': '#7FC4B3',
            'overlay-opacity': 0.2,
            'overlay-padding': 12
          }}
        }}
      ]
    }});

    cy.on('tap', 'node[type="parent"]', function(evt) {{
      const node = evt.target;
      const parentId = node.data('id');
      const parentName = node.data('parent_name');
      const isExpanded = node.data('expanded');

      if (isExpanded) {{
        // Collapse
        collapseNode(parentId);
      }} else {{
        // Expand
        expandNode(parentId, parentName);
      }}
    }});

    function expandNode(parentId, parentName) {{
      const parentData = HIERARCHICAL_DATA.parent_nodes.find(p => p.id === parentId);
      if (!parentData || !parentData.children) return;

      // Mark as expanded
      cy.getElementById(parentId).data('expanded', true);
      expandedNodes.add(parentId);

      // Get parent position
      const parentPos = cy.getElementById(parentId).position();
      const totalChildren = parentData.children.length;
      const radius = 150;

      // Add child nodes in circular arrangement
      const childNodes = parentData.children.map((child, childIndex) => {{
        const angle = (childIndex / totalChildren) * 2 * Math.PI;

        return {{
          data: {{
            id: child.id,
            label: child.label,
            color: child.color,
            type: 'child',
            parent_category: parentName,
            severity: child.severity,
            kpi: child.kpi
          }},
          position: {{
            x: parentPos.x + Math.cos(angle) * radius,
            y: parentPos.y + Math.sin(angle) * radius
          }}
        }};
      }});

      // Add edges from parent to children
      const parentToChildEdges = parentData.children.map(child => ({{
        data: {{
          id: `${{parentId}}_${{child.id}}`,
          source: parentId,
          target: child.id,
          type: 'child-to-parent'
        }}
      }}));

      // Add edges from children to other parent nodes
      const childToParentEdges = [];
      parentData.children.forEach(child => {{
        if (child.connections) {{
          child.connections.forEach(conn => {{
            childToParentEdges.push({{
              data: {{
                id: `${{child.id}}_${{conn.target_parent_id}}`,
                source: child.id,
                target: conn.target_parent_id,
                type: 'child-to-parent',
                weight: conn.weight
              }}
            }});
          }});
        }}
      }});

      cy.add([...childNodes, ...parentToChildEdges, ...childToParentEdges]);

      // Don't re-layout - keep parent nodes in their fixed positions
      // Children are already positioned in a circle around their parent
      // This prevents the entire graph from reshuffling

      // Update summary panel
      updateSummary(parentData);
    }}

    function collapseNode(parentId) {{
      const parentData = HIERARCHICAL_DATA.parent_nodes.find(p => p.id === parentId);
      if (!parentData || !parentData.children) return;

      // Mark as collapsed
      cy.getElementById(parentId).data('expanded', false);
      expandedNodes.delete(parentId);

      // Remove child nodes and their edges
      const childIds = parentData.children.map(c => c.id);
      childIds.forEach(childId => {{
        cy.getElementById(childId).remove();
      }});

      // Clear summary if this was the active node
      document.getElementById('summary-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">○</div>
          <div>Click a parent node to explore its factors and connections</div>
        </div>
      `;
    }}

    function updateSummary(parentData) {{
      const childrenHtml = parentData.children.map(child => `
        <div class="factor-item">
          <div class="factor-name">${{child.label}}</div>
          <div class="factor-meta">
            <span>Severity: ${{child.severity}}/5</span>
            ${{child.kpi ? `<span>• ${{child.kpi.current_value}}${{child.kpi.unit || ''}}</span>` : ''}}
          </div>
        </div>
      `).join('');

      // Group connections by target parent
      const connectionMap = {{}};
      parentData.children.forEach(child => {{
        if (child.connections) {{
          child.connections.forEach(conn => {{
            if (!connectionMap[conn.target_parent_name]) {{
              connectionMap[conn.target_parent_name] = 0;
            }}
            connectionMap[conn.target_parent_name]++;
          }});
        }}
      }});

      const connectionEntries = Object.entries(connectionMap).sort((a, b) => b[1] - a[1]);
      const connectionsHtml = connectionEntries.map(([name, count]) => `
        <div class="connection-item">
          <div class="connection-name">${{name}}</div>
          <div class="connection-badge">${{count}} edge${{count > 1 ? 's' : ''}}</div>
        </div>
      `).join('');

      // Generate executive summary HTML
      const summaryHtml = parentData.category_summary ? `
        <div class="summary-section" style="border-left: 3px solid ${{parentData.color}}; padding-left: 16px; margin-bottom: 24px;">
          <h3 style="color: ${{parentData.color}}; margin-bottom: 14px;">Executive Analysis</h3>
          <div style="color: #525252; font-size: 13px; line-height: 1.8; white-space: pre-line;">
            ${{parentData.category_summary}}
          </div>
        </div>
      ` : `
        <div class="summary-section">
          <p style="color: #525252; font-size: 13px; line-height: 1.7; margin: 0;">
            This category contains <strong>${{parentData.child_count}} key factors</strong> affecting the system.
          </p>
        </div>
      `;

      document.getElementById('summary-content').innerHTML = `
        <span class="pill" style="background: ${{parentData.color}}; color: white;">${{parentData.label}}</span>

        ${{summaryHtml}}

        <div class="summary-section">
          <h3>Key Factors (${{parentData.child_count}})</h3>
          ${{childrenHtml}}
        </div>

        ${{connectionEntries.length > 0 ? `
          <div class="summary-section">
            <h3>Connections to Other Categories</h3>
            ${{connectionsHtml}}
          </div>
        ` : ''}}
      `;
    }}

    function collapseAll() {{
      expandedNodes.forEach(parentId => collapseNode(parentId));
    }}

    function expandAll() {{
      HIERARCHICAL_DATA.parent_nodes.forEach(p => {{
        if (!expandedNodes.has(p.id)) {{
          expandNode(p.id, p.label);
        }}
      }});
    }}

    function resetView() {{
      cy.layout({{
        name: 'circle',
        radius: 560,
        padding: 80,
        animate: true,
        animationDuration: 800
      }}).run();
    }}
  </script>
</body>
</html>'''

    # Format the template
    meta = graph_json.get('meta', {})
    formatted_html = html_template.format(
        title=meta.get('main_query', 'Dynamic Systems Model'),
        node_count=len(graph_json.get('nodes', [])),
        edge_count=len(graph_json.get('edges', [])),
        taxonomy_count=len(taxonomy_map),
        hierarchical_data=json.dumps(hierarchical_data),
        color_map=json.dumps(color_assignments)
    )

    return formatted_html


def _calculate_parent_edges(graph_json: Dict, color_assignments: Dict[str, str]) -> List[Dict]:
    """Calculate aggregated edges between parent nodes based on child connections."""

    nodes = graph_json.get('nodes', [])
    edges = graph_json.get('edges', [])

    # Get parent nodes
    parent_nodes = [n for n in nodes if n.get('type') == 'category']
    parent_map = {p['label']: p for p in parent_nodes}

    # Group children by parent
    children_by_parent = {}
    for node in nodes:
        parent_cat = node.get('parent_category')
        if parent_cat and parent_cat in parent_map:
            if parent_cat not in children_by_parent:
                children_by_parent[parent_cat] = []
            children_by_parent[parent_cat].append(node['id'])

    # Calculate inter-parent edges
    parent_edges = []

    for parent_a_name in parent_map:
        for parent_b_name in parent_map:
            if parent_a_name == parent_b_name:
                continue

            children_a = children_by_parent.get(parent_a_name, [])
            children_b = children_by_parent.get(parent_b_name, [])

            # Count edges in BOTH directions (A→B and B→A)
            cross_edges_ab = [
                e for e in edges
                if e.get('source') in children_a and e.get('target') in children_b
                and e.get('relation') != 'categorical'  # Exclude parent-child categorical edges
            ]

            cross_edges_ba = [
                e for e in edges
                if e.get('source') in children_b and e.get('target') in children_a
                and e.get('relation') != 'categorical'
            ]

            # Combine both directions
            all_cross_edges = cross_edges_ab + cross_edges_ba

            if len(all_cross_edges) >= 1:  # Threshold: at least 1 connection in either direction
                avg_weight = sum(e.get('weight_0to1', 0.5) for e in all_cross_edges) / len(all_cross_edges)

                parent_a_id = parent_map[parent_a_name]['id']
                parent_b_id = parent_map[parent_b_name]['id']

                parent_edges.append({
                    'id': f"{parent_a_id}_{parent_b_id}",
                    'source': parent_a_id,
                    'target': parent_b_id,
                    'weight': avg_weight,
                    'edge_count': len(all_cross_edges)
                })

    return parent_edges


def _prepare_hierarchical_data(graph_json: Dict, color_assignments: Dict[str, str], parent_edges: List[Dict]) -> Dict:
    """Prepare hierarchical data structure for the visualization."""

    nodes = graph_json.get('nodes', [])
    edges = graph_json.get('edges', [])

    # Get parent nodes
    parent_nodes = [n for n in nodes if n.get('type') == 'category']
    parent_map = {p['label']: p for p in parent_nodes}

    # Build hierarchical structure
    hierarchical_parents = []

    for parent in parent_nodes:
        parent_name = parent['label']
        parent_color = color_assignments.get(parent_name, '#94a3b8')

        # Get children for this parent
        children = [n for n in nodes if n.get('parent_category') == parent_name]

        # For each child, find connections to other parent nodes
        children_data = []
        for child in children:
            child_connections = []

            # Find edges from this child to nodes in other parent categories
            outgoing_edges = [e for e in edges if e.get('source') == child['id'] and e.get('relation') != 'categorical']

            for edge in outgoing_edges:
                target_node = next((n for n in nodes if n['id'] == edge.get('target')), None)
                if target_node and target_node.get('parent_category') and target_node.get('parent_category') != parent_name:
                    target_parent = target_node.get('parent_category')
                    target_parent_node = parent_map.get(target_parent)
                    if target_parent_node:
                        child_connections.append({
                            'target_parent_id': target_parent_node['id'],
                            'target_parent_name': target_parent,
                            'weight': edge.get('weight_0to1', 0.5)
                        })

            # Lighter shade for children
            child_color = parent_color + 'B3'  # Add alpha for transparency

            children_data.append({
                'id': child['id'],
                'label': child.get('label', child['id']),
                'color': child_color,
                'severity': child.get('severity_1to5', 3),
                'kpi': child.get('kpi'),
                'connections': child_connections
            })

        hierarchical_parents.append({
            'id': parent['id'],
            'label': parent_name,
            'color': parent_color,
            'child_count': len(children),
            'category_summary': parent.get('category_summary', ''),
            'children': children_data[:5]  # Limit to 5 children for clarity
        })

    return {
        'parent_nodes': hierarchical_parents,
        'parent_edges': parent_edges
    }
