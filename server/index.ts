import 'dotenv/config'
import express from 'express'
import db from './db'

const app = express()
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ success: true, status: 'ok' })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
  console.log(`DB open: ${db.name}`)
})
