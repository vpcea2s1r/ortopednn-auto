# Архитектура проекта

## Состав проекта
- **Astro 6** — статический SSG, деплой на GitHub Pages
- **Tailwind CSS v4** — стилизация
- **TypeScript** — типизация
- **Rust compiler** — `experimental.rustCompiler: true` (сборка ~28с)
- **@astrojs/sitemap** — генерация sitemap

## Репозиторий
- `github.com/vpcea2s1r/ortopednn-auto`
- Ветка: `master` (рабочая), `main` (устарела)

## SEO-инфраструктура
- Яндекс.Метрика: ID 109258289
- Google Analytics: UA-XXXX
- SEO.md в корне проекта (централизованный для всех проектов)
- AGENTS.md — правила для AI-агента

## Контент
- `data/blog-articles.ts` — список статей (slug, title, description, category, date)
- `src/pages/blog/*.astro` — статьи (каждая отдельным файлом)
- `data/drafts/` — черновики перед публикацией (review flow)
- `data/pricing.json` — цены (не используются на сайте, удалены по запросу)

## VPS
- 94.183.155.147
- Docker: Telegram бот (bot + n8n)
- Ubuntu 24.04

## Деплой
- GitHub Actions → GitHub Pages
- Sitemap: `sitemap-0.xml`
- `/preview/` excluded from sitemap
