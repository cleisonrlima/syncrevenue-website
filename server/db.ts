import 'dotenv/config'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DB_PATH || './data/sync_sirius.db'
const dbDir = path.dirname(path.resolve(dbPath))

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
// Schema creation deferred to Story 2.1
export default db
