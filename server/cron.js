import cron from 'node-cron';
import fetch from 'node-fetch';
import fs from 'fs';
import { join } from 'path';

let db, dataDir;

export function setupCron(getDb, dir) {
  db = getDb;
  dataDir = dir;
  cron.schedule('0 8 * * *', () => {
    console.log('Daily: collecting stats');
    import('./collector.js').then(m => m.collectAll(db())).catch(e => console.error(e));
  });
  cron.schedule('0 7 * * *', () => {
    console.log('Daily 7:00: content pipeline');
    import('./agent-pipeline.js').then(m => m.pickAndRun()).then(r => {
      if (r.info) console.log(r.info);
      else console.log(r.published ? `Pipeline: ${r.published.url}` : `Pipeline: ${JSON.stringify(r).slice(0, 100)}`);
    }).catch(e => console.error('Pipeline error:', e));
  });
  cron.schedule('0 9 * * 1', () => {
    console.log('Weekly: sitemap check');
    checkSitemap();
  });
  console.log('Cron: content 7:00 daily, stats 8:00 daily, sitemap 9:00 Monday');
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
