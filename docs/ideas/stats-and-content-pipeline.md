# Plan: Statistics Collection + Dzen Content Pipeline

## Overview
Расширить сбор статистики (GSC + Yandex Webmaster + Metrika) и запустить AI-пайплайн генерации статей для Дзен с привязкой к поисковым запросам.

## Architecture
- VPS: `server/collector.js` (GSC + Yandex) → SQLite `data/stats/stats.db`
- Bot: `server/bot.js` → `/stats` command, daily/weekly digest
- Dzen: RSS `/rss-dzen.xml` + AI generation pipeline
- Cron: daily 8:00 stats, weekly Monday digest

## Task List

### Phase 1: Stats Foundation
- [ ] Task 1: Add `collectMetrika(db)` to collector.js (Yandex.Metrika API)
- [ ] Task 2: Add `keyword_positions` table (daily Wordstat tracking)
- [ ] Task 3: Add `cwv_snapshots` table (weekly CrUX)

### Phase 2: Bot Dashboard
- [ ] Task 4: Add `/stats` command to bot.js
- [ ] Task 5: Daily digest (9:00 MSK)
- [ ] Task 6: Weekly digest (Monday 10:00 MSK)

### Phase 3: Dzen Content Pipeline
- [ ] Task 7: AI topic selection (Wordstat gaps + GSC positions 5-20)
- [ ] Task 8: Dzen article generator (4-5k chars, structure)
- [ ] Task 9: Humanizer-ru integration
- [ ] Task 10: Telegram review flow

### Phase 4: Query-to-Content Loop
- [ ] Task 11: GSC queries → article mapping
- [ ] Task 12: Auto-edit proposals for articles in positions 5-20
- [ ] Task 13: CTR analysis (low CTR → title rewrite)

### Phase 5: Distribution
- [ ] Task 14: Auto-post to Telegram channel after publish
- [ ] Task 15: Dzen RSS auto-submit after new article
- [ ] Task 16: OK/VK registration (later)

## Risks
| Risk | Mitigation |
|------|------------|
| Metrika API needs new OAuth scope | User must update app in Yandex OAuth |
| GSC token expired | User must refresh via OAuth Playground |
| AI articles may not match Dzen quality | humanizer-ru + manual review |
| Wordstat API rate limits | Cache results, don't over-query |
