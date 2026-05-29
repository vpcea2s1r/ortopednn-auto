import fetch from 'node-fetch';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const COMPETITORS = [
  { name: 'Доктор Дент', url: 'https://drdentnn.ru' },
  { name: 'Ника Спринг', url: 'https://nika-nn.ru' },
  { name: 'Артдент', url: 'https://artdentnn.ru' },
  { name: 'Тонус Эстетик', url: 'https://tonusestetic.ru' },
  { name: 'Имплант52', url: 'https://implant52.ru' },
  { name: 'Имидж Стоматология', url: 'https://istom.ru' },
  { name: 'Евроклиник', url: 'https://euroclinicnn.ru' },
];

const MAX_URLS_PER_SITE = 50;
const CONCURRENCY = 5;

async function fetchText(url) {
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 });
    if (!resp.ok) return null;
    return await resp.text();
  } catch { return null; }
}

async function fetchSitemapUrls(siteUrl) {
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const xml = await fetchText(sitemapUrl);
  if (!xml) return [];

  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

  const subSitemaps = locs.filter(l => l.includes('sitemap'));
  if (subSitemaps.length > 0) {
    const allUrls = [];
    for (const sub of subSitemaps) {
      const subXml = await fetchText(sub);
      if (subXml) {
        const subLocs = [...subXml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
        allUrls.push(...subLocs);
      }
    }
    return allUrls;
  }

  return locs;
}

function cleanTag(text) {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

async function scrapePage(url) {
  const html = await fetchText(url);
  if (!html) return null;

  const h1 = [...html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gis)].map(m => cleanTag(m[1])).filter(Boolean);
  const h2 = [...html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gis)].map(m => cleanTag(m[1])).filter(Boolean);

  return { h1, h2 };
}

async function main() {
  const results = [];

  for (const site of COMPETITORS) {
    process.stdout.write(`\n${site.name}: fetching sitemap... `);
    const urls = await fetchSitemapUrls(site.url);
    console.log(`${urls.length} URLs found`);

    const pages = urls
      .filter(u => !u.match(/\.(xml|jpg|png|pdf|css|js)$/i))
      .slice(0, MAX_URLS_PER_SITE);

    for (let i = 0; i < pages.length; i += CONCURRENCY) {
      const batch = pages.slice(i, i + CONCURRENCY);
      const scraped = await Promise.all(batch.map(async url => {
        const page = await scrapePage(url);
        if (page && (page.h1.length > 0 || page.h2.length > 0)) {
          return { site: site.name, name: site.name, url, ...page };
        }
        return null;
      }));
      for (const r of scraped) {
        if (r) results.push(r);
      }
      process.stdout.write('.');
    }
    console.log(` ${results.filter(r => r.site === site.name).length} pages with content`);
  }

  results.sort((a, b) => a.site.localeCompare(b.site));

  const outputPath = join(__dirname, '..', 'data', 'scraped-topics.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nTotal: ${results.length} pages saved to data/scraped-topics.json`);
}

main().catch(console.error);
