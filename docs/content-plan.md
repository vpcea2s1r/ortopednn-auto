# Content Plan — ortopednn.ru

## Queue

| # | Topic | Status | Date |
|---|-------|--------|------|
| 1 | Протезирование нижних зубов: виды протезов | ✅ draft | 2026-05-23 |
| 2 | TBD | pending | |

## Sources
- `data/scraped-topics.json` — 25 ortho pages from 3 competitors
- Manual additions

## Priority
1. Missing topics (compare with `src/pages/blog/`)
2. High-frequency queries
3. Competitor FAQ topics

## Approval Flow (двухэтапный)

1. **Генерация** — `scripts/generator.js` → `data/drafts/`
2. **Предпросмотр** — агент показывает автору полный текст статьи
3. **Решение 1** — автор говорит "на тест" или "нет"
4. **Тестовый домен** → `C:\opencode\stomatolog\src\pages\blog\` → пуш в `vpcea2s1r/stomatolog` → `stomatolog.ortopednn.ru`
5. **Проверка на тесте** — автор смотрит live-версию на тестовом домене
6. **Решение 2** — автор говорит "в продакшен" или "правим"
7. **Релиз** → `src/pages/blog/` + `blog/index.astro` → пуш в `vpcea2s1r/ortopednn-auto` → `ortopednn.ru`

Статья никогда не попадает на live без явного одобрения автора на каждом этапе.
