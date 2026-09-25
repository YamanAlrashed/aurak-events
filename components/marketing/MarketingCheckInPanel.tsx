"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  Pencil,
  RotateCcw,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import type {
  MarketingRegistrantInput,
  MarketingRegistrationDetail,
  MarketingScanResult,
} from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  NumberStepper,
  RawBadge,
  SearchInput,
  Tabs,
} from "@/components/ui";
import {
  MockQrScanner,
  type ScanSample,
} from "@/components/shared/MockQrScanner";
import {
  EMPTY_REGISTRANT,
  RegistrantFields,
  validateRegistrant,
  type RegistrantErrors,
} from "@/components/marketing/RegistrantFields";
import {
  getScanSamples,
  registerWalkIn,
  scanCode,
  searchRegistrations,
  updateRegistrant,
} from "@/lib/services/marketingRegistrationService";
import { confirmAttendance } from "@/lib/services/marketingAttendanceService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { EMIRATE_LABELS } from "@/lib/data/marketing-reference";
import {
  CRM_STATUS_BADGE_CLASS,
  CRM_STATUS_LABELS,
  MAX_GUESTS,
  REGISTRATION_TYPE_LABELS,
} from "@/lib/utils/constants";
import { formatClockTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

/* =============================================================================
   Marketing check-in.

   VISITOR COUNT RULE: the number entered here is the TOTAL number of people who
   physically arrived, INCLUDING the prospect. A prospect who came alone is 1;
   a prospect with two companions is 3.

   The default is seeded from the guest count a walk-in declared at
   registration, but staff always confirm the real figure.
   ========================================================================== */

type Mode =
  | "scan"
  | "search"
  | "walk_in";

export function MarketingCheckInPanel({
  eventId,
  onChanged,
}: {
  eventId: string;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const staffId =
    user?.marketingStaffId ??
    "staff-yaman";

  const [mode, setMode] =
    useState<Mode>("scan");

  const [samples, setSamples] =
    useState<ScanSample[]>([]);

  const [result, setResult] =
    useState<
      MarketingScanResult | null
    >(null);

  const [
    processing,
    setProcessing,
  ] = useState(false);

  const [query, setQuery] =
    useState("");

  const [
    matches,
    setMatches,
  ] =
    useState<
      MarketingRegistrationDetail[]
    >([]);

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    walkIn,
    setWalkIn,
  ] =
    useState<MarketingRegistrantInput>(
      EMPTY_REGISTRANT
    );

  const [
    walkInErrors,
    setWalkInErrors,
  ] =
    useState<RegistrantErrors>(
      {}
    );

  const [
    walkInGuests,
    setWalkInGuests,
  ] = useState(0);

  const loadSamples =
    useCallback(async () => {
      setSamples(
        await getScanSamples(
          eventId
        )
      );
    }, [eventId]);

  useEffect(() => {
    void loadSamples();
  }, [loadSamples]);

  const runSearch =
    useCallback(async () => {
      if (!query.trim()) {
        setMatches([]);
        return;
      }

      setSearching(true);

      setMatches(
        await searchRegistrations(
          eventId,
          query
        )
      );

      setSearching(false);
    }, [eventId, query]);

  useEffect(() => {
    const timer =
      setTimeout(
        () =>
          void runSearch(),
        250
      );

    return () =>
      clearTimeout(timer);
  }, [runSearch]);

  async function handleScan(
    code: string
  ) {
    setProcessing(true);

    setResult(
      await scanCode(
        eventId,
        code
      )
    );

    setProcessing(false);
  }

  function openDetail(
    detail: MarketingRegistrationDetail
  ) {
    if (
      detail.attendance
        ?.checkedIn &&
      detail.attendance
        .checkedInAt
    ) {
      setResult({
        outcome:
          "already_checked_in",
        detail,
        checkedInAt:
          detail.attendance
            .checkedInAt,
        visitorCount:
          detail.attendance
            .visitorCount,
      });
    } else {
      setResult({
        outcome:
          "ready_to_check_in",
        detail,
      });
    }

    setMode("scan");
  }

  async function handleWalkIn(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const errors =
      validateRegistrant(
        walkIn
      );

    setWalkInErrors(
      errors
    );

    if (
      Object.keys(errors)
        .length > 0
    ) {
      return;
    }

    setProcessing(true);

    try {
      const created =
        await registerWalkIn(
          eventId,
          walkIn,
          walkInGuests
        );

      await confirmAttendance(
        eventId,
        created.registration.id,
        1 + walkInGuests,
        staffId
      );

      setWalkIn(
        EMPTY_REGISTRANT
      );

      setWalkInGuests(0);
      setWalkInErrors({});

      onChanged();
      void loadSamples();

      showToast({
        title:
          "Walk-in registered and checked in",
        description: `${
          created.registrant
            .fullName
        } · ${
          1 + walkInGuests
        } visitors recorded. CRM status: ${
          CRM_STATUS_LABELS[
            created.crmStatus
          ]
        }.`,
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Card>
      <Tabs
        className="px-4 pt-1"
        items={[
          {
            id: "scan",
            label:
              "Scan QR",
          },
          {
            id: "search",
            label:
              "Search",
          },
          {
            id: "walk_in",
            label:
              "Walk-in",
          },
        ]}
        activeId={mode}
        onChange={(id) => {
          setMode(
            id as Mode
          );
          setResult(null);
        }}
      />

      <CardBody className="space-y-4">
        {mode === "scan" &&
          (result ? (
            <ScanOutcome
              eventId={
                eventId
              }
              result={
                result
              }
              staffId={
                staffId
              }
              onDone={() => {
                setResult(
                  null
                );
                onChanged();
                void loadSamples();
                void runSearch();
              }}
              onReset={() =>
                setResult(
                  null
                )
              }
            />
          ) : (
            <MockQrScanner
              samples={
                samples
              }
              processing={
                processing
              }
              onScan={
                handleScan
              }
            />
          ))}

        {mode ===
          "search" && (
          <div className="space-y-3">
            <SearchInput
              value={query}
              onChange={
                setQuery
              }
              placeholder="Search by name, email or phone…"
              autoFocus
            />

            {searching ? (
              <div
                className="space-y-2"
                aria-busy="true"
              >
                {Array.from({
                  length: 3,
                }).map(
                  (
                    _,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="skeleton h-16 w-full"
                    />
                  )
                )}
              </div>
            ) : query.trim() ===
              "" ? (
              <p className="meta-text">
                Find a
                registrant who
                cannot show
                their QR code.
              </p>
            ) : matches.length ===
              0 ? (
              <p className="meta-text">
                No registration
                found. Use the
                Walk-in tab to
                register them.
              </p>
            ) : (
              <ul className="space-y-2">
                {matches.map(
                  (detail) => (
                    <li
                      key={
                        detail
                          .registration
                          .id
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openDetail(
                            detail
                          )
                        }
                        className="w-full rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white p-3 text-left transition-colors hover:bg-[var(--aurak-bg-subtle)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--aurak-navy)]">
                              {
                                detail
                                  .registrant
                                  .fullName
                              }
                            </p>

                            <p className="truncate text-xs text-[var(--aurak-text-muted)]">
                              {
                                detail
                                  .registrant
                                  .phone
                              }{" "}
                              ·{" "}
                              {
                                detail.programOfInterestName
                              }
                            </p>
                          </div>

                          {detail
                            .attendance
                            ?.checkedIn ? (
                            <Badge variant="success">
                              {
                                detail
                                  .attendance
                                  .visitorCount
                              }{" "}
                              visitors
                            </Badge>
                          ) : (
                            <Badge variant="neutral">
                              Not
                              checked
                              in
                            </Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  )
                )}
              </ul>
            )}
          </div>
        )}

        {mode ===
          "walk_in" && (
          <form
            onSubmit={
              handleWalkIn
            }
            noValidate
            className="space-y-4"
          >
            <p className="meta-text">
              Register someone
              who arrived
              without
              pre-registering.
              They are checked
              in straight away.
            </p>

            <RegistrantFields
              value={
                walkIn
              }
              onChange={
                setWalkIn
              }
              errors={
                walkInErrors
              }
              idPrefix="walkin"
              disabled={
                processing
              }
            />

            <div>
              <p className="label">
                Guests with them
              </p>

              <p className="field-hint mb-2 mt-0">
                People
                accompanying
                the prospect.
                Total visitors
                will be{" "}
                <strong>
                  {1 +
                    walkInGuests}
                </strong>
                , including the
                prospect.
              </p>

              <NumberStepper
                value={
                  walkInGuests
                }
                onChange={
                  setWalkInGuests
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

            <Button
              type="submit"
              block
              size="touch"
              loading={
                processing
              }
              icon={
                <UserPlus className="h-5 w-5" />
              }
            >
              Register &amp;
              Check In
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}

function ScanOutcome({
  eventId,
  result,
  staffId,
  onDone,
  onReset,
}: {
  eventId: string;
  result: MarketingScanResult;
  staffId: string;
  onDone: () => void;
  onReset: () => void;
}) {
  const { showToast } =
    useToast();

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errors,
    setErrors,
  ] =
    useState<RegistrantErrors>(
      {}
    );

  const detail =
    result.outcome ===
      "ready_to_check_in" ||
    result.outcome ===
      "already_checked_in"
      ? result.detail
      : null;

  const [form, setForm] =
    useState<MarketingRegistrantInput>(
      () =>
        detail
          ? {
              fullName:
                detail
                  .registrant
                  .fullName,
              phone:
                detail
                  .registrant
                  .phone,
              email:
                detail
                  .registrant
                  .email,
              programOfInterestId:
                detail
                  .registrant
                  .programOfInterestId,
              intakeId:
                detail
                  .registrant
                  .intakeId,
              emirate:
                detail
                  .registrant
                  .emirate,
            }
          : EMPTY_REGISTRANT
    );

  const [
    visitors,
    setVisitors,
  ] = useState(
    detail
      ? 1 +
          (detail
            .registration
            .declaredGuestCount ??
            0)
      : 1
  );

  if (
    result.outcome ===
      "invalid_code" ||
    result.outcome ===
      "wrong_event"
  ) {
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "alert",
            result.outcome ===
              "invalid_code"
              ? "alert-error"
              : "alert-warning"
          )}
        >
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden
          />

          <span>
            {result.outcome ===
            "invalid_code" ? (
              <>
                This code is
                not recognised.

                <span className="mt-1 block break-all font-mono text-[0.6875rem]">
                  {
                    result.scannedValue
                  }
                </span>
              </>
            ) : (
              <>
                This code
                belongs to{" "}
                <strong>
                  {
                    result.belongsToEventName
                  }
                </strong>
                , not this
                event.
              </>
            )}
          </span>
        </div>

        <Button
          variant="secondary"
          block
          onClick={
            onReset
          }
          icon={
            <RotateCcw className="h-4 w-4" />
          }
        >
          Scan again
        </Button>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const alreadyCheckedIn =
    result.outcome ===
    "already_checked_in";

  async function handleSaveEdit() {
    const nextErrors =
      validateRegistrant(
        form
      );

    setErrors(
      nextErrors
    );

    if (
      Object.keys(
        nextErrors
      ).length > 0
    ) {
      return;
    }

    setSaving(true);

    try {
      await updateRegistrant(
        detail!.registrant.id,
        form
      );

      setEditing(false);

      showToast({
        title:
          "Details updated",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setSaving(true);

    try {
      if (editing) {
        const nextErrors =
          validateRegistrant(
            form
          );

        setErrors(
          nextErrors
        );

        if (
          Object.keys(
            nextErrors
          ).length > 0
        ) {
          setSaving(false);
          return;
        }

        await updateRegistrant(
          detail!.registrant.id,
          form
        );
      }

      const outcome =
        await confirmAttendance(
          eventId,
          detail!.registration.id,
          visitors,
          staffId
        );

      if (outcome.ok) {
        showToast({
          title:
            "Attendance confirmed",
          description: `${form.fullName} · ${visitors} visitors recorded.`,
        });

        onDone();
        return;
      }

      if (
        outcome.reason ===
        "already_checked_in"
      ) {
        showToast({
          title:
            "Already checked in",
          description: `Recorded at ${formatClockTime(
            outcome.checkedInAt
          )} with ${
            outcome.visitorCount
          } visitors.`,
          variant:
            "error",
        });

        return;
      }

      showToast({
        title:
          "Visitor count must be at least 1",
        variant:
          "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--aurak-radius-lg)] border border-[var(--aurak-line)] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--aurak-navy)]">
              {
                detail
                  .registrant
                  .fullName
              }
            </p>

            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="neutral">
                {
                  REGISTRATION_TYPE_LABELS[
                    detail
                      .registration
                      .registrationType
                  ]
                }
              </Badge>

              <RawBadge
                badgeClass={
                  CRM_STATUS_BADGE_CLASS[
                    detail
                      .registration
                      .crmStatus
                  ]
                }
              >
                {
                  CRM_STATUS_LABELS[
                    detail
                      .registration
                      .crmStatus
                  ]
                }
              </RawBadge>
            </div>
          </div>

          {!alreadyCheckedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setEditing(
                  (value) =>
                    !value
                )
              }
              icon={
                <Pencil className="h-3.5 w-3.5" />
              }
            >
              {editing
                ? "Done"
                : "Edit"}
            </Button>
          )}
        </div>

        {editing ? (
          <div className="mt-4 space-y-4">
            <RegistrantFields
              value={form}
              onChange={
                setForm
              }
              errors={
                errors
              }
              idPrefix="edit"
              disabled={
                saving
              }
            />

            <Button
              variant="secondary"
              size="sm"
              loading={
                saving
              }
              onClick={
                handleSaveEdit
              }
            >
              Save details
            </Button>
          </div>
        ) : (
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="stat-label">
                Phone
              </dt>
              <dd className="mt-0.5 text-sm">
                {
                  detail
                    .registrant
                    .phone
                }
              </dd>
            </div>

            <div>
              <dt className="stat-label">
                Email
              </dt>
              <dd className="mt-0.5 truncate text-sm">
                {
                  detail
                    .registrant
                    .email
                }
              </dd>
            </div>

            <div>
              <dt className="stat-label">
                Program of
                Interest
              </dt>
              <dd className="mt-0.5 text-sm">
                {
                  detail.programOfInterestName
                }
              </dd>
            </div>

            <div>
              <dt className="stat-label">
                Intake
              </dt>
              <dd className="mt-0.5 text-sm">
                {
                  detail.intakeLabel
                }
              </dd>
            </div>

            <div>
              <dt className="stat-label">
                Emirate
              </dt>
              <dd className="mt-0.5 text-sm">
                {
                  EMIRATE_LABELS[
                    detail
                      .registrant
                      .emirate
                  ]
                }
              </dd>
            </div>
          </dl>
        )}
      </div>

      {alreadyCheckedIn ? (
        <>
          <div className="alert alert-warning">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden
            />

            <span>
              <strong>
                Already Checked
                In
              </strong>

              <span className="mt-0.5 block">
                Recorded at{" "}
                {formatClockTime(
                  result.checkedInAt
                )}{" "}
                with{" "}
                {
                  result.visitorCount
                }{" "}
                visitors.
                Nothing was
                changed.
              </span>
            </span>
          </div>

          <Button
            variant="secondary"
            block
            size="touch"
            onClick={
              onReset
            }
          >
            Scan next
          </Button>
        </>
      ) : (
        <>
          <div>
            <p className="label">
              Visitors who
              arrived
            </p>

            <p className="field-hint mb-2 mt-0">
              Total people
              present,{" "}
              <strong>
                including
              </strong>{" "}
              the prospect. One
              person alone is 1;
              with two companions
              it is 3.
            </p>

            <NumberStepper
              value={
                visitors
              }
              onChange={
                setVisitors
              }
              min={1}
              max={
                MAX_GUESTS +
                1
              }
              quickPicks={[
                1, 2, 3, 4,
              ]}
            />
          </div>

          <div className="space-y-2">
            <Button
              block
              size="touch"
              loading={
                saving
              }
              onClick={
                handleConfirm
              }
              icon={
                <CheckCircle2 className="h-5 w-5" />
              }
            >
              Confirm
              Attendance
            </Button>

            <Button
              variant="ghost"
              block
              onClick={
                onReset
              }
              disabled={
                saving
              }
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}