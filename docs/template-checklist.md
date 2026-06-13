# Шаблон проверки статьи для блога

Образец для сверки: `src/pages/blog/kak-privyknut-k-semnym-protezam.astro`

## Frontmatter

- [ ] Импорты: `BaseLayout`, `Navbar`, `doctor`, `socials`
- [ ] `const slug` — латиница, kebab-case
- [ ] `const pageUrl` — `https://ortopednn.ru/blog/${slug}/`
- [ ] `const ldArticle` — JSON-LD Article schema: headline, description, author, datePublished, dateModified, mainEntityOfPage, image, publisher
- [ ] `image: "https://ortopednn.ru/og-image.svg"`

## BaseLayout props

- [ ] `title` — H1 + SEO-заголовок (до 60 символов)
- [ ] `description` — мета-описание (до 160 символов)
- [ ] `breadcrumbTitle` — короткое название для хлебных крошек
- [ ] `doctor={doctor}` — передача данных врача
- [ ] `socials={socials}` — передача соцсетей
- [ ] `datePublished` и `dateModified` — ISO-дата

## Разметка страницы

- [ ] `<Navbar />` — после открытия `<BaseLayout>`
- [ ] `<main class="container">` — обёртка контента (800px)
- [ ] `<a href="/blog" class="back">← К статьям</a>` — ссылка назад
- [ ] `<article>` — обёртка статьи (белая карточка с тенью)
- [ ] `<h1>` — заголовок статьи (только один)
- [ ] `<div class="meta">` — дата и автор: `25 мая 2026 — Никитина М.Г., стоматолог-ортопед`
- [ ] `<p class="lead">` — вводный абзац (выделенный фоном)
- [ ] Заголовки секций — только `<h2>` (h3 при необходимости)
- [ ] Таблицы — `<div class="table-wrap"><table>...</table></div>`
- [ ] Блок с переводом/ключевым фактом — `<p class="translation">`
- [ ] CTA-блок: `<div class="cta"> <p>...</p> <a href={`tel:${doctor.phone}`} class="btn">...</a> </div>`
- [ ] `<script type="application/ld+json" set:html={JSON.stringify(ldArticle)} />` — после `</BaseLayout>`
- [ ] `<style>` — scoped-стили, CSS-переменные, НЕ хардкод цветов

## Стили (CSS-переменные из темы)

Использовать ТОЛЬКО переменные, не хардкодить цвета:
- `var(--color-primary)` — акцентный цвет (заголовки h2, ссылки, кнопки)
- `var(--color-primary-hover)` — ховер кнопок
- `var(--color-text)` — основной текст (h1, .lead, .translation)
- `var(--color-text-muted)` — второстепенный текст (p, li, td, .meta)
- `var(--color-bg-alt)` — фоновый цвет (lead, table th, cta, translation)
- `var(--radius-full)` — скругление кнопок

## Контент

- [ ] Нет посторонних символов (иероглифы, арабская вязь, латиница в русском тексте)
- [ ] Нет эмодзи (без явного указания пользователя)
- [ ] Нет сносок/ссылок/источников в конце (если не оговорено иное)
- [ ] Нет англоязычных терминов без перевода
- [ ] Нет расплывчатых формулировок («Разберём», «Рассказываем», «Давайте посмотрим»)
- [ ] Нет цен
- [ ] Доктор: Никитина Марина Геннадьевна
- [ ] Телефон: +7 (920) 253-73-17
- [ ] Адрес: ул. Октябрьской Революции, д. 43
- [ ] Каждый абзац — одна конкретика
- [ ] Нет ключевых речей и ceremonial wrap-ups
