import { cn } from "@/lib/utils/cn";

export function Card({
  interactive = false,
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "card",
        interactive && "card-interactive",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  actions,
  className,
}: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-header", className)}>
      <span className="card-title">{title}</span>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("card-pad", className)}>
      {children}
    </div>
  );
}