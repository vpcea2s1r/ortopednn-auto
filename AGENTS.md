# AGENTS.md — ortopednn project

## Project Context
- Astro (SSG) — live-сайт на Astro, build в `dist/`. **РЕПОЗИТОРИЙ** (nikitina-ortoped) содержит устаревший Next.js код.
- LIVE-код скопирован в `live/` — это Astro, оттуда деплоится ortopednn.ru
- Hosted on Layero (Russian CDN, no VPN needed)
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
# Старт 9router (порт 20128)
cd C:\opencode\ortopednn\9router
.\start.ps1
```

Dashboard: http://localhost:20128 (пароль: `123456`)

### Подключение провайдера (через UI)

1. Открыть http://localhost:20128 → Логин `123456`
2. Providers → Connect **Kiro AI** (AWS Builder ID / Google / GitHub OAuth)
3. Или Connect **OpenCode Free** (без авторизации)
4. После подключения — готово к использованию

### Использование в OpenCode

Уже настроено:
- Провайдер `9router` в `opencode-providers.json`
- Модели: `9router/kr/claude-sonnet-4.5` (основная), `9router/kr/claude-haiku-4.5` (small)

### Структура

```
9router/          — код 9router (Next.js 16, standalone build)
9router/.env     — конфигурация (порт 20128, пароль 123456)
9router/start.ps1 — скрипт запуска
```

## Project Goal & Status

**Goal:** Продвижение ortopednn.ru (Никитина М.Г., стоматолог-ортопед) в ТОП-1 Яндекса по Нижнему Новгороду.

### Constraints (актуальные)
- Deploy: Cloudflare Pages (судя по всему, через Layero CDN)
- Telegram: **присутствует** (`t.me/nikitina_ortoped`) на страницах услуг (вопреки ранним утверждениям)
- Нет отдельной страницы "Записаться" — только телефон
- Доктор — наёмный работник (не владелец клиники)
- Виниры E-MAX — есть на сайте (не удалены, хоть и low priority)

### LIVE-сайт (ortopednn.ru) — актуальная структура (2026-05-16)

**Sitemap:** `sitemap-index.xml` → `sitemap-0.xml`, всего **103+ URL**

| Раздел | Кол-во | Описание |
|--------|--------|---------|
| `/` | 1 | Главная с ценами, FAQ, контактами |
| `/about/` | 1 | О враче |
| `/blog/` | 1 + 3 статьи | Блог (care-crown, care-denture, first-visit) |
| `/checkup/` | 1 + **30 статей** | Самодиагностика + статьи по проблемам/ценам |
| `/compare/` | 1 | Сравнение конструкций |
| `/materials/` | 1 | Материалы |
| `/services/` | 1 + **62 услуги** | Услуги с ценами и описанием (+ 2 справ. страницы: condition, variant) |

**Checkup статьи (30):** akrilovyj-protez, bolit-chelyust-posle-protezirovaniya, bolit-zub-pod-koronkoj, bolno-li-stavit-koronku, byugelnyj-protez-cena, cemu-spat-v-proteze, cirkonievaya-koronka, desna-otoshla-ot-koronki, fiksaciya-koronki-cena, implantatsiya-cena, kakoj-protez-vybrat, koronka-na-perednij-zub, koronka-na-zhevatelnyj-zub, koronka-na-zub-cena, koronka-temnee-sosednego-zuba, metallokeramika-cena, mostovidnyj-protez-cena, mozhno-li-otbelit-koronku, nejlonovyj-protez, polnyj-semnyj-protez, privkus-metalla-ot-koronki, protez-ploho-derzhitsya, protez-skripit-pri-zhevanii, protez-tresnul, schel-mezhdu-koronkoj-i-zubom, semnyj-protez-cena, skolko-delaetsya-koronka, snyatie-koronki-cena, vypala-koronka, zapah-iz-pod-koronki

**Услуги (66 файлов):** index.astro + 62 услуги + 2 справ. (condition, variant) + metallokeramicheskaya-koronka (дубль metallokeramika)

### Astro Features (current config)

| Feature | Status | Config location |
|---------|--------|-----------------|
| `trailingSlash: 'always'` | ✅ | `live/astro.config.mjs:8` |
| `scopedStyleStrategy: 'where'` | ✅ | `live/astro.config.mjs:9` |
| `remark-smartypants` | ✅ | `live/astro.config.mjs:24-27` |
| Content Collections v2 (`file()` loader) | ✅ | `live/src/content/config.ts` |
| Default `og:image` (favicon) | ✅ | `live/src/layouts/BaseLayout.astro:71-74` |
| `@astrojs/cloudflare` adapter | ✅ | `live/astro.config.mjs:10-13` |
| `@astrojs/sitemap` | ✅ | `live/astro.config.mjs:17-19` |

### Blocked (no external network for npm install)

| Feature | Why |
|---------|-----|
| `rehype-slug` (auto heading IDs) | Needs npm install |
| `astro-og-canvas` (OG generation) | Not installed |
| `@astrojs/check` (type checking) | Not installed |
| `astro-og-canvas` (per-page OG) | Not installed |

### Content Collections (src/content/config.ts)

- `pricing` — загружается из `data/pricing.json` через `file()` loader, 4 категории × items
- `districts` — загружается из `data/districts.json` через `file()` loader
- Zod-схемы с валидацией для обоих коллекций
- Готово для использования `getCollection()` в любых .astro страницах

### Ключевые отличия LIVE от репозитория

| Аспект | Репозиторий (код) | LIVE (ortopednn.ru) |
|--------|-------------------|---------------------|
| **Checkup** | `app/checkup/` не существует | 30 статей + самодиагностика |
| **Сервис слагы** | content.ts (14 услуг) | 62 услуги с ценами |
| **Blog** | нет | 3 статьи |
| **About** | нет | Есть `/about/` |
| **Compare** | нет | Есть `/compare/` |
| **Materials** | нет | Есть `/materials/` |
| **Telegram** | `t.me/nikitina_ortoped` | Есть на страницах услуг |
| **Metrika ID** | 109258289 | 109240855 (старый) |
| **Контент услуг** | Краткий (content.ts) | Детальный (708+ строк каждый) |
| **Astro config** | next.config.js (Next.js) | `astro.config.mjs` (Astro 5) |

### Yandex.Webmaster — текущий статус

- Сайт **добавлен и верифицирован** (metrika 109240855 работает)
- **noindex убран** — Яндекс может индексировать
- Регион — нужно проверить (должен быть Нижний Новгород)
- **Страницы в индексе** — нужно проверить (было 0 из-за noindex)
- **Поисковые запросы** — нужно посмотреть реальные данные

### Wordstat Data

- Файл `CHECKUP-PLAN.md` — есть в `live/CHECKUP-PLAN.md`
- Файл `wordstat/wordstat_similar_queries.xlsx` — **отсутствует**
- **Нужно**: сравнить Wordstat оценки с реальными запросами из Яндекс.Вебмастер

### Next Critical Steps

1. **`rehype-slug` — установить** при появлении сети (авто-ID для заголовков)
2. **`astro-og-canvas` — установить** для генерации OG-картинок на каждую страницу
3. **Яндекс.Вебмастер** — проверить индексацию, регион, поисковые запросы
4. **Яндекс.Бизнес** — создать карточку организации (ручное действие, ~30 мин)
5. **Синхронизировать репозиторий** с live-сайтом (код устарел)
6. **Убрать дубликаты** в услугах (metallokeramika и metallokeramicheskaya-koronka — дубли?)

### Новые фичи (добавлены 2026-05-16)

| Фича | Файл | Зачем |
|------|------|-------|
| `trailingSlash: 'always'` | `astro.config.mjs` | SEO — единый формат URL, нет дублей |
| `scopedStyleStrategy: 'where'` | `astro.config.mjs` | Меньшая специфичность CSS |
| `remark-smartypants` | `astro.config.mjs` | Типографские кавычки, тире |
| Content Collections v2 (file loader) | `src/content/config.ts` | Type-safe доступ к pricing/districts |
| OG image fallback (favicon) | `BaseLayout.astro` | Базовый og:image для соцсетей |
| `src/content.ts` aggregator | `src/content.ts` | Централизованный `getCollection()` |
| `src/util/` (4 utility files) | `src/util/` | slug, groupByCategory, pageType helpers |
| Navbar `aria-current` | `Navbar.astro` | А11y: подсветка активного раздела |
| 404 page improved | `404.astro` | Полноценная страница 404 |
| `public/_redirects` | `public/_redirects` | SEO-редиректы (Cloudflare формат) |
| Trailing slash во всех ссылках | 8 файлов | Единый формат URL |
| `.bak` files removed | `src/pages/checkup/`, `src/pages/services/` | Очистка после конвертации |
| `.gitignore` добавлен | `live/.gitignore` | Исключение node_modules/ из коммита |

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
