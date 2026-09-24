import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("empty-state", className)}>
      {icon && (
        <span
          className="mb-1 text-[var(--aurak-text-subtle)]"
          aria-hidden
        >
          {icon}
        </span>
      )}

      <p className="section-title">{title}</p>

      {description && (
        <p className="meta-text max-w-sm">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}