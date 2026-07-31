import type { AssigneeRef } from './tasks.data'

/** Maps to DEFAULT_CUSTOM_FIELDS names in src/custom-fields/default-fields.ts */
export type SeedFieldValue = {
  taskKey: string
  fieldName:
    | 'Effort Points'
    | 'Stage'
    | 'Approval Status'
    | 'Area'
    | 'Target Release'
  textValue?: string
  numberValue?: number
  dateValueInDays?: number
}

export const DEMO_FIELD_VALUES: SeedFieldValue[] = [
  { taskKey: 'announce-copy', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'announce-copy', fieldName: 'Stage', textValue: 'Ready' },
  { taskKey: 'announce-copy', fieldName: 'Area', textValue: 'Web' },
  { taskKey: 'announce-copy', fieldName: 'Target Release', textValue: 'M1' },
  {
    taskKey: 'announce-copy',
    fieldName: 'Approval Status',
    textValue: 'Pending',
  },

  { taskKey: 'hero-banners', fieldName: 'Effort Points', numberValue: 8 },
  { taskKey: 'hero-banners', fieldName: 'Stage', textValue: 'Backlog' },
  { taskKey: 'hero-banners', fieldName: 'Area', textValue: 'Design' },
  { taskKey: 'hero-banners', fieldName: 'Target Release', textValue: 'M1' },

  { taskKey: 'onboarding-emails', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'onboarding-emails', fieldName: 'Stage', textValue: 'Ready' },
  { taskKey: 'onboarding-emails', fieldName: 'Area', textValue: 'Web' },
  {
    taskKey: 'onboarding-emails',
    fieldName: 'Approval Status',
    textValue: 'Pending',
  },

  { taskKey: 'analytics-audit', fieldName: 'Effort Points', numberValue: 3 },
  { taskKey: 'analytics-audit', fieldName: 'Stage', textValue: 'Ready' },
  { taskKey: 'analytics-audit', fieldName: 'Area', textValue: 'API' },
  { taskKey: 'analytics-audit', fieldName: 'Target Release', textValue: 'M1' },

  { taskKey: 'qa-invite-flow', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'qa-invite-flow', fieldName: 'Stage', textValue: 'Ready' },
  { taskKey: 'qa-invite-flow', fieldName: 'Area', textValue: 'QA' },
  { taskKey: 'qa-invite-flow', fieldName: 'Target Release', textValue: 'M1' },

  { taskKey: 'feature-flags-ga', fieldName: 'Effort Points', numberValue: 2 },
  { taskKey: 'feature-flags-ga', fieldName: 'Stage', textValue: 'Blocked' },
  { taskKey: 'feature-flags-ga', fieldName: 'Area', textValue: 'Infra' },
  {
    taskKey: 'feature-flags-ga',
    fieldName: 'Target Release',
    textValue: 'M1',
  },

  { taskKey: 'rollback-runbook', fieldName: 'Effort Points', numberValue: 3 },
  { taskKey: 'rollback-runbook', fieldName: 'Stage', textValue: 'In Progress' },
  { taskKey: 'rollback-runbook', fieldName: 'Area', textValue: 'Infra' },
  {
    taskKey: 'rollback-runbook',
    fieldName: 'Approval Status',
    textValue: 'Pending',
  },

  {
    taskKey: 'keyboard-shortcuts',
    fieldName: 'Effort Points',
    numberValue: 8,
  },
  {
    taskKey: 'keyboard-shortcuts',
    fieldName: 'Stage',
    textValue: 'In Progress',
  },
  { taskKey: 'keyboard-shortcuts', fieldName: 'Area', textValue: 'Web' },
  {
    taskKey: 'keyboard-shortcuts',
    fieldName: 'Target Release',
    textValue: 'M1',
  },

  { taskKey: 'task-drawer', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'task-drawer', fieldName: 'Stage', textValue: 'In Progress' },
  { taskKey: 'task-drawer', fieldName: 'Area', textValue: 'Web' },
  { taskKey: 'task-drawer', fieldName: 'Target Release', textValue: 'M1' },

  { taskKey: 'notif-badges', fieldName: 'Effort Points', numberValue: 3 },
  { taskKey: 'notif-badges', fieldName: 'Stage', textValue: 'In Progress' },
  { taskKey: 'notif-badges', fieldName: 'Area', textValue: 'Web' },

  { taskKey: 'mobile-sidebar', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'mobile-sidebar', fieldName: 'Stage', textValue: 'Blocked' },
  { taskKey: 'mobile-sidebar', fieldName: 'Area', textValue: 'Web' },

  { taskKey: 'pg-indexes', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'pg-indexes', fieldName: 'Stage', textValue: 'In Progress' },
  { taskKey: 'pg-indexes', fieldName: 'Area', textValue: 'Infra' },
  { taskKey: 'pg-indexes', fieldName: 'Target Release', textValue: 'M1' },

  { taskKey: 'partner-sso', fieldName: 'Effort Points', numberValue: 13 },
  { taskKey: 'partner-sso', fieldName: 'Stage', textValue: 'Backlog' },
  { taskKey: 'partner-sso', fieldName: 'Area', textValue: 'API' },
  { taskKey: 'partner-sso', fieldName: 'Target Release', textValue: 'M3' },

  { taskKey: 'empty-states', fieldName: 'Effort Points', numberValue: 3 },
  { taskKey: 'empty-states', fieldName: 'Stage', textValue: 'In Progress' },
  { taskKey: 'empty-states', fieldName: 'Area', textValue: 'Design' },

  { taskKey: 'brand-tokens', fieldName: 'Effort Points', numberValue: 2 },
  { taskKey: 'brand-tokens', fieldName: 'Stage', textValue: 'Review' },
  { taskKey: 'brand-tokens', fieldName: 'Area', textValue: 'Design' },
  {
    taskKey: 'brand-tokens',
    fieldName: 'Approval Status',
    textValue: 'Pending',
  },

  { taskKey: 'beta-calls', fieldName: 'Effort Points', numberValue: 5 },
  { taskKey: 'beta-calls', fieldName: 'Stage', textValue: 'In Progress' },
  { taskKey: 'beta-calls', fieldName: 'Area', textValue: 'QA' },

  { taskKey: 'scaffold-api', fieldName: 'Effort Points', numberValue: 8 },
  { taskKey: 'scaffold-api', fieldName: 'Stage', textValue: 'Done' },
  { taskKey: 'scaffold-api', fieldName: 'Area', textValue: 'API' },
  { taskKey: 'scaffold-api', fieldName: 'Target Release', textValue: 'M1' },
  {
    taskKey: 'scaffold-api',
    fieldName: 'Approval Status',
    textValue: 'Approved',
  },

  { taskKey: 'kanban-mvp', fieldName: 'Effort Points', numberValue: 13 },
  { taskKey: 'kanban-mvp', fieldName: 'Stage', textValue: 'Done' },
  { taskKey: 'kanban-mvp', fieldName: 'Area', textValue: 'Web' },
  {
    taskKey: 'kanban-mvp',
    fieldName: 'Approval Status',
    textValue: 'Approved',
  },
]

export type SeedDependency = {
  taskKey: string
  dependsOnKey: string
}

/** taskKey is blocked until dependsOnKey is done. */
export const DEMO_DEPENDENCIES: SeedDependency[] = [
  { taskKey: 'feature-flags-ga', dependsOnKey: 'rollback-runbook' },
  { taskKey: 'announce-copy', dependsOnKey: 'brand-tokens' },
  { taskKey: 'hero-banners', dependsOnKey: 'brand-tokens' },
  { taskKey: 'mobile-sidebar', dependsOnKey: 'empty-states' },
  { taskKey: 'webinar-deck', dependsOnKey: 'tour-video' },
  { taskKey: 'localize-es', dependsOnKey: 'announce-copy' },
  { taskKey: 'localize-fr', dependsOnKey: 'announce-copy' },
  { taskKey: 'cs-checklist', dependsOnKey: 'cs-playbook' },
]

export type SeedComment = {
  taskKey: string
  authorIndex: AssigneeRef
  body: string
  /** Indexes into DEMO_TEAM_EMAILS (or 'owner') to @mention */
  mentionIndexes?: AssigneeRef[]
}

export const DEMO_COMMENTS: SeedComment[] = [
  {
    taskKey: 'keyboard-shortcuts',
    authorIndex: 'owner',
    body: 'Focus on column nav first — hotkeys can land in the follow-up PR. @Ava Chen can you pair on the focus trap?',
    mentionIndexes: [0],
  },
  {
    taskKey: 'keyboard-shortcuts',
    authorIndex: 0,
    body: 'Sounds good. Drafting the arrow-key handler today.',
  },
  {
    taskKey: 'task-drawer',
    authorIndex: 1,
    body: 'Dependencies section is stubbed — waiting on API polish before wiring UI.',
  },
  {
    taskKey: 'mobile-sidebar',
    authorIndex: 4,
    body: 'Reproduced on iOS Safari. Overlay click-outside is swallowing the toggle. @Ben Ortiz any design preference for the collapsed width?',
    mentionIndexes: [1],
  },
  {
    taskKey: 'rollback-runbook',
    authorIndex: 'owner',
    body: 'Please keep flag disable order next to DB steps. @Farah Khan can own the infra checklist.',
    mentionIndexes: [5],
  },
  {
    taskKey: 'beta-calls',
    authorIndex: 'owner',
    body: 'Two more interviews booked for Thursday. @Elena Brooks please join the synthesis doc.',
    mentionIndexes: [4],
  },
  {
    taskKey: 'announce-copy',
    authorIndex: 2,
    body: 'Need brand voice confirmed before I lock the email subject lines.',
  },
  {
    taskKey: 'brand-tokens',
    authorIndex: 4,
    body: 'Charcoal + green tokens are in Figma. Awaiting approval on the success green shade.',
  },
  {
    taskKey: 'pg-indexes',
    authorIndex: 2,
    body: 'Composite index on (projectId, status) already helps; checking assigneeId next.',
  },
  {
    taskKey: 'notif-badges',
    authorIndex: 2,
    body: '@Demo Owner unread count API is ready — UI badge landing tomorrow.',
    mentionIndexes: ['owner'],
  },
]

export type SeedNotification = {
  /** Recipient: 'owner' or team email index */
  userIndex: AssigneeRef
  actorIndex: AssigneeRef
  taskKey: string
  type:
    | 'TASK_ASSIGNED'
    | 'TASK_COMMENTED'
    | 'STATUS_CHANGED'
    | 'DUE_SOON'
    | 'MENTIONED'
  title: string
  body?: string
  read?: boolean
  createdDaysAgo?: number
}

export const DEMO_NOTIFICATIONS: SeedNotification[] = [
  {
    userIndex: 'owner',
    actorIndex: 0,
    taskKey: 'keyboard-shortcuts',
    type: 'TASK_COMMENTED',
    title: 'Ava Chen commented on Ship board keyboard shortcuts',
    body: 'Sounds good. Drafting the arrow-key handler today.',
    createdDaysAgo: 0,
  },
  {
    userIndex: 'owner',
    actorIndex: 2,
    taskKey: 'notif-badges',
    type: 'MENTIONED',
    title: 'Chloe Park mentioned you on Implement notification badges',
    body: 'unread count API is ready — UI badge landing tomorrow.',
    createdDaysAgo: 0,
  },
  {
    userIndex: 'owner',
    actorIndex: 4,
    taskKey: 'mobile-sidebar',
    type: 'STATUS_CHANGED',
    title: 'Elena Brooks moved “Fix mobile sidebar collapse” to IN_PROGRESS',
    body: 'TODO → IN_PROGRESS',
    createdDaysAgo: 1,
  },
  {
    userIndex: 0,
    actorIndex: 'owner',
    taskKey: 'keyboard-shortcuts',
    type: 'MENTIONED',
    title: 'Demo Owner mentioned you on Ship board keyboard shortcuts',
    body: 'can you pair on the focus trap?',
    createdDaysAgo: 0,
  },
  {
    userIndex: 0,
    actorIndex: 'owner',
    taskKey: 'analytics-audit',
    type: 'TASK_ASSIGNED',
    title: 'Demo Owner assigned you a task',
    body: 'Audit analytics events for launch',
    createdDaysAgo: 2,
  },
  {
    userIndex: 1,
    actorIndex: 4,
    taskKey: 'mobile-sidebar',
    type: 'MENTIONED',
    title: 'Elena Brooks mentioned you on Fix mobile sidebar collapse',
    body: 'any design preference for the collapsed width?',
    createdDaysAgo: 0,
  },
  {
    userIndex: 5,
    actorIndex: 'owner',
    taskKey: 'rollback-runbook',
    type: 'MENTIONED',
    title: 'Demo Owner mentioned you on Prepare rollback runbook',
    body: 'can own the infra checklist.',
    createdDaysAgo: 1,
  },
  {
    userIndex: 4,
    actorIndex: 'owner',
    taskKey: 'beta-calls',
    type: 'MENTIONED',
    title: 'Demo Owner mentioned you on Coordinate beta feedback calls',
    body: 'please join the synthesis doc.',
    createdDaysAgo: 1,
  },
  {
    userIndex: 'owner',
    actorIndex: null,
    taskKey: 'rollback-runbook',
    type: 'DUE_SOON',
    title: 'Due soon: Prepare rollback runbook',
    body: 'Due in 1 day',
    createdDaysAgo: 0,
  },
  {
    userIndex: 2,
    actorIndex: 'owner',
    taskKey: 'qa-invite-flow',
    type: 'TASK_ASSIGNED',
    title: 'Demo Owner assigned you a task',
    body: 'QA invite-flow edge cases',
    read: true,
    createdDaysAgo: 3,
  },
]

export type SeedActivity = {
  taskKey: string
  actorIndex: AssigneeRef
  type: string
  meta?: Record<string, unknown>
  createdDaysAgo?: number
}

export const DEMO_ACTIVITY: SeedActivity[] = [
  {
    taskKey: 'keyboard-shortcuts',
    actorIndex: 'owner',
    type: 'TASK_CREATED',
    createdDaysAgo: 5,
  },
  {
    taskKey: 'keyboard-shortcuts',
    actorIndex: 'owner',
    type: 'STATUS_CHANGED',
    meta: { from: 'TODO', to: 'IN_PROGRESS' },
    createdDaysAgo: 3,
  },
  {
    taskKey: 'keyboard-shortcuts',
    actorIndex: 0,
    type: 'COMMENT_ADDED',
    createdDaysAgo: 0,
  },
  {
    taskKey: 'mobile-sidebar',
    actorIndex: 4,
    type: 'STATUS_CHANGED',
    meta: { from: 'TODO', to: 'IN_PROGRESS' },
    createdDaysAgo: 1,
  },
  {
    taskKey: 'brand-tokens',
    actorIndex: 4,
    type: 'STATUS_CHANGED',
    meta: { from: 'IN_PROGRESS', to: 'IN_PROGRESS' },
    createdDaysAgo: 2,
  },
  {
    taskKey: 'kanban-mvp',
    actorIndex: 3,
    type: 'STATUS_CHANGED',
    meta: { from: 'IN_PROGRESS', to: 'DONE' },
    createdDaysAgo: 8,
  },
  {
    taskKey: 'scaffold-api',
    actorIndex: 0,
    type: 'STATUS_CHANGED',
    meta: { from: 'IN_PROGRESS', to: 'DONE' },
    createdDaysAgo: 14,
  },
  {
    taskKey: 'beta-calls',
    actorIndex: 'owner',
    type: 'ASSIGNEE_CHANGED',
    meta: { assignee: 'Demo Owner' },
    createdDaysAgo: 6,
  },
]
