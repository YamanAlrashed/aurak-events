"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Archive,
  ImagePlus,
  Info,
} from "lucide-react";
import type { EventGallery } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
} from "@/components/ui";
import { PhotoGrid } from "@/components/shared/PhotoGrid";
import {
  addMockPhotos,
  getGallery,
  removePhoto,
  setGalleryArchived,
} from "@/lib/services/galleryService";
import { useAuth } from "@/lib/context/AuthContext";
import { useToast } from "@/lib/context/ToastContext";
import {
  formatMediumDate,
  formatDateTime,
} from "@/lib/utils/dates";
import {
  formatCountNoun,
  formatNumber,
} from "@/lib/utils/format";
import { GALLERY_ACTIVE_MONTHS } from "@/lib/utils/constants";

export function GalleryManager({
  eventId,
}: {
  eventId: string;
}) {
  const { user } =
    useAuth();

  const { showToast } =
    useToast();

  const [gallery, setGallery] =
    useState<EventGallery | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [uploading, setUploading] =
    useState(false);

  const [
    archiveDialogOpen,
    setArchiveDialogOpen,
  ] = useState(false);

  const [
    pendingRemoval,
    setPendingRemoval,
  ] = useState<
    string | null
  >(null);

  const load =
    useCallback(async () => {
      setLoading(true);

      setGallery(
        await getGallery(
          eventId
        )
      );

      setLoading(false);
    }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpload(
    count: number
  ) {
    setUploading(true);

    try {
      const result =
        await addMockPhotos(
          eventId,
          count,
          user?.campusUserId ??
            "cu-shalaby"
        );

      setGallery(
        result.gallery
      );

      showToast({
        title:
          `${formatCountNoun(
            count,
            "photo"
          )} added`,

        description:
          result.notifiedCount >
          0
            ? `${formatNumber(
                result.notifiedCount
              )} checked-in attendees were notified.`
            : "No new notifications were sent — the gallery was already published.",
      });
    } catch {
      showToast({
        title:
          "Could not add photos",

        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(
    photoId: string
  ) {
    await removePhoto(
      photoId
    );

    setGallery(
      await getGallery(
        eventId
      )
    );

    showToast({
      title:
        "Photo removed",
    });
  }

  async function handleArchiveToggle() {
    if (!gallery) {
      return;
    }

    const nextArchived =
      gallery.status !==
      "archived";

    const updated =
      await setGalleryArchived(
        eventId,
        nextArchived
      );

    setGallery(updated);

    showToast({
      title:
        nextArchived
          ? "Gallery archived"
          : "Gallery restored",

      description:
        nextArchived
          ? "Photos are retained and remain available to Admin."
          : "Users can browse this gallery again.",
    });
  }

  if (
    loading ||
    !gallery
  ) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-40 w-full" />
        </CardBody>
      </Card>
    );
  }

  const isArchived =
    gallery.status ===
    "archived";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Gallery"
          actions={
            isArchived ? (
              <Badge variant="neutral">
                Archived
              </Badge>
            ) : gallery.status ===
              "active" ? (
              <Badge variant="success">
                Active
              </Badge>
            ) : (
              <Badge variant="neutral">
                Empty
              </Badge>
            )
          }
        />

        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="stat-label">
                Photos
              </p>

              <p className="mt-1 text-sm tabular text-[var(--aurak-navy)]">
                {formatNumber(
                  gallery.photos
                    .length
                )}
              </p>
            </div>

            <div>
              <p className="stat-label">
                Published
              </p>

              <p className="mt-1 text-sm text-[var(--aurak-navy)]">
                {gallery.publishedAt
                  ? formatDateTime(
                      gallery.publishedAt
                    )
                  : "Not published"}
              </p>
            </div>

            <div>
              <p className="stat-label">
                Archives on
              </p>

              <p className="mt-1 text-sm text-[var(--aurak-navy)]">
                {gallery.archivesOn
                  ? formatMediumDate(
                      gallery.archivesOn
                    )
                  : "—"}
              </p>
            </div>
          </div>

          <div className="alert alert-info">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden
            />

            <span>
              Galleries stay browsable for{" "}
              {GALLERY_ACTIVE_MONTHS} months, then
              become archived. Photos are never deleted
              and Admin keeps access. Publishing the
              first batch notifies people who actually
              checked in — never those who only replied
              to the RSVP.
            </span>
          </div>

          {isArchived && (
            <div className="alert alert-warning">
              <Archive
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden
              />

              <span>
                This gallery is archived. Users will not
                see it while browsing.
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              loading={uploading}
              onClick={() =>
                handleUpload(4)
              }
              icon={
                <ImagePlus className="h-4 w-4" />
              }
            >
              Add 4 photos
            </Button>

            <Button
              variant="secondary"
              loading={uploading}
              onClick={() =>
                handleUpload(8)
              }
            >
              Add 8 photos
            </Button>

            <Button
              variant={
                isArchived
                  ? "secondary"
                  : "danger-soft"
              }
              onClick={() =>
                isArchived
                  ? void handleArchiveToggle()
                  : setArchiveDialogOpen(
                      true
                    )
              }
            >
              {isArchived
                ? "Restore gallery"
                : "Archive gallery"}
            </Button>
          </div>

          <p className="field-hint">
            Prototype upload: placeholder images are
            added. No file picker or storage provider is
            connected.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Photos (${formatNumber(
            gallery.photos
              .length
          )})`}
        />

        <CardBody>
          <PhotoGrid
            photos={
              gallery.photos
            }
            onRemove={(
              photoId
            ) =>
              setPendingRemoval(
                photoId
              )
            }
          />
        </CardBody>
      </Card>

      <ConfirmDialog
        open={
          archiveDialogOpen
        }
        onClose={() =>
          setArchiveDialogOpen(
            false
          )
        }
        title="Archive this gallery?"
        description="Users will no longer see it while browsing. Photos are retained and Admin keeps full access."
        confirmLabel="Archive gallery"
        onConfirm={
          handleArchiveToggle
        }
      />

      <ConfirmDialog
        open={
          pendingRemoval !==
          null
        }
        onClose={() =>
          setPendingRemoval(
            null
          )
        }
        title="Remove this photo?"
        description="It will be deleted from the gallery."
        confirmLabel="Remove photo"
        destructive
        onConfirm={async () => {
          if (
            pendingRemoval
          ) {
            await handleRemove(
              pendingRemoval
            );
          }
        }}
      />
    </div>
  );
}