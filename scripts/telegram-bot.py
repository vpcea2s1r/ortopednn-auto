#!/usr/bin/env python3
"""Interactive Telegram bot for ortopednn.ru SEO monitoring (GitHub Actions polling)."""

import json, os, subprocess, sys, urllib.request

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
AUTHORIZED_CHAT = os.environ.get("TELEGRAM_CHAT_ID", "")
OFFSET_FILE = "/tmp/bot_offset.txt"

def tg_api(method, data):
    req = urllib.request.Request(
        f"https://api.telegram.org/bot{BOT_TOKEN}/{method}",
        data=json.dumps(data).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def send(chat_id, text):
    tg_api("sendMessage", {
        "chat_id": chat_id, "text": text,
        "parse_mode": "Markdown", "disable_web_page_preview": True,
    })

def get_updates(offset=None):
    params = {"timeout": 10}
    if offset: params["offset"] = offset
    return tg_api("getUpdates", params)

def check_ssl():
    try:
        r = subprocess.run(
            ["openssl", "s_client", "-servername", "ortopednn.ru",
             "-connect", "ortopednn.ru:443"],
            input=b"", capture_output=True, timeout=15)
        for line in r.stdout.decode().split("\n"):
            if "notAfter=" in line:
                return line.split("=", 1)[1].strip()
    except: pass
    return "N/A"

def lighthouse():
    try:
        subprocess.run(
            ["lighthouse", "https://ortopednn.ru/",
             "--chrome-flags=--headless --no-sandbox",
             "--output=json", "--output-path=/tmp/lh.json",
             "--quiet", "--only-categories=performance,seo,accessibility"],
            timeout=120)
        with open("/tmp/lh.json") as f:
            d = json.load(f)
        return (int(d["categories"]["performance"]["score"] * 100),
                int(d["categories"]["seo"]["score"] * 100),
                int(d["categories"]["accessibility"]["score"] * 100))
    except: return (None, None, None)

def cmd_check(chat_id):
    send(chat_id, "⏳ Полная проверка... (~1 мин)")
    p, s, a = lighthouse()
    ssl = check_ssl()
    parts = ["📊 *SEO Check — ortopednn.ru*\n"]
    if p is not None:
        parts.append(f"⚡ Performance: `{p}`\n🔍 SEO: `{s}`\n♿ A11y: `{a}`\n")
    else:
        parts.append("⚡ Lighthouse: ❌\n")
    parts.append(f"🔒 SSL: `{ssl}`")
    send(chat_id, "".join(parts))

def cmd_ssl(chat_id):
    send(chat_id, "🔍 Проверяю SSL...")
    send(chat_id, f"🔒 *SSL Certificate*\nExpires: `{check_ssl()}`")

def cmd_perf(chat_id):
    send(chat_id, "⏳ Lighthouse...")
    p, s, a = lighthouse()
    if p is not None:
        send(chat_id, f"⚡ *Lighthouse*\nPerformance: `{p}`\nSEO: `{s}`\nA11y: `{a}`")
    else:
        send(chat_id, "❌ Lighthouse failed")

COMMANDS = {
    "/start": lambda c: send(c, "🤖 *SEO Monitor Bot*\n/check — полный чек\n/ssl — SSL\n/perf — Performance\n/help — команды"),
    "/help": lambda c: send(c, "🤖 *Команды:*\n/check — полный SEO-чек\n/ssl — SSL сертификат\n/perf — Lighthouse\n/help — это сообщение"),
    "/check": cmd_check,
    "/ssl": cmd_ssl,
    "/perf": cmd_perf,
}

def main():
    if not BOT_TOKEN or not AUTHORIZED_CHAT:
        print("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"); sys.exit(1)

    offset = None
    if os.path.exists(OFFSET_FILE):
        with open(OFFSET_FILE) as f:
            offset = int(f.read().strip())

    try:
        updates = get_updates(offset)
    except Exception as e:
        print(f"getUpdates failed: {e}"); sys.exit(1)

    if not updates.get("ok") or not updates.get("result"):
        print("No updates"); return

    for u in updates["result"]:
        if "message" not in u: continue
        m = u["message"]
        cid = str(m.get("chat", {}).get("id"))
        text = m.get("text", "")

        if cid != AUTHORIZED_CHAT:
            continue

        if text.startswith("/"):
            cmd = text.split()[0].lower()
            if cmd in COMMANDS:
                COMMANDS[cmd](cid)
            else:
                send(cid, f"❌ Неизвестно: `{text}`\n/help")

        offset = u["update_id"] + 1

    with open(OFFSET_FILE, "w") as f:
        f.write(str(offset))
    print(f"Done. Offset: {offset}")

if __name__ == "__main__":
    main()
