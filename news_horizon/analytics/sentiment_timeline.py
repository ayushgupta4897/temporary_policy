from typing import Dict, List
from collections import defaultdict
from datetime import datetime
import numpy as np


class SentimentTimelineAnalyzer:
    def analyze(self, articles: Dict[str, Dict]) -> Dict:
        daily_sentiments = defaultdict(list)
        topic_sentiments = defaultdict(lambda: defaultdict(list))

        for article in articles.values():
            citation = article.get('original_citation', {})

            date_str = article.get('date') or citation.get('date')
            if not date_str:
                continue

            parsed_date = self._parse_date(date_str)
            if not parsed_date:
                continue

            sentiment = citation.get('sentiment_score')
            if sentiment is None:
                continue

            date_key = parsed_date.strftime('%Y-%m-%d')
            daily_sentiments[date_key].append(sentiment)

            topics = citation.get('topics', [])
            for topic in topics[:3]:
                topic_sentiments[topic][date_key].append(sentiment)

        if not daily_sentiments:
            return {
                'daily_sentiment': [],
                'topic_sentiment_timelines': [],
                'overall_trend': None
            }

        sorted_dates = sorted(daily_sentiments.keys())

        daily_sentiment = [
            {
                'date': date,
                'avg_sentiment': float(np.mean(daily_sentiments[date])),
                'sentiment_std': float(np.std(daily_sentiments[date])),
                'article_count': len(daily_sentiments[date])
            }
            for date in sorted_dates
        ]

        topic_timelines = []
        for topic, dates in topic_sentiments.items():
            if len(dates) < 3:
                continue

            timeline = []
            for date in sorted_dates:
                if date in dates:
                    timeline.append({
                        'date': date,
                        'avg_sentiment': float(np.mean(dates[date])),
                        'count': len(dates[date])
                    })

            if timeline:
                topic_timelines.append({
                    'topic': topic,
                    'timeline': timeline,
                    'overall_avg': float(np.mean([t['avg_sentiment'] for t in timeline]))
                })

        topic_timelines.sort(key=lambda x: len(x['timeline']), reverse=True)

        overall_trend = self._calculate_trend(daily_sentiment)

        return {
            'daily_sentiment': daily_sentiment,
            'topic_sentiment_timelines': topic_timelines[:10],
            'overall_trend': overall_trend,
            'date_range': {
                'start': sorted_dates[0],
                'end': sorted_dates[-1]
            }
        }

    def _parse_date(self, date_str: str) -> datetime:
        formats = [
            '%Y-%m-%d',
            '%Y-%m-%dT%H:%M:%S',
            '%Y-%m-%dT%H:%M:%SZ',
            '%Y-%m-%dT%H:%M:%S.%f',
            '%Y/%m/%d'
        ]

        for fmt in formats:
            parsed = datetime.strptime(date_str[:19], fmt)
            return parsed

        return None

    def _calculate_trend(self, daily_sentiment: List[Dict]) -> Dict:
        if len(daily_sentiment) < 3:
            return {'direction': 'insufficient_data', 'change': 0.0}

        sentiments = [d['avg_sentiment'] for d in daily_sentiment]

        early_avg = float(np.mean(sentiments[:len(sentiments)//2]))
        late_avg = float(np.mean(sentiments[len(sentiments)//2:]))

        change = late_avg - early_avg

        if abs(change) < 0.05:
            direction = 'stable'
        elif change > 0:
            direction = 'improving'
        else:
            direction = 'declining'

        return {
            'direction': direction,
            'change': float(change),
            'early_period_avg': early_avg,
            'late_period_avg': late_avg
        }
