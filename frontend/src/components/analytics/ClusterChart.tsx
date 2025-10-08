'use client';

interface ClusterChartProps {
  data: any;
}

export default function ClusterChart({ data }: ClusterChartProps) {
  if (!data || !data.clusters || data.clusters.length === 0) {
    return <p className="text-gray-400 text-center py-8">No clustering data available</p>;
  }

  const clusters = data.clusters.slice(0, 8);
  const maxSize = Math.max(...clusters.map((c: any) => c.size));

  const getClusterColor = (idx: number) => {
    const colors = [
      { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400', bar: 'bg-blue-500' },
      { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400', bar: 'bg-purple-500' },
      { bg: 'bg-green-500/20', border: 'border-green-500/40', text: 'text-green-400', bar: 'bg-green-500' },
      { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', bar: 'bg-orange-500' },
      { bg: 'bg-pink-500/20', border: 'border-pink-500/40', text: 'text-pink-400', bar: 'bg-pink-500' },
      { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', bar: 'bg-cyan-500' },
      { bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', text: 'text-yellow-400', bar: 'bg-yellow-500' },
      { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-400', bar: 'bg-indigo-500' },
    ];
    return colors[idx % colors.length];
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.1) return { icon: '↗', color: 'text-green-400' };
    if (sentiment < -0.1) return { icon: '↘', color: 'text-red-400' };
    return { icon: '→', color: 'text-gray-400' };
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {clusters.map((cluster: any, idx: number) => {
          const colors = getClusterColor(idx);
          const sentiment = getSentimentIcon(cluster.avg_sentiment || 0);
          const sizePercent = (cluster.size / maxSize) * 100;

          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${colors.bg} ${colors.border} hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`text-base font-bold ${colors.text}`}>
                    Cluster {idx + 1}
                  </div>
                  <span className={`text-base ${sentiment.color}`}>{sentiment.icon}</span>
                </div>
                <div className={`px-2 py-1 rounded ${colors.bg} border ${colors.border}`}>
                  <span className={`text-sm font-mono font-bold ${colors.text}`}>
                    {cluster.size}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${sizePercent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap gap-1.5">
                  {cluster.keywords.slice(0, 6).map((keyword: string, kidx: number) => (
                    <span
                      key={kidx}
                      className={`px-2 py-0.5 text-xs font-medium rounded ${colors.bg} ${colors.text} border ${colors.border}`}
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {cluster.size} article{cluster.size !== 1 ? 's' : ''} • Sentiment: {(cluster.avg_sentiment || 0).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-dark-400/40 pt-4 flex items-center justify-between text-sm">
        <div className="text-gray-400">
          <span className="text-white font-semibold">{data.articles_clustered}</span> of{' '}
          <span className="text-white font-semibold">{data.total_articles}</span> articles clustered into{' '}
          <span className="text-white font-semibold">{data.cluster_count}</span> topic groups
        </div>
      </div>
    </div>
  );
}
