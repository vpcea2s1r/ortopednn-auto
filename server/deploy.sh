#!/bin/bash
set -e
echo "=== Deploy ortopednn-bot ==="
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Copy .env.example and fill secrets."
  exit 1
fi
sudo docker compose -f ../docker-compose.yml --env-file .env up -d --build
echo "=== Done ==="
sudo docker compose -f ../docker-compose.yml logs --tail=20
