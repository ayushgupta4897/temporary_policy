'use client';

import { useMemo, useState } from 'react';

interface EntityGraphProps {
  data: any;
}

export default function EntityGraph({ data }: EntityGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (!data || !data.network_graph || !data.network_graph.nodes) {
    return <p className="text-gray-400 text-center py-8">No entity data available</p>;
  }

  const graph = data.network_graph;
  const topCountries = data.top_countries?.slice(0, 10) || [];
  const topTopics = data.top_topics?.slice(0, 10) || [];
  const topOrgs = data.top_organizations?.slice(0, 10) || [];

  const nodePositions = useMemo(() => {
    const nodes = graph.nodes.slice(0, 30);
    const positions: any = {};
    const centerX = 300;
    const centerY = 200;

    const typeGroups: any = { countries: [], organizations: [], topics: [] };
    nodes.forEach((node: any) => {
      if (typeGroups[node.type]) typeGroups[node.type].push(node);
    });

    let currentAngle = 0;
    Object.entries(typeGroups).forEach(([type, typeNodes]: [string, any]) => {
      const angleStep = (Math.PI * 2) / nodes.length;
      const radius = type === 'countries' ? 150 : type === 'topics' ? 120 : 90;

      typeNodes.forEach((node: any, idx: number) => {
        const angle = currentAngle + idx * angleStep;
        const r = radius * (0.8 + (node.centrality || 0) * 0.4);

        positions[node.id] = {
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle),
          node
        };
      });

      currentAngle += typeNodes.length * angleStep;
    });

    return positions;
  }, [graph.nodes]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'countries': return '#3b82f6';
      case 'organizations': return '#8b5cf6';
      case 'topics': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getConnectedNodes = (nodeId: string) => {
    const connected = new Set<string>();
    graph.edges?.forEach((edge: any) => {
      if (edge.source === nodeId) connected.add(edge.target);
      if (edge.target === nodeId) connected.add(edge.source);
    });
    return connected;
  };

  return (
    <div className="space-y-6">
      <div className="bg-dark-700/50 rounded-lg p-6">
        <svg viewBox="0 0 600 400" className="w-full h-80">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {graph.edges?.slice(0, 50).map((edge: any, idx: number) => {
            const source = nodePositions[edge.source];
            const target = nodePositions[edge.target];

            if (!source || !target) return null;

            const isHighlighted = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);

            return (
              <line
                key={idx}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={isHighlighted ? '#60a5fa' : '#374151'}
                strokeWidth={isHighlighted ? 2 : Math.min(edge.weight * 0.5, 2)}
                opacity={isHighlighted ? 0.6 : 0.2}
                className="transition-all"
              />
            );
          })}

          {Object.entries(nodePositions).map(([nodeId, pos]: [string, any], idx: number) => {
            const size = 5 + Math.min(pos.node.weight * 0.3, 8);
            const color = getNodeColor(pos.node.type);
            const isHovered = hoveredNode === nodeId;
            const connectedNodes = hoveredNode ? getConnectedNodes(hoveredNode) : new Set();
            const isConnected = hoveredNode && connectedNodes.has(nodeId);

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredNode(nodeId)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isHovered ? size + 3 : size}
                  fill={color}
                  opacity={!hoveredNode || isHovered || isConnected ? 0.9 : 0.3}
                  className="transition-all"
                  filter={isHovered ? "url(#glow)" : ""}
                />
                {(isHovered || pos.node.weight > 15) && (
                  <text
                    x={pos.x}
                    y={pos.y - size - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-200 font-medium"
                    style={{ pointerEvents: 'none' }}
                  >
                    {pos.node.id.length > 20 ? pos.node.id.substring(0, 20) + '...' : pos.node.id}
                  </text>
                )}
                <title>{pos.node.id} ({pos.node.weight} mentions)</title>
              </g>
            );
          })}
        </svg>

        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-300">Countries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-300">Organizations</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-300">Topics</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            Top Countries
          </div>
          <div className="space-y-2">
            {topCountries.map((country: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-dark-700/50 transition-colors">
                <span className="text-gray-300">{country.name}</span>
                <span className="text-blue-400 font-mono text-xs bg-blue-500/10 px-2 py-0.5 rounded">{country.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Top Topics
          </div>
          <div className="space-y-2">
            {topTopics.map((topic: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-dark-700/50 transition-colors">
                <span className="text-gray-300 truncate">{topic.name}</span>
                <span className="text-green-400 font-mono text-xs bg-green-500/10 px-2 py-0.5 rounded">{topic.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Top Organizations
          </div>
          <div className="space-y-2">
            {topOrgs.length > 0 ? topOrgs.map((org: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 rounded hover:bg-dark-700/50 transition-colors">
                <span className="text-gray-300 truncate">{org.name}</span>
                <span className="text-purple-400 font-mono text-xs bg-purple-500/10 px-2 py-0.5 rounded">{org.count}</span>
              </div>
            )) : (
              <p className="text-gray-500 text-xs italic">No organizations detected</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-dark-400/40 pt-3 text-sm text-gray-300">
        Network: <span className="text-white font-semibold">{graph.node_count}</span> entities,{' '}
        <span className="text-white font-semibold">{graph.edge_count}</span> connections
        <span className="text-gray-500 ml-3">• Hover nodes to see relationships</span>
      </div>
    </div>
  );
}
