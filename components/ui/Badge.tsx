import { cn } from "@/lib/utils/cn";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  neutral: "badge-neutral",
  brand: "badge-brand",
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
}: {
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("badge", VARIANT_CLASS[variant], className)}>
      {dot && <span className="badge-dot" aria-hidden />}
      {children}
    </span>
  );
}

export function RawBadge({
  badgeClass,
  dot = false,
  className,
  children,
}: {
  badgeClass: string;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("badge", badgeClass, className)}>
      {dot && <span className="badge-dot" aria-hidden />}
      {children}
    </span>
  );
}