from typing import Dict, List
from collections import defaultdict
from datetime import datetime
import numpy as np

# ============================================================================
# CONSTANTS
# ============================================================================

# Topic Limits
MAX_TOPICS_PER_ARTICLE = 3
MAX_TOPIC_TIMELINES_OUTPUT = 10

# Minimum Data Requirements
MIN_DATES_FOR_TOPIC_TIMELINE = 3
MIN_SENTIMENT_DATA_POINTS = 3

# Trend Detection
TREND_STABLE_THRESHOLD = 0.05

# Date Formats
DATE_FORMATS = [
    '%Y-%m-%d',
    '%Y-%m-%dT%H:%M:%S',
    '%Y-%m-%dT%H:%M:%SZ',
    '%Y-%m-%dT%H:%M:%S.%f',
    '%Y/%m/%d'
]

# Date String Processing
DATE_STRING_MAX_LENGTH = 19

# ============================================================================


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
            for topic in topics[:MAX_TOPICS_PER_ARTICLE]:
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
            if len(dates) < MIN_DATES_FOR_TOPIC_TIMELINE:
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
            'topic_sentiment_timelines': topic_timelines[:MAX_TOPIC_TIMELINES_OUTPUT],
            'overall_trend': overall_trend,
            'date_range': {
                'start': sorted_dates[0],
                'end': sorted_dates[-1]
            }
        }

    def _parse_date(self, date_str: str) -> datetime:
        for fmt in DATE_FORMATS:
            parsed = datetime.strptime(date_str[:DATE_STRING_MAX_LENGTH], fmt)
            return parsed

        return None

    def _calculate_trend(self, daily_sentiment: List[Dict]) -> Dict:
        if len(daily_sentiment) < MIN_SENTIMENT_DATA_POINTS:
            return {'direction': 'insufficient_data', 'change': 0.0}

        sentiments = [d['avg_sentiment'] for d in daily_sentiment]

        early_avg = float(np.mean(sentiments[:len(sentiments)//2]))
        late_avg = float(np.mean(sentiments[len(sentiments)//2:]))

        change = late_avg - early_avg

        if abs(change) < TREND_STABLE_THRESHOLD:
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
