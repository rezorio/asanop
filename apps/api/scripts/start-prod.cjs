/**
 * Resolve Nest build output whether emit is dist/main.js or dist/src/main.js.
 */
const { existsSync } = require('fs')
const { join } = require('path')
const cluster = require('cluster')
const { availableParallelism } = require('os')

const root = join(__dirname, '..')
const candidates = [
  join(root, 'dist', 'main.js'),
  join(root, 'dist', 'src', 'main.js'),
]

const entry = candidates.find((file) => existsSync(file))
if (!entry) {
  console.error(
    'Cannot find Nest build output. Looked for:\n' +
      candidates.map((c) => `  - ${c}`).join('\n') +
      '\nRun: npm run build -w @asanop/api',
  )
  process.exit(1)
}

const requestedWorkers = Number.parseInt(process.env.WEB_CONCURRENCY ?? '1', 10)
const workers = Number.isFinite(requestedWorkers)
  ? Math.max(1, Math.min(requestedWorkers, availableParallelism(), 8))
  : 1

if (workers === 1 || cluster.isWorker) {
  require(entry)
} else {
  console.log(`Starting Asanop API with ${workers} balanced workers`)

  for (let index = 0; index < workers; index += 1) cluster.fork()

  cluster.on('exit', (worker, code, signal) => {
    if (worker.exitedAfterDisconnect) return
    console.error(`API worker ${worker.process.pid} exited (${signal || code}); restarting`)
    cluster.fork()
  })

  const shutdown = () => {
    for (const worker of Object.values(cluster.workers)) worker?.disconnect()
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
