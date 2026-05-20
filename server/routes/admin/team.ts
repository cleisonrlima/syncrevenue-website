import { Router } from 'express'
import { teamDao } from '../../dao/team.dao'
import {
  adminTeamCreateSchema,
  adminTeamUpdateSchema,
  adminTeamParamsSchema,
  adminTeamActiveSchema,
} from '../../schemas/admin-team.schema'

const router = Router()

router.get('/', (_req, res) => {
  const rows = teamDao.list()
  res.json({ success: true, data: rows })
})

router.post('/', (req, res) => {
  const parsed = adminTeamCreateSchema.safeParse(req.body ?? {})
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue && issue.path.length > 0 ? String(issue.path[0]) : undefined
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      ...(field ? { field } : {}),
    })
    return
  }
  const row = teamDao.create(parsed.data)
  res.status(201).json({ success: true, data: row })
})

router.put('/:id', (req, res) => {
  const paramsParsed = adminTeamParamsSchema.safeParse({ id: req.params.id })
  if (!paramsParsed.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid team member id',
      field: 'id',
    })
    return
  }

  const bodyParsed = adminTeamUpdateSchema.safeParse(req.body ?? {})
  if (!bodyParsed.success) {
    const issue = bodyParsed.error.issues[0]
    const field = issue && issue.path.length > 0 ? String(issue.path[0]) : undefined
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      ...(field ? { field } : {}),
    })
    return
  }

  const updated = teamDao.update(paramsParsed.data.id, bodyParsed.data)
  if (!updated) {
    res.status(404).json({ success: false, message: 'Team member not found' })
    return
  }

  res.json({ success: true, data: updated })
})

router.patch('/:id/active', (req, res) => {
  const paramsParsed = adminTeamParamsSchema.safeParse({ id: req.params.id })
  if (!paramsParsed.success) {
    res.status(400).json({
      success: false,
      message: 'Invalid team member id',
      field: 'id',
    })
    return
  }

  const bodyParsed = adminTeamActiveSchema.safeParse(req.body ?? {})
  if (!bodyParsed.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      field: 'active',
    })
    return
  }

  const updated = teamDao.setActive(paramsParsed.data.id, bodyParsed.data.active)
  if (!updated) {
    res.status(404).json({ success: false, message: 'Team member not found' })
    return
  }

  res.json({ success: true, data: updated })
})

export default router
