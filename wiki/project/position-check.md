# Position Check Script

## Описание
Скрипт `scripts/check-positions.mjs` для проверки позиций сайта в Google и Яндексе.

## Возможности
- **GSC**: топ-20 запросов за 7 дней + позиции по 21 ключевому слову
- **Yandex Webmaster**: популярные запросы, количество проиндексированных страниц

## Использование
```bash
node scripts/check-positions.mjs
```

## Проблемы
- Google API недоступен из РФ (блокировка на уровне сети)
- Yandex API также недоступен с локальной машины
- **Запускать только на VPS** (94.183.155.147) через Docker:
  ```bash
  docker exec -it ortopednn-auto-bot-1 node /app/scripts/check-positions.mjs
  ```

## Креденшелы
- GSC: OAuth refresh token из AGENTS.md
- Yandex: OAuth-токен из AGENTS.md (истекает 2026-11-14)

## Связанные страницы
- [SEO-стратегия](seo-strategy.md)
- [Yandex Indexing](yandex-indexing.md)