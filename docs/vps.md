# VPS и SOCKS-прокси (актуально 2026-08-16)

## Сервер

| Параметр | Значение |
|----------|----------|
| IP | `185.245.34.155` |
| Логин | `root` |
| Пароль | `ma4BNRV4` |
| Протокол | SSH (порт 22) |
| ОС | Ubuntu 22.04.5 LTS, 1 CPU, 956 MB RAM, диск 8.8 GB (занято 78%) |
| Uptime | ~8 дней, load avg 1.0 |

⚠️ Старый сервер `94.183.155.147` переустановлен/перевыделен (host key сменился, пароль и ключи не подходят, Docker-стек отсутствует). Весь стек (бот/n8n/admin) на новый сервер ещё НЕ перенесён.

## Docker-контейнеры (на 185.245.34.155)

| Контейнер | Образ | Статус | Порты |
|-----------|-------|--------|-------|
| amnezia-socks5proxy | amnezia-socks5proxy (3proxy 0.9.5) | Up 7 days | 0.0.0.0:49187→49187/tcp |
| amnezia-awg2 | amnezia-awg2 (AmneziaWG / WireGuard) | Up 6 days | 0.0.0.0:36506→36506/udp |

## SOCKS5-прокси (3proxy, внутри amnezia-socks5proxy)

| Параметр | Значение |
|----------|----------|
| Протокол | SOCKS5 (`socks -p49187` в конфиге) |
| Адрес | `185.245.34.155:49187` |
| Логин | `proxy_user` |
| Пароль | `CEWjuOv3EWttIoDp` |
| Auth | `auth strong` (требуется логин/пароль) |
| Конфиг | `/usr/local/3proxy/conf/3proxy.cfg` в контейнере |
| Лог | `/usr/local/3proxy/logs/3proxy.log` (JSON, включая CONNECT запросы) |

Пример использования:
```
curl -x socks5h://proxy_user:CEWjuOv3EWttIoDp@185.245.34.155:49187 https://example.com
```

Прокси работает: example.com и google.com через него возвращают 200.
Назначение: исходящий трафик уходит через AmneziaWG-туннель (awg0, подсеть 10.8.1.0/24) — используется для обхода блокировок (Telegram, Reddit, китайские сайты).

## Cloudflare DNS

| Запись | Контент | Прокси |
|--------|---------|--------|
| A admin.ortopednn.ru | 185.245.34.155 | ❌ off (обновлено 2026-08-16 с 94.183.155.147) |

## Система

- Docker Engine (docker.service) — active running
- fail2ban (sshd jail) — active
- ssh — active
- nginx/apache НЕ установлены (веб-сервер для admin.ortopednn.ru ещё не поднят)