import 'dotenv/config'
import express from 'express'
import db from './db'

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok' })
})

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
  // Force exit if connections hang
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
