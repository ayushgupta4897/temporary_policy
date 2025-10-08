'use client';

interface TrendChartProps {
  data: any;
}

export default function TrendChart({ data }: TrendChartProps) {
  if (!data || !data.daily_timeline || data.daily_timeline.length === 0) {
    return <p className="text-gray-400 text-center py-8">No trend data available</p>;
  }

  const timeline = data.daily_timeline.slice(-30);
  const maxCount = Math.max(...timeline.map((d: any) => d.article_count));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const velocity = data.velocity_trend;
  const trendingTopics = data.top_trending_topics?.slice(0, 5) || [];

  return (
    <div className="space-y-4">
      {velocity && (
        <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
          <div className={`text-2xl ${
            velocity.direction === 'increasing' ? 'text-green-400' :
            velocity.direction === 'decreasing' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {velocity.direction === 'increasing' ? '📈' : velocity.direction === 'decreasing' ? '📉' : '➡️'}
          </div>
          <div>
            <div className="text-sm font-medium text-white capitalize">{velocity.direction}</div>
            <div className="text-xs text-gray-400">
              Confidence: {velocity.confidence}
            </div>
          </div>
        </div>
      )}

      <div className="relative h-32 flex items-end gap-px">
        {timeline.map((day: any, idx: number) => {
          const height = (day.article_count / maxCount) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              <div
                className="w-full bg-gradient-to-t from-gradient-from to-gradient-via rounded-t transition-all hover:opacity-80"
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-900 px-2 py-1 rounded text-xs whitespace-nowrap z-10">
                <div className="text-white font-mono">{day.article_count} articles</div>
                <div className="text-gray-400">{formatDate(day.date)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {trendingTopics.length > 0 && (
        <div className="border-t border-dark-400/40 pt-3 space-y-2">
          <div className="text-xs font-medium text-gray-400">Top Trending Topics</div>
          {trendingTopics.map((topic: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{topic.topic}</span>
              <span className="text-gradient-from font-mono text-xs">{topic.momentum.toFixed(1)}/day</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
