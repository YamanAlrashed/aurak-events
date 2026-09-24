import type { EventStatus, ISODate, TimeString } from "@/lib/types";
import { RawBadge } from "@/components/ui/Badge";
import {
  EVENT_STATUS_BADGE_CLASS,
  EVENT_STATUS_LABELS,
} from "@/lib/utils/constants";
import { deriveEventStatus } from "@/lib/utils/dates";

export function EventStatusBadge({
  event,
  className,
}: {
  event: {
    date: ISODate;
    startTime: TimeString;
    endTime: TimeString;
    status: EventStatus;
  };
  className?: string;
}) {
  const status = deriveEventStatus(event);

  return (
    <RawBadge
      badgeClass={EVENT_STATUS_BADGE_CLASS[status]}
      dot={status === "live"}
      className={className}
    >
      {EVENT_STATUS_LABELS[status]}
    </RawBadge>
  );
}

export function StaticStatusBadge({
  status,
  className,
}: {
  status: EventStatus;
  className?: string;
}) {
  return (
    <RawBadge
      badgeClass={EVENT_STATUS_BADGE_CLASS[status]}
      className={className}
    >
      {EVENT_STATUS_LABELS[status]}
    </RawBadge>
  );
}