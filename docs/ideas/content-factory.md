# Фабрика контента — Multi-Site Admin Panel + Social Distribution

## Problem Statement

"Как управлять контентом, статистикой и продвижением нескольких сайтов из одного удобного веб-интерфейса?"

## Current State

- 1 сайт (ortopednn.ru) на Astro SSG → GitHub Pages
- Telegram-бот для мониторинга и генерации контента
- SQLite для статистики (GSC, Yandex, Metrika)
- AI-пайплайн для генерации статей
- Ручное управление через Telegram команды
- Нет веб-интерфейса
- Нет мульти-сайт поддержки
- Нет автоматической публикации в соцсети

## Recommended Direction

Построить **"Фабрику контента"** — веб-панель управления на Express + HTMX + SQLite с:

1. **Мульти-сайт**: каждый сайт = отдельный проект (своя тематика, репозиторий, API-ключи)
2. **Контент-менеджер**: черновики, редактирование, публикация, AI-генерация
3. **Аналитика**: GSC + Yandex + Metrika в одном дашборде
4. **SEO**: позиции ключевых слов, индексация, дубли
5. **Соцсети**: автоматическая публикация в Telegram + Dzen + VK + OK

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Nginx (reverse proxy)            │
│              admin.ortopednn.ru:443               │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│         Express app (port 3001)                  │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ Auth     │ Projects │ Content  │ Analytics│  │
│  │ (JWT)    │ (CRUD)   │ (Drafts) │ (Charts) │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │ SEO      │ Social   │ Pipeline │ Settings │  │
│  │ (Keywords│ (TG+DZEN │ (AI Gen) │ (API Keys│  │
│  │ +Index)  │ +VK+OK)  │          │          │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│         SQLite: content_factory.db               │
│  projects | drafts | stats | keywords | social   │
└─────────────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│         GitHub API (content storage)             │
│    ortopednn-auto | stomatolog | future repos    │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Backend | Express.js (ES modules) | Already exists in server/app.js |
| Frontend | HTMX + Tailwind CSS | No SPA build, fast development |
| Database | SQLite (better-sqlite3) | Already used for stats |
| Auth | JWT (jsonwebtoken) | Simple, stateless |
| Charts | Chart.js (CDN) | No build step, lightweight |
| AI | DeepSeek via opencode.ai | Already integrated |
| Hosting | VPS 94.183.155.147 | Already has Docker |

## Database Schema

```sql
-- Sites/Projects
CREATE TABLE projects (
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

-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Drafts (per project)
CREATE TABLE drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT,
  tags TEXT,  -- JSON array
  platform TEXT,  -- 'blog', 'dzen', 'social'
  status TEXT DEFAULT 'draft',  -- draft, review, published, archived
  char_count INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  published_at TEXT,
  UNIQUE(project_id, slug)
);

-- Stats (per project)
CREATE TABLE stat_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  date TEXT,
  source TEXT,  -- 'google', 'yandex', 'metrika'
  total_indexed INTEGER,
  total_errors INTEGER,
  clicks INTEGER,
  impressions INTEGER,
  avg_position REAL,
  raw TEXT,
  UNIQUE(project_id, date, source)
);

-- Keyword positions (per project)
CREATE TABLE keyword_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  date TEXT,
  keyword TEXT,
  clicks INTEGER,
  impressions INTEGER,
  position REAL,
  ctr REAL,
  UNIQUE(project_id, date, keyword)
);

-- Core Web Vitals (per project)
CREATE TABLE cwv_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  date TEXT,
  url TEXT,
  lcp REAL, cls REAL, inp REAL, fcp REAL, ttfb REAL,
  score REAL, raw TEXT,
  UNIQUE(project_id, date, url)
);

-- Social media posts
CREATE TABLE social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  draft_id INTEGER REFERENCES drafts(id),
  platform TEXT NOT NULL,  -- 'telegram', 'dzen', 'vk', 'ok'
  post_id TEXT,  -- remote post ID
  status TEXT DEFAULT 'pending',  -- pending, posted, failed
  posted_at TEXT,
  error TEXT,
  raw_response TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Topic queue (per project)
CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, processing, done, failed
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT
);

-- Audit log
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id INTEGER,
  details TEXT,  -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Modules

### 1. Auth (JWT)
- Login page: username + password
- JWT token in httpOnly cookie
- Middleware: checkAuth() on all /admin/* routes
- Default admin user created on first run

### 2. Projects (Multi-Site)
- List all sites with stats summary
- Add new site: name, domain, GitHub repo, niche
- Configure API keys per site (GSC, Yandex, Metrika)
- Configure social accounts per site (Telegram, Dzen, VK, OK)
- Switch between sites via dropdown

### 3. Dashboard (per site)
- Traffic chart (visits, pageviews, users) — Metrika
- Search performance (clicks, impressions, position) — GSC
- Keyword positions table (top 31 keywords)
- Core Web Vitals gauge (LCP, CLS, INP)
- Recent drafts status
- Recent social posts
- Quick actions: Generate article, View drafts, Run pipeline

### 4. Content Manager
- Draft list: filter by status (draft/review/published/archived)
- Draft editor: title, body (markdown), category, tags
- Preview: render markdown to HTML
- Publish flow: Review → Approve → Publish to site + social
- AI generation: input topic → generate article → save as draft
- Bulk operations: publish all reviewed, archive old drafts

### 5. SEO Monitor
- Keyword positions chart (position over time)
- Indexing status (indexed vs excluded pages)
- Duplicate content detection
- Internal link analysis
- Canonical tag management
- Sitemap health check

### 6. Social Distribution
- **Telegram**: post to channel (text + photo), schedule
- **Dzen**: RSS auto-import (already have /rss-dzen.xml)
- **VK**: post to group (text + photo), via VK API
- **OK**: post to group (widget or API), via OK API
- **Multi-post**: publish to all platforms in one click
- **Schedule**: set posting time per platform
- **Analytics**: track views/engagement per post

### 7. Pipeline (AI Content)
- Topic queue management (add, reorder, remove)
- Pipeline status (running, queued, completed, failed)
- Manual run: pick topic → research → write → review → draft
- Auto-run: daily cron picks next topic
- Quality gates: dental terms, length, AI tells, citations

### 8. Settings
- Site configuration (domain, repo, niche)
- API keys (GSC, Yandex, GitHub, AI)
- Social accounts (Telegram, VK, OK tokens)
- Cron schedule (pipeline, stats, social posting)
- Admin password management

## Social Media Integration

### Telegram (already working)
- Bot API: sendMessage, sendPhoto
- Channel: @ortopednn (or per project)
- Post format: title + summary + link + image
- API: api.telegram.org/bot<TOKEN>/...

### Dzen (RSS-based)
- RSS feed: /rss-dzen.xml (already built)
- Auto-import: Dzen pulls from RSS
- Category: native-draft (review before publish)
- No API needed — RSS is the mechanism

### VK (VKontakte)
- API: https://api.vk.com/method/wall.post
- Auth: community access_token (group_id + token)
- Post: message + attachments (photo)
- Rate limit: 3 posts/hour per group
- Photo upload: upload.vk.com

### Odnoklassniki (OK)
- API: https://api.ok.ru/api/content/post
- Auth: application_key + access_token + group_id
- Post: message + media (photo attachment)
- Widget-based: St.cmd=WidgetMediatopicPost
- Rate limit: 100 requests/day

## MVP Scope (Phase 1)

### What's IN:
1. ✅ Auth (login page + JWT)
2. ✅ Project management (add/edit sites)
3. ✅ Dashboard (traffic + keywords + CWV charts)
4. ✅ Draft management (list, edit, publish)
5. ✅ Social posting (Telegram + Dzen)
6. ✅ Basic SEO (keyword positions, indexing status)

### What's OUT (Phase 2):
- VK/OK integration
- Advanced SEO (duplicates, internal links)
- Pipeline management (topic queue)
- Audit log
- Multi-user roles

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create Express app with auth middleware
- [ ] SQLite schema + migrations
- [ ] Project CRUD (add/edit/delete sites)
- [ ] Login page (HTMX + Tailwind)
- [ ] Dashboard layout (sidebar + charts)

### Phase 2: Content + Stats (Week 2)
- [ ] Draft management (list, edit, preview, publish)
- [ ] Stats integration (GSC, Yandex, Metrika charts)
- [ ] Keyword positions table
- [ ] AI article generation trigger

### Phase 3: Social Distribution (Week 3)
- [ ] Telegram posting (channel bot)
- [ ] Dzen RSS integration
- [ ] VK API integration
- [ ] OK API integration
- [ ] Multi-post (one click → all platforms)

### Phase 4: Polish + Deploy (Week 4)
- [ ] Nginx reverse proxy (admin.ortopednn.ru)
- [ ] SSL certificate (Let's Encrypt)
- [ ] Docker containerization
- [ ] Cron jobs (daily stats, social posting)
- [ ] Error handling + logging

## Files to Create

| File | Purpose |
|------|---------|
| `server/admin/app.js` | Express app entry point |
| `server/admin/auth.js` | JWT auth middleware |
| `server/admin/routes/projects.js` | Project CRUD |
| `server/admin/routes/drafts.js` | Draft management |
| `server/admin/routes/stats.js` | Stats API |
| `server/admin/routes/social.js` | Social posting |
| `server/admin/routes/pipeline.js` | AI pipeline |
| `server/admin/db.js` | SQLite connection + migrations |
| `server/admin/views/layout.ejs` | Base layout (HTMX) |
| `server/admin/views/login.ejs` | Login page |
| `server/admin/views/dashboard.ejs` | Dashboard |
| `server/admin/views/projects.ejs` | Project list |
| `server/admin/views/drafts.ejs` | Draft management |
| `server/admin/views/stats.ejs` | Stats charts |
| `server/admin/views/social.ejs` | Social posting |
| `server/admin/public/style.css` | Tailwind CSS |
| `server/admin/public/app.js` | Chart.js + HTMX config |

## Key Assumptions

1. **VPS can run another Express app** on port 3001 (bot is on 3000)
2. **GitHub API is sufficient** for content storage (no need for separate CMS DB)
3. **SQLite handles the load** (single user, low traffic)
4. **HTMX is enough** for the UI (no React/Vue needed)
5. **Social APIs are accessible** from Russia (VK, OK — yes; Telegram — via DNS fix)

## Open Questions

- [ ] Какой домен для админки? (admin.ortopednn.ru? or ortopednn.ru/admin?)
- [ ] Нужен ли SSL? (Да, Let's Encrypt)
- [ ] Какой пароль для admin по умолчанию?
- [ ] Нужен ли доступ по IP? (94.183.155.147:3001)
