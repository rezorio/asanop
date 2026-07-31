import { SEED_PASSWORD } from '../workmates.data'

export { SEED_PASSWORD }

export const DEMO_OWNER = {
  name: 'Demo Owner',
  email: 'demo@asanop.dev',
  slug: 'asanop-demo',
} as const

export const DEMO_WORKSPACE_NAME = 'Asanop Demo'

/** Team members added into the demo workspace (must exist via workmates seed). */
export const DEMO_TEAM_EMAILS = [
  'ava.chen@asanop.dev',
  'ben.ortiz@asanop.dev',
  'chloe.park@asanop.dev',
  'diego.ruiz@asanop.dev',
  'elena.brooks@asanop.dev',
  'farah.khan@asanop.dev',
] as const

/** Workmates who stay invite-only (pending invites seeded for them). */
export const DEMO_PENDING_INVITE_EMAILS = [
  'gabe.miller@asanop.dev',
  'hana.sato@asanop.dev',
] as const

export const DEMO_PROJECT = {
  name: 'Product launch',
  description:
    'Seeded board with a heavy task load to demo assignment, sections, and status flow.',
  brief: `## Launch brief

Ship Asanop GA with a polished board experience, GTM assets, and a rollback-ready ops plan.

### Goals
- Stable kanban + list + timeline for the core workflow
- Marketing site and announcement ready for launch week
- Support macros and CS playbook handed off before GA

### Success metrics
- Zero P0 launch blockers open on ship day
- Onboarding email sequence live
- Feature flags flipped for GA with rollback runbook reviewed`,
} as const

export type SectionKey =
  | 'foundation'
  | 'engineering'
  | 'design'
  | 'gtm'
  | 'launch-ops'

export const DEMO_SECTIONS: { key: SectionKey; name: string; position: number }[] =
  [
    { key: 'foundation', name: 'Foundation', position: 0 },
    { key: 'engineering', name: 'Engineering', position: 1 },
    { key: 'design', name: 'Design & brand', position: 2 },
    { key: 'gtm', name: 'Go-to-market', position: 3 },
    { key: 'launch-ops', name: 'Launch ops', position: 4 },
  ]
