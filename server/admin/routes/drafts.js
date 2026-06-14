import { Router } from 'express'
import { getDb } from '../db.js'
import fs from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', '..', '..', 'data')
const DRAFTS_DIR = join(DATA_DIR, 'drafts')

const router = Router()
router.get('/:projectId', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)
  if (!project) return res.status(404).redirect('/admin/projects')
  const drafts = db.prepare(SELECT * FROM drafts WHERE project_id = ? ORDER BY created_at DESC).all(req.params.projectId)
  res.render('drafts', { user: req.user, project, drafts })
})

router.get('/:projectId/new', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)
  res.render('draft-editor', { user: req.user, project, draft: null })
})

router.get('/:projectId/:id', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)
  const draft = db.prepare('SELECT * FROM drafts WHERE id = ? AND project_id = ?').get(req.params.id, req.params.projectId)
  if (!draft) return res.status(404).redirect('/admin/projects')
  res.render('draft-editor', { user: req.user, project, draft })
})

const api = Router()
api.get('/:projectId', (req, res) => {
  const db = getDb()
  const status = req.query.status
  const q = status ? SELECT * FROM drafts WHERE project_id = ? AND status = ? ORDER BY created_at DESC : SELECT * FROM drafts WHERE project_id = ? ORDER BY created_at DESC
  const params = status ? [req.params.projectId, status] : [req.params.projectId]
  res.json(db.prepare(q).all(...params))
})

api.post('/', (req, res) => {
  const { project_id, slug, title, body, category, tags, platform, status } = req.body || {}
  if (!project_id || !slug || !title) return res.status(400).json({ error: 'project_id, slug, title required' })
  const db = getDb()
  try {
    const info = db.prepare('INSERT INTO drafts (project_id, slug, title, body, category, tags, platform, status, char_count) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(project_id, slug, title, body || '', category || '', tags || '', platform || 'blog', status || 'draft', (body || '').length)
    res.json({ ok: true, id: info.lastInsertRowid })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

api.put('/:id', (req, res) => {
  const { title, body, category, tags, status } = req.body || {}
  const db = getDb()
  db.prepare('UPDATE drafts SET title=coalesce(?,title), body=coalesce(?,body), category=coalesce(?,category), tags=coalesce(?,tags), status=coalesce(?,status) WHERE id=?')
    .run(title, body, category, tags, status, req.params.id)
  res.json({ ok: true })
})

api.post('/:id/publish', async (req, res) => {
  const db = getDb()
  const draft = db.prepare('SELECT d.*, p.github_repo, p.github_branch FROM drafts d JOIN projects p ON d.project_id = p.id WHERE d.id = ?').get(req.params.id)
  if (!draft) return res.status(404).json({ error: 'Draft not found' })
  try {
    const pipeline = await import('../../agent-pipeline.js')
    const article = { slug: draft.slug, title: draft.title, description: draft.category || '', date: new Date().toISOString().split('T')[0], body: draft.body }
    const result = await pipeline.publisherAgent(article)
    db.prepare('UPDATE drafts SET status = ?, published_at = datetime("now") WHERE id = ?').run('published', req.params.id)
    res.json({ ok: true, url: result.url })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

api.post('/:id/delete', async (req, res) => {
  const db = getDb()
  const draft = db.prepare('SELECT slug FROM drafts WHERE id = ?').get(req.params.id)
  if (!draft) return res.status(404).json({ error: 'Draft not found' })
  try {
    const pipeline = await import('../../agent-pipeline.js')
    const existing = await pipeline.ghFetch(data/drafts/.json).catch(() => null)
    if (existing?.sha) {
      await fetch(https://api.github.com/repos/vpcea2s1r/ortopednn-auto/contents/data/drafts/.json, {
        method: 'DELETE',
        headers: { Authorization: 	oken  },
        body: JSON.stringify({ message: draft:  [deleted], sha: existing.sha, branch: 'master' })
      })
    }
  } catch {}
  db.prepare('DELETE FROM drafts WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export { router, api }