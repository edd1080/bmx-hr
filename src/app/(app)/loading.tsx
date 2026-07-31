export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-border/60" />
          <div className="h-7 w-56 rounded-md bg-border/80" />
        </div>
        <div className="h-10 w-36 rounded-lg bg-border/60" />
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="h-3.5 w-24 rounded bg-border/60" />
            <div className="h-8 w-16 rounded bg-border/80" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="rounded-2xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-divider pb-4">
          <div className="h-5 w-40 rounded bg-border/70" />
          <div className="h-9 w-28 rounded-lg bg-border/60" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-page/80" />
          ))}
        </div>
      </div>
    </div>
  );
}
