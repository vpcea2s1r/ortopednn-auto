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
- **Результаты**: SEO 100 (все), Desktop 95, Mobile 83–93, BP 77 (iframes + cookies)
- **Проблемы**: TBT 230–490ms на mobile, CLS 0.14 на услугах
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
- **5 новых научпоп-статей** (низкочастотники):
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
