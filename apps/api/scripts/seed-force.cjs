require('dotenv/config')

const { spawnSync } = require('child_process')
const path = require('path')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required for a demo reset.')
  process.exit(1)
}

let hostname
try {
  hostname = new URL(process.env.DATABASE_URL).hostname.toLowerCase()
} catch {
  console.error('DATABASE_URL is not a valid URL.')
  process.exit(1)
}

const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
const isRemote = !localHosts.has(hostname)

if (isRemote && process.env.SEED_CONFIRM !== 'RESET_ASANOP_DEMO') {
  console.error(
    `Refusing to reset the remote demo workspace on ${hostname}.\n` +
      'Set SEED_CONFIRM=RESET_ASANOP_DEMO to confirm this intentional reset.',
  )
  process.exit(1)
}

const env = { ...process.env, SEED_FORCE: '1' }
const prismaCli = require.resolve('prisma/build/index.js')

const result = spawnSync(process.execPath, [prismaCli, 'db', 'seed'], {
  stdio: 'inherit',
  shell: false,
  env,
  cwd: path.join(__dirname, '..'),
})

if (result.error) console.error(result.error)
process.exit(result.status ?? 1)
