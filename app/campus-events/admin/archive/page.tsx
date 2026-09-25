"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { Archive } from "lucide-react";
import type {
  CampusEvent,
  RsvpBreakdown,
} from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Tabs,
} from "@/components/ui";
import { CampusEventCard } from "@/components/campus/CampusEventCard";
import { LoadingSection } from "@/components/shared/LoadingSection";
import { listEvents } from "@/lib/services/campusEventService";
import { getBreakdowns } from "@/lib/services/campusRsvpService";
import { getAttendedCounts } from "@/lib/services/campusAttendanceService";
import { listArchivedGalleries } from "@/lib/services/galleryService";
import { formatMediumDate } from "@/lib/utils/dates";
import { formatCountNoun } from "@/lib/utils/format";

type TabId =
  | "events"
  | "galleries";

interface ArchivedGallery {
  eventId: string;
  eventName: string;
  photoCount: number;
  archivesOn:
    string | null;
}

export default function CampusAdminArchivePage() {
  const [events, setEvents] =
    useState<CampusEvent[]>(
      []
    );

  const [rsvps, setRsvps] =
    useState<
      Record<
        string,
        RsvpBreakdown
      >
    >({});

  const [attended, setAttended] =
    useState<
      Record<
        string,
        number
      >
    >({});

  const [
    galleries,
    setGalleries,
  ] =
    useState<
      ArchivedGallery[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [tab, setTab] =
    useState<TabId>(
      "events"
    );

  const load =
    useCallback(async () => {
      setLoading(true);

      const archived =
        await listEvents({
          status:
            "archived",

          includeArchived:
            true,
        });

      const ids =
        archived.map(
          (event) =>
            event.id
        );

      const [
        breakdowns,
        counts,
        archivedGalleries,
      ] =
        await Promise.all([
          getBreakdowns(
            ids
          ),

          getAttendedCounts(
            ids
          ),

          listArchivedGalleries(),
        ]);

      setEvents(
        archived
      );

      setRsvps(
        breakdowns
      );

      setAttended(
        counts
      );

      setGalleries(
        archivedGalleries
      );

      setLoading(
        false
      );
    }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page space-y-5">
      <PageHeader
        title="Archive"
        subtitle="Archived events and galleries remain fully available to Admin. Nothing is deleted."
      />

      <Card>
        <Tabs
          className="px-5 pt-1"
          items={[
            {
              id:
                "events",

              label:
                "Archived Events",

              count:
                events.length,
            },
            {
              id:
                "galleries",

              label:
                "Archived Galleries",

              count:
                galleries.length,
            },
          ]}
          activeId={tab}
          onChange={(id) =>
            setTab(
              id as TabId
            )
          }
        />

        <CardBody>
          {loading ? (
            <LoadingSection rows={2} />
          ) : tab ===
            "events" ? (
            events.length ===
            0 ? (
              <EmptyState
                icon={
                  <Archive className="h-6 w-6" />
                }
                title="No archived events"
                description="Completed events can be archived from their event page."
              />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {events.map(
                  (event) => (
                    <CampusEventCard
                      key={
                        event.id
                      }
                      event={
                        event
                      }
                      href={`/campus-events/admin/events/${event.id}`}
                      rsvp={
                        rsvps[
                          event.id
                        ]
                      }
                      attendedCount={
                        attended[
                          event.id
                        ]
                      }
                    />
                  )
                )}
              </div>
            )
          ) : galleries.length ===
            0 ? (
            <EmptyState
              icon={
                <Archive className="h-6 w-6" />
              }
              title="No archived galleries"
              description="Galleries archive automatically 24 months after publication, or can be archived manually."
            />
          ) : (
            <ul className="divide-y divide-[var(--aurak-line)]">
              {galleries.map(
                (gallery) => (
                  <li
                    key={
                      gallery.eventId
                    }
                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--aurak-navy)]">
                        {
                          gallery.eventName
                        }
                      </p>

                      <p className="meta-text">
                        {formatCountNoun(
                          gallery.photoCount,
                          "photo"
                        )}

                        {gallery.archivesOn
                          ? ` · archived from ${formatMediumDate(
                              gallery.archivesOn
                            )}`
                          : ""}
                      </p>
                    </div>

                    <Link
                      href={`/campus-events/admin/events/${gallery.eventId}`}
                      className="btn btn-secondary btn-sm shrink-0"
                    >
                      Open gallery
                    </Link>
                  </li>
                )
              )}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Retention" />

        <CardBody>
          <p className="meta-text">
            Photos are never automatically deleted.
            Archiving affects browsing visibility only —
            Admin retains access to every archived gallery
            indefinitely. In the production system this
            archiving will run as a scheduled job rather
            than being evaluated on read.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}