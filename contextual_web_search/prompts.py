"""
Prompts for Contextual Web Search
Strategy& PWC
"""

def get_query_elaboration_prompt(query: str) -> str:
    """Generate prompt for query elaboration into 30 source tiers."""
    
    return f"""
You are an expert research strategist specializing in comprehensive multi-source intelligence gathering. Take this user query and elaborate it into 30 highly specific web search instructions, each targeting a distinct source tier with detailed search strategies.

USER QUERY: {query}

Generate exactly 30 search instructions as JSON array. Each must target a DIFFERENT source tier with specific instructions:

SOURCE TIER CATEGORIES (use each once):
1. official_government_primary - Official government agencies, ministries, departments. Search terms: "official government", "ministry", "department", ".gov"
2. government_statistics_bureaus - National/regional statistical offices. Search terms: "statistics bureau", "statistical office", "census data", "official statistics"
3. international_organizations_un - UN family organizations (WHO, UNESCO, UNICEF, etc.). Search terms: "UN", "WHO", "UNESCO", "United Nations"
4. international_organizations_financial - World Bank, IMF, regional development banks. Search terms: "World Bank", "IMF", "development bank", "international finance"
5. international_organizations_oecd - OECD reports and analysis. Search terms: "OECD", "Organisation for Economic Co-operation"
6. peer_reviewed_nature_science - Nature, Science, Cell journals. Search terms: "Nature journal", "Science magazine", "Cell journal", "high-impact journal"
7. peer_reviewed_medical - Medical journals (NEJM, Lancet, BMJ, JAMA). Search terms: "New England Journal", "Lancet", "BMJ", "JAMA", "medical journal"
8. peer_reviewed_social_science - Social science journals (PNAS, Psychology, Sociology). Search terms: "PNAS", "social science journal", "psychology journal", "sociology research"
9. peer_reviewed_policy_journals - Policy-specific academic journals. Search terms: "policy journal", "public policy research", "governance journal"
10. peer_reviewed_domain_specific - Domain-specific academic journals relevant to query. Search terms: based on query domain + "journal", "research", "academic"
11. university_research_centers - University research institutes and centers. Search terms: "university research center", "academic research institute", "university study"
12. think_tanks_global - Major global think tanks (Brookings, CFR, Chatham House). Search terms: "Brookings", "Council on Foreign Relations", "Chatham House", "think tank"
13. think_tanks_regional - Regional policy institutes and think tanks. Search terms: "regional think tank", "policy institute", "research center"
14. professional_associations - Industry professional bodies and associations. Search terms: "professional association", "industry body", "professional organization"
15. regulatory_authorities - Regulatory agencies and oversight bodies. Search terms: "regulatory authority", "oversight body", "regulatory agency", "compliance"
16. central_banks_monetary - Central banks and monetary authorities. Search terms: "central bank", "monetary authority", "federal reserve", "bank policy"
17. industry_reports_consulting - McKinsey, Deloitte, PwC consulting reports. Search terms: "McKinsey", "Deloitte", "PwC", "consulting report", "industry analysis"
18. industry_reports_market_research - Market research firms (Gartner, IDC, etc.). Search terms: "market research", "industry report", "market analysis", "sector study"
19. industry_associations - Industry-specific trade associations. Search terms: "trade association", "industry association", "sector organization"
20. news_quality_international - High-quality international news (BBC, Reuters, AP). Search terms: "BBC", "Reuters", "Associated Press", "international news"
21. news_quality_business - Business news sources (WSJ, FT, Bloomberg). Search terms: "Wall Street Journal", "Financial Times", "Bloomberg", "business news"
22. news_specialized_trade - Trade publications and specialized news. Search terms: "trade publication", "industry news", "specialized media"
23. multilateral_development_banks - Regional development banks (ADB, AfDB, etc.). Search terms: "development bank", "multilateral bank", "regional bank"
24. ngo_advocacy_organizations - NGOs and advocacy groups. Search terms: "NGO", "non-profit organization", "advocacy group", "civil society"
25. policy_implementation_cases - Real-world policy implementation examples. Search terms: "policy implementation", "case study", "pilot project", "policy trial"
26. comparative_international_studies - Cross-country comparative analysis. Search terms: "comparative study", "international comparison", "cross-country analysis"
27. historical_policy_analysis - Historical perspective and longitudinal studies. Search terms: "historical analysis", "longitudinal study", "policy evolution", "over time"
28. emerging_trends_future - Future trends and emerging developments. Search terms: "future trends", "emerging", "2024", "2025", "latest developments"
29. quantitative_data_metrics - Statistical data and quantitative metrics. Search terms: "statistics", "data", "metrics", "numbers", "quantitative analysis"
30. implementation_barriers_challenges - Challenges, barriers, and implementation issues. Search terms: "challenges", "barriers", "problems", "obstacles", "difficulties"

FORMAT REQUIREMENTS:
[
  {{
    "search_query": "specific search terms combining query + source tier keywords",
    "source_tier": "exact tier name from above list",
    "focus": "what specific type of information to find from this source tier",
    "search_instructions": "detailed instructions on what to prioritize/reject for this source tier",
    "expected_source_types": ["list of expected source types"]
  }},
  ...
]

CRITICAL INSTRUCTIONS:
- Each search must target a DIFFERENT source tier from the list above
- Combine the user query with source-tier-specific keywords
- Provide detailed search instructions for each tier (what to prioritize/reject)
- Make search_query highly specific to both the user query AND the source tier
- Focus should be specific to what that source tier typically provides
- REJECT generic or low-quality sources that don't match the tier requirements

Generate exactly 30 searches covering all source tiers listed above.
"""


def get_single_search_prompt(instruction: dict) -> str:
    """Generate prompt for a single web search with source tier instructions."""
    
    search_query = instruction.get('search_query', '')
    focus = instruction.get('focus', '')
    source_tier = instruction.get('source_tier', '')
    search_instructions = instruction.get('search_instructions', '')
    expected_sources = instruction.get('expected_source_types', [])
    
    return f"""
TARGETED WEB SEARCH - SOURCE TIER: {source_tier.upper()}

Search Query: {search_query}
Focus: {focus}
Expected Source Types: {', '.join(expected_sources)}

SPECIFIC SEARCH INSTRUCTIONS:
{search_instructions}

Return results as JSON array with this exact format:
[
  {{
    "title": "Document title",
    "url": "https://example.com",
    "publisher": "Source name",
    "year": "2024",
    "doi": "DOI if available or empty string",
    "key_quote": "Most relevant excerpt",
    "summary": "Brief summary of relevance",
    "source_tier": "{source_tier}",
    "source_type": "type of source (e.g., government_report, academic_journal, etc.)"
  }}
]

CRITICAL: Follow the search instructions above strictly. Find 3-5 high-quality sources that match the specified source tier. REJECT sources that don't match the tier requirements. Return ONLY the JSON array, nothing else.
"""
