'use client';

import { NewsCitation } from '@/types';
import ScoreMeter from './ScoreMeter';
import { NEWS_SCRAPE_THEME } from '@/config/theme';

interface NewsCitationCardProps {
  citation: NewsCitation;
}

export default function NewsCitationCard({ citation }: NewsCitationCardProps) {
  const getSentimentColor = (score?: number): 'blue' | 'green' | 'orange' => {
    if (!score) return 'blue';
    if (score >= 0.6) return 'green';
    if (score >= 0.4) return 'orange';
    return 'orange';
  };

  const CARD = NEWS_SCRAPE_THEME.CITATION_CARD;
  const TAGS = NEWS_SCRAPE_THEME.TAG_COLORS;
  const ARTICLE = NEWS_SCRAPE_THEME.ARTICLE_TYPE;
  const DATE = NEWS_SCRAPE_THEME.DATE_BADGE;
  const HIERARCHY = NEWS_SCRAPE_THEME.HIERARCHY_BADGE;

  return (
    <div className={`${CARD.BACKGROUND} ${CARD.ROUNDED} overflow-hidden ${CARD.BORDER_WIDTH} ${CARD.BORDER} ${CARD.HOVER_BORDER} ${CARD.HOVER_BG} ${CARD.TRANSITION}`}>
      
      <div className={`flex ${citation.image_url ? 'flex-row' : 'flex-col'} gap-5 p-6`}>
        {citation.image_url && (
          <div className="flex-shrink-0 w-48 h-32 rounded-xl overflow-hidden bg-dark-500/50 border border-dark-400/30">
            <img 
              src={citation.image_url} 
              alt={citation.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <a 
                href={citation.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group/link"
              >
                <h4 className="text-base font-semibold text-gray-100 leading-snug mb-2 group-hover/link:text-gradient-from transition-colors">
                  {citation.title}
                </h4>
              </a>
              
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-medium text-strategyand-accent">{citation.publisher}</span>

                {citation.author && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-300">{citation.author}</span>
                  </>
                )}

                {citation.article_type && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className={`px-2 py-0.5 text-xs ${ARTICLE.bg} ${ARTICLE.text} rounded border ${ARTICLE.border}`}>
                      {citation.article_type.replace(/_/g, ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className={`text-xs font-mono ${DATE.text} ${DATE.bg} px-2 py-1 rounded`}>
                {citation.date || citation.year}
              </span>

              {(citation.hierarchy_level || citation.country || citation.region) && (
                <div className="flex items-center gap-1.5 text-xs">
                  {citation.hierarchy_level && (
                    <span className={`px-2 py-0.5 ${HIERARCHY.bg} ${HIERARCHY.text} rounded capitalize`}>
                      {citation.hierarchy_level}
                    </span>
                  )}
                  {citation.country && (
                    <span className="text-gray-500">{citation.country}</span>
                  )}
                  {citation.region && !citation.country && (
                    <span className="text-gray-500">{citation.region}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-300 leading-relaxed">
            {citation.summary}
          </p>

          {(citation.region || citation.country || citation.topics || citation.industry) && (
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(citation.region) ? citation.region : citation.region ? [citation.region] : []).map((r: string) => (
                <span key={r} className={`px-2 py-1 ${TAGS.REGION.bg} ${TAGS.REGION.text} border ${TAGS.REGION.border} rounded-md text-xs`}>
                  {r}
                </span>
              ))}
              {(Array.isArray(citation.country) ? citation.country : citation.country ? [citation.country] : []).map((c: string) => (
                <span key={c} className={`px-2 py-1 ${TAGS.COUNTRY.bg} ${TAGS.COUNTRY.text} border ${TAGS.COUNTRY.border} rounded-md text-xs`}>
                  {c}
                </span>
              ))}
              {citation.topics?.map((t: string) => (
                <span key={t} className={`px-2 py-1 ${TAGS.TOPICS.bg} ${TAGS.TOPICS.text} border ${TAGS.TOPICS.border} rounded-md text-xs`}>
                  {t}
                </span>
              ))}
              {citation.industry?.map((i: string) => (
                <span key={i} className={`px-2 py-1 ${TAGS.INDUSTRY.bg} ${TAGS.INDUSTRY.text} border ${TAGS.INDUSTRY.border} rounded-md text-xs`}>
                  {i}
                </span>
              ))}
            </div>
          )}

          {citation.key_quote && (
            <div className="relative pl-4 py-2">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-strategyand-accent/60 rounded-full" />
              <p className="text-sm text-gray-400 italic leading-relaxed">
                "{citation.key_quote}"
              </p>
            </div>
          )}

          {(citation.sentiment_score !== undefined || citation.trust_score !== undefined || citation.relevance_score !== undefined) && (
            <div className="flex items-center gap-4 pt-4 border-t border-dark-400/20">
              {citation.trust_score !== undefined && (
                <ScoreMeter 
                  score={citation.trust_score} 
                  label="Trust"
                  color="blue"
                />
              )}
              {citation.sentiment_score !== undefined && (
                <ScoreMeter 
                  score={citation.sentiment_score} 
                  label="Sentiment"
                  color={getSentimentColor(citation.sentiment_score)}
                />
              )}
              {citation.relevance_score !== undefined && (
                <ScoreMeter 
                  score={citation.relevance_score} 
                  label="Relevance"
                  color="green"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
