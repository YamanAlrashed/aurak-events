import type { RatingSummary, TargetAudience } from "@/lib/types";
import {
  CAMPUS_USER_TYPE_LABELS,
  getCollege,
  getDepartment,
  getProgram,
} from "@/lib/data/campus-reference";

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function pluralize(
  count: number,
  singular: string,
  plural?: string
) {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

export function formatCount(
  count: number,
  noun: string
): string {
  return `${formatNumber(count)} ${noun}`;
}

export function formatCountNoun(
  count: number,
  singular: string,
  plural?: string
) {
  return `${formatNumber(count)} ${pluralize(
    count,
    singular,
    plural
  )}`;
}

export function formatPercent(
  value: number,
  total: number
): string {
  if (total <= 0) return "0%";

  return `${Math.round((value / total) * 100)}%`;
}

export function formatRating(
  average: number
): string {
  return average.toFixed(1);
}

export function formatRatingSummary(
  summary: RatingSummary
): string {
  if (summary.count === 0) {
    return "No ratings yet";
  }

  return `${formatRating(
    summary.average
  )} (${formatCountNoun(
    summary.count,
    "rating"
  )})`;
}

export function truncate(
  text: string,
  maxLength: number
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text
    .slice(0, maxLength - 1)
    .trimEnd()}…`;
}

export function initialsFrom(
  name: string
): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 0 || !parts[0]) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export function describeTargetAudience(
  audience: TargetAudience
): string {
  const typeLabels = audience.userTypes.map(
    (type) =>
      CAMPUS_USER_TYPE_LABELS[type]
  );

  if (typeLabels.length === 0) {
    return "No audience selected";
  }

  let scope: string | null = null;

  if (audience.programIds.length > 0) {
    scope = audience.programIds
      .map((id) => getProgram(id)?.name)
      .filter(Boolean)
      .join(", ");
  } else if (
    audience.departmentIds.length > 0
  ) {
    scope = audience.departmentIds
      .map((id) => getDepartment(id)?.name)
      .filter(Boolean)
      .join(", ");
  } else if (
    audience.collegeIds.length > 0
  ) {
    scope = audience.collegeIds
      .map(
        (id) =>
          getCollege(id)?.shortName
      )
      .filter(Boolean)
      .join(", ");
  }

  if (!scope) {
    return typeLabels
      .map((label) => `All ${label}`)
      .join(", ");
  }

  return typeLabels
    .map(
      (label) =>
        `${scope} ${label}`
    )
    .join(", ");
}

export function describeTargetAudienceShort(
  audience: TargetAudience
): string {
  const types = audience.userTypes
    .map(
      (type) =>
        CAMPUS_USER_TYPE_LABELS[type]
    )
    .join(", ");

  const colleges =
    audience.collegeIds.length > 0
      ? audience.collegeIds
          .map(
            (id) =>
              getCollege(id)?.shortName
          )
          .filter(Boolean)
          .join(", ")
      : "All colleges";

  return `${colleges} · ${
    types || "No types"
  }`;
}