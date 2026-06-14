import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getDb } from './db.js'

const SECRET = process.env.ADMIN_JWT_SECRET || crypto.randomBytes(32).toString('hex')
const EXPIRES = '7d'

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: EXPIRES })
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET) } catch { return null }
}

export function checkAuth(req, res, next) {
  const token = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).redirect('/admin/login')
  const payload = verifyToken(token)
  if (!payload) return res.status(401).redirect('/admin/login')
  req.user = payload
  next()
}

export function loginHandler(req, res) {
  const { username, password } = req.body || {}
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || user.password_hash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = signToken(user)
  res.cookie('admin_token', token, { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })
  res.json({ ok: true, token })
}