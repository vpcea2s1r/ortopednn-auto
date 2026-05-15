# OpenSERP — SERP API для проверки позиций

## Запуск

```powershell
.\start.ps1
```

После запуска API доступен на http://127.0.0.1:7000

## Проверка позиций

```powershell
.\check.ps1
```

## Проверка по одному запросу

```powershell
curl http://127.0.0.1:7000/google/search?text=протезирование+зубов+нижний+новгород&limit=10
curl http://127.0.0.1:7000/yandex/search?text=протезирование+зубов+нижний+новгород&limit=10
```

## Прокси (если капча)

Отредактировать `config.yaml` или запустить с флагом:

```powershell
.\openserp serve --proxy socks5://user:pass@127.0.0.1:1080
```

## Мониторинг в фоне

Использовать планировщик Windows (Taskschd.msc) — запускать `check.ps1` раз в неделю и логировать результаты в `reports/`
