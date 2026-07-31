import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { SEED_PASSWORD } from './seed/workmates.data'
import { seedWorkmates } from './seed/workmates.seed'
import { seedDemoBoard } from './seed/demo.seed'

const prisma = new PrismaClient()

function describeDatabaseUrl(url: string | undefined) {
  if (!url) return '(DATABASE_URL not set)'
  try {
    const parsed = new URL(url)
    return `${parsed.hostname}${parsed.pathname}`
  } catch {
    return '(unparseable DATABASE_URL)'
  }
}

async function main() {
  const force = process.env.SEED_FORCE === '1' || process.env.SEED_FORCE === 'true'
  console.log(`Seeding database: ${describeDatabaseUrl(process.env.DATABASE_URL)}`)
  if (force) {
    console.log('SEED_FORCE=1 — will wipe and recreate the Asanop Demo board.')
  }
  console.log('')

  const results = await seedWorkmates(prisma)
  const created = results.filter((r) => r.created).length
  const skipped = results.length - created

  console.log(`Workmates: seeded ${created}; skipped ${skipped} existing.`)
  console.log(`Shared workmate password: ${SEED_PASSWORD}`)
  for (const r of results) {
    console.log(`  - ${r.email}${r.created ? '' : ' (already existed)'}`)
  }

  console.log('')
  const demo = await seedDemoBoard(prisma, { force })
  if (demo.skipped) {
    console.log(
      `Demo board: already rich (${demo.taskCount} tasks, ${demo.sectionCount} sections) — skipped recreate.`,
    )
    console.log('To rebuild tasks/forms/etc., run with SEED_FORCE=1')
  } else {
    console.log(`Demo board: "${demo.projectName}"`)
    console.log(`  Tasks:         ${demo.taskCount}`)
    console.log(`  Sections:      ${demo.sectionCount}`)
    console.log(`  Members:       ${demo.memberCount}`)
    console.log(`  Forms:         ${demo.formCount}`)
    console.log(`  Automations:   ${demo.automationCount}`)
    console.log(`  Notifications: ${demo.notificationCount}`)
    console.log(`  Invites:       ${demo.inviteCount}`)
  }
  console.log('')
  console.log('Log in to see the busy board:')
  console.log(`  Email:     ${demo.ownerEmail}`)
  console.log(`  Password:  ${demo.password}`)
  console.log(`  Workspace: ${demo.workspaceName}`)
  console.log(`  Project:   ${demo.projectName}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
