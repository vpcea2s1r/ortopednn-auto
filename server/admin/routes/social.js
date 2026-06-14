import { Router } from 'express'
import { getDb } from '../db.js'

const router = Router()
router.get('/:projectId', (req, res) => {
  const db = getDb()
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId)
  if (!project) return res.status(404).redirect('/admin/projects')
  const posts = db.prepare(SELECT * FROM social_posts WHERE project_id = ? ORDER BY created_at DESC LIMIT 50).all(req.params.projectId)
  const drafts = db.prepare(SELECT id, title, slug FROM drafts WHERE project_id = ? AND status = 'draft' ORDER BY created_at DESC LIMIT 20).all(req.params.projectId)
  res.render('social', { user: req.user, project, posts, drafts })
})

const api = Router()
api.get('/posts/:projectId', (req, res) => {
  const db = getDb()
  res.json(db.prepare(SELECT * FROM social_posts WHERE project_id = ? ORDER BY created_at DESC LIMIT 50).all(req.params.projectId))
})

api.post('/post', async (req, res) => {
  const { project_id, draft_id, platforms } = req.body || {}
  if (!project_id || !draft_id || !platforms?.length) return res.status(400).json({ error: 'project_id, draft_id, platforms required' })
  const db = getDb()
  const draft = db.prepare('SELECT * FROM drafts WHERE id = ? AND project_id = ?').get(draft_id, project_id)
  if (!draft) return res.status(404).json({ error: 'Draft not found' })

  const results = []
  for (const platform of platforms) {
    try {
      let postId = null
      const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id)
      if (platform === 'telegram' && project.telegram_bot_token && project.telegram_chat_id) {
        const botToken = project.telegram_bot_token
        const chatId = project.telegram_chat_id
        const text = **\n\n...
        const resp = await fetch(https://api.telegram.org/bot/sendMessage, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false })
        })
        const data = await resp.json()
        postId = data.ok ? String(data.result.message_id) : null
      }
      if (platform === 'dzen') {
        postId = 'rss-import'
      }
      if (platform === 'vk' && project.vk_group_id) {
        const token = process.env.VK_ACCESS_TOKEN
        if (token) {
          const msg = ${draft.title}\n\n...
          const resp = await fetch(https://api.vk.com/method/wall.post?access_token=&v=5.131, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ owner_id: -Math.abs(Number(project.vk_group_id)), message: msg })
          })
          const data = await resp.json()
          postId = data.response?.post_id ? String(data.response.post_id) : null
        }
      }
      if (platform === 'ok' && project.ok_group_id) {
        const token = process.env.OK_ACCESS_TOKEN
        const appKey = process.env.OK_APPLICATION_KEY
        postId = 'ok-queued'
      }
      db.prepare('INSERT INTO social_posts (project_id, draft_id, platform, post_id, status, raw_response) VALUES (?,?,?,?,?,?)')
        .run(project_id, draft_id, platform, postId || '', postId ? 'posted' : 'failed', JSON.stringify(req.body))
      results.push({ platform, postId: postId || null, status: postId ? 'posted' : 'failed' })
    } catch (e) {
      db.prepare('INSERT INTO social_posts (project_id, draft_id, platform, status, error) VALUES (?,?,?,?,?)')
        .run(project_id, draft_id, platform, 'failed', e.message)
      results.push({ platform, error: e.message, status: 'failed' })
    }
  }
  res.json({ ok: true, results })
})

export { router, api }