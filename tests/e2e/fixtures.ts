import { expect, request, test as base, devices } from '@playwright/test'
import type { WorkerInfo } from '@playwright/test'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

type LeadStatus = 'pending' | 'contacted' | 'qualified'
type Locale = 'en' | 'pt-BR' | 'es'
type Gds =
  | 'Amadeus'
  | 'Sabre'
  | 'Travelport (Galileo/Worldspan)'
  | 'Galileo'
  | 'Worldspan'
  | 'Other'
  | 'None yet'

interface SeedAdminInput {
  email: string
  password: string
}

interface SeedLeadInput {
  name: string
  email: string
  company: string
  phone?: string | null
  role: string
  gds: Gds
  message?: string | null
  locale: Locale
  status?: LeadStatus
}

interface SeedTeamMemberInput {
  name: string
  role_en: string
  role_pt: string
  role_es: string
  bio_en: string
  bio_pt: string
  bio_es: string
  experience_en: string
  experience_pt: string
  experience_es: string
  linkedin?: string | null
  photo_url?: string | null
  order_index?: number
  active?: 0 | 1
}

interface SeedContactInput {
  name: string
  email: string
  subject: string
  message: string
  locale: Locale
  read?: 0 | 1
}

interface LeadStats {
  totalLeads: number
  pendingLeads: number
  leadsThisWeek: number
  leadsByLocale: { en: number; 'pt-BR': number; es: number }
}

interface E2eDb {
  path: string
  seedAdminUser(input: SeedAdminInput): void
  resetAdminLoginAttempts(email: string): void
  deleteLeadsByEmails(emails: string[]): void
  seedLead(input: SeedLeadInput): { id: number }
  findLeadByEmail(email: string): { id: number } | undefined
  countLeadStats(): LeadStats
  deleteTeamByNames(names: string[]): void
  deleteCreatedTeamMembers(): void
  seedTeamMember(input: SeedTeamMemberInput): { id: number }
  deleteContactsByEmails(emails: string[]): void
  seedContact(input: SeedContactInput): { id: number }
  rowCount(tableName: string): number
  tableExists(tableName: string): boolean
}

interface E2eServer {
  backendUrl: string
  dbPath: string
  smtpPort: number
}

type Fixtures = Record<string, never>

type WorkerFixtures = {
  e2eServer: E2eServer
  e2eDb: E2eDb
}

const PROJECT_ROOT = path.resolve(__dirname, '../..')
const BACKEND_PORT = Number(process.env.PORT ?? 3001)
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 1025)
const FRONTEND_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173'
const TEST_SALT_ROUNDS = 4

export const test = base.extend<Fixtures, WorkerFixtures>({
  e2eServer: [
    async ({}, use, workerInfo) => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-playwright-'))
      const dbPath = path.join(tempDir, `worker-${workerInfo.workerIndex}.db`)
      const smtp = await startSmtpSink(SMTP_PORT)
      const backend = startBackend({ dbPath, port: BACKEND_PORT, smtpPort: SMTP_PORT })

      try {
        await waitForBackend({
          backend,
          url: `http://127.0.0.1:${BACKEND_PORT}/api/health`,
          workerInfo,
        })
        await use({
          backendUrl: `http://127.0.0.1:${BACKEND_PORT}`,
          dbPath,
          smtpPort: SMTP_PORT,
        })
      } finally {
        await stopProcess(backend)
        await new Promise<void>(resolve => smtp.close(() => resolve()))
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    },
    { scope: 'worker', auto: true, timeout: 45_000 },
  ],

  e2eDb: [
    async ({ e2eServer }, use) => {
      const db = new Database(e2eServer.dbPath)
      db.pragma('busy_timeout = 5000')
      try {
        await use(createE2eDb(db, e2eServer.dbPath))
      } finally {
        db.close()
      }
    },
    { scope: 'worker' },
  ],
})

export { expect, request, devices }
export type { E2eDb, LeadStatus, Locale }

function createE2eDb(db: Database.Database, dbPath: string): E2eDb {
  return {
    path: dbPath,
    seedAdminUser({ email, password }) {
      const password_hash = bcrypt.hashSync(password, TEST_SALT_ROUNDS)
      const existing = db.prepare('SELECT id FROM admin_users WHERE email = ?').get(email)
      if (existing) {
        db.prepare(
          'UPDATE admin_users SET password_hash = ?, token_version = token_version + 1 WHERE email = ?'
        ).run(password_hash, email)
      } else {
        db.prepare('INSERT INTO admin_users (email, password_hash) VALUES (?, ?)').run(
          email,
          password_hash
        )
      }
    },
    resetAdminLoginAttempts(email) {
      db.prepare('DELETE FROM admin_login_attempts WHERE email = ?').run(email)
    },
    deleteLeadsByEmails(emails) {
      const stmt = db.prepare('DELETE FROM demo_requests WHERE email = ?')
      for (const email of emails) stmt.run(email)
    },
    seedLead(input) {
      const result = db
        .prepare(
          `
            INSERT INTO demo_requests (name, email, company, phone, role, gds, message, locale)
            VALUES (@name, @email, @company, @phone, @role, @gds, @message, @locale)
          `
        )
        .run({
          name: input.name,
          email: input.email,
          company: input.company,
          phone: input.phone ?? null,
          role: input.role,
          gds: input.gds,
          message: input.message ?? null,
          locale: input.locale,
        })
      const id = Number(result.lastInsertRowid)
      if (input.status && input.status !== 'pending') {
        db.prepare(
          "UPDATE demo_requests SET status = @status, updated_at = datetime('now') WHERE id = @id"
        ).run({ id, status: input.status })
      }
      return { id }
    },
    findLeadByEmail(email) {
      return db.prepare('SELECT id FROM demo_requests WHERE email = ?').get(email) as
        | { id: number }
        | undefined
    },
    countLeadStats() {
      const totalLeads = (
        db.prepare('SELECT COUNT(*) AS n FROM demo_requests').get() as { n: number }
      ).n
      const pendingLeads = (
        db.prepare("SELECT COUNT(*) AS n FROM demo_requests WHERE status = 'pending'").get() as {
          n: number
        }
      ).n
      const leadsThisWeek = (
        db
          .prepare("SELECT COUNT(*) AS n FROM demo_requests WHERE created_at >= datetime('now', '-7 days')")
          .get() as { n: number }
      ).n
      const rows = db
        .prepare('SELECT locale, COUNT(*) AS n FROM demo_requests GROUP BY locale')
        .all() as Array<{ locale: Locale; n: number }>
      const leadsByLocale: LeadStats['leadsByLocale'] = { en: 0, 'pt-BR': 0, es: 0 }
      for (const row of rows) leadsByLocale[row.locale] = row.n
      return { totalLeads, pendingLeads, leadsThisWeek, leadsByLocale }
    },
    deleteTeamByNames(names) {
      const stmt = db.prepare('DELETE FROM team_members WHERE name = ?')
      for (const name of names) stmt.run(name)
    },
    deleteCreatedTeamMembers() {
      db.prepare("DELETE FROM team_members WHERE name LIKE 'E2E Created %'").run()
    },
    seedTeamMember(input) {
      const result = db
        .prepare(
          `
            INSERT INTO team_members
              (name, role_en, role_pt, role_es, bio_en, bio_pt, bio_es, experience_en, experience_pt, experience_es, linkedin, photo_url, order_index, active)
            VALUES
              (@name, @role_en, @role_pt, @role_es, @bio_en, @bio_pt, @bio_es, @experience_en, @experience_pt, @experience_es, @linkedin, @photo_url, @order_index, @active)
          `
        )
        .run({
          name: input.name,
          role_en: input.role_en,
          role_pt: input.role_pt,
          role_es: input.role_es,
          bio_en: input.bio_en,
          bio_pt: input.bio_pt,
          bio_es: input.bio_es,
          experience_en: input.experience_en,
          experience_pt: input.experience_pt,
          experience_es: input.experience_es,
          linkedin: input.linkedin ?? null,
          photo_url: input.photo_url ?? null,
          order_index: input.order_index ?? 0,
          active: input.active ?? 1,
        })
      return { id: Number(result.lastInsertRowid) }
    },
    deleteContactsByEmails(emails) {
      const stmt = db.prepare('DELETE FROM contacts WHERE email = ?')
      for (const email of emails) stmt.run(email)
    },
    seedContact(input) {
      const result = db
        .prepare(
          `
            INSERT INTO contacts (name, email, subject, message, locale, read)
            VALUES (@name, @email, @subject, @message, @locale, @read)
          `
        )
        .run({
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
          locale: input.locale,
          read: input.read ?? 0,
        })
      return { id: Number(result.lastInsertRowid) }
    },
    rowCount(tableName) {
      assertKnownTable(tableName)
      return (db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get() as { count: number })
        .count
    },
    tableExists(tableName) {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(tableName) as { name: string } | undefined
      return row?.name === tableName
    },
  }
}

function startBackend(input: {
  dbPath: string
  port: number
  smtpPort: number
}): ChildProcessWithoutNullStreams {
  const startServerScript = [
    "import('./server/index.ts').then(({ createApp }) => {",
    "const server = createApp().listen(Number(process.env.PORT), '127.0.0.1', () => console.log('E2E backend ready'));",
    "const shutdown = () => server.close(() => process.exit(0));",
    "process.on('SIGTERM', shutdown);",
    "process.on('SIGINT', shutdown);",
    "}).catch(error => { console.error(error); process.exit(1); });",
  ].join(' ')

  return spawn(process.execPath, ['--import', 'tsx', '-e', startServerScript], {
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(input.port),
      DB_PATH: input.dbPath,
      ALLOWED_ORIGIN: FRONTEND_ORIGIN,
      JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-jwt-secret-0000000000000000',
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(input.smtpPort),
      SMTP_USER: process.env.SMTP_USER ?? 'e2e-smtp-user@example.com',
      SMTP_PASS: process.env.SMTP_PASS ?? 'e2e-smtp-pass',
      NOTIFY_EMAIL: process.env.NOTIFY_EMAIL ?? 'e2e-notify@example.com',
    },
  })
}

async function waitForBackend(input: {
  backend: ChildProcessWithoutNullStreams
  url: string
  workerInfo: WorkerInfo
}): Promise<void> {
  let output = ''
  input.backend.stdout.on('data', chunk => {
    output += chunk.toString()
  })
  input.backend.stderr.on('data', chunk => {
    output += chunk.toString()
  })

  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (input.backend.exitCode !== null) {
      throw new Error(`E2E backend exited before readiness:\n${output}`)
    }
    try {
      const response = await fetch(input.url)
      if (response.ok) return
    } catch {
      // keep polling until timeout
    }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  throw new Error(`E2E backend was not ready for worker ${input.workerInfo.workerIndex}:\n${output}`)
}

async function stopProcess(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null) return
  child.kill('SIGTERM')
  await new Promise<void>(resolve => {
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL')
      resolve()
    }, 5_000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

async function startSmtpSink(port: number): Promise<net.Server> {
  const server = net.createServer(socket => {
    let inData = false
    socket.setEncoding('utf8')
    socket.write('220 localhost ESMTP\r\n')

    socket.on('data', chunk => {
      for (const rawLine of chunk.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line) continue
        if (inData) {
          if (line === '.') {
            inData = false
            socket.write('250 Message accepted\r\n')
          }
          continue
        }
        const command = line.split(/\s+/)[0]?.toUpperCase()
        if (command === 'EHLO' || command === 'HELO') {
          socket.write('250-localhost\r\n250 AUTH PLAIN LOGIN\r\n')
        } else if (command === 'AUTH') {
          socket.write('235 Authentication successful\r\n')
        } else if (command === 'MAIL' || command === 'RCPT' || command === 'RSET' || command === 'NOOP') {
          socket.write('250 OK\r\n')
        } else if (command === 'DATA') {
          inData = true
          socket.write('354 End data with <CR><LF>.<CR><LF>\r\n')
        } else if (command === 'QUIT') {
          socket.write('221 Bye\r\n')
          socket.end()
        } else {
          socket.write('250 OK\r\n')
        }
      }
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  return server
}

function assertKnownTable(tableName: string): void {
  const allowed = new Set([
    'demo_requests',
    'contacts',
    'team_members',
    'admin_users',
    'admin_login_attempts',
    'audit_requests',
  ])
  if (!allowed.has(tableName)) {
    throw new Error(`Unknown E2E table: ${tableName}`)
  }
}
