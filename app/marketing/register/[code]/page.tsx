"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  CalendarDays,
  MapPin,
} from "lucide-react";
import type {
  MarketingEvent,
  MarketingRegistrantInput,
} from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui";
import {
  EMPTY_REGISTRANT,
  RegistrantFields,
  validateRegistrant,
  type RegistrantErrors,
} from "@/components/marketing/RegistrantFields";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { getEventByCode } from "@/lib/services/marketingEventService";
import { preRegister } from "@/lib/services/marketingRegistrationService";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
} from "@/lib/data/marketing-reference";
import {
  formatEventDate,
  formatTimeRange,
  isPastDate,
} from "@/lib/utils/dates";

/* =============================================================================
   PRE-REGISTRATION

   Asked before the event, via an invitation link.
   NO guest count is collected here — that is a walk-in question only.
   ========================================================================== */

export default function PreRegistrationPage() {
  const params =
    useParams<{
      code: string;
    }>();

  const code =
    params.code;

  const router =
    useRouter();

  const [
    event,
    setEvent,
  ] =
    useState<
      MarketingEvent | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    value,
    setValue,
  ] =
    useState<MarketingRegistrantInput>(
      EMPTY_REGISTRANT
    );

  const [
    errors,
    setErrors,
  ] =
    useState<RegistrantErrors>(
      {}
    );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    failure,
    setFailure,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const result =
        await getEventByCode(
          code
        );

      if (!cancelled) {
        setEvent(result);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleSubmit(
    formEvent: React.FormEvent
  ) {
    formEvent.preventDefault();

    if (!event) {
      return;
    }

    const nextErrors =
      validateRegistrant(
        value
      );

    setErrors(
      nextErrors
    );

    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {
      document
        .querySelector<HTMLElement>(
          '[aria-invalid="true"]'
        )
        ?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });

      return;
    }

    setSubmitting(true);
    setFailure(null);

    try {
      const result =
        await preRegister(
          event.id,
          value
        );

      router.push(
        `/marketing/register/${code}/confirmation/${result.registration.id}`
      );
    } catch {
      setFailure(
        "Something went wrong. Please try again."
      );

      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <LoadingSection rows={2} />
    );
  }

  if (!event) {
    return (
      <Card>
        <EmptyState
          title="Registration link not found"
          description="This link may have expired or been mistyped. Please check with the AURAK team."
        />
      </Card>
    );
  }

  const eventHasPassed =
    isPastDate(
      event.date
    );

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--aurak-brand)]">
            {
              MARKETING_EVENT_TYPE_LABELS[
                event.type
              ]
            }
          </p>

          <h1 className="text-lg font-semibold leading-snug text-[var(--aurak-navy)]">
            {event.name}
          </h1>

          <p className="flex items-center gap-2 text-sm text-[var(--aurak-text-muted)]">
            <CalendarDays
              className="h-4 w-4 shrink-0"
              aria-hidden
            />

            {formatEventDate(
              event.date
            )}{" "}
            ·{" "}
            {formatTimeRange(
              event.startTime,
              event.endTime
            )}
          </p>

          <p className="flex items-center gap-2 text-sm text-[var(--aurak-text-muted)]">
            <MapPin
              className="h-4 w-4 shrink-0"
              aria-hidden
            />

            {
              event.location
                .venueName
            }
            ,{" "}
            {
              EMIRATE_LABELS[
                event.location
                  .emirate
              ]
            }
          </p>

          {event.description && (
            <p className="pt-1 text-sm text-[var(--aurak-text)]">
              {
                event.description
              }
            </p>
          )}

          {event.location
            .mapUrl && (
            <a
              href={
                event.location
                  .mapUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm mt-2 w-full"
            >
              <MapPin className="h-3.5 w-3.5" />
              View Location
            </a>
          )}
        </CardBody>
      </Card>

      {eventHasPassed ? (
        <Card>
          <EmptyState
            title="This event has already taken place"
            description="Registration is closed. Please contact the AURAK admissions team about upcoming events."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Register your interest" />

          <CardBody>
            <form
              onSubmit={
                handleSubmit
              }
              noValidate
              className="space-y-5"
            >
              <RegistrantFields
                value={value}
                onChange={
                  setValue
                }
                errors={
                  errors
                }
                idPrefix="pre"
                disabled={
                  submitting
                }
              />

              {failure && (
                <div
                  className="alert alert-error"
                  role="alert"
                >
                  {
                    failure
                  }
                </div>
              )}

              <Button
                type="submit"
                block
                size="touch"
                loading={
                  submitting
                }
              >
                Complete Registration
              </Button>

              <p className="field-hint">
                You will receive a unique
                QR code to show at the
                event. Bringing family or
                friends? You can tell our
                team how many of you
                arrived on the day.
              </p>
            </form>
          </CardBody>
        </Card>
      )}

      <p className="text-center text-xs text-[var(--aurak-text-subtle)]">
        Already at the event?{" "}
        <Link
          href={`/marketing/register/${code}/walk-in`}
          className="link"
        >
          Register as a walk-in
        </Link>
      </p>
    </div>
  );
}