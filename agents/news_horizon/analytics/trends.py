from typing import Dict, List
from collections import defaultdict
from datetime import datetime, timedelta
import numpy as np
from scipy import stats

# ============================================================================
# CONSTANTS
# ============================================================================

# Topic Limits
MAX_TOPICS_PER_ARTICLE = 3
MAX_TRENDING_TOPICS_OUTPUT = 10

# Minimum Data Requirements
MIN_DATES_FOR_TOPIC = 3
MIN_TIMELINE_LENGTH_FOR_VELOCITY = 7

# Velocity Trend Configuration
VELOCITY_LOOKBACK_DAYS = 14
VELOCITY_STABLE_THRESHOLD = 0.1
VELOCITY_HIGH_CONFIDENCE_THRESHOLD = 0.7
VELOCITY_MEDIUM_CONFIDENCE_THRESHOLD = 0.4

# Recent Activity Window
RECENT_DAYS_WINDOW = 7

# Date Formats
DATE_FORMATS = [
    '%Y-%m-%d',
    '%Y-%m-%dT%H:%M:%S',
    '%Y-%m-%dT%H:%M:%SZ',
    '%Y-%m-%dT%H:%M:%S.%f',
    '%Y/%m/%d',
    '%d/%m/%Y'
]

# Date String Processing
DATE_STRING_MAX_LENGTH = 19

# ============================================================================


class TrendAnalyzer:
    def analyze(self, articles: Dict[str, Dict]) -> Dict:
        date_counts = defaultdict(int)
        date_sentiments = defaultdict(list)
        topic_timeline = defaultdict(lambda: defaultdict(int))

        for article in articles.values():
            date_str = article.get('date') or article.get('original_citation', {}).get('date')

            if not date_str:
                continue

            parsed_date = self._parse_date(date_str)
            if not parsed_date:
                continue

            date_key = parsed_date.strftime('%Y-%m-%d')
            date_counts[date_key] += 1

            sentiment = article.get('original_citation', {}).get('sentiment_score')
            if sentiment is not None:
                date_sentiments[date_key].append(sentiment)

            topics = article.get('original_citation', {}).get('topics', [])
            for topic in topics[:MAX_TOPICS_PER_ARTICLE]:
                topic_timeline[topic][date_key] += 1

        if not date_counts:
            return {
                'daily_timeline': [],
                'weekly_aggregates': [],
                'top_trending_topics': [],
                'velocity_trend': None
            }

        sorted_dates = sorted(date_counts.keys())
        daily_timeline = [
            {
                'date': date,
                'article_count': date_counts[date],
                'avg_sentiment': float(np.mean(date_sentiments[date])) if date_sentiments[date] else 0.0
            }
            for date in sorted_dates
        ]

        weekly_agg = self._aggregate_weekly(daily_timeline)

        velocity_trend = self._calculate_velocity_trend(daily_timeline)

        trending_topics = self._find_trending_topics(topic_timeline, sorted_dates)

        return {
            'daily_timeline': daily_timeline,
            'weekly_aggregates': weekly_agg,
            'top_trending_topics': trending_topics[:MAX_TRENDING_TOPICS_OUTPUT],
            'velocity_trend': velocity_trend,
            'date_range': {
                'start': sorted_dates[0],
                'end': sorted_dates[-1],
                'days': len(sorted_dates)
            }
        }

    def _parse_date(self, date_str: str) -> datetime:
        for fmt in DATE_FORMATS:
            parsed = datetime.strptime(date_str[:DATE_STRING_MAX_LENGTH], fmt)
            return parsed

        return None

    def _aggregate_weekly(self, daily_timeline: List[Dict]) -> List[Dict]:
        if not daily_timeline:
            return []

        weekly = defaultdict(lambda: {'count': 0, 'sentiments': []})

        for day in daily_timeline:
            date = datetime.strptime(day['date'], '%Y-%m-%d')
            week_key = date.strftime('%Y-W%U')
            weekly[week_key]['count'] += day['article_count']
            if day['avg_sentiment'] != 0.0:
                weekly[week_key]['sentiments'].append(day['avg_sentiment'])

        result = []
        for week, data in sorted(weekly.items()):
            result.append({
                'week': week,
                'article_count': data['count'],
                'avg_sentiment': float(np.mean(data['sentiments'])) if data['sentiments'] else 0.0
            })

        return result

    def _calculate_velocity_trend(self, daily_timeline: List[Dict]) -> Dict:
        if len(daily_timeline) < MIN_TIMELINE_LENGTH_FOR_VELOCITY:
            return {'direction': 'stable', 'slope': 0.0, 'confidence': 'low'}

        counts = [day['article_count'] for day in daily_timeline[-VELOCITY_LOOKBACK_DAYS:]]
        x = np.arange(len(counts))

        slope, intercept, r_value, p_value, std_err = stats.linregress(x, counts)

        if abs(slope) < VELOCITY_STABLE_THRESHOLD:
            direction = 'stable'
        elif slope > 0:
            direction = 'increasing'
        else:
            direction = 'decreasing'

        confidence = 'high' if abs(r_value) > VELOCITY_HIGH_CONFIDENCE_THRESHOLD else 'medium' if abs(r_value) > VELOCITY_MEDIUM_CONFIDENCE_THRESHOLD else 'low'

        return {
            'direction': direction,
            'slope': float(slope),
            'r_squared': float(r_value ** 2),
            'confidence': confidence
        }

    def _find_trending_topics(self, topic_timeline: Dict, sorted_dates: List[str]) -> List[Dict]:
        trending = []

        for topic, dates in topic_timeline.items():
            if len(dates) < MIN_DATES_FOR_TOPIC:
                continue

            total_mentions = sum(dates.values())

            recent_dates = sorted_dates[-RECENT_DAYS_WINDOW:] if len(sorted_dates) >= RECENT_DAYS_WINDOW else sorted_dates
            recent_mentions = sum(dates.get(d, 0) for d in recent_dates)

            momentum = recent_mentions / len(recent_dates) if recent_dates else 0

            trending.append({
                'topic': topic,
                'total_mentions': total_mentions,
                'recent_mentions': recent_mentions,
                'momentum': float(momentum)
            })

        trending.sort(key=lambda x: x['momentum'], reverse=True)
        return trending
