/**
 * Resolve Nest build output whether emit is dist/main.js or dist/src/main.js.
 */
const { existsSync } = require('fs')
const { join } = require('path')
const { spawnSync } = require('child_process')

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

const result = spawnSync(process.execPath, [entry], {
  stdio: 'inherit',
  env: process.env,
})
process.exit(result.status ?? 1)
