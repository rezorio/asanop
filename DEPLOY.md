# Deploy Asanop (friends demo)

You already have Postgres on Render. Finish the API service, then the Vercel frontend.

## 1. Render — Web Service (API)

1. [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect this GitHub repo.
3. Settings:

| Field | Value |
|--------|--------|
| Name | `asanop-api` |
| Region | **Same region as your Postgres** |
| Root Directory | *(leave empty)* |
| Runtime | Node |
| Build Command | see below |
| Start Command | see below |
| Instance | Free |

**Build Command**

```bash
npm install && npm run prisma:generate -w @asanop/api && npm exec -w @asanop/api -- prisma migrate deploy && npm run build -w @asanop/api
```

**Start Command**

```bash
npm run start:prod -w @asanop/api
```

If the service still cannot find `dist/main`, push the latest commit (includes a start script that also checks `dist/src/main.js`).

4. **Environment** variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your Postgres **Internal** Database URL (from the DB → Connections) |
| `JWT_SECRET` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `WEB_CONCURRENCY` | `1` on the free instance; raise only after measuring memory/database connections |
| `WEB_ORIGIN` | Temporarily `http://localhost:5173` — update after Vercel |
| `NODE_VERSION` | `20` |

Render sets `PORT` for you — do not override unless you know you need to.

5. **Create Web Service** and wait for a green deploy.
6. Open `https://YOUR-SERVICE.onrender.com/api/health/ready` — you should see `{ "ok": true, "database": "ready", ... }`.

`/api/health/live` checks only the API process. `/api/health/ready` checks PostgreSQL and is the load-balancer health endpoint. Multi-worker balancing is opt-in through `WEB_CONCURRENCY`; multi-instance scaling is not safe while attachments remain on the API's local filesystem. See [docs/PERFORMANCE_AND_SCALING.md](./docs/PERFORMANCE_AND_SCALING.md).

### Automatic first-deploy demo seed

This loads the same rich demo as local: workmates, Product launch project, sections, many tasks, comments, forms, automations, invites, notifications.

The Render Blueprint now runs `prisma:seed:deploy` after migrations. It creates this demo when the online database is new and skips recreation when the complete demo already exists. It never enables `SEED_FORCE`, so normal deployments do not reset the demo workspace or touch user-created workspaces.

### Intentionally refresh the online demo

From your PC (use the Postgres **External** URL once).

**PowerShell** (Windows):

1. Render → your Postgres → **Connections** → copy **External Database URL**.
2. In the project folder:

```powershell
cd "C:\Users\barke\Desktop\AI CODING\SaaS Projects\asanop"
$env:DATABASE_URL="PASTE_EXTERNAL_DATABASE_URL_HERE"
$env:SEED_CONFIRM="RESET_ASANOP_DEMO"
npm run db:seed:refresh-demo
```

Confirm the log shows a **Render hostname** (not `localhost`), then counts like `Tasks: 40+`, sections, forms, etc.

3. Log in on the live site with:
   - Email: `demo@asanop.dev`
   - Password: `password123`

Keep the Web Service `DATABASE_URL` as the **Internal** URL. Only use External for this one-off refresh from your laptop. The confirmation phrase is required for remote databases. The refresh only recreates content inside the seeded `asanop-demo` workspace; it does not delete other users or workspaces.

Use `npm run db:seed:refresh-demo` only when you intentionally want the seeded demo workspace wiped and recreated.

---

## 2. Vercel — Frontend

1. [Vercel](https://vercel.com) → **Add New Project** → import the same repo.
2. Configure:

| Field | Value |
|--------|--------|
| Root Directory | `apps/web` |
| Framework | Vite |
| Build Command | `npm run build` (default) |
| Output | `dist` |

3. Environment variable:

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-API.onrender.com/api` |

4. Deploy.
5. Copy the Vercel URL (e.g. `https://asanop-xxx.vercel.app`).

---

## 3. Connect CORS

1. Render → `asanop-api` → **Environment**.
2. Set `WEB_ORIGIN` to your Vercel URL exactly (no trailing slash).
3. Save → wait for restart.
4. Open the Vercel link, register or use the demo account.

---

## 4. Public and application routes

- `/` is the public product homepage.
- Authenticated views live below `/app`.
- Older `/dashboard`, `/calendar`, `/projects/:id`, and related links redirect to their `/app/*` equivalents.
- Vercel's catch-all rewrite in `apps/web/vercel.json` must remain enabled for direct navigation.

After deployment, verify the homepage metadata, logged-out registration CTA, logged-in **Open app** CTA, protected-route redirect, and one old compatibility URL.

## 5. Share with friends

Send the **Vercel** URL only.

**Note:** Free Render services sleep when idle. The first visit after a while can take 30–60 seconds.

---

## Quick troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS error in browser | `WEB_ORIGIN` must match Vercel origin exactly |
| Build fails on Prisma | `DATABASE_URL` must be set on the Web Service before build |
| `nest: not found` | Build from repo root with `npm install` (not only `apps/api`) |
| Frontend calls localhost | Set `VITE_API_URL` on Vercel and redeploy |
| Slow first load | Free tier cold start — wait and retry |
