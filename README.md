# Asanop

Asana-like task SaaS MVP: **Vue 3 + NestJS + PostgreSQL**.

## Locked MVP scope

- Email/password auth (no OTP)
- Team invites from day 1 (**mock locally** — copy invite link, no email)
- Fixed task statuses: `TODO` → `IN_PROGRESS` → `DONE`
- Workspaces, projects, task assign, list + board, comments, activity

Capacitor app wrap comes **after** the web app is complete.

## Folder structure

```
asanop/
├── apps/
│   ├── api/                 # NestJS API + Prisma
│   │   ├── prisma/
│   │   └── src/
│   │       ├── auth/
│   │       ├── workspaces/
│   │       ├── invites/
│   │       ├── projects/
│   │       ├── tasks/
│   │       ├── prisma/
│   │       └── common/
│   └── web/                 # Vue 3 + Vite + Tailwind + Pinia
│       └── src/
│           ├── components/
│           ├── layouts/
│           ├── views/
│           ├── stores/
│           ├── router/
│           └── lib/
├── packages/shared/         # Shared status/role types
├── docker-compose.yml       # Postgres on host port 5434
└── package.json             # npm workspaces
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for Postgres)

## Setup

```bash
# 1) Start database (uses host port 5434 — 5432/5433 were occupied locally)
docker compose up -d

# 2) Install deps (from repo root)
npm install

# 3) API env is already at apps/api/.env — or copy .env.example

# 4) Migrate
npm run db:migrate

# 5) Run API + web (two terminals)
npm run dev:api
npm run dev:web
```

- Web: http://localhost:5173  
- API: http://localhost:3000/api  

## Mock invites flow

1. Register User A → open **Members & invites**
2. Create invite for User B’s email → **Copy invite link**
3. Register/login as User B with that same email
4. Open the invite link → Accept → join workspace

## Next feature prompts

1. My Tasks inbox + filters  
2. In-app notifications  
3. Search  
4. Responsive polish → Capacitor
