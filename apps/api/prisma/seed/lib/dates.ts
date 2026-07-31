/** Calendar date at noon UTC-offset local, offset by `days` from today. */
export function dateFromOffset(days?: number): Date | null {
  if (days === undefined) return null
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + days)
  return d
}
