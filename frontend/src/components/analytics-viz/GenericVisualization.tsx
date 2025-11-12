/**
 * Generic Visualization Wrapper - LLM-Driven Dynamic Rendering
 */

import { KPICards } from './charts/KPICards';
import { RadarChart } from './charts/RadarChart';
import { BubbleChart } from './charts/BubbleChart';
import { BarComparison } from './charts/BarComparison';
import { TimelineChart } from './charts/TimelineChart';
import { RiskMatrix } from './charts/RiskMatrix';
import { WaterfallChart } from './charts/WaterfallChart';
import { SankeyChart } from './charts/SankeyChart';
import { HeatmapChart } from './charts/HeatmapChart';
import { TreemapChart } from './charts/TreemapChart';
import { AreaTrendChart } from './charts/AreaTrendChart';
import { FanChart } from './charts/FanChart';

export type ChartType = 'kpi-cards' | 'radar' | 'bubble' | 'bar-comparison' | 'timeline' | 'risk-matrix' | 'waterfall' | 'sankey' | 'heatmap' | 'treemap' | 'area-trend' | 'fan-chart';

export interface Visualization {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  insight?: string;
  data: any;
  config?: any;
  metadata?: { dataSource?: string; confidence?: 'low' | 'medium' | 'high'; };
}

export function GenericVisualization({ visualization }: { visualization: Visualization }) {
  const { type, title, subtitle, insight, data, config, metadata } = visualization;

  const renderChart = () => {
    switch (type) {
      case 'kpi-cards': return <KPICards data={data} config={config} />;
      case 'radar': return <RadarChart data={data} config={config} />;
      case 'bubble': return <BubbleChart data={data} config={config} />;
      case 'bar-comparison': return <BarComparison data={data} config={config} />;
      case 'timeline': return <TimelineChart data={data} config={config} />;
      case 'risk-matrix': return <RiskMatrix data={data} config={config} />;
      case 'waterfall': return <WaterfallChart data={data} config={config} />;
      case 'sankey': return <SankeyChart data={data} config={config} />;
      case 'heatmap': return <HeatmapChart data={data} config={config} />;
      case 'treemap': return <TreemapChart data={data} config={config} />;
      case 'area-trend': return <AreaTrendChart data={data} config={config} />;
      case 'fan-chart': return <FanChart data={data} config={config} />;
      default: return <div className="text-center p-8 text-[#6B6B6B]/50">Unsupported chart type: {type}</div>;
    }
  };

  return (
    <section className="visualization-section mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-monument-stone mb-2">{title}</h2>
        {subtitle && <p className="text-monument-stone/80 text-sm">{subtitle}</p>}
        {metadata?.dataSource && <p className="text-monument-stone/60 text-xs mt-1 font-medium">Data source: {metadata.dataSource}</p>}
      </div>
      <div className="chart-container bg-white/40 backdrop-blur-sm rounded-xl p-6 border border-monument-stone/20">
        {renderChart()}
      </div>
      {insight && (
        <div className="mt-4 bg-monument-mint/20 border-l-4 border-monument-mint p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <p className="text-monument-stone text-sm leading-relaxed"><span className="font-semibold">Key Insight:</span> {insight}</p>
          </div>
        </div>
      )}
    </section>
  );
}
