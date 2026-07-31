import type { TimelineBarRect, TimelineTask } from './types'

export const DAY_MS = 24 * 60 * 60 * 1000
export const ROW_PROJECT = 36
export const ROW_TASK = 56
export const BAR_HEIGHT = 28
export const BAR_TOP = 14

export function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, daysDelta: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + daysDelta)
  return d
}

export function toDateInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dayOffset(date: Date, rangeStart: Date) {
  const start = startOfDay(rangeStart)
  const d = startOfDay(date)
  return Math.round((d.getTime() - start.getTime()) / DAY_MS)
}

export function buildDayList(rangeStart: Date, rangeEnd: Date): Date[] {
  const list: Date[] = []
  const d = startOfDay(rangeStart)
  const end = startOfDay(rangeEnd)
  while (d <= end) {
    list.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  return list
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function durationDays(start: Date, end: Date) {
  const a = startOfDay(start)
  const b = startOfDay(end)
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / DAY_MS) + 1)
}

export function formatDuration(days: number) {
  if (days === 1) return '1 day'
  if (days % 7 === 0) {
    const weeks = days / 7
    return weeks === 1 ? '1 week' : `${weeks} weeks`
  }
  if (days > 14) {
    const weeks = Math.round((days / 7) * 10) / 10
    return `${weeks} wk`
  }
  return `${days} days`
}

export function formatDurationShort(days: number) {
  if (days === 1) return '1d'
  if (days % 7 === 0) return `${days / 7}w`
  return `${days}d`
}

export function formatDateRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (isSameDay(start, end)) return start.toLocaleDateString(undefined, opts)
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`
}

export function resolveBarDates(
  task: TimelineTask,
  drag?: { taskId: string; dayDelta: number; originStart: Date; originEnd: Date } | null,
): { start: Date; end: Date } | null {
  if (drag?.taskId === task.id) {
    return {
      start: addDays(drag.originStart, drag.dayDelta),
      end: addDays(drag.originEnd, drag.dayDelta),
    }
  }
  if (!task.barStart || !task.barEnd) return null
  return { start: new Date(task.barStart), end: new Date(task.barEnd) }
}

export function computeBarRect(
  task: TimelineTask,
  rangeStart: Date,
  dayCount: number,
  dayWidth: number,
  drag?: { taskId: string; dayDelta: number; originStart: Date; originEnd: Date } | null,
): TimelineBarRect {
  const dates = resolveBarDates(task, drag)
  if (!dates) {
    return {
      left: 0,
      width: 0,
      startDay: 0,
      endDay: 0,
      durationDays: 0,
      clippedLeft: false,
      clippedRight: false,
      visible: false,
    }
  }

  let left = dayOffset(dates.start, rangeStart)
  let right = dayOffset(dates.end, rangeStart)
  if (right < left) right = left

  const duration = durationDays(dates.start, dates.end)
  const max = dayCount - 1
  const clippedLeft = left < 0
  const clippedRight = right > max

  if (right < 0 || left > max) {
    // Off-range linked tasks get an edge stub so dependency lines stay readable
    const stubWidth = Math.max(10, dayWidth * 0.55)
    if (right < 0) {
      return {
        left: 0,
        width: stubWidth,
        startDay: left,
        endDay: right,
        durationDays: duration,
        clippedLeft: true,
        clippedRight: false,
        visible: true,
      }
    }
    return {
      left: Math.max(0, dayCount * dayWidth - stubWidth - 2),
      width: stubWidth,
      startDay: left,
      endDay: right,
      durationDays: duration,
      clippedLeft: false,
      clippedRight: true,
      visible: true,
    }
  }

  left = Math.max(0, left)
  right = Math.min(max, right)
  const widthDays = Math.max(1, right - left + 1)
  const gap = dayWidth >= 24 ? 4 : 2

  return {
    left: left * dayWidth,
    width: Math.max(dayWidth - gap, widthDays * dayWidth - gap),
    startDay: left,
    endDay: right,
    durationDays: duration,
    clippedLeft,
    clippedRight,
    visible: true,
  }
}
