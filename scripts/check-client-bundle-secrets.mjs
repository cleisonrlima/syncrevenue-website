import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const clientDir = path.join(repoRoot, 'dist', 'client')

const forbiddenNames = [
  'VITE_JWT_SECRET',
  'VITE_SMTP',
  'VITE_DB_PATH',
  'VITE_NOTIFY',
  'JWT_SECRET',
  'SMTP_PASS',
  'SMTP_USER',
  'NOTIFY_EMAIL',
]

const seededSecretValues = [
  'client-bundle-jwt-secret-sentinel',
  'client-bundle-smtp-pass-sentinel',
  'client-bundle-smtp-user-sentinel',
  'client-bundle-notify-email-sentinel@example.com',
]

const forbiddenValues = [
  ...seededSecretValues,
  ...forbiddenNames.map(name => process.env[name]).filter(value => value && value.length >= 8),
]

const scannedExtensions = new Set(['.html', '.js', '.css', '.map'])
const offenders = []

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(filePath)
      continue
    }
    if (!scannedExtensions.has(path.extname(entry.name))) continue

    const content = fs.readFileSync(filePath, 'utf8')
    for (const forbiddenName of forbiddenNames) {
      if (content.includes(forbiddenName)) {
        offenders.push(`${path.relative(repoRoot, filePath)} contains ${forbiddenName}`)
      }
    }
    for (const forbiddenValue of forbiddenValues) {
      if (content.includes(forbiddenValue)) {
        offenders.push(`${path.relative(repoRoot, filePath)} contains a forbidden secret value`)
      }
    }
  }
}

if (!fs.existsSync(clientDir)) {
  console.error('dist/client does not exist. Run npm run build before scanning client bundle secrets.')
  process.exit(1)
}

walk(clientDir)

if (offenders.length > 0) {
  console.error('Client bundle secret scan failed:')
  for (const offender of offenders) {
    console.error(`- ${offender}`)
  }
  process.exit(1)
}

console.log('Client bundle secret scan passed.')
