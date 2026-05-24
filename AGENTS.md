# AGENTS.md вЂ” ortopednn project

## Project Context
- **LIVE-РєРѕРґ (Astro):** `C:\opencode\ortopednn-auto\` вЂ” Astro SSG, РґРµРїР»РѕРёС‚СЃСЏ РЅР° GitHub Pages
- **РњРЅРѕРіРѕСЃР°Р№С‚РѕРІР°СЏ Р°СЂС…РёС‚РµРєС‚СѓСЂР°:** `docs/architecture.md` вЂ” РєР°Рє РјР°С€С‚Р°Р±РёСЂРѕРІР°С‚СЊ РїСЂРѕРµРєС‚ РЅР° РЅРµСЃРєРѕР»СЊРєРѕ РґРѕРјРµРЅРѕРІ (ortopednn.ru, stomatolog.ortopednn.ru, Рё РґСЂ.)
- **VPS:** `94.183.155.147` вЂ” root, Docker (`ortopednn-bot` РєРѕРЅС‚РµР№РЅРµСЂ), Ubuntu 24.04
- **Р‘РѕС‚ РЅР° VPS:** `server/` вЂ” Docker compose, polling mode, РїРѕСЂС‚ 3000
- **Telegram fix:** `extra_hosts: api.telegram.org в†’ 149.154.167.220` РІ docker-compose.yml (Р±Р»РѕРєРёСЂРѕРІРєР° Telegram РІ Р Р¤)
- **Docker registry mirror:** `mirror.gcr.io` РІ `/etc/docker/daemon.json`
- **РҐРѕСЃС‚РёРЅРі Р±РѕС‚Р°:** `docs/hosting.md` вЂ” РґРѕРєСѓРјРµРЅС‚Р°С†РёСЏ РїРѕ РїРѕСЂС‚РёСЂРѕРІР°РЅРёСЋ Р±РѕС‚Р°
- **Р РµРїРѕР·РёС‚РѕСЂРёР№:** `github.com/vpcea2s1r/ortopednn-auto`
- **РЎС‚Р°СЂС‹Р№ СЂРµРїРѕР·РёС‚РѕСЂРёР№ (Next.js):** `C:\opencode\ortopednn\` вЂ” СѓСЃС‚Р°СЂРµРІС€РёР№ РєРѕРґ, РќР• РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РЅР° live, РїРѕРґР»РµР¶РёС‚ СѓРґР°Р»РµРЅРёСЋ
- **РўРµСЃС‚РѕРІС‹Р№ РїРѕРґРґРѕРјРµРЅ (Astro):** `C:\opencode\stomatolog\` вЂ” stomatolog.ortopednn.ru (GitHub Pages)
- **Layero Р±РѕР»СЊС€Рµ РЅРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ** вЂ” РґРµРїР»РѕР№ С‡РµСЂРµР· GitHub Pages
- Dentist prosthodontist site вЂ” РќРёРєРёС‚РёРЅР° Рњ.Р“., РќРёР¶РЅРёР№ РќРѕРІРіРѕСЂРѕРґ
- TypeScript, Tailwind CSS v4

## Critical Rule: LIVE-first development
1. **РљРѕРґ СЂРµРїРѕР·РёС‚РѕСЂРёСЏ РќР• СЂР°РІРµРЅ live-СЃР°Р№С‚Сѓ** вЂ” РІСЃРµРіРґР° РїСЂРѕРІРµСЂСЏС‚СЊ https://ortopednn.ru РїРµСЂРµРґ РІС‹РІРѕРґР°РјРё Рё РёР·РјРµРЅРµРЅРёСЏРјРё
2. **РџРµСЂРµРґ Р»СЋР±С‹Рј РґРµР№СЃС‚РІРёРµРј** вЂ” СЃРґРµР»Р°С‚СЊ `webfetch` РЅР° 2-3 РєР»СЋС‡РµРІС‹С… СЃС‚СЂР°РЅРёС†С‹ live-СЃР°Р№С‚Р° (РіР»Р°РІРЅР°СЏ + С†РµР»РµРІРѕР№ СЂР°Р·РґРµР»), С‡С‚РѕР±С‹ РїРѕРЅСЏС‚СЊ С‚РµРєСѓС‰РµРµ СЃРѕСЃС‚РѕСЏРЅРёРµ
3. **РџРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ С€Р°РіР°** вЂ” РѕР±РЅРѕРІРёС‚СЊ РёРЅС„Рѕ-С„Р°Р№Р»С‹ (AGENTS.md, yandex.md, etc.) СЃ Р°РєС‚СѓР°Р»СЊРЅС‹РјРё РґР°РЅРЅС‹РјРё СЃ live
4. **РџСЂРё РѕР±РЅР°СЂСѓР¶РµРЅРёРё СЂР°СЃС…РѕР¶РґРµРЅРёСЏ** РјРµР¶РґСѓ РєРѕРґРѕРј Рё live вЂ” С„РёРєСЃРёСЂРѕРІР°С‚СЊ С‚Р°Р±Р»РёС†Сѓ СЂР°СЃС…РѕР¶РґРµРЅРёР№ Рё РїСЂРµРґР»Р°РіР°С‚СЊ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЋ
5. **РџРµСЂРµРґ commit/push** вЂ” РїСЂРѕРІРµСЂРёС‚СЊ РЅРµ Р·Р°С‚СЂС‘С‚ Р»Рё СЃС‚Р°СЂС‹Р№ РєРѕРґ Р°РєС‚СѓР°Р»СЊРЅС‹Р№ РєРѕРЅС‚РµРЅС‚ СЃ live
6. **РљРѕРґРёСЂРѕРІРєР° UTF-8 РІСЃРµРіРґР°** вЂ” РїСЂРё push С‡РµСЂРµР· GitHub API: С‡РёС‚Р°С‚СЊ С„Р°Р№Р» С‡РµСЂРµР· `[System.IO.File]::ReadAllBytes`, РєРѕРґРёСЂРѕРІР°С‚СЊ РІ base64, РќР• РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `Get-Content` (Р»РѕРјР°РµС‚ UTF-8). РџРµСЂРµРґ push РїСЂРѕРІРµСЂСЏС‚СЊ: `[System.Text.Encoding]::UTF8.GetString($bytes)` вЂ” СЂСѓСЃСЃРєРёР№ С‚РµРєСЃС‚ РґРѕР»Р¶РµРЅ С‡РёС‚Р°С‚СЊСЃСЏ.

## Available Skills

22 skills from `addyosmani/agent-skills` at `.opencode/skills/<name>/SKILL.md`.
Use `skill` tool to load them. Flow:

```
  DEFINE       PLAN        BUILD       VERIFY      REVIEW       SHIP
idea-refine в†’ planning в†’ incremental в†’ test в†’ code-review в†’ shipping
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

## 9Router вЂ” AI Router & Token Saver

9Router вЂ” РїСЂРѕРєСЃРё РґР»СЏ AI-РїСЂРѕРІР°Р№РґРµСЂРѕРІ (40+), СЃ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРј fallback Рё RTK-СЃР¶Р°С‚РёРµРј С‚РѕРєРµРЅРѕРІ.

### Р—Р°РїСѓСЃРє

```powershell
cd C:\opencode\ortopednn\9router
.\start.ps1
```

Dashboard: http://localhost:20128 (РїР°СЂРѕР»СЊ: `123456`)

## Project Goal & Status

**Goal:** РџСЂРѕРґРІРёР¶РµРЅРёРµ ortopednn.ru (РќРёРєРёС‚РёРЅР° Рњ.Р“., СЃС‚РѕРјР°С‚РѕР»РѕРі-РѕСЂС‚РѕРїРµРґ) РІ РўРћРџ-1 РЇРЅРґРµРєСЃР° РїРѕ РќРёР¶РЅРµРјСѓ РќРѕРІРіРѕСЂРѕРґСѓ.

### Constraints (Р°РєС‚СѓР°Р»СЊРЅС‹Рµ)
- **Deploy:** GitHub Pages (static SSG). Cloudflare РЅРµ РёСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ (Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ РІ Р Р¤).
- **Telegram-Р±РѕС‚ РґР»СЏ SEO РјРѕРЅРёС‚РѕСЂРёРЅРіР°:** `@ortopednn_bot` вЂ” chat_id: `45185475` (Р®СЂРёР№)
- **Telegram РєРѕРЅС‚Р°РєС‚:** `t.me/nikitina_ortoped` вЂ” РїСЂРёСЃСѓС‚СЃС‚РІСѓРµС‚ РЅР° СЃС‚СЂР°РЅРёС†Р°С… СѓСЃР»СѓРі
- РќРµС‚ РѕС‚РґРµР»СЊРЅРѕР№ СЃС‚СЂР°РЅРёС†С‹ "Р—Р°РїРёСЃР°С‚СЊСЃСЏ" вЂ” С‚РѕР»СЊРєРѕ С‚РµР»РµС„РѕРЅ
- Р”РѕРєС‚РѕСЂ вЂ” РЅР°С‘РјРЅС‹Р№ СЂР°Р±РѕС‚РЅРёРє (РЅРµ РІР»Р°РґРµР»РµС† РєР»РёРЅРёРєРё)
- Р¦РµРЅС‹ СѓРґР°Р»РµРЅС‹ РёР· ortopednn.ru/services/ (РїРѕ Р·Р°РїСЂРѕСЃСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ)

### Google OAuth (Search Console API)

| РџР°СЂР°РјРµС‚СЂ | Р—РЅР°С‡РµРЅРёРµ |
|----------|----------|
| Scope | `https://www.googleapis.com/auth/webmasters` |
| Status | вњ… Site verified, sitemap submitted (0 errors, 0 warnings) |
| GSC properties | `https://ortopednn.ru/` (URL-prefix) + `sc-domain:ortopednn.ru` (domain) вЂ” siteOwner |
| Refresh rotation | Test user auth expires every 7 days |
| Credentials file | `C:\opencode\ortopednn-auto\google-oauth.md` |

### Yandex OAuth (Webmaster API)

| РџР°СЂР°РјРµС‚СЂ | Р—РЅР°С‡РµРЅРёРµ |
|----------|----------|
| Token expires | ~161 РґРЅРµР№ (2026-10-31) |
| Scope | `webmaster:hostinfo` + `webmaster:verify` |
| User ID (РЇРЅРґРµРєСЃ) | `156937890` |
| Credentials file | `C:\opencode\ortopednn-auto\google-oauth.md` |

### GitHub Secrets (Telegram Bot)

Secrets stored in GitHub repo Secrets + VPS `/opt/ortopednn-auto/server/.env`.

| Secret | РќР°Р·РЅР°С‡РµРЅРёРµ |
|--------|------------|
| `TELEGRAM_BOT_TOKEN` | РўРѕРєРµРЅ Р±РѕС‚Р° `@ortopednn_bot` |
| `TELEGRAM_CHAT_ID` | Р§Р°С‚ Р®СЂРёСЏ РґР»СЏ СѓРІРµРґРѕРјР»РµРЅРёР№ |
| `GH_PAT` | GitHub Personal Access Token |

### LIVE-СЃР°Р№С‚ (ortopednn.ru) вЂ” СЃС‚СЂСѓРєС‚СѓСЂР° (2026-05-23)

**Sitemap:** `sitemap-index.xml` в†’ `sitemap-0.xml`, РІСЃРµРіРѕ **111 URLs** (0 errors)

| Р Р°Р·РґРµР» | РљРѕР»-РІРѕ | РћРїРёСЃР°РЅРёРµ |
|--------|--------|---------|
| `/` | 1 | Р“Р»Р°РІРЅР°СЏ СЃ FAQ, РєРѕРЅС‚Р°РєС‚Р°РјРё |
| `/about/` | 1 | Рћ РІСЂР°С‡Рµ |
| `/blog/` | 1 + **11 СЃС‚Р°С‚РµР№** | Р‘Р»РѕРі (РІРєР»СЋС‡Р°СЏ РЅРѕРІСѓСЋ: Р±РѕР»РёС‚ Р·СѓР± РїРѕРґ РєРѕСЂРѕРЅРєРѕР№) |
| `/compare/` | 1 | РЎСЂР°РІРЅРµРЅРёРµ РєРѕРЅСЃС‚СЂСѓРєС†РёР№ |
| `/materials/` | 1 | РњР°С‚РµСЂРёР°Р»С‹ |
| `/services/` | 1 + **62 СѓСЃР»СѓРіРё** | РЈСЃР»СѓРіРё СЃ РѕРїРёСЃР°РЅРёРµРј (С†РµРЅС‹ СѓРґР°Р»РµРЅС‹) |

### Astro Features (current config)

| Feature | Status | Config location |
|---------|--------|-----------------|
| Output: static | вњ… | `astro.config.mjs` |
| Astro 6 | вњ… | `package.json: astro@^6.0.0` |
| Rust compiler | вњ… | `experimental.rustCompiler: true` вЂ” СЃР±РѕСЂРєР° 10.44s |
| SVG optimizer | вњ… | `experimental.svgOptimizer: svgoOptimizer()` |
| Fonts API (Inter) | вњ… | `fonts` config + `<Font cssVariable="--font-inter" preload/>` |
| View Transitions | вњ… | `<ClientRouter />` РІ `BaseLayout.astro` |
| `@astrojs/sitemap` | вњ… | `astro.config.mjs` |
| Content Collections v2 (`file()` loader) | вњ… | `src/content/config.ts` |
| OG image fallback (favicon) | вњ… | `src/layouts/BaseLayout.astro` |

### Pricing Data

- **Р”Р°РЅРЅС‹Рµ:** `data/pricing.json` (РЅРµ С‚СЂРѕРЅСѓС‚С‹)
- **РЎРїРёСЃРѕРє СѓСЃР»СѓРі:** `src/pages/services/index.astro` вЂ” С†РµРЅС‹ СѓРґР°Р»РµРЅС‹
- **РРЅРґРёРІРёРґСѓР°Р»СЊРЅС‹Рµ СЃС‚СЂР°РЅРёС†С‹:** `src/pages/services/*.astro` вЂ” С†РµРЅС‹ СѓРґР°Р»РµРЅС‹ (ServiceArticle: price-Р±Р°РґР¶, material-price, stat-card__value, inline С†РµРЅС‹)
- **Р“Р»Р°РІРЅР°СЏ:** С†РµРЅС‹ СѓРґР°Р»РµРЅС‹
- **РљРѕРјРїРѕРЅРµРЅС‚:** `ServiceArticle.astro` вЂ” СѓРґР°Р»РµРЅС‹ price РёР· Props, price-Р±Р°РґР¶, Product schema, CSS

### Next Steps

1. **Google Search Console** вЂ” РІРµСЂРёС„РёС†РёСЂРѕРІР°С‚СЊ ortopednn.ru (HTML tag) РґР»СЏ РґРѕСЃС‚СѓРїР° Рє API
2. **Interactive Telegram Bot** вЂ” РґРѕР±Р°РІРёС‚СЊ РєРѕРјР°РЅРґС‹ `/check`, `/ssl`, `/perf`, `/stats` (GitHub Actions в†’ Telegram)
2. **РЇРЅРґРµРєСЃ.Р’РµР±РјР°СЃС‚РµСЂ РёРЅС‚РµРіСЂР°С†РёСЏ** вЂ” вњ… OAuth-С‚РѕРєРµРЅ РїРѕР»СѓС‡РµРЅ (2026-05-22). РџСЂР°РІР°: webmaster:hostinfo + webmaster:verify. РњРѕР¶РЅРѕ РґРѕР±Р°РІРёС‚СЊ РїСЂР°РІР° Yandex.Direct API
3. **Core Web Vitals** вЂ” СЂРµР°Р»СЊРЅС‹Рµ LCP/CLS/INP С‡РµСЂРµР· CrUX API
4. **РђР»РµСЂС‚С‹ СЂРµР°Р»СЊРЅРѕРіРѕ РІСЂРµРјРµРЅРё** вЂ” РјРіРЅРѕРІРµРЅРЅС‹Р№ Telegram РїСЂРё РїР°РґРµРЅРёРё perf < 50 РёР»Рё Р±РёС‚С‹С… СЃСЃС‹Р»РєР°С…
5. **Weekly digest** вЂ” РґРёРЅР°РјРёРєР° РјРµС‚СЂРёРє Р·Р° РЅРµРґРµР»СЋ
6. **Р‘РµРЅС‡РјР°СЂРє РєРѕРЅРєСѓСЂРµРЅС‚РѕРІ** вЂ” СЃСЂР°РІРЅРµРЅРёРµ perf/seo СЃ РєРѕРЅРєСѓСЂРµРЅС‚Р°РјРё
7. **РЈРґР°Р»РёС‚СЊ `C:\opencode\ortopednn`** (СЃС‚Р°СЂС‹Р№ Next.js СЂРµРїРѕР·РёС‚РѕСЂРёР№) вЂ” РїРѕСЃР»Рµ РїРѕРґС‚РІРµСЂР¶РґРµРЅРёСЏ
8. **Р РµРґРёР·Р°Р№РЅ stomatolog.ortopednn.ru** вЂ” РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РЅРµ РґРѕРІРѕР»РµРЅ С‚РµРєСѓС‰РёРј РґРёР·Р°Р№РЅРѕРј

## Telegram SEO Monitor Bot (`@ortopednn52_bot`)

Р‘РѕС‚ СЂР°Р±РѕС‚Р°РµС‚ РЅР° VPS (94.183.155.147) РІ Docker-РєРѕРЅС‚РµР№РЅРµСЂРµ, polling mode, РїРѕСЂС‚ 3000.

### Р§С‚Рѕ СѓРјРµРµС‚ СЃРµР№С‡Р°СЃ
- **РРЅР»Р°Р№РЅ-РјРµРЅСЋ** (`/menu`): РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ, Р§РµСЂРЅРѕРІРёРєРё, PubMed-СЂРµСЂР°Р№С‚
- `/perf` вЂ” Lighthouse + CrUX (PageSpeed API, Р±РµР· РєР»СЋС‡Р°)
- `/research <С‚РµРјР°>` вЂ” РїРѕРёСЃРє PubMed, inline-РІС‹Р±РѕСЂ СЃС‚Р°С‚СЊРё в†’ СЂРµСЂР°Р№С‚ в†’ С‡РµСЂРЅРѕРІРёРє
- `/drafts` вЂ” С‡РµСЂРЅРѕРІРёРєРё СЃ inline-РєРЅРѕРїРєР°РјРё: РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ (в†’ stomatolog.ortopednn.ru) / СѓРґР°Р»РёС‚СЊ
- **URL-СЂРµСЂР°Р№С‚** вЂ” РєРёРґР°РµС€СЊ СЃСЃС‹Р»РєСѓ в†’ Р±РѕС‚ С‡РёС‚Р°РµС‚, AI РїРµСЂРµРїРёСЃС‹РІР°РµС‚ РґР»СЏ Р±Р»РѕРіР° в†’ С‡РµСЂРЅРѕРІРёРє
- **Daily cron** (8:00 MSK) вЂ” СЃР±РѕСЂ СЃС‚Р°С‚РёСЃС‚РёРєРё GSC + РЇРЅРґРµРєСЃ РІ SQLite
- **Polling** (РєР°Р¶РґС‹Рµ 10СЃ) вЂ” РїРѕСЂС‚ 3000, healthcheck

### РР·РІРµСЃС‚РЅС‹Рµ РїСЂРѕР±Р»РµРјС‹
- РџРѕСЃР»Рµ РїРµСЂРµР·Р°РїСѓСЃРєР° РєРѕРЅС‚РµР№РЅРµСЂР° offset СЃР±СЂР°СЃС‹РІР°РµС‚СЃСЏ (РїРѕС‚РѕРєРѕРІС‹Рµ РѕР±РЅРѕРІР»РµРЅРёСЏ РјРѕРіСѓС‚ С‚РµСЂСЏС‚СЊСЃСЏ). РСЃРїСЂР°РІРёС‚СЊ: С…СЂР°РЅРёС‚СЊ offset РІ SQLite.
- inline-РєРЅРѕРїРєРё РјРµРЅСЋ РјРѕРіСѓС‚ РЅРµ СЃСЂР°Р±Р°С‚С‹РІР°С‚СЊ РµСЃР»Рё Р±РѕС‚ РЅРµ РїРѕР»СѓС‡РёР» callback_query (РїСЂРѕРІРµСЂРёС‚СЊ С‡РµСЂРµР· docker logs).
- SSH Рє VPS РЅРµРґРѕСЃС‚СѓРїРµРЅ РёР· РЅРµРєРѕС‚РѕСЂС‹С… СЂРµРіРёРѕРЅРѕРІ вЂ” СѓРїСЂР°РІР»РµРЅРёРµ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· docker exec.

### РљРѕРјР°РЅРґС‹ Р±РѕС‚Р°
| РљРѕРјР°РЅРґР° | РЎС‚Р°С‚СѓСЃ | РћРїРёСЃР°РЅРёРµ |
|---------|--------|----------|
| `/perf` | вњ… | Lighthouse + CrUX PageSpeed |
| `/research` | вњ… | РџРѕРёСЃРє PubMed + AI СЂРµСЂР°Р№С‚ |
| `/menu` | вњ… | РРЅР»Р°Р№РЅ-РјРµРЅСЋ |
| `/drafts` | вњ… | Р§РµСЂРЅРѕРІРёРєРё (РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ/СѓРґР°Р»РёС‚СЊ) |
| `/ssl` | вќЊ | РЎРєРѕР»СЊРєРѕ РґРЅРµР№ РґРѕ РёСЃС‚РµС‡РµРЅРёСЏ СЃРµСЂС‚РёС„РёРєР°С‚Р° |
| `/stats` | вќЊ | РЇРЅРґРµРєСЃ.Р’РµР±РјР°СЃС‚РµСЂ СЃС‚Р°С‚РёСЃС‚РёРєР° |
| `/digest` | вќЊ | Weekly digest РїРѕ РґРёРЅР°РјРёРєРµ РјРµС‚СЂРёРє |

## Writing Rules (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ РґР»СЏ РІСЃРµС…)

**РСЃС‚РѕС‡РЅРёРє:** https://github.com/Anbeeld/WRITING.md вЂ” СЃРєРёР»Р» `writing` РІ `~/.config/opencode/skills/writing/`

Р’СЃРµ РїСЂР°РІРёР»Р° WRITING.md РѕР±СЏР·Р°С‚РµР»СЊРЅС‹ РїСЂРё РЅР°РїРёСЃР°РЅРёРё Р»СЋР±РѕРіРѕ С‚РµРєСЃС‚Р° РґР»СЏ РїСѓР±Р»РёС‡РЅРѕРіРѕ РїСЂРѕСЃРјРѕС‚СЂР° (СЃС‚Р°С‚СЊРё, Р±Р»РѕРі, SEO-РєРѕРїРёСЂР°Р№С‚РёРЅРі, UI-С‚РµРєСЃС‚С‹, email). РќРµ РїСЂРёРјРµРЅСЏСЋС‚СЃСЏ С‚РѕР»СЊРєРѕ Рє РєРѕРјРјРµРЅС‚Р°СЂРёСЏРј РІ РєРѕРґРµ, commit message Рё Р»РёС‡РЅС‹Рј Р·Р°РјРµС‚РєР°Рј.

РљСЂР°С‚РєРѕ (WRITING-mini):
- РџРёС€Рё РґР»СЏ РєРѕРЅС‚РµРєСЃС‚Р°: medium, Р°СѓРґРёС‚РѕСЂРёСЏ, Р·Р°РґР°С‡Р° С‚РµРєСЃС‚Р°. РџСЂРё РєРѕРЅС„Р»РёРєС‚Рµ: РїСЂР°РІРґР° > РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ > Р¶Р°РЅСЂ > РїСЂР°РІРёР»Р°.
- РљР°Р¶РґС‹Р№ Р°Р±Р·Р°С† вЂ” РѕРґРЅР° РєРѕРЅРєСЂРµС‚РёРєР° (РёРјСЏ, С‡РёСЃР»Рѕ, С†РёС‚Р°С‚Р°, РґРµС‚Р°Р»СЊ). many/various/essentially вЂ” РЅРµ СЃС‡РёС‚Р°СЋС‚СЃСЏ.
- РџСЂРѕСЃС‚С‹Рµ СЃР»РѕРІР° Рё РіР»Р°РіРѕР»С‹. РџРѕРІС‚РѕСЂСЏР№ РѕР±С‹С‡РЅС‹Рµ СЃР»РѕРІР°. РЎРІСЏР·С‹РІР°Р№ РјРµСЃС‚РѕРёРјРµРЅРёСЏРјРё Рё С„РѕСЂРјРѕР№ РїСЂРµРґР»РѕР¶РµРЅРёСЏ, РЅРµ furthermore/moreover. РўРµСЃРЅС‹Рµ РјС‹СЃР»Рё вЂ” РІ РѕРґРЅРѕ РїСЂРµРґР»РѕР¶РµРЅРёРµ.
- Р‘РµР· РєР»СЋС‡РµРІС‹С… СЂРµС‡РµР№, Great question, I hope this helps. РќР°С‡РёРЅР°Р№ СЃ РѕС‚РІРµС‚Р°, Р·Р°РєР°РЅС‡РёРІР°Р№ РѕС‚РІРµС‚РѕРј.
- РР·Р±РµРіР°Р№ РїРѕРІС‚РѕСЂСЏСЋС‰РёС…СЃСЏ РїР°С‚С‚РµСЂРЅРѕРІ: parallel lists, concession rhythm (not X, but Y), stacked mini-sentences, РѕРґРёРЅР°РєРѕРІС‹Рµ РґСѓРіРё Р°Р±Р·Р°С†РµРІ.
- Р”Р»РёРЅРЅР°СЏ С„РѕСЂРјР°: СЃРєРІРѕР·РЅР°СЏ С‚РµРјР° (С‚РµРјР°С‚РёС‡РµСЃРєР°СЏ, РїРµСЂСЃРїРµРєС‚РёРІРЅР°СЏ, РїСЂРёРјРµСЂ-РІРµРґРѕРјР°СЏ), РЅРµ С…СЂРѕРЅРѕР»РѕРіРёСЏ. Р’РєР»СЋС‡Рё РїСЂРёРјРµСЂ, РЅР°РєРѕРїРёС‚РµР»СЊРЅРѕРµ РїСЂРµРґР»РѕР¶РµРЅРёРµ, РїР°СѓР·Сѓ.
- Р РµРґР°РєС‚РёСЂСѓР№ РІС‹СЂРµР·Р°РЅРёРµРј. РќРµ СЂР°Р·СЂС‹РІР°Р№ СЃРІСЏР·Р°РЅРЅС‹Рµ РјС‹СЃР»Рё. Р‘РµР· СЌРј-С‚РёСЂРµ, РµСЃР»Рё РЅРµ РѕРїСЂР°РІРґР°РЅРѕ. Р‘РµР· fake humanity. РќРµ СѓР±РёСЂР°Р№ СЃС‚СЂСѓРєС‚СѓСЂСѓ СЂР°РґРё СЃС‚РёР»СЏ.
- РџСЂРѕРІРµСЂРєР°: СЂРµРіРёСЃС‚СЂ, СЏРєРѕСЂСЏ, СЂРµРіСѓР»СЏСЂРЅРѕСЃС‚СЊ, РїРѕР·РёС†РёСЏ, РїРµСЂРµРєРѕСЂСЂРµРєС†РёСЏ. РЎРјРѕС‚СЂРµС‚СЊ (РЅРµ Р·Р°РїСЂРµС‚): delve/leverage/seamless, it's important to note, unnamed experts, unsupported causality.

РЎРєРёР»Р» РїРѕРґРіСЂСѓР¶Р°РµС‚СЃСЏ С‡РµСЂРµР· `skill` tool РїРѕ С‚СЂРёРіРіРµСЂСѓ "writing".

## Setup After Clone

```powershell
# Recreate skills junction
git submodule update --init --recursive
New-Item -ItemType Junction -Path ".opencode\skills" -Target "..\skills\addy-skills\skills"

# 9router setup (РµСЃР»Рё РЅРµ СЂР°Р±РѕС‚Р°РµС‚)
cd 9router
npm install
$env:NODE_ENV="production"; npx next build --webpack
.\start.ps1
```
