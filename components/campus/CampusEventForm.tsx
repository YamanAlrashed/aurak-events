"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  CampusEventInput,
  FieldErrors,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardBody,
  CardHeader,
} from "@/components/ui/Card";
import {
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { LocationPicker } from "@/components/campus/LocationPicker";
import { TargetAudiencePicker } from "@/components/campus/TargetAudiencePicker";
import { HOSTING_DEPARTMENT_OPTIONS } from "@/lib/data/campus-reference";
import { todayISO } from "@/lib/utils/dates";

export const EMPTY_CAMPUS_EVENT: CampusEventInput = {
  name: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",

  location: {
    buildingId: "",
    buildingName: "",
  },

  hostingDepartmentId: "",

  targetAudience: {
    userTypes: ["student"],
    collegeIds: [],
    departmentIds: [],
    programIds: [],
  },

  showAverageRatingToUsers: true,
};

type FormErrors =
  FieldErrors<CampusEventInput> & {
    buildingId?: string;
    audience?: string;
  };

export function validateCampusEvent(
  value: CampusEventInput,
  options: {
    requireFutureDate: boolean;
  }
): FormErrors {
  const errors: FormErrors = {};

  if (!value.name.trim()) {
    errors.name = "Event name is required.";
  } else if (value.name.trim().length < 3) {
    errors.name = "Event name must be at least 3 characters.";
  }

  if (!value.date) {
    errors.date = "Date is required.";
  } else if (
    options.requireFutureDate &&
    value.date < todayISO()
  ) {
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

  if (!value.location.buildingId) {
    errors.buildingId = "Building is required.";
  }

  if (!value.hostingDepartmentId) {
    errors.hostingDepartmentId = "Hosting department is required.";
  }

  if (value.targetAudience.userTypes.length === 0) {
    errors.audience = "Select at least one group to notify.";
  }

  return errors;
}

export function CampusEventForm({
  initialValue,
  submitLabel,
  requireFutureDate,
  onSubmit,
}: {
  initialValue: CampusEventInput;
  submitLabel: string;
  requireFutureDate: boolean;
  onSubmit: (value: CampusEventInput) => Promise<void>;
}) {
  const router = useRouter();

  const [value, setValue] =
    useState<CampusEventInput>(initialValue);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [submitting, setSubmitting] =
    useState(false);

  function update(patch: Partial<CampusEventInput>) {
    setValue((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors = validateCampusEvent(value, {
      requireFutureDate,
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      document
        .querySelector<HTMLElement>('[aria-invalid="true"]')
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

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Card>
        <CardHeader title="Event details" />

        <CardBody className="space-y-4">
          <Field
            label="Event Name"
            required
            error={errors.name}
            htmlFor="name"
          >
            <Input
              id="name"
              value={value.name}
              invalid={Boolean(errors.name)}
              onChange={(event) =>
                update({
                  name: event.target.value,
                })
              }
              placeholder="AI & Machine Learning Workshop"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
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
          </div>

          <Field
            label="Hosting Department"
            required
            error={errors.hostingDepartmentId}
            htmlFor="hostingDepartmentId"
          >
            <Select
              id="hostingDepartmentId"
              options={HOSTING_DEPARTMENT_OPTIONS}
              placeholder="Select a hosting department"
              value={value.hostingDepartmentId}
              invalid={Boolean(errors.hostingDepartmentId)}
              onChange={(event) =>
                update({
                  hostingDepartmentId: event.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Description"
            hint="Optional. Shown to users on the event page."
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
              placeholder="What is this event about, who should come, and what should they bring?"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Location" />

        <CardBody>
          <LocationPicker
            value={value.location}
            onChange={(location) =>
              update({ location })
            }
            errors={{
              buildingId: errors.buildingId,
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Target audience" />

        <CardBody>
          <TargetAudiencePicker
            value={value.targetAudience}
            onChange={(targetAudience) =>
              update({
                targetAudience,
              })
            }
            error={errors.audience}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Options" />

        <CardBody>
          <Toggle
            checked={value.showAverageRatingToUsers}
            onChange={(showAverageRatingToUsers) =>
              update({
                showAverageRatingToUsers,
              })
            }
            label="Show Average Rating to Users"
            description="When off, users can still rate the event but will not see the average rating or the number of ratings. Admin always sees both, plus individual comments."
          />
        </CardBody>
      </Card>

      <div className="safe-bottom sticky bottom-0 -mx-4 flex flex-col-reverse gap-2 border-t border-[var(--aurak-line)] bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-[var(--aurak-radius-lg)] sm:border sm:px-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}