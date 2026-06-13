# Архитектура: многосайтовый Astro-проект

## Цель

Описать архитектуру, позволяющую использовать одну кодовую базу Astro для нескольких доменов с разным контентом.

Текущие домены:
- `ortopednn.ru` — стоматолог-ортопед Никитина М.Г. (Нижний Новгород)
- `stomatolog.ortopednn.ru` — тестовый поддомен

---

## 1. Текущая архитектура

### Структура

```
ortopednn-auto/
├── astro.config.mjs     # site: https://ortopednn.ru (hardcoded)
├── data/                # JSON/TS файлы с контентом
│   ├── doctor.json      # ФИО, телефон, адрес
│   ├── services.ts      # Список услуг
│   ├── socials.json     # Соцсети
│   ├── faq.json
│   ├── pricing.json
│   └── districts.json
├── src/
│   ├── components/      # 15 Astro-компонентов
│   ├── layouts/
│   │   └── BaseLayout.astro  # canonical, OG, JSON-LD (hardcoded ortopednn.ru)
│   ├── pages/
│   │   ├── blog/        # 10 статей
│   │   ├── checkup/     # 31 статья
│   │   ├── services/    # 62 услуги
│   │   └── ...          # статичные страницы
│   └── styles/
└── .github/workflows/   # CI/CD на GitHub Pages
```

### Проблемы для масштабирования

| Проблема | Место | Суть |
|----------|-------|------|
| Hardcoded URL | `astro.config.mjs` | `site:` привязан к одному домену |
| Hardcoded URL | `BaseLayout.astro` | canonical, OG, breadcrumbs — `https://ortopednn.ru` |
| Жёсткий JSON-LD | `BaseLayout.astro` | `MedicalBusiness` с адресом НН |
| Привязка к врачу | `data/doctor.json` | Никитина, НН |
| Привязка к услугам | `data/services.ts` | Список ортопедических услуг |
| Привязка контента | `src/pages/` | Все страницы — для ortopednn |

---

## 2. Варианты архитектуры

### Вариант A: Монорепозиторий с доменными папками (рекомендуется)

```
ortopednn-auto/
├── config/
│   ├── ortopednn.json       # config для ortopednn.ru
│   └── stomatolog.json      # config для stomatolog.ortopednn.ru
├── src/
│   ├── components/          # 15 компонентов (shared)
│   ├── layouts/             # BaseLayout.astro (шаблонизирован под config)
│   ├── styles/              # global.css (shared)
│   ├── domains/
│   │   ├── ortopednn/
│   │   │   ├── data/
│   │   │   │   ├── doctor.json
│   │   │   │   ├── services.ts
│   │   │   │   ├── socials.json
│   │   │   │   └── faq.json
│   │   │   └── pages/
│   │   │       ├── blog/
│   │   │       ├── checkup/
│   │   │       ├── services/
│   │   │       └── index.astro
│   │   └── stomatolog/
│   │       ├── data/
│   │       │   ├── doctor.json
│   │       │   ├── services.ts
│   │       │   └── socials.json
│   │       └── pages/
│   │           ├── blog/
│   │           ├── services/
│   │           └── index.astro
│   └── shared/
│       └── pages/            # Общие страницы (404, etc.)
├── scripts/
│   ├── build.js              # Выбирает config по флагу --domain
│   └── domain-config.js      # Утилита загрузки конфига
└── astro.config.mjs          # site берется из config
```

**Плюсы:** Единый репозиторий, 100% shared-компонентов, единая CI.
**Минусы:** Сложнее сборка, риск сломать один домен другим.

**Сборка:**
```bash
# Сборка для ortopednn.ru
DOMAIN=ortopednn npx astro build

# Сборка для stomatolog.ortopednn.ru
DOMAIN=stomatolog npx astro build
```

**Deploy:** GitHub Actions matrix — одна сборка на каждый домен.

### Вариант B: Раздельные репозитории + shared-пакет (текущий подход)

```
ortopednn-auto/       # repo 1 — ortopednn.ru
├── node_modules/
│   └── @ortopednn/shared/   # npm-пакет с общими компонентами
├── data/                    # domain-specific
├── src/pages/               # domain-specific
└── astro.config.mjs

stomatolog/           # repo 2 — stomatolog.ortopednn.ru
├── node_modules/
│   └── @ortopednn/shared/   # тот же пакет
├── data/                    # domain-specific
├── src/pages/               # domain-specific
└── astro.config.mjs
```

**Плюсы:** Полная изоляция, независимый CI/CD, проще дебаг.
**Минусы:** Дублирование кода (layouts, конфиг, компоненты), нужно версионировать shared-пакет.

### Вариант C: Одна кодовая база + runtime-конфиг

```
ortopednn-auto/
├── config/
│   ├── ortopednn.json
│   └── stomatolog.json
└── src/
    ├── components/          # shared
    ├── layouts/             # shared, конфиг читается на этапе сборки
    ├── pages/               # ЕДИНСТВЕННЫЙ набор страниц
    │   ├── blog/
    │   ├── checkup/
    │   ├── services/
    │   └── index.astro
    ├── data/                # Симлинки или импорт по config.domain
    └── scripts/
        └── domain-config.js
```

**Плюсы:** Максимальный reuse, одна кодовая база.
**Минусы:** Не подходит, если сайты сильно отличаются по структуре.

---

## 3. Что меняется при добавлении домена

### 3.1. Обязательно

| Компонент | Что делать | Тип |
|-----------|------------|-----|
| `data/doctor.json` | Создать: ФИО, телефон, адрес, опыт | domain-specific |
| `data/services.ts` | Создать/адаптировать: список услуг и slug-ов | domain-specific |
| `data/socials.json` | Создать: соцсети для этого врача | domain-specific |
| `config/domain.json` | Создать: домен, мета-теги, регион, JSON-LD type | domain-specific |
| `src/pages/` | Создать: страницы контента | domain-specific |
| `astro.config.mjs` | Добавить `site:` в конфиг | build-time |

### 3.2. Если не меняется (shared)

| Компонент | Почему shared |
|-----------|---------------|
| `src/components/` | UI-компоненты не зависят от домена |
| `src/layouts/BaseLayout.astro` | Шаблон, данные берёт из config |
| `src/styles/global.css` | Единый дизайн |
| `scripts/` | Скрипты генерации / валидации |
| `.github/workflows/` | CI/CD с matrix по доменам |

### 3.3. Опционально

| Компонент | Когда менять |
|-----------|--------------|
| `data/pricing.json` | Если цены отличаются |
| `data/faq.json` | Если FAQ специфичный |
| `data/districts.json` | Если другой город |
| `data/map-services.json` | Если другая карта услуг |
| `src/pages/checkup/` | Если самодиагностика специфичная |

---

## 4. Шаблонизация (config-driven layout)

### 4.1. Структура domain config

```json
{
  "site": "https://ortopednn.ru",
  "name": "ОртопедНН — Никитина Марина Георгиевна",
  "shortName": "ОртопедНН",
  "region": "Нижний Новгород",
  "language": "ru",
  "jsonldType": "MedicalBusiness",
  "geo": {
    "latitude": 56.294,
    "longitude": 43.936
  },
  "openingHours": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "openingFrom": "09:00",
  "openingTo": "19:00",
  "analytics": {
    "yandexMetrikaId": "109258289"
  }
}
```

### 4.2. BaseLayout.astro

```astro
---
const { domain, ... } = Astro.props;
const config = loadDomainConfig(domain);
// config.site, config.name, config.region, etc.
---
<link rel="canonical" href={`${config.site}${Astro.url.pathname}`}/>
<meta property="og:image" content={`${config.site}/og-image.svg`}/>
```

### 4.3. Загрузка конфига

```js
// src/util/domain-config.ts
export function loadDomainConfig(domain?: string): DomainConfig {
  const envDomain = domain || process.env.DOMAIN || 'ortopednn';
  return JSON.parse(fs.readFileSync(`src/config/${envDomain}.json`, 'utf-8'));
}
```

---

## 5. Build & Deploy

### 5.1. GitHub Actions — matrix strategy

```yaml
jobs:
  build:
    strategy:
      matrix:
        domain: [ortopednn, stomatolog]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: DOMAIN=${{ matrix.domain }} npx astro build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/
```

### 5.2. Deploy per domain

```yaml
deploy:
  needs: build
  strategy:
    matrix:
      include:
        - domain: ortopednn
          publish_branch: gh-pages
        - domain: stomatolog
          publish_branch: stomatolog-pages
  steps:
    - uses: actions/deploy-pages@v4
      with:
        artifact_name: github-pages-${{ matrix.domain }}
```

### 5.3. Адаптация astro.config.mjs

```js
import { defineConfig } from 'astro/config';
import fs from 'fs';

const domain = process.env.DOMAIN || 'ortopednn';
const config = JSON.parse(fs.readFileSync(`config/${domain}.json`, 'utf-8'));

export default defineConfig({
  site: config.site,
  // ...
});
```

---

## 6. Пошаговое добавление нового домена

### 6.1. Минимальный набор (Вариант C — переиспользовать страницы)

```bash
# 1. Создать конфиг
cp config/ortopednn.json config/new-domain.json
# Поменять site, name, region, jsonldType, geo, contacts

# 2. Создать doctor.json
cp data/doctor.json data/doctor.new-domain.json
# Поменять ФИО, телефон, адрес

# 3. Создать socials.json
cp data/socials.json data/socials.new-domain.json
# Поменять ссылки

# 4. Добавить в CI/CD matrix

# 5. Собрать
DOMAIN=new-domain npx astro build
```

### 6.2. Полный набор (Вариант A — собственные страницы)

```bash
# 1-3: как выше
# 4. Создать src/domains/new-domain/
mkdir -p src/domains/new-domain/{data,pages,images}
cp -r src/pages/blog src/domains/new-domain/pages/
# Адаптировать контент под новую специализацию

# 5. Добавить в build.js маршрут для нового домена

# 6. Настроить CNAME / DNS
```

---

## 7. Миграция с текущей архитектуры

### Шаг 1: Выделить data/ в domain-specific

```bash
mkdir -p src/domains/ortopednn
mv data/ src/domains/ortopednn/data/
```

### Шаг 2: Выделить pages/ в domain-specific

```bash
mkdir -p src/domains/ortopednn
mv src/pages/ src/domains/ortopednn/pages/
```

### Шаг 3: Создать config/ortopednn.json

### Шаг 4: Сделать BaseLayout config-driven

### Шаг 5: Настроить build.js

### Шаг 6: Перенести stomatolog в тот же репозиторий (опционально)

---

## 8. Правила для разработчиков (агентов)

1. **Никаких hardcoded URL.** Любой `https://ortopednn.ru` — через конфиг.
2. **Никаких hardcoded doctor info.** ФИО, телефон, адрес — из `doctor.json`.
3. **Компоненты не знают о домене.** Все данные приходят через props или конфиг.
4. **JSON-LD генерируется из конфига.** Не писать MedicalBusiness вручную.
5. **CI/CD — matrix по доменам.** Не дублировать workflow.
6. **Перед добавлением нового домена** — создать config и doctor.json.
7. **SEO.md обязателен** для каждого домена (свой canonical, свои метатеги).

---

## 9. Приложения

### 9.1. Полный перечень доменно-зависимых файлов

| Файл | Зависимость |
|------|-------------|
| `astro.config.mjs:site` | URL домена |
| `src/layouts/BaseLayout.astro` | canonical, OG, breadcrumbs, JSON-LD |
| `data/doctor.json` | ФИО, телефон, адрес |
| `data/services.ts` | Список услуг |
| `data/socials.json` | Ссылки на соцсети |
| `data/pricing.json` | Цены |
| `data/faq.json` | Вопросы-ответы |
| `data/districts.json` | Районы города |
| `src/pages/services/*.astro` | Контент услуг |
| `src/pages/blog/*.astro` | Статьи блога |
| `src/pages/checkup/*.astro` | Статьи самодиагностики |
| `src/pages/index.astro` | Главная (текст) |
| `CNAME` | DNS-запись для GitHub Pages |
| `.github/workflows/*.yml` | Branch для деплоя |

### 9.2. Полный перечень shared-файлов

| Файл | Почему shared |
|------|---------------|
| `src/components/*` | UI не зависит от специализации |
| `src/styles/global.css` | Единый дизайн-система |
| `src/layouts/BaseLayout.astro` | Шаблон (данные из config) |
| `src/util/*` | Вспомогательные функции |
| `scripts/*` | Генерация, валидация |
| `package.json` | Зависимости |
| `tsconfig.json` | Настройки TS |
| `.github/workflows/deploy.yml` | CI/CD (matrix) |
| `SEO.md` | SEO-правила (общие для всех доменов) |

### 9.3. Схема data flow

```
DOMAIN=ortopednn
     │
     ▼
astro.config.mjs ──────── config/ortopednn.json ─── site URL
     │                                    │
     ▼                                    ▼
BaseLayout.astro ───────── config.site, config.name, config.region
     │                                    │
     ▼                                    ▼
Компоненты ← props ───── data/doctor.json, data/services.ts
     │                                    │
     ▼                                    ▼
Страницы ← контент ──── src/domains/ortopednn/pages/
```
