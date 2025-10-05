def get_source_search_prompt(query: str, timeline_keywords: str) -> str:
    return f"""Generate 40 specific search instructions for: {query}

Include timeline keywords: {timeline_keywords}

Target these news sources with specific searches:
1-15: Middle East (Arab News, Gulf News, Al Arabiya, Middle East Eye, Middle East Monitor, Saudi Gazette, Okaz, Khaleej Times, Arab Times, Asharq Business, Al Riyadh, Aleqt, maaal, Saudi Press Agency, Zawya)
16-25: Think Tanks (Roosevelt Institute, Brookings, CSIS, Carnegie, Heritage Foundation, Rand, Aspen, IISS, EPI, CEPR)
26-35: Research (McKinsey, WEF, Peterson Institute, NBER, CGD, Urban Institute, WRI, World Bank)
36-40: Business News (Reuters, WSJ, Bloomberg, CNBC, Forbes, FT, Economic Times, Mint, S&P Global, BBC)

Return JSON:
[
  {{
    "search_query": "specific search combining query + source + timeline",
    "source_tier": "source name",
    "focus": "what to find"
  }}
]

CRITICAL: Return ONLY the JSON array."""


def get_single_search_prompt(instruction: dict) -> str:
    search_query = instruction.get('search_query', '')
    source_tier = instruction.get('source_tier', '')
    focus = instruction.get('focus', '')
    
    return f"""Search: {search_query}

Source: {source_tier}
Focus: {focus}

Find news articles. IMPORTANT: Extract the ACTUAL publication date from each article's content.

Look for publication dates in the article like:
- "Published: Mon 9 Jun 2025"
- "Posted: June 9, 2025" 
- "9 Jun 2025"
- Date stamps in the article header

Return JSON:
[
  {{
    "title": "Article title",
    "url": "https://...",
    "publisher": "Publisher",
    "year": "2025",
    "date": "2025-06-09",
    "summary": "Summary",
    "key_quote": "Quote",
    "source_tier": "{source_tier}"
  }}
]

CRITICAL: 
- Extract the REAL publication date from the article content
- Use format YYYY-MM-DD for dates
- Do NOT use placeholder dates like 2025-10-01
- If no date found, use "??" for the date field
- Return ONLY the JSON array."""


def get_enrichment_prompt(citations_batch: list) -> str:
    citations_text = "\n\n".join([
        f"[{i+1}] {c.get('title', '')} - {c.get('publisher', '')}\n{c.get('summary', '')}"
        for i, c in enumerate(citations_batch)
    ])
    
    return f"""Analyze these citations:

{citations_text}

For each citation, provide:
- trust_score: 0.0-1.0 (0.9-1.0=Reuters/BBC, 0.7-0.9=established, 0.5-0.7=trade, <0.5=blogs)
- sentiment_score: 0.0-1.0 (0=negative, 0.5=neutral, 1.0=positive)
- relevance_score: 0.0-1.0 (how relevant to query)

Return JSON array with {len(citations_batch)} objects:
[
  {{
    "trust_score": 0.9,
    "sentiment_score": 0.7,
    "relevance_score": 0.85
  }}
]

CRITICAL: Return ONLY the JSON array."""
