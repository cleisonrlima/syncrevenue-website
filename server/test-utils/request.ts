import type { Express } from 'express'
import { IncomingMessage, ServerResponse } from 'http'
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http'
import { Socket } from 'net'

type RequestBody = string | Record<string, unknown>

export interface AppRequestOptions {
  method?: string
  path: string
  headers?: Record<string, string>
  body?: RequestBody
  remoteAddress?: string
}

export interface AppResponse {
  status: number
  headers: OutgoingHttpHeaders
  body: string
  json<T = unknown>(): T
}

function normalizeHeaders(
  headers: Record<string, string> | undefined,
  payload: string | undefined
): IncomingHttpHeaders {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers ?? {})) {
    normalized[key.toLowerCase()] = value
  }
  if (payload !== undefined) {
    normalized['content-length'] = Buffer.byteLength(payload).toString()
    if (!normalized['content-type']) {
      normalized['content-type'] = 'application/json'
    }
  }
  return normalized
}

function serializeBody(body: RequestBody | undefined): string | undefined {
  if (body === undefined) return undefined
  return typeof body === 'string' ? body : JSON.stringify(body)
}

export function request(app: Express, options: AppRequestOptions): Promise<AppResponse> {
  const payload = serializeBody(options.body)
  const socket = new Socket()
  Object.defineProperty(socket, 'remoteAddress', {
    value: options.remoteAddress ?? '127.0.0.1',
    configurable: true,
  })

  const req = new IncomingMessage(socket)
  req.method = options.method ?? 'GET'
  req.url = options.path
  req.headers = normalizeHeaders(options.headers, payload)
  if (payload !== undefined) {
    req.push(payload)
  }
  req.push(null)

  const res = new ServerResponse(req)
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      const body = Buffer.concat(chunks).toString('utf8')
      resolve({
        status: res.statusCode,
        headers: res.getHeaders(),
        body,
        json<T = unknown>() {
          return JSON.parse(body) as T
        },
      })
    }

    req.on('error', reject)
    res.on('error', reject)

    res.write = ((chunk: unknown, encodingOrCallback?: BufferEncoding | (() => void), callback?: () => void) => {
      if (chunk !== undefined) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      }
      const cb = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback
      cb?.()
      return true
    }) as typeof res.write

    res.end = ((chunk?: unknown, encodingOrCallback?: BufferEncoding | (() => void), callback?: () => void) => {
      if (chunk !== undefined) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
      }
      const cb = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback
      cb?.()
      res.emit('finish')
      finish()
      return res
    }) as typeof res.end

    try {
      ;(app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res)
    } catch (error) {
      reject(error)
    }
  })
}
