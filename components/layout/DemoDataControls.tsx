"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
} from "@/components/ui";
import { resetMockData } from "@/lib/data/store";

/* =============================================================================
   Prototype demo controls.

   Everything in this application is stored in this browser's localStorage.
   Resetting rebuilds the seeded dataset so a demo can be run again cleanly.

   DELETE THIS COMPONENT when a real backend is connected.
   ========================================================================== */

export function DemoDataControls() {
  const [
    open,
    setOpen,
  ] = useState(false);

  function handleReset() {
    resetMockData();

    /*
     * Reloading clears page-level cached state and forces every service
     * to read the newly rebuilt mock database.
     */
    window.location.reload();
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Prototype data"
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setOpen(
                  true
                )
              }
              icon={
                <RotateCcw className="h-3.5 w-3.5" />
              }
            >
              Reset demo data
            </Button>
          }
        />

        <CardBody>
          <p className="meta-text">
            All events, registrations,
            RSVPs, check-ins, galleries,
            ratings and feedback are stored
            in this browser only. Nothing
            is sent to a server, and other
            devices will not see your
            changes. Resetting restores the
            original demo dataset.
          </p>
        </CardBody>
      </Card>

      <ConfirmDialog
        open={open}
        onClose={() =>
          setOpen(false)
        }
        title="Reset all demo data?"
        description="Every change made in this browser will be discarded and the original demo dataset restored. The page will reload."
        confirmLabel="Reset data"
        destructive
        onConfirm={
          handleReset
        }
      />
    </>
  );
}