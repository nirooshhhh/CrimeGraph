import React from 'react';

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-card p-5 animate-pulse">
          <div className="h-4 bg-surface-raised rounded w-1/3 mb-3" />
          <div className="h-8 bg-surface-raised rounded w-1/2 mb-2" />
          <div className="h-3 bg-surface-raised rounded w-2/3" />
        </div>
      ))}
    </>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => {
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden p-4 space-y-3 animate-pulse">
      <div className="h-9 bg-surface-raised rounded-lg w-1/3 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-surface-raised/60 rounded" />
      ))}
    </div>
  );
};
