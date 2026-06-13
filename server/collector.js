import fetch from 'node-fetch';

const GSC_CLIENT_ID = process.env.GSC_CLIENT_ID;
const GSC_CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const GSC_REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;
const YANDEX_OAUTH = process.env.YANDEX_OAUTH_TOKEN;
const SITE_URL = encodeURIComponent('https://ortopednn.ru/');

async function refreshGscToken() {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GSC_CLIENT_ID, client_secret: GSC_CLIENT_SECRET,
      refresh_token: GSC_REFRESH_TOKEN, grant_type: 'refresh_token'
    })
  });
  const json = await resp.json();
  return json.access_token;
}

async function collectGsc(db) {
  if (!GSC_REFRESH_TOKEN) return;
  try {
    const token = await refreshGscToken();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const [searchResp, inspectResp] = await Promise.all([
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${SITE_URL}/searchAnalytics/query`, {
        method: 'POST', headers,
        body: JSON.stringify({ startDate: weekAgo, endDate: today, dimensions: ['query'], rowLimit: 10 })
      }),
      fetch(`https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`, {
        method: 'POST', headers,
        body: JSON.stringify({ inspectionUrl: 'https://ortopednn.ru/', siteUrl: 'https://ortopednn.ru/', languageCode: 'ru-RU' })
      })
    ]);
    const searchData = await searchResp.json();
    const indexed = searchResp.ok && searchData.rows ? 1 : 0;
    const rows = searchData.rows || [];
    const totalClicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);
    const totalImpressions = rows.reduce((s, r) => s + (r.impressions || 0), 0);
    const avgPosition = rows.length ? rows.reduce((s, r) => s + (r.position || 0), 0) / rows.length : 0;
    db.prepare(`INSERT OR REPLACE INTO stat_snapshots (date, source, total_indexed, raw)
      VALUES (?, ?, ?, ?)`).run(today, 'google', indexed ? 1 : 0, JSON.stringify({ clicks: totalClicks, impressions: totalImpressions, avgPosition: Math.round(avgPosition * 10) / 10, rows }));
    console.log(`GSC: ${totalClicks} clicks, ${totalImpressions} impressions, pos ${avgPosition.toFixed(1)}`);
  } catch (e) { console.error('GSC error:', e.message); }
}

async function collectYandex(db) {
  if (!YANDEX_OAUTH) return;
  try {
    const headers = { Authorization: `OAuth ${YANDEX_OAUTH}`, Accept: 'application/json' };
    const hostResp = await fetch('https://api.webmaster.yandex.net/v4/user/156937890/hosts/', { headers });
    const hosts = await hostResp.json();
    const host = hosts.hosts?.find(h => h.host_id?.includes('ortopednn'));
    if (!host) { console.error('Yandex: host not found'); return; }
    const hostId = host.host_id;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const [summaryResp, sqResp] = await Promise.all([
      fetch(`https://api.webmaster.yandex.net/v4/user/156937890/hosts/${hostId}/summary/`, { headers }),
      fetch(`https://api.webmaster.yandex.net/v4/user/156937890/hosts/${hostId}/search-queries/popular/?order_by=TOTAL_SHOWS&query_indicator=TOTAL_SHOWS&page_size=10`, { headers })
    ]);
    const summary = await summaryResp.json();
    const queries = await sqResp.json();
    db.prepare(`INSERT OR REPLACE INTO stat_snapshots (date, source, total_indexed, total_errors, raw)
      VALUES (?, ?, ?, ?, ?)`).run(today, 'yandex',
      summary.searchable_pages_count || 0, summary.excluded_pages_count || 0,
      JSON.stringify(queries));
    console.log(`Yandex: ${summary.searchable_pages_count || 0} indexed`);
  } catch (e) { console.error('Yandex error:', e.message); }
}

export async function collectAll(db) {
  console.log('Collecting stats...');
  await Promise.all([collectGsc(db), collectYandex(db)]);
  console.log('Stats collected');
}
