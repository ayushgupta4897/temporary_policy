from typing import Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
import numpy as np

# ============================================================================
# CONSTANTS
# ============================================================================

# Clustering Configuration
DEFAULT_N_CLUSTERS = 8
DEFAULT_MAX_FEATURES = 500
MIN_CLUSTER_RATIO = 3
MIN_CLUSTERS = 2

# TF-IDF Configuration
TFIDF_STOP_WORDS = 'english'
TFIDF_MIN_DF = 2
TFIDF_MAX_DF = 0.8
TFIDF_NGRAM_MIN = 1
TFIDF_NGRAM_MAX = 2

# Text Processing
MIN_TEXT_LENGTH = 100
MIN_TEXTS_FOR_CLUSTERING = 2

# K-Means Configuration
KMEANS_RANDOM_STATE = 42
KMEANS_N_INIT = 10

# Output Limits
TOP_KEYWORDS_COUNT = 10
MAX_KEYWORDS_PER_CLUSTER = 8
MAX_ARTICLES_PER_CLUSTER = 20

# ============================================================================


class ClusteringAnalyzer:
    def __init__(self, n_clusters: int = DEFAULT_N_CLUSTERS, max_features: int = DEFAULT_MAX_FEATURES):
        self.n_clusters = n_clusters
        self.max_features = max_features
        self.vectorizer = TfidfVectorizer(
            max_features=max_features,
            stop_words=TFIDF_STOP_WORDS,
            min_df=TFIDF_MIN_DF,
            max_df=TFIDF_MAX_DF,
            ngram_range=(TFIDF_NGRAM_MIN, TFIDF_NGRAM_MAX)
        )

    def analyze(self, articles: Dict[str, Dict]) -> Dict:
        if len(articles) < self.n_clusters:
            n_clusters = max(MIN_CLUSTERS, len(articles) // MIN_CLUSTER_RATIO)
        else:
            n_clusters = self.n_clusters

        texts = []
        article_keys = []

        for key, article in articles.items():
            text = article.get('full_text', '')
            if text and len(text) > MIN_TEXT_LENGTH:
                texts.append(text)
                article_keys.append(key)

        if len(texts) < MIN_TEXTS_FOR_CLUSTERING:
            return {
                'clusters': [],
                'cluster_count': 0,
                'articles_clustered': 0
            }

        tfidf_matrix = self.vectorizer.fit_transform(texts)

        kmeans = KMeans(n_clusters=min(n_clusters, len(texts)), random_state=KMEANS_RANDOM_STATE, n_init=KMEANS_N_INIT)
        clusters = kmeans.fit_predict(tfidf_matrix)

        feature_names = self.vectorizer.get_feature_names_out()

        cluster_data = []
        for i in range(n_clusters):
            cluster_indices = np.where(clusters == i)[0]

            if len(cluster_indices) == 0:
                continue

            center = kmeans.cluster_centers_[i]
            top_indices = center.argsort()[-TOP_KEYWORDS_COUNT:][::-1]
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
                'keywords': top_keywords[:MAX_KEYWORDS_PER_CLUSTER],
                'article_hashes': articles_in_cluster[:MAX_ARTICLES_PER_CLUSTER],
                'avg_sentiment': float(avg_sentiment)
            })

        cluster_data.sort(key=lambda x: x['size'], reverse=True)

        return {
            'clusters': cluster_data,
            'cluster_count': len(cluster_data),
            'articles_clustered': len(texts),
            'total_articles': len(articles)
        }
