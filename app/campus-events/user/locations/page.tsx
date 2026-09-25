"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
} from "@/components/ui";
import { LoadingSection } from "@/components/shared/LoadingSection";
import {
  getEventsByBuilding,
  type BuildingEventCount,
} from "@/lib/services/campusEventService";
import { formatNumber } from "@/lib/utils/format";

export default function CampusUserLocationsPage() {
  const [buildings, setBuildings] =
    useState<BuildingEventCount[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await getEventsByBuilding();

      if (!cancelled) {
        setBuildings(result);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Events by Location"
        subtitle="Choose a building to see what is happening there."
      />

      {loading ? (
        <LoadingSection rows={3} />
      ) : (
        <div className="space-y-3">
          {buildings.map((building) => (
            <Link
              key={building.buildingId}
              href={`/campus-events/user/locations/${building.buildingId}`}
              className="card card-interactive flex items-center gap-3 p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--aurak-brand-soft)] text-[var(--aurak-brand)]">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-semibold text-[var(--aurak-navy)]">
                  {building.buildingName}
                </p>

                <p className="truncate text-xs text-[var(--aurak-text-muted)]">
                  {building.campus ?? "AURAK"} ·{" "}
                  {building.upcomingCount === 0
                    ? "No events scheduled"
                    : `${formatNumber(building.upcomingCount)} ${
                        building.upcomingCount === 1
                          ? "event"
                          : "events"
                      } coming up`}
                </p>
              </div>

              <ChevronRight
                className="h-5 w-5 shrink-0 text-[var(--aurak-text-subtle)]"
                aria-hidden
              />
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="About locations" />

        <CardBody>
          <p className="meta-text">
            Campus events take place in the AURAK buildings listed above.
            Recruitment events held in other emirates are run by the
            Marketing team and are not shown here.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}