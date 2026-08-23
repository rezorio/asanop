# Asanop system overview

> Last verified against the codebase: 2026-08-24
>
> Read this first when working on Asanop. It is the compact architectural and product map; the implementation remains the final source of truth. Update this file whenever a change affects product behavior, data relationships, permissions, routes, deployment, or major limitations.

## Product in one paragraph

Asanop is a collaborative work hub for small teams (roughly 3–25 people). A user can belong to multiple workspaces. Each workspace contains members and roles, projects, sections, tasks and subtasks, custom fields, request forms, automations, notifications, and searchable work. The product provides project list/board views, a personal task queue, calendar and timeline planning, a workspace dashboard, task discussion and files, and public intake links that turn submissions into tasks.

The current product is a free public beta. It has no billing or plan enforcement, transactional invite email, analytics, or native mobile app.

## Technical shape

```text
Browser (Vue 3 + Pinia + Vue Router)
        |
        | JSON/HTTP, JWT Bearer token
        v
NestJS API under /api
        |
        | Prisma ORM
        v
PostgreSQL

Task attachments -> API server's local uploads/ directory
```

- Monorepo managed with npm workspaces.
- `apps/web`: Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios, Tailwind-based styling.
- `apps/api`: NestJS, TypeScript, Prisma, PostgreSQL, Passport JWT, bcrypt.
- `packages/shared`: a small shared type/constants package. It is not yet the complete cross-app contract; many web types live in `apps/web/src/types/index.ts`.
- Local development: web at `http://localhost:5173`; API at `http://localhost:3000/api`; Vite proxies `/api` to Nest.
- Documented production: Vercel hosts the web app; Render hosts the API and PostgreSQL.

## Primary user flow

1. A visitor registers with name, email, and password.
2. Registration creates the user, a personal workspace, five system roles, membership as Project Manager, and default custom fields in one database transaction.
3. The API returns a signed JWT. The web app stores the token, user, and selected workspace ID in `localStorage`.
4. Authenticated routes load the user's workspaces. Switching workspaces changes the workspace context and returns the user to the dashboard.
5. Inside a workspace, permitted members create projects and tasks, assign work, add dates and dependencies, discuss tasks, and inspect progress through the different views.
6. Managers can invite members with a copyable link, define custom roles, build public forms, and configure lightweight automations.

There is no refresh-token or server-side session model. A `401` clears local auth data and redirects protected pages to login. JWT expiry is configured by `JWT_EXPIRES_IN` (documented production value: `7d`).

## Frontend route map

Public or guest-facing routes:

- `/`: marketing homepage.
- `/login` and `/register`: guest authentication.
- `/invite/:token`: preview/accept a workspace invitation. Acceptance requires authentication.
- `/f/:token`: preview and submit a public intake form without authentication.
- `/dev/components`: development-only component gallery.

Authenticated routes use the shared application shell below `/app`:

- `/app/dashboard`: workspace health, attention feed, project radar, workload, and activity.
- `/app/my-tasks`: the signed-in user's incomplete assigned tasks bucketed into overdue, today, upcoming, and later.
- `/app/calendar`: tasks with due dates in a requested date window (maximum 92 days).
- `/app/timeline`: top-level scheduled tasks and visible dependency links in a requested window (maximum 180 days).
- `/app/projects/:projectId`: project workspace with list/board behavior and task detail interactions.
- `/app/forms` and `/app/forms/:formId`: form list and builder.
- `/app/automations`: automation rule management.
- `/app/members`: members, invites, roles, and permissions.

Legacy top-level product URLs redirect to their `/app/*` equivalents. Vercel's catch-all rewrite is required for direct SPA navigation.

## Application shell and frontend state

- `AppLayout.vue` owns global navigation, workspace switching/creation, project navigation, search, notifications, logout, and mobile navigation.
- Pinia currently has one central auth store. Most feature views fetch and manage their own remote data rather than using domain stores.
- Axios injects `Authorization: Bearer <token>` from `localStorage` into requests.
- Read-heavy modules use a short-lived, tab-local memory cache with in-flight request de-duplication. Successful mutations and session/workspace changes invalidate it.
- The active workspace is a client-side selection, but every protected workspace request is independently verified by the API.
- Search spans tasks, projects, and people within the active workspace.
- The UI is responsive: a fixed desktop sidebar becomes a mobile top bar and focus-managed slide-over navigation.

## Core data model

```text
User --< WorkspaceMember >-- Workspace --< Project --< ProjectSection
                                  |             |
                                  |             +--< Task --< Subtask (one level)
                                  |                    |-- comments/mentions/activity
                                  |                    |-- attachments
                                  |                    |-- custom field values
                                  |                    +-- task dependencies
                                  |
                                  |-- roles and invites
                                  |-- custom field definitions
                                  |-- notifications
                                  |-- intake forms -- fields
                                  +-- automation rules
```

Important rules and relationships:

- A user may belong to many workspaces through `WorkspaceMember`.
- A membership references a workspace-specific `WorkspaceRole`; permissions are stored as a string array on the role.
- Projects are soft-archived with `archivedAt`. Archived projects are excluded from ordinary project and planning views.
- A new project starts with one section named `Untitled section`.
- Tasks belong to a project and optionally a section, assignee, parent task, dates, and custom values.
- Only one subtask level is allowed; a subtask cannot have its own subtask.
- Task status is `TODO`, `IN_PROGRESS`, or `DONE`.
- Task priority is `NONE`, `LOW`, `MEDIUM`, or `HIGH`.
- Dependencies are directed edges: a task may be blocked by other tasks. An incomplete dependency makes it blocked.
- Custom field types are text, number, single select, and date.
- Activity events are append-only task history records; task detail returns the 20 newest activity records.
- Notifications are per user and workspace, can reference an actor/task, and have a nullable `readAt`.

## Workspace roles and authorization

Every protected workspace controller uses both JWT authentication and workspace-membership validation. The guard derives workspace context from the route (or request workspace field), loads the membership and role, and enforces declared permissions.

System roles created in each workspace:

- Project Manager: all permissions.
- Assistant Manager: all permissions except workspace management and role management.
- Developer, Designer, Contributor: no explicit management permissions by default.

Available permissions:

- `workspace.manage`
- `roles.manage`
- `members.invite`
- `members.manage`
- `projects.create`
- `projects.manage`
- `tasks.create`
- `tasks.edit_any`
- `tasks.delete`
- `custom_fields.manage`
- `automations.manage`
- `intake_forms.manage`

Task mutation has an additional object-level rule. A member can edit task fields, status, dependencies, attachments, and custom field values when they either have `tasks.edit_any`, are the task assignee, or created the task's project. Other workspace members may view and comment. Creating a top-level task requires `tasks.create`; creating a subtask requires edit access to its parent.

Implementation note: `tasks.delete` exists in the permission model, but the current task controller exposes no task-delete endpoint.

## Domain behavior

### Projects, sections, and tasks

- Projects have a name, description, optional brief, creator, sections, and top-level tasks.
- Project detail includes task counts by status plus overdue and blocked counts.
- Sections can be created, renamed, reordered, and removed within a project.
- Tasks support title, description, status, priority, start/due dates, assignee, section, position, one-level subtasks, custom values, comments, attachments, and dependencies.
- Task mutations create activity events. Assignment, comments, mentions, and status changes can create notifications.
- `My Tasks` includes only incomplete work assigned to the current user.
- Calendar includes tasks with due dates. Timeline includes top-level tasks intersecting the time window and may include linked tasks outside that window so dependency lines remain meaningful.

### Dashboard

The workspace dashboard aggregates active-project work into:

- totals, open count, completion percentage, and status mix;
- overdue, due-soon, completed-this-week, blocked, and unassigned counts;
- an attention feed for overdue, due-today, and blocked tasks;
- recent activity;
- project health (`at_risk`, `active`, `complete`, or `idle`);
- workload by assignee.

### Comments, mentions, and notifications

- Any workspace member can comment on a visible task.
- Comments can record mentions of workspace users.
- Notification types are assignment, comment, status change, due soon, and mention.
- The API avoids notifying a user about their own action.
- Users can fetch recent notifications (capped at 100), fetch unread count, mark one read, or mark all read.
- There is no documented background scheduler in this codebase; do not assume due-soon notifications are periodically generated without tracing or adding such a job.

### Attachments

- Attachments belong to tasks and record uploader, original/stored names, MIME type, size, and creation time.
- Maximum upload size is 10 MB.
- Allowed formats include common images, PDF, text/CSV, Word, Excel, ZIP, and JSON.
- Files are stored on the API server's local filesystem under `uploads/`, not in object storage. This may be ephemeral or non-scalable on hosted infrastructure and is a production limitation.

### Public intake forms

- A form belongs to a workspace and target project and has a unique public token.
- A form can be active/inactive and define a default assignee, default status, title template, and ordered fields.
- Field types include title, description, text, number, single select, and date. Form fields may map into workspace custom fields.
- Every form has a required title field that cannot be removed.
- `/f/:token` is public. Valid submissions create real tasks in the target project and can populate custom field values.
- Forms cannot accept submissions when inactive or when their target project is archived.

### Automations

- Rules are workspace-wide or scoped to one project and can be active/inactive.
- Triggers: task created or status changed (optionally matching from/to status).
- Actions: set status, set assignee, or add comment.
- The target assignee must belong to the workspace.
- Evaluation happens synchronously from task creation/status-change flows.
- Automation evaluation has a shallow recursion/depth cap to avoid runaway chains. This is lightweight rule execution, not a durable background job engine.

### Invitations and membership

- Managers create invitations for an email and workspace role.
- Invitations have a unique token, pending/accepted/revoked status, and expiry date.
- The system currently generates copyable invite URLs; it does not send email.
- An authenticated user accepts the token to gain membership.

## API organization

All API endpoints are prefixed with `/api`.

- `/auth`: register, login, current user.
- `/workspaces`: workspace list/create/delete, members, invites.
- `/invites`: public preview and authenticated acceptance.
- `/workspaces/:workspaceId/projects`: projects.
- `/workspaces/:workspaceId/projects/:projectId/sections`: sections.
- `/workspaces/:workspaceId/projects/:projectId/tasks` and `/workspaces/:workspaceId/tasks/:taskId`: tasks and detail.
- `/workspaces/:workspaceId/my-tasks`, `/calendar`, `/timeline`, `/dashboard`, `/search`: workspace projections.
- `/workspaces/:workspaceId/custom-fields`: field definitions and task values.
- `/workspaces/:workspaceId/tasks/:taskId/attachments`: task files.
- `/workspaces/:workspaceId/notifications`: notification inbox.
- `/workspaces/:workspaceId/forms` and public `/forms/:token`: intake forms.
- `/workspaces/:workspaceId/automations`: automation rules.
- `/workspaces/:workspaceId/roles` and member role assignment: role management.
- `/health`: deployment health check.

Nest's global validation pipe strips unknown fields, rejects non-whitelisted fields, and performs DTO transformations. CORS accepts the configured `WEB_ORIGIN` (local default: `http://localhost:5173`).

## Design and product conventions

- Public pages use a warm editorial direction; the product UI is calmer and denser.
- Brand character: capable, human, composed. Do not clone another work-management product.
- Use semantic design tokens rather than feature-level raw hex values.
- Evergreen is the primary/selection/positive accent; slate-blue is informational/in-progress; ochre is warning/due-soon; brick is destructive/blocked/overdue.
- Sora is the display face; Source Sans 3 is the body/interface face.
- Standard controls are 44 px; compact 36 px controls need an equivalent accessible target.
- Target WCAG 2.2 AA, keyboard operation, visible focus, named icon buttons, focus-managed dialogs, reduced motion, and status cues beyond color.
- Boards, timelines, calendars, and tables may scroll internally; the document must not have accidental horizontal overflow.
- Verify responsive behavior at 360, 768, 1280, and 1536 px plus content-driven widths.
- Shared UI primitives live under `apps/web/src/components/ui`; extend shared contracts instead of adding page-specific copies.
- The full visual contract and QA checklist are in `docs/DESIGN_SYSTEM.md`.

## Development and verification

Prerequisites: Node.js 20+, npm, Docker Desktop.

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev:api
npm run dev:web
```

Primary checks:

```bash
npm run build
npm test
```

Database-backed e2e tests require an isolated database whose name contains `asanop_test`. The e2e runner refuses unsafe database names. See the root `README.md` for the exact command.

Important environment variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: JWT signing secret.
- `JWT_EXPIRES_IN`: token lifetime.
- `WEB_ORIGIN`: allowed web origin and base for generated share URLs.
- `PORT`: API port (Render provides it).
- `VITE_API_URL`: production frontend API base, including `/api`.

## Deployment and seeded demo

- Render deploys Prisma migrations, builds the Nest API, and runs a safe deploy seed.
- Vercel builds `apps/web` and needs `VITE_API_URL` pointing at the Render `/api` endpoint.
- `WEB_ORIGIN` must exactly match the deployed web origin for CORS and generated links.
- The deploy seed creates the rich demo only when it is missing/incomplete and does not normally reset user workspaces.
- Intentional remote demo refresh requires the exact `SEED_CONFIRM=RESET_ASANOP_DEMO` safeguard and only recreates the seeded `asanop-demo` workspace.
- Render free services may sleep, so a first request can take 30–60 seconds.
- Primary data-heavy screens use reusable skeleton loading states; see `docs/PERFORMANCE_AND_SCALING.md`.
- `/api/health/live` reports process liveness; `/api/health/ready` (and `/api/health`) verifies PostgreSQL readiness.
- Production startup supports opt-in multi-worker balancing through `WEB_CONCURRENCY`; the documented free deployment remains at one worker.
- Deployment steps and demo credentials are intentionally kept in `DEPLOY.md`, not duplicated here.

## Known limitations and architectural cautions

- Beta only: no billing, plan limits, transactional email, analytics, or native mobile clients.
- JWT/localStorage authentication has no refresh-token lifecycle.
- Local attachment storage is not durable object storage.
- Local attachment storage prevents safe multi-instance horizontal scaling until files move to shared object storage.
- There is no distributed server cache. The current memory cache is browser-local and is never used as a correctness dependency.
- Automations are synchronous and lightweight; there is no queue, retry policy, execution log, or scheduler.
- Invite delivery is link-copy only.
- Automated coverage is partial; database-backed coverage needs expansion before production-critical use.
- `packages/shared` contains an older/simple `Role` union (`OWNER | ADMIN | MEMBER`) while the live authorization system uses workspace roles and permission arrays. Do not treat that union as the current authorization source of truth.
- Some permissions may precede exposed operations (for example `tasks.delete`). Verify both controller and service before assuming a capability exists.
- API-specific and web-specific README files are still framework boilerplate; use the root README and this document instead.

## Where to look when details are needed

- Product entry point and commands: `README.md`, `package.json`.
- Data truth: `apps/api/prisma/schema.prisma` and migrations.
- API module map: `apps/api/src/app.module.ts`.
- Authorization truth: `apps/api/src/common/guards.ts`, `permissions.ts`, and `task-access.ts`.
- Backend behavior: the relevant controller, DTO, and service under `apps/api/src/<domain>`.
- Frontend navigation and session: `apps/web/src/router/index.ts`, `stores/auth.ts`, and `lib/api.ts`.
- Frontend contracts: `apps/web/src/types/index.ts`.
- App shell: `apps/web/src/layouts/AppLayout.vue`.
- Visual rules: `docs/DESIGN_SYSTEM.md` and `apps/web/src/styles`.
- Production setup and demo operations: `DEPLOY.md`, `render.yaml`, and `apps/web/vercel.json`.

## Maintenance checklist for this document

Update this overview in the same change whenever any of these move:

- a core user journey or major product capability;
- a Prisma model, enum, or important relationship;
- a route group, authentication flow, or permission rule;
- automation, form, notification, upload, or invitation behavior;
- hosting, required environment variables, or storage architecture;
- a confirmed limitation becomes implemented or a new limitation is introduced.

Keep this file architectural. Do not turn it into an exhaustive endpoint schema or duplicate volatile UI copy; link to the source files for those details.
