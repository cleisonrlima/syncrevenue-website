import { expect, request, test } from './fixtures'
import type { APIRequestContext } from '@playwright/test'
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

test.describe('Story 2.5 SMTP notification resilience @P1', () => {
  let api: APIRequestContext | undefined
  let serverProcess: ChildProcessWithoutNullStreams | undefined
  let tempDir: string
  let serverOutput = ''

  test.beforeAll(async ({}, workerInfo) => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'syncrev-story-2-5-e2e-'))
    const port = 3100 + workerInfo.workerIndex

    const startServerScript = [
      "import('./server/index.ts').then(({ createApp }) => {",
      "const server = createApp().listen(Number(process.env.PORT), '127.0.0.1', () => console.log('E2E backend ready'));",
      "const shutdown = () => server.close(() => process.exit(0));",
      "process.on('SIGTERM', shutdown);",
      "process.on('SIGINT', shutdown);",
      "}).catch(error => { console.error(error); process.exit(1); });",
    ].join(' ')

    serverProcess = spawn(process.execPath, ['--import', 'tsx', '-e', startServerScript], {
      cwd: path.resolve(__dirname, '../..'),
      env: {
        ...process.env,
        PORT: String(port),
        DB_PATH: path.join(tempDir, 'e2e.db'),
        ALLOWED_ORIGIN: 'http://localhost:5173',
        JWT_SECRET: 'story-2-5-e2e-secret',
        SMTP_HOST: '127.0.0.1',
        SMTP_PORT: '9',
        SMTP_USER: 'e2e-smtp-user@example.com',
        SMTP_PASS: 'e2e-smtp-pass',
        NOTIFY_EMAIL: 'notify@example.com',
      },
    })
    serverProcess.stdout.on('data', chunk => {
      serverOutput += chunk.toString()
    })
    serverProcess.stderr.on('data', chunk => {
      serverOutput += chunk.toString()
    })

    await expect
      .poll(
        async () => {
          if (serverProcess?.exitCode !== null) {
            throw new Error(`Backend exited before readiness:\n${serverOutput}`)
          }

          try {
            const response = await fetch(`http://127.0.0.1:${port}/api/health`)
            return response.ok
          } catch {
            return false
          }
        },
        { timeout: 15_000 }
      )
      .toBe(true)

    api = await request.newContext({ baseURL: `http://127.0.0.1:${port}` })
  })

  test.afterAll(async () => {
    await api?.dispose()
    if (serverProcess && serverProcess.exitCode === null) {
      serverProcess.kill('SIGTERM')
      await new Promise<void>(resolve => {
        serverProcess?.once('exit', () => resolve())
      })
    }
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true })
  })

  test('keeps demo and contact responses successful when SMTP delivery is unavailable', async () => {
    const unique = `${Date.now()}-${test.info().workerIndex}`
    const demoPayload = {
      name: 'Jane Smith',
      email: `jane.demo.${unique}@example.com`,
      company: 'Example Travel',
      phone: '+1 305 555 0100',
      role: 'Owner',
      gds: 'Sabre',
      message: 'We need help reconciling commissions.',
      locale: 'en',
    }
    const contactPayload = {
      name: 'Jane Smith',
      email: `jane.contact.${unique}@example.com`,
      subject: 'support',
      message: 'We need analytics help for agency revenue reporting.',
      locale: 'pt-BR',
    }

    expect(api).toBeDefined()

    const demoResponse = await api!.post('/api/demo', { data: demoPayload })
    expect(demoResponse.status()).toBe(201)
    await expect(demoResponse.json()).resolves.toEqual({
      success: true,
      message: 'Demo request received',
    })

    const duplicateDemoResponse = await api!.post('/api/demo', { data: demoPayload })
    expect(duplicateDemoResponse.status()).toBe(200)
    await expect(duplicateDemoResponse.json()).resolves.toEqual({
      success: true,
      message: 'Demo request received',
    })

    const contactResponse = await api!.post('/api/contact', { data: contactPayload })
    expect(contactResponse.status()).toBe(201)
    await expect(contactResponse.json()).resolves.toEqual({
      success: true,
      message: 'Contact message received',
    })

    const duplicateContactResponse = await api!.post('/api/contact', { data: contactPayload })
    expect(duplicateContactResponse.status()).toBe(200)
    await expect(duplicateContactResponse.json()).resolves.toEqual({
      success: true,
      message: 'Contact message received',
    })
  })
})
