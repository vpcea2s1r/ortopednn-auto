import fetch from 'node-fetch';

const GSC_CLIENT_ID = process.env.GSC_CLIENT_ID;
const GSC_CLIENT_SECRET = process.env.GSC_CLIENT_SECRET;
const GSC_REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN;
const YANDEX_OAUTH = process.env.YANDEX_OAUTH_TOKEN;
const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID;
const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET;
const YANDEX_REFRESH_TOKEN = process.env.YANDEX_REFRESH_TOKEN;
const METRIKA_COUNTER = process.env.METRIKA_COUNTER_ID || '109258289';
const SITE_URL = encodeURIComponent('https://ortopednn.ru/');
const PSI_KEY = process.env.PAGESPEED_API_KEY;

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
    const host = hosts.hosts?.find(h => h.host_id?.startsWith('https:') && h.host_id?.includes('ortopednn')) || hosts.hosts?.find(h => h.host_id?.includes('ortopednn'));
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

async function collectMetrika(db) {
  if (!YANDEX_OAUTH) return;
  try {
    const headers = { Authorization: `OAuth ${YANDEX_OAUTH}`, Accept: 'application/json' };
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const metrics = 'ym:s:visits,ym:s:pageviews,ym:s:users,ym:s:bounceRate,ym:s:avgVisitDurationSeconds';
    const params = new URLSearchParams({
      id: METRIKA_COUNTER,
      metrics,
      dimensions: 'ym:s:date',
      date1: weekAgo,
      date2: today,
      limit: '10'
    });
    const resp = await fetch(`https://api-metrika.yandex.net/stat/v1/data?${params}`, { headers });
    if (!resp.ok) { console.error('Metrika API:', resp.status, await resp.text().catch(()=>'')); return; }
    const data = await resp.json();
    const rows = (data.totals || [0]).map((v, i) => ({
      metric: ['visits', 'pageviews', 'users', 'bounceRate', 'avgDuration'][i],
      value: v
    }));
    const daily = (data.data || []).map(d => ({
      date: d.dimensions[0].name,
      visits: d.metrics[0],
      pageviews: d.metrics[1],
      users: d.metrics[2],
      bounceRate: d.metrics[3],
      avgDuration: d.metrics[4]
    }));
    db.prepare(`INSERT OR REPLACE INTO stat_snapshots (date, source, clicks, impressions, avg_position, raw)
      VALUES (?, ?, ?, ?, ?, ?)`).run(today, 'metrika',
      rows.find(r=>r.metric==='visits')?.value || 0,
      rows.find(r=>r.metric==='pageviews')?.value || 0,
      rows.find(r=>r.metric==='bounceRate')?.value || 0,
      JSON.stringify({ totals: rows, daily }));
    console.log(`Metrika: ${rows.find(r=>r.metric==='visits')?.value || 0} visits, ${rows.find(r=>r.metric==='pageviews')?.value || 0} pageviews`);
  } catch (e) { console.error('Metrika error:', e.message); }
}

const DENTAL_KEYWORDS = [
  'протезирование зубов', 'коронки на зубы', 'съёмный протез', 'бюгельный протез',
  'металлокерамическая коронка', 'циркониевая коронка', 'мост на зубы',
  'имплантация зубов', 'съёмный протез цена', 'коронка цена',
  'протезирование зубов нижний новгород', 'стоматолог ортопед нижний новгород',
  'адгезивный мост', 'полный съёмный протез', 'нейлоновый протез',
  'акриловый протез', 'иммедиат протез', 'бюгельный протез на замках',
  'снятие коронки', 'фиксация коронки', 'перебазировка протеза',
  'ремонт протеза', 'виниры', 'люминиры', 'каппы',
  'отбеливание зубов', 'лечение кариеса', 'пломба на зуб',
  'кариес под коронкой', 'имплант против моста', 'протезирование при диабете'
];

async function collectKeywordPositions(db) {
  if (!GSC_REFRESH_TOKEN) return;
  try {
    const token = await refreshGscToken();
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const today = new Date().toISOString().split('T')[0];
    const results = [];
    for (const keyword of DENTAL_KEYWORDS) {
      try {
        const resp = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${SITE_URL}/searchAnalytics/query`, {
          method: 'POST', headers,
          body: JSON.stringify({ startDate: today, endDate: today, dimensions: ['query'], dimensionFilterGroups: [{ filters: [{ dimension: 'query', expression: keyword, operator: 'contains' }] }], rowLimit: 1 })
        });
        const data = await resp.json();
        if (data.rows?.length) {
          const row = data.rows[0];
          results.push({ keyword, clicks: row.clicks || 0, impressions: row.impressions || 0, position: row.position || 0, ctr: row.ctr || 0 });
        }
      } catch {}
    }
    db.prepare(`INSERT OR REPLACE INTO keyword_positions (date, keyword, clicks, impressions, position, ctr)
      VALUES (?, ?, ?, ?, ?, ?)`);
    const insert = db.prepare(`INSERT OR REPLACE INTO keyword_positions (date, keyword, clicks, impressions, position, ctr)
      VALUES (?, ?, ?, ?, ?, ?)`);
    const tx = db.transaction(() => { for (const r of results) insert.run(today, r.keyword, r.clicks, r.impressions, Math.round(r.position * 10) / 10, Math.round(r.ctr * 10000) / 100); });
    tx();
    console.log(`Keywords: ${results.length} tracked, avg pos ${(results.reduce((s,r)=>s+r.position,0)/results.length).toFixed(1)}`);
  } catch (e) { console.error('Keywords error:', e.message); }
}

async function collectCwv(db) {
  try {
    const url = 'https://ortopednn.ru/';
    const keyParam = PSI_KEY ? `&key=${PSI_KEY}` : '';
    const resp = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE${keyParam}`);
    const data = await resp.json();
    const lhr = data.lighthouseResult;
    if (!lhr) return;
    const audits = lhr.audits || {};
    const cwv = {
      lcp: audits['largest-contentful-paint']?.numericValue || null,
      cls: audits['cumulative-layout-shift']?.numericValue || null,
      inp: audits['total-blocking-time']?.numericValue || null,
      fcp: audits['first-contentful-paint']?.numericValue || null,
      ttfb: audits['server-response-time']?.numericValue || null,
      score: lhr.categories?.performance?.score || null
    };
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`INSERT OR REPLACE INTO cwv_snapshots (date, url, lcp, cls, inp, fcp, ttfb, score, raw)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(today, url, cwv.lcp, cwv.cls, cwv.inp, cwv.fcp, cwv.ttfb, cwv.score, JSON.stringify(cwv));
    console.log(`CWV: LCP=${(cwv.lcp/1000).toFixed(1)}s CLS=${cwv.cls?.toFixed(3)} score=${cwv.score}`);
  } catch (e) { console.error('CWV error:', e.message); }
}

export async function collectAll(db) {
  console.log('Collecting stats...');
  await Promise.all([collectGsc(db), collectYandex(db), collectMetrika(db)]);
  console.log('Collecting keywords + CWV...');
  await collectKeywordPositions(db);
  await collectCwv(db);
  console.log('Stats collected');
}

export { collectMetrika, collectKeywordPositions, collectCwv, DENTAL_KEYWORDS };
