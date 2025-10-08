from typing import Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np


class ClusteringAnalyzer:
    def __init__(self, n_clusters: int = 8, max_features: int = 500):
        self.n_clusters = n_clusters
        self.max_features = max_features
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            stop_words='english',
            min_df=2,
            max_df=0.8,
            ngram_range=(1, 2)
        )

    def analyze(self, articles: Dict[str, Dict]) -> Dict:
        if len(articles) < self.n_clusters:
            n_clusters = max(2, len(articles) // 3)
        else:
            n_clusters = self.n_clusters

        texts = []
        article_keys = []

        for key, article in articles.items():
            text = article.get('full_text', '')
            if text and len(text) > 100:
                texts.append(text)
                article_keys.append(key)

        if len(texts) < 2:
            return {
                'clusters': [],
                'cluster_count': 0,
                'articles_clustered': 0
            }

        tfidf_matrix = self.vectorizer.fit_transform(texts)

        kmeans = KMeans(n_clusters=min(n_clusters, len(texts)), random_state=42, n_init=10)
        clusters = kmeans.fit_predict(tfidf_matrix)

        feature_names = self.vectorizer.get_feature_names_out()

        cluster_data = []
        for i in range(n_clusters):
            cluster_indices = np.where(clusters == i)[0]

            if len(cluster_indices) == 0:
                continue

            center = kmeans.cluster_centers_[i]
            top_indices = center.argsort()[-10:][::-1]
            top_keywords = [feature_names[idx] for idx in top_indices]

            articles_in_cluster = [article_keys[idx] for idx in cluster_indices]

            avg_sentiment = np.mean([
                articles[key]['original_citation'].get('sentiment_score', 0)
                for key in articles_in_cluster
                if key in articles
            ])

            cluster_data.append({
                'cluster_id': int(i),
                'size': int(len(cluster_indices)),
                'keywords': top_keywords[:8],
                'article_hashes': articles_in_cluster[:20],
                'avg_sentiment': float(avg_sentiment)
            })

        cluster_data.sort(key=lambda x: x['size'], reverse=True)

        return {
            'clusters': cluster_data,
            'cluster_count': len(cluster_data),
            'articles_clustered': len(texts),
            'total_articles': len(articles)
        }
