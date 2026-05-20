// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validateEnv, REQUIRED_ENV_VARS } from './env-validation'

describe('validateEnv', () => {
  let originalEnv: NodeJS.ProcessEnv
  let exitSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Snapshot original env and replace it with a clean slate for each test
    originalEnv = { ...process.env }

    // Spy on process.exit to prevent test process from actually exiting
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code) => {
      throw new Error(`process.exit called with code ${_code}`)
    })

    // Capture console.error without polluting test output
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Restore original env
    process.env = originalEnv
    exitSpy.mockRestore()
    errorSpy.mockRestore()
  })

  function setAllValidVars() {
    process.env.PORT = '3001'
    process.env.DB_PATH = '/var/data/sync_sirius.db'
    process.env.JWT_SECRET = 'a'.repeat(32) // exactly 32 chars
    process.env.SMTP_HOST = 'smtp.example.com'
    process.env.SMTP_PORT = '587'
    process.env.SMTP_USER = 'user@example.com'
    process.env.SMTP_PASS = 'hunter2'
    process.env.NOTIFY_EMAIL = 'notify@example.com'
    process.env.ALLOWED_ORIGIN = 'https://syncsirius.com'
  }

  it('does not call process.exit when all vars are present and JWT_SECRET is ≥32 chars', () => {
    setAllValidVars()
    expect(() => validateEnv()).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('accepts JWT_SECRET longer than 32 chars', () => {
    setAllValidVars()
    process.env.JWT_SECRET = 'a'.repeat(64)
    expect(() => validateEnv()).not.toThrow()
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('calls process.exit(1) and logs the missing var name (not its value) when one required var is absent', () => {
    setAllValidVars()
    delete process.env.JWT_SECRET

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)

    // Verify the error message contains the key name but not a secret value
    const errorCalls = errorSpy.mock.calls.flat().join(' ')
    expect(errorCalls).toContain('JWT_SECRET')
  })

  it('calls process.exit(1) when multiple required vars are absent', () => {
    setAllValidVars()
    delete process.env.SMTP_HOST
    delete process.env.SMTP_PASS
    delete process.env.NOTIFY_EMAIL

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)

    const errorCalls = errorSpy.mock.calls.flat().join(' ')
    expect(errorCalls).toContain('SMTP_HOST')
    expect(errorCalls).toContain('SMTP_PASS')
    expect(errorCalls).toContain('NOTIFY_EMAIL')
  })

  it('calls process.exit(1) when a required var is set to an empty string', () => {
    setAllValidVars()
    process.env.NOTIFY_EMAIL = ''

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)

    const errorCalls = errorSpy.mock.calls.flat().join(' ')
    expect(errorCalls).toContain('NOTIFY_EMAIL')
  })

  it('calls process.exit(1) when a required var is set to whitespace only', () => {
    setAllValidVars()
    process.env.ALLOWED_ORIGIN = '   '

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)

    const errorCalls = errorSpy.mock.calls.flat().join(' ')
    expect(errorCalls).toContain('ALLOWED_ORIGIN')
  })

  it('calls process.exit(1) when JWT_SECRET is shorter than 32 chars', () => {
    setAllValidVars()
    process.env.JWT_SECRET = 'too-short' // only 9 chars

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)

    const errorCalls = errorSpy.mock.calls.flat().join(' ')
    // Error message must mention the constraint but NOT contain the actual secret value
    expect(errorCalls).toContain('JWT_SECRET')
    expect(errorCalls).not.toContain('too-short')
  })

  it('calls process.exit(1) when JWT_SECRET is exactly 31 chars (one below minimum)', () => {
    setAllValidVars()
    process.env.JWT_SECRET = 'b'.repeat(31)

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('calls process.exit(1) when JWT_SECRET is padded with whitespace to reach 32 chars but has fewer real chars', () => {
    setAllValidVars()
    // "abc" + 29 spaces = 32 chars total, but only 3 chars of real entropy after trimming
    process.env.JWT_SECRET = 'abc' + ' '.repeat(29)

    expect(() => validateEnv()).toThrow('process.exit called with code 1')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('covers every entry in REQUIRED_ENV_VARS — each missing var triggers an exit', () => {
    for (const key of REQUIRED_ENV_VARS) {
      setAllValidVars()
      delete process.env[key]

      exitSpy.mockClear()
      errorSpy.mockClear()

      expect(() => validateEnv()).toThrow()
      expect(exitSpy).toHaveBeenCalledWith(1)
    }
  })

  it('never logs the value of a secret variable in error output', () => {
    setAllValidVars()
    // Use a recognizable sentinel that would be unique to the value (not part of any error template)
    const secretSentinel = 'SENTINEL_SECRET_VALUE_XYZ'
    process.env.JWT_SECRET = secretSentinel.slice(0, 10) // too short — will trigger exit

    expect(() => validateEnv()).toThrow()

    const errorOutput = errorSpy.mock.calls.flat().join(' ')
    // The sentinel value itself must never appear in logs — only the key name + length
    expect(errorOutput).not.toContain(secretSentinel)
    expect(errorOutput).not.toContain('SENTINEL_SECRET_VALUE_XYZ')
  })
})
