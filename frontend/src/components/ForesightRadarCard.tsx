'use client';

import { FC } from 'react';
import { ForesightRadarQuery } from '@/types';

interface ForesightRadarCardProps {
  radar: ForesightRadarQuery;
  onClick: () => void;
  onDelete?: () => void;
}

const ForesightRadarCard: FC<ForesightRadarCardProps> = ({ radar, onClick, onDelete }) => {
  const getStatusColor = () => {
    switch (radar.status) {
      case 'done': return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
      case 'processing': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
      case 'failed': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
      default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
    }
  };

  const statusColor = getStatusColor();

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#0f1419]/40 backdrop-blur-xl border border-[#ff6b9d]/20 rounded-2xl p-6 hover:border-[#ff6b9d]/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor.bg} ${statusColor.border} ${statusColor.text}`}>
          {radar.status.charAt(0).toUpperCase() + radar.status.slice(1)}
        </div>
        {radar.durationMinutes && (
          <span className="text-xs text-[#9fa8da]">{radar.durationMinutes} min</span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-[#e8eaf6] mb-2 group-hover:text-[#ff6b9d] transition-colors leading-snug">
        {radar.displayTitle || radar.query}
      </h3>

      {radar.status === 'done' && (
        <div className="flex items-center gap-4 text-sm text-[#9fa8da] mt-4">
          {radar.signalsCount !== undefined && (
            <span>{radar.signalsCount} signals</span>
          )}
          {radar.scenariosCount !== undefined && (
            <>
              <span>•</span>
              <span>{radar.scenariosCount} scenarios</span>
            </>
          )}
        </div>
      )}

      {radar.status === 'processing' && (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-[#9fa8da]">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Analyzing STEEP-G dimensions...
          </div>
        </div>
      )}

      {radar.status === 'failed' && radar.errorMessage && (
        <p className="mt-4 text-sm text-red-400 line-clamp-2">{radar.errorMessage}</p>
      )}

      <div className="mt-4 pt-4 border-t border-[#ff6b9d]/20 flex items-center justify-between text-xs text-[#9fa8da]">
        <span>{new Date(radar.createdAt).toLocaleDateString()}</span>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-400 hover:text-red-300 transition-colors font-semibold"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default ForesightRadarCard;
