## 2026-07-12 — 10 НЧ-статей + хаб-страница + schema improvements
- **10 НЧ-статей**: shiniruyushchij-byugel, most-na-3-zuba, klkt-pered-protezirovaniem, vnutrirotovoe-skanirovanie, neyroseti-dlya-analiza-snimkov, ii-dlya-planirovaniya-implantatsii, gnotologiya-diagnostika-lechenie, golovnaya-bol-pri-vnchs, artrit-visochno-nizhnechelyustnogo-sustava, irrigator-dlya-polosti-rta
- **Хаб-страница**: `/protezirovanie-zubov-v-nizhnem-novgorode/` — FAQPage (6 вопросов) + Dentist LocalBusiness schema
- **Schema**: areaServed добавлен в MedicalClinic (BaseLayout.astro:130)
- **Build**: 256 pages, 0 errors
- **Push**: commit `18d50f5` → master
- **Wiki**: `project/nh-content-2026-07.md` создана

## 2026-07-16 — 4 НЧ-статей + broken link audit + SEO-аудит 5 статей

### Новые НЧ-статьи (4)
- **zamena-koronki** — Замена коронки на зуб: когда нужна и как проходит (koronki, how-to)
- **otbelivanie-do-ili-posle-protezirovaniya** — Отбеливание до или после протезирования (how-to)
- **protezirovanie-posle-udaleniya-zuba-mudrosti** — Протезирование после удаления зуба мудрости (condition)
- **protezirovanie-dlya-pozhilykh** — Протезирование зубов для пожилых: All-on-4 vs съёмный (comparison)

### Broken link audit (37+ исправлений)
- **8 blog-статей**: bisfosfonaty, allergiya, kurenie, kserostomiya, vospalenie-desny, posle-ustanovki-koronki, stress-i-zuby, osteoporoz — битые ссылки на сервисные страницы
- **dzen.ru удалён**: BaseLayout, about, index, stomatolog-ortoped — JSON-LD sameAs + footer
- **pricing.json**: удалены 25+ мёртвых `link` полей (neсуществующие сервисы)
- **PriceList.astro**: `<span>` вместо `<a>` при отсутствии `link`
- **VNChS хаб**: создана `src/pages/blog/vnchs/index.astro` (категория была без индекса)
- **og-image**: kappy-ot-bruksizma → `/og-blog-default.jpg` заменён на `/og-image.svg`

### SEO-аудит 5 статей (writer.md v2.0)
- **byugelnyj-protez-chto-eto**: удалена цена из description
- **all-on-6**: удалены цены (300–600K), списки 5→4, добавлен FAQPage JSON-LD
- **cirkonij-ili-metallokeramika**: добавлена «| Никитина М.Г.» в title, удалена «цена» из desc, город, FAQ (4 Q&A), FAQPage JSON-LD
- **implant-ili-protez**: город, FAQPage JSON-LD (6 Q&A)
- **protezirovanie-pri-saharnom-diabete**: город, FAQPage JSON-LD (6 Q&A)

### Метрики
- **Итого НЧ**: 24 статьи
- **Build**: 261 страница, 0 ошибок, ~64s
- **Push**: `d189038` → master

## 2026-07-14 — SEO-позиции + ещё 10 НЧ-статей
- **SEO-позиции**: #1 по "стоматолог-ортопед нижний новгород", НЕ в топ-10 по "протезирование зубов нижний новгород"
- **Конкуренты**: artdentnn.ru (4 клиники, цены), implant-nn.com, drdentnn.ru (3 клиники), dentnn.ru, skv-nn.ru (35 лет), mhdent.ru
- **Ещё 10 НЧ-статей**: sravnenie-sistem-implantov, implantatsiya-pri-kurenii, zubnye-protezy-posle-60, implantatsiya-pri-parodontite, protezirovanie-pri-parodontoze, mikoprotezirovanie, all-on-6, psikhologicheskaya-adaptatsiya, implant-ili-protez, koronka-na-implant
- **Итого НЧ**: 20 статей, ~157 всего в блоге

## 2026-06-14 — Content Factory VPS deploy + Cloudflare DNS
- **VPS deploy**: docker-compose admin service (port 3001, CMD node admin/app.js), npm install, Nginx reverse proxy admin.ortopednn.ru → localhost:3001
- **Fixes**: 15+ corrupted template literals (backtick + ${} mangled by WriteAllText), SQL backticks, ESM imports (require→import), EJS templates, login.ejs rewritten as standalone HTML
- **Cloudflare**: A record admin.ortopednn.ru → 94.183.155.147 (TTL 120), API token for DNS management
- **Credentials**: nikitin / 4338365Q!, login POST works with url-encoded
- **Status**: admin container running on VPS port 3001, login 200/302, dashboard 500 (EJS close tag in layout.ejs — needs rebuild)

## 2026-06-09 — Low-Frequency Keywords Research
- **Ingest**: Исследование низкочастотных запросов через веб-поиск
- **Создана страница**: `project/low-freq-keywords.md` — 10 тем, разделённых по приоритету
- **Высокий приоритет** (5 тем): протез в отпуске, горячая пища, алкоголь, коронка+МРТ, беременность
- **Средний** (3): дикция, временный протез, спорт
- **Покрытые темы** (НЕ писать повторно): полный список существующих статей по разделам
- **Цель**: расширение контентной базы на 5 статей без дублирования

## 2026-06-03 — Dzen link in footer
- **Ссылка на Дзен**: добавлена dzen.ru/ortopednn в подвал всех страниц (index.astro, BaseLayout.astro, stomatolog-ortoped-nizhnij-novgorod.astro)
- **Commit**: 6182e9ff via GitHub API
- **Цель**: получить подписчиков для Дзена (нужно 10 для активации RSS-импорта)
- **Статус**: build прошёл (199 pages, 20.71s), deployed to GitHub Pages

# Wiki Log

## 2026-05-31
- Инициализация wiki-структуры (index.md, log.md, разделы)
- Создан раздел `medical/`, `project/`, `raw/`
- Seeded: 6 medical + 3 project + wiki-guide.md
- Добавлена LLM Wiki Schema в AGENTS.md

## 2026-06-01 (v2 — синхронизация с live-статьями)
- **Ingest**: прочитаны ключевые статьи live-сайта (импланты, коронки, бюгельные, съёмные, мосты, материалы)
- **Обновлены 6 страниц**: каждая структурирована по SEO-приоритету (высокий/средний/низкий)
- **Implanty**: статистика All-on-4 (98%), выживаемость, цены НН, противопоказания
- **Koronki**: цирконий vs металлокерамика (96% vs 90%), E-max, частые проблемы
- **Semnye**: акрил/нейлон/AcryFree сравнение + уход + средства
- **Byugelnye**: замки vs кламмеры (40% меньше жалоб), срок службы замков
- **Mosty**: имплант vs мост (95.6% vs 82.3%), адгезивный мост
- **Materials**: CAD/CAM, 3D-печать, таблицы материалов с прочностью
- Всего страниц: 11 (6 medical + 4 project + 1 index)

## 2026-06-01 (v4 — Core Web Vitals)
- **Core Web Vitals**: Lighthouse проверка через CLI (главная, статья, услуга, десктоп)
- **Результаты**: SEO 100 (все), Desktop 95, Mobile 83—93, BP 77 (iframes + cookies)
- **Проблемы**: TBT 230—490ms на mobile, CLS 0.14 на услугах
- **Рекомендации**: lazy loading, font-display:swap, fixed img dimensions, render-blocking audit
- **Обновлён**: `wiki/project/progress-report.md` — добавлены CWV таблица и рекомендации

## 2026-06-01 (v4 — CWV фиксы + бот)
- **CWV фиксы**: Inter font-weight 800 добавлен, Яндекс.Метрика перенесена из `<head>` в `<body>` (async), `title` добавлен на iframe карты
- **Push**: 13 файлов (5 новых статей + CWV + wiki) через GitHub API
- **Бот**: диагностирован и починен — GH_TOKEN протух, контейнер пересобран, меню работает
- **Черновики 404**: pipeline-драфты не пушатся на stomatolog → в `/drafts` ссылка показывается только для stomatolog-драфтов. Фикс: `server/bot.js`, commit `17ba473`
- **Яндекс.Вебмастер**: `searchable_pages_count: 0` из-за ограниченного scope `webmaster:hostinfo` — нужен `webmaster:searchapi`
- **Wiki**: `wiki/project/bot-draft-404.md` — документация фикса

## 2026-06-01 (v5 — адгезивный мост)
- **6-я статья из gap**: «Адгезивный мост — что это, плюсы и минусы, сколько служит» (`adgezivnyj-most`)
- **Категория**: `mosty` (теперь 7 статей в кластере)
- **Build**: 194 pages, 0 errors
- **Push**: commit 50f59fe на master — GitHub Actions деплой
- **Всего статей**: 82

## 2026-06-01 (v3 — наукопп-статьи)
- **Добавлен раздел Дзен**: `wiki/project/dzen.md` (RSS, канал, учётные данные)
- **5 новых наукопп-статей** (низкочастотники):
  1. «Микробиом полости рта: как меняется микрофлора после протезирования» — `mikrobiom-polosti-rta-protezirovanie`
  2. «Биоплёнка на зубах и протезах — что это и чем опасна» — `bioplenka-na-zubnyh-protezah`
  3. «Гальванические токи во рту: опасно ли сочетание металлов в коронках» — `galvanizm-v-stomatologii`
  4. «Почему исчезает кость челюсти после удаления зуба — атрофия и закон Вольфа» — `atrofiya-kostnoj-tkani-chelyusti`
  5. «Остеоинтеграция: как костная ткань срастается с титановым имплантом» — `osteointegratsiya-kak-kost-srastaetsya-s-titanom`
- **Build**: 188 pages, 0 errors
- **Push**: 2 коммита на master (RSS + статьи) — GitHub Actions деплой
- **RSS-лента**: `https://ortopednn.ru/rss.xml` — 67+ статей, Дзен готов к подключению
- **Дзен-канал**: зарегистрирован `dzen.ru/ortopednn`

## 2026-06-01 (v6 — категоризация 6 статей)
- **Категоризировано 6 статей**: `kurenie-posle-protezirovaniya`→implanty, `bioplenka-na-zubnyh-protezah`→semnye, `mikrobiom-polosti-rta`→semnye, `cad-cam-v-stomatologii`→koronki, `parodontit-i-bolezn-altsgeymera`→implanty, `ukhod-za-polostyu-rta-posle-protezirovaniya`→implanty
- **Осталось без категории**: 6 (zdorove-polosti-rta, podgotovka, etapy, ceny-nn, first-visit, protezirovanie-nn-ceny — truly general)
- **Итоговые кластеры**: implanty=18, koronki=31, semnye=19, byugelnye=6, mosty=7
- **Build**: 194 pages, 0 errors
- **Push**: commit 00c25a5 (GH API)

## 2026-06-01 (v7 — TL;DR удалён из статей)
- **TL;DR**: удалён `<strong>TL;DR:</strong>` из всех 26 `.astro` статей (лид-абзац сохранён)
- **writer.md**: обновлён — TL;DR заменён на лид-абзац, чеклист исправлен
- **Build**: 194 pages, 0 errors
- **Push**: commit 7f63304 (Git Tree API, 30 entries)

## 2026-06-02 — Bot preview 404 fix
- **Проблема**: pipeline-драфты возвращали URL `ortopednn.ru/preview/<slug>/`, но JSON в `data/drafts/` не сохранялся → 404
- **Фикс**: в `server/bot.js` после пуша HTML в stomatolog добавлен push JSON в `data/drafts/<slug>.json` репозитория ortopednn-auto
- **Статус**: контейнер пересобран (`docker compose build --no-cache`), перезапущен, health OK
- **Wiki**: `wiki/project/bot-preview-404.md` — документация фикса

## 2026-06-02 (v8 — 5 научпоп-статей)
- **5 новых научпоп-статей** (низкочастотники):
  1. «Как слюна влияет на фиксацию и срок службы зубных протезов» — `slyuna-i-protezirovanie-zubov` (semnye-protezy)
  2. «Меняется ли вкус после протезирования» — `vkus-posle-protezirovaniya` (semnye-protezy)
  3. «ВНЧС и протезирование — боль, хруст, щелчки» — `visochno-nizhnechelyustnoj-sustav-protezirovanie` (koronki)
  4. «Как распределяется жевательная нагрузка: импланты против съёмных протезов» — `raspredelenie-nagruzki-implanty-semnye-protezy` (implanty)
  5. «Пьезохирургия в стоматологии — ультразвуковой скальпель» — `piezohirurgiya-v-stomatologii` (implanty)
- **Build**: 199 pages, 0 errors
- **Итог**: 87 статей (6 uncategorized, остальные по кластерам)
- **Push**: через GitHub API

## 2026-06-02 — SEO: Дзен + Telegram стратегия
- **Дзен**: RSS полностью готов (content:encoded, enclosure, категории), нужно подключить источник в настройках канала
- **Telegram-канал**: создан `@ortopednn`, бот `@ortopednn52_bot` ждёт добавления администратором
- **bot.js**: добавлена функция `postToChannel()`, вызывается при `/autogen` и `/horizon`
- **Wiki**: `wiki/project/dzen.md` — обновлён (RSS-статус, Telegram-канал, схема работы)

## 2026-06-02 — Push Artifacts Check
- **Проблема**: push 5 статей через API создал stale tree entries — CI упал
- **Восстановление**: reset до `6572b03`, пересоздание чистого дерева
- **Wiki**: `wiki/project/push-artifacts-check.md` — правило верификации перед/после push

## 2026-06-02 — Yandex indexing: Crawl-delay removed
- **Проблема**: Яндекс проиндексировал 1 страницу из 150+. Crawl-delay: 2 замедлял обход
- **Фикс**: удалён `Crawl-delay: 2` из `public/robots.txt` для Yandex
- **Деплой**: commit `3270992b` → GitHub Actions → live

## 2026-06-02 — Humanizer-ru интегрирован в пайплайн
- **Проблема**: статьи выглядят AI-сгенерированными для Яндекса (одинаковая структура, без личного голоса, 29+ AI-паттернов)
- **Решение**: создана `humanize(text)` функция в `agent-pipeline.js` — удаляет связки-переходы, канцелярит, AI-слова, размытые атрибуции, ограничивает тире
- **checkAiTells()**: добавлена проверка 20+ русских AI-паттернов (было 0 — только английские)
- **Интеграция**: `rewrite()` (bot.js), `writerAgent()`, `reviewAgent()` (agent-pipeline.js) — humanize применяется после генерации
- **Контейнер**: пересобран, перезапущен
- **Wiki**: `wiki/project/humanizer-integration.md`
- **Проблема**: Яндекс проиндексировал 1 страницу из 150+. Crawl-delay: 2 замедлял обход
- **Фикс**: удалён `Crawl-delay: 2` из `public/robots.txt` для Yandex
- **Деплой**: commit `3270992b` → GitHub Actions → live

## 2026-06-02 — Bot: plain text rewrite без PubMed
- **Проблема**: PubMed находил нерелевантные статьи для русских запросов (шкала Vita → антидепрессанты)
- **Фикс**: удалён `searchPubMed()` из обработчика plain text, прямой вызов `rewrite(null, text)`
- **Контейнер**: пересобран и перезапущен на VPS
- **Wiki**: `wiki/project/bot-plaintext-rewrite.md`

## 2026-06-14 (v2) — Content Factory VPS deploy
- **VPS deploy**: pulled code to 94.183.155.147, resolved git conflict (bot.js), built admin service on Docker
- **Bugfixes**: fixed SQL backtick corruption in 5 route files (PowerShell mangled backtick chars + `${}` template literals)
- **Status**: admin container running on VPS port 3001, needs Nginx config for admin.ortopednn.ru
- **Wiki**: log and index updated

## 2026-06-14 — Stats pipeline + Dzen generator + Duplicate fix + Content Factory
- **Stats pipeline (Phase 1-2)**: `collector.js` — collectMetrika(), collectKeywordPositions(), collectCwv(). Bot: `/stats` command, menu:stats callback. Cron: 8:00 collect - 9:00 digest. DB: keyword_positions, cwv_snapshots tables.
- **Dzen generator**: `dzen-generator.js` — 4-5k char articles, Triple validation (length≥3500, 0 AI tells, 0 fake citations). Bot: `/dzen <topic>`, menu:dzen button. Cron: 10:00 MSK daily.
- **Yandex duplicate fix**: deleted 6 true duplicates (2 service + 4 blog), added canonical tags to 8 near-duplicate blog files. BaseLayout.astro now accepts `canonical` prop.
- **Content Factory**: `server/admin/` — Express + HTMX + SQLite, port 3001. Auth (JWT), Projects, Dashboard (Chart.js), Drafts (GitHub API publish), Social (TG/VK/Dzen/OK), Pipeline, Settings. Docker compose: admin service.
- **Pushed**: 6 commits to master (stats + Dzen + duplicate fixes + Content Factory).

## 2026-06-07 — ServiceArticle refactor + wiki
- **ServiceArticle.astro** — added 6 optional standardized section props: procedure, care, stats, materials, faq, comparison
- **Props interface**: all optional (default []), backward compatible
- **CSS**: added complete styling for all standardized sections (procedure list with counters, materials grid, stats cards, care list with checks, FAQ accordion, comparison pros/cons)
- **Demo**: cirkonievaya-koronka.astro converted from 91-line thin page → uses procedure, care, stats, comparison props + keeps slot for unique content
- **Build**: 199 pages, 0 errors (21.66s)
- **Wiki**: wiki/project/service-content-depth.md — strategy doc with required pattern, props table, priority list
- **Next**: rewrite remaining 38 thin pages

## 2026-06-17 — Service page cleanup: 33 lab pages deleted, 24 clinical pages rewritten
- **Lab/technical pages deleted**: 33 pages removed (otlisk-*, privarka-*, perebazirovka-*, snatie-*, fiksaciya-*, prikusnoj-* models, prototype, razbornaya-vkladka, and others)
- **services.ts updated**: removed 3 categories (Диагностика и слепки, Фиксация и ремонт), added orphan files (byugelnyj-klammery, immediat-implakril, sjemnyj-protez-implakril). Now 4 categories / 28 entries.
- **24 clinical pages rewritten** with full ServiceArticle props (procedure, care, stats, materials, comparison, faq + h2 content sections)
- **Build**: 187 pages, 0 errors
- **Pushed**: commit c6122a6 to master

## 2026-06-17 — SEO 2026 research + 3 blog articles rewritten
- **SEO 2026 research**: Google AI Overviews, Яндекс Neuro AI, E-E-A-T with named author for YMYL, CWV thresholds, medical schema
- **Blog audit**: 10 articles rated 4/10 to 9/10, rewritten 3 weakest (akrilovyj-protez, 3d-pechat-zubnykh-protezov, bezmetallovye-koronki) — comparison tables, FAQ, PubMed sources, named author
- **Build**: 187 pages, 0 errors (65s)
- **Pushed**: commit ad7e0c7 to master

## 2026-06-17 — 25 thin blog articles expanded to 5000+ chars + content standards
- **New article**: `kultevaia-vkladka-pod-koronku.astro` — культевая вкладка (9952 chars)
- **Content standard**: `docs/blog-content-standards.md` — min 7000 chars (high-freq) / 5000 chars (low-freq), required sections (lead, FAQ, 4-6 h2, sources, CTA), author rules, meta-tags
- **Batch expansion**: expanded 25 blog articles from 848-4986 chars to 5000+ chars:
  - Batch A (8 articles, 848-1062 → 11-12k): protez-skripit, privkus-metalla, koronka-temnee, cemu-spat, bolit-chelyust, schel-mezhdu, protez-ploho, koronka-na-perednij
  - Batch B (11 articles, 1168-1653 → 9-11k): mozhno-li-otbelit, desna-otoshla, koronka-zhevatelnyj, snyatie-koronki, remont-proteza, protez-tresnul, mrt-s-implantami, mostovidnyj, vosstanovlenie-shtift, chem-chistit, koronka-cirkonievaya
  - Batch C (6 articles, 4147-4986 → 5.8-6.5k): koronka-ili-most, fiksaciya-koronki, implantatsiya-nn-cena, skolko-delayut, dezinfektsiya, koronka-metallokeramicheskaya
- **Build**: 188 pages, 0 errors (25.66s)
- **Pushed**: commit 3af7cf8 to master

## 2026-06-17 — 6 service pages: 4 thin pages rewritten, 2 enhanced
- **4 thin pages rewritten** with full ServiceArticle props: byugelnyj-klammery.astro (9-step procedure, 6 care, 4 stats, 3 materials, 2 comparison, 6 FAQ), immediat-implakril.astro (6-step, 6 care, 4 stats, 2 materials, 2 comparison, 5 FAQ), implakril.astro (6-step, 6 care, 4 stats, 2 materials, 2 comparison, 6 FAQ), sjemnyj-protez-implakril.astro (8-step, 6 care, 4 stats, 2 materials, 2 comparison, 6 FAQ)
- **2 enhanced**: condition.astro (added care + materials), variant.astro (added care)
- **Service page compliance**: 28/28 pages now have full 6/6 ServiceArticle props (100%)
- **Build**: 188 pages, 0 errors (60.70s)
- **Pushed**: commit 7aa2aaa to master

## 2026-06-17 — Queue dedup: check blog + drafts before generation
- **pass_fetch()** (pipeline-utils.js): now also checks `data/drafts/*.json` from GitHub tree + local dir
- **addTopic()** (agent-pipeline.js): calls `pass_fetch()` before enqueuing, returns duplicate info
- **Build**: 188 pages, 0 errors (57.68s)
- **Pushed**: commit e64355a to master

## 2026-06-28 — Site audit + position check script
- **Site audit**: проверены 137 статей блога, 62 услуги, промо-страницы. Найдено: 5 страниц с ценами, 3 битые ссылки, AI-маркеры в ~130 статьях, отсутствие FAQPage/Product/HowTo схем, 4 статьи без внутренних ссылок, дубли FAQ на 5 страницах категорий, 3 тонкие категории без введения
- **Audit report**: `wiki/audit/2026-06-28-site-audit.md` — 154 строки, 9 разделов
- **Position check script**: `scripts/check-positions.mjs` — GSC + Yandex Webmaster API
- **Проблема**: оба API недоступны с локальной машины (блокировка РФ), запуск только на VPS
- **Wiki**: index.md обновлён, создана `project/position-check.md`
- **teleskopicheskie-koronki.astro** (category: byugelnye-protezy) — 6500+ chars, comparison table (telekopicheskie vs klammery vs zamki), 4 material types, 8-step procedure, 7 FAQ, complications
- **kompozitnye-vkladki.astro** (category: koronki) — 6500+ chars, comparison table (vkladka vs keramika vs plomba), 4 material types, 8-step procedure, 7 FAQ, pricing
- **Build**: 190 pages, 0 errors (59.55s)
- **Pushed**: commit to master
