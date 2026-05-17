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
- Deploy: Cloudflare Pages (через Layero CDN) — Live; GitHub Pages — test subdomain
- Telegram: `t.me/nikitina_ortoped` — присутствует на страницах услуг
- Нет отдельной страницы "Записаться" — только телефон
- Доктор — наёмный работник (не владелец клиники)
- Цены удалены из ortopednn.ru/services/ (по запросу пользователя)

### LIVE-сайт (ortopednn.ru) — структура (2026-05-17)

**Sitemap:** `sitemap-index.xml` → `sitemap-0.xml`, всего **103+ URL**

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
| Output: static | ✅ | `astro.config.mjs:7` |
| `@astrojs/cloudflare` adapter | ✅ | `astro.config.mjs:8-10` |
| `@astrojs/sitemap` | ✅ | `astro.config.mjs:16` |
| Content Collections v2 (`file()` loader) | ✅ | `src/content/config.ts` |
| OG image fallback (favicon) | ✅ | `src/layouts/BaseLayout.astro` |

### Pricing Data

- **Source:** `data/pricing.json` — 5 категорий, 87 позиций
- **Rendering:** `src/pages/services/index.astro` — рендерит `<span class="service-price">{price}</span>`
- **Также используется в:** индивидуальных страницах услуг (./astro файлы в src/pages/services/)
- **На главной:** цены рендерятся из `getAllServicesFlat()` или hardcoded

### Next Critical Steps

1. **Удалить цены с индивидуальных страниц услуг** — проверить все 62 файла в `src/pages/services/*.astro` на наличие `<span class="service-price">` или `{price}` 
2. **Удалить `C:\opencode\ortopednn`** (старый Next.js репозиторий) — после подтверждения
3. **Переделать дизайн stomatolog.ortopednn.ru** — пользователь не доволен текущим дизайном
4. **Яндекс.Вебмастер** — проверить индексацию, регион, поисковые запросы
5. **Яндекс.Бизнес** — создать карточку организации

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
