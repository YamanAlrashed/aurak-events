export type Rng = () => number;

export function hashSeed(input: string): number {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  return () => {
    state =
      (state + 0x6d2b79f5) >>> 0;

    let t = state;

    t = Math.imul(
      t ^ (t >>> 15),
      t | 1
    );

    t ^=
      t +
      Math.imul(
        t ^ (t >>> 7),
        t | 61
      );

    return (
      ((t ^ (t >>> 14)) >>> 0) /
      4294967296
    );
  };
}

export function rngFor(label: string): Rng {
  return createRng(hashSeed(label));
}

export function randomInt(
  rng: Rng,
  min: number,
  max: number
): number {
  return (
    min +
    Math.floor(
      rng() * (max - min + 1)
    )
  );
}

export function pick<T>(
  rng: Rng,
  items: readonly T[]
): T {
  return items[
    Math.floor(rng() * items.length)
  ];
}

export function chance(
  rng: Rng,
  probability: number
): boolean {
  return rng() < probability;
}

export function pickMany<T>(
  rng: Rng,
  items: readonly T[],
  count: number
): T[] {
  const total =
    Math.min(count, items.length);

  const indices =
    new Set<number>();

  let guard = 0;

  while (
    indices.size < total &&
    guard < total * 12
  ) {
    indices.add(
      Math.floor(
        rng() * items.length
      )
    );

    guard += 1;
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map(
      (index) =>
        items[index]
    );
}

export function pickWeighted<
  T extends string
>(
  rng: Rng,
  weights: Record<T, number>
): T {
  const entries =
    Object.entries(weights) as Array<
      [T, number]
    >;

  const total =
    entries.reduce(
      (sum, [, weight]) =>
        sum + weight,
      0
    );

  let roll =
    rng() * total;

  for (
    const [value, weight]
    of entries
  ) {
    roll -= weight;

    if (roll <= 0) {
      return value;
    }
  }

  return entries[
    entries.length - 1
  ][0];
}