import type {
  DependencyLinkKind,
  DependencyDisplayMode,
  TimelineDependencyLink,
  TimelineRowLayout,
  TimelineTask,
  TimelineTaskStatus,
} from './types'
import { BAR_HEIGHT, BAR_TOP, computeBarRect } from './geometry'
import { buildOrthogonalPath } from './orthogonalPath'

function linkKind(
  blockerStatus: TimelineTaskStatus,
  fromEndDay: number,
  toStartDay: number,
): DependencyLinkKind {
  if (blockerStatus !== 'DONE' && fromEndDay > toStartDay) return 'conflict'
  if (blockerStatus !== 'DONE') return 'open'
  return 'ok'
}

function laneIndex(key: string, counters: Map<string, number>) {
  const next = counters.get(key) ?? 0
  counters.set(key, next + 1)
  if (next === 0) return 0
  const step = Math.ceil(next / 2)
  return next % 2 === 1 ? step : -step
}

export function buildDependencyLinks(options: {
  tasks: TimelineTask[]
  rows: TimelineRowLayout[]
  rangeStart: Date
  dayCount: number
  dayWidth: number
  chartWidth?: number
  displayMode?: DependencyDisplayMode
  focusTaskId?: string | null
  drag?: { taskId: string; dayDelta: number; originStart: Date; originEnd: Date } | null
}): TimelineDependencyLink[] {
  const {
    tasks,
    rows,
    rangeStart,
    dayCount,
    dayWidth,
    drag,
    displayMode = 'focused',
    focusTaskId = null,
  } = options
  const chartWidth = options.chartWidth ?? dayCount * dayWidth

  if (displayMode === 'off') return []
  if (displayMode === 'focused' && !focusTaskId) return []

  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const rowByTaskId = new Map(
    rows.filter((row) => row.kind === 'task' && row.task).map((row) => [row.task!.id, row]),
  )

  const lanes = new Map<string, number>()
  const links: TimelineDependencyLink[] = []

  for (const task of tasks) {
    const toRow = rowByTaskId.get(task.id)
    if (!toRow) continue

    for (const edge of task.blockedBy) {
      const fromTask = taskById.get(edge.dependsOnId)
      const fromRow = rowByTaskId.get(edge.dependsOnId)
      if (!fromTask || !fromRow) continue

      if (displayMode === 'focused' && focusTaskId) {
        if (edge.dependsOnId !== focusTaskId && task.id !== focusTaskId) continue
      }

      const fromRect = computeBarRect(fromTask, rangeStart, dayCount, dayWidth, drag)
      const toRect = computeBarRect(task, rangeStart, dayCount, dayWidth, drag)
      if (!fromRect.visible || !toRect.visible) continue

      const kind = linkKind(edge.dependsOn.status, fromRect.endDay, toRect.startDay)

      // In "all" mode, skip settled done→done chains to cut noise
      if (displayMode === 'all' && kind === 'ok') continue

      const x1 = fromRect.left + fromRect.width
      const y1 = fromRow.top + BAR_TOP + BAR_HEIGHT / 2
      const x2 = toRect.left
      const y2 = toRow.top + BAR_TOP + BAR_HEIGHT / 2

      links.push({
        id: `${edge.dependsOnId}->${task.id}`,
        fromId: edge.dependsOnId,
        toId: task.id,
        kind,
        path: buildOrthogonalPath({
          x1,
          y1,
          x2,
          y2,
          chartWidth,
          laneIndex: laneIndex(`${edge.dependsOnId}|${Math.round((y1 + y2) / 2)}`, lanes),
        }),
        arrowX: x2,
        arrowY: y2,
      })
    }
  }

  return links
}

export function groupTasksByProject(tasks: TimelineTask[]) {
  const map = new Map<string, { project: { id: string; name: string }; tasks: TimelineTask[] }>()
  for (const task of tasks) {
    const key = task.project.id
    if (!map.has(key)) {
      map.set(key, { project: task.project, tasks: [] })
    }
    map.get(key)!.tasks.push(task)
  }
  return [...map.values()]
}

export function buildRowLayout(
  grouped: Array<{ project: { id: string; name: string }; tasks: TimelineTask[] }>,
  projectHeight: number,
  taskHeight: number,
): TimelineRowLayout[] {
  const rows: TimelineRowLayout[] = []
  let top = 0

  for (const group of grouped) {
    rows.push({
      kind: 'project',
      id: `project-${group.project.id}`,
      label: group.project.name,
      top,
      height: projectHeight,
      barCenterY: top + projectHeight / 2,
    })
    top += projectHeight

    for (const task of group.tasks) {
      rows.push({
        kind: 'task',
        id: task.id,
        task,
        top,
        height: taskHeight,
        barCenterY: top + BAR_TOP + BAR_HEIGHT / 2,
      })
      top += taskHeight
    }
  }

  return rows
}
