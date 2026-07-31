process.env.SEED_FORCE = '1'

const { spawnSync } = require('child_process')
const path = require('path')

const result = spawnSync('npx', ['prisma', 'db', 'seed'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: path.join(__dirname, '..'),
})

process.exit(result.status ?? 1)
