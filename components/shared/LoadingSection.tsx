import { cn } from "@/lib/utils/cn";

export function LoadingSection({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card card-pad space-y-2.5">
          <div className="skeleton h-4 w-1/3" />
          <div className="skeleton h-3 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function LoadingStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="stat-card space-y-2">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-7 w-16" />
        </div>
      ))}
    </div>
  );
}