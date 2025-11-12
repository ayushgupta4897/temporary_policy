import json
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# ============================================================================
# CONSTANTS
# ============================================================================

# Thread pool configuration
MAX_ANALYTICS_WORKERS = 5

# Minimum articles threshold
MIN_ARTICLES_FOR_ANALYTICS = 5

# Status messages
STATUS_INSUFFICIENT_DATA = 'insufficient_data'
STATUS_SUCCESS = 'success'

# Analytics module names
MODULE_CLUSTERING = 'clustering'
MODULE_TRENDS = 'trends'
MODULE_ENTITIES = 'entities'
MODULE_GEO = 'geo'
MODULE_SENTIMENT = 'sentiment'

# Result field keys
FIELD_CLUSTER_COUNT = 'cluster_count'
FIELD_TOTAL_UNIQUE_ENTITIES = 'total_unique_entities'
FIELD_DATE_RANGE = 'date_range'
FIELD_TOTAL_REGIONS = 'total_regions'
FIELD_TOTAL_COUNTRIES = 'total_countries'

# Article field keys
FIELD_URL = 'url'
FIELD_TITLE = 'title'
FIELD_PUBLISHER = 'publisher'
FIELD_DATE = 'date'
FIELD_WORD_COUNT = 'word_count'
FIELD_FULL_TEXT = 'full_text'
FIELD_ORIGINAL_CITATION = 'original_citation'
FIELD_SENTIMENT_SCORE = 'sentiment_score'
FIELD_TRUST_SCORE = 'trust_score'
FIELD_TOPICS = 'topics'

# ============================================================================

try:
    from .content_scraper import ArticleContentScraper
    from .analytics import (
        ClusteringAnalyzer,
        TrendAnalyzer,
        EntityAnalyzer,
        GeoAnalyzer,
        SentimentTimelineAnalyzer
    )
except ImportError:
    from content_scraper import ArticleContentScraper
    from analytics import (
        ClusteringAnalyzer,
        TrendAnalyzer,
        EntityAnalyzer,
        GeoAnalyzer,
        SentimentTimelineAnalyzer
    )


class AnalyticsEngine:
    def __init__(self):
        self.scraper = ArticleContentScraper()
        self.clustering = ClusteringAnalyzer()
        self.trends = TrendAnalyzer()
        self.entities = EntityAnalyzer()
        self.geo = GeoAnalyzer()
        self.sentiment = SentimentTimelineAnalyzer()

    def run_full_analytics(self, citations: List[Dict]) -> Dict:
        start_time = datetime.utcnow()

        print(f"[Analytics] Scraping content for {len(citations)} articles...")
        articles = self.scraper.scrape_articles(citations)
        print(f"[Analytics] Successfully scraped {len(articles)} articles")

        if len(articles) < MIN_ARTICLES_FOR_ANALYTICS:
            return {
                'status': STATUS_INSUFFICIENT_DATA,
                'articles_scraped': len(articles),
                'message': 'Not enough articles scraped for meaningful analytics'
            }

        print(f"[Analytics] Running analytics modules in parallel...")
        results = {}

        with ThreadPoolExecutor(max_workers=MAX_ANALYTICS_WORKERS) as executor:
            futures = {
                executor.submit(self.clustering.analyze, articles): MODULE_CLUSTERING,
                executor.submit(self.trends.analyze, articles): MODULE_TRENDS,
                executor.submit(self.entities.analyze, articles): MODULE_ENTITIES,
                executor.submit(self.geo.analyze, articles): MODULE_GEO,
                executor.submit(self.sentiment.analyze, articles): MODULE_SENTIMENT
            }

            for future in as_completed(futures):
                module_name = futures[future]
                result = future.result()
                results[module_name] = result
                print(f"[Analytics] Completed {module_name} analysis")

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        summary_stats = self._generate_summary(articles, results)

        return {
            'status': STATUS_SUCCESS,
            'timestamp': end_time.isoformat(),
            'processing_time_seconds': duration,
            'articles_scraped': len(articles),
            'total_citations': len(citations),
            'summary': summary_stats,
            MODULE_CLUSTERING: results.get(MODULE_CLUSTERING, {}),
            MODULE_TRENDS: results.get(MODULE_TRENDS, {}),
            MODULE_ENTITIES: results.get(MODULE_ENTITIES, {}),
            MODULE_GEO: results.get(MODULE_GEO, {}),
            MODULE_SENTIMENT: results.get(MODULE_SENTIMENT, {}),
            'articles': self._prepare_articles_export(articles)
        }

    def _generate_summary(self, articles: Dict, results: Dict) -> Dict:
        return {
            'total_articles_analyzed': len(articles),
            'total_words': sum(a.get(FIELD_WORD_COUNT, 0) for a in articles.values()),
            'avg_article_length': int(sum(a.get(FIELD_WORD_COUNT, 0) for a in articles.values()) / len(articles)) if articles else 0,
            'clusters_found': results.get(MODULE_CLUSTERING, {}).get(FIELD_CLUSTER_COUNT, 0),
            'unique_entities': results.get(MODULE_ENTITIES, {}).get(FIELD_TOTAL_UNIQUE_ENTITIES, 0),
            'date_range': results.get(MODULE_TRENDS, {}).get(FIELD_DATE_RANGE, {}),
            'regions_covered': results.get(MODULE_GEO, {}).get(FIELD_TOTAL_REGIONS, 0),
            'countries_covered': results.get(MODULE_GEO, {}).get(FIELD_TOTAL_COUNTRIES, 0)
        }

    def _prepare_articles_export(self, articles: Dict) -> Dict:
        export = {}
        for hash_key, article in articles.items():
            export[hash_key] = {
                FIELD_URL: article.get(FIELD_URL),
                FIELD_TITLE: article.get(FIELD_TITLE),
                FIELD_PUBLISHER: article.get(FIELD_PUBLISHER),
                FIELD_DATE: article.get(FIELD_DATE),
                FIELD_WORD_COUNT: article.get(FIELD_WORD_COUNT),
                FIELD_FULL_TEXT: article.get(FIELD_FULL_TEXT),
                'sentiment': article.get(FIELD_ORIGINAL_CITATION, {}).get(FIELD_SENTIMENT_SCORE),
                'trust': article.get(FIELD_ORIGINAL_CITATION, {}).get(FIELD_TRUST_SCORE),
                'topics': article.get(FIELD_ORIGINAL_CITATION, {}).get(FIELD_TOPICS, [])
            }
        return export
