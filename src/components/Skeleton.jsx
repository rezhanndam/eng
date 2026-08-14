export default function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-100 dark:bg-slate-700/60 rounded-lg ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 7 }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mt-6 p-5">
      <div className="flex items-center justify-between mb-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-56" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-5 py-3 border-b border-slate-100 dark:border-slate-700/60">
          <Skeleton className="h-4 w-4" />
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3.5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-3.5 h-3.5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48 mb-4" />
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
