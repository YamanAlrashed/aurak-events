"use client";

import type { CampusLocation } from "@/lib/types";
import { Field, Input, Select } from "@/components/ui/Field";
import {
  BUILDING_OPTIONS,
  getBuilding,
} from "@/lib/data/campus-reference";

export function LocationPicker({
  value,
  onChange,
  errors,
}: {
  value: CampusLocation;
  onChange: (location: CampusLocation) => void;
  errors?: { buildingId?: string };
}) {
  function update(patch: Partial<CampusLocation>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="Building"
        required
        error={errors?.buildingId}
        htmlFor="buildingId"
      >
        <Select
          id="buildingId"
          options={BUILDING_OPTIONS}
          placeholder="Select a building"
          value={value.buildingId}
          invalid={Boolean(errors?.buildingId)}
          onChange={(event) => {
            const buildingId = event.target.value;

            update({
              buildingId,
              buildingName: getBuilding(buildingId)?.name ?? "",
            });
          }}
        />
      </Field>

      <Field
        label="Room / Area"
        hint="Optional. Example: K-204 or Ground Floor Atrium."
        htmlFor="room"
      >
        <Input
          id="room"
          value={value.room ?? ""}
          onChange={(event) => update({ room: event.target.value })}
          placeholder="K-204"
        />
      </Field>

      <Field
        label="Location Name"
        hint="Optional friendly label shown to users."
        htmlFor="locationName"
        className="sm:col-span-2"
      >
        <Input
          id="locationName"
          value={value.locationName ?? ""}
          onChange={(event) => update({ locationName: event.target.value })}
          placeholder="Innovation Lab"
        />
      </Field>
    </div>
  );
}