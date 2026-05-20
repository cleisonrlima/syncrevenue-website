/**
 * Environment variable validation for production startup.
 *
 * Checks that all required server-side env vars are present and that
 * JWT_SECRET meets the minimum length requirement. Logs only variable
 * *names* on failure — never values — then calls process.exit(1).
 *
 * This module is intentionally not called during tests (NODE_ENV=test).
 * Call validateEnv() inside the `require.main === module` block in
 * server/index.ts so that unit tests that import createApp() are unaffected.
 */

export const REQUIRED_ENV_VARS = [
  'PORT',
  'DB_PATH',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'NOTIFY_EMAIL',
  'ALLOWED_ORIGIN',
] as const

const JWT_SECRET_MIN_LENGTH = 32

/**
 * Validates that all required env vars are present and that JWT_SECRET is
 * at least 32 characters long. Exits the process on failure.
 *
 * Only call this function outside of the test environment.
 */
export function validateEnv(): void {
  const missingVars = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key] || process.env[key]!.trim() === ''
  )

  if (missingVars.length > 0) {
    console.error('[startup] Missing required environment variables:', missingVars.join(', '))
    console.error('[startup] Set these variables in your .env file or hosting platform secrets.')
    console.error('[startup] See .env.example for documentation on each variable.')
    process.exit(1)
  }

  const jwtSecret = process.env.JWT_SECRET!.trim()
  if (jwtSecret.length < JWT_SECRET_MIN_LENGTH) {
    console.error(
      `[startup] JWT_SECRET length is insufficient (${jwtSecret.length} chars after trimming whitespace). ` +
        `Minimum required: ${JWT_SECRET_MIN_LENGTH} characters.`
    )
    console.error('[startup] Generate a secure value with: openssl rand -hex 32')
    process.exit(1)
  }
}
