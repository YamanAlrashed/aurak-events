"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import type {
  CampusAttendeeRow,
  CampusScanResult,
} from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  RawBadge,
  SearchInput,
  Tabs,
} from "@/components/ui";
import {
  MockQrScanner,
  type ScanSample,
} from "@/components/shared/MockQrScanner";
import {
  checkIn,
  getScanSamples,
  scanCode,
  searchAttendeesByName,
} from "@/lib/services/campusAttendanceService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import { CAMPUS_USER_TYPE_LABELS } from "@/lib/data/campus-reference";
import {
  RSVP_BADGE_CLASS,
  RSVP_LABELS,
} from "@/lib/utils/constants";
import { formatClockTime } from "@/lib/utils/dates";

type Mode = "scan" | "search";

export function CampusCheckInPanel({
  eventId,
  onCheckedIn,
}: {
  eventId: string;
  onCheckedIn: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<Mode>("scan");

  const [samples, setSamples] =
    useState<ScanSample[]>([]);

  const [result, setResult] =
    useState<CampusScanResult | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [justCheckedIn, setJustCheckedIn] =
    useState<string | null>(null);

  const [query, setQuery] = useState("");

  const [matches, setMatches] =
    useState<CampusAttendeeRow[]>([]);

  const [searching, setSearching] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result =
        await getScanSamples(eventId);

      if (!cancelled) {
        setSamples(result);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const runSearch =
    useCallback(async () => {
      if (!query.trim()) {
        setMatches([]);
        return;
      }

      setSearching(true);

      setMatches(
        await searchAttendeesByName(
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
    setJustCheckedIn(null);

    setResult(
      await scanCode(
        eventId,
        code
      )
    );

    setProcessing(false);
  }

  async function handleCheckIn(
    userId: string,
    method:
      | "qr"
      | "manual"
  ) {
    setProcessing(true);

    const outcome =
      await checkIn(
        eventId,
        userId,
        user?.id ??
          "acct-campus-staff",
        method
      );

    setProcessing(false);

    if (outcome.ok) {
      setJustCheckedIn(
        outcome.user.fullName
      );

      setResult(null);

      onCheckedIn();

      void runSearch();

      setSamples(
        await getScanSamples(
          eventId
        )
      );

      showToast({
        title:
          "Checked in",

        description:
          `${outcome.user.fullName} has been recorded as attended.`,
      });

      return;
    }

    if (
      outcome.reason ===
      "already_checked_in"
    ) {
      showToast({
        title:
          "Already checked in",

        description:
          `Recorded at ${formatClockTime(
            outcome.checkedInAt
          )}.`,

        variant: "error",
      });

      return;
    }

    showToast({
      title:
        "That person is not recognised",

      variant: "error",
    });
  }

  function reset() {
    setResult(null);
    setJustCheckedIn(
      null
    );
  }

  return (
    <div className="space-y-4">
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
                "Search attendee",
            },
          ]}
          activeId={mode}
          onChange={(id) => {
            setMode(
              id as Mode
            );

            reset();
          }}
        />

        <CardBody className="space-y-4">
          {justCheckedIn && (
            <div className="alert alert-success">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden
              />

              <span>
                <strong>
                  {justCheckedIn}
                </strong>{" "}
                checked in.
                Attendance updated.
              </span>
            </div>
          )}

          {mode ===
          "scan" ? (
            result ? (
              <ScanResultView
                result={
                  result
                }
                processing={
                  processing
                }
                onCheckIn={(
                  userId
                ) =>
                  handleCheckIn(
                    userId,
                    "qr"
                  )
                }
                onReset={
                  reset
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
            )
          ) : (
            <div className="space-y-3">
              <SearchInput
                value={
                  query
                }
                onChange={
                  setQuery
                }
                placeholder="Search by name or university ID…"
                autoFocus
              />

              {searching ? (
                <div
                  className="space-y-2"
                  aria-busy="true"
                >
                  {Array.from(
                    {
                      length: 3,
                    }
                  ).map(
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
                  Search for
                  someone who
                  cannot show
                  their QR code.
                </p>
              ) : matches.length ===
                0 ? (
                <p className="meta-text">
                  No matching
                  attendee for
                  this event.
                </p>
              ) : (
                <ul className="space-y-2">
                  {matches
                    .slice(
                      0,
                      20
                    )
                    .map(
                      (
                        row
                      ) => (
                        <li
                          key={
                            row
                              .user
                              .id
                          }
                          className="rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--aurak-navy)]">
                                {
                                  row
                                    .user
                                    .fullName
                                }
                              </p>

                              <p className="truncate text-xs text-[var(--aurak-text-muted)]">
                                {
                                  row
                                    .user
                                    .eumsId
                                }{" "}
                                ·{" "}
                                {
                                  CAMPUS_USER_TYPE_LABELS[
                                    row
                                      .user
                                      .userType
                                  ]
                                }
                                {row
                                  .user
                                  .departmentName
                                  ? ` · ${row.user.departmentName}`
                                  : ""}
                              </p>

                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {row.rsvpStatus && (
                                  <RawBadge
                                    badgeClass={
                                      RSVP_BADGE_CLASS[
                                        row
                                          .rsvpStatus
                                      ]
                                    }
                                  >
                                    RSVP{" "}
                                    {
                                      RSVP_LABELS[
                                        row
                                          .rsvpStatus
                                      ]
                                    }
                                  </RawBadge>
                                )}

                                {row.checkedIn && (
                                  <Badge variant="success">
                                    {row.checkedInAt
                                      ? `Checked in ${formatClockTime(
                                          row.checkedInAt
                                        )}`
                                      : "Checked in"}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {row.checkedIn ? (
                              <span className="shrink-0 text-xs font-medium text-[var(--aurak-success)]">
                                Done
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                loading={
                                  processing
                                }
                                onClick={() =>
                                  handleCheckIn(
                                    row
                                      .user
                                      .id,
                                    "manual"
                                  )
                                }
                              >
                                Check In
                              </Button>
                            )}
                          </div>
                        </li>
                      )
                    )}
                </ul>
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function ScanResultView({
  result,
  processing,
  onCheckIn,
  onReset,
}: {
  result:
    CampusScanResult;

  processing:
    boolean;

  onCheckIn: (
    userId: string
  ) => void;

  onReset: () => void;
}) {
  if (
    result.outcome ===
    "invalid_code"
  ) {
    return (
      <div className="space-y-4">
        <div className="alert alert-error">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden
          />

          <span>
            This code is not
            recognised for any
            event.

            <span className="mt-1 block break-all font-mono text-[0.6875rem]">
              {
                result.scannedValue
              }
            </span>
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

  if (
    result.outcome ===
    "wrong_event"
  ) {
    return (
      <div className="space-y-4">
        <div className="alert alert-warning">
          <ShieldAlert
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden
          />

          <span>
            This code belongs
            to{" "}
            <strong>
              {
                result.belongsToEventName
              }
            </strong>
            , not this event.
            Each QR code works
            for one event only.
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

  const {
    user,
    rsvpStatus,
  } = result;

  const alreadyCheckedIn =
    result.outcome ===
    "already_checked_in";

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--aurak-radius-lg)] border border-[var(--aurak-line)] bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--aurak-brand-soft)] text-sm font-semibold text-[var(--aurak-brand)]">
            {user.initials}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-[var(--aurak-navy)]">
              {
                user.fullName
              }
            </p>

            <p className="truncate text-sm text-[var(--aurak-text-muted)]">
              {
                user.eumsId
              }
            </p>
          </div>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="stat-label">
              User Type
            </dt>

            <dd className="mt-0.5 text-sm text-[var(--aurak-text)]">
              {
                CAMPUS_USER_TYPE_LABELS[
                  user.userType
                ]
              }
            </dd>
          </div>

          <div>
            <dt className="stat-label">
              Department
            </dt>

            <dd className="mt-0.5 text-sm text-[var(--aurak-text)]">
              {user.departmentName ??
                "—"}
            </dd>
          </div>

          {user.programName && (
            <div>
              <dt className="stat-label">
                Program
              </dt>

              <dd className="mt-0.5 text-sm text-[var(--aurak-text)]">
                {
                  user.programName
                }
              </dd>
            </div>
          )}

          <div>
            <dt className="stat-label">
              RSVP Status
            </dt>

            <dd className="mt-1">
              {rsvpStatus ? (
                <RawBadge
                  badgeClass={
                    RSVP_BADGE_CLASS[
                      rsvpStatus
                    ]
                  }
                >
                  {
                    RSVP_LABELS[
                      rsvpStatus
                    ]
                  }
                </RawBadge>
              ) : (
                <span className="text-sm text-[var(--aurak-text-subtle)]">
                  No response
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      {alreadyCheckedIn ? (
        <>
          <div className="alert alert-warning">
            <UserCheck
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
                )}
                . Attendance was
                not changed.
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
            Scan next person
          </Button>
        </>
      ) : (
        <div className="space-y-2">
          <Button
            block
            size="touch"
            loading={
              processing
            }
            onClick={() =>
              onCheckIn(
                user.id
              )
            }
            icon={
              <CheckCircle2 className="h-5 w-5" />
            }
          >
            Check In
          </Button>

          <Button
            variant="ghost"
            block
            onClick={
              onReset
            }
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}