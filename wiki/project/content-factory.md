# Фабрика контента (Content Factory)

Проект: Multi-Site Admin Panel + Social Distribution + AI Content Pipeline

## Описание

Единая веб-панель для управления контентом, статистикой и продвижением нескольких сайтов. Позволяет управлять всем из веб-интерфейса вместо Telegram-бота.

## Статус: ✅ План утверждён 2026-06-14

## Архитектура

```
ortopednn.ru (Astro)          admin.ortopednn.ru (Express)
        │                              │
        ├── GitHub Pages               ├── SQLite (content_factory.db)
        │                              ├── GitHub API (content storage)
        └── Telegram Bot               ├── Social APIs (TG, DZ, VK, OK)
                                       └── AI API (DeepSeek via opencode.ai)
```

## Технологический стек

| Компонент | Технология | Причина |
|-----------|-----------|-----|
| Backend | Express.js (ES modules) | Уже есть в server/app.js |
| Frontend | HTMX + Tailwind CSS | Без SPA-сборки, быстро |
| Database | SQLite (better-sqlite3) | Уже используется |
| Auth | JWT (jsonwebtoken) | Просто, stateless |
| Charts | Chart.js (CDN) | Без сборки, легковесный |
| AI | DeepSeek via opencode.ai | Уже интегрирован |
| Hosting | VPS 94.183.155.147 | Docker |

## База данных: content_factory.db

```sql
-- Сайты/Проекты
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  github_repo TEXT,
  github_branch TEXT DEFAULT 'master',
  niche TEXT,
  telegram_bot_token TEXT,
  telegram_chat_id TEXT,
  dzen_channel_id TEXT,
  vk_group_id TEXT,
  ok_group_id TEXT,
  gsc_property TEXT,
  yandex_host TEXT,
  metrika_counter TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  active INTEGER DEFAULT 1
);

-- Пользователи
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Черновики (на каждый проект)
CREATE TABLE drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT,
  tags TEXT,
  platform TEXT DEFAULT 'blog',
  status TEXT DEFAULT 'draft',
  char_count INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  published_at TEXT,
  UNIQUE(project_id, slug)
);

-- Статистика (на каждый проект)
CREATE TABLE stat_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  date TEXT,
  source TEXT,
  total_indexed INTEGER,
  total_errors INTEGER,
  clicks INTEGER,
  impressions INTEGER,
  avg_position REAL,
  raw TEXT,
  UNIQUE(project_id, date, source)
);

-- Позиции ключевых слов (на каждый проект)
CREATE TABLE keyword_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  date TEXT,
  keyword TEXT,
  clicks INTEGER,
  impressions INTEGER,
  position REAL,
  ctr REAL,
  UNIQUE(project_id, date, keyword)
);

-- Core Web Vitals (на каждый проект)
CREATE TABLE cwv_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  date TEXT,
  url TEXT,
  lcp REAL, cls REAL, inp REAL, fcp REAL, ttfb REAL,
  score REAL, raw TEXT,
  UNIQUE(project_id, date, url)
);

-- Посты в соцсетях
CREATE TABLE social_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  draft_id INTEGER REFERENCES drafts(id),
  platform TEXT NOT NULL,
  post_id TEXT,
  status TEXT DEFAULT 'pending',
  posted_at TEXT,
  error TEXT,
  raw_response TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Очередь тем
CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  topic TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  processed_at TEXT
);

-- Аудит-лог
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES projects(id),
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id INTEGER,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## Модули (MVP — Фаза 1)

### 1. Auth (Аутентификация)
- Страница логина: username + пароль
- JWT токен в httpOnly cookie
- Middleware: checkAuth() на всех /admin/* маршрутах
- Дефолтный admin создаётся при первом запуске
- Файлы: server/admin/auth.js, server/admin/views/login.ejs

### 2. Projects (Мульти-сайт)
- Список сайтов с суммарной статистикой
- Добавить новый сайт: имя, домен, GitHub репо, ниша
- Настройка API-ключей на каждый сайт (GSC, Yandex, Metrika)
- Настройка соцсетей на каждый сайт (Telegram, Dzen, VK, OK)
- Переключение между сайтами через выпадающий список
- Файлы: server/admin/routes/projects.js, views/projects.ejs

### 3. Dashboard (Панель управления)
- График трафика (посещения, просмотры, пользователи) — Metrika
- Поисковая производительность (клики, показы, позиция) — GSC
- Таблица позиций ключевых слов (топ-31)
- Счётчики Core Web Vitals (LCP, CLS, INP)
- Статус последних черновиков
- Статус последних постов в соцсетях
- Быстрые действия: Сгенерировать статью, Черновики, Запустить пайплайн
- Файлы: server/admin/routes/stats.js, views/dashboard.ejs

### 4. Content Manager (Контент)
- Список черновиков: фильтр по статусу (draft/review/published/archived)
- Редактор: заголовок, тело (markdown), категория, теги
- Предпросмотр: рендер markdown в HTML
- Поток публикации: Обзор → Одобрить → Опубликовать на сайт + соцсети
- AI генерация: ввести тему → сгенерировать статью → сохранить как черновик
- Массовые операции: опубликовать всё отревьюенное, архивировать старое
- Файлы: server/admin/routes/drafts.js, views/drafts.ejs

### 5. SEO Monitor (SEO)
- График позиций ключевых слов (позиция за период)
- Статус индексации (проиндексировано vs исключено)
- Обнаружение дубликатов контента
- Анализ внутренних ссылок
- Управление canonical-тегами
- Проверка sitemap
- Файлы: server/admin/routes/seo.js, views/seo.ejs

### 6. Social Distribution (Соцсети)
- Telegram: пост в канал (текст + фото), расписание
- Dzen: RSS авто-импорт (уже есть /rss-dzen.xml)
- VK: пост в группу (текст + фото), через VK API
- OK: пост в группу (widget или API), через OK API
- Мульти-пост: опубликовать на все платформы одним кликом
- Расписание: задать время публикации для каждой платформы
- Аналитика: отслеживать просмотры/вовлечённость на каждый пост
- Файлы: server/admin/routes/social.js, views/social.ejs

### 7. Pipeline (AI Content)
- Управление очередью тем (добавить, переупорядочить, удалить)
- Статус пайплайна (запущен, в очереди, завершён, ошибка)
- Ручной запуск: выбрать тему → исследование → написание → ревью → черновик
- Авто-запуск: ежедневный крон берёт следующую тему
- Контроль качества: стоматологические термины, длина, AI-маркеры, цитирования
- Файлы: server/admin/routes/pipeline.js, views/pipeline.ejs

### 8. Settings (Настройки)
- Конфигурация сайта (домен, репо, ниша)
- API ключи (GSC, Yandex, GitHub, AI)
- Аккаунты соцсетей (Telegram, VK, OK токены)
- Расписание крона (пайплайн, статистика, постинг в соцсети)
- Смена пароля админа
- Файлы: server/admin/routes/settings.js, views/settings.ejs

## Интеграция с соцсетями

### Telegram (уже работает)
- Bot API: sendMessage, sendPhoto
- Канал: @ortopednn (или на каждый проект свой)
- Формат поста: заголовок + краткое описание + ссылка + картинка
- API: api.telegram.org/bot<TOKEN>/...
- DNS фикс: extra_hosts: api.telegram.org:149.154.167.220

### Dzen (RSS-based)
- RSS фид: /rss-dzen.xml (уже построен)
- Авто-импорт: Dzen забирает из RSS
- Категория: native-draft (проверка перед публикацией)
- API не нужен — RSS это механизм
- Требования: 10+ материалов, JPEG/PNG 700px+, media:rating nonadult

### VK (ВКонтакте)
- API: api.vk.com/method/wall.post
- Авторизация: access_token сообщества (group_id + token)
- Формат: message + attachments (photo)
- Лимит: 3 поста/час на группу
- Загрузка фото: upload.vk.com

### Одноклассники (OK)
- API: api.ok.ru/api/content/post
- Авторизация: application_key + access_token + group_id
- Формат: message + media (photo attachment)
- Лимит: 100 запросов/день

## Файловая структура

```
server/
├── app.js                    # Текущий Express-сервер (бот + API)
├── bot.js                    # Telegram-бот
├── collector.js              # Сборщик статистики
├── cron.js                   # Планировщик задач
├── agent-pipeline.js         # AI-пайплайн
├── dzen-generator.js         # Генератор статей для Дзена
├── wordstat.js               # Яндекс.Wordstat
├── package.json
├── Dockerfile
├── admin/                    # 🆕 Фабрика контента
│   ├── app.js                # Точка входа админки
│   ├── auth.js               # JWT middleware
│   ├── db.js                 # SQLite + миграции
│   ├── routes/
│   │   ├── projects.js       # CRUD проектов
│   │   ├── drafts.js         # Управление черновиками
│   │   ├── stats.js          # API статистики
│   │   ├── seo.js            # SEO мониторинг
│   │   ├── social.js         # Постинг в соцсети
│   │   ├── pipeline.js       # AI-пайплайн
│   │   └── settings.js       # Настройки
│   ├── views/
│   │   ├── layout.ejs        # Базовый шаблон (HTMX)
│   │   ├── login.ejs         # Страница логина
│   │   ├── dashboard.ejs     # Дашборд
│   │   ├── projects.ejs      # Список проектов
│   │   ├── project-form.ejs  # Форма добавления
│   │   ├── drafts.ejs        # Черновики
│   │   ├── draft-editor.ejs  # Редактор черновика
│   │   ├── seo.ejs           # SEO мониторинг
│   │   ├── social.ejs        # Соцсети
│   │   └── pipeline.ejs      # Пайплайн
│   └── public/
│       ├── style.css         # Tailwind CSS
│       └── app.js            # Chart.js + HTMX
```

## План реализации

### Фаза 1: Foundation (MVP) — 4 недели

**Неделя 1: Foundation**
- [ ] Создать Express app с auth middleware
- [ ] SQLite schema + миграции
- [ ] Project CRUD (добавить/изменить/удалить сайты)
- [ ] Login страница (HTMX + Tailwind)
- [ ] Dashboard layout (sidebar + графики)

**Неделя 2: Content + Stats**
- [ ] Управление черновиками (список, редактор, предпросмотр, публикация)
- [ ] Интеграция статистики (графики GSC, Yandex, Metrika)
- [ ] Таблица позиций ключевых слов
- [ ] Триггер генерации AI-статей

**Неделя 3: Social Distribution**
- [ ] Постинг в Telegram (канал бот)
- [ ] Интеграция Dzen RSS
- [ ] Интеграция VK API
- [ ] Интеграция OK API
- [ ] Мульти-пост (один клик → все платформы)

**Неделя 4: Polish + Deploy**
- [ ] Nginx reverse proxy (admin.ortopednn.ru)
- [ ] SSL сертификат (Let's Encrypt)
- [ ] Docker контейнеризация
- [ ] Крон-задачи (ежедневная статистика, постинг в соцсети)
- [ ] Обработка ошибок + логирование

### Фаза 2: Advanced (после запуска MVP)

- [ ] **AI-оптимизация**: авто-улучшение CTR на основе GSC-данных
- [ ] **Конкуренты**: мониторинг ТОП-3 конкурентов
- [ ] **Календарь**: визуальный планировщик + сезонность
- [ ] **A/B тесты**: генерация + тестирование заголовков
- [ ] **White-label**: SaaS для других клиник
- [ ] **API**: Webhooks + интеграция с Zapier

## Ключевые допущения

1. **VPS может запустить ещё один Express-сервер** на порту 3001 (бот на 3000)
2. **GitHub API достаточно** для хранения контента (отдельная БД для CMS не нужна)
3. **SQLite справляется с нагрузкой** (один пользователь, низкий трафик)
4. **HTMX достаточно** для UI (React/Vue не нужен)
5. **API соцсетей доступны** из России (VK, OK — да; Telegram — через DNS-фикс)

## Открытые вопросы

- [ ] Домен для админки: admin.ortopednn.ru (или ortopednn.ru/admin?)
- [ ] Нужен ли SSL? (Да, Let's Encrypt)
- [ ] Дефолтный пароль админа?
- [ ] Нужен ли доступ по IP? (94.183.155.147:3001)

## Источники

- [План в docs/ideas/](docs/ideas/content-factory.md)
- [Архитектура проекта](project/architecture.md)
- [Яндекс.Дзен](project/dzen.md)
- [SEO-стратегия](project/seo-strategy.md)

## Связанные страницы

- [Архитектура](project/architecture.md)
- [Пуш артефактов](project/push-artifacts-check.md)
- [Humanizer Integration](project/humanizer-integration.md)