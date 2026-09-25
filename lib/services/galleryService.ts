import type {
  EventGallery,
  EventPhoto,
  GalleryStatus,
} from "@/lib/types";
import {
  clone,
  getDb,
  mutate,
  simulateLatency,
} from "@/lib/data/store";
import { createId } from "@/lib/utils/id";
import { mockPhotoToken } from "@/lib/utils/mockPhoto";
import {
  galleryArchiveDate,
  isGalleryPastArchiveWindow,
} from "@/lib/utils/dates";
import { notifyPhotosAvailable } from "@/lib/services/notificationService";

function resolveStatus(
  publishedAt: string | null,
  archivedFlag: boolean,
  photoCount: number
): GalleryStatus {
  if (photoCount === 0) {
    return "empty";
  }

  if (archivedFlag) {
    return "archived";
  }

  if (
    publishedAt &&
    isGalleryPastArchiveWindow(
      publishedAt
    )
  ) {
    return "archived";
  }

  return "active";
}

export async function getGallery(
  eventId: string
): Promise<EventGallery> {
  await simulateLatency(
    150
  );

  const db = getDb();

  const record =
    db.galleries.find(
      (item) =>
        item.eventId ===
        eventId
    );

  const photos =
    db.eventPhotos
      .filter(
        (item) =>
          item.eventId ===
          eventId
      )
      .sort((a, b) =>
        a.uploadedAt.localeCompare(
          b.uploadedAt
        )
      );

  const publishedAt =
    record?.publishedAt ??
    null;

  return clone({
    eventId,

    status:
      resolveStatus(
        publishedAt,
        record?.archived ??
          false,
        photos.length
      ),

    photos,

    publishedAt,

    archivesOn:
      publishedAt
        ? galleryArchiveDate(
            publishedAt
          )
        : null,
  });
}

export async function getPhotoCounts(
  eventIds: string[]
): Promise<
  Record<string, number>
> {
  await simulateLatency(
    100
  );

  const photos =
    getDb().eventPhotos;

  const result: Record<
    string,
    number
  > = {};

  for (
    const eventId
    of eventIds
  ) {
    result[eventId] =
      photos.filter(
        (item) =>
          item.eventId ===
          eventId
      ).length;
  }

  return result;
}

export async function addMockPhotos(
  eventId: string,
  count: number,
  uploadedByUserId: string
): Promise<{
  gallery: EventGallery;
  notifiedCount: number;
}> {
  await simulateLatency(
    700
  );

  const now =
    new Date().toISOString();

  const wasPublished =
    Boolean(
      getDb().galleries.find(
        (item) =>
          item.eventId ===
          eventId
      )?.publishedAt
    );

  mutate((db) => {
    const existingPhotos =
      db.eventPhotos.filter(
        (item) =>
          item.eventId ===
          eventId
      ).length;

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      db.eventPhotos.push({
        id: createId("ph"),

        eventId,

        url:
          mockPhotoToken(
            Math.abs(
              hashEventSeed(
                eventId
              )
            ) +
              existingPhotos +
              index
          ),

        uploadedAt: now,

        uploadedByUserId,
      });
    }

    const record =
      db.galleries.find(
        (item) =>
          item.eventId ===
          eventId
      );

    if (record) {
      if (
        !record.publishedAt
      ) {
        record.publishedAt =
          now;
      }
    } else {
      db.galleries.push({
        eventId,
        publishedAt: now,
        archived: false,
      });
    }
  });

  let notifiedCount = 0;

  if (!wasPublished) {
    notifiedCount =
      await notifyPhotosAvailable(
        eventId
      );
  }

  return {
    gallery:
      await getGallery(
        eventId
      ),

    notifiedCount,
  };
}

function hashEventSeed(
  eventId: string
): number {
  let hash = 0;

  for (
    let index = 0;
    index <
    eventId.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        eventId.charCodeAt(
          index
        )) |
      0;
  }

  return hash;
}

export async function removePhoto(
  photoId: string
): Promise<void> {
  await simulateLatency(
    250
  );

  mutate((db) => {
    db.eventPhotos =
      db.eventPhotos.filter(
        (item) =>
          item.id !==
          photoId
      );
  });
}

export async function setGalleryArchived(
  eventId: string,
  archived: boolean
): Promise<EventGallery> {
  await simulateLatency(
    200
  );

  mutate((db) => {
    const record =
      db.galleries.find(
        (item) =>
          item.eventId ===
          eventId
      );

    if (record) {
      record.archived =
        archived;
    } else {
      db.galleries.push({
        eventId,
        publishedAt: null,
        archived,
      });
    }
  });

  return getGallery(
    eventId
  );
}

export async function listArchivedGalleries(): Promise<
  Array<{
    eventId: string;
    eventName: string;
    photoCount: number;
    archivesOn:
      string | null;
  }>
> {
  await simulateLatency();

  const db = getDb();

  return db.galleries
    .filter((record) => {
      const photoCount =
        db.eventPhotos.filter(
          (photo) =>
            photo.eventId ===
            record.eventId
        ).length;

      return (
        resolveStatus(
          record.publishedAt,
          record.archived,
          photoCount
        ) === "archived"
      );
    })
    .map((record) => {
      const event =
        db.campusEvents.find(
          (item) =>
            item.id ===
            record.eventId
        );

      return {
        eventId:
          record.eventId,

        eventName:
          event?.name ??
          "Deleted event",

        photoCount:
          db.eventPhotos.filter(
            (photo) =>
              photo.eventId ===
              record.eventId
          ).length,

        archivesOn:
          record.publishedAt
            ? galleryArchiveDate(
                record.publishedAt
              )
            : null,
      };
    });
}

export function isGalleryVisibleToUsers(
  gallery: EventGallery
): boolean {
  return (
    gallery.status ===
    "active"
  );
}

export type {
  EventPhoto,
};