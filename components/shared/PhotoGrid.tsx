"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { EventPhoto } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { isMockPhoto, mockPhotoBackground } from "@/lib/utils/mockPhoto";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

function PhotoTile({ photo }: { photo: EventPhoto }) {
  if (isMockPhoto(photo.url)) {
    return (
      <div
        className="h-full w-full"
        style={{ background: mockPhotoBackground(photo.url) }}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo.url}
      alt={photo.caption ?? "Event photo"}
      className="h-full w-full object-cover"
    />
  );
}

export function PhotoGrid({
  photos,
  onRemove,
  className,
}: {
  photos: EventPhoto[];
  onRemove?: (photoId: string) => void;
  className?: string;
}) {
  const [active, setActive] = useState<EventPhoto | null>(null);

  if (photos.length === 0) {
    return <p className="meta-text">No photos have been added yet.</p>;
  }

  return (
    <>
      <ul
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4",
          className
        )}
      >
        {photos.map((photo) => (
          <li key={photo.id} className="group relative">
            <button
              type="button"
              onClick={() => setActive(photo)}
              className="block aspect-[4/3] w-full overflow-hidden rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] transition-transform hover:scale-[1.02]"
            >
              <PhotoTile photo={photo} />
              <span className="sr-only">
                Open photo{photo.caption ? `: ${photo.caption}` : ""}
              </span>
            </button>

            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                aria-label="Remove photo"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[var(--aurak-danger)] opacity-0 shadow-[var(--aurak-shadow-sm)] transition-opacity hover:bg-white group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <Modal
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.caption ?? "Event photo"}
        description={
          active ? `Added ${formatDateTime(active.uploadedAt)}` : undefined
        }
        size="lg"
      >
        {active && (
          <div className="aspect-[4/3] w-full overflow-hidden rounded-[var(--aurak-radius)] border border-[var(--aurak-line)]">
            <PhotoTile photo={active} />
          </div>
        )}
      </Modal>
    </>
  );
}