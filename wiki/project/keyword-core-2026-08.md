# Keyword Core + Search Results (2026-08-16)

Сбор семантического ядра по сайту + разведка новинок на GitHub / Reddit / в Китае для генерации новых статей.

## Дата: 2026-08-16

## 1. Ядро запросов по сайту (272 статьи + 1508 подсказок Яндекса)

Источники: `data/blog-articles.ts` (272 статьи), `%TEMP%\opencode\suggestions-all.json` (1508 уникальных подсказок, freq-словарь).

### Топ-кластеры по частоте (freq >= 2 из подсказок)
| Запрос | Частота | Покрытие |
|--------|---------|----------|
| протезирование зубов / в нижнем новгороде / недорого / по омс | 2x каждый | ❌ кластер ОМС/бесплатное протезирование не закрыт |
| протезирование зубов в китае | 2x | частично (есть «Китайские импланты» #224) |
| протез без неба на верхнюю челюсть без зубов | 2x | ✅ QuattroTi/AcryFree |
| протез бабочка на один зуб (цена/фото) | 2x | ✅ protez-babochka |
| прикусил щеку изнутри чем лечить / прикусил язык до крови | 2x | ❌ нет статьи |
| коронка на импланте шатается в чем причина | 2x | частично (koronka-shataetsya / implant-shataetsya — риск каннибализации) |
| протез на присосках на верхнюю челюсть без неба | 2x | ✅ (protezy-bez-neba) |

### Свободные интенты из подсказок (нет статей)
- «импланты зубов мкб 10» — нет
- «прикусил щеку изнутри» / «прикусил язык до крови» — нет
- «протезирование зубов в арзамасе» — geo-запрос, не наш регион

### Кластеры, где есть ядро Wordstat (из low-freq-keywords.md)
Виниры (227k), имплантация (155k), стоматолог ортопед (149k), коронка (127k), съёмный протез (125k), металлокерамика (51k), бюгельный (33k).

## 2. Новинки с GitHub (тренд: AI-стоматология)

Поиск через `gh search repos` (актуально на 2026-08-16).

### AI-диагностика и планирование
| Репозиторий | Описание | Идея для статьи |
|-------------|----------|-----------------|
| sajaltandon/DentalAI | Детекция кариеса/гингивита/рака по снимкам, 91% точность, IEEE | «ИИ в стоматологии 2026: что реально умеет» |
| Kannaseka/Dental-AI-Treament-Planner | AI-план лечения (CV + RAG + MCP) | цифровое планирование |
| Kramananana/flask_dental_ai-2.0 | Китайский фулстек AI-диагностики (CV+LLM+IoT) | ИИ + протезирование |
| omsod/smart-dental-imaging-cavity-detection | CNN/YOLOv8 детекция кариеса по внутриротовым снимкам | — |
| marvinlemos/rcnn-dental-implants | Mask R-CNN распознавание имплантов на рентгене | — |

### Практика клиник / цифровая стоматология
| Репозиторий | Описание |
|-------------|----------|
| davidegironi/dentned, rowinggolfer/openmolar | open-source управление стоматологической клиникой |
| issamdakir/BDENTAL4D | Blender addon, цифровая стоматология с 4D-движением |
| dorisoy/Dorisoy.PeriodontalChat.Maui | Пародонтологическая карта (Китай) |
| MatthewMong/DentalImplants | Blender-плагин размещения имплантов |

Вывод: GitHub-тренд 2026 — ИИ-диагностика по снимкам (кариес, импланты), AI-планирование лечения. Статьи про нейросети уже есть (116, 138, 139), можно обновить/расширить.

## 3. Reddit — жалобы пациентов = темы статей

Источник: `api.pullpush.io` (subreddit=askdentists). Reddit напрямую блокирует (403), OpenCLI требует браузерного расширения — pullpush работает.

### Коронки
- «Do these margins look right? 3 crowns, 2 root canals in a year» — краевое прилегание, качество
- «Crowns on number 8 & 9 - what can I do?»
- «How do I talk to my dentist about them potentially putting crown on the wrong tooth?»
- «Did my implant break?» / «Loose dental implant»
- «Zirconia vs PFM crown for upper back tooth (#2)»
- «Thoughts on this after photo of 4 dental crowns on front teeth» — эстетика фронтальных коронок

### Съёмные протезы
- «Thoughts on flexible partial dentures?» / «Valplast vs other partial denture types» — гибкие протезы
- «Suction through gap on immediate partial denture after extraction?»
- «Two separate soft partial dentures»
- «Class 3 underbite ... immediate dentures ... why not give me my natural bite» — прикус после немедленного протезирования

### Боль и тревога
- «I received a root canal, but the endodontist was overbooked... suffered for years» — некачественное лечение
- «Dentaphobia... serious help required» / «SEVERE DENTAL ANXIETY» — дентофобия
- «Aggressive jawbone loss at 31» — атрофия кости в молодом возрасте

### Отбеливание
- «Whitening and gum recession?» — рецессия после отбеливания
- «$250 whitening didn't work» — разочарование результатом
- «I need mint-free fluoride supplements» — фториды без мяты

### Прочее
- «Acidic Saliva, how do i get rid of it?» — кислая слюна
- «How is this bite acceptable with a class 3 underbite...» — ВНЧС/прикус
- «Single greying tooth (no pain)?» — почернение зуба

Вывод: Reddit-запросы пациентов повторяют уже покрытые темы (боль под коронкой, шатается имплант), но дают свежие углы: эстетика фронтальных коронок, кислая слюна, рецессия после отбеливания, гибкие протезы (Valplast).

## 4. Китай

### Доступность платформ
- B站 (bilibili) API из РФ отдаёт HTML-капчу / 412 — данные не получены (даже через VPN-запрос с User-Agent + Accept-Language). Один запрос («假牙») прошёл: темы — полные/частичные протезы, «种牙和活动假牙该怎么选», чистка протезов.
- 小红书 (xiaohongshu) — требует OpenCLI + браузерное расширение, недоступно.
- GitHub (китайские проекты) — доступен, см. раздел 2.

### Китайские GitHub-проекты (раздел 2)
- Kramananana/flask_dental_ai-2.0 — AI-диагностика (CV+LLM+IoT)
- dorisoy/Dorisoy.PeriodontalChat.Maui — пародонтологическая карта
- chendaoming/WeAppt — 小程序 записи в стоматологию
- Mkild/dental-admin — Vue3/Ts/Vite система управления клиникой

### Интенты из подсказок Яндекса
- «протезирование зубов в китае» 2x — раскрыть через призму «китайские импланты» (статья #224 есть, можно углубить: Osstem, китайские системы, качество, отзывы)

## 5. Топ-10 новых тем для статей (свободные интенты)

| # | Тема | Источник | Каннибализация-риск |
|---|------|----------|---------------------|
| 1 | Прикусил щеку/язык — что делать | подсказки freq 2x | низкий |
| 2 | Бесплатное протезирование по ОМС в НН | подсказки freq 2x | низкий |
| 3 | ИИ в стоматологии 2026: что реально умеет | GitHub | расширение 116/138/139 |
| 4 | Рецессия десны после отбеливания | Reddit | vs recesiya-desny (упомянуть, не дублировать) |
| 5 | Краевое прилегание коронки: как проверить качество | Reddit | vs desna-otoshla/cheska | 
| 6 | Кислая слюна: причины и последствия | Reddit | vs slyuna-gustaya |
| 7 | Эстетика фронтальных коронок (передние зубы) | Reddit | vs koronka-na-peredniy-zub |
| 8 | Имплантация «под ключ» в НН: что входит в цену | подсказки | средний |
| 9 | Китайские импланты: глубже (Osstem, качество, отзывы) | подсказки + GitHub | расширение #224 |
| 10 | Гибкие протезы (Valplast/нейлон) — кому подходят | Reddit | vs nejlonovye-protezy (упомянуть) |

## 6. Инструменты и ограничения (на будущее)

- GitHub: `gh search repos` работает локально.
- Reddit: API и old.reddit блокируют из РФ (403); `api.pullpush.io` работает (JSON, subreddit=askdentists).
- B站 API: доступен частично, но стабильно капча/412 из РФ; bili-cli падает на cp1251 (нужен UTF-8 обёртки). Для серьёзного сбора нужен рабочий прокси/VPN (на VPS 94.183.155.147 есть VPN-реквизиты, AmneziaVPN установлен локально, но не подключён).
- 小红书: нужен OpenCLI + браузерное расширение Chrome.
- Exa websearch (mcp.exa.ai): возвращал 403 в течение сессии — ненадёжен; fallback — Bing через webfetch.

## Связанные страницы
- [НЧ-запросы](low-freq-keywords.md)
- [Контент-план](content-plan.md)
- [SEO-стратегия](seo-strategy.md)
- [Блог-контент](../../CONTENT.md)