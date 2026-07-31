export type Permission =
  | 'workspace.manage'
  | 'roles.manage'
  | 'members.invite'
  | 'members.manage'
  | 'projects.create'
  | 'projects.manage'
  | 'tasks.create'
  | 'tasks.edit_any'
  | 'tasks.delete'
  | 'custom_fields.manage'
  | 'automations.manage'
  | 'intake_forms.manage'

export const PERMISSION_LABELS: Record<Permission, string> = {
  'workspace.manage': 'Manage workspace (rename / delete)',
  'roles.manage': 'Manage roles & permissions',
  'members.invite': 'Invite members',
  'members.manage': 'Change member roles',
  'projects.create': 'Create projects',
  'projects.manage': 'Edit / archive projects',
  'tasks.create': 'Create tasks',
  'tasks.edit_any': 'Edit any task',
  'tasks.delete': 'Delete tasks',
  'custom_fields.manage': 'Manage custom fields',
  'automations.manage': 'Manage automations',
  'intake_forms.manage': 'Manage intake forms',
}

export const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[]

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'
export type CustomFieldType = 'TEXT' | 'NUMBER' | 'SINGLE_SELECT' | 'DATE'

export type User = {
  id: string
  email: string
  name: string
}

export type WorkspaceRole = {
  id: string
  name: string
  key: string
  isSystem: boolean
  permissions: string[]
  memberCount?: number
}

export type Workspace = {
  id: string
  name: string
  slug: string
  roleId: string
  roleName: string
  roleKey: string
  permissions: string[]
  memberCount: number
  projectCount: number
}

export type Project = {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  brief?: string | null
  _count?: { tasks: number }
  createdBy?: { id: string; name: string }
  stats?: {
    byStatus: Record<TaskStatus, number>
    overdue: number
    blocked: number
    total: number
  }
}

export type ProjectSection = {
  id: string
  projectId: string
  name: string
  position: number
  _count?: { tasks: number }
}

export type WorkspaceDashboard = {
  generatedAt: string
  summary: {
    total: number
    open: number
    percentComplete: number
    byStatus: Record<TaskStatus, number>
    overdue: number
    dueSoon: number
    completedThisWeek: number
    openBlocked: number
    unassignedOpen: number
    projectCount: number
    memberCount: number
    overdueTrend: {
      current: number
      newlyThisWeek: number
      chronic: number
    }
  }
  needsAttention: Array<{
    id: string
    title: string
    status: TaskStatus
    dueDate: string | null
    projectId: string
    projectName: string
    assignee: User | null
    reasons: Array<'overdue' | 'due_today' | 'blocked'>
    primaryReason: 'overdue' | 'due_today' | 'blocked'
  }>
  recentActivity: Array<{
    id: string
    type: string
    createdAt: string
    meta?: Record<string, unknown> | null
    actor: { id: string; name: string }
    task: {
      id: string
      title: string
      projectId: string
      projectName: string
    }
  }>
  byProject: Array<{
    project: { id: string; name: string }
    TODO: number
    IN_PROGRESS: number
    DONE: number
    total: number
    overdue: number
    blocked: number
    percentComplete: number
    health: 'at_risk' | 'active' | 'complete' | 'idle'
  }>
  byAssignee: Array<{
    user: User
    TODO: number
    IN_PROGRESS: number
    DONE: number
    open: number
  }>
}

export type CustomFieldDefinition = {
  id: string
  workspaceId: string
  name: string
  type: CustomFieldType
  options?: string[] | null
  position: number
}

export type CustomFieldValue = {
  id: string
  fieldId: string
  taskId: string
  textValue?: string | null
  numberValue?: number | null
  dateValue?: string | null
  field?: CustomFieldDefinition
}

export type TaskAttachment = {
  id: string
  taskId: string
  originalName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedBy?: { id: string; name: string }
}

export type Task = {
  id: string
  projectId: string
  sectionId?: string | null
  parentId?: string | null
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string | null
  startDate?: string | null
  assigneeId?: string | null
  assignee?: User | null
  section?: { id: string; name: string; position: number } | null
  createdBy?: { id: string; name: string }
  project?: { id: string; name: string; workspaceId?: string }
  parent?: { id: string; title: string } | null
  subtasks?: Task[]
  fieldValues?: CustomFieldValue[]
  attachments?: TaskAttachment[]
  subtaskProgress?: { total: number; completed: number }
  blockedByTasks?: Array<{ id: string; title: string; status: TaskStatus; projectId: string; parentId?: string | null }>
  blockingTasks?: Array<{ id: string; title: string; status: TaskStatus; projectId: string; parentId?: string | null }>
  openBlockers?: Array<{ id: string; title: string; status: TaskStatus }>
  isBlocked?: boolean
  canEdit?: boolean
  _count?: { comments: number; subtasks?: number }
  comments?: Array<{
    id: string
    body: string
    createdAt: string
    author: User
    mentions?: Array<{
      id: string
      userId: string
      user: User
    }>
  }>
  activity?: Array<{
    id: string
    type: string
    createdAt: string
    actor: { id: string; name: string }
    meta?: Record<string, unknown> | null
  }>
}

export type MyTasksBuckets = {
  overdue: Task[]
  today: Task[]
  upcoming: Task[]
  later: Task[]
}

export type WorkspaceMember = {
  id: string
  roleId: string
  roleName: string
  roleKey: string
  permissions: string[]
  joinedAt: string
  user: User
}

export type Invite = {
  id: string
  email: string
  roleId: string
  roleName: string
  roleKey: string
  status: string
  expiresAt: string
  inviteUrl: string
  token: string
  workspaceName?: string
}

export type AppNotification = {
  id: string
  workspaceId: string
  userId: string
  type: 'TASK_ASSIGNED' | 'TASK_COMMENTED' | 'STATUS_CHANGED' | 'DUE_SOON' | 'MENTIONED'
  title: string
  body?: string | null
  readAt?: string | null
  createdAt: string
  actor?: { id: string; name: string } | null
  task?: {
    id: string
    title: string
    projectId: string
    parentId?: string | null
  } | null
}

export type SearchResults = {
  query: string
  tasks: Array<{
    id: string
    title: string
    status: TaskStatus
    projectId: string
    parentId?: string | null
    assignee?: { id: string; name: string } | null
    project: { id: string; name: string }
  }>
  projects: Array<{
    id: string
    name: string
    description?: string | null
    _count?: { tasks: number }
  }>
  people: Array<{
    id: string
    name: string
    email: string
    roleName: string
    roleKey: string
  }>
}

export type IntakeFormFieldType =
  | 'TITLE'
  | 'DESCRIPTION'
  | 'TEXT'
  | 'NUMBER'
  | 'SINGLE_SELECT'
  | 'DATE'

export type IntakeFormField = {
  id: string
  formId: string
  key: string
  label: string
  type: IntakeFormFieldType
  required: boolean
  options?: string[] | null
  customFieldId?: string | null
  position: number
}

export type IntakeForm = {
  id: string
  workspaceId: string
  projectId: string
  name: string
  description?: string | null
  token: string
  shareUrl: string
  isActive: boolean
  defaultAssigneeId?: string | null
  defaultStatus: TaskStatus
  titleTemplate?: string | null
  project?: { id: string; name: string }
  defaultAssignee?: User | null
  fields?: IntakeFormField[]
}

export type PublicIntakeForm = {
  name: string
  description?: string | null
  workspaceName: string
  projectName: string
  fields: Array<{
    key: string
    label: string
    type: IntakeFormFieldType
    required: boolean
    options?: string[] | null
  }>
}

export type AutomationTrigger = 'TASK_CREATED' | 'STATUS_CHANGED'
export type AutomationAction = 'SET_STATUS' | 'SET_ASSIGNEE' | 'ADD_COMMENT'

export type AutomationRule = {
  id: string
  workspaceId: string
  projectId?: string | null
  name: string
  isActive: boolean
  trigger: AutomationTrigger
  triggerFromStatus?: TaskStatus | null
  triggerToStatus?: TaskStatus | null
  action: AutomationAction
  actionStatus?: TaskStatus | null
  actionAssigneeId?: string | null
  actionComment?: string | null
  project?: { id: string; name: string } | null
  actionAssignee?: User | null
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
}

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
