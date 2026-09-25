"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarPlus,
  Clock,
  ImageIcon,
} from "lucide-react";
import type {
  AppNotification,
  NotificationType,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  listForUser,
  markAllRead,
  markRead,
} from "@/lib/services/notificationService";
import { useAuth } from "@/lib/context/AuthContext";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/utils/constants";
import { formatRelativeTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const TYPE_ICON: Record<
  NotificationType,
  React.ReactNode
> = {
  new_event: <CalendarPlus className="h-4 w-4" />,
  event_reminder: <Clock className="h-4 w-4" />,
  photos_available: <ImageIcon className="h-4 w-4" />,
};

export default function CampusUserNotificationsPage() {
  const router = useRouter();

  const { user } = useAuth();
  const campusUserId = user?.campusUserId;

  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [marking, setMarking] =
    useState(false);

  const load = useCallback(async () => {
    if (!campusUserId) return;

    setLoading(true);

    setNotifications(
      await listForUser(campusUserId)
    );

    setLoading(false);
  }, [campusUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleOpen(
    notification: AppNotification
  ) {
    if (!notification.read) {
      await markRead(notification.id);
    }

    if (notification.href) {
      router.push(notification.href);
      return;
    }

    void load();
  }

  async function handleMarkAll() {
    if (!campusUserId) return;

    setMarking(true);

    await markAllRead(campusUserId);
    await load();

    setMarking(false);
  }

  const unreadCount =
    notifications.filter(
      (item) => !item.read
    ).length;

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : "You are all caught up."
        }
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              loading={marking}
              onClick={handleMarkAll}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Bell className="h-6 w-6" />}
            title="No notifications"
            description="You receive notifications for events aimed at your group, and when photos are published for an event you attended."
          />
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <button
                type="button"
                onClick={() => void handleOpen(notification)}
                className={cn(
                  "card card-interactive flex w-full items-start gap-3 p-4 text-left",
                  !notification.read &&
                    "border-[var(--aurak-brand-border)] bg-[var(--aurak-brand-soft)]"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    notification.read
                      ? "bg-[var(--aurak-bg-sunken)] text-[var(--aurak-text-muted)]"
                      : "bg-white text-[var(--aurak-brand)]"
                  )}
                  aria-hidden
                >
                  {TYPE_ICON[notification.type]}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-[var(--aurak-navy)]">
                      {notification.title}
                    </span>

                    {!notification.read && (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--aurak-brand)]"
                        aria-label="Unread"
                      />
                    )}
                  </span>

                  <span className="mt-0.5 block text-sm text-[var(--aurak-text-muted)]">
                    {notification.body}
                  </span>

                  <span className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        notification.read
                          ? "neutral"
                          : "brand"
                      }
                    >
                      {NOTIFICATION_TYPE_LABELS[notification.type]}
                    </Badge>

                    <span className="text-xs text-[var(--aurak-text-subtle)]">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Card>
        <CardHeader title="How notifications work" />

        <CardBody>
          <p className="meta-text">
            You receive a notification when a new event targets your group,
            and when photos are published for an event you were checked in at.
            You can always see every AURAK event, even ones you were not
            notified about.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}