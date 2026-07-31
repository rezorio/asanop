export type CalendarViewMode = 'month' | 'week'

export type CalendarTask = {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: string
  dueDate?: string | null
  projectId: string
  parentId?: string | null
  assignee?: { id: string; name: string } | null
  project: { id: string; name: string }
}

export function toDayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function endOfWeek(date: Date) {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

export function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isSameDay(a: Date, b: Date) {
  return toDayKey(a) === toDayKey(b)
}

export function isSameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

export function toDateInput(date: Date) {
  return toDayKey(date)
}

export function buildDayRange(start: Date, end: Date): Date[] {
  const list: Date[] = []
  const d = startOfDay(start)
  const last = startOfDay(end)
  while (d <= last) {
    list.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return list
}

export function calendarRange(mode: CalendarViewMode, cursor: Date) {
  if (mode === 'week') {
    const start = startOfWeek(cursor)
    return { start, end: endOfWeek(cursor) }
  }
  const monthStart = startOfMonth(cursor)
  return {
    start: startOfWeek(monthStart),
    end: endOfWeek(endOfMonth(monthStart)),
  }
}

export function shiftCursor(mode: CalendarViewMode, cursor: Date, direction: -1 | 1) {
  if (mode === 'week') {
    return addDays(cursor, direction * 7)
  }
  return new Date(cursor.getFullYear(), cursor.getMonth() + direction, 1)
}

export function goToToday(mode: CalendarViewMode) {
  const now = new Date()
  return mode === 'week' ? startOfWeek(now) : startOfMonth(now)
}

export function rangeLabel(mode: CalendarViewMode, cursor: Date, range: { start: Date; end: Date }) {
  if (mode === 'week') {
    const a = range.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const b = range.end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${a} – ${b}`
  }
  return cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}
