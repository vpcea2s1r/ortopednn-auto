# AGENTS.md — ortopednn project

## Project Context
- **LIVE-код (Astro):** `C:\opencode\ortopednn-auto\` — Astro SSG
- **Репозиторий:** `github.com/vpcea2s1r/ortopednn-auto` — код запушен
- **Старый Next.js код:** `C:\opencode\ortopednn\` — содержимое удалено (осталась пустая папка)
- **Тестовый поддомен:** `C:\opencode\stomatolog\` — stomatolog.ortopednn.ru (GitHub Pages)
- **Dentist prosthodontist site** — Никитина М.Г., Нижний Новгород
- **TypeScript, Tailwind CSS v4**

## Critical Rules
1. **Проверять live-сайт** перед выводами и изменениями
2. **После каждого шага** — обновлять инфо-файлы с актуальными данными
3. **Перед commit/push** — не затереть актуальный контент с live

## Project Status (2026-05-17)

### Сделано
- ✅ Цены удалены из `src/pages/services/index.astro` (коммит `29319b6`)
- ✅ Код запушен в `github.com/vpcea2s1r/ortopednn-auto`
- ✅ AGENTS.md обновлён
- ✅ **ortopednn.ru/services/ — цены удалены** (GitHub Pages workflow успешно задеплоил)

### LIVE-сайт (ortopednn.ru)
- **Хостинг:** GitHub Pages (настроен)
- **Деплой:** GitHub Actions — push в master → auto-deploy
- **CNAME:** `ortopednn.ru`
- **HTTPS:** включён, сертификат подтверждён

### Pricing
- **Данные:** `data/pricing.json` (не тронуты)
- **Список услуг:** `src/pages/services/index.astro` — цены удалены
- **Индивидуальные страницы:** `src/pages/services/*.astro` — цены НЕ тронуты (пользователь хотел только /services/)
- **Главная:** цены в PriceList.astro не показываются (компонент без цен)

### Next Steps
1. Настроить GitHub Pages для `ortopednn-auto` (заменить Layero)
2. Или задеплоить изменения через Layero на `ortopednn.ru`
3. Удалить пустую папку `C:\opencode\ortopednn`
4. Дизайн stomatolog.ortopednn.ru
