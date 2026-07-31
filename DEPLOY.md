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

4. **Environment** variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your Postgres **Internal** Database URL (from the DB → Connections) |
| `JWT_SECRET` | Long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `WEB_ORIGIN` | Temporarily `http://localhost:5173` — update after Vercel |
| `NODE_VERSION` | `20` |

Render sets `PORT` for you — do not override unless you know you need to.

5. **Create Web Service** and wait for a green deploy.
6. Open `https://YOUR-SERVICE.onrender.com/api/health` — you should see `{ "ok": true, ... }`.

### Optional: seed demo users

From your PC (use the Postgres **External** URL once):

```bash
# in apps/api/.env set DATABASE_URL to the External URL temporarily
npm run prisma:seed -w @asanop/api
```

Demo login (if seed succeeds): `demo@asanop.dev` / `password123`

Then set the service `DATABASE_URL` back to the **Internal** URL if you changed it.

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

## 4. Share with friends

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
