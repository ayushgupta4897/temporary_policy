'use client';

interface SentimentTimelineProps {
  data: any;
}

export default function SentimentTimeline({ data }: SentimentTimelineProps) {
  if (!data || !data.daily_sentiment || data.daily_sentiment.length === 0) {
    return <p className="text-gray-400 text-center py-8">No sentiment data available</p>;
  }

  const timeline = data.daily_sentiment.slice(-30);
  const maxSentiment = 1;
  const minSentiment = -1;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const trend = data.overall_trend;

  return (
    <div className="space-y-4">
      {trend && (
        <div className="flex items-center gap-3 p-3 bg-dark-700/50 rounded-lg">
          <div className={`text-2xl ${
            trend.direction === 'improving' ? 'text-green-400' :
            trend.direction === 'declining' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {trend.direction === 'improving' ? '↗' : trend.direction === 'declining' ? '↘' : '→'}
          </div>
          <div>
            <div className="text-sm font-medium text-white capitalize">{trend.direction}</div>
            <div className="text-xs text-gray-400">
              {trend.change > 0 ? '+' : ''}{(trend.change * 100).toFixed(1)}% change
            </div>
          </div>
        </div>
      )}

      <div className="relative h-48 flex items-end gap-1 pb-6">
        {timeline.map((day: any, idx: number) => {
          const sentiment = day.avg_sentiment;
          const normalized = ((sentiment - minSentiment) / (maxSentiment - minSentiment)) * 100;
          const height = Math.max(normalized, 5);
          const color = sentiment > 0.1 ? 'bg-green-500' : sentiment < -0.1 ? 'bg-red-500' : 'bg-gray-500';

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative">
              <div
                className={`w-full ${color} rounded-t transition-all hover:opacity-80`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-800/95 border border-dark-400 px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg z-10">
                <div className="text-white font-mono">{sentiment.toFixed(2)}</div>
                <div className="text-gray-400">{formatDate(day.date)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs border-t border-dark-400/40 pt-3">
        <span className="text-gray-400">{formatDate(timeline[0].date)}</span>
        <span className="text-gray-500 italic">Sentiment over time</span>
        <span className="text-gray-400">{formatDate(timeline[timeline.length - 1].date)}</span>
      </div>
    </div>
  );
}
