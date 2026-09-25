"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Info,
  RefreshCw,
} from "lucide-react";
import type {
  CountBucket,
  CRMStatus,
  MarketingEventStats,
} from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
} from "@/components/ui";
import { BarList } from "@/components/shared/BarList";
import { RegistrationTable } from "@/components/marketing/RegistrationTable";
import {
  getBreakdownForEvent,
  resyncEvent,
} from "@/lib/services/mockCrmService";
import { useToast } from "@/lib/context/ToastContext";
import {
  CRM_STATUS_LABELS,
  CRM_STATUS_ORDER,
} from "@/lib/utils/constants";
import { formatNumber } from "@/lib/utils/format";

export function CrmBreakdownPanel({
  eventId,
  stats,
  onStatsChanged,
}: {
  eventId: string;
  stats: MarketingEventStats;
  onStatsChanged: () => void;
}) {
  const { showToast } =
    useToast();

  const [
    breakdown,
    setBreakdown,
  ] = useState<
    Record<CRMStatus, number>
  >(stats.crmBreakdown);

  const [
    selected,
    setSelected,
  ] = useState<
    CRMStatus | "all"
  >("all");

  const [
    syncing,
    setSyncing,
  ] = useState(false);

  const [
    refreshKey,
    setRefreshKey,
  ] = useState(0);

  const load =
    useCallback(async () => {
      setBreakdown(
        await getBreakdownForEvent(
          eventId
        )
      );
    }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleResync() {
    setSyncing(true);

    try {
      const changed =
        await resyncEvent(
          eventId
        );

      await load();

      setRefreshKey(
        (key) => key + 1
      );

      onStatsChanged();

      showToast({
        title:
          "CRM sync complete",
        description:
          changed === 0
            ? "No statuses changed."
            : `${formatNumber(
                changed
              )} statuses updated.`,
      });
    } finally {
      setSyncing(false);
    }
  }

  const buckets:
    CountBucket[] =
    CRM_STATUS_ORDER.map(
      (status) => ({
        id: status,
        label:
          CRM_STATUS_LABELS[
            status
          ],
        count:
          breakdown[
            status
          ],
      })
    );

  const bucketTotal =
    buckets.reduce(
      (sum, bucket) =>
        sum +
        bucket.count,
      0
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="CRM status breakdown"
          actions={
            <Button
              variant="secondary"
              size="sm"
              loading={syncing}
              onClick={
                handleResync
              }
              icon={
                <RefreshCw className="h-3.5 w-3.5" />
              }
            >
              Sync CRM
            </Button>
          }
        />

        <CardBody className="space-y-4">
          <div className="alert alert-info">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden
            />

            <span>
              These figures count{" "}
              <strong>
                prospects
              </strong>{" "}
              and add up to{" "}
              {formatNumber(
                bucketTotal
              )}{" "}
              registrations. They are
              separate from the{" "}
              {formatNumber(
                stats.visitors
              )}{" "}
              visitors who physically
              attended.{" "}
              <strong>
                New Lead
              </strong>{" "}
              means the person was not
              found in the CRM.
            </span>
          </div>

          <BarList
            buckets={buckets}
            total={bucketTotal}
            onSelect={(bucket) =>
              setSelected(
                (current) =>
                  current ===
                  bucket.id
                    ? "all"
                    : (bucket.id as CRMStatus)
              )
            }
            selectedId={
              selected ===
              "all"
                ? undefined
                : selected
            }
          />

          <p className="field-hint">
            Select a status to filter the
            registrations below. Selecting
            it again clears the filter.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            selected ===
            "all"
              ? "All registrations"
              : `${CRM_STATUS_LABELS[selected]} registrations`
          }
        />

        <CardBody>
          <RegistrationTable
            eventId={eventId}
            initialCrmStatus={
              selected
            }
            refreshKey={
              refreshKey
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Prototype note" />

        <CardBody>
          <p className="meta-text">
            Meritto is not connected.
            Statuses are resolved by a mock
            service keyed on the
            prospect&apos;s email or phone,
            so they stay stable across
            syncs. Event attribution is
            stored separately from CRM
            status and is never overwritten
            by a sync.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}