const PALETTES: Array<[string, string]> = [
  ["#7b1e28", "#c05a54"],
  ["#12243f", "#3f6191"],
  ["#1a7f56", "#5fbf95"],
  ["#9a6300", "#d9a400"],
  ["#5b3a8c", "#9a7bc8"],
  ["#1c5d99", "#5fa3d9"],
  ["#a3432b", "#d98a6a"],
  ["#2f6b63", "#6faea4"],
];

export const MOCK_PHOTO_PREFIX = "mockphoto:";

export function mockPhotoToken(seed: number): string {
  return `${MOCK_PHOTO_PREFIX}${seed}`;
}

export function isMockPhoto(url: string): boolean {
  return url.startsWith(MOCK_PHOTO_PREFIX);
}

function seedOf(url: string): number {
  const raw = url.slice(MOCK_PHOTO_PREFIX.length);
  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed)
    ? Math.abs(parsed)
    : 0;
}

export function mockPhotoBackground(url: string): string {
  const [from, to] =
    PALETTES[seedOf(url) % PALETTES.length];

  const angle =
    120 + (seedOf(url) % 5) * 25;

  return `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`;
}