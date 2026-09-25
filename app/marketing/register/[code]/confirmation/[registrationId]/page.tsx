"use client";

import {
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import type {
  MarketingEvent,
  MarketingRegistrationDetail,
} from "@/lib/types";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
} from "@/components/ui";
import { MockQrCode } from "@/components/shared/MockQrCode";
import { DetailList } from "@/components/shared/DetailList";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { getEventByCode } from "@/lib/services/marketingEventService";
import { getRegistrationDetail } from "@/lib/services/marketingRegistrationService";
import {
  EMIRATE_LABELS,
  MARKETING_EVENT_TYPE_LABELS,
} from "@/lib/data/marketing-reference";
import { REGISTRATION_TYPE_LABELS } from "@/lib/utils/constants";
import {
  formatEventDate,
  formatTimeRange,
} from "@/lib/utils/dates";

export default function RegistrationConfirmationPage() {
  const params =
    useParams<{
      code: string;
      registrationId: string;
    }>();

  const {
    code,
    registrationId,
  } = params;

  const [
    event,
    setEvent,
  ] =
    useState<
      MarketingEvent | null
    >(null);

  const [
    detail,
    setDetail,
  ] =
    useState<
      MarketingRegistrationDetail | null
    >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled =
      false;

    async function load() {
      const [
        eventResult,
        detailResult,
      ] =
        await Promise.all([
          getEventByCode(
            code
          ),
          getRegistrationDetail(
            registrationId
          ),
        ]);

      /*
       * The registration must belong to the event represented by this
       * public code. This prevents a registration ID from a different
       * Marketing event being shown under the wrong event URL.
       */
      const validDetail =
        eventResult &&
        detailResult &&
        detailResult
          .registration
          .eventId ===
          eventResult.id
          ? detailResult
          : null;

      if (!cancelled) {
        setEvent(
          validDetail
            ? eventResult
            : null
        );

        setDetail(
          validDetail
        );

        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    code,
    registrationId,
  ]);

  if (loading) {
    return (
      <LoadingSection rows={2} />
    );
  }

  if (
    !event ||
    !detail
  ) {
    return (
      <Card>
        <EmptyState
          title="Registration not found"
          description="Please register again or ask a member of the AURAK team for help."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardBody className="space-y-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--aurak-success-soft)] text-[var(--aurak-success)]">
            <CheckCircle2
              className="h-6 w-6"
              aria-hidden
            />
          </span>

          <h1 className="text-lg font-semibold text-[var(--aurak-navy)]">
            You&apos;re registered
          </h1>

          <p className="meta-text">
            Thank you,{" "}
            {
              detail.registrant.fullName.split(
                " "
              )[0]
            }
            . Show the code below when you
            arrive.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Your event code" />

        <CardBody>
          <MockQrCode
            code={
              detail.registration
                .qrCode
            }
            size={220}
          />

          <p className="meta-text mt-3 text-center">
            This code is unique to you and
            to this event. Take a screenshot
            so you have it offline.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Event details" />

        <CardBody className="space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[var(--aurak-navy)]">
              {event.name}
            </p>

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
          </div>

          {event.location
            .mapUrl && (
            <a
              href={
                event.location
                  .mapUrl
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-block"
            >
              <MapPin className="h-4 w-4" />
              Open Map
            </a>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Your details" />

        <CardBody>
          <DetailList
            items={[
              {
                label:
                  "Name",
                value:
                  detail.registrant
                    .fullName,
              },
              {
                label:
                  "Phone",
                value:
                  detail.registrant
                    .phone,
              },
              {
                label:
                  "Email",
                value:
                  detail.registrant
                    .email,
              },
              {
                label:
                  "Program of Interest",
                value:
                  detail.programOfInterestName,
              },
              {
                label:
                  "Intake",
                value:
                  detail.intakeLabel,
              },
              {
                label:
                  "Emirate",
                value:
                  EMIRATE_LABELS[
                    detail
                      .registrant
                      .emirate
                  ],
              },
              {
                label:
                  "Registration",
                value:
                  MARKETING_EVENT_TYPE_LABELS[
                    event.type
                  ] +
                  " · " +
                  REGISTRATION_TYPE_LABELS[
                    detail
                      .registration
                      .registrationType
                  ],
                wide: true,
              },
            ]}
          />

          <p className="field-hint mt-4">
            Need a correction? A member of
            the team can update your details
            when you arrive.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}