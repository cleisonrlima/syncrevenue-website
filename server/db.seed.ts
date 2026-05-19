import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { adminDao as defaultAdminDao, type AdminDao, type AdminUserRow } from './dao/admin.dao'
import {
  teamDao as defaultTeamDao,
  type TeamDao,
  type TeamMemberInput,
} from './dao/team.dao'

export const SEED_SALT_ROUNDS = 12

export interface SeedAdminOptions {
  email?: string
  password?: string
  dao?: AdminDao
  saltRounds?: number
}

export interface SeedAdminResult {
  user: AdminUserRow
  action: 'created' | 'updated'
}

export function seedAdminUser(options: SeedAdminOptions = {}): SeedAdminResult {
  const email = (options.email ?? process.env.ADMIN_EMAIL ?? '').trim()
  const password = options.password ?? process.env.ADMIN_PASSWORD ?? ''

  if (!email) {
    throw new Error('ADMIN_EMAIL is required to seed admin user')
  }
  if (!password) {
    throw new Error('ADMIN_PASSWORD is required to seed admin user')
  }

  const dao = options.dao ?? defaultAdminDao
  const existing = dao.findByEmail(email)
  const password_hash = bcrypt.hashSync(password, options.saltRounds ?? SEED_SALT_ROUNDS)
  const user = dao.upsert({ email, password_hash })
  return { user, action: existing ? 'updated' : 'created' }
}

// Default team members mirror the EN/PT/ES content historically rendered from
// src/i18n/locales/*/translation.json#team.members. Embedded here as constants
// to keep the server seed independent of client i18n assets.
export const DEFAULT_TEAM_MEMBERS: ReadonlyArray<TeamMemberInput> = [
  {
    name: 'Maria Silva',
    role_en: 'Airline Distribution & Commission Strategy Lead',
    role_pt: 'Líder de Distribuição Aérea e Estratégia de Comissões',
    role_es: 'Líder de Distribución Aérea y Estrategia de Comisiones',
    bio_en:
      'Guides travel agencies through GDS operations, BSP/ARC reconciliation, debit memo workflows, and commission recovery strategy across the Americas. Twenty years inside Sabre, Amadeus, and Galileo workflows informs every retainer engagement.',
    bio_pt:
      'Orienta agências de viagens em operações de GDS, conciliação BSP/ARC, fluxos de débito (debit memos) e estratégia de recuperação de comissões nas Américas. Vinte anos dentro dos fluxos da Sabre, Amadeus e Galileo informam cada engajamento.',
    bio_es:
      'Guía a agencias de viajes en operaciones GDS, conciliación BSP/ARC, flujos de débitos (debit memos) y estrategia de recuperación de comisiones en las Américas. Veinte años dentro de los flujos de Sabre, Amadeus y Galileo informan cada engagement.',
    experience_en: '20+ years in airline distribution',
    experience_pt: '20+ anos em distribuição aérea',
    experience_es: '20+ años en distribución aérea',
    photo_url: '/team/maria-silva.webp',
    linkedin: 'https://www.linkedin.com/in/maria-silva-syncsirius/',
    order_index: 0,
    active: 1,
  },
  {
    name: 'Lucas Oliveira',
    role_en: 'Travel Data Integration & Automation Lead',
    role_pt: 'Líder de Integração de Dados e Automação de Viagens',
    role_es: 'Líder de Integración de Datos y Automatización de Viajes',
    bio_en:
      'Designs the automation layer behind SyncRevenue, connecting booking data, commission rules, and revenue optimization systems into reliable operating workflows. Background spans BSP settlement pipelines, mid/back-office integrations, and travel data engineering.',
    bio_pt:
      'Projeta a camada de automação por trás do SyncRevenue, conectando dados de reservas, regras de comissão e sistemas de otimização de receita em fluxos operacionais confiáveis. Experiência em pipelines de liquidação BSP, integrações mid/back-office e engenharia de dados de viagens.',
    bio_es:
      'Diseña la capa de automatización detrás de SyncRevenue, conectando datos de reservas, reglas de comisión y sistemas de optimización de ingresos en flujos operativos confiables. Experiencia en pipelines de liquidación BSP, integraciones mid/back-office e ingeniería de datos de viajes.',
    experience_en: '15+ years in travel data automation',
    experience_pt: '15+ anos em automação de dados de viagens',
    experience_es: '15+ años en automatización de datos de viajes',
    photo_url: '/team/lucas-oliveira.webp',
    linkedin: 'https://www.linkedin.com/in/lucas-oliveira-syncsirius/',
    order_index: 1,
    active: 1,
  },
]

export interface SeedTeamMembersOptions {
  dao?: TeamDao
}

export interface SeedTeamMembersResult {
  inserted: number
  skipped: number
}

export function seedTeamMembers(options: SeedTeamMembersOptions = {}): SeedTeamMembersResult {
  const dao = options.dao ?? defaultTeamDao
  const existing = dao.list()
  if (existing.length > 0) {
    return { inserted: 0, skipped: existing.length }
  }
  for (const input of DEFAULT_TEAM_MEMBERS) {
    dao.create(input)
  }
  return { inserted: DEFAULT_TEAM_MEMBERS.length, skipped: 0 }
}

function runFromCli(): void {
  try {
    const adminResult = seedAdminUser()
    console.log(`admin user ${adminResult.action}: ${adminResult.user.email} (id=${adminResult.user.id})`)
    const teamResult = seedTeamMembers()
    if (teamResult.inserted > 0) {
      console.log(`team members seeded: ${teamResult.inserted}`)
    } else {
      console.log(`team members already seeded (n=${teamResult.skipped})`)
    }
    process.exit(0)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`seed failed: ${message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  runFromCli()
}
