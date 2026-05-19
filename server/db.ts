import 'dotenv/config'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = path.resolve(__dirname, process.env.DB_PATH || '../data/sync_sirius.db')
const dbDir = path.dirname(dbPath)

fs.mkdirSync(dbDir, { recursive: true })

let db: Database.Database
try {
  db = new Database(dbPath)
  const mode = db.pragma('journal_mode = WAL', { simple: true })
  if (mode !== 'wal') {
    console.warn(`Journal mode not set to WAL; current mode: ${mode}`)
  }
} catch (err) {
  console.error('Failed to open database:', err)
  process.exit(1)
}

export function initSchema(database: Database.Database = db): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS demo_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      gds TEXT NOT NULL CHECK (gds IN ('Amadeus','Sabre','Travelport (Galileo/Worldspan)','Galileo','Worldspan','Other','None yet')),
      message TEXT,
      locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','qualified')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es')),
      read INTEGER NOT NULL DEFAULT 0 CHECK (read IN (0,1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role_en TEXT NOT NULL,
      role_pt TEXT NOT NULL,
      role_es TEXT NOT NULL,
      bio_en TEXT NOT NULL,
      bio_pt TEXT NOT NULL,
      bio_es TEXT NOT NULL,
      experience_en TEXT NOT NULL DEFAULT '',
      experience_pt TEXT NOT NULL DEFAULT '',
      experience_es TEXT NOT NULL DEFAULT '',
      linkedin TEXT,
      photo_url TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      token_version INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Per-email failed-login counters for admin throttling. Kept in a dedicated
    -- table (rather than columns on admin_users) so security state can be
    -- cleared/inspected without touching credential rows.
    CREATE TABLE IF NOT EXISTS admin_login_attempts (
      email TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      last_failed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      gds TEXT NOT NULL,
      notes TEXT,
      locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Story 4.8: backfill token_version on pre-existing admin_users rows.
  // SQLite lacks `ADD COLUMN IF NOT EXISTS`; the try/catch swallows the
  // duplicate-column error on already-migrated DBs and rethrows anything else.
  try {
    database.exec(`ALTER TABLE admin_users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (!/duplicate column name: token_version/i.test(message)) {
      throw err
    }
  }

  const teamExperienceColumns = [
    'experience_en',
    'experience_pt',
    'experience_es',
  ] as const
  for (const column of teamExperienceColumns) {
    try {
      database.exec(`ALTER TABLE team_members ADD COLUMN ${column} TEXT NOT NULL DEFAULT ''`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (!/duplicate column name/i.test(message)) {
        throw err
      }
    }
  }

  database
    .prepare(
      `
        UPDATE team_members
        SET
          experience_en = CASE WHEN experience_en = '' THEN '20+ years in airline distribution' ELSE experience_en END,
          experience_pt = CASE WHEN experience_pt = '' THEN '20+ anos em distribuição aérea' ELSE experience_pt END,
          experience_es = CASE WHEN experience_es = '' THEN '20+ años en distribución aérea' ELSE experience_es END
        WHERE name = 'Maria Silva'
      `
    )
    .run()
  database
    .prepare(
      `
        UPDATE team_members
        SET
          experience_en = CASE WHEN experience_en = '' THEN '15+ years in travel data automation' ELSE experience_en END,
          experience_pt = CASE WHEN experience_pt = '' THEN '15+ anos em automação de dados de viagens' ELSE experience_pt END,
          experience_es = CASE WHEN experience_es = '' THEN '15+ años en automatización de datos de viajes' ELSE experience_es END
        WHERE name = 'Lucas Oliveira'
      `
    )
    .run()

  // Story 6.10: extend demo_requests.gds CHECK to accept the merged
  // "Travelport (Galileo/Worldspan)" label. SQLite can't ALTER a CHECK
  // constraint in place, so rebuild the table when the live schema string
  // doesn't yet contain the new value. Idempotent — runs once.
  const liveDemoSchema = database
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='demo_requests'")
    .get() as { sql?: string } | undefined
  if (liveDemoSchema?.sql && !liveDemoSchema.sql.includes('Travelport')) {
    const dependentObjects = database
      .prepare(
        `
          SELECT type, name, sql
          FROM sqlite_master
          WHERE tbl_name = 'demo_requests'
            AND type IN ('index', 'trigger')
            AND sql IS NOT NULL
          ORDER BY type, name
        `
      )
      .all() as Array<{ type: 'index' | 'trigger'; name: string; sql: string }>

    const migrateDemoGdsCheck = database.transaction(() => {
      database.exec(`
        CREATE TABLE demo_requests_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          company TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL,
          gds TEXT NOT NULL CHECK (gds IN ('Amadeus','Sabre','Travelport (Galileo/Worldspan)','Galileo','Worldspan','Other','None yet')),
          message TEXT,
          locale TEXT NOT NULL CHECK (locale IN ('en','pt-BR','es')),
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','qualified')),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO demo_requests_new (
          id,
          name,
          email,
          company,
          phone,
          role,
          gds,
          message,
          locale,
          status,
          created_at,
          updated_at
        )
        SELECT
          id,
          name,
          email,
          company,
          phone,
          role,
          gds,
          message,
          locale,
          status,
          created_at,
          updated_at
        FROM demo_requests;
        DROP TABLE demo_requests;
        ALTER TABLE demo_requests_new RENAME TO demo_requests;
      `)

      for (const object of dependentObjects) {
        database.exec(object.sql)
      }
    })

    migrateDemoGdsCheck()
  }
}

initSchema(db)

export default db
