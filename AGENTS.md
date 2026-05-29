# AGENTS.md — ortopednn project

## Project Context
- **LIVE-код (Astro):** `C:\opencode\ortopednn-auto\` — Astro SSG, деплоится на GitHub Pages
- **Многосайтовая архитектура:** `docs/architecture.md` — как маштабировать проект на несколько доменов (ortopednn.ru, stomatolog.ortopednn.ru, и др.)
- **VPS:** `94.183.155.147` — root, пароль `MX9Hip94h=KMUJcU6T`, Docker (bot + n8n), Ubuntu 24.04
- **VPS ветка:** `master` (совпадает с дефолтной). `main` — устарела, расходится, НЕ используется
- **Бот на VPS:** `server/` — Docker compose, polling mode, порт 3000
- **n8n на VPS:** порт 5678, admin@ortopednn.ru / Ortopednn2026!, workflow импортирован
- **Telegram fix:** `extra_hosts: api.telegram.org → 149.154.167.220` в docker-compose.yml (блокировка Telegram в РФ)
- **Docker registry mirror:** `mirror.gcr.io` в `/etc/docker/daemon.json`
- **Хостинг бота:** `docs/hosting.md` — документация по портированию бота
- **Репозиторий:** `github.com/vpcea2s1r/ortopednn-auto`
- **Старый репозиторий (Next.js):** `C:\opencode\ortopednn\` — устаревший код, НЕ используется на live, подлежит удалению
- **Тестовый поддомен (Astro):** `C:\opencode\stomatolog\` — stomatolog.ortopednn.ru (GitHub Pages)
- **Stomatolog = review platform:** pipeline публикует noindex HTML на stomatolog.ortopednn.ru → пользователь читает → кнопка "На сайт" (ortopednn.ru) или "Удалить"
- **Layero больше не используется** — деплой через GitHub Pages
- Dentist prosthodontist site — Никитина М.Г., Нижний Новгород
- TypeScript, Tailwind CSS v4

## Critical Rule: LIVE-first development
1. **Код репозитория НЕ равен live-сайту** — всегда проверять https://ortopednn.ru перед выводами и изменениями
2. **Перед любым действием** — сделать `webfetch` на 2-3 ключевых страницы live-сайта (главная + целевой раздел), чтобы понять текущее состояние
3. **После каждого шага** — обновить инфо-файлы (AGENTS.md, yandex.md, etc.) с актуальными данными с live
4. **При обнаружении расхождения** между кодом и live — фиксировать таблицу расхождений и предлагать синхронизацию
5. **Перед commit/push** — проверить не затрёт ли старый код актуальный контент с live
6. **Кодировка UTF-8 всегда** — при push через GitHub API: читать файл через `[System.IO.File]::ReadAllBytes`, кодировать в base64, НЕ использовать `Get-Content` (ломает UTF-8). Перед push проверять: `[System.Text.Encoding]::UTF8.GetString($bytes)` — русский текст должен читаться.

7. **Article tracking in CONTENT.md** — перед написанием статьи прочитать CONTENT.md (список статей), после написания статьи добавить её в CONTENT.md, затем push.
8. **Review-before-publish (Hard Rule)** — ни одна статья не публикуется без одобрения пользователя. Пайплайн сохраняет черновики в `/data/drafts/`. Пользователь читает через `/drafts` в Telegram боте или на preview.ortopednn.ru/preview/<slug>/ (noindex, banner). Нажимает "Опубликовать" или "Удалить". Прямая публикация через GitHub API (publisherAgent) запрещена — только через review flow.

## Available Skills

22 skills from `addyosmani/agent-skills` at `.opencode/skills/<name>/SKILL.md`.
Use `skill` tool to load them. Flow:

```
  DEFINE       PLAN        BUILD       VERIFY      REVIEW       SHIP
idea-refine → planning → incremental → test → code-review → shipping
  spec-driven              frontend      debugging   security
                           api-design    browser     performance
                           source-driven
                           doubt-driven
                           context-engineering
```

## Key Skills for This Project

| Task | Skill |
|------|-------|
| New feature / change | `incremental-implementation` |
| Bug fix | `debugging-and-error-recovery` |
| Code review | `code-review-and-quality` |
| Deploy | `shipping-and-launch` + `ci-cd-and-automation` |
| Simplify code | `code-simplification` |
| UI work | `frontend-ui-engineering` |
| Committing | `git-workflow-and-versioning` |

## 9Router — AI Router & Token Saver

9Router — прокси для AI-провайдеров (40+), с автоматическим fallback и RTK-сжатием токенов.

### Запуск

```powershell
cd C:\opencode\ortopednn\9router
.\start.ps1
```

Dashboard: http://localhost:20128 (пароль: `123456`)

## Project Goal & Status

**Goal:** Продвижение ortopednn.ru (Никитина М.Г., стоматолог-ортопед) в ТОП-1 Яндекса по Нижнему Новгороду.

### Constraints (актуальные)
- **Deploy:** GitHub Pages (static SSG). Cloudflare не используется (заблокирован в РФ).
- **Telegram-бот для SEO мониторинга:** `@ortopednn_bot` — chat_id: `45185475` (Юрий)
- **Telegram контакт:** `t.me/nikitina_ortoped` — присутствует на страницах услуг
- Нет отдельной страницы "Записаться" — только телефон
- Доктор — наёмный работник (не владелец клиники)
- Цены удалены из ortopednn.ru/services/ (по запросу пользователя)

### Google OAuth (Search Console API)

| Параметр | Значение |
|----------|----------|
| Scope | `https://www.googleapis.com/auth/webmasters` |
| Status | ✅ Site verified, sitemap submitted (0 errors, 0 warnings) |
| GSC properties | `https://ortopednn.ru/` (URL-prefix) + `sc-domain:ortopednn.ru` (domain) — siteOwner |
| Refresh rotation | Test user auth expires every 7 days |
| Credentials file | `C:\opencode\ortopednn-auto\google-oauth.md` |

### Yandex OAuth (Webmaster API)

| Параметр | Значение |
|----------|----------|
| Token expires | ~161 дней (2026-10-31) |
| Scope | `webmaster:hostinfo` + `webmaster:verify` |
| User ID (Яндекс) | `156937890` |
| Credentials file | `C:\opencode\ortopednn-auto\google-oauth.md` |

### GitHub Secrets (Telegram Bot)

Secrets stored in `.env` на VPS (`/opt/ortopednn-auto/.env`).

| Secret | Назначение |
|--------|------------|
| `TELEGRAM_BOT_TOKEN` | Токен бота `@ortopednn52_bot` |
| `TELEGRAM_CHAT_ID` | Чат Юрия для уведомлений |
| `GH_PAT` | GitHub Personal Access Token |

### LIVE-сайт (ortopednn.ru) — структура (2026-05-28)

**Sitemap:** `sitemap-0.xml`, всего **151 pages** (build 2026-05-29, 0 errors)

| Раздел | Кол-во | Описание |
|--------|--------|---------|
| `/` | 1 | Главная с FAQ, контактами |
| `/about/` | 1 | О враче |
| `/blog/` | 1 + **35 статей** | Блог (статьи от авто-пайплайна) |
| `/compare/` | 1 | Сравнение конструкций |
| `/materials/` | 1 | Материалы |
| `/services/` | 1 + **63 услуги** | Услуги с описанием (цены удалены) |

### Astro Features (current config)

| Feature | Status | Config location |
|---------|--------|-----------------|
| Output: static | ✅ | `astro.config.mjs` |
| Astro 6 | ✅ | `package.json: astro@^6.0.0` |
| Rust compiler | ✅ | `experimental.rustCompiler: true` — сборка 10.44s |
| SVG optimizer | ✅ | `experimental.svgOptimizer: svgoOptimizer()` |
| Fonts API (Inter) | ✅ | `fonts` config + `<Font cssVariable="--font-inter" preload/>` |
| View Transitions | ✅ | `<ClientRouter />` в `BaseLayout.astro` |
| `@astrojs/sitemap` | ✅ | `astro.config.mjs` — `/preview/` excluded from sitemap |
| Content Collections v2 (`file()` loader) | ✅ | `src/content/config.ts` |
| OG image fallback (favicon) | ✅ | `src/layouts/BaseLayout.astro` |

### Pricing Data

- **Данные:** `data/pricing.json` (не тронуты)
- **Список услуг:** `src/pages/services/index.astro` — цены удалены
- **Индивидуальные страницы:** `src/pages/services/*.astro` — цены удалены (ServiceArticle: price-бадж, material-price, stat-card__value, inline цены)
- **Главная:** цены удалены
- **Компонент:** `ServiceArticle.astro` — удалены price из Props, price-бадж, Product schema, CSS

### Preview System (Draft Review on ortopednn.ru)

**Status:** ✅ Frontend on Astro — created
**Flow:** Bot generates draft → pushes `data/drafts/<slug>.json` to repo → GitHub Actions rebuilds → preview at `ortopednn.ru/preview/<slug>/` (noindex, banner) → user reads + publishes via Telegram /drafts
**Files:**
- `data/draft-types.ts` — DraftMeta interface (slug, title, date, desc, body, category)
- `src/pages/preview/...slug.astro` — dynamic route (BaseLayout, noindex, preview banner, publish/delete buttons)
- `data/drafts/.gitkeep` — directory for draft JSONs
- `astro.config.mjs` — `/preview/` excluded from sitemap

**Need on VPS:**
1. Bot to push `data/drafts/<slug>.json` to repo after generation
2. Two API routes on bot: `/api/preview/publish` and `/api/preview/delete`

## Next Steps

1. **Google Search Console** — верифицировать ortopednn.ru (HTML tag) для доступа к API
2. **Interactive Telegram Bot** — добавить команды `/check`, `/ssl`, `/perf`, `/stats` (GitHub Actions → Telegram)
2. **Яндекс.Вебмастер интеграция** — ✅ OAuth-токен получен (2026-05-22). Права: webmaster:hostinfo + webmaster:verify. Можно добавить права Yandex.Direct API
3. **Core Web Vitals** — реальные LCP/CLS/INP через CrUX API
4. **Алерты реального времени** — мгновенный Telegram при падении perf < 50 или битых ссылках
5. **Weekly digest** — динамика метрик за неделю
6. **Бенчмарк конкурентов** — сравнение perf/seo с конкурентами
7. **Удалить `C:\opencode\ortopednn`** (старый Next.js репозиторий) — после подтверждения
8. **Редизайн stomatolog.ortopednn.ru** — пользователь не доволен текущим дизайном
9. **Cleanup: main branch** — `main` ветка устарела и расходится с `master`. Нужно удалить или пересоздать.
10. **n8n Telegram credentials** — настроить Telegram API key для n8n workflow (бот токен). Низкий приоритет.
11. **Queue dedup** — проверять существующие статьи перед генерацией, чтобы избежать дубликатов.

## Telegram SEO Monitor Bot (`@ortopednn52_bot`)

Бот работает на VPS (94.183.155.147) в Docker-контейнере, polling mode, порт 3000.

### Что умеет сейчас
- **Инлайн-меню** (`/menu`): Производительность, Черновики, PubMed-рерайт
- `/perf` — Lighthouse + CrUX (PageSpeed API, без ключа)
- `/research <тема>` — поиск PubMed, inline-выбор статьи → рерайт → черновик
- `/drafts` — черновики с inline-кнопками: опубликовать (→ stomatolog.ortopednn.ru) / удалить
- **URL-рерайт** — кидаешь ссылку → бот читает, AI переписывает для блога → черновик
- **Daily cron** (8:00 MSK) — сбор статистики GSC + Яндекс в SQLite
- **Auto-content pipeline** (cron 7:00 MSK) — Multi-Agent генерация (Research→Writer→Review→SEO→**Draft**)
- **Review flow** — статьи не публикуются сразу. Сохраняются в `/data/drafts/` как черновик. Уведомление в Telegram. Публикация — через кнопку "Опубликовать" в `/drafts`
- `/autogen <тема>` — ручной запуск пайплайна, сохраняет как черновик
- **n8n workflow** (дублирующий триггер 7:00 MSK) — HTTP → bot API, Telegram-уведомления
- **Polling** (каждые 10с) — порт 3000, healthcheck

### Известные проблемы
- После перезапуска контейнера offset сбрасывается (потоковые обновления могут теряться). Исправить: хранить offset в SQLite.
- inline-кнопки меню могут не срабатывать если бот не получил callback_query (проверить через docker logs).
- SSH к VPS недоступен из некоторых регионов — управление только через docker exec.

### Команды бота
| Команда | Статус | Описание |
|---------|--------|----------|
| `/perf` | ✅ | Lighthouse + CrUX PageSpeed |
| `/research` | ✅ | Поиск PubMed + AI рерайт |
| `/menu` | ✅ | Инлайн-меню |
| `/drafts` | ✅ | Черновики: "На сайт" (→ ortopednn.ru) или "Удалить" |
| `/ssl` | ❌ | Сколько дней до истечения сертификата |
| `/stats` | ❌ | Яндекс.Вебмастер статистика |
| `/digest` | ❌ | Weekly digest по динамике метрик |
| `/autogen` | ✅ | Multi-Agent генерация статьи |

## Writing Rules (обязательно для всех)

**Источник:** https://github.com/Anbeeld/WRITING.md — скилл `writing` в `~/.config/opencode/skills/writing/`

Все правила WRITING.md обязательны при написании любого текста для публичного просмотра (статьи, блог, SEO-копирайтинг, UI-тексты, email). Не применяются только к комментариям в коде, commit message и личным заметкам.

Кратко (WRITING-mini):
- Пиши для контекста: medium, аудитория, задача текста. При конфликте: правда > пользователь > жанр > правила.
- Каждый абзац — одна конкретика (имя, число, цитата, деталь). many/various/essentially — не считаются.
- Простые слова и глаголы. Повторяй обычные слова. Связывай местоимениями и формой предложения, не furthermore/moreover. Тесные мысли — в одно предложение.
- Без ключевых речей, Great question, I hope this helps. Начинай с ответа, заканчивай ответом.
- Избегай повторяющихся паттернов: parallel lists, concession rhythm (not X, but Y), stacked mini-sentences, одинаковые дуги абзацев.
- Длинная форма: сквозная тема (тематическая, перспективная, пример-ведомая), не хронология. Включи пример, накопительное предложение, паузу.
- Редактируй вырезанием. Не разрывай связанные мысли. Без эм-тире, если не оправдано. Без fake humanity. Не убирай структуру ради стиля.
- Проверка: регистр, якоря, регулярность, позиция, перекоррекция. Смотреть (не запрет): delve/leverage/seamless, it's important to note, unnamed experts, unsupported causality.

Скилл подгружается через `skill` tool по триггеру "writing".

## Setup After Clone

```powershell
# Recreate skills junction
git submodule update --init --recursive
New-Item -ItemType Junction -Path ".opencode\skills" -Target "..\skills\addy-skills\skills"

# 9router setup (если не работает)
cd 9router
npm install
$env:NODE_ENV="production"; npx next build --webpack
.\start.ps1
```
