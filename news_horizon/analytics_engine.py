import json
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

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

        if len(articles) < 5:
            return {
                'status': 'insufficient_data',
                'articles_scraped': len(articles),
                'message': 'Not enough articles scraped for meaningful analytics'
            }

        print(f"[Analytics] Running analytics modules in parallel...")
        results = {}

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(self.clustering.analyze, articles): 'clustering',
                executor.submit(self.trends.analyze, articles): 'trends',
                executor.submit(self.entities.analyze, articles): 'entities',
                executor.submit(self.geo.analyze, articles): 'geo',
                executor.submit(self.sentiment.analyze, articles): 'sentiment'
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
            'status': 'success',
            'timestamp': end_time.isoformat(),
            'processing_time_seconds': duration,
            'articles_scraped': len(articles),
            'total_citations': len(citations),
            'summary': summary_stats,
            'clustering': results.get('clustering', {}),
            'trends': results.get('trends', {}),
            'entities': results.get('entities', {}),
            'geo': results.get('geo', {}),
            'sentiment': results.get('sentiment', {}),
            'articles': self._prepare_articles_export(articles)
        }

    def _generate_summary(self, articles: Dict, results: Dict) -> Dict:
        return {
            'total_articles_analyzed': len(articles),
            'total_words': sum(a.get('word_count', 0) for a in articles.values()),
            'avg_article_length': int(sum(a.get('word_count', 0) for a in articles.values()) / len(articles)) if articles else 0,
            'clusters_found': results.get('clustering', {}).get('cluster_count', 0),
            'unique_entities': results.get('entities', {}).get('total_unique_entities', 0),
            'date_range': results.get('trends', {}).get('date_range', {}),
            'regions_covered': results.get('geo', {}).get('total_regions', 0),
            'countries_covered': results.get('geo', {}).get('total_countries', 0)
        }

    def _prepare_articles_export(self, articles: Dict) -> Dict:
        export = {}
        for hash_key, article in articles.items():
            export[hash_key] = {
                'url': article.get('url'),
                'title': article.get('title'),
                'publisher': article.get('publisher'),
                'date': article.get('date'),
                'word_count': article.get('word_count'),
                'full_text': article.get('full_text'),
                'sentiment': article.get('original_citation', {}).get('sentiment_score'),
                'trust': article.get('original_citation', {}).get('trust_score'),
                'topics': article.get('original_citation', {}).get('topics', [])
            }
        return export
