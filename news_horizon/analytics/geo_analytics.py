from typing import Dict, List
from collections import defaultdict
import numpy as np


class GeoAnalyzer:
    def analyze(self, articles: Dict[str, Dict]) -> Dict:
        region_data = defaultdict(lambda: {
            'count': 0,
            'sentiments': [],
            'trust_scores': [],
            'topics': defaultdict(int)
        })

        country_data = defaultdict(lambda: {
            'count': 0,
            'sentiments': [],
            'trust_scores': [],
            'topics': defaultdict(int)
        })

        for article in articles.values():
            citation = article.get('original_citation', {})

            regions = citation.get('region', [])
            if not isinstance(regions, list):
                regions = [regions] if regions else []

            countries = citation.get('country', [])
            if not isinstance(countries, list):
                countries = [countries] if countries else []

            sentiment = citation.get('sentiment_score')
            trust = citation.get('trust_score')
            topics = citation.get('topics', [])

            for region in regions:
                if region:
                    region_data[region]['count'] += 1
                    if sentiment is not None:
                        region_data[region]['sentiments'].append(sentiment)
                    if trust is not None:
                        region_data[region]['trust_scores'].append(trust)
                    for topic in topics[:3]:
                        region_data[region]['topics'][topic] += 1

            for country in countries:
                if country:
                    country_data[country]['count'] += 1
                    if sentiment is not None:
                        country_data[country]['sentiments'].append(sentiment)
                    if trust is not None:
                        country_data[country]['trust_scores'].append(trust)
                    for topic in topics[:3]:
                        country_data[country]['topics'][topic] += 1

        region_insights = self._build_insights(region_data)
        country_insights = self._build_insights(country_data)

        return {
            'region_insights': region_insights,
            'country_insights': country_insights,
            'total_regions': len(region_insights),
            'total_countries': len(country_insights)
        }

    def _build_insights(self, geo_data: Dict) -> List[Dict]:
        insights = []

        for geo_name, data in geo_data.items():
            avg_sentiment = float(np.mean(data['sentiments'])) if data['sentiments'] else 0.0
            avg_trust = float(np.mean(data['trust_scores'])) if data['trust_scores'] else 0.0

            top_topics = sorted(
                data['topics'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]

            insights.append({
                'name': geo_name,
                'article_count': data['count'],
                'avg_sentiment': avg_sentiment,
                'avg_trust': avg_trust,
                'top_topics': [
                    {'topic': topic, 'count': count}
                    for topic, count in top_topics
                ]
            })

        insights.sort(key=lambda x: x['article_count'], reverse=True)
        return insights
