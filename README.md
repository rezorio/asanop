# Asanop

Asanop is a collaborative work hub for small teams. It combines projects, tasks, list and board views, personal work, calendars, timelines, request forms, lightweight automations, comments, notifications, attachments, and workspace roles.

The product is in a free public beta. Billing, transactional invite email, analytics, and native mobile apps are not implemented.

## Architecture

- `apps/web` — Vue 3, Vite, Pinia, Vue Router, Tailwind CSS
- `apps/api` — NestJS, Prisma, PostgreSQL, JWT authentication
- `packages/shared` — shared status and role types
- Vercel hosts the web client; Render hosts the API and PostgreSQL in the documented production setup.

Start with [docs/SYSTEM_OVERVIEW.md](./docs/SYSTEM_OVERVIEW.md) for the maintained product, architecture, data-flow, permissions, and operational map.

Public routes live at `/`, `/login`, `/register`, `/invite/:token`, and `/f/:token`. Authenticated product routes live under `/app`. Compatibility redirects preserve the earlier top-level product URLs.

## Local setup

Requirements: Node.js 20+, npm, Docker Desktop.

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
```

For deployment, `npm run db:seed:deploy` safely creates the demo only when it is missing or incomplete. Render runs this automatically after migrations. An intentional remote refresh requires `SEED_CONFIRM=RESET_ASANOP_DEMO`; see [DEPLOY.md](./DEPLOY.md).

Run the API and web client in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

- Web: `http://localhost:5173`
- API: `http://localhost:3000/api`
- Development component gallery: `http://localhost:5173/dev/components`

## Verification

```bash
npm run build
npm test
```

API e2e tests require an isolated database whose name contains `asanop_test`. This guard prevents accidental test writes to development or production data.

```powershell
$env:TEST_DATABASE_URL="postgresql://asanop:asanop@localhost:5434/asanop_test?schema=public"
npm run test:e2e
```

The e2e runner copies `TEST_DATABASE_URL` to `DATABASE_URL`, forces `NODE_ENV=test`, and refuses any unsafe database name. Apply the Prisma migrations to that isolated database before running the suite.

## Demo data

The seed creates a realistic workspace with projects, sections, tasks, comments, notifications, forms, and automations. Local/demo credentials are documented in [DEPLOY.md](./DEPLOY.md); never reuse them for a real user or production administrator.

## Product and design rules

Asanop is designed for teams of roughly 3–25 people. The interface uses a warm editorial marketing layer and a denser, consistent application layer. Repeated controls should use shared components and semantic tokens rather than page-specific class collections.

See [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) for reference research, tokens, component conventions, responsiveness, accessibility requirements, and the visual QA checklist.

See [docs/PERFORMANCE_AND_SCALING.md](./docs/PERFORMANCE_AND_SCALING.md) for skeleton states, browser memory caching, readiness checks, worker balancing, and the limits on horizontal scaling.

## Known beta limitations

- Invitations generate copyable links; email delivery is not connected.
- Access is free and there is no billing or plan enforcement.
- Render free services may have a cold-start delay.
- Automated coverage currently protects the design primitives, route migration, and permission helpers. Database-backed coverage should continue expanding before the beta is treated as production-critical.
