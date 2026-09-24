import { cn } from "@/lib/utils/cn";

const GRID = 21;

function hashString(
  input: string
): number {
  let hash = 2166136261;

  for (
    let i = 0;
    i < input.length;
    i += 1
  ) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(
      hash,
      16777619
    );
  }

  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed || 1;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;

    return state / 4294967296;
  };
}

function isFinderArea(
  row: number,
  col: number
): boolean {
  const inTopLeft =
    row < 8 && col < 8;

  const inTopRight =
    row < 8 &&
    col >= GRID - 8;

  const inBottomLeft =
    row >= GRID - 8 &&
    col < 8;

  return (
    inTopLeft ||
    inTopRight ||
    inBottomLeft
  );
}

function isFinderFilled(
  row: number,
  col: number
): boolean {
  const r =
    row < 8
      ? row
      : row - (GRID - 7);

  const c =
    col < 8
      ? col
      : col - (GRID - 7);

  if (
    r < 0 ||
    c < 0 ||
    r > 6 ||
    c > 6
  ) {
    return false;
  }

  const onOuterRing =
    r === 0 ||
    r === 6 ||
    c === 0 ||
    c === 6;

  const inInnerBlock =
    r >= 2 &&
    r <= 4 &&
    c >= 2 &&
    c <= 4;

  return (
    onOuterRing ||
    inInnerBlock
  );
}

export function MockQrCode({
  code,
  size = 200,
  showCode = true,
  className,
}: {
  code: string;
  size?: number;
  showCode?: boolean;
  className?: string;
}) {
  const random = createRandom(
    hashString(code)
  );

  const cells: boolean[][] = [];

  for (
    let row = 0;
    row < GRID;
    row += 1
  ) {
    const line: boolean[] = [];

    for (
      let col = 0;
      col < GRID;
      col += 1
    ) {
      line.push(
        isFinderArea(row, col)
          ? isFinderFilled(
              row,
              col
            )
          : random() > 0.5
      );
    }

    cells.push(line);
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        className
      )}
    >
      <div
        className="rounded-[var(--aurak-radius)] border border-[var(--aurak-line)] bg-white p-3"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          viewBox={`0 0 ${GRID} ${GRID}`}
          className="h-full w-full"
          shapeRendering="crispEdges"
          role="img"
          aria-label={`Demonstration code ${code}`}
        >
          <rect
            width={GRID}
            height={GRID}
            fill="#ffffff"
          />

          {cells.map(
            (line, row) =>
              line.map(
                (
                  filled,
                  col
                ) =>
                  filled ? (
                    <rect
                      key={`${row}-${col}`}
                      x={col}
                      y={row}
                      width={1}
                      height={1}
                      fill="var(--aurak-navy)"
                    />
                  ) : null
              )
          )}
        </svg>
      </div>

      {showCode && (
        <p className="break-all text-center font-mono text-[0.6875rem] text-[var(--aurak-text-muted)]">
          {code}
        </p>
      )}

      <p className="text-center text-[0.6875rem] text-[var(--aurak-text-subtle)]">
        Demonstration code — not a
        scannable QR.
      </p>
    </div>
  );
}