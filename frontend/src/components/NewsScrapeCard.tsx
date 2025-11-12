'use client';

import { NewsScrapeQuery } from '@/types';
import { NEWS_SCRAPE_THEME } from '@/config/theme';

interface NewsScrapeCardProps {
  scrape: NewsScrapeQuery;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export default function NewsScrapeCard({ scrape, isSelected, onClick, onDelete }: NewsScrapeCardProps) {
  const CARD = NEWS_SCRAPE_THEME.QUERY_CARD;
  const STATUS = NEWS_SCRAPE_THEME.STATUS_BADGES;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const getStatusBadge = () => {
    const statusMap: { [key: string]: typeof STATUS.COMPLETE } = {
      'done': STATUS.COMPLETE,
      'processing': STATUS.RUNNING,
      'failed': STATUS.ERROR,
    };

    const config = statusMap[scrape.status] || STATUS.ERROR;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`${CARD.ROUNDED} p-4 cursor-pointer group ${CARD.TRANSITION} ${
        isSelected
          ? `${CARD.SELECTED_BG} ${CARD.SELECTED_BORDER_WIDTH} ${CARD.SELECTED_BORDER}`
          : `${CARD.BACKGROUND} ${CARD.BORDER_WIDTH} ${CARD.BORDER} ${CARD.HOVER_BG} ${CARD.HOVER_BORDER}`
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-medium text-sm flex-1 mr-2 text-white">
          {scrape.query}
        </h3>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-dark-600 rounded transition-all"
            title="Delete query"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-gray-400 text-xs mb-2">
        {formatDate(scrape.createdAt)}
      </p>

      {scrape.status === 'done' && (
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{scrape.totalCitations || 0} citations</span>
          </div>
        </div>
      )}
      
      {scrape.timeline && (
        <p className="text-gray-500 text-xs mt-2">
          Timeline: {scrape.timeline.replace(/_/g, ' ').replace(/last/, 'Last')}
        </p>
      )}
    </div>
  );
}

export { NewsScrapeCard };

