export type DemoPayload = {
  name: string
  email: string
  company: string
  phone: string
  role: string
  gds: string
  message: string
  locale: 'en' | 'pt-BR' | 'es'
}

export type DemoSuccessResponse = {
  success: true
  message: string
}

type ApiErrorResponse = {
  success: false
  message?: string
  field?: string
}

export class DemoApiError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'DemoApiError'
    this.status = status
    this.field = field
  }
}

export async function postDemo(payload: DemoPayload): Promise<DemoSuccessResponse> {
  let response: Response
  try {
    response = await fetch('/api/demo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new DemoApiError(0, 'Connection error')
  }

  const body = (await response.json().catch(() => ({}))) as Partial<DemoSuccessResponse> &
    Partial<ApiErrorResponse>

  if (!response.ok || body.success !== true) {
    throw new DemoApiError(
      response.status,
      body.message || (response.status === 429 ? 'Too many requests' : 'Demo request failed'),
      body.field
    )
  }

  return {
    success: true,
    message: body.message || 'Demo request received',
  }
}
