import 'dotenv/config'
import express, { type Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import db from './db'
import { requireAdmin } from './middleware/auth'
import demoRouter from './routes/demo'
import contactRouter from './routes/contact'
import adminAuthRouter from './routes/admin/auth'
import adminLeadsRouter from './routes/admin/leads'
import adminContactsRouter from './routes/admin/contacts'
import adminTeamRouter from './routes/admin/team'

export function createApp(): Express {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())

  const allowedOrigin = process.env.ALLOWED_ORIGIN
  app.use(
    cors({
      origin: allowedOrigin ?? false,
      credentials: true,
    })
  )

  app.use(express.json())
  app.use(cookieParser())

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, status: 'ok' })
  })

  app.use('/api/demo', demoRouter)
  app.use('/api/contact', contactRouter)

  app.use('/api/admin/auth', adminAuthRouter)
  app.use('/api/admin/leads', requireAdmin, adminLeadsRouter)
  app.use('/api/admin/contacts', requireAdmin, adminContactsRouter)
  app.use('/api/admin/team', requireAdmin, adminTeamRouter)

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
      app.use(express.static(clientDir))
      app.get(/^\/(?!api).*/, (_req, res) => {
        res.sendFile(path.join(clientDir, 'index.html'))
      })
    }
  }

  return app
}

if (require.main === module) {
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
