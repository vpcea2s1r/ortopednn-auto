## 2026-06-14 — Content Factory VPS deploy + Cloudflare DNS
- **VPS deploy**: docker-compose admin service (port 3001, CMD node admin/app.js), npm install, Nginx reverse proxy admin.ortopednn.ru → localhost:3001
- **Fixes**: 15+ corrupted template literals (backtick + ${} mangled by WriteAllText), SQL backticks, ESM imports (require→import), EJS templates, login.ejs rewritten as standalone HTML
- **Cloudflare**: A record admin.ortopednn.ru → 94.183.155.147 (TTL 120), API token for DNS management
- **Credentials**: nikitin / 4338365Q!, login POST works with url-encoded
- **Status**: admin container running, login 200/302, dashboard 500 (EJS close tag in layout.ejs — needs rebuild)

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
- РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ wiki-СЃС‚СЂСѓРєС‚СѓСЂС‹ (index.md, log.md, СЂР°Р·РґРµР»С‹)
- РЎРѕР·РґР°РЅ СЂР°Р·РґРµР» `medical/`, `project/`, `raw/`
- Seeded: 6 medical + 3 project + wiki-guide.md
- Р”РѕР±Р°РІР»РµРЅР° LLM Wiki Schema РІ AGENTS.md

## 2026-06-01 (v2 вЂ” СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёСЏ СЃ live-СЃС‚Р°С‚СЊСЏРјРё)
- **Ingest**: РїСЂРѕС‡РёС‚Р°РЅС‹ РєР»СЋС‡РµРІС‹Рµ СЃС‚Р°С‚СЊРё live-СЃР°Р№С‚Р° (РёРјРїР»Р°РЅС‚С‹, РєРѕСЂРѕРЅРєРё, Р±СЋРіРµР»СЊРЅС‹Рµ, СЃСЉС‘РјРЅС‹Рµ, РјРѕСЃС‚С‹, РјР°С‚РµСЂРёР°Р»С‹)
- **РћР±РЅРѕРІР»РµРЅС‹ 6 СЃС‚СЂР°РЅРёС†**: РєР°Р¶РґР°СЏ СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°РЅР° РїРѕ SEO-РїСЂРёРѕСЂРёС‚РµС‚Сѓ (РІС‹СЃРѕРєРёР№/СЃСЂРµРґРЅРёР№/РЅРёР·РєРёР№)
- **Implanty**: СЃС‚Р°С‚РёСЃС‚РёРєР° All-on-4 (98%), РІС‹Р¶РёРІР°РµРјРѕСЃС‚СЊ, С†РµРЅС‹ РќРќ, РїСЂРѕС‚РёРІРѕРїРѕРєР°Р·Р°РЅРёСЏ
- **Koronki**: С†РёСЂРєРѕРЅРёР№ vs РјРµС‚Р°Р»Р»РѕРєРµСЂР°РјРёРєР° (96% vs 90%), E-max, С‡Р°СЃС‚С‹Рµ РїСЂРѕР±Р»РµРјС‹
- **Semnye**: Р°РєСЂРёР»/РЅРµР№Р»РѕРЅ/AcryFree СЃСЂР°РІРЅРµРЅРёРµ + СѓС…РѕРґ + СЃСЂРµРґСЃС‚РІР°
- **Byugelnye**: Р·Р°РјРєРё vs РєР»Р°РјРјРµСЂС‹ (40% РјРµРЅСЊС€Рµ Р¶Р°Р»РѕР±), СЃСЂРѕРє СЃР»СѓР¶Р±С‹ Р·Р°РјРєРѕРІ
- **Mosty**: РёРјРїР»Р°РЅС‚ vs РјРѕСЃС‚ (95.6% vs 82.3%), Р°РґРіРµР·РёРІРЅС‹Р№ РјРѕСЃС‚
- **Materials**: CAD/CAM, 3D-РїРµС‡Р°С‚СЊ, С‚Р°Р±Р»РёС†С‹ РјР°С‚РµСЂРёР°Р»РѕРІ СЃ РїСЂРѕС‡РЅРѕСЃС‚СЊСЋ
- Р’СЃРµРіРѕ СЃС‚СЂР°РЅРёС†: 11 (6 medical + 4 project + 1 index)

## 2026-06-01 (v4 вЂ” Core Web Vitals)
- **Core Web Vitals**: Lighthouse РїСЂРѕРІРµСЂРєР° С‡РµСЂРµР· CLI (РіР»Р°РІРЅР°СЏ, СЃС‚Р°С‚СЊСЏ, СѓСЃР»СѓРіР°, РґРµСЃРєС‚РѕРї)
- **Р РµР·СѓР»СЊС‚Р°С‚С‹**: SEO 100 (РІСЃРµ), Desktop 95, Mobile 83вЂ“93, BP 77 (iframes + cookies)
- **РџСЂРѕР±Р»РµРјС‹**: TBT 230вЂ“490ms РЅР° mobile, CLS 0.14 РЅР° СѓСЃР»СѓРіР°С…
- **Р РµРєРѕРјРµРЅРґР°С†РёРё**: lazy loading, font-display:swap, fixed img dimensions, render-blocking audit
- **РћР±РЅРѕРІР»С‘РЅ**: `wiki/project/progress-report.md` вЂ” РґРѕР±Р°РІР»РµРЅС‹ CWV С‚Р°Р±Р»РёС†Р° Рё СЂРµРєРѕРјРµРЅРґР°С†РёРё

## 2026-06-01 (v4 вЂ” CWV С„РёРєСЃС‹ + Р±РѕС‚)
- **CWV С„РёРєСЃС‹**: Inter font-weight 800 РґРѕР±Р°РІР»РµРЅ, РЇРЅРґРµРєСЃ.РњРµС‚СЂРёРєР° РїРµСЂРµРЅРµСЃРµРЅР° РёР· `<head>` РІ `<body>` (async), `title` РґРѕР±Р°РІР»РµРЅ РЅР° iframe РєР°СЂС‚С‹
- **Push**: 13 С„Р°Р№Р»РѕРІ (5 РЅРѕРІС‹С… СЃС‚Р°С‚РµР№ + CWV + wiki) С‡РµСЂРµР· GitHub API
- **Р‘РѕС‚**: РґРёР°РіРЅРѕСЃС‚РёСЂРѕРІР°РЅ Рё РїРѕС‡РёРЅРµРЅ вЂ” GH_TOKEN РїСЂРѕС‚СѓС…, РєРѕРЅС‚РµР№РЅРµСЂ РїРµСЂРµСЃРѕР±СЂР°РЅ, РјРµРЅСЋ СЂР°Р±РѕС‚Р°РµС‚
- **Р§РµСЂРЅРѕРІРёРєРё 404**: pipeline-РґСЂР°С„С‚С‹ РЅРµ РїСѓС€Р°С‚СЃСЏ РЅР° stomatolog в†’ РІ `/drafts` СЃСЃС‹Р»РєР° РїРѕРєР°Р·С‹РІР°РµС‚СЃСЏ С‚РѕР»СЊРєРѕ РґР»СЏ stomatolog-РґСЂР°С„С‚РѕРІ. Р¤РёРєСЃ: `server/bot.js`, commit `17ba473`
- **РЇРЅРґРµРєСЃ.Р’РµР±РјР°СЃС‚РµСЂ**: `searchable_pages_count: 0` РёР·-Р·Р° РѕРіСЂР°РЅРёС‡РµРЅРЅРѕРіРѕ scope `webmaster:hostinfo` вЂ” РЅСѓР¶РµРЅ `webmaster:searchapi`
- **Wiki**: `wiki/project/bot-draft-404.md` вЂ” РґРѕРєСѓРјРµРЅС‚Р°С†РёСЏ С„РёРєСЃР°

## 2026-06-01 (v5 вЂ” Р°РґРіРµР·РёРІРЅС‹Р№ РјРѕСЃС‚)
- **6-СЏ СЃС‚Р°С‚СЊСЏ РёР· gap**: В«РђРґРіРµР·РёРІРЅС‹Р№ РјРѕСЃС‚ вЂ” С‡С‚Рѕ СЌС‚Рѕ, РїР»СЋСЃС‹ Рё РјРёРЅСѓСЃС‹, СЃРєРѕР»СЊРєРѕ СЃР»СѓР¶РёС‚В» (`adgezivnyj-most`)
- **РљР°С‚РµРіРѕСЂРёСЏ**: `mosty` (С‚РµРїРµСЂСЊ 7 СЃС‚Р°С‚РµР№ РІ РєР»Р°СЃС‚РµСЂРµ)
- **Build**: 194 pages, 0 errors
- **Push**: commit 50f59fe РЅР° master вЂ” GitHub Actions РґРµРїР»РѕР№
- **Р’СЃРµРіРѕ СЃС‚Р°С‚РµР№**: 82

## 2026-06-01 (v3 вЂ” РЅР°СѓРєРѕРїРї-СЃС‚Р°С‚СЊРё)
- **Р”РѕР±Р°РІР»РµРЅ СЂР°Р·РґРµР» Р”Р·РµРЅ**: `wiki/project/dzen.md` (RSS, РєР°РЅР°Р», СѓС‡С‘С‚РЅС‹Рµ РґР°РЅРЅС‹Рµ)
- **5 РЅРѕРІС‹С… РЅР°СѓС‡РїРѕРї-СЃС‚Р°С‚РµР№** (РЅРёР·РєРѕС‡Р°СЃС‚РѕС‚РЅРёРєРё):
  1. В«РњРёРєСЂРѕР±РёРѕРј РїРѕР»РѕСЃС‚Рё СЂС‚Р°: РєР°Рє РјРµРЅСЏРµС‚СЃСЏ РјРёРєСЂРѕС„Р»РѕСЂР° РїРѕСЃР»Рµ РїСЂРѕС‚РµР·РёСЂРѕРІР°РЅРёСЏВ» вЂ” `mikrobiom-polosti-rta-protezirovanie`
  2. В«Р‘РёРѕРїР»С‘РЅРєР° РЅР° Р·СѓР±Р°С… Рё РїСЂРѕС‚РµР·Р°С… вЂ” С‡С‚Рѕ СЌС‚Рѕ Рё С‡РµРј РѕРїР°СЃРЅР°В» вЂ” `bioplenka-na-zubnyh-protezah`
  3. В«Р“Р°Р»СЊРІР°РЅРёС‡РµСЃРєРёРµ С‚РѕРєРё РІРѕ СЂС‚Сѓ: РѕРїР°СЃРЅРѕ Р»Рё СЃРѕС‡РµС‚Р°РЅРёРµ РјРµС‚Р°Р»Р»РѕРІ РІ РєРѕСЂРѕРЅРєР°С…В» вЂ” `galvanizm-v-stomatologii`
  4. В«РџРѕС‡РµРјСѓ РёСЃС‡РµР·Р°РµС‚ РєРѕСЃС‚СЊ С‡РµР»СЋСЃС‚Рё РїРѕСЃР»Рµ СѓРґР°Р»РµРЅРёСЏ Р·СѓР±Р° вЂ” Р°С‚СЂРѕС„РёСЏ Рё Р·Р°РєРѕРЅ Р’РѕР»СЊС„Р°В» вЂ” `atrofiya-kostnoj-tkani-chelyusti`
  5. В«РћСЃС‚РµРѕРёРЅС‚РµРіСЂР°С†РёСЏ: РєР°Рє РєРѕСЃС‚РЅР°СЏ С‚РєР°РЅСЊ СЃСЂР°СЃС‚Р°РµС‚СЃСЏ СЃ С‚РёС‚Р°РЅРѕРІС‹Рј РёРјРїР»Р°РЅС‚РѕРјВ» вЂ” `osteointegratsiya-kak-kost-srastaetsya-s-titanom`
- **Build**: 188 pages, 0 errors
- **Push**: 2 РєРѕРјРјРёС‚Р° РЅР° master (RSS + СЃС‚Р°С‚СЊРё) вЂ” GitHub Actions РґРµРїР»РѕР№
- **RSS-Р»РµРЅС‚Р°**: `https://ortopednn.ru/rss.xml` вЂ” 67+ СЃС‚Р°С‚РµР№, Р”Р·РµРЅ РіРѕС‚РѕРІ Рє РїРѕРґРєР»СЋС‡РµРЅРёСЋ
- **Р”Р·РµРЅ-РєР°РЅР°Р»**: Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ `dzen.ru/ortopednn`

## 2026-06-01 (v6 вЂ” РєР°С‚РµРіРѕСЂРёР·Р°С†РёСЏ 6 СЃС‚Р°С‚РµР№)
- **РљР°С‚РµРіРѕСЂРёР·РёСЂРѕРІР°РЅРѕ 6 СЃС‚Р°С‚РµР№**: `kurenie-posle-protezirovaniya`в†’implanty, `bioplenka-na-zubnyh-protezah`в†’semnye, `mikrobiom-polosti-rta`в†’semnye, `cad-cam-v-stomatologii`в†’koronki, `parodontit-i-bolezn-altsgeymera`в†’implanty, `ukhod-za-polostyu-rta-posle-protezirovaniya`в†’implanty
- **РћСЃС‚Р°Р»РѕСЃСЊ Р±РµР· РєР°С‚РµРіРѕСЂРёРё**: 6 (zdorove-polosti-rta, podgotovka, etapy, ceny-nn, first-visit, protezirovanie-nn-ceny вЂ” truly general)
- **РС‚РѕРіРѕРІС‹Рµ РєР»Р°СЃС‚РµСЂС‹**: implanty=18, koronki=31, semnye=19, byugelnye=6, mosty=7
- **Build**: 194 pages, 0 errors
- **Push**: commit 00c25a5 (GH API)

## 2026-06-01 (v7 вЂ” TL;DR СѓРґР°Р»С‘РЅ РёР· СЃС‚Р°С‚РµР№)
- **TL;DR**: СѓРґР°Р»С‘РЅ `<strong>TL;DR:</strong>` РёР· РІСЃРµС… 26 `.astro` СЃС‚Р°С‚РµР№ (Р»РёРґ-Р°Р±Р·Р°С† СЃРѕС…СЂР°РЅС‘РЅ)
- **writer.md**: РѕР±РЅРѕРІР»С‘РЅ вЂ” TL;DR Р·Р°РјРµРЅС‘РЅ РЅР° Р»РёРґ-Р°Р±Р·Р°С†, С‡РµРєР»РёСЃС‚ РёСЃРїСЂР°РІР»РµРЅ
- **Build**: 194 pages, 0 errors
- **Push**: commit 7f63304 (Git Tree API, 30 entries)

## 2026-06-02 вЂ” Bot preview 404 fix
- **РџСЂРѕР±Р»РµРјР°**: pipeline-РґСЂР°С„С‚С‹ РІРѕР·РІСЂР°С‰Р°Р»Рё URL `ortopednn.ru/preview/<slug>/`, РЅРѕ JSON РІ `data/drafts/` РЅРµ СЃРѕС…СЂР°РЅСЏР»СЃСЏ в†’ 404
- **Р¤РёРєСЃ**: РІ `server/bot.js` РїРѕСЃР»Рµ РїСѓС€Р° HTML РІ stomatolog РґРѕР±Р°РІР»РµРЅ push JSON РІ `data/drafts/<slug>.json` СЂРµРїРѕР·РёС‚РѕСЂРёСЏ ortopednn-auto
- **РЎС‚Р°С‚СѓСЃ**: РєРѕРЅС‚РµР№РЅРµСЂ РїРµСЂРµСЃРѕР±СЂР°РЅ (`docker compose build --no-cache`), РїРµСЂРµР·Р°РїСѓС‰РµРЅ, health OK
- **Wiki**: `wiki/project/bot-preview-404.md` вЂ” РґРѕРєСѓРјРµРЅС‚Р°С†РёСЏ С„РёРєСЃР°

## 2026-06-02 (v8 вЂ” 5 РЅР°СѓС‡РїРѕРї-СЃС‚Р°С‚РµР№)
- **5 РЅРѕРІС‹С… РЅР°СѓС‡РїРѕРї-СЃС‚Р°С‚РµР№** (РЅРёР·РєРѕС‡Р°СЃС‚РѕС‚РЅРёРєРё):
  1. В«РљР°Рє СЃР»СЋРЅР° РІР»РёСЏРµС‚ РЅР° С„РёРєСЃР°С†РёСЋ Рё СЃСЂРѕРє СЃР»СѓР¶Р±С‹ Р·СѓР±РЅС‹С… РїСЂРѕС‚РµР·РѕРІВ» вЂ” `slyuna-i-protezirovanie-zubov` (semnye-protezy)
  2. В«РњРµРЅСЏРµС‚СЃСЏ Р»Рё РІРєСѓСЃ РїРѕСЃР»Рµ РїСЂРѕС‚РµР·РёСЂРѕРІР°РЅРёСЏВ» вЂ” `vkus-posle-protezirovaniya` (semnye-protezy)
  3. В«Р’РќР§РЎ Рё РїСЂРѕС‚РµР·РёСЂРѕРІР°РЅРёРµ вЂ” Р±РѕР»СЊ, С…СЂСѓСЃС‚, С‰РµР»С‡РєРёВ» вЂ” `visochno-nizhnechelyustnoj-sustav-protezirovanie` (koronki)
  4. В«РљР°Рє СЂР°СЃРїСЂРµРґРµР»СЏРµС‚СЃСЏ Р¶РµРІР°С‚РµР»СЊРЅР°СЏ РЅР°РіСЂСѓР·РєР°: РёРјРїР»Р°РЅС‚С‹ РїСЂРѕС‚РёРІ СЃСЉС‘РјРЅС‹С… РїСЂРѕС‚РµР·РѕРІВ» вЂ” `raspredelenie-nagruzki-implanty-semnye-protezy` (implanty)
  5. В«РџСЊРµР·РѕС…РёСЂСѓСЂРіРёСЏ РІ СЃС‚РѕРјР°С‚РѕР»РѕРіРёРё вЂ” СѓР»СЊС‚СЂР°Р·РІСѓРєРѕРІРѕР№ СЃРєР°Р»СЊРїРµР»СЊВ» вЂ” `piezohirurgiya-v-stomatologii` (implanty)
- **Build**: 199 pages, 0 errors
- **РС‚РѕРі**: 87 СЃС‚Р°С‚РµР№ (6 uncategorized, РѕСЃС‚Р°Р»СЊРЅС‹Рµ РїРѕ РєР»Р°СЃС‚РµСЂР°Рј)
- **Push**: С‡РµСЂРµР· GitHub API

## 2026-06-02 вЂ” SEO: Р”Р·РµРЅ + Telegram СЃС‚СЂР°С‚РµРіРёСЏ
- **Р”Р·РµРЅ**: RSS РїРѕР»РЅРѕСЃС‚СЊСЋ РіРѕС‚РѕРІ (content:encoded, enclosure, РєР°С‚РµРіРѕСЂРёРё), РЅСѓР¶РЅРѕ РїРѕРґРєР»СЋС‡РёС‚СЊ РёСЃС‚РѕС‡РЅРёРє РІ РЅР°СЃС‚СЂРѕР№РєР°С… РєР°РЅР°Р»Р°
- **Telegram-РєР°РЅР°Р»**: СЃРѕР·РґР°РЅ `@ortopednn`, Р±РѕС‚ `@ortopednn52_bot` Р¶РґС‘С‚ РґРѕР±Р°РІР»РµРЅРёСЏ Р°РґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂРѕРј
- **bot.js**: РґРѕР±Р°РІР»РµРЅР° С„СѓРЅРєС†РёСЏ `postToChannel()`, РІС‹Р·С‹РІР°РµС‚СЃСЏ РїСЂРё `/autogen` Рё `/horizon`
- **Wiki**: `wiki/project/dzen.md` вЂ” РѕР±РЅРѕРІР»С‘РЅ (RSS-СЃС‚Р°С‚СѓСЃ, Telegram-РєР°РЅР°Р», СЃС…РµРјР° СЂР°Р±РѕС‚С‹)

## 2026-06-02 вЂ” Push Artifacts Check
- **РџСЂРѕР±Р»РµРјР°**: push 5 СЃС‚Р°С‚РµР№ С‡РµСЂРµР· API СЃРѕР·РґР°Р» stale tree entries вЂ” CI СѓРїР°Р»
- **Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ**: reset РґРѕ `6572b03`, РїРµСЂРµСЃРѕР·РґР°РЅРёРµ С‡РёСЃС‚РѕРіРѕ РґРµСЂРµРІР°
- **Wiki**: `wiki/project/push-artifacts-check.md` вЂ” РїСЂР°РІРёР»Рѕ РІРµСЂРёС„РёРєР°С†РёРё РїРµСЂРµРґ/РїРѕСЃР»Рµ push

## 2026-06-02 вЂ” Yandex indexing: Crawl-delay removed
- **РџСЂРѕР±Р»РµРјР°**: РЇРЅРґРµРєСЃ РїСЂРѕРёРЅРґРµРєСЃРёСЂРѕРІР°Р» 1 СЃС‚СЂР°РЅРёС†Сѓ РёР· 150+. Crawl-delay: 2 Р·Р°РјРµРґР»СЏР» РѕР±С…РѕРґ
- **Р¤РёРєСЃ**: СѓРґР°Р»С‘РЅ `Crawl-delay: 2` РёР· `public/robots.txt` РґР»СЏ Yandex
- **Р”РµРїР»РѕР№**: commit `3270992b` в†’ GitHub Actions в†’ live

## 2026-06-02 вЂ” Humanizer-ru РёРЅС‚РµРіСЂРёСЂРѕРІР°РЅ РІ РїР°Р№РїР»Р°Р№РЅ
- **РџСЂРѕР±Р»РµРјР°**: СЃС‚Р°С‚СЊРё РІС‹РіР»СЏРґСЏС‚ AI-СЃРіРµРЅРµСЂРёСЂРѕРІР°РЅРЅС‹РјРё РґР»СЏ РЇРЅРґРµРєСЃР° (РѕРґРёРЅР°РєРѕРІР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР°, Р±РµР· Р»РёС‡РЅРѕРіРѕ РіРѕР»РѕСЃР°, 29+ AI-РїР°С‚С‚РµСЂРЅРѕРІ)
- **Р РµС€РµРЅРёРµ**: СЃРѕР·РґР°РЅР° `humanize(text)` С„СѓРЅРєС†РёСЏ РІ `agent-pipeline.js` вЂ” СѓРґР°Р»СЏРµС‚ СЃРІСЏР·РєРё-РїРµСЂРµС…РѕРґС‹, РєР°РЅС†РµР»СЏСЂРёС‚, AI-СЃР»РѕРІР°, СЂР°Р·РјС‹С‚С‹Рµ Р°С‚СЂРёР±СѓС†РёРё, РѕРіСЂР°РЅРёС‡РёРІР°РµС‚ С‚РёСЂРµ
- **checkAiTells()**: РґРѕР±Р°РІР»РµРЅР° РїСЂРѕРІРµСЂРєР° 20+ СЂСѓСЃСЃРєРёС… AI-РїР°С‚С‚РµСЂРЅРѕРІ (Р±С‹Р»Рѕ 0 вЂ” С‚РѕР»СЊРєРѕ Р°РЅРіР»РёР№СЃРєРёРµ)
- **РРЅС‚РµРіСЂР°С†РёСЏ**: `rewrite()` (bot.js), `writerAgent()`, `reviewAgent()` (agent-pipeline.js) вЂ” humanize РїСЂРёРјРµРЅСЏРµС‚СЃСЏ РїРѕСЃР»Рµ РіРµРЅРµСЂР°С†РёРё
- **РљРѕРЅС‚РµР№РЅРµСЂ**: РїРµСЂРµСЃРѕР±СЂР°РЅ, РїРµСЂРµР·Р°РїСѓС‰РµРЅ
- **Wiki**: `wiki/project/humanizer-integration.md`
- **РџСЂРѕР±Р»РµРјР°**: РЇРЅРґРµРєСЃ РїСЂРѕРёРЅРґРµРєСЃРёСЂРѕРІР°Р» 1 СЃС‚СЂР°РЅРёС†Сѓ РёР· 150+. Crawl-delay: 2 Р·Р°РјРµРґР»СЏР» РѕР±С…РѕРґ
- **Р¤РёРєСЃ**: СѓРґР°Р»С‘РЅ `Crawl-delay: 2` РёР· `public/robots.txt` РґР»СЏ Yandex
- **Р”РµРїР»РѕР№**: commit `3270992b` в†’ GitHub Actions в†’ live

## 2026-06-02 вЂ” Bot: plain text rewrite Р±РµР· PubMed
- **РџСЂРѕР±Р»РµРјР°**: PubMed РЅР°С…РѕРґРёР» РЅРµСЂРµР»РµРІР°РЅС‚РЅС‹Рµ СЃС‚Р°С‚СЊРё РґР»СЏ СЂСѓСЃСЃРєРёС… Р·Р°РїСЂРѕСЃРѕРІ (С€РєР°Р»Р° Vita в†’ Р°РЅС‚РёРґРµРїСЂРµСЃСЃР°РЅС‚С‹)
- **Р¤РёРєСЃ**: СѓРґР°Р»С‘РЅ `searchPubMed()` РёР· РѕР±СЂР°Р±РѕС‚С‡РёРєР° plain text, РїСЂСЏРјРѕР№ РІС‹Р·РѕРІ `rewrite(null, text)`
- **РљРѕРЅС‚РµР№РЅРµСЂ**: РїРµСЂРµСЃРѕР±СЂР°РЅ Рё РїРµСЂРµР·Р°РїСѓС‰РµРЅ РЅР° VPS
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
- **ServiceArticle.astro** — added 6 optional standardized section props: procedure, care, stats, materials, aq, comparison
- **Props interface**: all optional (default []), backward compatible
- **CSS**: added complete styling for all standardized sections (procedure list with counters, materials grid, stats cards, care list with checks, FAQ accordion, comparison pros/cons)
- **Demo**: cirkonievaya-koronka.astro converted from 91-line thin page → uses procedure, care, stats, comparison props + keeps slot for unique content
- **Build**: 199 pages, 0 errors (21.66s)
- **Wiki**: wiki/project/service-content-depth.md — strategy doc with required pattern, props table, priority list
- **Next**: rewrite remaining 38 thin pages
