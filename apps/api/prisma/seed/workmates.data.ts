export type SeedWorkmate = {
  name: string
  email: string
  slug: string
}

/** Shared password for all seeded workmates (local invite testing only). */
export const SEED_PASSWORD = 'password123'

/**
 * Pre-registered teammates you can invite from Members & invites.
 * They each own a private workspace and are NOT members of your workspace
 * until they accept an invite.
 */
export const WORKMATES: SeedWorkmate[] = [
  { name: 'Ava Chen', email: 'ava.chen@asanop.dev', slug: 'ava-chen' },
  { name: 'Ben Ortiz', email: 'ben.ortiz@asanop.dev', slug: 'ben-ortiz' },
  { name: 'Chloe Park', email: 'chloe.park@asanop.dev', slug: 'chloe-park' },
  { name: 'Diego Ruiz', email: 'diego.ruiz@asanop.dev', slug: 'diego-ruiz' },
  { name: 'Elena Brooks', email: 'elena.brooks@asanop.dev', slug: 'elena-brooks' },
  { name: 'Farah Khan', email: 'farah.khan@asanop.dev', slug: 'farah-khan' },
  { name: 'Gabe Miller', email: 'gabe.miller@asanop.dev', slug: 'gabe-miller' },
  { name: 'Hana Sato', email: 'hana.sato@asanop.dev', slug: 'hana-sato' },
  { name: 'Ian Walsh', email: 'ian.walsh@asanop.dev', slug: 'ian-walsh' },
  { name: 'Jade Nguyen', email: 'jade.nguyen@asanop.dev', slug: 'jade-nguyen' },
]
