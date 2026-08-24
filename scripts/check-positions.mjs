const GSC_CLIENT_ID = '475971996521-59vqmmg5s68de5je32t68lqg6omsp6qs.apps.googleusercontent.com';
const GSC_CLIENT_SECRET = process.env.GSC_CLIENT_SECRET || '';
const GSC_REFRESH_TOKEN = process.env.GSC_REFRESH_TOKEN || '';
const YANDEX_OAUTH = process.env.YANDEX_OAUTH || '';
const SITE_URL = encodeURIComponent('https://ortopednn.ru/');

async function main() {
  // GSC token refresh
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GSC_CLIENT_ID,
      client_secret: GSC_CLIENT_SECRET,
      refresh_token: GSC_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });
  const tokenJson = await tokenResp.json();
  let gscToken = null;
  if (!tokenJson.access_token) {
    console.log('GSC token error:', JSON.stringify(tokenJson), '— skipping GSC, continuing to Yandex');
  } else {
    gscToken = tokenJson.access_token;
    console.log('GSC token refreshed');
  }

  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // GSC top queries (skip if no token)
  if (gscToken) {
    const gscBody = JSON.stringify({ startDate: weekAgo, endDate: today, dimensions: ['query'], rowLimit: 20 });
    const gscResp = await fetch('https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fortopednn.ru%2F/searchAnalytics/query', {
      method: 'POST',
      headers: { Authorization: `Bearer ${gscToken}`, Accept: 'application/json' },
      body: gscBody
    });
    const gscData = await gscResp.json();
    console.log('\n=== GOOGLE SEARCH CONSOLE - TOP 20 QUERIES (7 days) ===');
    if (!gscData.rows) { console.log('No data:', JSON.stringify(gscData).slice(0, 500)); }
    else {
      gscData.rows.forEach((r, i) => {
        console.log(`${(i+1).toString().padStart(2)}. ${r.keys[0].padEnd(40)} pos ${r.position.toFixed(1).padStart(6)}  ${r.clicks.toString().padStart(4)}clicks  ${r.impressions.toString().padStart(6)}imp  CTR:${(r.ctr*100).toFixed(1)}%`);
      });
    }
  } else {
    console.log('\n=== GSC skipped (no token) ===');
  }

  // Yandex - wrap in try/catch, network may timeout
  try {
    const hostsResp = await fetch('https://api.webmaster.yandex.net/v4/user/156937890/hosts/', { headers: { Authorization: `OAuth ${YANDEX_OAUTH}`, Accept: 'application/json' } });
    const hosts = await hostsResp.json();
    const host = hosts.hosts.find(h => h.host_id.includes('ortopednn'));
    const hostId = host.host_id;

    console.log('\n=== YANDEX WEBMASTER - POPULAR QUERIES ===');
    const sqResp = await fetch(`https://api.webmaster.yandex.net/v4/user/156937890/hosts/${hostId}/search-queries/popular/?order_by=TOTAL_SHOWS&query_indicator=TOTAL_SHOWS&page_size=15`, { headers: { Authorization: `OAuth ${YANDEX_OAUTH}`, Accept: 'application/json' } });
    const sqData = await sqResp.json();
    sqData.queries.forEach((q, i) => {
      console.log(`${(i+1).toString().padStart(2)}. ${q.query_text.padEnd(40)} shows:${q.total_shows.toString().padStart(5)} clicks:${q.total_clicks.toString().padStart(4)}`);
    });

    const summaryResp = await fetch(`https://api.webmaster.yandex.net/v4/user/156937890/hosts/${hostId}/summary/`, { headers: { Authorization: `OAuth ${YANDEX_OAUTH}`, Accept: 'application/json' } });
    const summary = await summaryResp.json();
    console.log(`\nYandex: ${summary.searchable_pages_count} indexed, ${summary.excluded_pages_count} errors`);
  } catch (e) {
    console.log('\nYandex fetch failed:', e.message, '— use `python scripts/yandex-webmaster-stats.py` as fallback');
  }

  // GSC keyword positions (only if token available)
  if (!gscToken) {
    console.log('\n=== GSC KEYWORD POSITIONS skipped (no token) ===');
  } else {
  const keywords = ['protezirovanie zubov','koronki na zuby','sjemnyj protez','byugelnyj protez','cirkonievaya koronka','most na zuby','implantaciya zubov','protezirovanie zubov nizhnij novgorod','stomatolog ortoped nizhnij novgorod','viniry','kappy','nejlonovyj protez','akrilovyj protez','adgezivnyj most','polnyj sjemnyj protez','byugelnyj protez na zamkah','snyatie koronki','fiksaciya koronki','remont proteza','implant protiv mosta','protezirovanie pri diabete'];

  console.log('\n=== GSC KEYWORD POSITIONS ===');
  const results = [];
  for (const kw of keywords) {
    try {
      const body = JSON.stringify({ startDate: today, endDate: today, dimensions: ['query'], dimensionFilterGroups: [{ filters: [{ dimension: 'query', expression: kw, operator: 'contains' }] }], rowLimit: 1 });
      const resp = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${SITE_URL}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${gscToken}`, Accept: 'application/json' },
        body
      });
      const data = await resp.json();
      if (data.rows?.length) {
        const r = data.rows[0];
        results.push({ keyword: kw, position: r.position, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr });
      }
    } catch {}
  }

  results.sort((a, b) => a.position - b.position);
  console.log('\nKeyword'.padEnd(45), 'Pos'.padStart(6), 'Clicks'.padStart(7), 'Impr'.padStart(7), 'CTR'.padStart(7));
  console.log('-'.repeat(75));
  for (const r of results) {
    console.log(`${r.keyword.padEnd(45)} ${r.position.toFixed(1).padStart(6)} ${r.clicks.toString().padStart(7)} ${r.impressions.toString().padStart(7)} ${(r.ctr*100).toFixed(1).padStart(6)}%`);
  }

  const avg = results.length ? results.reduce((s, r) => s + r.position, 0) / results.length : 0;
  if (results.length) console.log(`\nAvg position: ${avg.toFixed(1)}`);
  console.log(`Keywords with data: ${results.length}`);
  } // end if gscToken
}

main().catch(console.error);
