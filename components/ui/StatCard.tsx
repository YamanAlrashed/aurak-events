import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  caption,
  icon,
  className,
}: {
  label: string;
  value: number | string;
  caption?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="stat-label">{label}</p>

        {icon && (
          <span
            className="text-[var(--aurak-text-subtle)]"
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      <p className="stat-value">
        {typeof value === "number"
          ? formatNumber(value)
          : value}
      </p>

      {caption && (
        <p className="stat-caption">{caption}</p>
      )}
    </div>
  );
}