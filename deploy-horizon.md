# Deploy Horizon on VPS

## 1. SSH to VPS

```bash
ssh root@94.183.155.147
```

## 2. Clone Horizon

```bash
cd /opt
git clone https://github.com/Thysrael/Horizon.git
cd Horizon
cp .env.example .env
# Edit .env — add HORIZON_OPENAI_KEY (use your OpenAI key)
# nano .env → set HORIZON_OPENAI_KEY=sk-...
```

## 3. Copy dental config

```bash
# From host (or create directly on VPS):
# Copy the config repo's data/horizon-config.json
cp /root/ortopednn-auto/data/horizon-config.json /opt/Horizon/data/config.json
# Or create manually:
nano /opt/Horizon/data/config.json
# Paste content from data/horizon-config.json
```

## 4. Create shared directory

```bash
mkdir -p /opt/horizon-data/summaries
```

## 5. Update bot's docker-compose.yml

Edit `/opt/ortopednn-auto/docker-compose.yml` — add volume to `bot` service:

```yaml
services:
  bot:
    # ... existing config ...
    volumes:
      - bot_data:/data
      - /opt/horizon-data:/horizon-data  # <-- add this line
```

Then restart bot:
```bash
cd /opt/ortopednn-auto
docker compose down
docker compose up -d
```

## 6. Run Horizon (manual test)

```bash
cd /opt/Horizon
docker compose run --rm horizon --hours 168
```

This generates summary in `/opt/Horizon/data/summaries/`.

Copy to shared dir:
```bash
cp /opt/Horizon/data/summaries/*.md /opt/horizon-data/summaries/
```

## 7. Trigger bot watcher

```bash
curl -X POST http://localhost:3000/api/horizon/run
```

Or via Telegram: `/horizon`

## 8. Add host cron

```bash
crontab -e
```

Add:
```
# 6:00 MSK daily — run Horizon, copy output, trigger bot
0 6 * * * cd /opt/Horizon && docker compose run --rm horizon --hours 72 && cp /opt/Horizon/data/summaries/*.md /opt/horizon-data/summaries/ && curl -X POST http://localhost:3000/api/horizon/run
```

## Files created in repo

| File | Purpose |
|------|---------|
| `data/horizon-config.json` | Horizon config for dental sources |
| `server/agent-pipeline.js` | Added `horizonWriterAgent`, `runHorizonPipeline`, `parseHorizonSummary` |
| `server/app.js` | Added `POST /api/horizon/run` |
| `server/cron.js` | Added cron at 6:00 MSK |
| `server/bot.js` | Added `/horizon` command |

## How it works

```
Host cron 6:00 MSK
  │
  ├─ docker compose run horizon --hours 72  →  /opt/Horizon/data/summaries/YYYY-MM-DD-en.md
  ├─ cp → /opt/horizon-data/summaries/
  └─ curl POST /api/horizon/run  →  bot reads /horizon-data/summaries/
                                       │
                                  writerAgent (Russian)
                                       │
                                  seoAgent → draftAgent
                                       │
                                  Telegram: "🌐 Horizon: 3 черновика"
                                       │
                                  User: /drafts → preview → publish
```
