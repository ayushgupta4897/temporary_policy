import hashlib
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import trafilatura
import requests
from datetime import datetime


class ArticleContentScraper:
    MAX_WORKERS = 10
    TIMEOUT = 15

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })

    def scrape_articles(self, citations: List[Dict]) -> Dict[str, Dict]:
        results = {}
        failed_count = 0
        short_count = 0

        with ThreadPoolExecutor(max_workers=self.MAX_WORKERS) as executor:
            future_to_citation = {
                executor.submit(self._scrape_single, citation): citation
                for citation in citations if citation.get('url')
            }

            for future in as_completed(future_to_citation):
                citation = future_to_citation[future]
                result = future.result()
                if result:
                    if result.get('error') == 'too_short':
                        short_count += 1
                    else:
                        article_hash = self._hash_url(citation['url'])
                        results[article_hash] = result
                else:
                    failed_count += 1

        print(f"[Scraper] Success: {len(results)}, Failed: {failed_count}, Too short: {short_count}")
        return results

    def _scrape_single(self, citation: Dict) -> Optional[Dict]:
        url = citation.get('url')
        if not url:
            return None

        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return None

        text = trafilatura.extract(
            downloaded,
            include_comments=False,
            include_tables=False,
            no_fallback=False
        )

        if not text or len(text) < 50:
            return {'error': 'too_short'} if text and len(text) < 50 else None

        metadata = trafilatura.extract_metadata(downloaded)

        return {
            'url': url,
            'article_hash': self._hash_url(url),
            'full_text': text,
            'word_count': len(text.split()),
            'char_count': len(text),
            'scraped_at': datetime.utcnow().isoformat(),
            'title': citation.get('title') or (metadata.title if metadata else None),
            'publisher': citation.get('publisher') or (metadata.sitename if metadata else None),
            'date': citation.get('date') or (metadata.date if metadata else None),
            'authors': metadata.author if metadata and metadata.author else None,
            'description': metadata.description if metadata else None,
            'language': metadata.language if metadata else 'en',
            'original_citation': {
                'summary': citation.get('summary'),
                'key_quote': citation.get('key_quote'),
                'trust_score': citation.get('trust_score'),
                'sentiment_score': citation.get('sentiment_score'),
                'relevance_score': citation.get('relevance_score'),
                'region': citation.get('region'),
                'country': citation.get('country'),
                'topics': citation.get('topics', []),
                'industry': citation.get('industry', [])
            }
        }

    def _hash_url(self, url: str) -> str:
        return hashlib.md5(url.encode()).hexdigest()
