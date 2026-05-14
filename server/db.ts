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

// Schema creation deferred to Story 2.1
export default db
