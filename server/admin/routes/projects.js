import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req, res) => {
  const db = getDb()
  const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  res.render('projects', { user: req.user, projects })
})

router.get('/new', (req, res) => {
  res.render('project-form', { user: req.user, project: null })
})

router.get('/:id/edit', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!project) return res.status(404).redirect('/admin/projects')
  res.render('project-form', { user: req.user, project })
})

router.get('/:id', (req, res) => {
  const db = getDb()
  const stats = db.prepare('SELECT * FROM stat_snapshots WHERE ...').all()
  res.render('project', { user: req.user, project })
})

const api = Router()
api.get('/', (req, res) => {
  const db = getDb()
  res.json(db.prepare('SELECT id, name, domain, niche, created_at, active FROM projects ORDER BY created_at DESC').all())
})

api.post('/', (req, res) => {
  const { name, domain, github_repo, niche } = req.body || {}
  if (!name || !domain) return res.status(400).json({ error: 'Name and domain required' })
  const db = getDb()
  try {
    const info = db.prepare('INSERT INTO projects (name, domain, github_repo, niche) VALUES (?, ?, ?, ?)').run(name, domain, github_repo || '', niche || '')
    res.json({ ok: true, id: info.lastInsertRowid })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

api.put('/:id', (req, res) => {
  const { name, domain, github_repo, niche, github_branch, telegram_bot_token, telegram_chat_id, vk_group_id, ok_group_id, gsc_property, yandex_host, metrika_counter, active } = req.body || {}
  const db = getDb()
  try {
    db.prepare(UPDATE projects SET name=coalesce(?,name), domain=coalesce(?,domain), github_repo=coalesce(?,github_repo), niche=coalesce(?,niche), github_branch=coalesce(?,github_branch), telegram_bot_token=coalesce(?,telegram_bot_token), telegram_chat_id=coalesce(?,telegram_chat_id), vk_group_id=coalesce(?,vk_group_id), ok_group_id=coalesce(?,ok_group_id), gsc_property=coalesce(?,gsc_property), yandex_host=coalesce(?,yandex_host), metrika_counter=coalesce(?,metrika_counter), active=coalesce(?,active) WHERE id=?)
      .run(name, domain, github_repo, niche, github_branch, telegram_bot_token, telegram_chat_id, vk_group_id, ok_group_id, gsc_property, yandex_host, metrika_counter, active, req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

api.delete('/:id', (req, res) => {
  const db = getDb()
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  db.prepare('DELETE FROM drafts WHERE project_id = ?').run(req.params.id)
  db.prepare('DELETE FROM topics WHERE project_id = ?').run(req.params.id)
  db.prepare('DELETE FROM social_posts WHERE project_id = ?').run(req.params.id)
  db.prepare('DELETE FROM audit_log WHERE project_id = ?').run(req.params.id)
  res.json({ ok: true })
})

export { router, api }