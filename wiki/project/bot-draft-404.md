# Bot draft 404 fix

## Проблема

Черновики от автопайплайна (`repo: ortopednn-auto`) сохраняются только локально на VPS и **не пушатся** на stomatolog.ortopednn.ru. Бот показывал ссылку `stomatolog.ortopednn.ru/blog/<slug>.html` для всех черновиков, но для pipeline-драфтов файл не существует — 404.

## Причина

- `rewrite()` (серый канал URL/PubMed) → `pushToStomatolog()` → пушит HTML в репо stomatolog → URL работает
- `draftAgent()` (автопайплайн 7:00) → сохраняет .astro + .meta.json локально → **не пушит** на stomatolog

Бот в `/drafts` показывал stomatolog-ссылку для всех драфтов одинаково.

## Фикс v1 (временный)

`server/bot.js` — `/drafts` handler: URL показывается только для черновиков БЕЗ `repo: ortopednn-auto`. Для пайплайн-драфтов — только название + дата + статус (На рассмотрении).

## Фикс v2 (2026-06-02) — preview 404

### Проблема

Pipeline-драфты возвращали в боте URL `ortopednn.ru/preview/<slug>/`. Но JSON черновика в `data/drafts/<slug>.json` репозитория ortopednn-auto не сохранялся — страница preview отдавала 404.

### Решение

В `server/bot.js` после пуша HTML в stomatolog добавлен push JSON в `data/drafts/<slug>.json` репозитория ortopednn-auto:

```
draftAgent() pipeline → stomatolog HTML push → ortopednn-auto JSON push
                              ↓                              ↓
                    stomatolog.ortopednn.ru          ortopednn.ru/preview/<slug>/
```

Используются функции `ghPut()`/`ghFetch()` из `agent-pipeline.js` (уже импортированы в bot.js).

### Развёртывание

```bash
cd /opt/ortopednn-auto
docker compose build --no-cache
docker compose down
docker compose up -d
```

### Проверка

```bash
curl http://localhost:3000/health
# Убедиться, что бот запущен
```

## Статус

✅ Health OK. Новые черновики pipeline будут доступны на `ortopednn.ru/preview/<slug>/`.
