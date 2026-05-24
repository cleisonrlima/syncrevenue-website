import Database from 'better-sqlite3'

const [, , sourcePath, backupPath] = process.argv

if (!sourcePath || !backupPath) {
  console.error('[backup] ERROR: usage: node scripts/sqlite-backup.mjs <source.db> <backup.db>')
  process.exit(1)
}

let database

try {
  database = new Database(sourcePath, { readonly: true, fileMustExist: true })
  await database.backup(backupPath)
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[backup] ERROR: SQLite backup failed: ${message}`)
  process.exit(1)
} finally {
  database?.close()
}
