# Однозначные маркеры — следы копирования из чат-ботов

Один такой маркер в тексте = почти наверняка скопирован из ответа ИИ.

## A. Действующее поколение (2025–2026)

| Маркер | Regex |
|--------|-------|
| `:contentReference[oaicite:N]{index=N}` | `:contentReference\[oaicite:\d+\]\{index=\d+\}` |
| `oai_citation:N‡` | `oai_citation:\d+‡` |
| `oaicite:N` | `oaicite:\d+` |
| `turnNsearchN` | `turn\d+search\d+` |
| `turnNfetchN` | `turn\d+fetch\d+` |
| `?utm_source=chatgpt.com` | `[?&]utm_source=chatgpt\.com` |
| `?utm_source=openai` | `[?&]utm_source=openai` |
| `attached_file://` | `attached_file:\/\/` |
| `grok_card://` | `grok_card:\/\/` |
| `vertexaisearch.cloud.google.com/grounding-api-redirect/` | `vertexaisearch\.cloud\.google\.com/grounding-api-redirect` |
| `[citation:N]` без определения | `\[citation:\d+\]` |

## B. Старое поколение (2023–2024)
- «As of my last knowledge update…»
- «I cannot browse the internet»
- «As of my knowledge cutoff in…»
- «I'm sorry, but as an AI language model…»
- «На момент моего обучения…»
- HTML-сущности `&#8217;` вместо кавычек

## C. Имитация диалога
- «Тема: Запрос на редактирование»
- «Уважаемые редакторы Википедии»
- «Надеюсь, это сообщение застанет вас в добром здравии»
