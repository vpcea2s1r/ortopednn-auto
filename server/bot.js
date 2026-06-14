import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pickAndRun, runPipelineManual, addTopic, listTopics, listState, ghPut, ghFetch, checkAiTells, humanize } from './agent-pipeline.js';

const __dirname = fileURLToPath(import.meta.url);
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const DRAFTS_DIR = join(DATA_DIR, 'drafts');
const BLOG_INDEX = join(__dirname, '..', '..', 'src', 'pages', 'blog', 'index.astro');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = 'vpcea2s1r';
const GH_REPO = 'stomatolog';
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL || '@ortopednn';
const STATS_DB = join(DATA_DIR, 'stats', 'stats.db');

function getStatsDb() {
  try {
    const Database = require('better-sqlite3');
    return new Database(STATS_DB, { readonly: true });
  } catch { return null; }
}

const TRANSLIT = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
function makeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/[а-яё]/g, c => TRANSLIT[c] || c)
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

function loadExistingSlugs() {
  const slugs = new Set();
  try {
    const index = readFileSync(BLOG_INDEX, 'utf-8');
    const matches = index.matchAll(/slug:\s*'([^']+)'/g);
    for (const m of matches) slugs.add(m[1]);
    const draftMetas = existsSync(DRAFTS_DIR) ? readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json')) : [];
    for (const f of draftMetas) {
      try { const d = JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf-8')); slugs.add(d.slug); } catch {}
    }
  } catch {}
  return slugs;
}

function isDuplicateTitle(newTitle, threshold = 0.6) {
  try {
    const index = readFileSync(BLOG_INDEX, 'utf-8');
    const titles = index.matchAll(/title:\s*'([^']+)'/g);
    const t = newTitle.toLowerCase();
    for (const m of titles) {
      const existing = m[1].toLowerCase();
      if (existing === t) return true;
      const common = [...t].filter(c => existing.includes(c)).length;
      if (common / Math.max(t.length, existing.length) >= threshold) return true;
    }
  } catch {}
  return false;
}

function extractBodies(s) {
  const bodyMatch = s.match(/(?:"|')body(?:"|')\s*:\s*["']/);
  if (!bodyMatch) return null;
  const afterKey = s.slice(bodyMatch.index + bodyMatch[0].length);
  let inStr = false, esc = false, content = '';
  for (let i = 0; i < afterKey.length; i++) {
    const ch = afterKey[i];
    if (esc) { content += ch; esc = false; continue; }
    if (ch === '\\') { content += ch; esc = true; continue; }
    if (inStr) {
      if (ch === '"' || ch === "'") {
        const rest = afterKey.slice(i + 1).trim();
        if (rest.startsWith(',') || rest.startsWith('}')) return content;
        content += ch; continue;
      }
      content += ch;
    } else if (ch === '"' || ch === "'") inStr = true;
  }
  return afterKey.replace(/["']\s*[,\}].*$/s, '').trim();
}

function tryParseJSON(raw) {
  try { const r = JSON.parse(raw); if (r && typeof r.title === 'string') return r; } catch {}
  let d = 0; for (const c of raw) { if (c === '{') d++; if (c === '}') d--; }
  if (d > 0) { try { const r = JSON.parse(raw + '}'.repeat(d)); if (r && typeof r.title === 'string') return r; } catch {} }
  try { const s = raw.replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); const r = JSON.parse(s); if (r && typeof r.title === 'string') return r; } catch {}
  return null;
}

function tryExtract(raw) {
  const mt = raw.match(new RegExp(`"title"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  const md = raw.match(new RegExp(`"description"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (mt && md) { const mb = extractBodies(raw); if (mb) return { title: mt[1], description: md[1], body: mb }; }
  const mtq = raw.match(/'title'\s*:\s*'([^']+)'/);
  const mdq = raw.match(/'description'\s*:\s*'([^']+)'/);
  if (mtq && mdq) { const mb = extractBodies(raw); if (mb) return { title: mtq[1], description: mdq[1], body: mb }; }
  return null;
}

function repairJSON(raw) {
  if (!raw || typeof raw !== 'string') return '';
  raw = raw.replace(/```(?:json|html)?\n?/gi, '').replace(/```\n?/g, '').trim();
  try { const p = JSON.parse(raw); if (p.content && typeof p.content === 'string') raw = p.content; } catch {}
  raw = raw.replace(/```(?:json|html)?\n?/gi, '').replace(/```\n?/g, '').trim();
  const first = raw.indexOf('{');
  let depth = 0, lastGood = -1;
  for (let i = first; i < raw.length && i >= 0; i++) {
    if (raw[i] === '{') depth++;
    else if (raw[i] === '}') { depth--; if (depth === 0) { lastGood = i + 1; break; } }
  }
  if (first !== -1 && lastGood > first) raw = raw.slice(first, lastGood);
  return raw;
}

function parseAny(raw) {
  const cleaned = repairJSON(raw);
  if (!cleaned) return null;
  return tryParseJSON(cleaned) || tryExtract(cleaned) || tryExtract(raw);
}

function stripH1(html) {
  return html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
}

function formatDate(iso) {
  const m = { '01':'января','02':'февраля','03':'марта','04':'апреля','05':'мая','06':'июня','07':'июля','08':'августа','09':'сентября','10':'октября','11':'ноября','12':'декабря' };
  const [y, month, d] = iso.split('-');
  return `${parseInt(d,10)} ${m[month]||month} ${y}`;
}

function htmlTemplate({ title, date, body }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>${title}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333;line-height:1.7}
h1{color:#1e3a5f;font-size:1.6rem}
.meta{color:#7a9ab8;font-size:.9rem;margin-bottom:1.5rem}
h2{color:#2e6ab3;margin:2rem 0 1rem}
p{color:#555;margin-bottom:1rem}
ul,ol{padding-left:1.5rem;margin-bottom:1rem;color:#555}
table{width:100%;border-collapse:collapse;margin-bottom:1.5rem}
th,td{text-align:left;padding:.75rem;border-bottom:1px solid #e0e8f0;color:#555}
th{background:#f5f8fc;color:#1e3a5f}
.cta{text-align:center;padding:1.5rem;background:#f8fafc;border-radius:8px;margin-top:2rem}
.cta p{margin-bottom:1rem}
.btn{display:inline-block;background:#4a90d9;color:#fff;padding:.75rem 2rem;border-radius:100px;text-decoration:none;font-weight:600}
a{color:#4a90d9}
</style>
</head>
<body>
<h1>${title}</h1>
<div class="meta">${formatDate(date)} — Никитина Марина Георгиевна, стоматолог-ортопед</div>
${body}
<div class="cta"><p>Нужна консультация?</p><a href="tel:+79202537317" class="btn">Позвонить: +7 (920) 253-73-17</a></div>
</body>
</html>`;
}

function astroTemplate({ slug, title, description, author, date, body, noindex = false }) {
  const e = (s) => s.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const bodyClean = stripH1(body);
  const domain = noindex ? 'stomatolog.ortopednn.ru' : 'ortopednn.ru';
  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Navbar from '../../components/Navbar.astro';
import doctor from '../../../data/doctor.json';
const slug = '${slug}';
const pageUrl = \`https://${domain}/blog/\${slug}/\`;
const ldArticle = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${e(title)}",
  "description": "${e(description)}",
  "author": { "@type": "Person", "name": "${e(author)}", "medicalSpecialty": "Prosthodontics" },
  "datePublished": "${date}",
  "dateModified": "${date}",
  "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
  "image": "https://ortopednn.ru/og-image.svg",
  "publisher": { "@type": "Organization", "name": "ОртопедНН" }
};
---
<BaseLayout title="${e(title)}" description="${e(description)}" breadcrumbTitle="${e(title)}" doctor={doctor} noindex={${noindex}}>
  <Navbar />
  <main class="container">
    <a href="/blog" class="back">← К статьям</a>
    <article>
      <h1>${e(title)}</h1>
      <div class="meta">${formatDate(date)} — ${e(author)}, стоматолог-ортопед</div>
${bodyClean}
      <div class="cta">
        <p>Нужна консультация?</p>
        <a href={\`tel:\${doctor.phone}\`} class="btn">Позвонить: {doctor.phoneDisplay}</a>
      </div>
    </article>
  </main>
</BaseLayout>
<script type="application/ld+json" set:html={JSON.stringify(ldArticle)} />
<style>
.container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; }
.back { color: var(--primary); margin-bottom: 1rem; display: inline-block; }
article { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
h1 { color: #1e3a5f; margin-bottom: 0.5rem; }
.meta { color: #7a9ab8; font-size: 0.9rem; margin-bottom: 1rem; }
h2 { color: #2e6ab3; margin: 2rem 0 1rem; font-size: 1.3rem; }
h3 { color: #1e3a5f; margin: 1.5rem 0 0.75rem; font-size: 1.1rem; }
p { color: #5a7a9a; line-height: 1.7; margin-bottom: 1rem; }
ul { color: #5a7a9a; padding-left: 1.5rem; margin-bottom: 1rem; }
li { margin-bottom: 0.5rem; line-height: 1.6; }
ol { color: #5a7a9a; padding-left: 1.5rem; margin-bottom: 1rem; }
table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #e0e8f0; color: #5a7a9a; }
th { background: #f5f8fc; color: #1e3a5f; font-weight: 600; }
.cta { text-align: center; padding: 1.5rem; background: #f8fafc; border-radius: 8px; margin-top: 2rem; }
.cta p { margin-bottom: 1rem; }
.btn { display: inline-block; background: #4a90d9; color: white; padding: 0.75rem 2rem; border-radius: 100px; text-decoration: none; font-weight: 600; }
</style>`;
}

async function callAI(prompt) {
  const system = 'Ответь только JSON. {"title":"...","description":"...","body":"<p>...</p>"}';
  const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(300000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ortopednn-bot/1.0' },
    body: JSON.stringify({
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      model: 'deepseek-v4-flash-free'
    })
  });
  if (!resp.ok) console.error('AI API non-200:', resp.status);
  const text = await Promise.race([
    resp.text(),
    new Promise((_, reject) => setTimeout(() => reject(new Error('body timeout')), 60000))
  ]);
  if (!text.trim()) throw new Error('Empty AI response');
  try {
    if (text.trim().startsWith('{')) {
      const data = JSON.parse(text);
      return data.choices?.[0]?.message?.content || text;
    }
  } catch (e) {
    console.error('AI JSON parse error:', e.message, 'response starts:', text.substring(0, 100));
    throw e;
  }
  return text;
}

async function extractText(url) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const html = await resp.text();
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/&[#a-zA-Z0-9]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

async function checkPerf() {
  const resp = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https%3A%2Fortopednn.ru&strategy=mobile`, { signal: AbortSignal.timeout(30000) });
  const data = await resp.json();
  const lh = data?.lighthouseResult?.categories;
  const perf = lh?.performance?.score != null ? Math.round(lh.performance.score * 100) : '—';
  const seo = lh?.seo?.score != null ? Math.round(lh.seo.score * 100) : '—';
  const a11y = lh?.accessibility?.score != null ? Math.round(lh.accessibility.score * 100) : '—';
  const crux = data?.loadingExperience?.metrics || {};
  const fmt = (m) => m?.percentile != null ? m.percentile : null;
  const lcp = fmt(crux.LARGEST_CONTENTFUL_PAINT_MS);
  const cls = fmt(crux.CUMULATIVE_LAYOUT_SHIFT_SCORE);
  const fid = fmt(crux.FIRST_INPUT_DELAY_MS);
  const emoji = (s) => s >= 90 ? '🟢' : s >= 50 ? '🟡' : '🔴';
  return [
    `⚡ *Performance*: ${emoji(perf)} ${perf}`,
    `🔍 *SEO*: ${emoji(seo)} ${seo}`,
    `♿ *A11y*: ${emoji(a11y)} ${a11y}`,
    ``,
    `👤 *Real Users*`,
    lcp ? `  LCP: ${(lcp/1000).toFixed(1)}s ${lcp <= 2500 ? '🟢' : lcp <= 4000 ? '🟡' : '🔴'}` : '',
    cls !== null ? `  CLS: ${cls.toFixed(2)} ${cls <= 0.1 ? '🟢' : cls <= 0.25 ? '🟡' : '🔴'}` : '',
    fid ? `  FID: ${fid}ms ${fid <= 100 ? '🟢' : fid <= 300 ? '🟡' : '🔴'}` : '',
  ].filter(Boolean).join('\n');
}

async function searchPubMed(query) {
  const keywords = query.split(/[\s,;:?!()]+/).filter(w => w.length > 2).slice(0, 6).join(' ');
  const safeQuery = encodeURIComponent(keywords || query.substring(0, 100));
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${safeQuery}&retmax=5&retmode=json`;
  const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
  if (!searchResp.ok) { console.error('PubMed search non-200:', searchResp.status, query.substring(0, 60)); return []; }
  const searchData = await searchResp.json();
  const ids = searchData?.esearchresult?.idlist || [];
  if (!ids.length) return [];
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
  const sumResp = await fetch(summaryUrl, { signal: AbortSignal.timeout(15000) });
  if (!sumResp.ok) { console.error('PubMed summary non-200:', sumResp.status); return []; }
  let sumData;
  try { sumData = await sumResp.json(); } catch (e) { console.error('PubMed summary parse error:', e.message); return []; }
  return ids.map(id => {
    const r = sumData?.result?.[id] || {};
    return { id, title: r.title || '', source: r.source || '', pubdate: r.pubdate || '', url: `https://pubmed.ncbi.nlm.nih.gov/${id}/` };
  });
}

async function rewrite(url, sourceText) {
  const text = sourceText || await extractText(url);
  console.log('Rewrite started, source length:', text.length, 'url:', url ? url.substring(0,80) : 'raw');
  const buildPrompt = (extra) => `Ты стоматолог-ортопед. Перепиши исходный текст для блога на русском. Пиши языком врача — просто, без воды, без штампов.

ТРЕБОВАНИЯ:
- lead (абзац-введение с сутью) в начале
- 2-3 подзаголовка h2
- таблица сравнения или классификации (обязательно)
- один список ul/ol  
- блок FAQ: 3-5 вопросов с ответами
- без h1
- 2000-3000 символов body
- экранируй кавычки, только JSON

ЗАПРЕЩЕНО:
- не выдумывай ссылки на исследования, PMID, DOI, источники
- не придумывай названия продуктов, материалов или технологий
- не используй эти слова: delve, tapestry, meticulous, robust, leverage, groundbreaking, seamless, transformative, empower, revolutionize, synergy, holistic, intricate, testament, foster, showcase, pivotal, underscore, interplay, garner, bolster, elevate, unlock, paradigm
- не используй фразы: когда речь заходит о, стоит отметить, важно подчеркнуть, играет важную роль, современные реалии, не только но и, позволяет не только, в заключение, в конечном счёте, решая задачу, открывает возможности
- без длинных причастных оборотов в конце предложений (обеспечивая, позволяя, создавая)
- без тире (—) в каждом абзаце
- пиши короткими предложениями, без канцелярита

ИСХОДНЫЙ ТЕКСТ:
${text.substring(0, 5000)}

${extra || ''}
UUID: ${Date.now()}

{"title":"...","description":"...","body":"<p>...</p>"}`;

  let lastJson = null;
  let lastRaw = '';
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const extra = (attempt > 1 && lastJson) ? `Предыдущая попытка отклонена из-за AI-стиля. Исправь:\n${checkAiTells(lastJson.body).map(t => '- ' + t.tag).join('\n')}\nПиши естественнее.` : '';
    const prompt = buildPrompt(extra);
    const raw = await callAI(prompt);
    lastRaw = raw;
    const json = parseAny(raw);
    if (!json || !json.title || !json.description || !json.body) continue;
    lastJson = json;

    const tells = checkAiTells(json.body);
    if (tells.length > 0 && attempt < maxAttempts) continue;

    json.body = humanize(json.body);

    const existingSlugs = loadExistingSlugs();
    const slug = makeSlug(json.title);
    if (existingSlugs.has(slug) || isDuplicateTitle(json.title)) return { duplicate: true, title: json.title };

    const date = new Date().toISOString().split('T')[0];
    const article = astroTemplate({ slug, title: json.title, description: json.description, author: 'Никитина Марина Георгиевна', date, body: json.body, noindex: true });
    if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true });
    writeFileSync(join(DRAFTS_DIR, `${slug}.astro`), article, 'utf-8');
    writeFileSync(join(DRAFTS_DIR, `${slug}.meta.json`), JSON.stringify({ slug, title: json.title, description: json.description, date, status: 'draft', repo: 'ortopednn-auto' }, null, 2), 'utf-8');

    // Push draft JSON for preview system
    try {
      const draftBody = extractBodyFromAstro(article);
      const draftMeta = { slug, title: json.title, date, description: json.description, body: draftBody };
      const existing = await ghFetch(`data/drafts/${slug}.json`);
      await ghPut(`data/drafts/${slug}.json`, JSON.stringify(draftMeta, null, 2), `draft: ${slug} [preview]`, existing?.sha);
    } catch (e) {
      console.error('Preview draft push error:', e.message);
    }

    const htmlContent = htmlTemplate({ title: json.title, date, body: json.body });
    const enc = Buffer.from(htmlContent, 'utf-8').toString('base64');
    const ghUrl = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/blog/${slug}.html`;
    const existing = await fetch(ghUrl, { headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' } }).then(r => r.ok ? r.json() : null);
    const req = { message: `draft: ${slug}`, content: enc, branch: 'main' };
    if (existing?.sha) req.sha = existing.sha;
    await fetch(ghUrl, { method: 'PUT', headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' }, body: JSON.stringify(req) });

    return { slug, title: json.title, tells: tells.length, previewUrl: `https://ortopednn.ru/preview/${slug}/` };
  }
  return { error: true, response: lastRaw, tells: lastJson ? checkAiTells(lastJson.body) : [] };
}

function extractBodyFromAstro(astroContent) {
  // Extract article body between <h1> and cta div
  const h1end = astroContent.indexOf('</h1>');
  const ctaStart = astroContent.indexOf('cta');
  if (h1end === -1 || ctaStart === -1) return '';
  // Find the meta div after h1, then get content after </div>
  const metaEnd = astroContent.indexOf('</div>', h1end);
  const start = metaEnd !== -1 ? metaEnd + 6 : h1end + 5;
  const end = astroContent.lastIndexOf('<div', ctaStart);
  return astroContent.slice(start, end !== -1 ? end : ctaStart).trim();
}

async function pushToStomatolog(slug) {
  const draftPath = join(DRAFTS_DIR, `${slug}.astro`);
  const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
  if (!existsSync(draftPath)) return { error: 'Файл не найден' };
  const astroContent = readFileSync(draftPath, 'utf-8');
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {};
  const body = extractBodyFromAstro(astroContent);
  const html = htmlTemplate({ title: meta.title || slug, date: meta.date || new Date().toISOString().split('T')[0], body });
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/blog/${slug}.html`;
  const headers = { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' };
  const existing = await fetch(url, { headers }).then(r => r.ok ? r.json() : null);
  const sha = existing && existing.sha ? existing.sha : undefined;
  const payload = { message: `draft: ${slug}`, content: Buffer.from(html, 'utf-8').toString('base64') };
  if (sha) payload.sha = sha;
  const resp = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
  const json = await resp.json();
  if (!resp.ok) return { error: json.message || 'GitHub API error' };
  unlinkSync(draftPath);
  if (existsSync(metaPath)) unlinkSync(metaPath);
  return { ok: true, slug, url: `https://stomatolog.ortopednn.ru/blog/${slug}.html` };
}

async function publishToOrtopednn(slug) {
  const draftPath = join(DRAFTS_DIR, `${slug}.astro`);
  if (!existsSync(draftPath)) return { error: 'Файл не найден' };
  const content = readFileSync(draftPath, 'utf-8');
  const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {};

  try {
    const existing = await ghFetch(`src/pages/blog/${slug}.astro`);
    const sha = existing?.sha;
    await ghPut(`src/pages/blog/${slug}.astro`, content, `draft: ${slug} [approved]`, sha);
  } catch (e) {
    return { error: e.message };
  }

  if (meta.astroEntry) {
    try {
      const indexFile = await ghFetch('src/pages/blog/index.astro');
      if (indexFile) {
        const indexContent = Buffer.from(indexFile.content, 'base64').toString('utf-8');
        const insertPoint = indexContent.indexOf('const articles = [');
        if (insertPoint !== -1) {
          const afterBracket = indexContent.indexOf('[', insertPoint) + 1;
          const patched = indexContent.slice(0, afterBracket) + '\n' + meta.astroEntry + indexContent.slice(afterBracket);
          await ghPut('src/pages/blog/index.astro', patched, 'blog: update index [draft]', indexFile.sha);
        }
      }
    } catch (e) {
      console.error('Index patch error:', e.message);
    }
  }

  try {
    const contentFile = await ghFetch('CONTENT.md');
    if (contentFile) {
      let contentMd = Buffer.from(contentFile.content, 'base64').toString('utf-8');
      const lines = contentMd.split('\n');
      const headerIdx = lines.findIndex(l => l.startsWith('| # |'));
      if (headerIdx !== -1) {
        const lastNum = lines.filter(l => l.match(/^\|\s*\d+\s*\|/)).reduce((max, l) => {
          const m = l.match(/^\|\s*(\d+)\s*\|/);
          return m ? Math.max(max, parseInt(m[1])) : max;
        }, 0);
        const newLine = `| ${lastNum + 1} | ${meta.title || ''} | ${meta.date || ''} ✅ |`;
        const lastRow = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.startsWith('|') && l.match(/^\|\s*\d+\s*\|/)).pop();
        if (lastRow) {
          contentMd = lines.slice(0, lastRow.i + 1).join('\n') + '\n' + newLine + '\n' + lines.slice(lastRow.i + 1).join('\n');
          await ghPut('CONTENT.md', contentMd, 'blog: update CONTENT.md [draft]', contentFile.sha);
        }
      }
    }
  } catch (e) {
    console.error('CONTENT.md patch error:', e.message);
  }

  deleteDraft(slug);
  // Clean up draft JSON from repo (if preview system generated it)
  try {
    const draftJson = await ghFetch(`data/drafts/${slug}.json`);
    if (draftJson?.sha) {
      const dlUrl = `https://api.github.com/repos/vpcea2s1r/ortopednn-auto/contents/data/drafts/${slug}.json`;
      await fetch(dlUrl, {
        method: 'DELETE',
        headers: { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
        body: JSON.stringify({ message: `draft: ${slug} [published]`, sha: draftJson.sha, branch: 'master' })
      });
    }
  } catch (e) {
    console.error('Failed to clean up repo draft:', e.message);
  }
  return { ok: true, slug, url: `https://ortopednn.ru/blog/${slug}/` };
}

function deleteDraft(slug) {
  ['astro', 'meta.json'].forEach(ext => {
    const p = join(DRAFTS_DIR, `${slug}.${ext}`);
    if (existsSync(p)) unlinkSync(p);
  });
}

async function tg(method, body) {
  const timeout = method === 'getUpdates' ? 60000 : 15000;
  const resp = await fetch(`${API}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeout)
  });
  return await resp.json();
}

async function postToChannel(title, slug, domain = 'https://ortopednn.ru') {
  if (!CHANNEL_ID) return;
  try {
    await tg('sendMessage', {
      chat_id: CHANNEL_ID,
      text: `📄 *${title}*\n\nЧитать на сайте: ${domain}/blog/${slug}/`,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (e) {
    console.error('Channel post error:', e.message);
  }
}

function mainMenu() {
  return {
    inline_keyboard: [
      [{ text: '📊 Статистика', callback_data: 'menu:stats' }, { text: '⚡ Перфоманс', callback_data: 'menu:perf' }],
      [{ text: '📝 Черновики', callback_data: 'menu:drafts' }, { text: '📰 Дзен', callback_data: 'menu:dzen' }],
      [{ text: '🔬 PubMed рерайт', callback_data: 'menu:research' }]
    ]
  };
}

async function fetchGitHubDrafts() {
  try {
    const contents = await ghFetch('data/drafts/');
    if (!contents || !Array.isArray(contents)) return [];
    const metaFiles = contents.filter(f => f.name.endsWith('.meta.json') && f.type === 'file');
    if (!metaFiles.length) return [];
    const drafts = [];
    for (const file of metaFiles) {
      try {
        const data = await ghFetch(`data/drafts/${file.name}`);
        if (data?.content) {
          const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
          const draft = JSON.parse(decoded);
          if (draft.slug) drafts.push(draft);
        }
      } catch {}
    }
    return drafts;
  } catch {
    return [];
  }
}

function draftButtons(slug, repo) {
  const buttons = [];
  if (repo === 'ortopednn-auto') {
    buttons.push({ text: 'На сайт', callback_data: `pub:${slug}` });
  } else {
    buttons.push({ text: 'Опубликовать', callback_data: `pub:${slug}` });
  }
  buttons.push({ text: 'Удалить', callback_data: `del:${slug}` });
  return { inline_keyboard: [buttons] };
}

async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const msgId = cb.message.message_id;
  const data = cb.data || '';
  console.log('Callback:', data.slice(0, 40));
  const slug = data.slice(4);
  await tg('answerCallbackQuery', { callback_query_id: cb.id });
  await tg('answerCallbackQuery', { callback_query_id: cb.id });
  await tg('answerCallbackQuery', { callback_query_id: cb.id });
  if (data.startsWith('menu:')) {
    const action = data.slice(5);
    if (action === 'perf') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '📊 Проверяю...', reply_markup: { inline_keyboard: [] } });
      try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: await checkPerf(), parse_mode: 'Markdown' }); }
      catch (e) { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${e.message.slice(0, 200)}` }); }
    } else if (action === 'stats') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '📊 Собираю статистику...', reply_markup: { inline_keyboard: [] } });
      try {
        const sdb = getStatsDb();
        if (!sdb) { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '❌ БД статистики недоступна', reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } }); return; }
        const latest = sdb.prepare('SELECT * FROM stat_snapshots ORDER BY date DESC LIMIT 2').all();
        const kw = sdb.prepare('SELECT keyword, position, clicks, impressions FROM keyword_positions WHERE date = (SELECT MAX(date) FROM keyword_positions) ORDER BY position ASC LIMIT 10').all();
        const cwv = sdb.prepare('SELECT url, lcp, cls, inp, score FROM cwv_snapshots WHERE date = (SELECT MAX(date) FROM cwv_snapshots) LIMIT 1').all();
        const days = sdb.prepare('SELECT COUNT(DISTINCT date) as cnt FROM stat_snapshots').get();
        sdb.close();

        let report = `📊 *Статистика ortopednn.ru*\n\n`;
        if (latest.length) {
          const gsc = latest.find(r => r.source === 'google');
          const yx = latest.find(r => r.source === 'yandex');
          const met = latest.find(r => r.source === 'metrika');
          if (gsc) report += `*Google:* ${gsc.clicks||0} кликов · ${gsc.impressions||0} показов · поз. ${(gsc.avg_position||0).toFixed(1)}\n`;
          if (yx) {
            const raw = JSON.parse(yx.raw || '{}');
            report += `*Яндекс:* ${yx.total_indexed||0} индекс. · ⚠️ ${yx.total_errors||0}\n`;
            if (raw.queries) report += `_Топ:_ ${raw.queries.slice(0,3).join(', ')}\n`;
          }
          if (met) {
            const raw = JSON.parse(met.raw || '{}');
            report += `*Метрика:* 👥${raw.users||'?'} · 📄${raw.pageviews||'?'} · ⏱${raw.avgDuration||'?'}с\n`;
          }
        } else { report += '_Нет данных_\n'; }
        if (kw.length) {
          report += `\n*Ключевые слова:*\n`;
          report += kw.map(k => `${k.keyword}: поз.${k.position.toFixed(1)} (${k.clicks}↗ ${k.impressions}👁)`).join('\n');
        }
        if (cwv.length) {
          const c = cwv[0];
          report += `\n*CWV:* LCP:${c.lcp}с CLS:${c.cls} INP:${c.inp}мс\n`;
        }
        report += `\n_${days?.cnt||0} дн. в базе_`;
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: report, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } });
      } catch (e) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ ${e.message.slice(0, 200)}`, reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } });
      }
    } else if (action === 'drafts') {
      let draftsList = existsSync(DRAFTS_DIR)
        ? readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json')).map(f => {
            try { const d = JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf8')); return d; } catch { return null; }
          }).filter(Boolean) : [];
      if (!draftsList.length) draftsList = await fetchGitHubDrafts();
      if (!draftsList.length) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'Нет черновиков.', reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } });
      } else {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `📝 ${draftsList.length} черновиков:`, reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } });
        for (const d of draftsList) {
          try {
            const isPipeline = d.repo === 'ortopednn-auto';
            const statusIcon = isPipeline ? '🔄' : '📄';
            const statusText = isPipeline ? 'На рассмотрении' : 'Черновик';
            const previewLink = d.repo === 'ortopednn-auto' ? `https://ortopednn.ru/preview/${d.slug}/` : `https://stomatolog.ortopednn.ru/blog/${d.slug}.html`;
            await tg('sendMessage', {
              chat_id: chatId,
              text: `${d.title}\n📅 ${d.date}\n${statusIcon} ${statusText}\n👀 Предпросмотр: ${previewLink}`,
              reply_markup: draftButtons(d.slug, d.repo)
            });
          } catch (e) { console.error('Send draft error:', e.message); }
        }
      }
    } else if (action === 'dzen') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '📰 Генерация статьи для Дзена\n\nНапиши: /dzen тема\n\nФормат: 4-5к символов, оптимизировано под алгоритм Дзена.', reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } });
    } else if (action === 'research') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'Напиши: /research тема', reply_markup: { inline_keyboard: [[{ text: '« Назад', callback_data: 'menu:back' }]] } });
    } else if (action === 'back') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'Меню управления ботом:', reply_markup: mainMenu() });
    }
    return;
  }
  if (data.startsWith('pubmed:')) {
    const pmid = data.slice(7);
    const pmidUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
    await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '📄 Читаю PubMed...' });
    try {
      const result = await rewrite(pmidUrl);
      if (result?.error) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${result.response?.substring(0, 200) || result.error}` });
      } else if (result?.duplicate) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Дубликат: ${result.title}` });
      } else {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `✅ Сохранён: ${result.title}`, reply_markup: draftButtons(result.slug) });
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${e.message.slice(0, 200)}` });
    }
    return;
  }
  if (data.startsWith('pub:')) {
    await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Публикую ${slug}...` });
    const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
    let result;
    if (existsSync(metaPath)) {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      result = meta.repo === 'ortopednn-auto' ? await publishToOrtopednn(slug) : await pushToStomatolog(slug);
      // After successful publish to ortopednn, delete from stomatolog
      if (result.ok && meta.repo === 'ortopednn-auto') {
        try {
          const stomUrl = `https://api.github.com/repos/vpcea2s1r/stomatolog/contents/blog/${slug}.html`;
          const stomHeaders = { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' };
          const stomExisting = await fetch(stomUrl, { headers: stomHeaders }).then(r => r.ok ? r.json() : null);
          if (stomExisting?.sha) {
            await fetch(stomUrl, { method: 'DELETE', headers: stomHeaders, body: JSON.stringify({ message: `remove: ${slug} [published to ortopednn]`, sha: stomExisting.sha }) });
          }
        } catch (e) { console.error('Stomatolog delete error:', e.message); }
      }
    } else {
      result = await pushToStomatolog(slug);
    }
    if (result.error) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${result.error}` });
    } else {
      await tg('editMessageText', {
        chat_id: chatId, message_id: msgId,
        text: `Опубликовано! ${result.url}`,
        reply_markup: { inline_keyboard: [] }
      });
    }
  } else if (data.startsWith('del:')) {
    try {
      const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
      if (existsSync(metaPath)) {
        const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
        if (meta.repo === 'ortopednn-auto') {
          // Also delete from stomatolog repo
          try {
            const stomUrl = `https://api.github.com/repos/vpcea2s1r/stomatolog/contents/blog/${slug}.html`;
            const stomHeaders = { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' };
            const stomExisting = await fetch(stomUrl, { headers: stomHeaders }).then(r => r.ok ? r.json() : null);
            if (stomExisting?.sha) {
              await fetch(stomUrl, { method: 'DELETE', headers: stomHeaders, body: JSON.stringify({ message: `remove: ${slug} [deleted]`, sha: stomExisting.sha }) });
            }
          } catch (e) { console.error('Stomatolog delete error:', e.message); }
        }
      }
      deleteDraft(slug);
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'Удалён.', reply_markup: { inline_keyboard: [] } });
    } catch (e) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'Ошибка: ' + e.message.slice(0, 50), show_alert: true });
    }
  }
}

async function handleUpdate(upd) {
  if (upd.callback_query) return handleCallback(upd.callback_query);
  const msg = upd.message;
  if (!msg || (!msg.text && !msg.caption)) return;
  const chatId = msg.chat.id;
  const text = (msg.text || msg.caption || '').trim();
  const isUrl = text.match(/https?:\/\/[^\s]+/);
  const isCmd = text.startsWith('/');
  if (isCmd && text.startsWith('/start')) {
    const payload = text.split(' ').slice(1).join(' ').trim();
    if (payload.startsWith('publish_')) {
      const slug = payload.slice(8);
      const msg = await tg('sendMessage', { chat_id: chatId, text: `Публикую ${slug}...` });
      const msgId = msg.ok ? msg.result.message_id : null;
      try {
        const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
        let result;
        if (existsSync(metaPath)) {
          const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
          result = meta.repo === 'ortopednn-auto' ? await publishToOrtopednn(slug) : await pushToStomatolog(slug);
        } else {
          result = await publishToOrtopednn(slug);
        }
        if (result.ok && msgId) await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `✅ Опубликовано: ${result.url}` });
        else if (msgId) await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ ${result.error || 'Ошибка'}` });
      } catch (e) {
        if (msgId) tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ ${e.message.slice(0, 200)}` });
      }
    } else if (payload.startsWith('delete_')) {
      const slug = payload.slice(7);
      try {
        deleteDraft(slug);
        await tg('sendMessage', { chat_id: chatId, text: `Удалён: ${slug}` });
      } catch (e) {
        await tg('sendMessage', { chat_id: chatId, text: `Ошибка: ${e.message.slice(0, 200)}` });
      }
    } else {
      const isStart = text === '/start';
      const intro = isStart ? 'Привет! Я бот для рерайта статей и управления контентом ortopednn.ru.\n\nКидай ссылку — я перепишу её для блога. Или форвардни сообщение из канала.\n\n' : '';
      await tg('sendMessage', { chat_id: chatId, text: intro + 'Меню управления ботом:', reply_markup: mainMenu() });
    }
  } else if (isCmd && text === '/perf') {
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: '📊 Проверяю производительность...' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: await checkPerf(), parse_mode: 'Markdown' }); }
    catch (e) { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${e.message.slice(0, 200)}` }); }
  } else if (isCmd && text === '/drafts') {
    let drafts = existsSync(DRAFTS_DIR)
      ? readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json')).map(f => {
          try { return JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf8')); } catch { return null; }
        }).filter(Boolean)
      : [];
    if (!drafts.length) drafts = await fetchGitHubDrafts();
    if (drafts.length === 0) {
      await tg('sendMessage', { chat_id: chatId, text: 'Нет черновиков.' });
    } else {
      for (const d of drafts) {
        const isPipeline = d.repo === 'ortopednn-auto';
        const domain = 'stomatolog.ortopednn.ru';
        const statusIcon = isPipeline ? '🔄' : '📄';
        const statusText = isPipeline ? 'На рассмотрении' : 'Черновик';
        const urlPart = isPipeline ? '' : `\n${domain}/blog/${d.slug}.html`;
        await tg('sendMessage', {
          chat_id: chatId,
          text: `${d.title}\n📅 ${d.date}\n${statusIcon} ${statusText}${urlPart}`,
          reply_markup: draftButtons(d.slug, d.repo)
        });
      }
    }
  } else if (isCmd && text.startsWith('/autogen ')) {
    const query = text.slice(9).trim();
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: `Запускаю пайплайн: ${query}...` });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      await addTopic(query);
      runPipelineManual(query).then(async (result) => {
        if (result.error) await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка на этапе "${result.stage}": ${result.error}` });
        else {
          await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `✅ Черновик готов: ${result.draft.title}`, reply_markup: draftButtons(result.draft.slug) });
          await postToChannel(result.draft.title, result.draft.slug);
        }
      }).catch(e => tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка: ${e.message.slice(0, 200)}` }));
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${e.message.slice(0, 200)}` });
    }
  } else if (isCmd && text.startsWith('/dzen ')) {
    const query = text.slice(6).trim();
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: `📝 Генерирую статью для Дзена: ${query}...` });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const { runDzenPipeline } = await import('./dzen-generator.js');
      const result = await runDzenPipeline(query);
      if (result.error) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка: ${result.error}` });
      } else {
        const chars = result.draft.charCount || '?';
        await tg('editMessageText', {
          chat_id: chatId, message_id: msgId,
          text: `✅ Дзен-статья готова: ${result.draft.title}\n📊 ${chars} символов\n🏷 ${result.draft.slug}`,
          reply_markup: draftButtons(result.draft.slug)
        });
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка: ${e.message.slice(0, 200)}` });
    }
  } else if (isCmd && text === '/horizon') {
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: '🌐 Запускаю Horizon пайплайн...' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const { runHorizonPipeline } = await import('./agent-pipeline.js');
      const result = await runHorizonPipeline();
      const text = result.generated > 0
        ? `🌐 Horizon: ${result.generated} черновиков из ${result.totalItems} новостей\n/drafts — просмотреть`
        : `🌐 Horizon: нет новых черновиков (${result.totalItems} новостей)`;
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text });
      if (result.drafts) {
        for (const d of result.drafts) {
          await postToChannel(d.title, d.slug);
        }
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка: ${e.message.slice(0, 200)}` });
    }
  } else if (isCmd && text === '/stats') {
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: '📊 Собираю статистику...' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const sdb = getStatsDb();
      if (!sdb) { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '❌ БД статистики недоступна' }); return; }
      const latest = sdb.prepare('SELECT * FROM stat_snapshots ORDER BY date DESC LIMIT 2').all();
      const kw = sdb.prepare('SELECT keyword, position, clicks, impressions FROM keyword_positions WHERE date = (SELECT MAX(date) FROM keyword_positions) ORDER BY position ASC LIMIT 10').all();
      const cwv = sdb.prepare('SELECT url, lcp, cls, inp, score FROM cwv_snapshots WHERE date = (SELECT MAX(date) FROM cwv_snapshots) LIMIT 1').all();
      const days = sdb.prepare('SELECT COUNT(DISTINCT date) as cnt FROM stat_snapshots').get();
      sdb.close();

      let report = `📊 *Статистика ortopednn.ru*\n_Обновлено: ${new Date().toISOString().slice(0,16)}_\n\n`;

      if (latest.length) {
        const gsc = latest.find(r => r.source === 'google');
        const yx = latest.find(r => r.source === 'yandex');
        const met = latest.find(r => r.source === 'metrika');
        if (gsc) report += `*Google Search Console*\n📈 ${gsc.clicks||0} кликов · ${gsc.impressions||0} показов · поз. ${(gsc.avg_position||0).toFixed(1)}\n`;
        if (yx) {
          const raw = JSON.parse(yx.raw || '{}');
          report += `*Яндекс*\n🔍 ${yx.total_indexed||0} проиндексировано · ⚠️ ${yx.total_errors||0} ошибок\n`;
          if (raw.queries) report += `_Топ-запросы:_ ${raw.queries.slice(0,3).join(', ')}\n`;
        }
        if (met) {
          const raw = JSON.parse(met.raw || '{}');
          report += `*Метрика*\n👥 ${raw.users||'?'} посетителей · 📄 ${raw.pageviews||'?'} просмотров · ⏱ ${raw.avgDuration||'?'} сек\n`;
        }
      } else { report += '_Нет данных. Запустите collection: `node collector.js`_\n'; }

      if (kw.length) {
        report += `\n*Топ ключевых слов:*\n`;
        report += kw.map(k => `${k.keyword}: поз.${k.position.toFixed(1)} (${k.clicks}↗ ${k.impressions}👁)`).join('\n');
      }

      if (cwv.length) {
        const c = cwv[0];
        report += `\n*Core Web Vitals*\nLCP: ${c.lcp}с · CLS: ${c.cls} · INP: ${c.inp}мс · Score: ${c.score}\n`;
      }

      report += `\n_Дней в базе: ${days?.cnt || 0}_`;
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: report, parse_mode: 'Markdown' });
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка: ${e.message.slice(0, 200)}` });
    }
  } else if (isCmd && text.startsWith('/research ')) {
    const query = text.slice(10).trim();
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: `🔍 Ищу PubMed: ${query}...` });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const results = await searchPubMed(query);
      if (!results.length) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'Ничего не найдено.' });
      } else {
        const text = results.map((r, i) => `${i+1}. ${r.title}\n_${r.source}, ${r.pubdate}_`).join('\n\n');
        const buttons = results.map(r => ([{ text: r.title.substring(0, 40), callback_data: `pubmed:${r.id}` }]));
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: text, parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Ошибка: ${e.message.slice(0, 200)}` });
    }
  } else if (isUrl) {
    const url = text.match(/https?:\/\/[^\s]+/)[0];
    console.log(`URL received: ${url} from ${chatId}`);
    const statusResp = await tg('sendMessage', { chat_id: chatId, text: 'Читаю статью...' });
    const msgId = statusResp.ok ? statusResp.result.message_id : null;
    if (!msgId) return;
    await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '⏳ Рерайт... до 5 мин. Бот отвечает на команды.' });
    const progress = setInterval(async () => {
      try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: '⏳ Всё ещё работаю...' }); } catch {}
    }, 120000);
    rewrite(url).then(async (result) => {
      clearInterval(progress);
      const edit = (t, extra) => tg('editMessageText', { chat_id: chatId, message_id: msgId, text: t, ...(extra || {}) });
      if (result?.error) {
        let msg = `❌ ${(result.response || '').replace(/\n/g, ' ').substring(0, 200)}`;
        if (result.tells?.length) msg += `\nAI-маркеры: ${result.tells.map(t => t.tag).join(', ')}`;
        edit(msg);
      } else if (result?.duplicate) {
        edit(`⚠️ Дубликат: ${result.title}`);
      } else {
        try {
          const draftFile = readFileSync(join(DRAFTS_DIR, `${result.slug}.astro`), 'utf-8');
          const text = draftFile.replace(/<[^>]+>/g, ' ').replace(/&[#a-zA-Z0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
          const full = text.substring(0, 3000);
          const previewLink = result.previewUrl || `https://stomatolog.ortopednn.ru/blog/${result.slug}.html`;
          await tg('sendMessage', { chat_id: chatId, text: `📄 *${result.title}*\n\n${full.substring(0, 1000)}\n\n👀 Предпросмотр: ${previewLink}`, parse_mode: 'Markdown', disable_web_page_preview: true });
          edit(`✅ Готово`, { reply_markup: draftButtons(result.slug) });
        } catch { edit(`✅ Сохранён: ${result.title}`, { reply_markup: draftButtons(result.slug) }); }
      }
    }).catch(e => {
      clearInterval(progress);
      tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ ${e.message.includes('aborted') ? 'AI не ответил за 5 мин.' : e.message.slice(0, 200)}` });
    });
  } else if (isCmd) {
    await tg('sendMessage', { chat_id: chatId, text: 'Неизвестная команда. /menu — меню управления.' });
  } else if (text.trim()) {
    console.log('PLAIN TEXT from', chatId, ':', text.substring(0, 60));
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: '⏳ Рерайт текста... до 5 мин.' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const result = await rewrite(null, text);
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: result.error
        ? `❌ ${result.response ? result.response.substring(0, 300) : 'Ошибка рерайта'}`
        : result.duplicate
          ? `⚠️ Дубликат: ${result.title}`
          : `✅ Готово: ${result.title}\n/drafts — черновики\n👀 Предпросмотр: ${result.previewUrl || `https://ortopednn.ru/preview/${result.slug}/`}` });
    } catch (e) {
      console.error('Rewrite error:', e.message?.substring(0, 200));
      tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ ${e.message?.slice(0, 200) || 'неизвестная ошибка'}` });
    }
  }
}

export async function startBot(webhookMode = false) {
  if (!TOKEN) { console.log('TELEGRAM_BOT_TOKEN not set, bot disabled'); return; }
  const domain = process.env.WEBHOOK_DOMAIN;
  if (webhookMode && domain) {
    await tg('setWebhook', { url: `${domain}/webhook` });
    console.log(`Webhook set: ${domain}/webhook`);
    const { default: express } = await import('express');
    const app = express();
    app.use(express.json());
    app.post('/webhook', (req, res) => {
      handleUpdate(req.body).catch(e => console.error('Webhook error:', e));
      res.sendStatus(200);
    });
    return;
  }
  await tg('setMyCommands', { commands: [
    { command: 'menu', description: 'Меню управления' },
    { command: 'perf', description: 'Производительность сайта' },
    { command: 'research', description: 'Поиск PubMed + рерайт' },
    { command: 'drafts', description: 'Черновики статей' }
  ]});
  console.log('Polling mode (every 10s)...');
  let offset = 0;
  while (true) {
    try {
      const updates = await tg('getUpdates', { offset, timeout: 30 });
      if (updates.ok) {
        for (const upd of updates.result) {
          offset = upd.update_id + 1;
          handleUpdate(upd).catch(e => {
            console.error('Update error:', e.message);
            const chatId = upd.message?.chat?.id || upd.callback_query?.message?.chat?.id;
            if (chatId) tg('sendMessage', { chat_id: chatId, text: `Ошибка: ${e.message.slice(0, 200)}` }).catch(() => {});
          });
        }
      }
    } catch (e) { console.error('Poll error:', e.message); }
  }
}

export { rewrite, checkPerf, searchPubMed };
