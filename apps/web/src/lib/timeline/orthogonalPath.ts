/**
 * Consistent orthogonal dependency routing.
 * Same shape every time: exit right → vertical lane → enter left.
 */

function round(n: number) {
  return Math.round(n * 10) / 10
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function buildOrthogonalPath(options: {
  x1: number
  y1: number
  x2: number
  y2: number
  chartWidth: number
  laneIndex?: number
}): string {
  const { x1, y1, x2, y2, chartWidth } = options
  const laneIndex = options.laneIndex ?? 0
  const gap = x2 - x1
  const stub = 10

  // Same row: short horizontal with a tiny bow so it doesn’t look like a grid line
  if (Math.abs(y2 - y1) < 1.5) {
    if (gap >= stub * 2) {
      return `M ${round(x1)} ${round(y1)} L ${round(x2)} ${round(y2)}`
    }
    const loopX = clamp(Math.max(x1, x2) + 20 + laneIndex * 8, 8, chartWidth - 8)
    const loopY = y1 - (14 + Math.abs(laneIndex) * 4)
    return [
      `M ${round(x1)} ${round(y1)}`,
      `L ${round(x1 + stub)} ${round(y1)}`,
      `L ${round(loopX)} ${round(y1)}`,
      `L ${round(loopX)} ${round(loopY)}`,
      `L ${round(x2 - stub)} ${round(loopY)}`,
      `L ${round(x2 - stub)} ${round(y2)}`,
      `L ${round(x2)} ${round(y2)}`,
    ].join(' ')
  }

  // Forward: vertical run sits in the open gap between bars
  let elbowX: number
  if (gap >= 24) {
    elbowX = x1 + gap * 0.5 + laneIndex * 6
  } else if (gap >= 8) {
    elbowX = x1 + Math.max(stub, gap * 0.6) + laneIndex * 4
  } else {
    // Overlap / tight: lane just past the later of the two edges
    const rightPad = 18 + Math.abs(laneIndex) * 10
    const candidate = Math.max(x1, x2) + rightPad
    elbowX =
      candidate < chartWidth - 6
        ? candidate
        : Math.max(6, Math.min(x1, x2) - rightPad)
  }

  elbowX = clamp(elbowX, 4, chartWidth - 4)

  return [
    `M ${round(x1)} ${round(y1)}`,
    `L ${round(elbowX)} ${round(y1)}`,
    `L ${round(elbowX)} ${round(y2)}`,
    `L ${round(x2)} ${round(y2)}`,
  ].join(' ')
}
