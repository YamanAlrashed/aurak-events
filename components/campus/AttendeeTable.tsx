"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type { CampusAttendeeRow } from "@/lib/types";
import {
  Badge,
  RawBadge,
  SearchInput,
} from "@/components/ui";
import { listAttendees } from "@/lib/services/campusAttendanceService";
import { CAMPUS_USER_TYPE_LABELS } from "@/lib/data/campus-reference";
import {
  RSVP_BADGE_CLASS,
  RSVP_LABELS,
} from "@/lib/utils/constants";
import { formatClockTime } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type StateFilter =
  | "all"
  | "checked_in"
  | "not_checked_in";

const FILTERS: Array<{
  id: StateFilter;
  label: string;
}> = [
  {
    id: "all",
    label: "All",
  },
  {
    id: "checked_in",
    label: "Checked in",
  },
  {
    id: "not_checked_in",
    label: "Not checked in",
  },
];

export function AttendeeTable({
  eventId,
  refreshKey = 0,
  compact = false,
}: {
  eventId: string;
  refreshKey?: number;
  compact?: boolean;
}) {
  const [rows, setRows] =
    useState<
      CampusAttendeeRow[]
    >([]);

  const [search, setSearch] =
    useState("");

  const [state, setState] =
    useState<StateFilter>(
      "all"
    );

  const [loading, setLoading] =
    useState(true);

  const load =
    useCallback(async () => {
      setLoading(true);

      const result =
        await listAttendees(
          eventId,
          {
            search,
            state,
          }
        );

      setRows(result);
      setLoading(false);
    }, [
      eventId,
      search,
      state,
    ]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or university ID…"
          className="sm:max-w-xs"
        />

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(
            (filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() =>
                  setState(
                    filter.id
                  )
                }
                aria-pressed={
                  state ===
                  filter.id
                }
                className={cn(
                  "btn btn-sm",
                  state ===
                    filter.id
                    ? "btn-primary"
                    : "btn-secondary"
                )}
              >
                {filter.label}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div
          className="space-y-2"
          aria-busy="true"
        >
          {Array.from({
            length: 5,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="skeleton h-12 w-full"
              />
            )
          )}
        </div>
      ) : rows.length ===
        0 ? (
        <p className="meta-text py-6 text-center">
          No attendees match this filter.
        </p>
      ) : (
        <>
          <p className="meta-text">
            {formatNumber(
              rows.length
            )}{" "}
            {rows.length === 1
              ? "person"
              : "people"}
          </p>

          <div className="scroll-x overflow-hidden rounded-[var(--aurak-radius-lg)] border border-[var(--aurak-line)] bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>
                    University ID
                  </th>
                  <th>Type</th>

                  {!compact && (
                    <th>
                      Department
                    </th>
                  )}

                  {!compact && (
                    <th>
                      Program
                    </th>
                  )}

                  <th>RSVP</th>
                  <th>
                    Check-in
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (row) => (
                    <tr
                      key={
                        row.user.id
                      }
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--aurak-bg-sunken)] text-[0.625rem] font-semibold text-[var(--aurak-navy)]">
                            {
                              row
                                .user
                                .initials
                            }
                          </span>

                          <span className="min-w-0 truncate font-medium text-[var(--aurak-navy)]">
                            {
                              row
                                .user
                                .fullName
                            }
                          </span>
                        </div>
                      </td>

                      <td className="table-numeric">
                        {
                          row
                            .user
                            .eumsId
                        }
                      </td>

                      <td>
                        {
                          CAMPUS_USER_TYPE_LABELS[
                            row
                              .user
                              .userType
                          ]
                        }
                      </td>

                      {!compact && (
                        <td>
                          {row
                            .user
                            .departmentName ??
                            "—"}
                        </td>
                      )}

                      {!compact && (
                        <td>
                          {row
                            .user
                            .programName ??
                            "—"}
                        </td>
                      )}

                      <td>
                        {row.rsvpStatus ? (
                          <RawBadge
                            badgeClass={
                              RSVP_BADGE_CLASS[
                                row
                                  .rsvpStatus
                              ]
                            }
                          >
                            {
                              RSVP_LABELS[
                                row
                                  .rsvpStatus
                              ]
                            }
                          </RawBadge>
                        ) : (
                          <span className="text-[var(--aurak-text-subtle)]">
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        {row.checkedIn ? (
                          <Badge variant="success">
                            {row.checkedInAt
                              ? `Checked in ${formatClockTime(
                                  row.checkedInAt
                                )}`
                              : "Checked in"}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            Not checked in
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}