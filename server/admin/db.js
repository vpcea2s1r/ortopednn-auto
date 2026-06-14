import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import crypto from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', '..', 'data')

let db

export function getDb() {
  if (db) return db
  fs.mkdirSync(join(DATA_DIR, 'admin'), { recursive: true })
  db = new Database(join(DATA_DIR, 'admin', 'content_factory.db'))
  db.pragma('journal_mode = WAL')
  return db
}

export function migrate() {
  const db = getDb()
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domain TEXT UNIQUE NOT NULL,
      github_repo TEXT,
      github_branch TEXT DEFAULT 'master',
      niche TEXT,
      telegram_bot_token TEXT,
      telegram_chat_id TEXT,
      dzen_channel_id TEXT,
      vk_group_id TEXT,
      ok_group_id TEXT,
      gsc_property TEXT,
      yandex_host TEXT,
      metrika_counter TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      active INTEGER DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      category TEXT,
      tags TEXT,
      platform TEXT DEFAULT 'blog',
      status TEXT DEFAULT 'draft',
      char_count INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      published_at TEXT,
      UNIQUE(project_id, slug)
    );
    CREATE TABLE IF NOT EXISTS social_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      draft_id INTEGER REFERENCES drafts(id),
      platform TEXT NOT NULL,
      post_id TEXT,
      status TEXT DEFAULT 'pending',
      posted_at TEXT,
      error TEXT,
      raw_response TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      topic TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id),
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity TEXT,
      entity_id INTEGER,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

export function seedAdmin() {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('nikitin')
  if (!existing) {
    const hash = crypto.createHash('sha256').update('4338365Q!').digest('hex')
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('nikitin', hash, 'admin')
    console.log('[admin] Default user created: nikitin / 4338365Q!')
  }
}