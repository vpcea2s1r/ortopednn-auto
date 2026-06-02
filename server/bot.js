import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { pickAndRun, runPipelineManual, addTopic, listTopics, listState, ghPut, ghFetch, checkAiTells } from './agent-pipeline.js';

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

const TRANSLIT = { 'Р°':'a','Р±':'b','РІ':'v','Рі':'g','Рґ':'d','Рµ':'e','С‘':'e','Р¶':'zh','Р·':'z','Рё':'i','Р№':'y','Рє':'k','Р»':'l','Рј':'m','РЅ':'n','Рѕ':'o','Рї':'p','СЂ':'r','СЃ':'s','С‚':'t','Сѓ':'u','С„':'f','С…':'kh','С†':'ts','С‡':'ch','С€':'sh','С‰':'shch','СЉ':'','С‹':'y','СЊ':'','СЌ':'e','СЋ':'yu','СЏ':'ya' };
function makeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/[Р°-СЏС‘]/g, c => TRANSLIT[c] || c)
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
  const m = { '01':'СЏРЅРІР°СЂСЏ','02':'С„РµРІСЂР°Р»СЏ','03':'РјР°СЂС‚Р°','04':'Р°РїСЂРµР»СЏ','05':'РјР°СЏ','06':'РёСЋРЅСЏ','07':'РёСЋР»СЏ','08':'Р°РІРіСѓСЃС‚Р°','09':'СЃРµРЅС‚СЏР±СЂСЏ','10':'РѕРєС‚СЏР±СЂСЏ','11':'РЅРѕСЏР±СЂСЏ','12':'РґРµРєР°Р±СЂСЏ' };
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
<div class="meta">${formatDate(date)} вЂ” РќРёРєРёС‚РёРЅР° РњР°СЂРёРЅР° Р“РµРѕСЂРіРёРµРІРЅР°, СЃС‚РѕРјР°С‚РѕР»РѕРі-РѕСЂС‚РѕРїРµРґ</div>
${body}
<div class="cta"><p>РќСѓР¶РЅР° РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ?</p><a href="tel:+79202537317" class="btn">РџРѕР·РІРѕРЅРёС‚СЊ: +7 (920) 253-73-17</a></div>
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
  "publisher": { "@type": "Organization", "name": "РћСЂС‚РѕРїРµРґРќРќ" }
};
---
<BaseLayout title="${e(title)}" description="${e(description)}" breadcrumbTitle="${e(title)}" doctor={doctor} noindex={${noindex}}>
  <Navbar />
  <main class="container">
    <a href="/blog" class="back">в†ђ Рљ СЃС‚Р°С‚СЊСЏРј</a>
    <article>
      <h1>${e(title)}</h1>
      <div class="meta">${formatDate(date)} вЂ” ${e(author)}, СЃС‚РѕРјР°С‚РѕР»РѕРі-РѕСЂС‚РѕРїРµРґ</div>
${bodyClean}
      <div class="cta">
        <p>РќСѓР¶РЅР° РєРѕРЅСЃСѓР»СЊС‚Р°С†РёСЏ?</p>
        <a href={\`tel:\${doctor.phone}\`} class="btn">РџРѕР·РІРѕРЅРёС‚СЊ: {doctor.phoneDisplay}</a>
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
  const system = 'РћС‚РІРµС‚СЊ С‚РѕР»СЊРєРѕ JSON. {"title":"...","description":"...","body":"<p>...</p>"}';
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
  const perf = lh?.performance?.score != null ? Math.round(lh.performance.score * 100) : 'вЂ”';
  const seo = lh?.seo?.score != null ? Math.round(lh.seo.score * 100) : 'вЂ”';
  const a11y = lh?.accessibility?.score != null ? Math.round(lh.accessibility.score * 100) : 'вЂ”';
  const crux = data?.loadingExperience?.metrics || {};
  const fmt = (m) => m?.percentile != null ? m.percentile : null;
  const lcp = fmt(crux.LARGEST_CONTENTFUL_PAINT_MS);
  const cls = fmt(crux.CUMULATIVE_LAYOUT_SHIFT_SCORE);
  const fid = fmt(crux.FIRST_INPUT_DELAY_MS);
  const emoji = (s) => s >= 90 ? 'рџџў' : s >= 50 ? 'рџџЎ' : 'рџ”ґ';
  return [
    `вљЎ *Performance*: ${emoji(perf)} ${perf}`,
    `рџ”Ќ *SEO*: ${emoji(seo)} ${seo}`,
    `в™ї *A11y*: ${emoji(a11y)} ${a11y}`,
    ``,
    `рџ‘¤ *Real Users*`,
    lcp ? `  LCP: ${(lcp/1000).toFixed(1)}s ${lcp <= 2500 ? 'рџџў' : lcp <= 4000 ? 'рџџЎ' : 'рџ”ґ'}` : '',
    cls !== null ? `  CLS: ${cls.toFixed(2)} ${cls <= 0.1 ? 'рџџў' : cls <= 0.25 ? 'рџџЎ' : 'рџ”ґ'}` : '',
    fid ? `  FID: ${fid}ms ${fid <= 100 ? 'рџџў' : fid <= 300 ? 'рџџЎ' : 'рџ”ґ'}` : '',
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
  const buildPrompt = (extra) => `РўС‹ СЃС‚РѕРјР°С‚РѕР»РѕРі-РѕСЂС‚РѕРїРµРґ. РџРµСЂРµРїРёС€Рё РёСЃС…РѕРґРЅС‹Р№ С‚РµРєСЃС‚ РґР»СЏ Р±Р»РѕРіР° РЅР° СЂСѓСЃСЃРєРѕРј. РџРёС€Рё СЏР·С‹РєРѕРј РІСЂР°С‡Р° вЂ” РїСЂРѕСЃС‚Рѕ, Р±РµР· РІРѕРґС‹, Р±РµР· С€С‚Р°РјРїРѕРІ.

РўР Р•Р‘РћР’РђРќРРЇ:
- lead (Р°Р±Р·Р°С†-РІРІРµРґРµРЅРёРµ СЃ СЃСѓС‚СЊСЋ) РІ РЅР°С‡Р°Р»Рµ
- 2-3 РїРѕРґР·Р°РіРѕР»РѕРІРєР° h2
- С‚Р°Р±Р»РёС†Р° СЃСЂР°РІРЅРµРЅРёСЏ РёР»Рё РєР»Р°СЃСЃРёС„РёРєР°С†РёРё (РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ)
- РѕРґРёРЅ СЃРїРёСЃРѕРє ul/ol  
- Р±Р»РѕРє FAQ: 3-5 РІРѕРїСЂРѕСЃРѕРІ СЃ РѕС‚РІРµС‚Р°РјРё
- Р±РµР· h1
- 2000-3000 СЃРёРјРІРѕР»РѕРІ body
- СЌРєСЂР°РЅРёСЂСѓР№ РєР°РІС‹С‡РєРё, С‚РѕР»СЊРєРѕ JSON

Р—РђРџР Р•Р©Р•РќРћ:
- РЅРµ РІС‹РґСѓРјС‹РІР°Р№ СЃСЃС‹Р»РєРё РЅР° РёСЃСЃР»РµРґРѕРІР°РЅРёСЏ, PMID, DOI, РёСЃС‚РѕС‡РЅРёРєРё
- РЅРµ РїСЂРёРґСѓРјС‹РІР°Р№ РЅР°Р·РІР°РЅРёСЏ РїСЂРѕРґСѓРєС‚РѕРІ, РјР°С‚РµСЂРёР°Р»РѕРІ РёР»Рё С‚РµС…РЅРѕР»РѕРіРёР№
- РЅРµ РёСЃРїРѕР»СЊР·СѓР№ СЌС‚Рё СЃР»РѕРІР°: delve, tapestry, meticulous, robust, leverage, groundbreaking, seamless, transformative, empower, revolutionize, synergy, holistic, intricate, testament, foster, showcase, pivotal, underscore, interplay, garner, bolster, elevate, unlock, paradigm
- РЅРµ РёСЃРїРѕР»СЊР·СѓР№ С„СЂР°Р·С‹: РєРѕРіРґР° СЂРµС‡СЊ Р·Р°С…РѕРґРёС‚ Рѕ, СЃС‚РѕРёС‚ РѕС‚РјРµС‚РёС‚СЊ, РІР°Р¶РЅРѕ РїРѕРґС‡РµСЂРєРЅСѓС‚СЊ, РёРіСЂР°РµС‚ РІР°Р¶РЅСѓСЋ СЂРѕР»СЊ, СЃРѕРІСЂРµРјРµРЅРЅС‹Рµ СЂРµР°Р»РёРё, РЅРµ С‚РѕР»СЊРєРѕ РЅРѕ Рё, РїРѕР·РІРѕР»СЏРµС‚ РЅРµ С‚РѕР»СЊРєРѕ, РІ Р·Р°РєР»СЋС‡РµРЅРёРµ, РІ РєРѕРЅРµС‡РЅРѕРј СЃС‡С‘С‚Рµ, СЂРµС€Р°СЏ Р·Р°РґР°С‡Сѓ, РѕС‚РєСЂС‹РІР°РµС‚ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё
- Р±РµР· РґР»РёРЅРЅС‹С… РїСЂРёС‡Р°СЃС‚РЅС‹С… РѕР±РѕСЂРѕС‚РѕРІ РІ РєРѕРЅС†Рµ РїСЂРµРґР»РѕР¶РµРЅРёР№ (РѕР±РµСЃРїРµС‡РёРІР°СЏ, РїРѕР·РІРѕР»СЏСЏ, СЃРѕР·РґР°РІР°СЏ)
- Р±РµР· С‚РёСЂРµ (вЂ”) РІ РєР°Р¶РґРѕРј Р°Р±Р·Р°С†Рµ
- РїРёС€Рё РєРѕСЂРѕС‚РєРёРјРё РїСЂРµРґР»РѕР¶РµРЅРёСЏРјРё, Р±РµР· РєР°РЅС†РµР»СЏСЂРёС‚Р°

РРЎРҐРћР”РќР«Р™ РўР•РљРЎРў:
${text.substring(0, 5000)}

${extra || ''}
UUID: ${Date.now()}

{"title":"...","description":"...","body":"<p>...</p>"}`;

  let lastJson = null;
  let lastRaw = '';
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const extra = (attempt > 1 && lastJson) ? `РџСЂРµРґС‹РґСѓС‰Р°СЏ РїРѕРїС‹С‚РєР° РѕС‚РєР»РѕРЅРµРЅР° РёР·-Р·Р° AI-СЃС‚РёР»СЏ. РСЃРїСЂР°РІСЊ:\n${checkAiTells(lastJson.body).map(t => '- ' + t.tag).join('\n')}\nРџРёС€Рё РµСЃС‚РµСЃС‚РІРµРЅРЅРµРµ.` : '';
    const prompt = buildPrompt(extra);
    const raw = await callAI(prompt);
    lastRaw = raw;
    const json = parseAny(raw);
    if (!json || !json.title || !json.description || !json.body) continue;
    lastJson = json;

    const tells = checkAiTells(json.body);
    if (tells.length > 0 && attempt < maxAttempts) continue;

    const existingSlugs = loadExistingSlugs();
    const slug = makeSlug(json.title);
    if (existingSlugs.has(slug) || isDuplicateTitle(json.title)) return { duplicate: true, title: json.title };

    const date = new Date().toISOString().split('T')[0];
    const article = astroTemplate({ slug, title: json.title, description: json.description, author: 'РќРёРєРёС‚РёРЅР° РњР°СЂРёРЅР° Р“РµРѕСЂРіРёРµРІРЅР°', date, body: json.body, noindex: true });
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
  if (!existsSync(draftPath)) return { error: 'Р¤Р°Р№Р» РЅРµ РЅР°Р№РґРµРЅ' };
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
  if (!existsSync(draftPath)) return { error: 'Р¤Р°Р№Р» РЅРµ РЅР°Р№РґРµРЅ' };
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
        const newLine = `| ${lastNum + 1} | ${meta.title || ''} | ${meta.date || ''} вњ… |`;
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
      text: `рџ“„ *${title}*\n\nР§РёС‚Р°С‚СЊ РЅР° СЃР°Р№С‚Рµ: ${domain}/blog/${slug}/`,
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
      [{ text: 'рџ“Љ РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ', callback_data: 'menu:perf' }],
      [{ text: 'рџ“ќ Р§РµСЂРЅРѕРІРёРєРё', callback_data: 'menu:drafts' }],
      [{ text: 'рџ”¬ PubMed СЂРµСЂР°Р№С‚', callback_data: 'menu:research' }]
    ]
  };
}

function draftButtons(slug, repo) {
  const buttons = [];
  if (repo === 'ortopednn-auto') {
    buttons.push({ text: 'РќР° СЃР°Р№С‚', callback_data: `pub:${slug}` });
  } else {
    buttons.push({ text: 'РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ', callback_data: `pub:${slug}` });
  }
  buttons.push({ text: 'РЈРґР°Р»РёС‚СЊ', callback_data: `del:${slug}` });
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
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'рџ“Љ РџСЂРѕРІРµСЂСЏСЋ...', reply_markup: { inline_keyboard: [] } });
      try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: await checkPerf(), parse_mode: 'Markdown' }); }
      catch (e) { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` }); }
    } else if (action === 'drafts') {
      console.log('DRAFTS_DIR:', DRAFTS_DIR, 'exists:', existsSync(DRAFTS_DIR));
      const draftsList = existsSync(DRAFTS_DIR)
        ? readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json')).map(f => {
            try { const d = JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf8')); return d; } catch { return null; }
          }).filter(Boolean) : [];
      console.log('Drafts count:', draftsList.length);
      if (!draftsList.length) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'РќРµС‚ С‡РµСЂРЅРѕРІРёРєРѕРІ.', reply_markup: { inline_keyboard: [[{ text: 'В« РќР°Р·Р°Рґ', callback_data: 'menu:back' }]] } });
      } else {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `рџ“ќ ${draftsList.length} С‡РµСЂРЅРѕРІРёРєРѕРІ:`, reply_markup: { inline_keyboard: [[{ text: 'В« РќР°Р·Р°Рґ', callback_data: 'menu:back' }]] } });
        for (const d of draftsList) {
          try {
            const isPipeline = d.repo === 'ortopednn-auto';
            const statusIcon = isPipeline ? 'рџ”„' : 'рџ“„';
            const statusText = isPipeline ? 'РќР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРё' : 'Р§РµСЂРЅРѕРІРёРє';
            const previewLink = d.repo === 'ortopednn-auto' ? `https://ortopednn.ru/preview/${d.slug}/` : `https://stomatolog.ortopednn.ru/blog/${d.slug}.html`;
            await tg('sendMessage', {
              chat_id: chatId,
              text: `${d.title}\nрџ“… ${d.date}\n${statusIcon} ${statusText}\nрџ‘Ђ РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ: ${previewLink}`,
              reply_markup: draftButtons(d.slug, d.repo)
            });
          } catch (e) { console.error('Send draft error:', e.message); }
        }
      }
    } else if (action === 'research') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'РќР°РїРёС€Рё: /research С‚РµРјР°', reply_markup: { inline_keyboard: [[{ text: 'В« РќР°Р·Р°Рґ', callback_data: 'menu:back' }]] } });
    } else if (action === 'back') {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'РњРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ Р±РѕС‚РѕРј:', reply_markup: mainMenu() });
    }
    return;
  }
  if (data.startsWith('pubmed:')) {
    const pmid = data.slice(7);
    const pmidUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
    await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'рџ“„ Р§РёС‚Р°СЋ PubMed...' });
    try {
      const result = await rewrite(pmidUrl);
      if (result?.error) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${result.response?.substring(0, 200) || result.error}` });
      } else if (result?.duplicate) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `Р”СѓР±Р»РёРєР°С‚: ${result.title}` });
      } else {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вњ… РЎРѕС…СЂР°РЅС‘РЅ: ${result.title}`, reply_markup: draftButtons(result.slug) });
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` });
    }
    return;
  }
  if (data.startsWith('pub:')) {
    await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РџСѓР±Р»РёРєСѓСЋ ${slug}...` });
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
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${result.error}` });
    } else {
      await tg('editMessageText', {
        chat_id: chatId, message_id: msgId,
        text: `РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ! ${result.url}`,
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
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'РЈРґР°Р»С‘РЅ.', reply_markup: { inline_keyboard: [] } });
    } catch (e) {
      await tg('answerCallbackQuery', { callback_query_id: cb.id, text: 'РћС€РёР±РєР°: ' + e.message.slice(0, 50), show_alert: true });
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
      const msg = await tg('sendMessage', { chat_id: chatId, text: `РџСѓР±Р»РёРєСѓСЋ ${slug}...` });
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
        if (result.ok && msgId) await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вњ… РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ: ${result.url}` });
        else if (msgId) await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ ${result.error || 'РћС€РёР±РєР°'}` });
      } catch (e) {
        if (msgId) tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ ${e.message.slice(0, 200)}` });
      }
    } else if (payload.startsWith('delete_')) {
      const slug = payload.slice(7);
      try {
        deleteDraft(slug);
        await tg('sendMessage', { chat_id: chatId, text: `РЈРґР°Р»С‘РЅ: ${slug}` });
      } catch (e) {
        await tg('sendMessage', { chat_id: chatId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` });
      }
    } else {
      const isStart = text === '/start';
      const intro = isStart ? 'РџСЂРёРІРµС‚! РЇ Р±РѕС‚ РґР»СЏ СЂРµСЂР°Р№С‚Р° СЃС‚Р°С‚РµР№ Рё СѓРїСЂР°РІР»РµРЅРёСЏ РєРѕРЅС‚РµРЅС‚РѕРј ortopednn.ru.\n\nРљРёРґР°Р№ СЃСЃС‹Р»РєСѓ вЂ” СЏ РїРµСЂРµРїРёС€Сѓ РµС‘ РґР»СЏ Р±Р»РѕРіР°. РР»Рё С„РѕСЂРІР°СЂРґРЅРё СЃРѕРѕР±С‰РµРЅРёРµ РёР· РєР°РЅР°Р»Р°.\n\n' : '';
      await tg('sendMessage', { chat_id: chatId, text: intro + 'РњРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ Р±РѕС‚РѕРј:', reply_markup: mainMenu() });
    }
  } else if (isCmd && text === '/perf') {
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: 'рџ“Љ РџСЂРѕРІРµСЂСЏСЋ РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ...' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: await checkPerf(), parse_mode: 'Markdown' }); }
    catch (e) { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` }); }
  } else if (isCmd && text === '/drafts') {
    const drafts = existsSync(DRAFTS_DIR)
      ? readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json')).map(f => {
          try { return JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf8')); } catch { return null; }
        }).filter(Boolean)
      : [];
    if (drafts.length === 0) {
      await tg('sendMessage', { chat_id: chatId, text: 'РќРµС‚ С‡РµСЂРЅРѕРІРёРєРѕРІ.' });
    } else {
      for (const d of drafts) {
        const isPipeline = d.repo === 'ortopednn-auto';
        const domain = 'stomatolog.ortopednn.ru';
        const statusIcon = isPipeline ? 'рџ”„' : 'рџ“„';
        const statusText = isPipeline ? 'РќР° СЂР°СЃСЃРјРѕС‚СЂРµРЅРёРё' : 'Р§РµСЂРЅРѕРІРёРє';
        const urlPart = isPipeline ? '' : `\n${domain}/blog/${d.slug}.html`;
        await tg('sendMessage', {
          chat_id: chatId,
          text: `${d.title}\nрџ“… ${d.date}\n${statusIcon} ${statusText}${urlPart}`,
          reply_markup: draftButtons(d.slug, d.repo)
        });
      }
    }
  } else if (isCmd && text.startsWith('/autogen ')) {
    const query = text.slice(9).trim();
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: `Р—Р°РїСѓСЃРєР°СЋ РїР°Р№РїР»Р°Р№РЅ: ${query}...` });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      await addTopic(query);
      runPipelineManual(query).then(async (result) => {
        if (result.error) await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ РћС€РёР±РєР° РЅР° СЌС‚Р°РїРµ "${result.stage}": ${result.error}` });
        else {
          await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вњ… Р§РµСЂРЅРѕРІРёРє РіРѕС‚РѕРІ: ${result.draft.title}`, reply_markup: draftButtons(result.draft.slug) });
          await postToChannel(result.draft.title, result.draft.slug);
        }
      }).catch(e => tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ РћС€РёР±РєР°: ${e.message.slice(0, 200)}` }));
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` });
    }
  } else if (isCmd && text === '/horizon') {
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: 'рџЊђ Р—Р°РїСѓСЃРєР°СЋ Horizon РїР°Р№РїР»Р°Р№РЅ...' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const { runHorizonPipeline } = await import('./agent-pipeline.js');
      const result = await runHorizonPipeline();
      const text = result.generated > 0
        ? `рџЊђ Horizon: ${result.generated} С‡РµСЂРЅРѕРІРёРєРѕРІ РёР· ${result.totalItems} РЅРѕРІРѕСЃС‚РµР№\n/drafts вЂ” РїСЂРѕСЃРјРѕС‚СЂРµС‚СЊ`
        : `рџЊђ Horizon: РЅРµС‚ РЅРѕРІС‹С… С‡РµСЂРЅРѕРІРёРєРѕРІ (${result.totalItems} РЅРѕРІРѕСЃС‚РµР№)`;
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text });
      if (result.drafts) {
        for (const d of result.drafts) {
          await postToChannel(d.title, d.slug);
        }
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ РћС€РёР±РєР°: ${e.message.slice(0, 200)}` });
    }
  } else if (isCmd && text.startsWith('/research ')) {
    const query = text.slice(10).trim();
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: `рџ”Ќ РС‰Сѓ PubMed: ${query}...` });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const results = await searchPubMed(query);
      if (!results.length) {
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'РќРёС‡РµРіРѕ РЅРµ РЅР°Р№РґРµРЅРѕ.' });
      } else {
        const text = results.map((r, i) => `${i+1}. ${r.title}\n_${r.source}, ${r.pubdate}_`).join('\n\n');
        const buttons = results.map(r => ([{ text: r.title.substring(0, 40), callback_data: `pubmed:${r.id}` }]));
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: text, parse_mode: 'Markdown', reply_markup: { inline_keyboard: buttons } });
      }
    } catch (e) {
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` });
    }
  } else if (isUrl) {
    const url = text.match(/https?:\/\/[^\s]+/)[0];
    console.log(`URL received: ${url} from ${chatId}`);
    const statusResp = await tg('sendMessage', { chat_id: chatId, text: 'Р§РёС‚Р°СЋ СЃС‚Р°С‚СЊСЋ...' });
    const msgId = statusResp.ok ? statusResp.result.message_id : null;
    if (!msgId) return;
    await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'вЏі Р РµСЂР°Р№С‚... РґРѕ 5 РјРёРЅ. Р‘РѕС‚ РѕС‚РІРµС‡Р°РµС‚ РЅР° РєРѕРјР°РЅРґС‹.' });
    const progress = setInterval(async () => {
      try { await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'вЏі Р’СЃС‘ РµС‰С‘ СЂР°Р±РѕС‚Р°СЋ...' }); } catch {}
    }, 120000);
    rewrite(url).then(async (result) => {
      clearInterval(progress);
      const edit = (t, extra) => tg('editMessageText', { chat_id: chatId, message_id: msgId, text: t, ...(extra || {}) });
      if (result?.error) {
        let msg = `вќЊ ${(result.response || '').replace(/\n/g, ' ').substring(0, 200)}`;
        if (result.tells?.length) msg += `\nAI-РјР°СЂРєРµСЂС‹: ${result.tells.map(t => t.tag).join(', ')}`;
        edit(msg);
      } else if (result?.duplicate) {
        edit(`вљ пёЏ Р”СѓР±Р»РёРєР°С‚: ${result.title}`);
      } else {
        try {
          const draftFile = readFileSync(join(DRAFTS_DIR, `${result.slug}.astro`), 'utf-8');
          const text = draftFile.replace(/<[^>]+>/g, ' ').replace(/&[#a-zA-Z0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
          const full = text.substring(0, 3000);
          const previewLink = result.previewUrl || `https://stomatolog.ortopednn.ru/blog/${result.slug}.html`;
          await tg('sendMessage', { chat_id: chatId, text: `рџ“„ *${result.title}*\n\n${full.substring(0, 1000)}\n\nрџ‘Ђ РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ: ${previewLink}`, parse_mode: 'Markdown', disable_web_page_preview: true });
          edit(`вњ… Р“РѕС‚РѕРІРѕ`, { reply_markup: draftButtons(result.slug) });
        } catch { edit(`вњ… РЎРѕС…СЂР°РЅС‘РЅ: ${result.title}`, { reply_markup: draftButtons(result.slug) }); }
      }
    }).catch(e => {
      clearInterval(progress);
      tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ ${e.message.includes('aborted') ? 'AI РЅРµ РѕС‚РІРµС‚РёР» Р·Р° 5 РјРёРЅ.' : e.message.slice(0, 200)}` });
    });
  } else if (isCmd) {
    await tg('sendMessage', { chat_id: chatId, text: 'РќРµРёР·РІРµСЃС‚РЅР°СЏ РєРѕРјР°РЅРґР°. /menu вЂ” РјРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ.' });
  } else if (text.trim()) {
    console.log('PLAIN TEXT from', chatId, ':', text.substring(0, 60));
    const statusMsg = await tg('sendMessage', { chat_id: chatId, text: 'рџ”Ќ РС‰Сѓ PubMed РїРѕ С‚РµРјРµ Рё РґРµР»Р°СЋ СЂРµСЂР°Р№С‚...' });
    const msgId = statusMsg.ok ? statusMsg.result.message_id : null;
    if (!msgId) return;
    try {
      const results = await searchPubMed(text);
      if (results.length) {
        const firstResult = results[0];
        console.log('PubMed found:', firstResult.title);
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `рџ“„ РќР°С€С‘Р»: ${firstResult.title}\n\nвЏі Р РµСЂР°Р№С‚... РґРѕ 5 РјРёРЅ.` });
        var result = await rewrite(firstResult.url);
      } else {
        console.log('PubMed 0 results, using raw text:', text.substring(0, 60));
        await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: 'вЏі Р РµСЂР°Р№С‚ С‚РµРєСЃС‚Р°... РґРѕ 5 РјРёРЅ.' });
        var result = await rewrite(null, text);
      }
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: result.error
        ? `вќЊ ${result.response ? result.response.substring(0, 300) : 'РћС€РёР±РєР° СЂРµСЂР°Р№С‚Р°'}`
        : result.duplicate
          ? `вљ пёЏ Р”СѓР±Р»РёРєР°С‚: ${result.title}`
          : `вњ… Р“РѕС‚РѕРІРѕ: ${result.title}\n/drafts вЂ” С‡РµСЂРЅРѕРІРёРєРё\nрџ‘Ђ РџСЂРµРґРїСЂРѕСЃРјРѕС‚СЂ: ${result.previewUrl || `https://ortopednn.ru/preview/${result.slug}/`}` });
    } catch (e) {
      console.error('PubMed rewrite error:', e.message?.substring(0, 200));
      tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `вќЊ ${e.message?.slice(0, 200) || 'РЅРµРёР·РІРµСЃС‚РЅР°СЏ РѕС€РёР±РєР°'}` });
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
    { command: 'menu', description: 'РњРµРЅСЋ СѓРїСЂР°РІР»РµРЅРёСЏ' },
    { command: 'perf', description: 'РџСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ СЃР°Р№С‚Р°' },
    { command: 'research', description: 'РџРѕРёСЃРє PubMed + СЂРµСЂР°Р№С‚' },
    { command: 'drafts', description: 'Р§РµСЂРЅРѕРІРёРєРё СЃС‚Р°С‚РµР№' }
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
            if (chatId) tg('sendMessage', { chat_id: chatId, text: `РћС€РёР±РєР°: ${e.message.slice(0, 200)}` }).catch(() => {});
          });
        }
      }
    } catch (e) { console.error('Poll error:', e.message); }
  }
}

export { rewrite, checkPerf, searchPubMed };
