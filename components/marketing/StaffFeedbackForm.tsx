"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { StaffFeedback } from "@/lib/types";
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
  getMyFeedback,
  submitFeedback,
} from "@/lib/services/staffFeedbackService";
import { useToast } from "@/lib/context/ToastContext";
import { formatDateTime } from "@/lib/utils/dates";

export function StaffFeedbackForm({
  eventId,
  staffId,
  onSubmitted,
}: {
  eventId: string;
  staffId: string;
  onSubmitted: () => void;
}) {
  const { showToast } =
    useToast();

  const [
    existing,
    setExisting,
  ] =
    useState<
      StaffFeedback | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    rating,
    setRating,
  ] = useState(0);

  const [
    comment,
    setComment,
  ] = useState("");

  const [
    suggestions,
    setSuggestions,
  ] = useState("");

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const load =
    useCallback(async () => {
      setLoading(true);

      const mine =
        await getMyFeedback(
          eventId,
          staffId
        );

      setExisting(mine);

      if (mine) {
        setRating(
          mine.rating ??
            0
        );

        setComment(
          mine.comment
        );

        setSuggestions(
          mine.suggestions ??
            ""
        );
      }

      setLoading(false);
    }, [eventId, staffId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!comment.trim()) {
      setError(
        "Please add a comment so the team knows how it went."
      );

      return;
    }

    setError(null);
    setSaving(true);

    try {
      const result =
        await submitFeedback(
          eventId,
          staffId,
          {
            rating:
              rating > 0
                ? rating
                : undefined,
            comment,
            suggestions,
          }
        );

      if (!result.ok) {
        showToast({
          title:
            "Could not save your feedback",
          variant:
            "error",
        });

        return;
      }

      setExisting(
        result.feedback
      );

      setEditing(false);

      onSubmitted();

      showToast({
        title:
          "Feedback sent to the Marketing team",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-20 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (
    existing &&
    !editing
  ) {
    return (
      <Card>
        <CardHeader
          title="Your feedback"
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEditing(
                  true
                )
              }
            >
              Edit
            </Button>
          }
        />

        <CardBody className="space-y-3">
          {typeof existing.rating ===
            "number" && (
            <StarRating
              value={
                existing.rating
              }
              onChange={() => {}}
              disabled
            />
          )}

          <p className="text-sm text-[var(--aurak-text)]">
            {
              existing.comment
            }
          </p>

          {existing.suggestions && (
            <p className="text-sm text-[var(--aurak-text-muted)]">
              <span className="font-medium">
                Suggestion:{" "}
              </span>
              {
                existing.suggestions
              }
            </p>
          )}

          <p className="field-hint">
            Sent{" "}
            {formatDateTime(
              existing.submittedAt
            )}
            .
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          existing
            ? "Edit your feedback"
            : "Event feedback"
        }
      />

      <CardBody>
        <form
          onSubmit={
            handleSubmit
          }
          noValidate
          className="space-y-4"
        >
          <Field
            label="Rating"
            hint="Optional."
          >
            <StarRating
              value={rating}
              onChange={
                setRating
              }
              size="md"
            />
          </Field>

          <Field
            label="Comment"
            required
            error={
              error ??
              undefined
            }
            htmlFor="feedback-comment"
          >
            <Textarea
              id="feedback-comment"
              value={comment}
              invalid={Boolean(
                error
              )}
              onChange={(event) =>
                setComment(
                  event.target
                    .value
                )
              }
              placeholder="How did the event go? Turnout, venue, materials, coordination."
            />
          </Field>

          <Field
            label="Suggestions"
            hint="Optional."
            htmlFor="feedback-suggestions"
          >
            <Textarea
              id="feedback-suggestions"
              value={
                suggestions
              }
              onChange={(event) =>
                setSuggestions(
                  event.target
                    .value
                )
              }
              placeholder="What should we do differently next time?"
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {existing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setEditing(
                    false
                  )
                }
                disabled={
                  saving
                }
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              loading={
                saving
              }
            >
              {existing
                ? "Save Feedback"
                : "Send Feedback"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}