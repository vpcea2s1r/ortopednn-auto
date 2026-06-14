import cron from 'node-cron';
import fetch from 'node-fetch';
import fs from 'fs';
import { join } from 'path';

let db, dataDir;

export function setupCron(getDb, dir) {
  db = getDb;
  dataDir = dir;
  cron.schedule('0 6 * * *', () => {
    console.log('Daily 6:00: Horizon news → drafts');
    import('./agent-pipeline.js').then(m => m.runHorizonPipeline()).then(async r => {
      if (r.generated > 0) {
        const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '45185475';
        if (TOKEN) {
          const text = `🌐 Horizon: ${r.generated} черновиков из ${r.totalItems} новостей\n/drafts — просмотреть и опубликовать`;
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text })
          }).catch(e => console.error('TG notify error:', e.message));
        }
      } else {
        console.log('Horizon pipeline:', JSON.stringify(r).slice(0, 200));
      }
    }).catch(e => console.error('Horizon error:', e));
  });
  cron.schedule('0 8 * * *', () => {
    console.log('Daily: collecting stats');
    import('./collector.js').then(m => m.collectAll(db())).catch(e => console.error(e));
  });
  cron.schedule('0 7 * * *', () => {
    console.log('Daily 7:00: content pipeline');
    import('./agent-pipeline.js').then(m => m.pickAndRun()).then(async r => {
      if (r.info) { console.log(r.info); return; }
      if (r.draft) {
        console.log(`Pipeline: draft ${r.draft.slug}`);
        const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '45185475';
        if (TOKEN) {
          const text = `📝 Новый черновик:\n${r.draft.title}\nhttps://ortopednn.ru/blog/${r.draft.slug}/\n\n/drafts — просмотреть и опубликовать`;
          await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text })
          }).catch(e => console.error('TG notify error:', e.message));
        }
      } else {
        console.log('Pipeline result:', JSON.stringify(r).slice(0, 200));
      }
    }).catch(e => console.error('Pipeline error:', e));
  });
  cron.schedule('0 9 * * 1', () => {
    console.log('Weekly: sitemap check');
    checkSitemap();
  });
  cron.schedule('0 9 * * *', () => {
    console.log('Daily 9:00: sending stats digest');
    sendDailyDigest();
  });
  console.log('Cron: content 7:00, stats 8:00, digest 9:00 daily, sitemap 9:00 Monday');
}

async function checkSitemap() {
  try {
    const resp = await fetch('https://ortopednn.ru/sitemap-index.xml', { signal: AbortSignal.timeout(10000) });
    const text = await resp.text();
    const urlCount = (text.match(/<loc>/g) || []).length;
    const errors = text.match(/<error>/g) || [];
    const sslResp = await fetch('https://ortopednn.ru/', { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    const sslDays = parseSslDays(sslResp);
    const report = `Sitemap: ${urlCount} URLs, ${errors.length} errors | SSL: ${sslDays}d`;
    console.log(report);
    const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '45185475';
    if (TOKEN) {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: report })
      });
    }
  } catch (e) { console.error('Sitemap check error:', e.message); }
}

function parseSslDays(resp) {
  const cert = resp.headers.get('cf-cert') || resp.socket?.getPeerCertificate?.()?.valid_to;
  if (!cert) return '?';
  const expiry = new Date(cert);
  return Math.ceil((expiry - new Date()) / 86400000);
}

async function sendDailyDigest() {
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '45185475';
  if (!TOKEN) return;
  try {
    const Database = require('better-sqlite3');
    const dbPath = join(dataDir || join(process.cwd(), 'data'), 'stats', 'stats.db');
    const sdb = new Database(dbPath, { readonly: true });

    const gsc = sdb.prepare('SELECT * FROM stat_snapshots WHERE source = ? ORDER BY date DESC LIMIT 1').get('google');
    const yx = sdb.prepare('SELECT * FROM stat_snapshots WHERE source = ? ORDER BY date DESC LIMIT 1').get('yandex');
    const met = sdb.prepare('SELECT * FROM stat_snapshots WHERE source = ? ORDER BY date DESC LIMIT 1').get('metrika');
    const kw = sdb.prepare('SELECT keyword, position, clicks, impressions FROM keyword_positions WHERE date = (SELECT MAX(date) FROM keyword_positions) ORDER BY position ASC LIMIT 5').all();
    const cwv = sdb.prepare('SELECT lcp, cls, inp, score FROM cwv_snapshots WHERE date = (SELECT MAX(date) FROM cwv_snapshots) LIMIT 1').get();

    let report = `📊 Ежедневный дigest ortopednn.ru\n\n`;
    if (gsc) report += `GSC: ${gsc.clicks||0} кликов / ${gsc.impressions||0} показов / поз.${(gsc.avg_position||0).toFixed(1)}\n`;
    if (yx) report += `Яндекс: ${yx.total_indexed||0} индекс. / ${yx.total_errors||0} ошибок\n`;
    if (met) {
      const raw = JSON.parse(met.raw || '{}');
      report += `Метрика: ${raw.users||'?'} посет. / ${raw.pageviews||'?'} просм. / ${raw.avgDuration||'?'}с\n`;
    }
    if (kw.length) {
      report += `\nТоп-5 ключей:\n`;
      report += kw.map(k => `${k.keyword}: поз.${k.position.toFixed(1)} (${k.clicks}↗)`).join('\n');
    }
    if (cwv) report += `\nCWV: LCP:${cwv.lcp}с CLS:${cwv.cls} INP:${cwv.inp}мс Score:${cwv.score}`;
    sdb.close();

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: report })
    });
    console.log('Daily digest sent');
  } catch (e) { console.error('Digest error:', e.message); }
}
