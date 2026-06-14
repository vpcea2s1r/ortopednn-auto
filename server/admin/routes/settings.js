import { Router } from 'express'
import { getDb, seedAdmin } from '../db.js'
import { hashPassword } from '../auth.js'

const router = Router()
router.get('/', (req, res) => {
  const db = getDb()
  const config = {
    port: process.env.ADMIN_PORT || 3001,
    dataDir: process.env.DATA_DIR || './data',
    jwtSecret: process.env.ADMIN_JWT_SECRET ? '****' : '(auto-generated)',
    ghToken: process.env.GH_TOKEN ? '****' : '(not set)',
    vkToken: process.env.VK_ACCESS_TOKEN ? '****' : '(not set)',
    okToken: process.env.OK_ACCESS_TOKEN ? '****' : '(not set)',
    okAppKey: process.env.OK_APPLICATION_KEY ? '****' : '(not set)'
  }
  const users = db.prepare('SELECT id, username, role, created_at FROM users').all()
  res.render('settings', { user: req.user, config, users })
})

const api = Router()
api.post('/password', (req, res) => {
  const { current, password } = req.body || {}
  if (!current || !password) return res.status(400).json({ error: 'Current and new password required' })
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user || user.password_hash !== hashPassword(current)) return res.status(401).json({ error: 'Current password is wrong' })
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), req.user.id)
  res.json({ ok: true })
})

api.get('/env', (req, res) => {
  res.json({
    gsc_client_id: process.env.GSC_CLIENT_ID ? '****' : '(not set)',
    gsc_refresh_token: process.env.GSC_REFRESH_TOKEN ? '****' : '(not set)',
    yandex_oauth_token: process.env.YANDEX_OAUTH_TOKEN ? '****' : '(not set)',
    gh_token: process.env.GH_TOKEN ? '****' : '(not set)'
  })
})

export { router, api }