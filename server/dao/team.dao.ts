import type { Database } from 'better-sqlite3'
import defaultDb from '../db'

export interface TeamMemberInput {
  name: string
  role_en: string
  role_pt: string
  role_es: string
  bio_en: string
  bio_pt: string
  bio_es: string
  linkedin?: string | null
  photo_url?: string | null
  order_index?: number
  active?: 0 | 1
}

export interface TeamMemberRow {
  id: number
  name: string
  role_en: string
  role_pt: string
  role_es: string
  bio_en: string
  bio_pt: string
  bio_es: string
  linkedin: string | null
  photo_url: string | null
  order_index: number
  active: 0 | 1
}

export interface TeamDao {
  list(opts?: { activeOnly?: boolean }): TeamMemberRow[]
  getById(id: number): TeamMemberRow | undefined
  create(input: TeamMemberInput): TeamMemberRow
  update(id: number, patch: Partial<TeamMemberInput>): TeamMemberRow | undefined
  setActive(id: number, active: 0 | 1): TeamMemberRow | undefined
}

const ALLOWED_PATCH_KEYS: ReadonlyArray<keyof TeamMemberInput> = [
  'name',
  'role_en',
  'role_pt',
  'role_es',
  'bio_en',
  'bio_pt',
  'bio_es',
  'linkedin',
  'photo_url',
  'order_index',
  'active',
]

export function createTeamDao(database: Database = defaultDb): TeamDao {
  const insertStmt = database.prepare(`
    INSERT INTO team_members
      (name, role_en, role_pt, role_es, bio_en, bio_pt, bio_es, linkedin, photo_url, order_index, active)
    VALUES
      (@name, @role_en, @role_pt, @role_es, @bio_en, @bio_pt, @bio_es, @linkedin, @photo_url, @order_index, @active)
  `)
  const getByIdStmt = database.prepare(`SELECT * FROM team_members WHERE id = ?`)
  const setActiveStmt = database.prepare(`UPDATE team_members SET active = @active WHERE id = @id`)
  const listAllStmt = database.prepare(`SELECT * FROM team_members ORDER BY order_index ASC, id ASC`)
  const listActiveStmt = database.prepare(
    `SELECT * FROM team_members WHERE active = 1 ORDER BY order_index ASC, id ASC`
  )

  return {
    list(opts = {}) {
      return (opts.activeOnly ? listActiveStmt : listAllStmt).all() as TeamMemberRow[]
    },
    getById(id) {
      return getByIdStmt.get(id) as TeamMemberRow | undefined
    },
    create(input) {
      const result = insertStmt.run({
        name: input.name,
        role_en: input.role_en,
        role_pt: input.role_pt,
        role_es: input.role_es,
        bio_en: input.bio_en,
        bio_pt: input.bio_pt,
        bio_es: input.bio_es,
        linkedin: input.linkedin ?? null,
        photo_url: input.photo_url ?? null,
        order_index: input.order_index ?? 0,
        active: input.active ?? 1,
      })
      return getByIdStmt.get(Number(result.lastInsertRowid)) as TeamMemberRow
    },
    update(id, patch) {
      const keys = ALLOWED_PATCH_KEYS.filter((k) => k in patch)
      if (keys.length === 0) return getByIdStmt.get(id) as TeamMemberRow | undefined
      const assignments = keys.map((k) => `${k} = @${k}`).join(', ')
      const params: Record<string, unknown> = { id }
      for (const k of keys) params[k] = (patch as Record<string, unknown>)[k]
      database.prepare(`UPDATE team_members SET ${assignments} WHERE id = @id`).run(params)
      return getByIdStmt.get(id) as TeamMemberRow | undefined
    },
    setActive(id, active) {
      setActiveStmt.run({ id, active })
      return getByIdStmt.get(id) as TeamMemberRow | undefined
    },
  }
}

export const teamDao = createTeamDao()
