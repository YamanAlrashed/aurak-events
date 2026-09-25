"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type {
  CRMStatus,
  MarketingRegistrationDetail,
  RegistrationType,
} from "@/lib/types";
import {
  Badge,
  RawBadge,
  SearchInput,
  Select,
} from "@/components/ui";
import { listRegistrations } from "@/lib/services/marketingRegistrationService";
import { EMIRATE_LABELS } from "@/lib/data/marketing-reference";
import {
  CRM_STATUS_BADGE_CLASS,
  CRM_STATUS_LABELS,
  CRM_STATUS_ORDER,
  REGISTRATION_TYPE_BADGE_CLASS,
  REGISTRATION_TYPE_LABELS,
} from "@/lib/utils/constants";
import { formatClockTime } from "@/lib/utils/dates";
import { formatNumber } from "@/lib/utils/format";

export function RegistrationTable({
  eventId,
  initialCrmStatus = "all",
  refreshKey = 0,
}: {
  eventId: string;
  initialCrmStatus?:
    | CRMStatus
    | "all";
  refreshKey?: number;
}) {
  const [rows, setRows] =
    useState<
      MarketingRegistrationDetail[]
    >([]);

  const [search, setSearch] =
    useState("");

  const [type, setType] =
    useState<
      RegistrationType | "all"
    >("all");

  const [
    crmStatus,
    setCrmStatus,
  ] = useState<
    CRMStatus | "all"
  >(initialCrmStatus);

  const [
    attendance,
    setAttendance,
  ] = useState<
    | "all"
    | "attended"
    | "not_attended"
  >("all");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    setCrmStatus(initialCrmStatus);
  }, [initialCrmStatus]);

  const load =
    useCallback(async () => {
      setLoading(true);

      setRows(
        await listRegistrations(
          eventId,
          {
            search,
            registrationType:
              type,
            crmStatus,
            attendance,
          }
        )
      );

      setLoading(false);
    }, [
      eventId,
      search,
      type,
      crmStatus,
      attendance,
    ]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email or phone…"
        />

        <Select
          options={[
            {
              value: "all",
              label:
                "All registration types",
            },
            {
              value:
                "pre_registered",
              label:
                "Pre-registered",
            },
            {
              value: "walk_in",
              label: "Walk-in",
            },
          ]}
          value={type}
          onChange={(event) =>
            setType(
              event.target
                .value as
                | RegistrationType
                | "all"
            )
          }
        />

        <Select
          options={[
            {
              value: "all",
              label:
                "All CRM statuses",
            },
            ...CRM_STATUS_ORDER.map(
              (status) => ({
                value: status,
                label:
                  CRM_STATUS_LABELS[
                    status
                  ],
              })
            ),
          ]}
          value={crmStatus}
          onChange={(event) =>
            setCrmStatus(
              event.target
                .value as
                | CRMStatus
                | "all"
            )
          }
        />

        <Select
          options={[
            {
              value: "all",
              label:
                "Attended or not",
            },
            {
              value:
                "attended",
              label: "Attended",
            },
            {
              value:
                "not_attended",
              label:
                "Did not attend",
            },
          ]}
          value={attendance}
          onChange={(event) =>
            setAttendance(
              event.target
                .value as
                | "all"
                | "attended"
                | "not_attended"
            )
          }
        />
      </div>

      {loading ? (
        <div
          className="space-y-2"
          aria-busy="true"
        >
          {Array.from({
            length: 6,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="skeleton h-12 w-full"
              />
            )
          )}
        </div>
      ) : rows.length === 0 ? (
        <p className="meta-text py-6 text-center">
          No registrations match these
          filters.
        </p>
      ) : (
        <>
          <p className="meta-text">
            {formatNumber(
              rows.length
            )}{" "}
            {rows.length === 1
              ? "registration"
              : "registrations"}{" "}
            · one row is one prospect
          </p>

          <div className="scroll-x overflow-hidden rounded-[var(--aurak-radius-lg)] border border-[var(--aurak-line)] bg-white">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>
                    Program of Interest
                  </th>
                  <th>Intake</th>
                  <th>Emirate</th>
                  <th>Type</th>
                  <th>CRM Status</th>
                  <th>Attended</th>
                  <th>Visitors</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={
                      row.registration
                        .id
                    }
                  >
                    <td className="font-medium text-[var(--aurak-navy)]">
                      {
                        row.registrant
                          .fullName
                      }
                    </td>

                    <td>
                      <span className="block text-xs">
                        {
                          row.registrant
                            .phone
                        }
                      </span>

                      <span className="block text-xs text-[var(--aurak-text-muted)]">
                        {
                          row.registrant
                            .email
                        }
                      </span>
                    </td>

                    <td>
                      {
                        row.programOfInterestName
                      }
                    </td>

                    <td>
                      {
                        row.intakeLabel
                      }
                    </td>

                    <td>
                      {
                        EMIRATE_LABELS[
                          row
                            .registrant
                            .emirate
                        ]
                      }
                    </td>

                    <td>
                      <RawBadge
                        badgeClass={
                          REGISTRATION_TYPE_BADGE_CLASS[
                            row
                              .registration
                              .registrationType
                          ]
                        }
                      >
                        {
                          REGISTRATION_TYPE_LABELS[
                            row
                              .registration
                              .registrationType
                          ]
                        }
                      </RawBadge>
                    </td>

                    <td>
                      <RawBadge
                        badgeClass={
                          CRM_STATUS_BADGE_CLASS[
                            row
                              .registration
                              .crmStatus
                          ]
                        }
                      >
                        {
                          CRM_STATUS_LABELS[
                            row
                              .registration
                              .crmStatus
                          ]
                        }
                      </RawBadge>
                    </td>

                    <td>
                      {row.attendance
                        ?.checkedIn ? (
                        <Badge variant="success">
                          {row
                            .attendance
                            .checkedInAt
                            ? formatClockTime(
                                row
                                  .attendance
                                  .checkedInAt
                              )
                            : "Yes"}
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          No
                        </Badge>
                      )}
                    </td>

                    <td className="table-numeric">
                      {row.attendance
                        ?.checkedIn
                        ? formatNumber(
                            row
                              .attendance
                              .visitorCount
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="field-hint">
            Visitors is the total number of
            people who arrived with that
            prospect, including the prospect.
            It is not a count of prospects.
          </p>
        </>
      )}
    </div>
  );
}