/**
 * Seed a deployed database without resetting an already complete demo workspace.
 * This is safe to run after every migration/deploy: the Prisma seed is idempotent
 * unless SEED_FORCE is explicitly enabled, which this wrapper always removes.
 */
require('dotenv/config')

const { spawnSync } = require('child_process')
const path = require('path')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for deployment seeding.')
  process.exit(1)
}

const env = { ...process.env }
delete env.SEED_FORCE
delete env.SEED_CONFIRM
const prismaCli = require.resolve('prisma/build/index.js')

const result = spawnSync(process.execPath, [prismaCli, 'db', 'seed'], {
  stdio: 'inherit',
  shell: false,
  env,
  cwd: path.join(__dirname, '..'),
})

if (result.error) console.error(result.error)
process.exit(result.status ?? 1)
