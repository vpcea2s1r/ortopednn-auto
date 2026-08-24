# yandex-webmaster-stats.py — получение статистики из Яндекс.Вебмастер API
# Использование: python scripts\yandex-webmaster-stats.py [--days 7]
import json, sys, os, argparse, requests, time

API_BASE = "https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}"

# Credentials
TOKEN = os.environ.get("YANDEX_OAUTH", "")
HOST = "ortopednn.ru"

def get_user_id():
    r = requests.get("https://api.webmaster.yandex.net/v4/user", headers={"Authorization": f"OAuth {TOKEN}"})
    return r.json().get("user_id")

def get_host_id(user_id):
    r = requests.get(f"https://api.webmaster.yandex.net/v4/user/{user_id}/hosts", headers={"Authorization": f"OAuth {TOKEN}"})
    for h in r.json().get("hosts", []):
        hu = h.get("ascii_host_url") or h.get("host_url") or ""
        if HOST in hu:
            return h.get("main_mirror", {}).get("host_id") or h.get("host_id")
    return None

def get_events_summary(user_id, host_id):
    r = requests.get(f"https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/summary", headers={"Authorization": f"OAuth {TOKEN}"})
    return r.json()

def get_tops(user_id, host_id):
    r = requests.get(f"https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}/search-queries/popular", params={"order_by": "TOTAL_SHOWS", "query_indicator": ["TOTAL_SHOWS", "TOTAL_CLICKS", "AVG_SHOW_POSITION"], "limit": 100}, headers={"Authorization": f"OAuth {TOKEN}"})
    return r.json().get("queries", [])

def get_indexing_info(user_id, host_id):
    r = requests.get(f"https://api.webmaster.yandex.net/v4/user/{user_id}/hosts/{host_id}", headers={"Authorization": f"OAuth {TOKEN}"})
    return r.json()

def main():
    uid = get_user_id()
    if not uid:
        print("Error: cannot get user ID")
        return
    print(f"User ID: {uid}")
    hid = get_host_id(uid)
    if not hid:
        print("Error: cannot get host ID")
        return
    print(f"Host ID: {hid}")
    print(f"\n{'='*50}")
    idx = get_indexing_info(uid, hid)
    iarc = idx.get("indicators", {}).get("searchable", {})
    print(f"Indexed pages: {iarc.get('value', '?')}")
    print(f"YouTube count: {iarc.get('youtube_indicators_count', '?')}")
    print(f"\n{'='*50}")
    print("TOP queries (by shows):")
    tops = get_tops(uid, hid)
    for q in tops[:30]:
        ind = q.get('indicators', {})
        print(f"  {q.get('query_text', '?'):50s} | shows={ind.get('TOTAL_SHOWS', 0):5.0f} | clicks={ind.get('TOTAL_CLICKS', 0):5.0f} | pos={ind.get('AVG_SHOW_POSITION', 0):5.1f}")
    print(f"\n{'='*50}")
    ev = get_events_summary(uid, hid)
    print(f"Events summary: {json.dumps(ev, indent=2, ensure_ascii=False)[:500]}")

if __name__ == "__main__":
    main()