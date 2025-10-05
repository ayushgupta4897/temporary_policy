'use client';

import { FC } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: string;
  height?: string;
  count?: number;
}

export const Skeleton: FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'text',
  width = 'w-full',
  height = 'h-4',
  count = 1
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'card':
        return 'rounded-lg h-48';
      case 'rect':
        return 'rounded-md';
      default:
        return 'rounded';
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`
        ${width} ${height} ${getVariantClasses()} ${className}
        bg-gradient-to-r from-dark-600/50 via-dark-500/50 to-dark-600/50
        animate-shimmer bg-[length:200%_100%]
        ${i > 0 ? 'mt-2' : ''}
      `}
    />
  ));

  return <>{skeletons}</>;
};

// Query List Skeleton
export const QueryListSkeleton: FC = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className={`p-5 rounded-xl border border-gradient-from/20 bg-dark-700/50 animate-stagger stagger-${i}`}
      >
        <div className="flex items-start gap-3">
          <Skeleton variant="circle" width="w-2" height="h-2" className="mt-2" />
          <div className="flex-1">
            <Skeleton className="mb-3" width="w-3/4" />
            <div className="flex items-center justify-between">
              <Skeleton width="w-20" height="h-6" />
              <Skeleton width="w-24" height="h-3" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Report Content Skeleton
export const ReportSkeleton: FC = () => (
  <div className="space-y-6 animate-fade-in">
    <Skeleton height="h-8" width="w-2/3" className="mb-4" />
    <Skeleton count={3} />
    <Skeleton height="h-32" className="mt-6" />
    <div className="grid grid-cols-2 gap-4 mt-6">
      <Skeleton height="h-24" />
      <Skeleton height="h-24" />
    </div>
    <Skeleton count={4} className="mt-6" />
  </div>
);

// Card Skeleton
export const CardSkeleton: FC = () => (
  <div className="pwc-card p-6 animate-fade-in">
    <Skeleton height="h-6" width="w-1/3" className="mb-4" />
    <Skeleton count={2} className="mb-2" />
    <Skeleton width="w-2/3" />
  </div>
);

// Default export for NewsScrapeViewer
export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-dark-600/40 rounded-xl border border-dark-400/40 p-6 animate-pulse">
          <div className="flex gap-5">
            <div className="w-48 h-32 bg-dark-500/50 rounded-xl flex-shrink-0"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-dark-500/50 rounded w-3/4"></div>
              <div className="h-3 bg-dark-500/50 rounded w-1/2"></div>
              <div className="h-3 bg-dark-500/50 rounded w-full"></div>
              <div className="h-3 bg-dark-500/50 rounded w-2/3"></div>
              <div className="flex gap-4 pt-4">
                <div className="h-2 bg-dark-500/50 rounded w-20"></div>
                <div className="h-2 bg-dark-500/50 rounded w-20"></div>
                <div className="h-2 bg-dark-500/50 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
