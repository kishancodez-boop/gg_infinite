export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-[#DCE6DF]/65 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      aria-label="Loading content"
      role="status"
      className="bg-white border border-[#DCE6DF] rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

