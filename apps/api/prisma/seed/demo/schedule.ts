import type { TaskStatus } from '@prisma/client'
import { dateFromOffset } from '../lib/dates'

/** Fresh demo project: kickoff tomorrow, hard deadline ~3 months out. */
export const DEMO_PROJECT_SCHEDULE = {
  startDay: 1,
  durationDays: 90,
} as const

export function demoProjectDeadlineDay(): number {
  return (
    DEMO_PROJECT_SCHEDULE.startDay + DEMO_PROJECT_SCHEDULE.durationDays - 1
  )
}

export function demoProjectDisplayName(now = new Date()): string {
  const kickoff = dateFromOffset(DEMO_PROJECT_SCHEDULE.startDay) ?? now
  const deadline = dateFromOffset(demoProjectDeadlineDay()) ?? now
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `Product launch · ${fmt(kickoff)}–${fmt(deadline)}`
}

/**
 * Map seeded tasks onto a fresh runway.
 * DONE = pre-kickoff prep (never open-overdue).
 * IN_PROGRESS / TODO = tomorrow through the 90-day deadline.
 */
export function scheduleTaskDates(
  status: TaskStatus,
  index: number,
  statusCount: number,
): { startInDays?: number; dueInDays: number } {
  const t = statusCount <= 1 ? 0 : index / (statusCount - 1)
  const kickoff = DEMO_PROJECT_SCHEDULE.startDay
  const deadline = demoProjectDeadlineDay()

  if (status === 'DONE') {
    // Early-runway milestones already finished — stay inside the fresh
    // project window so the board never opens looking delayed.
    const due = kickoff + Math.round(t * 18)
    return { startInDays: Math.max(kickoff, due - 4), dueInDays: due }
  }

  if (status === 'IN_PROGRESS') {
    const startInDays = kickoff + Math.round(t * 8)
    const dueInDays = Math.min(
      deadline,
      kickoff + 12 + Math.round(t * 20),
    )
    return { startInDays, dueInDays }
  }

  // TODO (+ subtasks in todo): spread from week 2 through deadline.
  const startInDays = kickoff + 6 + Math.round(t * 45)
  const dueInDays = Math.min(
    deadline,
    kickoff + 18 + Math.round(t * (deadline - kickoff - 18)),
  )
  return { startInDays, dueInDays }
}
