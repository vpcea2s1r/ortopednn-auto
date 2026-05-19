# AGENTS.md — ortopednn project

## Project Context
- **LIVE-код (Astro):** `C:\opencode\ortopednn-auto\` — Astro SSG, деплоится на GitHub Pages
- **Репозиторий:** `github.com/vpcea2s1r/ortopednn-auto`
- **Старый репозиторий (Next.js):** `C:\opencode\ortopednn\` — устаревший код, НЕ используется на live, подлежит удалению
- **Тестовый поддомен (Astro):** `C:\opencode\stomatolog\` — stomatolog.ortopednn.ru (GitHub Pages)
- **Layero больше не используется** — деплой через GitHub Pages
- Dentist prosthodontist site — Никитина М.Г., Нижний Новгород
- TypeScript, Tailwind CSS v4

## Critical Rule: LIVE-first development
1. **Код репозитория НЕ равен live-сайту** — всегда проверять https://ortopednn.ru перед выводами и изменениями
2. **Перед любым действием** — сделать `webfetch` на 2-3 ключевых страницы live-сайта (главная + целевой раздел), чтобы понять текущее состояние
3. **После каждого шага** — обновить инфо-файлы (AGENTS.md, yandex.md, etc.) с актуальными данными с live
4. **При обнаружении расхождения** между кодом и live — фиксировать таблицу расхождений и предлагать синхронизацию
5. **Перед commit/push** — проверить не затрёт ли старый код актуальный контент с live

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

### GitHub Secrets (Telegram Bot)

| Secret | Значение | Назначение |
|--------|----------|------------|
| `TELEGRAM_BOT_TOKEN` | `8992312371:AAEmKcm3WLeTfOjGQrM1-P8XE8yyiTmnSEM` | Токен бота `@ortopednn_bot` |
| `TELEGRAM_CHAT_ID` | `45185475` | Чат Юрия для уведомлений |
| `ORTOPEDNN_BOT` | (тот же токен) | Запасной / старый |

### LIVE-сайт (ortopednn.ru) — структура (2026-05-17)

**Sitemap:** `sitemap-index.xml` → `sitemap-0.xml`, всего **105 URLs** (0 errors)

| Раздел | Кол-во | Описание |
|--------|--------|---------|
| `/` | 1 | Главная с FAQ, контактами |
| `/about/` | 1 | О враче |
| `/blog/` | 1 + 3 статьи | Блог (care-crown, care-denture, first-visit) |
| `/checkup/` | 1 + **30 статей** | Самодиагностика + статьи по проблемам |
| `/compare/` | 1 | Сравнение конструкций |
| `/materials/` | 1 | Материалы |
| `/services/` | 1 + **62 услуги** | Услуги с описанием (цены удалены) |

### Astro Features (current config)

| Feature | Status | Config location |
|---------|--------|-----------------|
| Output: static | ✅ | `astro.config.mjs` |
| Astro 6 | ✅ | `package.json: astro@^6.0.0` |
| Rust compiler | ✅ | `experimental.rustCompiler: true` — сборка 10.44s |
| SVG optimizer | ✅ | `experimental.svgOptimizer: svgoOptimizer()` |
| Fonts API (Inter) | ✅ | `fonts` config + `<Font cssVariable="--font-inter" preload/>` |
| View Transitions | ✅ | `<ClientRouter />` в `BaseLayout.astro` |
| `@astrojs/sitemap` | ✅ | `astro.config.mjs` |
| Content Collections v2 (`file()` loader) | ✅ | `src/content/config.ts` |
| OG image fallback (favicon) | ✅ | `src/layouts/BaseLayout.astro` |

### Pricing Data

- **Данные:** `data/pricing.json` (не тронуты)
- **Список услуг:** `src/pages/services/index.astro` — цены удалены
- **Индивидуальные страницы:** `src/pages/services/*.astro` — цены удалены (ServiceArticle: price-бадж, material-price, stat-card__value, inline цены)
- **Главная:** цены удалены
- **Компонент:** `ServiceArticle.astro` — удалены price из Props, price-бадж, Product schema, CSS

### Next Steps

1. **Interactive Telegram Bot** — добавить команды `/check`, `/ssl`, `/perf`, `/stats` (GitHub Actions → Telegram)
2. **Яндекс.Вебмастер интеграция** — статистика по запросам и позициям в Telegram
3. **Core Web Vitals** — реальные LCP/CLS/INP через CrUX API
4. **Алерты реального времени** — мгновенный Telegram при падении perf < 50 или битых ссылках
5. **Weekly digest** — динамика метрик за неделю
6. **Бенчмарк конкурентов** — сравнение perf/seo с конкурентами
7. **Удалить `C:\opencode\ortopednn`** (старый Next.js репозиторий) — после подтверждения
8. **Редизайн stomatolog.ortopednn.ru** — пользователь не доволен текущим дизайном

## Telegram SEO Monitor Bot (`@ortopednn_bot`)

Бот работает через GitHub Actions workflow (`.github/workflows/seo-monitor.yml`).

### Что умеет сейчас
- **Daily report** (5:00 UTC = 8:00 MSK) — sitemap check, Lighthouse perf/seo/a11y, SSL expiry, build size
- **Regression alerts** — битые ссылки, perf < 80, SSL < 14 дней
- **Ручной запуск** через `Actions → SEO Monitor → Run workflow`

### Формат сообщения
```
📊 SEO Monitor — ortopednn.ru

🌐 Sitemap: 105 URLs, ✅ 0 errors
⚡ Performance: 55 | SEO: 100 | A11y: 96
🔒 SSL: 83 days left
📦 Build: 18MB (106 pages)

[Open Summary](https://github.com/...)
```

## Performance Optimization Rules

Performance (Lighthouse) важен для ранжирования Яндекса. Текущий score: **55**. Основные приёмы:

1. **Изображения всегда WebP** — конвертировать через `sharp` (уже в зависимостях). Скрипт: `node -e "require('sharp')('input.jpg').webp({quality:80}).toFile('input.webp')"`
2. **loading="lazy"** на всех изображениях ниже сгиба, включая фото врача
3. **onerror fallback** для WebP: `onerror="this.onerror=null;this.src=this.src.replace('.webp','.jpg')"`
4. **Preconnect** для сторонних доменов: `<link rel="preconnect" href="https://mc.yandex.ru">`
5. **Render-blocking CSS** — инлайнить критический CSS для above-the-fold
6. **Не дублировать @font-face** — вынести в отдельный CSS, не инлайнить на каждую страницу
7. **GitHub Pages** — основной фактор медленной загрузки для РФ (сервер в США). Альтернатив нет (Cloudflare заблокирован в РФ).
8. **Минимум внешних запросов** — текущий лимит: 3 домена (свой, Yandex Metrika, Yandex Maps). Любой новый внешний ресурс требует оправдания.

### Команды (запланировано)
| Команда | Статус | Описание |
|---------|--------|----------|
| `/check` | ❌ | Мгновенный SEO-чек (lighthouse + sitemap) |
| `/ssl` | ❌ | Сколько дней до истечения сертификата |
| `/perf` | ❌ | Performance score + Core Web Vitals |
| `/stats` | ❌ | Яндекс.Вебмастер статистика |
| `/digest` | ❌ | Weekly digest по динамике метрик |

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
