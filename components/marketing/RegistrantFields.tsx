"use client";

import type {
  Emirate,
  MarketingRegistrantInput,
} from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  EMIRATE_OPTIONS,
  INTAKE_OPTIONS,
  PROGRAM_OF_INTEREST_OPTIONS,
} from "@/lib/data/marketing-reference";

/* =============================================================================
   Prospect details.

   These people are EXTERNAL prospective students. They type their own details
   and have no AURAK account. Nothing here touches the campus user model.
   ========================================================================== */

export const EMPTY_REGISTRANT: MarketingRegistrantInput = {
  fullName: "",
  phone: "",
  email: "",
  programOfInterestId: "",
  intakeId: "",
  emirate: "",
};

export type RegistrantErrors = Partial<
  Record<keyof MarketingRegistrantInput, string>
>;

export function validateRegistrant(
  value: MarketingRegistrantInput
): RegistrantErrors {
  const errors: RegistrantErrors = {};

  if (!value.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (value.fullName.trim().length < 3) {
    errors.fullName = "Please enter the full name.";
  }

  const digits = value.phone.replace(/\D/g, "");

  if (!value.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (digits.length < 7) {
    errors.phone = "Please enter a valid phone number.";
  }

  if (!value.email.trim()) {
    errors.email = "Email is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.email.trim()
    )
  ) {
    errors.email = "Please enter a valid email address.";
  }

  if (!value.programOfInterestId) {
    errors.programOfInterestId =
      "Please choose a program of interest.";
  }

  if (!value.intakeId) {
    errors.intakeId =
      "Please choose an intake.";
  }

  if (!value.emirate) {
    errors.emirate =
      "Please choose your emirate.";
  }

  return errors;
}

export function RegistrantFields({
  value,
  onChange,
  errors = {},
  idPrefix = "reg",
  disabled = false,
}: {
  value: MarketingRegistrantInput;
  onChange: (
    value: MarketingRegistrantInput
  ) => void;
  errors?: RegistrantErrors;
  idPrefix?: string;
  disabled?: boolean;
}) {
  function update(
    patch: Partial<MarketingRegistrantInput>
  ) {
    onChange({
      ...value,
      ...patch,
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Full Name"
        required
        error={errors.fullName}
        htmlFor={`${idPrefix}-fullName`}
        className="sm:col-span-2"
      >
        <Input
          id={`${idPrefix}-fullName`}
          value={value.fullName}
          invalid={Boolean(errors.fullName)}
          disabled={disabled}
          autoComplete="name"
          onChange={(event) =>
            update({
              fullName: event.target.value,
            })
          }
          placeholder="Full name"
        />
      </Field>

      <Field
        label="Phone"
        required
        error={errors.phone}
        htmlFor={`${idPrefix}-phone`}
      >
        <Input
          id={`${idPrefix}-phone`}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={value.phone}
          invalid={Boolean(errors.phone)}
          disabled={disabled}
          onChange={(event) =>
            update({
              phone: event.target.value,
            })
          }
          placeholder="+971 50 000 0000"
        />
      </Field>

      <Field
        label="Email"
        required
        error={errors.email}
        htmlFor={`${idPrefix}-email`}
      >
        <Input
          id={`${idPrefix}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={value.email}
          invalid={Boolean(errors.email)}
          disabled={disabled}
          onChange={(event) =>
            update({
              email: event.target.value,
            })
          }
          placeholder="name@example.com"
        />
      </Field>

      <Field
        label="Program of Interest"
        required
        error={errors.programOfInterestId}
        htmlFor={`${idPrefix}-program`}
      >
        <Select
          id={`${idPrefix}-program`}
          options={PROGRAM_OF_INTEREST_OPTIONS}
          placeholder="Select a program"
          value={value.programOfInterestId}
          invalid={Boolean(
            errors.programOfInterestId
          )}
          disabled={disabled}
          onChange={(event) =>
            update({
              programOfInterestId:
                event.target.value,
            })
          }
        />
      </Field>

      <Field
        label="Intake"
        required
        error={errors.intakeId}
        htmlFor={`${idPrefix}-intake`}
      >
        <Select
          id={`${idPrefix}-intake`}
          options={INTAKE_OPTIONS}
          placeholder="Select an intake"
          value={value.intakeId}
          invalid={Boolean(errors.intakeId)}
          disabled={disabled}
          onChange={(event) =>
            update({
              intakeId: event.target.value,
            })
          }
        />
      </Field>

      <Field
        label="Emirate of Residence"
        required
        error={errors.emirate}
        htmlFor={`${idPrefix}-emirate`}
        className="sm:col-span-2"
      >
        <Select
          id={`${idPrefix}-emirate`}
          options={EMIRATE_OPTIONS}
          placeholder="Select an emirate"
          value={value.emirate}
          invalid={Boolean(errors.emirate)}
          disabled={disabled}
          onChange={(event) =>
            update({
              emirate:
                event.target.value as Emirate,
            })
          }
        />
      </Field>
    </div>
  );
}