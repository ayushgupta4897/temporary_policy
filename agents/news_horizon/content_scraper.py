import hashlib
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import trafilatura
import requests
from datetime import datetime

# ============================================================================
# CONSTANTS
# ============================================================================

# Thread pool configuration
MAX_WORKERS = 10
REQUEST_TIMEOUT = 15

# User agent string
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

# Scraping thresholds
MIN_TEXT_LENGTH = 50

# Trafilatura extraction settings
INCLUDE_COMMENTS = False
INCLUDE_TABLES = False
NO_FALLBACK = False

# Default language
DEFAULT_LANGUAGE = 'en'

# Error types
ERROR_TOO_SHORT = 'too_short'

# Citation field keys
FIELD_URL = 'url'
FIELD_TITLE = 'title'
FIELD_PUBLISHER = 'publisher'
FIELD_DATE = 'date'
FIELD_SUMMARY = 'summary'
FIELD_KEY_QUOTE = 'key_quote'
FIELD_TRUST_SCORE = 'trust_score'
FIELD_SENTIMENT_SCORE = 'sentiment_score'
FIELD_RELEVANCE_SCORE = 'relevance_score'
FIELD_REGION = 'region'
FIELD_COUNTRY = 'country'
FIELD_TOPICS = 'topics'
FIELD_INDUSTRY = 'industry'

# ============================================================================


class ArticleContentScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': USER_AGENT
        })

    def scrape_articles(self, citations: List[Dict]) -> Dict[str, Dict]:
        results = {}
        failed_count = 0
        short_count = 0

        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            future_to_citation = {
                executor.submit(self._scrape_single, citation): citation
                for citation in citations if citation.get(FIELD_URL)
            }

            for future in as_completed(future_to_citation):
                citation = future_to_citation[future]
                result = future.result()
                if result:
                    if result.get('error') == ERROR_TOO_SHORT:
                        short_count += 1
                    else:
                        article_hash = self._hash_url(citation[FIELD_URL])
                        results[article_hash] = result
                else:
                    failed_count += 1

        print(f"[Scraper] Success: {len(results)}, Failed: {failed_count}, Too short: {short_count}")
        return results

    def _scrape_single(self, citation: Dict) -> Optional[Dict]:
        url = citation.get(FIELD_URL)
        if not url:
            return None

        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return None

        text = trafilatura.extract(
            downloaded,
            include_comments=INCLUDE_COMMENTS,
            include_tables=INCLUDE_TABLES,
            no_fallback=NO_FALLBACK
        )

        if not text or len(text) < MIN_TEXT_LENGTH:
            return {'error': ERROR_TOO_SHORT} if text and len(text) < MIN_TEXT_LENGTH else None

        metadata = trafilatura.extract_metadata(downloaded)

        return {
            FIELD_URL: url,
            'article_hash': self._hash_url(url),
            'full_text': text,
            'word_count': len(text.split()),
            'char_count': len(text),
            'scraped_at': datetime.utcnow().isoformat(),
            FIELD_TITLE: citation.get(FIELD_TITLE) or (metadata.title if metadata else None),
            FIELD_PUBLISHER: citation.get(FIELD_PUBLISHER) or (metadata.sitename if metadata else None),
            FIELD_DATE: citation.get(FIELD_DATE) or (metadata.date if metadata else None),
            'authors': metadata.author if metadata and metadata.author else None,
            'description': metadata.description if metadata else None,
            'language': metadata.language if metadata else DEFAULT_LANGUAGE,
            'original_citation': {
                FIELD_SUMMARY: citation.get(FIELD_SUMMARY),
                FIELD_KEY_QUOTE: citation.get(FIELD_KEY_QUOTE),
                FIELD_TRUST_SCORE: citation.get(FIELD_TRUST_SCORE),
                FIELD_SENTIMENT_SCORE: citation.get(FIELD_SENTIMENT_SCORE),
                FIELD_RELEVANCE_SCORE: citation.get(FIELD_RELEVANCE_SCORE),
                FIELD_REGION: citation.get(FIELD_REGION),
                FIELD_COUNTRY: citation.get(FIELD_COUNTRY),
                FIELD_TOPICS: citation.get(FIELD_TOPICS, []),
                FIELD_INDUSTRY: citation.get(FIELD_INDUSTRY, [])
            }
        }

    def _hash_url(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()
