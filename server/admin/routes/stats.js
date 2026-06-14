import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/dashboard/:projectId', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)
  if (!project) return res.status(404).json({ error: 'Project not found' })

  const snapshots = db.prepare(`SELECT * FROM stat_snapshots WHERE project_id = ? ORDER BY date DESC LIMIT 60`).all(req.params.projectId)
  const keywords = db.prepare(`SELECT * FROM keyword_positions WHERE project_id = ? ORDER BY date DESC, position ASC LIMIT 50`).all(req.params.projectId)
  const cwv = db.prepare(`SELECT * FROM cwv_snapshots WHERE project_id = ? ORDER BY date DESC LIMIT 10`).all(req.params.projectId)
  const draftCount = db.prepare(`SELECT status, count(*) as cnt FROM drafts WHERE project_id = ? GROUP BY status`).all(req.params.projectId)
  const recentDrafts = db.prepare(`SELECT id, title, status, created_at FROM drafts WHERE project_id = ? ORDER BY created_at DESC LIMIT 5`).all(req.params.projectId)

  res.render('dashboard', { user: req.user, project, snapshots, keywords, cwv, draftCount, recentDrafts })
})

const api = Router()

api.get('/:projectId', (req, res) => {
  const db = getDb()
  const snapshots = db.prepare(`SELECT * FROM stat_snapshots WHERE project_id = ? ORDER BY date DESC LIMIT 60`).all(req.params.projectId)
  const keywords = db.prepare(`SELECT * FROM keyword_positions WHERE project_id = ? ORDER BY date DESC, position ASC LIMIT 100`).all(req.params.projectId)
  const cwv = db.prepare(`SELECT * FROM cwv_snapshots WHERE project_id = ? ORDER BY date DESC LIMIT 10`).all(req.params.projectId)
  res.json({ snapshots, keywords, cwv })
})

api.get('/:projectId/trend', (req, res) => {
  const db = getDb()
  const period = req.query.period || '30'
  const snapshots = db.prepare(
    `SELECT date, source, sum(clicks) as clicks, sum(impressions) as impressions, avg(avg_position) as avg_position
    FROM stat_snapshots WHERE project_id = ? AND date >= date('now', '-' || ? || ' days')
    GROUP BY date, source ORDER BY date`).all(req.params.projectId, period)
  const cwv = db.prepare(
    `SELECT date, avg(lcp) as lcp, avg(cls) as cls, avg(inp) as inp, avg(score) as score
    FROM cwv_snapshots WHERE project_id = ? AND date >= date('now', '-' || ? || ' days')
    GROUP BY date ORDER BY date`).all(req.params.projectId, period)
  res.json({ snapshots, cwv })
})

export { router, api }