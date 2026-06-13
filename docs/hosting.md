# Хостинг: Telegram-бот rewrite-bot

## 1. Текущая архитектура (GitHub Actions + GitHub API)

```
Пользователь → Telegram → GitHub Actions (каждые 15 мин) → обработать → ответ
                              ↓
                    GitHub API → commit + push → deploy на stomatolog
```

- Polling раз в 15 мин через `telegram-bot-poll.yml`
- Ответ приходит в пределах 15 минут
- Commit через git в GitHub Actions
- Deploy на stomatolog через GitHub API (PUT contents)
- Inline-кнопки "Опубликовать / Удалить" обрабатываются тем же polling-циклом

## 2. Почему GitHub Actions подходит

| Критерий | Оценка |
|----------|--------|
| Задержка | До 15 мин — приемлемо для асинхронной работы |
| Надёжность | GitHub 99.9% uptime |
| Цена | Бесплатно (2000 мин/мес на бесплатном плане) |
| Секреты | GitHub Secrets, никаких .env на сервере |
| Deploy | GitHub API напрямую в stomatolog |
| Мониторинг | Логи в Actions, уведомления через seo-monitor |

## 3. Webhook (опционально, если нужна скорость)

Если 15 минут ожидания не устраивают — добавить webhook:

```js
// webhook.js — отдельный процесс для GitHub Actions
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', async (req, res) => {
  const upd = req.body;
  if (upd) await handleUpdate(upd);
  res.sendStatus(200);
});

app.listen(3000);
```

Для работы webhook нужен публичный HTTPS-эндпоинт. GitHub Actions не предоставляет inbound — потребуется отдельный сервер только для webhook.

## 4. Миграция

### 4.1. Установить бота

Бот уже работает в GitHub Actions. Ничего устанавливать не нужно.

### 4.2. Если нужен постоянный процесс (необязательно)

```bash
# VPS (минимальный: 256MB RAM, Node.js 22)
git clone https://github.com/vpcea2s1r/ortopednn-auto.git
cd ortopednn-auto
npm install
pm2 start scripts/rewrite-bot.js --name bot
```

Тогда:
- Убрать `schedule` в `telegram-bot-poll.yml`, оставить только `workflow_dispatch`
- В workflow оставить шаги Commit + Deploy (бот на VPS сохраняет файлы → git push)

### 4.3. Без VPS — только GitHub Actions

Оставить как есть:
- `telegram-bot-poll.yml` с cron `*/15 * * * *`
- Бот работает в `--once` режиме
- Commit + Deploy в том же workflow

## 5. Безопасность

| Секрет | Где хранится | Доступ |
|--------|-------------|--------|
| `TELEGRAM_BOT_TOKEN` | GitHub Secrets → env | Только workflow |
| `GH_PAT` | GitHub Secrets → env | Только workflow |
| Google OAuth | GitHub Secrets | Только workflow |
| Yandex OAuth | GitHub Secrets | Только workflow |

## 6. Ограничения GitHub Actions

| Ограничение | Значение | Как обойти |
|-------------|----------|------------|
| Макс. время выполнения | 6 часов | AI запрос ~2 мин — ок |
| Макс. время одного step | Нет | rewrite-bot.js с abort(120s) |
| Задержка | До 15 мин | Webhook при необходимости |
| Нет inbound | GitHub не принимает запросы | Polling вместо webhook |
| Cache offset | `/tmp/bot_offset.txt` | Actions cache, живёт ~7 дней |

## 7. Что делать, если

| Ситуация | Решение |
|----------|---------|
| Offset сбросился | Перезапустить workflow — offset восстановится из cache |
| Бот не отвечает | Проверить Actions → последний run |
| Дебаг | В workflow добавить `echo` в step бота |
| Ошибка AI | Бот пришлёт сырой ответ AI (300 символов) |
| Дубликат | Бот пришлёт "⚠️ Дубликат" |
