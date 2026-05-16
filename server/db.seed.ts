import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { adminDao as defaultAdminDao, type AdminDao, type AdminUserRow } from './dao/admin.dao'

export const SEED_SALT_ROUNDS = 12

export interface SeedAdminOptions {
  email?: string
  password?: string
  dao?: AdminDao
  saltRounds?: number
}

export interface SeedAdminResult {
  user: AdminUserRow
  action: 'created' | 'updated'
}

export function seedAdminUser(options: SeedAdminOptions = {}): SeedAdminResult {
  const email = (options.email ?? process.env.ADMIN_EMAIL ?? '').trim()
  const password = options.password ?? process.env.ADMIN_PASSWORD ?? ''

  if (!email) {
    throw new Error('ADMIN_EMAIL is required to seed admin user')
  }
  if (!password) {
    throw new Error('ADMIN_PASSWORD is required to seed admin user')
  }

  const dao = options.dao ?? defaultAdminDao
  const existing = dao.findByEmail(email)
  const password_hash = bcrypt.hashSync(password, options.saltRounds ?? SEED_SALT_ROUNDS)
  const user = dao.upsert({ email, password_hash })
  return { user, action: existing ? 'updated' : 'created' }
}

function runFromCli(): void {
  try {
    const result = seedAdminUser()
    console.log(`admin user ${result.action}: ${result.user.email} (id=${result.user.id})`)
    process.exit(0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`admin seed failed: ${message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  runFromCli()
}
