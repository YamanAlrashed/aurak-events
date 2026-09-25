"use client";

import { useMemo } from "react";
import type { StaffDepartment } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import {
  MultiSelect,
  type MultiSelectGroup,
} from "@/components/ui/MultiSelect";
import {
  STAFF_DEPARTMENT_LABELS,
  STAFF_GROUPS,
  getStaffMember,
} from "@/lib/data/marketing-reference";

/* =============================================================================
   Marketing staff assignment.

   MARKETING ONLY. Campus events have no concept of assigned staff, and this
   component is never imported by the Campus module.
   ========================================================================== */

export function StaffAssignmentPicker({
  selected,
  onChange,
  error,
}: {
  selected: string[];
  onChange: (staffIds: string[]) => void;
  error?: string;
}) {
  const groups: MultiSelectGroup[] = useMemo(
    () =>
      STAFF_GROUPS.map((group) => ({
        id: group.department,
        label: `${group.label} (${group.members.length})`,
        options: group.members.map((member) => ({
          value: member.id,
          label: member.name,
        })),
      })),
    []
  );

  const summary = useMemo(() => {
    const byDepartment = new Map<StaffDepartment, string[]>();

    for (const staffId of selected) {
      const member = getStaffMember(staffId);

      if (!member) continue;

      const current = byDepartment.get(member.department) ?? [];
      current.push(member.name);
      byDepartment.set(member.department, current);
    }

    return Array.from(byDepartment.entries());
  }, [selected]);

  return (
    <div className="space-y-4">
      <MultiSelect
        groups={groups}
        selected={selected}
        onChange={onChange}
        searchPlaceholder="Search by name…"
        emptyLabel="No staff assigned yet. Select people from any combination of groups."
        maxHeightClass="max-h-80"
      />

      {error && <p className="field-error">{error}</p>}

      {summary.length > 0 && (
        <div className="rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-[var(--aurak-bg-subtle)] p-3">
          <p className="text-xs font-medium uppercase tracking-[0.04em] text-[var(--aurak-text-muted)]">
            Assigned team
          </p>

          <ul className="mt-2 space-y-2">
            {summary.map(([department, names]) => (
              <li key={department}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand">
                    {STAFF_DEPARTMENT_LABELS[department]}
                  </Badge>

                  <span className="text-sm text-[var(--aurak-text)]">
                    {names.join(", ")}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <p className="field-hint mt-2">
            Assigned staff will see this event, its departure time, the map link
            and the driver details on their own screen.
          </p>
        </div>
      )}
    </div>
  );
}