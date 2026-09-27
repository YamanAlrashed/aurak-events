"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Emirate,
  MarketingEventInput,
  MarketingEventType,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { StaffAssignmentPicker } from "@/components/marketing/StaffAssignmentPicker";
import {
  EMIRATE_OPTIONS,
  MARKETING_EVENT_TYPE_OPTIONS,
} from "@/lib/data/marketing-reference";
import { todayISO } from "@/lib/utils/dates";

/* =============================================================================
   Marketing event create / edit form.

   MARKETING ONLY. Campus concepts — target audience, hosting department,
   building/room — are deliberately absent, just as staff assignment, departure
   time, map links and driver details never appear on the Campus form.

   EVENT NAME is chosen from a preset list to keep naming consistent, with an
   "Other" option for anything bespoke. The presets are LOCAL UI STATE only:
   MarketingEvent.name remains a plain string and the separate Event Type model
   (MarketingEventType) is untouched.
   ========================================================================== */

/** Preset event names. Not the same list as MarketingEventType. */
const NAME_PRESETS = [
  "Open Day",
  "School Visit",
  "School Campaign",
  "Exhibition",
  "Information Session",
] as const;

const OTHER_NAME = "Other";

const NAME_OPTIONS = [
  ...NAME_PRESETS.map((preset) => ({ value: preset, label: preset })),
  { value: OTHER_NAME, label: "Other (type a custom name)" },
];

function isPresetName(name: string): boolean {
  return (NAME_PRESETS as readonly string[]).includes(name);
}

interface NameSelection {
  preset: string;
  customName: string;
}

/**
 * Splits a stored name into the selector value and the custom text field.
 *   "Open Day"          -> preset "Open Day", custom ""
 *   "Najah Exhibition"  -> preset "Other",    custom "Najah Exhibition"
 *   ""                  -> nothing selected
 */
function deriveNameSelection(name: string): NameSelection {
  const trimmed = name.trim();

  if (!trimmed) {
    return { preset: "", customName: "" };
  }

  if (isPresetName(trimmed)) {
    return { preset: trimmed, customName: "" };
  }

  return { preset: OTHER_NAME, customName: trimmed };
}

export const EMPTY_MARKETING_EVENT: MarketingEventInput = {
  name: "",
  type: "open_day",
  date: "",
  startTime: "",
  endTime: "",
  departureTime: "",
  location: {
    emirate: "ras_al_khaimah",
    venueName: "",
    mapUrl: "",
  },
  description: "",
  assignedStaffIds: [],
  driver: {
    name: "",
    phone: "",
  },
};

export interface MarketingFormErrors {
  name?: string;
  type?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  departureTime?: string;
  emirate?: string;
  venueName?: string;
  mapUrl?: string;
  driverPhone?: string;
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value.trim());
}

export function validateMarketingEvent(
  value: MarketingEventInput,
  options: { requireFutureDate: boolean }
): MarketingFormErrors {
  const errors: MarketingFormErrors = {};

  if (!value.name.trim()) {
    errors.name = "Event name is required.";
  } else if (value.name.trim().length < 3) {
    errors.name = "Event name must be at least 3 characters.";
  }

  if (!value.type) {
    errors.type = "Event type is required.";
  }

  if (!value.date) {
    errors.date = "Date is required.";
  } else if (options.requireFutureDate && value.date < todayISO()) {
    errors.date = "The date cannot be in the past.";
  }

  if (!value.startTime) {
    errors.startTime = "Start time is required.";
  }

  if (!value.endTime) {
    errors.endTime = "End time is required.";
  }

  if (
    value.startTime &&
    value.endTime &&
    value.endTime <= value.startTime
  ) {
    errors.endTime = "End time must be after the start time.";
  }

  /* Departure is optional, but if given it must be before the event starts. */
  if (
    value.departureTime &&
    value.startTime &&
    value.departureTime >= value.startTime
  ) {
    errors.departureTime = "Departure should be before the start time.";
  }

  if (!value.location.emirate) {
    errors.emirate = "Emirate is required.";
  }

  if (!value.location.venueName.trim()) {
    errors.venueName = "Venue or school name is required.";
  }

  const mapUrl = value.location.mapUrl?.trim();

  if (mapUrl && !looksLikeUrl(mapUrl)) {
    errors.mapUrl = "Enter a full link starting with http:// or https://";
  }

  /* A driver name without a phone number is not useful to staff on the road. */
  const driverName = value.driver?.name.trim() ?? "";
  const driverPhone = value.driver?.phone.trim() ?? "";

  if (driverName && !driverPhone) {
    errors.driverPhone = "Add a phone number so staff can reach the driver.";
  }

  return errors;
}

export function MarketingEventForm({
  initialValue,
  submitLabel,
  requireFutureDate,
  onSubmit,
}: {
  initialValue: MarketingEventInput;
  submitLabel: string;
  requireFutureDate: boolean;
  onSubmit: (value: MarketingEventInput) => Promise<void>;
}) {
  const router = useRouter();

  const [value, setValue] =
    useState<MarketingEventInput>(initialValue);

  const [errors, setErrors] =
    useState<MarketingFormErrors>({});

  const [submitting, setSubmitting] =
    useState(false);

  /* Name selector state, seeded once from the stored name when editing. */
  const [nameSelection, setNameSelection] =
    useState<NameSelection>(() =>
      deriveNameSelection(initialValue.name)
    );

  function update(patch: Partial<MarketingEventInput>) {
    setValue((current) => ({
      ...current,
      ...patch,
    }));
  }

  /* value.name stays the single source of truth for validation and submit. */
  function handlePresetChange(nextPreset: string) {
    if (nextPreset === OTHER_NAME) {
      setNameSelection((current) => ({
        preset: OTHER_NAME,
        customName: current.customName,
      }));

      update({
        name: nameSelection.customName,
      });

      return;
    }

    setNameSelection({
      preset: nextPreset,
      customName: "",
    });

    update({
      name: nextPreset,
    });
  }

  function handleCustomNameChange(nextName: string) {
    setNameSelection({
      preset: OTHER_NAME,
      customName: nextName,
    });

    update({
      name: nextName,
    });
  }

  async function handleSubmit(
    event: React.FormEvent
  ) {
    event.preventDefault();

    const nextErrors = validateMarketingEvent(
      value,
      { requireFutureDate }
    );

    /* Name-selector specific messages, replacing the generic one. */
    if (!nameSelection.preset) {
      nextErrors.name = "Please select an event name.";
    } else if (
      nameSelection.preset === OTHER_NAME &&
      !nameSelection.customName.trim()
    ) {
      nextErrors.name = "Enter a custom event name.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
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

    try {
      await onSubmit(value);
    } finally {
      setSubmitting(false);
    }
  }

  const usingCustomName =
    nameSelection.preset === OTHER_NAME;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5"
    >
      {/* ---------- Event details ---------- */}
      <Card>
        <CardHeader title="Event details" />

        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Event Name"
              required
              error={errors.name}
              htmlFor="namePreset"
            >
              <Select
                id="namePreset"
                options={NAME_OPTIONS}
                placeholder="Select an event name"
                value={nameSelection.preset}
                invalid={Boolean(errors.name)}
                onChange={(event) =>
                  handlePresetChange(event.target.value)
                }
              />
            </Field>

            <Field
              label="Event Type"
              required
              error={errors.type}
              htmlFor="type"
            >
              <Select
                id="type"
                options={MARKETING_EVENT_TYPE_OPTIONS}
                value={value.type}
                invalid={Boolean(errors.type)}
                onChange={(event) =>
                  update({
                    type: event.target
                      .value as MarketingEventType,
                  })
                }
              />
            </Field>

            {usingCustomName && (
              <Field
                label="Custom Event Name"
                required
                error={errors.name}
                hint="Shown everywhere this event appears."
                htmlFor="customName"
                className="sm:col-span-2"
              >
                <Input
                  id="customName"
                  value={nameSelection.customName}
                  invalid={Boolean(errors.name)}
                  onChange={(event) =>
                    handleCustomNameChange(
                      event.target.value
                    )
                  }
                  placeholder="Najah Education Exhibition — Sharjah"
                />
              </Field>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field
              label="Date"
              required
              error={errors.date}
              htmlFor="date"
            >
              <Input
                id="date"
                type="date"
                value={value.date}
                invalid={Boolean(errors.date)}
                onChange={(event) =>
                  update({
                    date: event.target.value,
                  })
                }
              />
            </Field>

            <Field
              label="Start Time"
              required
              error={errors.startTime}
              htmlFor="startTime"
            >
              <Input
                id="startTime"
                type="time"
                value={value.startTime}
                invalid={Boolean(errors.startTime)}
                onChange={(event) =>
                  update({
                    startTime: event.target.value,
                  })
                }
              />
            </Field>

            <Field
              label="End Time"
              required
              error={errors.endTime}
              htmlFor="endTime"
            >
              <Input
                id="endTime"
                type="time"
                value={value.endTime}
                invalid={Boolean(errors.endTime)}
                onChange={(event) =>
                  update({
                    endTime: event.target.value,
                  })
                }
              />
            </Field>

            <Field
              label="Departure Time"
              error={errors.departureTime}
              hint="Optional. When the team leaves campus."
              htmlFor="departureTime"
            >
              <Input
                id="departureTime"
                type="time"
                value={value.departureTime ?? ""}
                invalid={Boolean(
                  errors.departureTime
                )}
                onChange={(event) =>
                  update({
                    departureTime:
                      event.target.value,
                  })
                }
              />
            </Field>
          </div>

          <Field
            label="Description"
            hint="Optional."
            htmlFor="description"
          >
            <Textarea
              id="description"
              value={value.description ?? ""}
              onChange={(event) =>
                update({
                  description: event.target.value,
                })
              }
              placeholder="What happens at this event, and who is it aimed at?"
            />
          </Field>
        </CardBody>
      </Card>

      {/* ---------- Location ---------- */}
      <Card>
        <CardHeader title="Location" />

        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Emirate"
              required
              error={errors.emirate}
              htmlFor="emirate"
            >
              <Select
                id="emirate"
                options={EMIRATE_OPTIONS}
                value={value.location.emirate}
                invalid={Boolean(errors.emirate)}
                onChange={(event) =>
                  update({
                    location: {
                      ...value.location,
                      emirate:
                        event.target
                          .value as Emirate,
                    },
                  })
                }
              />
            </Field>

            <Field
              label="Venue / School"
              required
              error={errors.venueName}
              htmlFor="venueName"
            >
              <Input
                id="venueName"
                value={value.location.venueName}
                invalid={Boolean(
                  errors.venueName
                )}
                onChange={(event) =>
                  update({
                    location: {
                      ...value.location,
                      venueName:
                        event.target.value,
                    },
                  })
                }
                placeholder="Dubai International Academy"
              />
            </Field>
          </div>

          <Field
            label="Location Link"
            error={errors.mapUrl}
            hint="Optional. Paste a Google Maps link — staff will see an Open Map button."
            htmlFor="mapUrl"
          >
            <Input
              id="mapUrl"
              type="url"
              inputMode="url"
              value={value.location.mapUrl ?? ""}
              invalid={Boolean(errors.mapUrl)}
              onChange={(event) =>
                update({
                  location: {
                    ...value.location,
                    mapUrl: event.target.value,
                  },
                })
              }
              placeholder="https://maps.google.com/?q=..."
            />
          </Field>
        </CardBody>
      </Card>

      {/* ---------- Team ---------- */}
      <Card>
        <CardHeader title="Assign staff" />

        <CardBody>
          <StaffAssignmentPicker
            selected={value.assignedStaffIds}
            onChange={(assignedStaffIds) =>
              update({ assignedStaffIds })
            }
          />
        </CardBody>
      </Card>

      {/* ---------- Driver ---------- */}
      <Card>
        <CardHeader title="Driver details" />

        <CardBody className="space-y-4">
          <p className="meta-text">
            Optional. Visible to assigned staff on their
            event screen. Add both a name and a phone
            number so the team can reach them.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Driver Name"
              htmlFor="driverName"
            >
              <Input
                id="driverName"
                value={value.driver?.name ?? ""}
                onChange={(event) =>
                  update({
                    driver: {
                      name: event.target.value,
                      phone:
                        value.driver?.phone ?? "",
                    },
                  })
                }
                placeholder="Rami Aboud"
              />
            </Field>

            <Field
              label="Driver Phone"
              error={errors.driverPhone}
              htmlFor="driverPhone"
            >
              <Input
                id="driverPhone"
                type="tel"
                inputMode="tel"
                value={value.driver?.phone ?? ""}
                invalid={Boolean(
                  errors.driverPhone
                )}
                onChange={(event) =>
                  update({
                    driver: {
                      name:
                        value.driver?.name ?? "",
                      phone: event.target.value,
                    },
                  })
                }
                placeholder="+971 50 000 0000"
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* ---------- Actions ---------- */}
      <div className="safe-bottom sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-[var(--aurak-line)] bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-[var(--aurak-radius-lg)] sm:border sm:px-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          loading={submitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}