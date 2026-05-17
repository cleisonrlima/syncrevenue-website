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

export type AdminLoginPayload = {
  email: string
  password: string
}

export type AdminSessionData = {
  adminId: number
  email: string
}

export type AdminLoginSuccessResponse = {
  success: true
  data: AdminSessionData
}

export type AdminLogoutSuccessResponse = {
  success: true
}

export class AdminApiError extends Error {
  status: number
  field?: string

  constructor(status: number, message: string, field?: string) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
    this.field = field
  }
}

function parseAdminSessionData(data: unknown): AdminSessionData | null {
  if (!data || typeof data !== 'object') return null
  const candidate = data as Partial<AdminSessionData>
  if (typeof candidate.adminId !== 'number' || typeof candidate.email !== 'string') return null
  return { adminId: candidate.adminId, email: candidate.email }
}

export async function postAdminLogin(payload: AdminLoginPayload): Promise<AdminLoginSuccessResponse> {
  let response: Response
  try {
    response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new AdminApiError(0, 'Network error')
  }

  const body = (await response.json().catch(() => ({}))) as Partial<AdminLoginSuccessResponse> &
    Partial<ApiErrorResponse>

  if (!response.ok || body.success !== true) {
    throw new AdminApiError(
      response.status,
      body.message || (response.status === 401 ? 'Invalid credentials' : 'Login failed'),
      body.field
    )
  }

  const data = parseAdminSessionData(body.data)
  if (!data) {
    throw new AdminApiError(response.status, 'Invalid session response')
  }

  return { success: true, data }
}

export async function postAdminLogout(): Promise<AdminLogoutSuccessResponse> {
  let response: Response
  try {
    response = await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    throw new AdminApiError(0, 'Network error')
  }

  if (response.status === 401) {
    return { success: true }
  }

  const body = (await response.json().catch(() => ({}))) as Partial<AdminLogoutSuccessResponse> &
    Partial<ApiErrorResponse>

  if (!response.ok || body.success !== true) {
    throw new AdminApiError(response.status, body.message || 'Logout failed')
  }

  return { success: true }
}

export async function getAdminMe(): Promise<AdminSessionData | null> {
  let response: Response
  try {
    response = await fetch('/api/admin/auth/me', {
      method: 'GET',
      credentials: 'include',
    })
  } catch {
    throw new AdminApiError(0, 'Network error')
  }

  if (response.status === 401) {
    return null
  }

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean
    data?: AdminSessionData
    message?: string
  }

  const data = parseAdminSessionData(body.data)
  if (!response.ok || body.success !== true || !data) {
    throw new AdminApiError(response.status, body.message || 'Failed to load session')
  }

  return data
}

export type AdminLeadStatus = 'pending' | 'contacted' | 'qualified'
export type AdminLeadLocale = 'en' | 'pt-BR' | 'es'
export type AdminLeadGds = 'Amadeus' | 'Sabre' | 'Galileo' | 'Worldspan' | 'Other' | 'None yet'

export interface AdminLeadRow {
  id: number
  name: string
  email: string
  company: string
  phone: string | null
  role: string
  gds: AdminLeadGds
  message: string | null
  locale: AdminLeadLocale
  status: AdminLeadStatus
  created_at: string
  updated_at: string
}

const ADMIN_LEAD_STATUSES: ReadonlyArray<AdminLeadStatus> = ['pending', 'contacted', 'qualified']
const ADMIN_LEAD_LOCALES: ReadonlyArray<AdminLeadLocale> = ['en', 'pt-BR', 'es']

export function parseAdminLeadRow(value: unknown): AdminLeadRow | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (typeof candidate.id !== 'number') return null
  if (typeof candidate.email !== 'string') return null
  if (typeof candidate.name !== 'string') return null
  if (typeof candidate.company !== 'string') return null
  if (typeof candidate.role !== 'string') return null
  if (typeof candidate.created_at !== 'string') return null
  if (typeof candidate.updated_at !== 'string') return null
  if (
    typeof candidate.status !== 'string' ||
    !ADMIN_LEAD_STATUSES.includes(candidate.status as AdminLeadStatus)
  ) {
    return null
  }
  if (
    typeof candidate.locale !== 'string' ||
    !ADMIN_LEAD_LOCALES.includes(candidate.locale as AdminLeadLocale)
  ) {
    return null
  }
  return candidate as unknown as AdminLeadRow
}

export interface AdminLeadsFilter {
  locale?: AdminLeadLocale
  status?: AdminLeadStatus
}

export interface AdminLeadsRequestOptions {
  signal?: AbortSignal
}

export async function getAdminLeads(
  filter: AdminLeadsFilter = {},
  options: AdminLeadsRequestOptions = {}
): Promise<AdminLeadRow[]> {
  const params = new URLSearchParams()
  if (filter.locale) params.set('locale', filter.locale)
  if (filter.status) params.set('status', filter.status)
  const qs = params.toString() ? `?${params.toString()}` : ''

  let response: Response
  try {
    response = await fetch(`/api/admin/leads${qs}`, {
      method: 'GET',
      credentials: 'include',
      signal: options.signal,
    })
  } catch {
    throw new AdminApiError(0, 'Network error')
  }

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean
    data?: unknown
    message?: string
  }

  if (!response.ok || body.success !== true || !Array.isArray(body.data)) {
    throw new AdminApiError(response.status, body.message || 'Failed to load leads')
  }

  const rows: AdminLeadRow[] = []
  for (const item of body.data) {
    const parsed = parseAdminLeadRow(item)
    if (!parsed) {
      throw new AdminApiError(response.status, 'Invalid leads response')
    }
    rows.push(parsed)
  }
  return rows
}

export async function patchAdminLeadStatus(
  id: number,
  status: AdminLeadStatus
): Promise<AdminLeadRow> {
  let response: Response
  try {
    response = await fetch(`/api/admin/leads/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  } catch {
    throw new AdminApiError(0, 'Network error')
  }

  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean
    data?: unknown
    message?: string
    field?: string
  }

  if (!response.ok || body.success !== true) {
    throw new AdminApiError(
      response.status,
      body.message || 'Failed to update lead status',
      body.field
    )
  }

  const parsed = parseAdminLeadRow(body.data)
  if (!parsed) {
    throw new AdminApiError(response.status, 'Invalid lead update response')
  }
  return parsed
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
