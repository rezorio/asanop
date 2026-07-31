import {
  AutomationAction,
  AutomationTrigger,
  IntakeFormFieldType,
  TaskStatus,
} from '@prisma/client'
import type { AssigneeRef } from './tasks.data'
import type { SystemRoleKey } from '../../../src/common/permissions'

export const DEMO_INTAKE_FORMS = [
  {
    key: 'feature-request',
    name: 'Feature request intake',
    description:
      'Public form for beta users to submit launch-blocking feature ideas.',
    token: 'asanopdemo000000000000feature01',
    defaultAssigneeIndex: 0 as AssigneeRef,
    defaultStatus: TaskStatus.TODO,
    titleTemplate: '[Request] {{title}}',
    fields: [
      {
        key: 'title',
        label: 'Title',
        type: IntakeFormFieldType.TITLE,
        required: true,
        position: 0,
      },
      {
        key: 'description',
        label: 'What should we build?',
        type: IntakeFormFieldType.DESCRIPTION,
        required: true,
        position: 1,
      },
      {
        key: 'urgency',
        label: 'Urgency',
        type: IntakeFormFieldType.SINGLE_SELECT,
        required: true,
        options: ['Nice to have', 'Important', 'Launch blocker'],
        position: 2,
      },
      {
        key: 'area',
        label: 'Product area',
        type: IntakeFormFieldType.SINGLE_SELECT,
        required: false,
        /** Links to workspace custom field "Area" */
        customFieldName: 'Area',
        options: ['API', 'Web', 'Design', 'QA', 'Infra', 'Mobile'],
        position: 3,
      },
      {
        key: 'needed-by',
        label: 'Needed by',
        type: IntakeFormFieldType.DATE,
        required: false,
        position: 4,
      },
    ],
  },
  {
    key: 'bug-report',
    name: 'Bug report',
    description: 'Internal QA intake for launch regression bugs.',
    token: 'asanopdemo000000000000bugrep01',
    defaultAssigneeIndex: 2 as AssigneeRef,
    defaultStatus: TaskStatus.TODO,
    titleTemplate: '[Bug] {{title}}',
    fields: [
      {
        key: 'title',
        label: 'Title',
        type: IntakeFormFieldType.TITLE,
        required: true,
        position: 0,
      },
      {
        key: 'description',
        label: 'Steps to reproduce',
        type: IntakeFormFieldType.DESCRIPTION,
        required: true,
        position: 1,
      },
      {
        key: 'severity',
        label: 'Severity',
        type: IntakeFormFieldType.SINGLE_SELECT,
        required: true,
        options: ['P0', 'P1', 'P2', 'P3'],
        position: 2,
      },
      {
        key: 'effort',
        label: 'Estimated effort',
        type: IntakeFormFieldType.NUMBER,
        required: false,
        customFieldName: 'Effort Points',
        position: 3,
      },
    ],
  },
] as const

export type SeedAutomation = {
  name: string
  trigger: AutomationTrigger
  triggerFromStatus?: TaskStatus
  triggerToStatus?: TaskStatus
  action: AutomationAction
  actionStatus?: TaskStatus
  actionAssigneeIndex?: AssigneeRef
  actionComment?: string
  /** When true, scopes rule to the demo project */
  projectScoped?: boolean
}

export const DEMO_AUTOMATIONS: SeedAutomation[] = [
  {
    name: 'Welcome comment on new tasks',
    trigger: AutomationTrigger.TASK_CREATED,
    action: AutomationAction.ADD_COMMENT,
    actionComment:
      'Thanks for filing this — triage will review within one business day.',
    projectScoped: true,
  },
  {
    name: 'Auto-assign when moved to In Progress',
    trigger: AutomationTrigger.STATUS_CHANGED,
    triggerFromStatus: TaskStatus.TODO,
    triggerToStatus: TaskStatus.IN_PROGRESS,
    action: AutomationAction.SET_ASSIGNEE,
    actionAssigneeIndex: 'owner',
    projectScoped: true,
  },
  {
    name: 'Mark review note when Done',
    trigger: AutomationTrigger.STATUS_CHANGED,
    triggerToStatus: TaskStatus.DONE,
    action: AutomationAction.ADD_COMMENT,
    actionComment: 'Nice work — please confirm changelog + QA notes are linked.',
    projectScoped: true,
  },
  {
    name: 'Reset to Todo when reopened from Done',
    trigger: AutomationTrigger.STATUS_CHANGED,
    triggerFromStatus: TaskStatus.DONE,
    triggerToStatus: TaskStatus.TODO,
    action: AutomationAction.SET_STATUS,
    actionStatus: TaskStatus.TODO,
    projectScoped: false,
  },
]

export type SeedInvite = {
  email: string
  roleKey: SystemRoleKey
  token: string
  /** Days until expiry from now */
  expiresInDays: number
}

export const DEMO_PENDING_INVITES: SeedInvite[] = [
  {
    email: 'gabe.miller@asanop.dev',
    roleKey: 'contributor',
    token: 'asanopdemoinvite0000000000gabe01',
    expiresInDays: 14,
  },
  {
    email: 'hana.sato@asanop.dev',
    roleKey: 'contributor',
    token: 'asanopdemoinvite0000000000hana01',
    expiresInDays: 14,
  },
]
