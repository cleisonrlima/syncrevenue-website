import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const securityTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-e2e-security-'))
export const allowedOrigin = 'http://localhost:5173'

process.env.DB_PATH = path.join(securityTempDir, 'test.db')
process.env.ALLOWED_ORIGIN = allowedOrigin
process.env.JWT_SECRET = 'test-secret'
