"use client";

import { useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Field,
  SearchInput,
  Select,
  StatCard,
  Tabs,
  TextField,
} from "@/components/ui";
import { EventStatusBadge } from "@/components/shared/EventStatusBadge";
import { BUILDING_OPTIONS } from "@/lib/data/campus-reference";
import { describeTargetAudience } from "@/lib/utils/format";
import {
  formatDateProximity,
  formatEventDate,
  formatTimeRange,
  todayISO,
} from "@/lib/utils/dates";

export default function PrimitiveHarnessPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);

  const today = todayISO();

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Primitive Harness"
        subtitle="Temporary — replaced by the real dashboard in Phase 5."
        actions={
          <>
            <Button variant="secondary">Export</Button>

            <Button
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1200);
              }}
            >
              Create Event
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="RSVP Yes"
          value={160}
          caption="Not attendance"
          icon={<Users className="h-4 w-4" />}
        />

        <StatCard
          label="Checked In"
          value={127}
          caption="From QR scans"
        />

        <StatCard
          label="Upcoming"
          value={8}
          icon={<CalendarDays className="h-4 w-4" />}
        />

        <StatCard
          label="Avg Rating"
          value="4.3"
          caption="48 ratings"
        />
      </div>

      <Card>
        <CardHeader title="Status badges (derived from the clock)" />

        <CardBody className="flex flex-wrap gap-2">
          <EventStatusBadge
            event={{
              date: "2027-01-01",
              startTime: "09:00",
              endTime: "11:00",
              status: "upcoming",
            }}
          />

          <EventStatusBadge
            event={{
              date: today,
              startTime: "00:01",
              endTime: "23:59",
              status: "upcoming",
            }}
          />

          <EventStatusBadge
            event={{
              date: "2024-01-01",
              startTime: "09:00",
              endTime: "11:00",
              status: "upcoming",
            }}
          />

          <EventStatusBadge
            event={{
              date: "2024-01-01",
              startTime: "09:00",
              endTime: "11:00",
              status: "archived",
            }}
          />

          <Badge variant="brand">
            Engineering
          </Badge>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Dates" />

        <CardBody className="space-y-1 text-sm">
          <p>{formatEventDate("2026-10-14")}</p>
          <p>{formatTimeRange("14:30", "17:00")}</p>
          <p>Today → {formatDateProximity(today)}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Target audience (notification routing only)" />

        <CardBody className="space-y-1 text-sm">
          <p>
            {describeTargetAudience({
              userTypes: ["student", "faculty"],
              collegeIds: ["college-engineering"],
              departmentIds: [],
              programIds: [],
            })}
          </p>

          <p>
            {describeTargetAudience({
              userTypes: ["student"],
              collegeIds: [],
              departmentIds: [],
              programIds: [],
            })}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Form controls" />

        <CardBody className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Event Name"
            required
            placeholder="AI Workshop"
          />

          <TextField
            label="With error"
            error="This field is required."
            defaultValue="bad"
          />

          <Field label="Location" required>
            <Select
              options={BUILDING_OPTIONS}
              placeholder="Select a building"
              defaultValue=""
            />
          </Field>

          <Field label="Search">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search events…"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <Tabs
          className="px-5 pt-1"
          items={[
            { id: "overview", label: "Overview" },
            { id: "rsvp", label: "RSVP", count: 220 },
            { id: "attendees", label: "Attendees", count: 127 },
            { id: "gallery", label: "Gallery", count: 12 },
          ]}
          activeId={tab}
          onChange={setTab}
        />

        <CardBody>
          <p className="meta-text">
            Active tab: {tab}
          </p>
        </CardBody>
      </Card>

      <Card>
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No events yet"
          description="Create your first event to get started."
          action={
            <Button size="sm">
              Create Event
            </Button>
          }
        />
      </Card>
    </div>
  );
}