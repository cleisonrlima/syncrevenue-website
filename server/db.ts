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
      gds TEXT NOT NULL CHECK (gds IN ('Amadeus','Sabre','Galileo','Worldspan','Other','None yet')),
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
      linkedin TEXT,
      photo_url TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

initSchema(db)

export default db
