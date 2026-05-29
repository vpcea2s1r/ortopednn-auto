# Content Rules — ortopednn.ru

## Audience
Люди 40+ с проблемами зубов: нет зубов, болят, выпали, натирают протезы.

## Tone
Спокойный, экспертный. Без маркетинга, восклицаний, превосходных степеней.

## Structure
1. H1 с ключевым словом
2. Введение (2-3 предложения)
3. 3-5 разделов с H2
4. Один список ul/ol
5. FAQ 3-5 вопросов
6. Без заключения

## Medical
- Не назначаем лечение, не даём гарантий
- "Возможно", "в некоторых случаях", "требуется консультация врача"

## Sources
- PubMed / NCBI (nih.gov) — систематические обзоры, мета-анализы, RCT
- Cochrane Library (cochrane.org) — доказательные обзоры
- Journal of Prosthetic Dentistry
- Journal of Oral Rehabilitation
- Clinical Oral Implants Research
- International Journal of Prosthodontics
- Journal of Dentistry
- Dental Materials
- Clinical Implant Dentistry and Related Research
- Зарубежные стоматологические сайты: dentaly.org, animated-Teeth.com, dentistry.com, colgate.com, mouthhealthy.org (ADA)
- Подавать как факты, без ссылок и названий источников
- Включить: клинические показания, биосовместимость материалов

## AI Response Format
```json
{
  "title": "заголовок",
  "description": "мета-описание 150-160 символов",
  "body": "HTML контент статьи"
}
```

## Approval Flow (двухэтапный)
- Генератор → `data/drafts/`
- Автор читает → если OK: тестовый домен `stomatolog.ortopednn.ru`
- Автор проверяет на тесте → если OK: продакшен `ortopednn.ru`
- Без явного OK на каждом этапе статья никуда не попадает
