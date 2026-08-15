# AGENTS.md — ortopednn project

## Project Context
- **LIVE-код (Astro):** `C:\opencode\ortopednn-auto\` — Astro SSG, деплоится на GitHub Pages
- **Многосайтовая архитектура:** `docs/architecture.md` — как маштабировать проект на несколько доменов (ortopednn.ru, stomatolog.ortopednn.ru, и др.)
- **VPS:** `94.183.155.147` — root, пароль `MX9Hip94h=KMUJcU6T`, Docker (bot + n8n), Ubuntu 24.04
- **VPS ветка:** `master` (совпадает с дефолтной). `main` — устарела, расходится, НЕ используется
- **Бот на VPS:** `server/` — Docker compose, polling mode, порт 3000
- **n8n на VPS:** порт 5678, admin@ortopednn.ru / Ortopednn2026!, workflow импортирован
- **Telegram fix:** `extra_hosts: api.telegram.org → 149.154.167.220` в docker-compose.yml (блокировка Telegram в РФ)
- **Docker registry mirror:** `mirror.gcr.io` в `/etc/docker/daemon.json`
- **Хостинг бота:** `docs/hosting.md` — документация по портированию бота
- **Веб-панель (Content Factory):** `server/admin/` — Express + HTMX + SQLite, порт 3001, admin.ortopednn.ru (JWT auth, Chart.js dashboard)
- **Cloudflare:** admin.ortopednn.ru → A record 94.183.155.147, API токен в cloudflare-token.md (gitignored)
- **Репозиторий:** `github.com/vpcea2s1r/ortopednn-auto`
- **Старый репозиторий (Next.js):** `C:\opencode\ortopednn\` — устаревший код, НЕ используется на live, подлежит удалению
- **Тестовый поддомен (Astro):** `C:\opencode\stomatolog\` — stomatolog.ortopednn.ru (GitHub Pages)
- **Stomatolog = review platform:** pipeline публикует noindex HTML на stomatolog.ortopednn.ru → пользователь читает → кнопка "На сайт" (ortopednn.ru) или "Удалить"
- **Layero больше не используется** — деплой через GitHub Pages
- Dentist prosthodontist site — Никитина М.Г., Нижний Новгород
- TypeScript, Tailwind CSS v4

## Critical Rule: LIVE-first development
1. **Код репозитория НЕ равен live-сайту** — всегда проверять https://ortopednn.ru перед выводами и изменениями
2. **Перед любым действием** — сделать `webfetch` на 2-3 ключевых страницы live-сайта (главная + целевой раздел), чтобы понять текущее состояние
3. **После каждого шага** — обновить инфо-файлы (AGENTS.md, yandex.md, etc.) с актуальными данными с live
4. **При обнаружении расхождения** между кодом и live — фиксировать таблицу расхождений и предлагать синхронизацию
5. **Перед commit/push** — проверить не затрёт ли старый код актуальный контент с live
6. **Кодировка UTF-8 всегда**:
   - ПРИ СОЗДАНИИ ФАЙЛА: использовать ТОЛЬКО `[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)` — write tool и task-агенты ломают кодировку!
   - НЕ использовать `write` tool для файлов с кириллицей
   - ПРИ PUSH через GitHub API: читать через `[System.IO.File]::ReadAllBytes`, base64 через `[Convert]::ToBase64String()`
   - НЕ использовать `Get-Content` (ломает UTF-8)
   - **ПРОВЕРКА СРАЗУ ПОСЛЕ ЗАПИСИ**: `[System.Text.Encoding]::UTF8.GetString($bytes)` — должен содержать [char]0x0410-0x042F
   - **Проверка размера**: сверить $bytes.Length с ожидаемым (если файл вдвое меньше — encoding сломан)
   - **ПЕРЕД PUSH**: запустить `.\scripts\encoding-verify.ps1`

7. **Article tracking in CONTENT.md** — перед написанием статьи прочитать CONTENT.md (список статей), после написания статьи добавить её в CONTENT.md, затем push.

7.1. **Uniqueness check (Hard Rule)** — перед написанием ЛЮБОЙ статьи проверять её тему на дубли и каннибализацию с существующими статьями в `src/content/blog/*.md` (читать названия и структуру конкурентов):
   - Сравнивать по смыслу (заголовку, ключевым запросам, разделам, FAQ), а не только по слагу.
   - Каннибализация = новая статья закрывает тот же интент, что и существующая (пример: "как ставят коронку" vs существующая "как подготовиться к установке коронки"; "металлокерамические коронки" vs существующая "металлокерамическая коронка: отзывы, плюсы и минусы").
   - Запрещено публиковать статьи с совпадающим ядром запросов: либо доработать угол (другая подтема, другой запрос), либо НЕ писать и сослаться на существующую.
   - Проверку выполнять через grep/чтение `src/content/blog/` + `data/blog-articles.ts` ПЕРЕД созданием файла, а не после.
   - Дата-исключения нет: даже темы ядра Wordstat с высоким спросом НЕ пишутся, если интент уже покрыт существующей статьёй.
8. **Review-before-publish (Hard Rule)** — ни одна статья не публикуется без одобрения пользователя. Пайплайн сохраняет черновики в `data/drafts/<slug>.json`. Пользователь читает через `/drafts` в Telegram боте или на preview.ortopednn.ru/preview/<slug>/ (noindex, banner). Нажимает "Опубликовать" или "Удалить". **Текущий способ публикации (бот на VPS отключён/недоступен) — вручную:** после одобрения пользователем конвертировать `data/drafts/<slug>.json` → `src/content/blog/<slug>.md` (UTF-8 без BOM через `[System.IO.File]::WriteAllText`), добавить запись в `data/blog-articles.ts` (поле JSON — `description`, а НЕ `desc`), обновить `CONTENT.md`, удалить черновик `git rm data/drafts/<slug>.json`, `npm run build`, коммит + push. Проверять кодовые точки кириллицы (`[\u0400-\u04FF]`) и отсутствие mojibake (`[\u2500-\u25FF]` — признак двойного кодирования CP866).

9. **Удаление файлов через GitHub API (Hard Rule)** — GitHub Content API (PUT) НЕ поддерживает удаление файлов. Git Trees API (base_tree + tree items) НЕ удаляет — SHA не меняется из-за content-addressing. **ЕДИНСТВЕННЫЙ рабочий способ** — Content API DELETE для каждого файла:
   ```
   DELETE /repos/{owner}/{repo}/contents/{path}
   Body: { "message": "...", "sha": "<file_sha>" }
   ```
   Скрипт: `.\scripts\delete-files.ps1 -Paths "path1","path2" -Message "reason"`
   **При миграции/переименовании:** после создания новых файлов ОБЯЗАТЕЛЬНО удалить старые через DELETE. Проверять: `git/trees/master?recursive=1` → фильтр по паттерну → подсчёт оставшихся файлов.

10. **Запрет удаления страниц с трафиком (Hard Rule)** — НЕ удалять и не «забывать» страницы, которые дают трафик. Дефолт: сохранить и восстановить, никогда не удалять без явного согласия пользователя.
    - **Перед ЛЮБЫМ удалением/переименованием/редиректом страницы** (или изменением её URL/slugg) — сначала проверить в Google Search Console: `searchAnalytics/query` (28–90 дней) по `page=<полный url>` — если есть показы/клики (impressions > 0), страница ЦЕННАЯ, удаление = потерять позиции и трафик.
    - Проверку выполнять ТОЛЬКО по точному слагу через GSC (refresh-token в `scripts/check-positions.mjs`), а не по догадке.
    - Удалённая ранее страница с трафиком ДОЛЖНА быть восстановлена полностью (файл + запись в `data/blog-articles.ts` + `CONTENT.md`), как это сделано для `vkus-posle-protezirovaniya` (2026-08-07).
    - Если восстановить нельзя → поставить 301-редирект на ближайшую живую статью (в `astro.config.mjs` → `redirects`), удалив soft-404/404 в GSC.
    - Ежели страница всё же удаляется пользователем — минимизировать потери: 301-редирект вместо чистого 404.
    - Контроль регулярно: раз в месяц или при подозрении на потерю — запросить GSC `responseFilter=PAGE_NOT_FOUND`/`SOFT_404` за 28 дней и убедиться, что нет 404-страниц с impressions > 0. Найденное чинить восстановлением или редиректом.

11. **Article length target: medium (Hard Rule)** — таргет объёма body статьи блога: **7–10k знаков** (HTML без frontmatter). Статья < 5.5k знаков — «тонкая», подлежит расширению, если у темы есть реальный спрос (подсказки Яндекса из `%TEMP%\opencode\suggestions-all.json`, Wordstat). Список кандидатов: `scripts/expand-candidates.mjs`; текущий эксперимент — 10 утверждённых статей (список в разделе «Experiment: thin article expansion» ниже).
   - Длина не самоцель: расширять за счёт **интент-полноты** (новые H2, FAQ, нюансы по подтемам запросов), а НЕ воды. Плохо: растягивать абзацы. Хорошо: добавить раздел, которого не хватало для закрытия запроса.
   - Правило 7.1 действует и при расширении: новый раздел не должен дублировать интент другой статьи (пример: «шатается имплант» отдельно от «болит после имплантации» — упомянуть, не раскрывать).
   - Дата-исключения нет: не расширять «просто так» статьи без спроса.

12. **Autonomy (Medium)** — после согласования направления и формата (пример: эксперимент расширения 10 статей) агент исполняет пайплайн **автономно**, не спрашивая на каждом шаге: каннибализация-проверка → черновик `data/drafts/<slug>.json` → валидация (кириллица, mojibake, цены, CTA, ссылки) → build + preview → коммит + push черновика. Точка одобрения пользователя — ОДНА (правило 8): preview опубликован, ждём «да»/правки. После одобрения — публикация без переспроса. Процесс документировать: commit message + обновление этого AGENTS.md (прогресс эксперимента) + `wiki/log.md` при новых инсайтах.

## Experiment: thin article expansion (started 2026-08-15)
Цель: проверить гипотезу «расширение тонких статей с реальным спросом до 7–10k улучшает индексацию/позиции». Метрика: Yandex searchable-индекс (было 59 на 15.08.2026) + позиции по GSC через 3–4 недели после завершения.

| # | Слаг | Было | Стало | Статус |
|---|------|------|-------|--------|
| 1 | bolit-zub-pri-nakusyvanii | 4561 | 9291 | ✅ live 2026-08-15 (c671631) |
| 2 | bolit-posle-implantacii | 3742 | 7812 | ✅ live 2026-08-15 (eda3e49) |
| 3 | galitoz | 5028 | 8780 | ✅ live 2026-08-15 (2516f84) |
| 4 | desna-otoshla-ot-koronki | 4192 | 8264 | ✅ live 2026-08-15 (92f1b89) |
| 5 | gingivit-krovotochivost-desen | 5218 | 8945 | ✅ live 2026-08-15 (273200d) |
| 6 | anesteziya-pri-implantacii | 3922 | 7388 | ✅ live 2026-08-15 (9f7532e) |
| 7 | attachmeny | 3637 | 7193 | ✅ live 2026-08-15 (3f09af9) |
| 8 | bolit-chelyust-posle-protezirovaniya | 4703 | 8404 | ✅ live 2026-08-15 (481e958) |
| 9 | bolit-zub-mudrosti | 4416 | 8135 | ✅ live 2026-08-15 (754cab5) |
| 10 | implant-ne-prizhilsya | 5031 | 8544 | ✅ live 2026-08-15 (07ed1f0) |

**Эксперимент завершён 2026-08-15.** Все 10 статей расширены до 7.2–9.3k знаков (среднее ~8.3k, было ~4.6k), опубликованы в один день. Метрика: сравнить Yandex searchable-индекс (было 59) и позиции по GSC через 3–4 недели (≈ 2026-09-12). Прочие находки: у `bolit-chelyust-posle-protezirovaniya` не было записи в `data/blog-articles.ts` — добавлена.

### Wave 2 (2026-08-15): ещё 10 тонких статей со спросом

Отбор по подсказкам Яндекса из `%TEMP%\opencode\suggestions-all.json` (темы с 10–24 подсказками: «коронка шатается», «замена коронки», «бюгельный», «виниры», «зуб мудрости», «привкус металла», «слетела коронка», «хрустит челюсть»). `scripts/rank-thin-demand.mjs` — грубый матчинг по словам даёт мало результатов, отбор делался вручную по ядру подсказок.

| # | Слаг | Было | Стало | Статус |
|---|------|------|-------|--------|
| 1 | koronka-shataetsya-chto-delat | 3716 | 7557 | ✅ live 2026-08-15 (0e845a2) |
| 2 | implant-shataetsya | 2966 | 7113 | ✅ live 2026-08-15 (20caec0) |
| 3 | zubnoj-kamen | 5468 | 7627 | ✅ live 2026-08-15 (c836503) |
| 4 | hrustit-chelyust | 3829 | 7097 | ✅ live 2026-08-15 (c627686) |
| 5 | slyuna-gustaya | 3678 | 7179 | ✅ live 2026-08-15 (71d2dfd) |
| 6 | vypala-koronka-chto-delat | 3520 | 7558 | ✅ live 2026-08-15 (6485a6f) |
| 7 | otbelivanie-zubov-zoom-4 | 3732 | 7725 | ✅ live 2026-08-15 (8bc9c91) |
| 8 | shinirovanie-zubov | 5176 | 7356 | ✅ live 2026-08-15 (fb3a54d) |
| 9 | cherneet-desna-vokrug-koronki | 3824 | 7600 | ✅ live 2026-08-15 (e090795) |
| 10 | koronka-skololas-chto-delat | 3711 | 7016 | ✅ live 2026-08-15 (96337c1) |

**Wave 2 завершена 2026-08-15.** Среднее стало ~7.4k (было ~4.0k). Каннибализация-решения: `koronka-shataetsya` (на зубе) vs `implant-shataetsya` (на импланте) vs `vypala-koronka` (выпала) vs `koronka-skololas` (скол) — раздельные интенты; `zubnoj-kamen` vs `zubnoj-nalet` (твёрдый vs мягкий налёт); `hrustit-chelyust` (симптом) vs ВНЧС-статьи; `slyuna-gustaya` (симптом) vs `slyuna-i-protezirovanie` (протезы). Пропущены из-за риска каннибализации: `desna-opuhla-vokrug-koronki` (vs vospalenie-desny-nad/pod-koronkoj), `byugelnyj-protez-klammery` (vs klammera-dlya-byugelnykh-protezov), `viniry-chto-eto` (vs viniry-ili-koronki и др.). Находки: у `koronka-shataetsya-chto-delat`, `vypala-koronka-chto-delat` и `koronka-skololas-chto-delat` не было записей в `data/blog-articles.ts` (статьи существовали вне индекса) — добавлены; у `shinirovanie-zubov` и `zubnoj-kamen` не было внутренних ссылок — добавлены; исправлены битые ссылки в `implant-shataetsya` (periimplantit-lechenie→periimplantit, yorshiki-dlya-zubov→irrigator-dlya-polosti-rta) и `slyuna-gustaya` (убрана ссылка на несуществующую vospalenie-slyunnyh-zhelez).

### Wave 3 (2026-08-15): ещё 10 тонких статей со спросом

Отбор по подсказкам Яндекса из `%TEMP%\opencode\suggestions-all.json` (темы: «коронка vs металлокерамика», «болит под коронкой/пломбой», «выпал имплант», «съёмные протезы», «бюгельные кламмеры», «как снять боль», «вопросы ортопеду», «цельнолитой мост», «атрофия кости»). `scripts/rank-thin-demand.mjs` — грубый матчинг по словам даёт мало результатов, отбор делался вручную по ядру подсказок.

| # | Слаг | Было | Стало | Статус |
|---|------|------|-------|--------|
| 1 | cirkonij-ili-metallokeramika | 5630 | 7030 | ✅ live 2026-08-15 (146999a) |
| 2 | bolit-zub-pod-koronkoj | 5721 | 7009 | ✅ live 2026-08-15 (e501874) |
| 3 | bolit-zub-pod-plomboy | 4564 | 7259 | ✅ live 2026-08-15 (117cfd7) |
| 4 | implantat-vypal-chto-delat | 4247 | 7315 | ✅ live 2026-08-15 (6ba843a) |
| 5 | kakie-semnye-protezy-luchshe | 6115 | 7306 | ✅ live 2026-08-15 (df4d605) |
| 6 | byugelnyj-protez-klammery | 5698 | 7292 | ✅ live 2026-08-15 (0bff951) |
| 7 | kak-snyat-zubnuyu-bol | 5091 | 7215 | ✅ live 2026-08-15 (b3e922d) |
| 8 | 10-voprosov-stomatologu-ortopedu | 5872 | 7287 | ✅ live 2026-08-15 (dfcb570) |
| 9 | celnolitoy-mostovidnyj-protez | 4846 | 7131 | ✅ live 2026-08-15 (4c72a64) |
| 10 | atrofiya-kostnoj-tkani-chelyusti | 4876 | 7326 | ✅ live 2026-08-15 (271f60e) |

**Wave 3 завершена 2026-08-15.** Среднее стало ~7.3k (было ~5.2k). Каннибализация-решения: `cirkonij-ili-metallokeramika` vs `cirkonievye-koronki-cena-nn` — оба оставлены, cirkonievye связан как детализирующий; `kakie-semnye-protezy-luchshe` — обзор-хаб (ссылки на byugelnyj-ili-semnyj-protez и др.); `byugelnyj-protez-klammery` ссылается на `klammera-dlya-byugelnykh-protezov`; `atrofiya-kostnoj-tkani-chelyusti` vs `kostnaya-plastika-pered-implantatsiej` — раздельные интенты (причины+восстановление vs этапы операции). Находки: у `celnolitoy-mostovidnyj-protez` не было записи в `data/blog-articles.ts` (статья существовала вне индекса) — добавлена; у `atrofiya-kostnoj-tkani-chelyusti` не было записи в индексе — добавлена. Исправлены битые ссылки: `karies-pod-plomboy`→`lechenie-kariesa` (bolit-zub-pod-plomboy), `periimplantit-lechenie`→`periimplantit` (implantat-vypal), удалена несуществующая `anesteziya-pri-lechenii-zubov` (kak-snyat-zubnuyu-bol); у `10-voprosov-stomatologu-ortopedu` и `sinus-lifting` в desc записи индекса остался CTA-хвост «Консультация ортопеда: +7 (920) 253-73-17.» — у 10-voprosov вычищен, у sinus-lifting оставлен (не трогали — вне scope волны).

## Available Skills

22 skills from `addyosmani/agent-skills` at `.opencode/skills/<name>/SKILL.md`.
Use `skill` tool to load them. Flow:

```
  DEFINE       PLAN        BUILD       VERIFY      REVIEW       SHIP
idea-refine → planning → incremental → test → code-review → shipping
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

## 9Router — AI Router & Token Saver

9Router — прокси для AI-провайдеров (40+), с автоматическим fallback и RTK-сжатием токенов.

### Запуск

```powershell
cd C:\opencode\ortopednn\9router
.\start.ps1
```

Dashboard: http://localhost:20128 (пароль: `123456`)

## Project Goal & Status

**Goal:** Продвижение ortopednn.ru (Никитина М.Г., стоматолог-ортопед) в ТОП-1 Яндекса по Нижнему Новгороду.

### Constraints (актуальные)
- **Deploy:** GitHub Pages (static SSG). Cloudflare не используется (заблокирован в РФ).
- **Telegram-бот для SEO мониторинга:** `@ortopednn_bot` — chat_id: `45185475` (Юрий)
- **Telegram контакт:** `t.me/nikitina_ortoped` — присутствует на страницах услуг
- Нет отдельной страницы "Записаться" — только телефон
- Доктор — наёмный работник (не владелец клиники)
- Цены удалены из ortopednn.ru/services/ (по запросу пользователя)

### Google OAuth (Search Console API)

| Параметр | Значение |
|----------|----------|
| Scope | `https://www.googleapis.com/auth/webmasters` |
| Status | ✅ Site verified, sitemap submitted (0 errors, 0 warnings) |
| GSC properties | `https://ortopednn.ru/` (URL-prefix) + `sc-domain:ortopednn.ru` (domain) — siteOwner |
| Refresh rotation | Refresh-token обновлён 2026-08-07 (test user auth expires every 7 days). Токен хранится в `scripts/check-positions.mjs`. |

### Yandex OAuth (Webmaster API) — обновлено 30.05.2026

| Параметр | Значение |
|----------|----------|
| Token expires | ~169 дней (2026-11-14) |
| Scope | `webmaster:hostinfo` |
| User ID (Яндекс) | `156937890` |
| Access Token | `y0__wgBEKLd6koY2_VBIPiwkMgXMJyMhrkI_UB3K5NBR-vLj1_9Eg5Iq74ZV10` |
| Refresh Token | `2:AAA:AAAAAAlarqI:1:_CQlUGOkUPSV6DA9:TSvJu0KMvh-PO6wlLaIudADnUcOIYXHPiXZErFOAam0f9dQISHGSbBx6n-HfWJuOVL8JAybES9gPx2YcI8s:b3t2IDKycgKcmoRClvGtmA` |
| Client ID (новый) | `877c313650a94c02b5a7ce61a65d2c89` |
| Client Secret (новый) | `14c950dd2be24fe38b6265c3ae9837ff` |
| Client ID (старый, не используется) | `a8c3b0b8da2a4908943d5be7832e3a04` |
| Client Secret (старый, не используется) | `98355eba98f645a3aaa9bf6d4cd15e07` |
| Credentials file | `C:\opencode\ortopednn-auto\google-oauth.md` |

### GitHub Secrets (Telegram Bot)

Secrets stored in `.env` на VPS (`/opt/ortopednn-auto/.env`).

| Secret | Назначение |
|--------|------------|
| `TELEGRAM_BOT_TOKEN` | Токен бота `@ortopednn52_bot` |
| `TELEGRAM_CHAT_ID` | Чат Юрия для уведомлений |
| `GH_PAT` | GitHub Personal Access Token |

### LIVE-сайт (ortopednn.ru) — структура (2026-06-14)

**Sitemap:** `sitemap-0.xml`, всего **196 pages** (build 2026-06-14, 0 errors)

| Раздел | Кол-во | Описание |
|--------|--------|---------|
| `/` | 1 | Главная с FAQ, контактами |
| `/about/` | 1 | О враче |
| `/blog/` | 1 + **137 статей** | Блог (статьи от авто-пайплайна + 25 migrated from checkup) |
| `/compare/` | 1 | Сравнение конструкций |
| `/materials/` | 1 | Материалы |
| `/services/` | 1 + **62 услуги** | Услуги (удалены metallokeramicheskaya-koronka, vradecheskaya-vkladka) |

### Astro Features (current config)

| Feature | Status | Config location |
|---------|--------|-----------------|
| Output: static | ✅ | `astro.config.mjs` |
| Astro 6 | ✅ | `package.json: astro@^6.0.0` |
| Rust compiler | ✅ | `experimental.rustCompiler: true` — сборка 10.44s |
| SVG optimizer | ✅ | `experimental.svgOptimizer: svgoOptimizer()` |
| Fonts API (Inter) | ✅ | `fonts` config + `<Font cssVariable="--font-inter" preload/>` |
| View Transitions | ✅ | `<ClientRouter />` в `BaseLayout.astro` |
| `@astrojs/sitemap` | ✅ | `astro.config.mjs` — `/preview/` excluded from sitemap |
| Content Collections v2 (`file()` loader) | ✅ | `src/content/config.ts` |
| OG image fallback (favicon) | ✅ | `src/layouts/BaseLayout.astro` |

### Pricing Data

- **Данные:** `data/pricing.json` (не тронуты)
- **Список услуг:** `src/pages/services/index.astro` — цены удалены
- **Индивидуальные страницы:** `src/pages/services/*.astro` — цены удалены (ServiceArticle: price-бадж, material-price, stat-card__value, inline цены)
- **Главная:** цены удалены
- **Компонент:** `ServiceArticle.astro` — удалены price из Props, price-бадж, Product schema, CSS

### Preview System (Draft Review on ortopednn.ru)

**Status:** ✅ Frontend on Astro — created. **Публикация вручную** (бот на VPS отключён): после одобрения пользователя черновик `data/drafts/<slug>.json` конвертируется в `src/content/blog/<slug>.md` и пушится (см. правило 8). В `data/drafts/` сейчас пусто (только `.gitkeep`) — все 19 черновиков опубликованы или удалены 01.08.2026.
**Flow:** Bot generates draft → pushes `data/drafts/<slug>.json` to repo → GitHub Actions rebuilds → preview at `ortopednn.ru/preview/<slug>/` (noindex, banner) → user reads + publishes (вручную: JSON → MD → commit+push)
**Files:**
- `data/draft-types.ts` — DraftMeta interface (slug, title, date, desc, body, category)
- `src/pages/preview/...slug.astro` — dynamic route (BaseLayout, noindex, preview banner, publish/delete buttons)
- `data/drafts/.gitkeep` — directory for draft JSONs
- `astro.config.mjs` — `/preview/` excluded from sitemap

**Need on VPS (если бот вернётся):**
1. Bot to push `data/drafts/<slug>.json` to repo after generation
2. Two API routes on bot: `/api/preview/publish` and `/api/preview/delete`

## Next Steps

1. **Google Search Console** — refresh OAuth token (expired, needs OAuth Playground)
2. **Яндекс.Вебмастер интеграция** — ✅ OAuth-токен получен (2026-05-22). Права: webmaster:hostinfo. Нужно добавить metrika:read для Metrika API.
3. **Content Factory deploy** — npm install on VPS, Nginx reverse proxy for admin.ortopednn.ru, seed admin user
4. **Алерты реального времени** — мгновенный Telegram при падении perf < 50 или битых ссылках
5. **Бенчмарк конкурентов** — сравнение perf/seo с конкурентами
6. **Удалить `C:\opencode\ortopednn`** (старый Next.js репозиторий) — после подтверждения
7. **Редизайн stomatolog.ortopednn.ru** — пользователь не доволен текущим дизайном
8. ~~**Cleanup: main branch** — `main` ветка устарела и расходится с `master`. Нужно удалить или пересоздать.~~ ✅ Удалена и пересоздана от master (2026-06-17)
9. **n8n Telegram credentials** — настроить Telegram API key для n8n workflow (бот токен). Низкий приоритет.
10. **Queue dedup** — проверять существующие статьи перед генерацией, чтобы избежать дубликатов.
11. **26 service pages** — rewrite thin pages with standardized ServiceArticle props (procedure, care, stats, materials, faq, comparison)

## Telegram SEO Monitor Bot (`@ortopednn52_bot`)

Бот работает на VPS (94.183.155.147) в Docker-контейнере, polling mode, порт 3000.

### Что умеет сейчас
- **Инлайн-меню** (`/menu`): Производительность, Статистика, Черновики, Дзен, PubMed-рерайт
- `/perf` — Lighthouse + CrUX (PageSpeed API, без ключа)
- `/research <тема>` — поиск PubMed, inline-выбор статьи → рерайт → черновик
- `/drafts` — черновики с inline-кнопками: опубликовать (→ ortopednn.ru) / удалить
- `/stats` — полный отчёт: GSC (клики, показы, позиции), Yandex (индекс, ошибки), Metrika (визиты, просмотры), CWV (LCP, CLS, INP), топ-10 ключевых слов
- `/dzen <тема>` — генерация статьи для Яндекс.Дзен (4-5k символов, humanized)
- **URL-рерайт** — кидаешь ссылку → бот читает, AI переписывает для блога → черновик
- **Daily cron** (8:00 MSK) — сбор статистики GSC + Yandex + Metrika + CWV + keyword positions в SQLite
- **Daily digest** (9:00 MSK) — Telegram с ключевыми метриками за день
- **Dzen cron** (10:00 MSK) — генерация статей для Дзен из очереди тем
- **Auto-content pipeline** (cron 7:00 MSK) — Multi-Agent генерация (Research→Writer→Review→SEO→**Draft**)
- **Review flow** — статьи не публикуются сразу. Сохраняются в `/data/drafts/` как черновик. Уведомление в Telegram. Публикация — через кнопку "Опубликовать" в `/drafts` (бот отключён — публикация вручную, см. правило 8)
- `/autogen <тема>` — ручной запуск пайплайна, сохраняет как черновик
- **n8n workflow** (дублирующий триггер 7:00 MSK) — HTTP → bot API, Telegram-уведомления
- **Polling** (каждые 10с) — порт 3000, healthcheck

### Известные проблемы
- После перезапуска контейнера offset сбрасывается (потоковые обновления могут теряться). Исправить: хранить offset в SQLite.
- inline-кнопки меню могут не срабатывать если бот не получил callback_query (проверить через docker logs).
- SSH к VPS недоступен из некоторых регионов — управление только через docker exec.

### Команды бота
| Команда | Статус | Описание |
|---------|--------|----------|
| `/perf` | ✅ | Lighthouse + CrUX PageSpeed |
| `/research` | ✅ | Поиск PubMed + AI рерайт |
| `/menu` | ✅ | Инлайн-меню |
| `/drafts` | ✅ | Черновики: "На сайт" (→ ortopednn.ru) или "Удалить" |
| `/ssl` | ❌ | Сколько дней до истечения сертификата |
| `/stats` | ✅ | Полный отчёт (GSC + Yandex + Metrika + CWV + keywords) |
| `/digest` | ✅ | Daily digest (9:00 MSK, отправляется автоматически) |
| `/autogen` | ✅ | Multi-Agent генерация статьи |
| `/dzen` | ✅ | Генерация статьи для Яндекс.Дзен (4-5k chars) |

## Build Stability Rule
- Любое изменение кода (структуры JSON, компонентов, маршрутов, схем) должно быть совместимо с существующими данными в репозитории (`data/`, `content/`)
- Перед commit/push — запустить `npm run build` и убедиться что build проходит без ошибок
- Если меняется формат данных (например, поле в JSON) — обновить все существующие файлы или обеспечить поддержку старого формата

## Writing Rules (обязательно для всех)

**Источник:** https://github.com/Anbeeld/WRITING.md — скилл `writing` в `~/.config/opencode/skills/writing/`

Все правила WRITING.md обязательны при написании любого текста для публичного просмотра (статьи, блог, SEO-копирайтинг, UI-тексты, email). Не применяются только к комментариям в коде, commit message и личным заметкам.

Кратко (WRITING-mini):
- Пиши для контекста: medium, аудитория, задача текста. При конфликте: правда > пользователь > жанр > правила.
- Каждый абзац — одна конкретика (имя, число, цитата, деталь). many/various/essentially — не считаются.
- Простые слова и глаголы. Повторяй обычные слова. Связывай местоимениями и формой предложения, не furthermore/moreover. Тесные мысли — в одно предложение.
- Без ключевых речей, Great question, I hope this helps. Начинай с ответа, заканчивай ответом.
- Избегай повторяющихся паттернов: parallel lists, concession rhythm (not X, but Y), stacked mini-sentences, одинаковые дуги абзацев.
- Длинная форма: сквозная тема (тематическая, перспективная, пример-ведомая), не хронология. Включи пример, накопительное предложение, паузу.
- Редактируй вырезанием. Не разрывай связанные мысли. Без эм-тире, если не оправдано. Без fake humanity. Не убирай структуру ради стиля.
- Проверка: регистр, якоря, регулярность, позиция, перекоррекция. Смотреть (не запрет): delve/leverage/seamless, it's important to note, unnamed experts, unsupported causality.

Скилл подгружается через `skill` tool по триггеру "writing".

## LLM Wiki Schema (Karpathy pattern)

### Что это
Постоянно пополняемая markdown-вики, которую LLM-агент сам ведёт. В отличие от RAG, знания не «достаются» каждый раз заново — они накапливаются, перелинковываются и обновляются в структурированных страницах.

### Где
`wiki/` в корне проекта.

### Структура
```
wiki/
  index.md    — каталог ВСЕХ страниц (ссылка + 1 строка описания)
  log.md      — хронология всех операций (формат: ## [YYYY-MM-DD] ingest|query|lint | Тема)
  raw/        — сырые источники (неизменяемы, read-only для агента)
  medical/    — стоматологическая база знаний
  project/    — проектная документация
```

### Формат страницы
- Заголовок `# Название`
- Раздел `## Описание`
- Секции по смыслу: `## Плюсы/Минусы/Сравнение`
- `## Источники` — ссылки на raw/** или внешние источники
- `## Связанные страницы` — ссылки на другие wiki-страницы
- Внутренние ссылки: относительные `[текст](page.md)`
- Внешние ссылки: полные URL

### Когда обновлять wiki
1. **После ingest** нового источника — создать/обновить страницы, перелинковать, записать в log.md
2. **После ответа на вопрос** — если ответ содержал новые инсайты, сохранить их в wiki (не давать полезной информации исчезнуть в истории чата)
3. **После lint** — исправить противоречия, обновить index.md, починить битые ссылки
4. **После любой сессии** — зафиксировать ключевые выводы и решения

### Операции

**Ingest (добавление источника):**
1. Прочитать источник
2. Обсудить ключевые выводы (если нужно)
3. Создать/обновить wiki-страницы в `medical/` или `project/`
4. Обновить index.md (каталог)
5. Добавить запись в log.md

**Query (вопрос к вики):**
1. Прочитать index.md — найти релевантные страницы
2. Прочитать найденные страницы
3. Синтезировать ответ со ссылками на страницы
4. Если в ответе появились новые ценные данные — сохранить их в wiki

**Lint (проверка здоровья вики):**
- Противоречия между страницами
- Устаревшие утверждения (проверить даты)
- Страницы без обратных ссылок (orphans)
- Упоминаемые концепции без своей страницы
- Битые внутренние ссылки
- Обновить index.md

### Правила
- Raw-источники НЕ изменять (только читать)
- Файлы в `medical/` и `project/` — LLM пишет полностью
- При обновлении страницы: сохранить всё ценное из старой версии, добавить новое
- index.md — всегда актуален (обновлять при любом изменении)
- log.md — append-only, не редактировать старые записи
- Дата в log.md: YYYY-MM-DD
- Битые ссылки не создавать

## Setup After Clone

```powershell
# Recreate skills junction
git submodule update --init --recursive
New-Item -ItemType Junction -Path ".opencode\skills" -Target "..\skills\addy-skills\skills"

# 9router setup (если не работает)
cd 9router
npm install
$env:NODE_ENV="production"; npx next build --webpack
.\start.ps1
```
