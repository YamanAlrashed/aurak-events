"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  Field,
  Modal,
  MultiSelect,
  NumberStepper,
  StarRating,
  StarRatingDisplay,
  Toggle,
} from "@/components/ui";
import { MockQrCode } from "@/components/shared/MockQrCode";
import { MockQrScanner } from "@/components/shared/MockQrScanner";
import { useToast } from "@/lib/context/ToastContext";
import { STAFF_GROUPS } from "@/lib/data/marketing-reference";

export default function OverlayHarnessPage() {
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showRating, setShowRating] = useState(true);
  const [staff, setStaff] = useState<string[]>([
    "staff-jumana",
    "staff-yaman",
  ]);
  const [guests, setGuests] = useState(1);
  const [stars, setStars] = useState(0);

  const staffMultiSelectGroups = STAFF_GROUPS.map((group) => ({
    id: group.department,
    label: group.label,
    options: group.members.map((member) => ({
      value: member.id,
      label: member.name,
    })),
  }));

  return (
    <div className="page space-y-6">
      <PageHeader
        title="Overlay Harness"
        subtitle="Temporary — replaced by the real dashboard in Phase 5."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(true)}
            >
              Open Modal
            </Button>

            <Button
              variant="danger-soft"
              onClick={() => setConfirmOpen(true)}
            >
              Delete Event
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader title="Toasts" />

        <CardBody className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() =>
              showToast({
                title: "Event created",
                description: "AI Workshop is now upcoming.",
              })
            }
          >
            Success
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              showToast({
                title: "Already checked in",
                variant: "error",
              })
            }
          >
            Error
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              showToast({
                title: "Export started",
                variant: "info",
              })
            }
          >
            Info
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Toggle" />

        <CardBody>
          <Toggle
            checked={showRating}
            onChange={setShowRating}
            label="Show Average Rating to Users"
            description="When off, users see the gallery and event details but not the average rating."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Assign staff (grouped multi-select)" />

        <CardBody>
          <MultiSelect
            groups={staffMultiSelectGroups}
            selected={staff}
            onChange={setStaff}
            searchPlaceholder="Search staff…"
            emptyLabel="No staff assigned yet."
          />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Visitor count" />

          <CardBody>
            <NumberStepper
              value={guests}
              onChange={setGuests}
              min={1}
              max={10}
              quickPicks={[1, 2, 3, 4]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Ratings" />

          <CardBody className="space-y-4">
            <div>
              <p className="label">
                Interactive (click again to clear)
              </p>

              <StarRating
                value={stars}
                onChange={setStars}
              />

              <p className="meta-text mt-1">
                Value: {stars}
              </p>
            </div>

            <div>
              <p className="label">
                Read-only average
              </p>

              <StarRatingDisplay
                average={4.3}
                count={48}
                size="md"
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Mock QR — one per user + event" />

          <CardBody className="flex flex-wrap items-start justify-center gap-6">
            <MockQrCode
              code="AURAK-CE-evt_001-cu_2023006308"
              size={160}
            />

            <MockQrCode
              code="AURAK-CE-evt_002-cu_2023006308"
              size={160}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mock scanner" />

          <CardBody>
            <MockQrScanner
              samples={[
                {
                  code: "AURAK-CE-evt_001-cu_2023006308",
                  label: "Omar Al Hashmi",
                  hint: "RSVP: Yes",
                },
                {
                  code: "AURAK-CE-evt_001-cu_1001",
                  label: "Sara Al Mansoori",
                  hint: "Already checked in",
                },
              ]}
              onScan={(code) =>
                showToast({
                  title: "Scanned",
                  description: code,
                  variant: "info",
                })
              }
            />
          </CardBody>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Export Event Data"
        description="Prototype export — no file is produced yet."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={() => {
                setModalOpen(false);

                showToast({
                  title: "Export ready",
                });
              }}
            >
              Export
            </Button>
          </>
        }
      >
        <Field label="Scope">
          <p className="meta-text">
            Modal body content scrolls if it gets tall.
          </p>
        </Field>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this event?"
        description="Only upcoming and cancelled events can be deleted. This cannot be undone."
        confirmLabel="Delete Event"
        destructive
        onConfirm={async () => {
          await new Promise((resolve) =>
            setTimeout(resolve, 900)
          );

          showToast({
            title: "Event deleted",
            variant: "success",
          });
        }}
      />
    </div>
  );
}