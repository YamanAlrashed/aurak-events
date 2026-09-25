import { cn } from "@/lib/utils/cn";

export interface DetailItem {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}

export function DetailList({
  items,
  className,
}: {
  items: DetailItem[];
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-4 sm:grid-cols-2", className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn("min-w-0", item.wide && "sm:col-span-2")}
        >
          <dt className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--aurak-text-muted)]">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm text-[var(--aurak-text)]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}