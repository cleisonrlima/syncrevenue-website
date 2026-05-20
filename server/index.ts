import 'dotenv/config'
import express, { type Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import db from './db'
import { requireAdmin } from './middleware/auth'
import { validateEnv } from './env-validation'
import demoRouter from './routes/demo'
import contactRouter from './routes/contact'
import auditRouter from './routes/audit'
import adminAuthRouter from './routes/admin/auth'
import adminLeadsRouter from './routes/admin/leads'
import adminContactsRouter from './routes/admin/contacts'
import adminTeamRouter from './routes/admin/team'
import adminDashboardRouter from './routes/admin/dashboard'
import publicTeamRouter from './routes/team'
import healthRouter from './routes/health'

/**
 * Sets Cache-Control headers for static assets served from dist/client/.
 *
 * - Vite-hashed assets (e.g. index.abc12345.js) → immutable, 1-year cache
 * - index.html → no-cache (always revalidate so clients get the latest entry point)
 *
 * Exported for unit testing.
 */
export function staticCacheHeaders(res: express.Response, filePath: string): void {
  if (filePath.endsWith('index.html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
  } else if (/-[A-Za-z0-9]{8,}\.[a-z0-9]+$/.test(filePath)) {
    res.setHeader('Cache-Control', 'max-age=31536000, immutable')
  }
}

export function createApp(): Express {
  const app = express()

  // AC 1 (Story 5.2): Redirect HTTP → HTTPS in production.
  // Handles the reverse-proxy case where Nginx/Caddy terminates TLS and
  // forwards to Express via X-Forwarded-Proto. Acts as defence-in-depth;
  // the primary redirect should also be configured at the proxy level.
  if (process.env.NODE_ENV === 'production') {
    // AC 1 (Story 5.9): Trust the first hop in the X-Forwarded-For chain
    // (Nginx/Caddy reverse proxy terminating TLS on the same host). Required
    // so req.protocol, req.secure, and req.ip reflect the real client values
    // instead of the proxy loopback. Without this, express-rate-limit keys
    // every request to the proxy IP and shares a single bucket across all
    // clients.
    app.set('trust proxy', 1)

    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] === 'http') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`)
      }
      next()
    })
  }

  app.disable('x-powered-by')

  // AC 2 (Story 5.2): Explicit HSTS configuration.
  // In production: max-age=1 year, includeSubDomains, preload-eligible.
  // In dev/test: HSTS disabled to prevent browser cache poisoning during development.
  app.use(helmet({
    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  }))

  const allowedOrigin = process.env.ALLOWED_ORIGIN
  app.use(
    cors({
      origin: allowedOrigin ?? false,
      credentials: true,
    })
  )

  app.use(express.json())
  app.use(cookieParser())

  app.use('/api', healthRouter)

  app.use('/api/demo', demoRouter)
  app.use('/api/contact', contactRouter)
  app.use('/api/audit', auditRouter)
  app.use('/api/team', publicTeamRouter)

  app.use('/api/admin/auth', adminAuthRouter)
  app.use('/api/admin/leads', requireAdmin, adminLeadsRouter)
  app.use('/api/admin/contacts', requireAdmin, adminContactsRouter)
  app.use('/api/admin/team', requireAdmin, adminTeamRouter)
  app.use('/api/admin/dashboard', requireAdmin, adminDashboardRouter)

  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'Not found' })
  })

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/api')) {
      next(err)
      return
    }
    const status = err instanceof SyntaxError ? 400 : 500
    res.status(status).json({
      success: false,
      message: status === 400 ? 'Invalid JSON payload' : 'Internal server error',
    })
  })

  if (process.env.NODE_ENV === 'production') {
    const clientDir = path.resolve(__dirname, '../dist/client')
    if (fs.existsSync(clientDir)) {
      app.use(
        express.static(clientDir, {
          setHeaders: staticCacheHeaders,
        })
      )
      app.get(/^\/(?!api).*/, (_req, res) => {
        res.sendFile(path.join(clientDir, 'index.html'))
      })
    }
  }

  return app
}

if (require.main === module) {
  // Validate required env vars before starting. Exits on missing or weak secrets.
  // Skipped automatically in test environment (NODE_ENV=test never reaches this block).
  validateEnv()

  const app = createApp()
  const port = process.env.PORT || 3001
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`DB open: ${db.name}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use`)
      process.exit(1)
    }
    throw err
  })

  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...')
    db.close()
    server.close(() => {
      console.log('Server closed')
      process.exit(0)
    })
    setTimeout(() => {
      console.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10000)
  }

  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
}
