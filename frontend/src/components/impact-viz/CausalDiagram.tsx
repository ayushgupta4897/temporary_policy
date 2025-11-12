/**
 * Causal Diagram Component
 * Displays causal pathway text in a structured format (Mermaid rendering optional)
 */

import { useEffect, useRef, useState } from 'react';

interface CausalDiagramProps {
  title: string;
  subtitle?: string;
  insight?: string;
  data: {
    diagram: string;
    description?: string;
  };
}

export function CausalDiagram({ title, subtitle, insight, data }: CausalDiagramProps) {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [renderState, setRenderState] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    // Dynamically load Mermaid only when needed
    const loadMermaid = async () => {
      try {
        // Check if mermaid is already loaded
        if (typeof window !== 'undefined' && (window as any).mermaid) {
          await renderDiagram((window as any).mermaid);
          return;
        }

        // Try to load mermaid from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
        script.async = true;
        script.onload = async () => {
          const mermaid = (window as any).mermaid;
          if (mermaid) {
            mermaid.initialize({
              startOnLoad: false,
              theme: 'dark',
              themeVariables: {
                primaryColor: '#3b82f6',
                primaryTextColor: '#f3f4f6',
                primaryBorderColor: '#60a5fa',
                lineColor: '#9ca3af',
                secondaryColor: '#1f2937',
                tertiaryColor: '#111827',
                background: '#1f2937',
                mainBkg: '#1f2937',
                secondBkg: '#111827',
                terBkg: '#374151',
                darkMode: true,
                fontSize: '14px',
              },
            });
            await renderDiagram(mermaid);
          }
        };
        script.onerror = () => {
          console.warn('Mermaid library failed to load, showing text fallback');
          setRenderState('error');
        };
        document.head.appendChild(script);
      } catch (error) {
        console.warn('Error loading Mermaid:', error);
        setRenderState('error');
      }
    };

    const renderDiagram = async (mermaid: any) => {
      if (diagramRef.current) {
        try {
          const { svg } = await mermaid.render('mermaid-diagram-' + Date.now(), data.diagram);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = svg;
            setRenderState('success');
          }
        } catch (error) {
          console.error('Error rendering Mermaid diagram (showing fallback):', error);
          setRenderState('error');
        }
      }
    };

    loadMermaid();
  }, [data.diagram]);

  // Parse and display diagram as text fallback
  const renderTextFallback = () => {
    const lines = data.diagram.split('\n').filter(line => line.trim());
    const nodes: { from: string; to: string; label?: string }[] = [];

    lines.forEach(line => {
      // Parse lines like: A[Label] --> B[Label]
      const arrowMatch = line.match(/(\w+)\[([^\]]+)\]\s*--?>?\s*(\w+)(?:\[([^\]]+)\])?/);
      if (arrowMatch) {
        nodes.push({
          from: arrowMatch[2],
          to: arrowMatch[4] || arrowMatch[3],
        });
      }
    });

    if (nodes.length === 0) {
      return (
        <pre className="text-gray-300 text-sm font-mono whitespace-pre-wrap">{data.diagram}</pre>
      );
    }

    return (
      <div className="space-y-3">
        {nodes.map((node, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="bg-gradient-from/20 border border-gradient-from/30 rounded-lg px-4 py-2 text-gray-200 text-sm font-medium min-w-[150px] text-center">
              {node.from}
            </div>
            <div className="text-gradient-from text-xl">→</div>
            <div className="bg-gradient-via/20 border border-gradient-via/30 rounded-lg px-4 py-2 text-gray-200 text-sm font-medium min-w-[150px] text-center">
              {node.to}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">{title}</h2>
        {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
      </div>

      {insight && (
        <div className="bg-gradient-from/10 border border-gradient-from/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-gradient-from mt-0.5">💡</div>
            <p className="text-gray-200 text-sm leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      {data.description && (
        <p className="text-gray-300 text-sm">{data.description}</p>
      )}

      <div className="bg-dark-500 border border-dark-400 rounded-lg p-6 overflow-x-auto">
        {renderState === 'loading' && (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gradient-from mx-auto mb-2"></div>
              <p className="text-gray-400 text-sm">Loading diagram...</p>
            </div>
          </div>
        )}
        {renderState === 'error' && (
          <div className="min-h-[300px] flex items-center justify-center">
            {renderTextFallback()}
          </div>
        )}
        <div
          ref={diagramRef}
          className={`mermaid-container flex items-center justify-center min-h-[300px] ${renderState === 'success' ? '' : 'hidden'}`}
        />
      </div>
    </div>
  );
}
