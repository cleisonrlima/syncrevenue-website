import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export interface HealthDao {
  /**
   * Runs a trivial SELECT 1 query to confirm the database connection is live.
   * Returns true if the DB responds, or throws if the DB is unavailable.
   * The query is intentionally minimal — it completes in microseconds on a
   * healthy better-sqlite3 connection.
   */
  ping(): true
}

export function createHealthDao(database: Database = defaultDb): HealthDao {
  return {
    ping() {
      database.prepare('SELECT 1').get()
      return true
    },
  }
}

export const healthDao = createHealthDao()
