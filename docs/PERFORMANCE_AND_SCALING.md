# Asanop performance and scaling

> Last verified: 2026-08-24

This document records what Asanop actually implements for loading feedback, caching, health checks, and load balancing. Do not describe a capability as production-enabled when it is only opt-in or blocked by the limitations below.

## Status summary

| Capability | Status | Notes |
|---|---|---|
| Skeleton loading | Implemented | Reusable, responsive, reduced-motion-safe skeletons cover the primary data-heavy modules. |
| Browser memory cache | Implemented | Short-lived per-tab GET cache with request de-duplication and automatic invalidation after mutations or session/workspace changes. |
| API liveness | Implemented | `GET /api/health/live`; verifies the process can answer HTTP. |
| API readiness | Implemented | `GET /api/health/ready` and `/api/health`; verifies PostgreSQL before returning ready. |
| Multi-worker balancing | Implemented, opt-in | Set `WEB_CONCURRENCY` above `1`; the Node cluster primary distributes connections across workers. Default is `1`. |
| Multi-instance platform balancing | Not enabled | Render performs platform routing when multiple instances are purchased, but the documented free deployment has one instance. |
| Shared server cache | Not implemented | No Redis or distributed cache. This avoids cross-worker invalidation errors for mutable workspace data. |
| Horizontally safe attachment storage | Not implemented | Attachments use the API instance's local `uploads/` directory. Move them to object storage before multiple hosted instances. |

## Skeleton loading

The reusable component is `apps/web/src/components/ui/AppSkeleton.vue`.

Variants:

- `line`: compact inline placeholder;
- `card`: metric/card placeholder;
- `rows`: lists and tables;
- `dashboard`: metric and panel composition;
- `editor`: task and form editors.

Primary coverage includes dashboard, My Tasks, project task views, calendar, timeline, forms, automations, members/roles, the form builder, and task details. Skeletons use semantic surface tokens, expose a live status label to assistive technology, and disable shimmer when `prefers-reduced-motion` is active.

Rules:

- Only show a skeleton when there is no usable previous data.
- Keep already-rendered content visible during silent refreshes.
- Skeleton geometry should resemble the destination layout without reproducing every detail.
- Buttons performing mutations continue to use their spinner/disabled state rather than replacing the whole page.

## Browser memory caching

`apps/web/src/lib/api.ts` exports `cachedGet` and `clearMemoryCache`.

Behavior:

- Default TTL: 20 seconds.
- Stable workspace metadata such as members, roles, and projects may use 60 seconds.
- Concurrent identical GET requests share one promise, preventing duplicate network work.
- Keys include active workspace, URL, and serialized query parameters.
- Successful non-GET responses clear the entire memory cache.
- Login/session persistence, workspace switching, and logout clear the cache.
- Cache is memory-only: it disappears on refresh, is not shared across tabs, and never stores data in persistent browser storage.
- Errors are not cached.

This is deliberately a small freshness window, not an offline mode. Highly interactive screens continue to update local state optimistically where implemented, and mutations invalidate subsequent reads.

### Why there is no API process-memory data cache

Mutable workspace data is permission-sensitive and frequently updated. A cache inside one API worker would diverge from other workers unless every write invalidated every process. Asanop does not currently have Redis or another shared invalidation channel, so server-side response caching is intentionally not claimed.

If server caching becomes necessary:

1. Add Redis or an equivalent shared store.
2. Namespace entries by workspace and authorization scope.
3. Define mutation-driven invalidation for every cached projection.
4. Add cache hit/miss and stale-data observability.
5. Never cache attachment downloads or private responses in a shared public cache.

## Health checks

Endpoints:

- `/api/health/live`: process liveness only. It does not query PostgreSQL.
- `/api/health/ready`: readiness check that executes `SELECT 1` through Prisma.
- `/api/health`: backward-compatible readiness alias.

All health responses send `Cache-Control: no-store`. An unavailable database produces HTTP 503 from readiness. Render uses `/api/health/ready`, so an instance should not receive normal traffic before its database connection works.

## Worker load balancing

Production startup reads `WEB_CONCURRENCY` in `apps/api/scripts/start-prod.cjs`.

- Default: `1` worker.
- Allowed range: 1–8, also capped by available CPU parallelism.
- With two or more workers, Node's cluster primary distributes incoming connections.
- An unexpectedly exited worker is restarted.
- Nest shutdown hooks disconnect Prisma cleanly during termination.

Example:

```bash
WEB_CONCURRENCY=2 npm run start:api:prod
```

On PowerShell:

```powershell
$env:WEB_CONCURRENCY="2"
npm run start:api:prod
```

Each worker creates its own Prisma client and database connection pool. Do not increase worker count without checking database connection limits and memory usage. Render's free instance remains configured at one worker.

## Horizontal scaling limitation: attachments

Task files are written to `uploads/` on the API filesystem. This has two consequences:

- another hosted instance may not possess the requested file;
- an instance replacement or ephemeral filesystem can lose files.

Before enabling more than one hosted instance:

1. Move files to S3, Cloudflare R2, Supabase Storage, or another shared object store.
2. Store an object key rather than a local stored filename.
3. Use signed or authenticated download access.
4. Migrate existing attachment objects and verify authorization.
5. Add upload/download failure monitoring.

Multiple workers on one machine share the same filesystem and therefore avoid the first issue, but local storage still is not durable production storage.

## Platform load balancing

The repository cannot turn Render's account-level instance scaling on by itself. When the service plan supports multiple instances, Render routes requests across them. Asanop does not require sticky sessions because authentication is JWT-based, but shared attachment storage is still mandatory.

Safe activation checklist:

- object storage replaces local attachments;
- `JWT_SECRET` is identical on every instance;
- all instances share PostgreSQL and migrations are applied once;
- database connection limits include every worker on every instance;
- readiness is `/api/health/ready`;
- CORS `WEB_ORIGIN` is identical;
- no feature depends on process memory for correctness;
- rolling deploy and worker termination behavior are smoke-tested.

## Verification

Run:

```bash
npm run build
npm test
```

For production-like checks:

1. Start PostgreSQL and apply migrations.
2. Build the API.
3. Start with `WEB_CONCURRENCY=2` on a machine with enough memory.
4. Repeatedly request `/api/health/live` and inspect varying `pid` values.
5. Stop PostgreSQL and verify `/api/health/ready` returns 503.
6. Restart PostgreSQL and verify readiness recovers.
7. In the browser, navigate between dashboard and project modules and confirm skeletons appear only on uncached initial loads.
8. Perform a mutation and confirm the next data load is not served from stale memory.

## Operational tradeoffs

- Skeletons improve perceived responsiveness; they do not make a sleeping free-tier API wake faster.
- Browser memory caching reduces duplicate reads but cannot be shared between users or tabs.
- More API workers may improve throughput but consume more memory and database connections.
- Load balancing improves availability only when upstream infrastructure and shared storage are also redundant.
