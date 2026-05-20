import { Router } from 'express'
import { healthDao } from '../dao/health.dao'

const router = Router()

/**
 * GET /api/health
 *
 * Public health check endpoint — no authentication required.
 * Returns HTTP 200 with status 'ok' when the server is running and the
 * database is responsive. Returns HTTP 503 with status 'db_unavailable'
 * if the database liveness probe fails.
 *
 * Response time is well under 200 ms: the DB probe runs a synchronous
 * `SELECT 1` via better-sqlite3 which completes in microseconds on a
 * healthy database.
 */
router.get('/health', (_req, res) => {
  try {
    healthDao.ping()
  } catch {
    res.status(503).json({
      success: false,
      status: 'db_unavailable',
      timestamp: new Date().toISOString(),
    })
    return
  }

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

export default router
