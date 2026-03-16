export const SNAP_FRACTIONS = [0.25, 1 / 3, 0.50, 2 / 3, 0.75]
export const SNAP_THRESHOLD = 0.04 // meters (~4cm)

export function getSnapPoints(height: number, thickness: number): number[] {
  const floor = thickness / 2
  const ceiling = height - thickness / 2
  const interior = ceiling - floor
  return SNAP_FRACTIONS.map(f => floor + interior * f)
}

export function applySnap(y: number, snapPoints: number[]): number {
  for (const sp of snapPoints) {
    if (Math.abs(y - sp) < SNAP_THRESHOLD) return sp
  }
  return y
}
