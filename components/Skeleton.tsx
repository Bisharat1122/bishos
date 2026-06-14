import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

/** A card-shaped placeholder with a few shimmer lines. */
export function CardSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5", className)}>
      <Skeleton className="mb-3 h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("mb-2 h-3", i % 2 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Animated AI typing dots for pending AI states. */
export function AiDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-primary", className)}>
      <span className="ai-dot" style={{ animationDelay: "0ms" }} />
      <span className="ai-dot" style={{ animationDelay: "150ms" }} />
      <span className="ai-dot" style={{ animationDelay: "300ms" }} />
    </span>
  );
}

export function DetailSkeleton() {
  return (
    <div className="px-4 py-7 sm:px-8">
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="mt-3 h-8 w-1/2" />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}
