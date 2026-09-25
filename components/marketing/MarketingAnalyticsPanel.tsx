"use client";

import {
  useEffect,
  useState,
} from "react";
import { Info } from "lucide-react";
import type { MarketingAnalytics } from "@/lib/types";
import {
  Card,
  CardBody,
  CardHeader,
  StatCard,
} from "@/components/ui";
import { BarList } from "@/components/shared/BarList";
import {
  getEventAnalytics,
  getOverallAnalytics,
} from "@/lib/services/marketingAnalyticsService";
import {
  formatNumber,
  formatPercent,
} from "@/lib/utils/format";

export function MarketingAnalyticsPanel({
  eventId,
  refreshKey = 0,
}: {
  eventId?: string;
  refreshKey?: number;
}) {
  const [
    analytics,
    setAnalytics,
  ] = useState<
    MarketingAnalytics | null
  >(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const result =
        eventId
          ? await getEventAnalytics(
              eventId
            )
          : await getOverallAnalytics();

      if (!cancelled) {
        setAnalytics(result);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [eventId, refreshKey]);

  if (
    loading ||
    !analytics
  ) {
    return (
      <div
        className="space-y-3"
        aria-busy="true"
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({
            length: 4,
          }).map(
            (_, index) => (
              <div
                key={index}
                className="stat-card space-y-2"
              >
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-7 w-16" />
              </div>
            )
          )}
        </div>

        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  const { stats } =
    analytics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Visitors"
          value={
            stats.visitors
          }
          caption="People who arrived, guests included"
        />

        <StatCard
          label="Students"
          value={
            stats.students
          }
          caption="Prospects who registered"
        />

        <StatCard
          label="Attended"
          value={
            stats.attended
          }
          caption="Registrations checked in"
        />

        <StatCard
          label="Turnout"
          value={
            stats.totalRegistrations >
            0
              ? formatPercent(
                  stats.attended,
                  stats.totalRegistrations
                )
              : "—"
          }
          caption="Of registrations"
        />
      </div>

      <div className="alert alert-info">
        <Info
          className="mt-0.5 h-4 w-4 shrink-0"
          aria-hidden
        />

        <span>
          <strong>
            Visitors and students are
            different measures.
          </strong>{" "}
          {formatNumber(
            stats.students
          )}{" "}
          prospects registered and{" "}
          {formatNumber(
            stats.visitors
          )}{" "}
          people physically attended,
          because prospects bring family
          and friends. Do not add these
          figures together.
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Registration type" />

          <CardBody>
            <BarList
              buckets={
                analytics.byRegistrationType
              }
              total={
                stats.totalRegistrations
              }
              emptyLabel="No registrations yet."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="CRM status" />

          <CardBody>
            <BarList
              buckets={
                analytics.byCrmStatus
              }
              total={
                stats.totalRegistrations
              }
              emptyLabel="No registrations yet."
            />

            <p className="field-hint mt-3">
              Counts prospects. New Lead
              means not found in the CRM.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Program of interest" />

        <CardBody>
          <BarList
            buckets={
              analytics.byProgramOfInterest
            }
            total={
              stats.totalRegistrations
            }
            maxRows={8}
            emptyLabel="No registrations yet."
          />

          <p className="field-hint mt-3">
            Top programs by number of
            prospects.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Intake" />

          <CardBody>
            <BarList
              buckets={
                analytics.byIntake
              }
              total={
                stats.totalRegistrations
              }
              emptyLabel="No registrations yet."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Emirate of residence" />

          <CardBody>
            <BarList
              buckets={
                analytics.byEmirate
              }
              total={
                stats.totalRegistrations
              }
              maxRows={9}
              emptyLabel="No registrations yet."
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}