'use client';

interface GeoHeatmapProps {
  data: any;
}

export default function GeoHeatmap({ data }: GeoHeatmapProps) {
  if (!data || !data.country_insights || data.country_insights.length === 0) {
    return <p className="text-gray-400 text-center py-8">No geographic data available</p>;
  }

  const countries = data.country_insights.slice(0, 15);
  const regions = data.region_insights?.slice(0, 8) || [];
  const maxCount = Math.max(...countries.map((c: any) => c.article_count));

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.2) return 'text-green-400';
    if (sentiment < -0.2) return 'text-red-400';
    return 'text-gray-400';
  };

  const getIntensityColor = (count: number, max: number) => {
    const ratio = count / max;
    if (ratio > 0.7) return 'from-blue-600 to-blue-500';
    if (ratio > 0.4) return 'from-blue-500 to-blue-400';
    if (ratio > 0.2) return 'from-blue-400 to-blue-300';
    return 'from-blue-300 to-blue-200';
  };

  return (
    <div className="space-y-6">
      {regions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">Regional Overview</h4>
          <div className="grid grid-cols-2 gap-3">
            {regions.map((region: any, idx: number) => (
              <div key={idx} className="p-3 bg-dark-700/50 rounded-lg border border-dark-400/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-200 font-medium">{region.name}</span>
                  <span className="text-blue-400 font-mono text-sm">{region.article_count}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-400">Sentiment:</span>
                  <span className={getSentimentColor(region.avg_sentiment)}>
                    {region.avg_sentiment > 0 ? '+' : ''}{region.avg_sentiment.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-medium text-gray-300 mb-3">Country Distribution</h4>
        <div className="space-y-2">
          {countries.map((country: any, idx: number) => {
            const width = (country.article_count / maxCount) * 100;
            const sentiment = country.avg_sentiment || 0;
            const intensity = getIntensityColor(country.article_count, maxCount);

            return (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-200 truncate">{country.name}</span>
                    <span className={`text-xs font-mono ${getSentimentColor(sentiment)} ml-auto`}>
                      {sentiment > 0 ? '+' : ''}{sentiment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-gray-300 font-mono text-xs">{country.article_count}</span>
                    {country.avg_trust && (
                      <span className="text-gray-500 text-xs">
                        T: {country.avg_trust.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative h-7 bg-dark-700 rounded-lg overflow-hidden group">
                  <div
                    className={`absolute h-full bg-gradient-to-r ${intensity} transition-all duration-500`}
                    style={{ width: `${width}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0 relative z-10">
                      {country.top_topics && country.top_topics.length > 0 && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {country.top_topics.slice(0, 3).map((topic: any, tidx: number) => (
                            <span
                              key={tidx}
                              className="px-2 py-0.5 bg-dark-900/80 text-gray-300 rounded text-[10px] whitespace-nowrap"
                            >
                              {topic.topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-dark-400/40">
        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
          <div className="text-2xl font-bold text-white">{data.total_countries}</div>
          <div className="text-xs text-gray-400 mt-1">Countries</div>
        </div>
        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
          <div className="text-2xl font-bold text-white">{data.total_regions}</div>
          <div className="text-xs text-gray-400 mt-1">Regions</div>
        </div>
        <div className="text-center p-3 bg-dark-700/30 rounded-lg">
          <div className="text-2xl font-bold text-white">
            {countries.reduce((sum: number, c: any) => sum + c.article_count, 0)}
          </div>
          <div className="text-xs text-gray-400 mt-1">Total Articles</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 bg-dark-700/30 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span>Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-8 h-2 bg-gradient-to-r from-blue-200 to-blue-300 rounded" />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-8 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded" />
            <span>High</span>
          </div>
        </div>
        <div className="text-gray-500">Hover bars for topics</div>
      </div>
    </div>
  );
}
