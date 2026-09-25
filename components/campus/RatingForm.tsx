"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import type { EventRating } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  StarRating,
  Textarea,
} from "@/components/ui";
import {
  canUserRate,
  getUserRating,
  submitRating,
} from "@/lib/services/ratingService";
import { useToast } from "@/lib/context/ToastContext";
import { formatDateTime } from "@/lib/utils/dates";

export function RatingForm({
  eventId,
  userId,
  onSubmitted,
}: {
  eventId: string;
  userId: string;
  onSubmitted: () => void;
}) {
  const { showToast } = useToast();

  const [allowed, setAllowed] = useState(false);
  const [existing, setExisting] = useState<EventRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [suggestion, setSuggestion] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    const [canRate, mine] = await Promise.all([
      canUserRate(eventId, userId),
      getUserRating(eventId, userId),
    ]);

    setAllowed(canRate);
    setExisting(mine);

    if (mine) {
      setStars(mine.stars);
      setComment(mine.comment ?? "");
      setSuggestion(mine.suggestion ?? "");
    }

    setLoading(false);
  }, [eventId, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSaving(true);

    try {
      const result = await submitRating(eventId, userId, {
        stars,
        comment,
        suggestion,
      });

      if (!result.ok) {
        showToast({
          title: "Only attendees can rate this event",
          description: "Your attendance was not recorded at this event.",
          variant: "error",
        });

        return;
      }

      setExisting(result.rating);
      setEditing(false);
      onSubmitted();

      showToast({
        title: "Thank you for your feedback",
        description: "Your rating is anonymous to other users.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-10 w-40" />
        </CardBody>
      </Card>
    );
  }

  if (!allowed) {
    return (
      <Card>
        <CardHeader title="Rate this event" />

        <CardBody>
          <div className="alert alert-info">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />

            <span>
              Only people who were checked in at the event can rate it. If you
              attended but were not scanned, please contact the organisers.
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (existing && !editing) {
    return (
      <Card>
        <CardHeader
          title="Your rating"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          }
        />

        <CardBody className="space-y-3">
          <StarRating
            value={existing.stars}
            onChange={() => {}}
            disabled
          />

          {existing.comment && (
            <p className="text-sm text-[var(--aurak-text)]">
              {existing.comment}
            </p>
          )}

          {existing.suggestion && (
            <p className="text-sm text-[var(--aurak-text-muted)]">
              <span className="font-medium">Suggestion: </span>
              {existing.suggestion}
            </p>
          )}

          <p className="field-hint">
            Submitted {formatDateTime(existing.submittedAt)}. Only the
            organisers can see your comments.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={existing ? "Edit your rating" : "Rate this event"} />

      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Your rating"
            hint="Optional. Tap a star again to clear it."
          >
            <StarRating value={stars} onChange={setStars} />
          </Field>

          <Field label="Comment" hint="Optional.">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What did you think of the event?"
            />
          </Field>

          <Field label="Suggestion" hint="Optional.">
            <Textarea
              value={suggestion}
              onChange={(event) => setSuggestion(event.target.value)}
              placeholder="Anything the organisers could improve?"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {existing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              loading={saving}
              disabled={
                stars === 0 &&
                !comment.trim() &&
                !suggestion.trim()
              }
            >
              {existing ? "Save Rating" : "Submit Rating"}
            </Button>
          </div>

          <p className="field-hint">
            Everything here is optional, and your feedback is not shown to
            other users.
          </p>
        </form>
      </CardBody>
    </Card>
  );
}