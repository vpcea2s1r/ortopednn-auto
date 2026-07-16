# НЧ-статьи и хаб-страница (2026-07-12)

## Контекст

SEO-позиции (2026-07-14): ortopednn.ru занимает **#1** по "стоматолог-ортопед нижний новгород", но **НЕ в топ-10** по коммерческому запросу "протезирование зубов нижний новгород". Конкуренты (artdentnn.ru, drdentnn.ru, myata-nn.ru, stomatology-nnov.ru) все имеют: цены, сеть клиник, онлайн-запись, рассрочку.

Наше преимущество: 150+ статей (контентная глубина), 30-летний опыт врача.

## Стратегия

Целевая страница-хаб + НЧ-статьи для расширения семантического ядра и укрепления позиций по среднечастотным и низкочастотным запросам.

## Хаб-страница

**Файл:** `src/pages/protezirovanie-zubov-v-nizhnem-novgorode.astro`

- **URL:** `/protezirovanie-zubov-v-nizhnem-novgorode/`
- **H1:** "Протезирование зубов в Нижнем Новгороде"
- **Schema:** FAQPage (6 вопросов) + Dentist LocalBusiness (geo coordinates, areaServed)
- **Внутренние ссылки:** 6 сервисных страниц + 6 блог-статей
- **CTA:** Телефон

## 10 НЧ-статей

| # | Slug | Категория | Тема |
|---|------|-----------|------|
| 1 | shiniruyushchij-byugel | byugelnye-protezy | Шинирующий бюгельный протез |
| 2 | most-na-3-zuba | mosty | Мост на 3 зуба |
| 3 | klkt-pered-protezirovaniem | diagnostika | КЛКТ перед протезированием |
| 4 | vnutrirotovoe-skanirovanie | diagnostika | Внутриротовое сканирование |
| 5 | neyroseti-dlya-analiza-snimkov | ai | Нейросети для анализа снимков |
| 6 | ii-dlya-planirovaniya-implantatsii | ai | ИИ для планирования имплантации |
| 7 | gnotologiya-diagnostika-lechenie | vnchs | Гнатология: диагностика и лечение |
| 8 | golovnaya-bol-pri-vnchs | vnchs | Головная боль при дисфункции ВНЧС |
| 9 | artrit-visochno-nizhnechelyustnogo-sustava | vnchs | Артрит ВНЧС |
| 10 | irrigator-dlya-polosti-rta | semnye-protezy | Ирригатор для полости рта |

### Дополнительные НЧ-статьи (из предыдущих батчей)

| # | Slug | Категория | Тема |
|---|------|-----------|------|
| 11 | sravnenie-sistem-implantov | implanty | Сравнение систем имплантов |
| 12 | implantatsiya-pri-kurenii | implanty | Имплантация при курении |
| 13 | zubnye-protezy-posle-60 | semnye-protezy | Протезы после 60 лет |
| 14 | implantatsiya-pri-parodontite | implanty | Имплантация при пародонтите |
| 15 | protezirovanie-pri-parodontoze | semnye-protezy | Протезирование при пародонтозе |
| 16 | mikoprotezirovanie | koronki | Микропротезирование |
| 17 | all-on-6 | implanty | All-on-6 |
| 18 | psikhologicheskaya-adaptatsiya | semnye-protezy | Психологическая адаптация к протезам |
| 19 | implant-ili-protez | implanty | Имплант или протез |
| 20 | koronka-na-implant | implanty | Коронка на имплант |

### НЧ-статьи батч 3 (2026-07-16)

| # | Slug | Категория | Тема |
|---|------|-----------|------|
| 21 | zamena-koronki | koronki | Замена коронки на зуб |
| 22 | otbelivanie-do-ili-posle-protezirovaniya | — | Отбеливание до или после протезирования |
| 23 | protezirovanie-posle-udaleniya-zuba-mudrosti | — | Протезирование после удаления зуба мудрости |
| 24 | protezirovanie-dlya-pozhilykh | — | Протезирование зубов для пожилых: All-on-4 vs съёмный |

## Schema-улучшения

- **BaseLayout.astro:130** — `areaServed` добавлен в MedicalClinic schema:
  ```json
  "areaServed": { "@type": "City", "name": "Нижний Новгород", "containedInPlace": { "@type": "State", "name": "Нижегородская область" } }
  ```

## Build

- **261 pages** (было 256, +5: 4 новые статьи + VNChS хаб)
- **0 ошибок**
- **Commit:** `d189038` (2026-07-16, 4 НЧ + broken links + SEO audit + dzen removal)
- **Push:** master

## Метрики

- Всего статей в блоге: ~161 (137 + 24 новых НЧ)
- Всего страниц: 261
- Категории с НЧ-статьями: implanty (7), semnye-protezy (4), vnchs (3), diagnostika (2), ai (2), byugelnye-protezy (1), mosty (1), koronki (2)

## Связанные страницы

- [SEO-стратегия](seo-strategy.md)
- [Low-Frequency Keywords](low-freq-keywords.md)
- [Контент-план](content-plan.md)
