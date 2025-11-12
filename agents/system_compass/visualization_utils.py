"""
HTML Visualization Utilities for Systems Evidence Graph
Strategy& PWC - SEGB Feature
"""

import json
from typing import Dict
from datetime import datetime

def generate_html_visualization(graph_json: Dict) -> str:
    """Generate interactive HTML visualization for graph data."""

    html_template = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Systems Evidence Graph - {title}</title>
  <script src="https://unpkg.com/cytoscape@3.28.1/dist/cytoscape.min.js"></script>
  <style>
    body {{ font-family: Inter, system-ui, sans-serif; margin:0; display:flex; height:100vh; background:#f8fafc; position: relative; }}
    #cy {{ flex: 1; background: linear-gradient(to bottom right, #f8fafc, #e0e7ff); position: relative; }}
    #panel {{ width: 450px; border-left: 2px solid #e2e8f0; padding: 24px; overflow:auto; background:white; box-shadow: -4px 0 16px rgba(0,0,0,0.05); transition: transform 0.3s ease; }}
    #panel.hidden {{ transform: translateX(100%); }}
    .legend div {{ margin-bottom: 10px; display: flex; align-items: center; }}
    .pill {{ display:inline-block; padding:4px 12px; border-radius:999px; font-size:12px; font-weight:500; }}
    .color-box {{ width: 20px; height: 20px; border-radius: 4px; margin-right: 12px; border: 1px solid #e2e8f0; }}
    .line-example {{ width: 40px; height: 2px; margin-right: 12px; }}
    .controls {{ position: absolute; top: 16px; right: 16px; z-index: 1000; display: flex; gap: 8px; }}
    .btn {{ padding: 12px 20px; background: white; border: 2px solid #e2e8f0; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; color: #1e293b; transition: all 0.2s; box-shadow: 0 2px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 8px; }}
    .btn:hover {{ background: #667eea; color: white; border-color: #667eea; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transform: translateY(-2px); }}
    .btn:active {{ transform: translateY(0px); }}
    .btn-icon {{ font-size: 18px; }}
    body.fullscreen #cy {{ position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; }}
    body.fullscreen #panel {{ position: fixed; top: 0; right: 0; bottom: 0; z-index: 10000; }}
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
  <div id="cy">
    <div class="controls">
      <button class="btn" onclick="toggleFullscreen()" title="Maximize graph to full screen">
        <span class="btn-icon" id="fullscreen-icon">&#x26F6;</span>
        <span id="fullscreen-text">Maximize</span>
      </button>
      <button class="btn" onclick="togglePanel()" title="Hide/Show information panel">
        <span class="btn-icon" id="panel-icon">&#x25E7;</span>
        <span id="panel-text">Hide Panel</span>
      </button>
      <button class="btn" onclick="exportImage()" title="Download graph as image">
        <span class="btn-icon">&#x2B73;</span>
        <span>Download PNG</span>
      </button>
    </div>
  </div>
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
      <div><span class="color-box" style="background:#fbbf24"></span> <strong>Intervention</strong> - Policy actions</div>

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

    const colorByType = {{
      driver: "#60a5fa",
      status_quo: "#94a3b8",
      implication: "#c084fc",
      intervention: "#fbbf24",
      mediator: "#fbbf24"
    }};

    function getNodeLabel(node) {{
      let label = node.label || node.id;
      if (node.kpi && node.kpi.trend) {{
        if (node.kpi.trend === 'up') label += ' 📈';
        else if (node.kpi.trend === 'down') label += ' 📉';
        else if (node.kpi.trend === 'flat') label += ' ➡️';
      }}
      if (node.kpi && node.kpi.current_value !== null && node.kpi.current_value !== undefined) {{
        label += ' (' + node.kpi.current_value + (node.kpi.unit || '') + ')';
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

      const effectSize = e.weight > 0.7 ? 'Strong' :
                         e.weight > 0.4 ? 'Moderate' : 'Weak';

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

    // Fullscreen toggle
    function toggleFullscreen() {{
      const isFullscreen = document.body.classList.toggle('fullscreen');
      const icon = document.getElementById('fullscreen-icon');
      const text = document.getElementById('fullscreen-text');

      if (isFullscreen) {{
        icon.innerHTML = '&#x26CB;';
        text.textContent = 'Exit Full Screen';
      }} else {{
        icon.innerHTML = '&#x26F6;';
        text.textContent = 'Maximize';
      }}

      // Resize cytoscape after fullscreen toggle
      setTimeout(() => cy.resize(), 100);
    }}

    // Panel toggle
    function togglePanel() {{
      const panel = document.getElementById('panel');
      const isPanelHidden = panel.classList.toggle('hidden');
      const icon = document.getElementById('panel-icon');
      const text = document.getElementById('panel-text');

      if (isPanelHidden) {{
        icon.innerHTML = '&#x25E8;';
        text.textContent = 'Show Panel';
      }} else {{
        icon.innerHTML = '&#x25E7;';
        text.textContent = 'Hide Panel';
      }}

      // Resize cytoscape after panel toggle
      setTimeout(() => cy.resize(), 350);
    }}

    // Export to PNG
    function exportImage() {{
      const png64 = cy.png({{
        output: 'blob',
        bg: 'white',
        full: true,
        scale: 3
      }});

      // Create download link
      const url = URL.createObjectURL(png64);
      const link = document.createElement('a');
      link.download = 'systems-evidence-graph-{{Date.now()}}.png';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }}
  </script>
</body>
</html>'''

    # Format the template with actual data
    meta = graph_json.get('meta', {})
    formatted_html = html_template.format(
        title=meta.get('focus_issue', 'Analysis'),
        focus=meta.get('focus_issue', ''),
        geography=meta.get('geography', 'Dubai, UAE'),
        time_range=meta.get('time_range', '2015–present'),
        graph_json=json.dumps(graph_json)
    )

    return formatted_html


def create_fallback_json() -> Dict:
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
                    "intervention": "#fbbf24",
                    "negative": "#ef4444",
                    "positive": "#10b981"
                }
            }
        },
        "nodes": [],
        "edges": []
    }
