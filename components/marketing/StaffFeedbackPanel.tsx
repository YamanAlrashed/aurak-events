"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import type { StaffFeedback } from "@/lib/types";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  StarRatingDisplay,
  StatCard,
} from "@/components/ui";
import {
  getAverageRating,
  listForEvent,
} from "@/lib/services/staffFeedbackService";
import { STAFF_DEPARTMENT_LABELS } from "@/lib/data/marketing-reference";
import { formatDateTime } from "@/lib/utils/dates";
import { formatRating } from "@/lib/utils/format";

export function StaffFeedbackPanel({
  eventId,
  refreshKey = 0,
}: {
  eventId: string;
  refreshKey?: number;
}) {
  const [
    feedback,
    setFeedback,
  ] = useState<
    StaffFeedback[]
  >([]);

  const [
    average,
    setAverage,
  ] = useState<{
    average: number;
    count: number;
  } | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [
        items,
        ratingAverage,
      ] =
        await Promise.all([
          listForEvent(
            eventId
          ),
          getAverageRating(
            eventId
          ),
        ]);

      if (!cancelled) {
        setFeedback(items);
        setAverage(
          ratingAverage
        );
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId, refreshKey]);

  if (loading) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
      >
        <div className="skeleton h-20 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  const withSuggestions =
    feedback.filter(
      (item) =>
        item.suggestions
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Feedback entries"
          value={
            feedback.length
          }
          caption="From assigned staff"
        />

        <StatCard
          label="Staff rating"
          value={
            average
              ? formatRating(
                  average.average
                )
              : "—"
          }
          caption={
            average
              ? `${average.count} rated`
              : "Nobody rated yet"
          }
        />

        <StatCard
          label="Suggestions"
          value={
            withSuggestions.length
          }
          caption="Actionable notes"
        />
      </div>

      <Card>
        <CardHeader title="Staff feedback" />

        <CardBody>
          {feedback.length ===
          0 ? (
            <EmptyState
              icon={
                <MessageSquare className="h-6 w-6" />
              }
              title="No feedback yet"
              description="Assigned staff can leave feedback from their own event screen after the event."
            />
          ) : (
            <ul className="space-y-3">
              {feedback.map(
                (item) => (
                  <li
                    key={item.id}
                    className="rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--aurak-navy)]">
                          {
                            item.staffName
                          }
                        </p>

                        <Badge
                          variant="neutral"
                          className="mt-1"
                        >
                          {
                            STAFF_DEPARTMENT_LABELS[
                              item
                                .staffDepartment
                            ]
                          }
                        </Badge>
                      </div>

                      <div className="text-right">
                        {typeof item.rating ===
                          "number" && (
                          <StarRatingDisplay
                            average={
                              item.rating
                            }
                            size="sm"
                            showNumber={
                              false
                            }
                          />
                        )}

                        <p className="mt-1 text-xs text-[var(--aurak-text-subtle)]">
                          {formatDateTime(
                            item.submittedAt
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2.5 text-sm text-[var(--aurak-text)]">
                      {
                        item.comment
                      }
                    </p>

                    {item.suggestions && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-[var(--aurak-text-muted)]">
                        <Lightbulb
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />

                        <span>
                          <span className="font-medium">
                            Suggestion:{" "}
                          </span>
                          {
                            item.suggestions
                          }
                        </span>
                      </p>
                    )}
                  </li>
                )
              )}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}