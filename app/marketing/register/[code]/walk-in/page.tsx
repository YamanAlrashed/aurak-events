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
import { Users } from "lucide-react";
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
  NumberStepper,
} from "@/components/ui";
import {
  EMPTY_REGISTRANT,
  RegistrantFields,
  validateRegistrant,
  type RegistrantErrors,
} from "@/components/marketing/RegistrantFields";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { getEventByCode } from "@/lib/services/marketingEventService";
import { registerWalkIn } from "@/lib/services/marketingRegistrationService";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
} from "@/lib/data/marketing-reference";
import { MAX_GUESTS } from "@/lib/utils/constants";
import { formatEventDate } from "@/lib/utils/dates";

/* =============================================================================
   WALK-IN REGISTRATION

   Opened by scanning the public event QR at the venue. No login.
   Unlike pre-registration, this DOES ask how many guests came along.

   Guest count means accompanying people. The prospect themselves is counted
   separately when the final visitor total is calculated.
   ========================================================================== */

export default function WalkInRegistrationPage() {
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
    guests,
    setGuests,
  ] = useState(0);

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
        await registerWalkIn(
          event.id,
          value,
          guests
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
          description="Please ask a member of the AURAK team for help."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-1">
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

          <p className="text-sm text-[var(--aurak-text-muted)]">
            {formatEventDate(
              event.date
            )}{" "}
            ·{" "}
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
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Welcome — please register" />

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
              idPrefix="walkin-public"
              disabled={
                submitting
              }
            />

            <div>
              <p className="label label-required">
                Number of Guests / Visitors
              </p>

              <p className="field-hint mb-2 mt-0">
                How many people came with
                you? Your own place is
                already counted, so a total
                of{" "}
                <strong>
                  {1 +
                    guests}
                </strong>{" "}
                {1 + guests ===
                1
                  ? "person"
                  : "people"}{" "}
                will be recorded.
              </p>

              <NumberStepper
                value={
                  guests
                }
                onChange={
                  setGuests
                }
                min={0}
                max={
                  MAX_GUESTS
                }
                quickPicks={[
                  0, 1, 2, 3,
                ]}
              />
            </div>

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
              <Users className="h-5 w-5" />
              Register
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="text-center text-xs text-[var(--aurak-text-subtle)]">
        Registered in advance?{" "}
        <Link
          href={`/marketing/register/${code}`}
          className="link"
        >
          Back to pre-registration
        </Link>
      </p>
    </div>
  );
}
