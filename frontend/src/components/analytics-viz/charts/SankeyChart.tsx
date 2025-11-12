/**
 * Sankey Diagram - Budget Flow Visualization
 * Uses custom SVG rendering for flow visualization
 */

interface SankeyChartProps {
  data: {
    nodes: Array<{ id: string; name: string }>;
    links: Array<{ source: string; target: string; value: number }>;
  };
  config?: any;
}

export function SankeyChart({ data, config }: SankeyChartProps) {
  const { nodes, links } = data;

  // Simple Sankey visualization using divs (production would use D3 or recharts-sankey)
  // Calculate totals for each node
  const nodeValues = new Map<string, number>();
  links.forEach(link => {
    nodeValues.set(link.source, (nodeValues.get(link.source) || 0) + link.value);
    nodeValues.set(link.target, (nodeValues.get(link.target) || 0) + link.value);
  });

  // Group links by source
  const linksBySource = new Map<string, typeof links>();
  links.forEach(link => {
    if (!linksBySource.has(link.source)) {
      linksBySource.set(link.source, []);
    }
    linksBySource.get(link.source)!.push(link);
  });

  return (
    <div className="space-y-8">
      {Array.from(linksBySource.entries()).map(([source, sourceLinks]) => {
        const sourceNode = nodes.find(n => n.id === source);
        const totalValue = nodeValues.get(source) || 0;

        return (
          <div key={source} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-monument-mint/20 px-4 py-2 rounded-lg border-2 border-monument-mint min-w-[200px]">
                <p className="font-semibold text-[#6B6B6B]">{sourceNode?.name || source}</p>
                <p className="text-sm text-[#6B6B6B]/70">${totalValue}M total</p>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {sourceLinks.map((link, idx) => {
                  const targetNode = nodes.find(n => n.id === link.target);
                  const percentage = (link.value / totalValue) * 100;

                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-monument-sky h-full flex items-center justify-end pr-3 transition-all"
                          style={{ width: `${percentage}%` }}
                        >
                          <span className="text-xs font-medium text-white">${link.value}M</span>
                        </div>
                      </div>
                      <div className="bg-monument-sky/20 px-3 py-1 rounded-lg border border-monument-sky min-w-[150px]">
                        <p className="text-sm font-medium text-[#6B6B6B]">{targetNode?.name || link.target}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
