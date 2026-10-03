# yandex-mcp: Вебмастер + Директ + Метрика как инструменты

## Что это

`C:\opencode\yandex-mcp` (форк `webkoth/yandex-mcp`) — MCP-сервер на 125 инструментов:
Вебмастер (52: сводка, запросы, индексация, диагностика, переобход, sitemap, ссылки),
Директ (46) и Метрика (25). Позволяет тянуть статистику запросами вместо браузера.

## Почему через прокси

Node с этой машины напрямую на хосты Яндекса не ходит (SNI-фильтрация канала,
проверено 2026-10-03: `api.webmaster.yandex.net`, `yandex.ru` — таймаут, Google — ок).
Python/curl/.NET проходят. Поэтому цепочка такая:

```
MCP (node) -> HTTP-прокси 127.0.0.1:8899 (python) -> SOCKS5 VPS 185.245.34.155:49187 -> api.yandex
```

Два обязательных условия, без которых `fetch failed`:
1. Форвардер запущен и слушает `127.0.0.1:8899`.
2. `NODE_OPTIONS=--use-env-proxy` — без этого флага node **игнорирует** `HTTP_PROXY`/`HTTPS_PROXY`.
   SOCKS напрямую в env node тоже игнорит, поэтому нужен HTTP-форвардер, а не `socks5h://` в env.

## Установка с нуля

```powershell
git clone https://github.com/webkoth/yandex-mcp C:\opencode\yandex-mcp
cd C:\opencode\yandex-mcp
npm install
npm run build   # должен появиться dist/index.js
```

Завести `projects.json` (gitignored, токены только сюда, никогда в репо):

```powershell
$t=(Select-String -Path C:\opencode\ortopednn-auto\scripts\.env -Pattern '^YANDEX_OAUTH=(.*)').Matches[0].Groups[1].Value.Trim()
$pj=@{projects=@(@{id='ortopednn';token=$t;default_host='https:ortopednn.ru:443';default_counter=109258289})}
[System.IO.File]::WriteAllText('C:\opencode\yandex-mcp\projects.json',($pj|ConvertTo-Json -Depth 4),(New-Object System.Text.UTF8Encoding $false))
```

Доступы: OAuth-токен — `scripts/.env` (`YANDEX_OAUTH`, scope `webmaster:hostinfo`);
SOCKS-логин/пароль — `docs/vps.md`. Счётчик Метрики ortopednn.ru: `109258289`.

## Запуск

Шаг 1 — форвардер (отдельное окно, висит фоном):

```powershell
python3 C:\Users\user\AppData\Local\Temp\opencode\fwd-proxy.py
# либо фоном: Start-Process python3 -ArgumentList '...\fwd-proxy.py' -WindowStyle Hidden
```

Проверка форвардера (ожидается `403` — это ответ API на пустой токен, значит сеть есть):

```powershell
curl.exe -s -o NUL -w "%{http_code}`n" -x http://127.0.0.1:8899 https://api.webmaster.yandex.net/v4/user/156937890/hosts/ -H "Authorization: OAuth x"
```

Шаг 2 — MCP-сервер с прокси-окружением:

```powershell
cd C:\opencode\yandex-mcp
$env:HTTP_PROXY='http://127.0.0.1:8899'
$env:HTTPS_PROXY='http://127.0.0.1:8899'
$env:NODE_OPTIONS='--use-env-proxy'
node dist/index.js   # stdio, висит и ждёт JSON-RPC
```

## Проверка вызовов

Готовый тестер: `C:\Users\user\AppData\Local\Temp\opencode\ymcp-test.py`
(tools/list + вызов; запуск с теми же env выше). Имена инструментов:

| Задача | Инструмент | Ключевые аргументы |
|---|---|---|
| Сводка сайта | `yandex_webmaster_summary_get` | `host_id: https:ortopednn.ru:443` |
| Топ запросов | `yandex_webmaster_search_queries_popular` | `host_id`, `date_from/to`, `query_indicator` |
| История индексации | `yandex_webmaster_indexing_history` | `host_id`, `date_from/to` |
| Диагностика | `yandex_webmaster_diagnostics_get` | `host_id` |
| Переобход URL | `yandex_webmaster_recrawl_submit` | `host_id`, `url` |
| Статистика Метрики | `yandex_metrika_stat_data` | `counter_id: 109258289`, `metrics`, `dimensions` |

## Траублшутинг

| Симптом | Причина и фикс |
|---|---|
| `fetch failed` | Нет флага `--use-env-proxy` или мёртв форвардер. Проверить: `curl -x http://127.0.0.1:8899 ...` |
| `403 / invalid token` | Протух OAuth-токен. Обновить в `scripts/.env` и пересоздать `projects.json` |
| `Connect Timeout ... :443` без прокси | Норма для этой машины — node напрямую к Яндексу не ходит, только через цепочку |
| `ChildProcess.kill` при `open` | Так agent-browser отвечает на долгоживущие команды — проверять результат следующим вызовом |
| SOCKS недоступен | Проверить VPS/3proxy: `docs/vps.md` |

## Статус 2026-10-03

Связь проверена end-to-end: `summary_get` вернул `searchable 353 / excluded 12 / SQI 10`.
Форвардер: `C:\Users\user\AppData\Local\Temp\opencode\fwd-proxy.py` (перезапускать после ребута).
Тестер: `C:\Users\user\AppData\Local\Temp\opencode\ymcp-test.py`.