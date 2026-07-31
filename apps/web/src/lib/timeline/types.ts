export type TimelineTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type TimelineDependencyEdge = {
  dependsOnId: string
  dependsOn: {
    id: string
    title: string
    status: TimelineTaskStatus
    startDate?: string | null
    dueDate?: string | null
  }
}

export type TimelineTask = {
  id: string
  title: string
  status: TimelineTaskStatus
  priority: string
  startDate?: string | null
  dueDate?: string | null
  projectId: string
  barStart: string | null
  barEnd: string | null
  isBlocked?: boolean
  isMilestone?: boolean
  linkedOnly?: boolean
  canEdit?: boolean
  assignee?: { id: string; name: string } | null
  project: { id: string; name: string }
  blockedBy: TimelineDependencyEdge[]
}

export type TimelineBarRect = {
  left: number
  width: number
  startDay: number
  endDay: number
  durationDays: number
  clippedLeft: boolean
  clippedRight: boolean
  visible: boolean
}

export type TimelineRowLayout = {
  kind: 'project' | 'task'
  id: string
  label?: string
  task?: TimelineTask
  top: number
  height: number
  barCenterY: number
}

export type DependencyLinkKind = 'ok' | 'open' | 'conflict'

/** How dependency lines are shown on the timeline. */
export type DependencyDisplayMode = 'off' | 'focused' | 'all'

export type TimelineDependencyLink = {
  id: string
  fromId: string
  toId: string
  kind: DependencyLinkKind
  path: string
  arrowX: number
  arrowY: number
}
