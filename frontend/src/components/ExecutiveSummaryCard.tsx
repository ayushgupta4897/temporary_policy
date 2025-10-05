'use client';

import { ExecutiveSummary } from '@/types';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummary;
}

export default function ExecutiveSummaryCard({ summary }: ExecutiveSummaryCardProps) {
  return (
    <div className="neural-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-100">Executive Summary</h3>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="capitalize">{summary.level}</span>
          <span>•</span>
          <span>{summary.geography}</span>
          <span>•</span>
          <span>{summary.citation_count} sources</span>
        </div>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {summary.summary}
        </div>
      </div>
    </div>
  );
}

