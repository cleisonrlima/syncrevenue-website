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

export type ContactPayload = {
  name: string
  email: string
  subject: string
  message: string
  locale: 'en' | 'pt-BR' | 'es'
}

export type AuditPayload = {
  name: string
  email: string
  company: string
  role: string
  gds: string
  notes: string
  locale: 'en' | 'pt-BR' | 'es'
}

export type DemoSuccessResponse = {
  success: true
  message: string
}

export type ContactSuccessResponse = {
  success: true
  message: string
}

export type AuditSuccessResponse = {
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

export class ContactApiError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'ContactApiError'
    this.status = status
    this.field = field
  }
}

export class AuditApiError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'AuditApiError'
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

export async function postContact(payload: ContactPayload): Promise<ContactSuccessResponse> {
  let response: Response
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new ContactApiError(0, 'Connection error')
  }

  const body = (await response.json().catch(() => ({}))) as Partial<ContactSuccessResponse> &
    Partial<ApiErrorResponse>

  if (!response.ok || body.success !== true) {
    throw new ContactApiError(
      response.status,
      body.message || (response.status === 429 ? 'Too many requests' : 'Contact request failed'),
      body.field
    )
  }

  return {
    success: true,
    message: body.message || 'Contact message received',
  }
}

export async function postAudit(payload: AuditPayload): Promise<AuditSuccessResponse> {
  let response: Response
  try {
    response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new AuditApiError(0, 'Connection error')
  }

  const body = (await response.json().catch(() => ({}))) as Partial<AuditSuccessResponse> &
    Partial<ApiErrorResponse>

  if (!response.ok || body.success !== true) {
    throw new AuditApiError(
      response.status,
      body.message || (response.status === 429 ? 'Too many requests' : 'Audit request failed'),
      body.field
    )
  }

  return {
    success: true,
    message: body.message || 'Audit request received',
  }
}
