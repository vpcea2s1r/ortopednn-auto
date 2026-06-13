# Yandex Indexing Issues

## Status (2026-06-02)
- Searchable pages: **1** out of 150+ in sitemap
- SQI (Site Quality Index): **0**
- Excluded pages: 8
- Sitemap: 0 errors, accessed same day

## Findings
1. **Technical SEO is fine** — robots.txt ✅, sitemap ✅, meta tags ✅, 200 OK from Russia ✅
2. **Sitemap is working** — Yandex accessed sitemap-index.xml today, 0 errors, sees all URLs
3. **Site is accessible** — tested from VPS (Russia), all pages return 200 OK
4. **Root cause**: New site (< 3 months) on GitHub Pages, no backlinks, content may look AI-generated

## Actions Taken
- Removed Crawl-delay: 2 from robots.txt (commit 3270992b)
- Integrated humanizer-ru to reduce AI-sounding patterns in articles

## What's needed (outside code)
- Backlinks from dental forums, Yandex.Dzen, social media
- Add to Yandex.Business, Yandex.Maps
- Request re-crawl via Yandex.Webmaster (full OAuth scope needed)
- Time — new sites take 1-6 months for Yandex to trust

## Known issues
- GSC OAuth token expired (test user, 7-day limit)
- Yandex API scope limited to webmaster:hostinfo — can't access crawl diagnostics