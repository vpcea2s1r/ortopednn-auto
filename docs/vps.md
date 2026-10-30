# VPS и SOCKS-прокси (актуально 2026-10-29)

Доступы (пароль root, логин/пароль SOCKS5) — в gitignored `vpn-credentials.md`. В этом файле только публичная часть: адреса, порты, устройство стека.

## Сервер

| Параметр | Значение |
|----------|----------|
| IP | `185.219.7.36` (сменился 2026-10-29, старый `185.245.34.155` не отвечает) |
| Логин | `root` |
| Пароль | в gitignored `vpn-credentials.md` (в репозитории не хранится) |
| Протокол | SSH (порт 22) |
| ОС | Ubuntu 22.04.5 LTS, 1 CPU, 956 MB RAM, диск 8.8 GB (занято 82%) |
| Host key (ssh-ed25519) | `SHA256:r37xUbZtIRimfJevgFy0qR7Na9gXRLy/dHrvUyIbdrY` |

⚠️ История: `94.183.155.147` переустановлен, затем сервер переехал с `185.245.34.155` на `185.219.7.36` (данные VPN-стека сохранены: те же ключи и 22 пира). Бот живёт на GitHub Actions (`telegram-bot-poll.yml`). На этом VPS только VPN-стек — n8n, redis и admin НЕ развёрнуты (nginx/apache и node/npm отсутствуют).

## Docker-контейнеры (на 185.219.7.36)

| Контейнер | Образ | Статус | Порты |
|-----------|-------|--------|-------|
| amnezia-socks5proxy | amnezia-socks5proxy (3proxy 0.9.5) | Up | 0.0.0.0:49187→49187/tcp |
| amnezia-awg2 | amnezia-awg2 (AmneziaWG 2.0, tools 3.0.20260730) | Up | 0.0.0.0:36506→36506/udp |

Резервная копия конфигов: `/root/vpn-backup-20261029-1902.tar.gz` (awg0.conf, clientsTable, ключи, конфиг 3proxy).

## Миграция AmneziaWG 2.0 → 3.1 (в работе, 2026-10-29)

Решение пользователя: апгрейд делается **через приложение AmneziaVPN 5.0.3.0** (официальный путь), не скриптами.

Порядок по официальной документации (docs.amnezia.org → «Использование AmneziaWG на Self-hosted серверах»):

1. AmneziaWG 2.0 и 3.1 живут в одном контейнере — одновременно нельзя.
2. В приложении на сервере: протокол AmneziaWG → «Удалить», затем «Установить» заново (клиент 5.0.2.1+ ставит 3.1).
3. При удалении **все пользователи удаляются** — создать заново, конфиги выдать заново.
4. Параметры 3.1, которые генерирует клиент (`client/core/installers/awgInstaller.cpp`):
   `Jc 4–6, Jmin 10, Jmax 50, S1–S4 = 12, H1 = 1, H2 = 2, H3 = 3, H4 = 4`, `HeaderProtectionKey` (32 байта base64),
   `I1` = DNS-мусор, `RekeyAfterTime 100-120`, `RekeyTimeout 3-7`, `RejectAfterTime 150-180`,
   `KeepaliveTimeout 5-15`, `MaxHandshakeAttempts 15-20`, `RandomTrailers on`, `DisableCookies on`.
   Ограничение демона: `S1..S4 ≥ 12` (HeaderCipherNonceSize), иначе `HeaderProtectionKey` отвергается.

⚠️ **Приложение удаляет контейнер при переустановке**: в журнале 2026-10-29 19:30:11 видны `docker stop` → `docker rm -fv` → `docker rmi amnezia-awg2`, выполненные AmneziaVPN с ПК. Не держать параллельно вторую копию контейнера и не работать на сервере во время работы мастера в GUI.

Резервные данные для отката: бэкап выше + образ 2.0 (`docker tag 6fc98f981c68 amnezia-awg2:latest`).

### После установки 3.1: домен в Endpoint

Приложение пишет в конфиг `Endpoint = <IP сервера>:<порт>`. Чтобы смена IP больше не ломала клиентов, хост заменяется на домен:

```powershell
# проверка (ничего не пишет)
node scripts/vpn-endpoint-domain.mjs C:\path\to\conf
# заменить IP на panel.ortopednn.ru
node scripts/vpn-endpoint-domain.mjs C:\path\to\conf --apply
```

Скрипт заодно проверяет обязательные строки (`[Interface]`, `PrivateKey`, `Address`, `[Peer]`, `PublicKey`, `Endpoint`) и наличие параметров обфускации.

### Ручные правки поверх конфига приложения (2026-10-30)

Приложение Amnezia не пишет `ContentPaddingAddition`, хотя его собственный дефолт — `10-100` (`client/core/utils/constants/protocolConstants.h`). Строка добавлена вручную: она убирает кратность транспортных пакетов 16 байтам, то есть ещё один признак для статистического анализа.

```bash
docker cp amnezia-awg2:/opt/amnezia/awg/awg0.conf /root/awg0.conf.bak-<дата>
docker exec amnezia-awg2 sed -i '/^DisableCookies = on$/a ContentPaddingAddition = 10-100' /opt/amnezia/awg/awg0.conf
docker restart amnezia-awg2
```

Проверка: `docker exec amnezia-awg2 awg show awg0` → строка `content padding addition: 10-100`. Параметр односторонний, совпадать у сервера и клиента не обязан; в клиентские `.conf` приложение переносит его из серверного конфига при выгрузке.

⚠️ Переустановка протокола в приложении перезапишет `awg0.conf` — строку добавлять заново. Бэкап до правки: `/root/awg0.conf.bak-20261030-034634`. После рестарта клиенты пере-рукопожатие проходят сами, трафик подтверждён 2026-10-30.

## SOCKS5-прокси (3proxy, внутри amnezia-socks5proxy)

| Параметр | Значение |
|----------|----------|
| Протокол | SOCKS5 (`socks -p49187` в конфиге) |
| Адрес | `185.219.7.36:49187` |
| Логин | в gitignored `vpn-credentials.md` |
| Пароль | в gitignored `vpn-credentials.md` |
| Auth | `auth strong` (требуется логин/пароль) |
| Конфиг | `/usr/local/3proxy/conf/3proxy.cfg` в контейнере |
| Лог | `/usr/local/3proxy/logs/3proxy.log` (JSON, включая CONNECT запросы) |

Пример использования:
```
curl -x socks5h://<логин>:<пароль>@185.219.7.36:49187 https://example.com
```

Проверено 2026-10-29 на новом IP: example.com, api.github.com, ortopednn.ru, yandex.ru — все отвечают.
Назначение: исходящий трафик уходит через AmneziaWG-туннель (awg0, подсеть 10.8.1.0/24) — используется для обхода блокировок (Telegram, Reddit, китайские сайты).

## Cloudflare DNS

| Запись | Контент | Прокси |
|--------|---------|--------|
| A panel.ortopednn.ru | 185.219.7.36 | ❌ off (DNS-only) — Endpoint для новых конфигов AmneziaWG; создана 2026-10-29 через API. Смена IP сервера больше не требует перевыпуска конфигов |
| A admin.ortopednn.ru | 185.245.34.155 | ❌ off — указывает на мёртвый IP, нужно обновить на 185.219.7.36 или перевести админку на Cloudflare |

## Система

- Docker Engine (docker.service) — active running
- fail2ban (sshd jail) — active
- ssh — active
- nginx/apache НЕ установлены (веб-сервер для admin.ortopednn.ru ещё не поднят)