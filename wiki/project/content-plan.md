# Контент-план

## Статус
- Всего статей на сайте: ~157 (blog + checkup + полезная информация)
- Всего страниц: 256
- Покрытие ключевых слов: 29/29 (100%)
- Ключевые слова без статей: 0

## Батч 4 — ядро Wordstat (2026-08-02)

Отобраны из `docs/research/wordstat-core.txt` — неохваченные кластеры с максимальным спросом (показы/мес, РФ).
**Проверка уникальности:** 7 из 10 тем отсеяны как каннибализация существующих статей (правило AGENTS.md 7.1). Опубликовано только 3.

### ✅ Опубликовано
| Тема | Slug | Кластер | Показы/мес |
|------|------|---------|-----------:|
| Виниры: что это, виды, плюсы и минусы | viniry-chto-eto | виниры | 227 168 |
| Акриловый протез | akrilovyj-protez | акриловый протез | 11 980 |
| Нейлоновый протез | nejlonovyj-protez | нейлоновый протез | 8 700 |

### ❌ Отклонено (каннибализация)
| Тема | Slug | Дублирует |
|------|------|-----------|
| Имплантация зубов | implantatsiya-zubov | protezirovanie-na-implantah (этапы, сроки, противопоказания) |
| Коронка на зуб | koronka-na-zub | vidy-zubnyh-koronok (виды, сроки, FAQ) |
| Съёмные протезы: виды | semnye-protezy | kakie-semnye-protezy-luchshe + vidy-zubnyh-protezov |
| Металлокерамические коронки | metallokeramicheskie-koronki | koronka-metallokeramicheskaya-otzyvy |
| Как ставят коронку | kak-stavyat-koronku | podgotovka-k-ustanovke-koronki-etapy-materialy-i-sroki |
| Консультация ортопеда | konsultatsiya-ortopeda | first-visit (что происходит на приёме) |
| Бюгельный протез: что это | byugelnyj-protez-chto-eto | byugelnyj-protez-klammery + byugelnyj-ili-semnyj-protez |

## Очередь (из ядра Wordstat)

Темы с реальным спросом. **Перед написанием — повторная проверка уникальности (AGENTS.md 7.1):** многие запросы ядра уже закрыты существующими статьями.

| Тема | Slug | Кластер | Показы/мес | Комментарий |
|------|------|---------|-----------:|-------------|
| Стоматолог-ортопед: кто это | stomatolog-ortoped | стоматолог ортопед | 148 997 | Возможно хаб/посадочная, не статья |
| Консультация стоматолога-ортопеда | konsultatsiya-ortopeda | консультация ортопеда | 8 132 | ⚠️ Каннибализирует first-visit |
| Имплант или коронка: что лучше | implant-ili-koronka | — | — | Уточнить спрос (ключевой "имплант или коронка") |
| Мост или имплант: что лучше | most-ili-implant | — | — | Уточнить спрос |

## Выполненные планы

### Батч 3 (2026-07-16) — ✅ опубликовано
- zamena-koronki, otbelivanie-do-ili-posle-protezirovaniya, protezirovanie-posle-udaleniya-zuba-mudrosti, protezirovanie-dlya-pozhilykh

### Ранее запланированные (уже написаны)
1. «Больно ли ставить импланты зубов» (implanty)
2. «Зуб под коронкой гниет — что делать» (koronki)
3. «Коронки на зубы цена в Нижнем Новгороде» (geo)
4. «Адгезивный мост — что это, показания» (mosty)
5. «Бюгельный протез цена в Нижнем Новгороде» (geo)
6. «Съёмный протез на верхнюю челюсть» (semnye-protezy)

## Категории статей
- **implanty** — протезирование на имплантах
- **koronki** — коронки
- **semnye-protezy** — съёмные протезы
- **byugelnye-protezy** — бюгельные протезы
- **mosty** — мостовидные протезы
- **uncategorized** — общие

## Формат статьи
- Slug: `/blog/<english-slug>/`
- Frontmatter: title, description, category, pubDate, author
- Body: SEO-friendly контент (без цен)
- Битые ссылки — не добавлять

## Мета-теги
- title: 50-60 chars
- description: 140-165 chars
- robots: index, follow
- canonical: self
