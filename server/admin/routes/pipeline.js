import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()
router.get('/:projectId', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)
  if (!project) return res.status(404).redirect('/admin/projects')
  const topics = db.prepare(`SELECT * FROM topics WHERE project_id = ? ORDER BY created_at DESC`).all(req.params.projectId)
  const state = {}
  try {
    const pipeline = await import('../../agent-pipeline.js')
    state.done = await pipeline.listState().catch(() => ({}))
  } catch {}
  res.render('pipeline', { user: req.user, project, topics, state })
})

const api = Router()
api.get('/topics/:projectId', (req, res) => {
  const db = getDb()
  res.json(db.prepare(`SELECT * FROM topics WHERE project_id = ? ORDER BY created_at DESC`).all(req.params.projectId))
})

api.post('/topics', (req, res) => {
  const { project_id, topic } = req.body || {}
  if (!project_id || !topic) return res.status(400).json({ error: 'project_id and topic required' })
  const db = getDb()
  try {
    db.prepare('INSERT INTO topics (project_id, topic) VALUES (?, ?)').run(project_id, topic)
    res.json({ ok: true })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

api.delete('/topics/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

api.post('/run/:projectId', async (req, res) => {
  const db = getDb()
  const topic = db.prepare('SELECT * FROM topics WHERE project_id = ? AND status = ? ORDER BY created_at LIMIT 1').get(req.params.projectId, 'pending')
  if (!topic) return res.status(400).json({ error: 'No pending topics' })
  try {
    db.prepare('UPDATE topics SET status = ? WHERE id = ?').run('processing', topic.id)
    const pipeline = await import('../../agent-pipeline.js')
    const result = await pipeline.runPipelineManual(topic.topic)
    db.prepare('UPDATE topics SET status = ?, processed_at = datetime("now") WHERE id = ?').run(result.ok ? 'done' : 'failed', topic.id)
    res.json({ ok: true, result })
  } catch (e) {
    db.prepare('UPDATE topics SET status = ? WHERE id = ?').run('failed', topic.id)
    res.status(500).json({ error: e.message })
  }
})

api.get('/state', async (req, res) => {
  try {
    const pipeline = await import('../../agent-pipeline.js')
    res.json(await pipeline.listState().catch(() => ({})))
  } catch { res.json({}) }
})

export { router, api }