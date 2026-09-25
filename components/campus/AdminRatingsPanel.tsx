"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { MessageSquare } from "lucide-react";
import type {
  CountBucket,
  EventRating,
  RatingSummary,
} from "@/lib/types";
import {
  Card,
  CardBody,
  CardHeader,
  StatCard,
  StarRatingDisplay,
  Toggle,
} from "@/components/ui";
import { BarList } from "@/components/shared/BarList";
import {
  getSummary,
  listRatings,
} from "@/lib/services/ratingService";
import { setRatingVisibility } from "@/lib/services/campusEventService";
import { useToast } from "@/lib/context/ToastContext";
import { formatDateTime } from "@/lib/utils/dates";
import {
  formatNumber,
  formatRating,
} from "@/lib/utils/format";

export function AdminRatingsPanel({
  eventId,
  showAverageToUsers,
  onVisibilityChange,
}: {
  eventId: string;
  showAverageToUsers: boolean;
  onVisibilityChange: (
    visible: boolean
  ) => void;
}) {
  const { showToast } =
    useToast();

  const [
    summary,
    setSummary,
  ] =
    useState<RatingSummary | null>(
      null
    );

  const [ratings, setRatings] =
    useState<EventRating[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    savingToggle,
    setSavingToggle,
  ] = useState(false);

  const load =
    useCallback(async () => {
      setLoading(true);

      const [
        summaryResult,
        ratingsResult,
      ] =
        await Promise.all([
          getSummary(eventId),
          listRatings(eventId),
        ]);

      setSummary(
        summaryResult
      );

      setRatings(
        ratingsResult
      );

      setLoading(false);
    }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(
    visible: boolean
  ) {
    setSavingToggle(true);

    try {
      await setRatingVisibility(
        eventId,
        visible
      );

      onVisibilityChange(
        visible
      );

      showToast({
        title: visible
          ? "Average rating is now visible to users"
          : "Average rating is now hidden from users",

        description: visible
          ? "Users will see the average and the number of ratings."
          : "Users can still rate the event but will not see the average.",
      });
    } catch {
      showToast({
        title:
          "Could not update the setting",

        variant: "error",
      });
    } finally {
      setSavingToggle(
        false
      );
    }
  }

  if (
    loading ||
    !summary
  ) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-24 w-full" />
        </CardBody>
      </Card>
    );
  }

  const distributionBuckets:
    CountBucket[] =
    summary.distribution
      .map(
        (
          count,
          index
        ) => ({
          id:
            `${index + 1}`,

          label:
            `${index + 1} star${
              index === 0
                ? ""
                : "s"
            }`,

          count,
        })
      )
      .reverse();

  const comments =
    ratings.filter(
      (rating) =>
        rating.comment ||
        rating.suggestion
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Average Rating"
          value={
            summary.count > 0
              ? formatRating(
                  summary.average
                )
              : "—"
          }
          caption={
            summary.count > 0
              ? "Out of 5"
              : "No ratings yet"
          }
        />

        <StatCard
          label="Ratings"
          value={summary.count}
          caption="Submissions"
        />

        <StatCard
          label="Comments"
          value={
            comments.length
          }
          caption="Admin only"
        />

        <StatCard
          label="Visible to users"
          value={
            showAverageToUsers
              ? "Yes"
              : "No"
          }
        />
      </div>

      <Card>
        <CardHeader title="Visibility" />

        <CardBody>
          <Toggle
            checked={
              showAverageToUsers
            }
            onChange={
              handleToggle
            }
            disabled={
              savingToggle
            }
            label="Show Average Rating to Users"
            description="Users never see other people's comments. This controls only whether they see the average rating and the number of ratings."
          />
        </CardBody>
      </Card>

      {summary.count >
        0 && (
        <Card>
          <CardHeader
            title="Distribution"
            actions={
              <StarRatingDisplay
                average={
                  summary.average
                }
                count={
                  summary.count
                }
              />
            }
          />

          <CardBody>
            <BarList
              buckets={
                distributionBuckets
              }
              total={
                summary.count
              }
            />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={`Comments and suggestions (${formatNumber(
            comments.length
          )})`}
        />

        <CardBody>
          {comments.length ===
          0 ? (
            <p className="meta-text">
              No written feedback has been submitted yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map(
                (rating) => (
                  <li
                    key={
                      rating.id
                    }
                    className="rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StarRatingDisplay
                        average={
                          rating.stars
                        }
                        size="sm"
                        showNumber={
                          false
                        }
                      />

                      <span className="text-xs text-[var(--aurak-text-subtle)]">
                        {formatDateTime(
                          rating.submittedAt
                        )}
                      </span>
                    </div>

                    {rating.comment && (
                      <p className="mt-2 text-sm text-[var(--aurak-text)]">
                        {
                          rating.comment
                        }
                      </p>
                    )}

                    {rating.suggestion && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-[var(--aurak-text-muted)]">
                        <MessageSquare
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          aria-hidden
                        />

                        <span>
                          <span className="font-medium">
                            Suggestion:{" "}
                          </span>

                          {
                            rating.suggestion
                          }
                        </span>
                      </p>
                    )}
                  </li>
                )
              )}
            </ul>
          )}

          <p className="field-hint mt-3">
            Ratings are submitted anonymously to Admin
            in this prototype — the person's identity is
            stored but not displayed here.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}