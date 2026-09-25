let counter = 0;

export function createId(prefix: string): string {
  counter += 1;

  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);

  return `${prefix}_${time}${counter.toString(36)}${random}`;
}

/* Campus QR: unique per user + event */
export function campusQrCode(
  eventId: string,
  userId: string
): string {
  return `AURAK-CE-${eventId}-${userId}`.toUpperCase();
}

/* Marketing QR: unique per registration + event */
export function marketingQrCode(
  eventId: string,
  registrationId: string
): string {
  return `AURAK-MK-${eventId}-${registrationId}`.toUpperCase();
}

/* Public Marketing registration link */
export function registrationCode(eventId: string): string {
  return eventId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-10)
    .toLowerCase();
}