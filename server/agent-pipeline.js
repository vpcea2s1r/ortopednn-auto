import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);
import { humanize, checkAiTells, score_ai, score_seo, composite_score, score_readability, pass_plan, pass_fetch, RULES } from './pipeline-utils.js';
import { enqueue, dequeue, listQueue, seedFromExisting, dedupAdd, loadState as bridgeLoadState, saveState as bridgeSaveState } from './bridge.js';
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = 'vpcea2s1r';
const GH_REPO = 'ortopednn-auto';
const GH_BRANCH = 'master';
const STOMATOLOG_REPO = 'stomatolog';

const TRANSLIT = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
function makeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/[а-яё]/g, c => TRANSLIT[c] || c)
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

const ghApi = (path) => `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`;
const ghHeaders = { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' };

async function ghFetch(path) {
  const resp = await fetch(ghApi(path), { headers: ghHeaders });
  if (!resp.ok) return null;
  return await resp.json();
}

async function ghPut(path, content, message, sha) {
  const body = { message, content: Buffer.from(content, 'utf-8').toString('base64'), branch: GH_BRANCH };
  if (sha) body.sha = sha;
  const resp = await fetch(ghApi(path), { method: 'PUT', headers: ghHeaders, body: JSON.stringify(body) });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`GitHub ${path}: ${json.message}`);
  return json;
}

/* --- Topics Queue --- */

/* --- Pipeline State (via Redis bridge) --- */

function loadState() { return bridgeLoadState(); }
function saveState(state) { return bridgeSaveState(state); }

/* --- RESEARCH AGENT --- */

const DENTISTRY_KEYWORDS = ['dentistry', 'dental', 'prosthodontics', 'prosthetic', 'implant', 'crown', 'bridge', 'orthopedic stomatology', 'oral rehabilitation', 'stomatology'];

async function researchAgent(topic) {
  const words = topic.replace(/[^а-яa-z\s]/gi, '').trim().split(/\s+/).filter(Boolean);
  const topicKeywords = words.slice(0, 3);
  const query = [...topicKeywords, ...DENTISTRY_KEYWORDS.slice(0, 3)].join(' ');
  let pubmedResults = [];
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=3&retmode=json`;
    const searchResp = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    const searchData = await searchResp.json();
    const ids = searchData?.esearchresult?.idlist || [];
    if (ids.length) {
      const sumUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
      const sumResp = await fetch(sumUrl, { signal: AbortSignal.timeout(15000) });
      const sumData = await sumResp.json();
      pubmedResults = ids.map(id => ({ id, title: sumData?.result?.[id]?.title || '', source: sumData?.result?.[id]?.source || '' }));
    }
  } catch {}
  return { topic, pubmedResults };
}

/* --- WRITER AGENT --- */

async function writerAgent(topic, research) {
  const pubmedContext = research.pubmedResults?.length
    ? research.pubmedResults.map(r => `- ${r.title} (${r.source})`).join('\n')
    : '';

  const voiceSpec = `Ты — Марина Георгиевна, стоматолог-ортопед с 15-летним опытом из Нижнего Новгорода. Твой голос:
- Короткие предложения, простые русские слова
- Конкретика: цифры, сроки, названия материалов
- Делишься наблюдениями из практики ("часто вижу, что...", "ко мне приходят с...")
- Без обобщений, без "современная стоматология", без "врачи рекомендуют"
- Никаких восклицаний, никаких призывов "запишитесь"
- Ты объясняешь коллеге-врачу, а не рекламируешь`;

  const prompt = `Напиши статью для блога стоматолога-ортопеда. Тема: "${topic}"

${pubmedContext ? 'Используй эти источники для аргументации (если уместно):\n' + pubmedContext : ''}

${voiceSpec}

Структура:
- Первый абзац: ответ на главный вопрос пациента
- 2-3 подзаголовка h2 по теме
- Таблица сравнения или классификации
- FAQ: 3-5 коротких вопрос-ответ
- Без h1

Технически:
- 2000-3000 символов body
- HTML: только p, h2, ul/ol, table (thead/tbody), strong
- Без ссылок на исследования, PMID, DOI, журналы (не выдумывай)
- Без названий продуктов, которые не в теме

Ответь ТОЛЬКО JSON:
{"title":"","description":"150-160 символов","body":"полный HTML"}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await callAI(prompt, { temperature: 0.7 });
    const json = parseJSON(raw);
    if (json?.title && json?.description && json?.body) return json;
  }
  throw new Error('Writer agent: failed to generate after 3 attempts');
}

/* --- HORIZON WRITER (uses existing content instead of research) --- */

async function horizonWriterAgent(item) {
  const allContext = [
    item.summary ? `Источник:\n${item.summary}` : '',
    item.background ? `\nКонтекст: ${item.background}` : '',
    item.community ? `\nОбсуждение: ${item.community}` : '',
  ].filter(Boolean).join('\n');

  const topic = `Новости стоматологии: ${item.title}`;

  const prompt = `Напиши новостную статью для блога стоматолога-ортопеда на основе следующей информации:

${allContext}

Ключевые параметры:
- 1500-2500 символов
- Первый абзац — главная новость/открытие (кто, что, когда)
- Объясни простым языком, почему это важно для пациентов и стоматологов
- Только p, h2, ul/ol tags
- Без h1, без "запишитесь к нам", без восклицательных знаков
- Стиль: естественный русский, простые слова. Без канцелярита

Ответь ТОЛЬКО JSON:
{"title":"","description":"150-160 символов","body":"полный HTML в русском переводе"}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await callAI(prompt, { temperature: 0.7 });
    const json = parseJSON(raw);
    if (json?.title && json?.description && json?.body) return json;
  }
  throw new Error('Horizon writer: failed after 3 attempts');
}

/* --- SEO AGENT --- */

function seoAgent(article) {
  const slug = makeSlug(article.title);
  const date = new Date().toISOString().split('T')[0];
  const bodyClean = article.body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
  return { slug, date, title: article.title, description: article.description.substring(0, 160), body: bodyClean };
}

/* --- DRAFT AGENT (save locally + push draft JSON to repo for preview) --- */

async function draftAgent(article) {
  const { slug, title, description, date, body } = article;
  const astro = astroTemplate({ slug, title, description, date, body, noindex: true });
  const draftsDir = join(DATA_DIR, 'drafts');
  mkdirSync(draftsDir, { recursive: true });

  writeFileSync(join(draftsDir, `${slug}.astro`), astro, 'utf-8');

  const newEntry = `  { slug: '${slug}', title: '${title.replace(/'/g, "\\'")}', date: '${date}', desc: '${description.replace(/'/g, "\\'")}' },`;
  writeFileSync(join(draftsDir, `${slug}.meta.json`), JSON.stringify({
    slug, title, description, date, status: 'draft',
    repo: 'ortopednn-auto',
    astroEntry: newEntry
  }, null, 2), 'utf-8');

  // Push draft JSON to repo for preview on ortopednn.ru/preview/<slug>/
  const draftJson = { slug, title, date, description, body, category: 'uncategorized' };
  writeFileSync(join(draftsDir, `${slug}.json`), JSON.stringify(draftJson, null, 2), 'utf-8');
  try {
    const existing = await ghFetch(`data/drafts/${slug}.json`);
    await ghPut(`data/drafts/${slug}.json`, JSON.stringify(draftJson, null, 2),
      `draft: ${slug} [preview]`, existing?.sha);
  } catch (e) {
    console.error('Failed to push draft JSON to repo:', e.message);
  }

  return { slug, title, url: `https://ortopednn.ru/blog/${slug}/` };
}

/* --- STOMATOLOG PUBLISHER (publish to stomatolog.ortopednn.ru as HTML with noindex) --- */

function stomatologHtmlTemplate({ title, date, body }) {
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
<h1>${title.replace(/"/g, '&quot;')}</h1>
<div class="meta">${stomatologFormatDate(date)} — Никитина Марина Георгиевна, стоматолог-ортопед</div>
${body}
<div class="cta"><p>Нужна консультация?</p><a href="tel:+79202537317" class="btn">Позвонить: +7 (920) 253-73-17</a></div>
</body>
</html>`;
}

function stomatologFormatDate(iso) {
  const m = { '01':'января','02':'февраля','03':'марта','04':'апреля','05':'мая','06':'июня','07':'июля','08':'августа','09':'сентября','10':'октября','11':'ноября','12':'декабря' };
  const [y, month, d] = iso.split('-');
  return `${parseInt(d,10)} ${m[month]||month} ${y}`;
}

async function stomatologPublisherAgent(article) {
  const { slug, title, date, body } = article;
  const html = stomatologHtmlTemplate({ title, date, body });
  const url = `https://api.github.com/repos/${GH_OWNER}/${STOMATOLOG_REPO}/contents/blog/${slug}.html`;
  const headers = { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' };
  const existing = await fetch(url, { headers }).then(r => r.ok ? r.json() : null);
  const sha = existing?.sha;
  const payload = { message: `blog: ${slug} [auto-pipeline]`, content: Buffer.from(html, 'utf-8').toString('base64') };
  if (sha) payload.sha = sha;
  const resp = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
  const json = await resp.json();
  if (!resp.ok) throw new Error(`stomatolog ${slug}: ${json.message}`);
  return { slug, title, url: `https://stomatolog.ortopednn.ru/blog/${slug}.html` };
}

/* --- PUBLISHER AGENT --- */

function astroTemplate({ slug, title, description, date, body, noindex = false }) {
  const e = (s) => s.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
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
  "author": { "@type": "Person", "name": "Никитина Марина Георгиевна", "medicalSpecialty": "Prosthodontics" },
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
      <div class="meta">${date.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, y, m, d) => {
        const months = { '01':'января','02':'февраля','03':'марта','04':'апреля','05':'мая','06':'июня','07':'июля','08':'августа','09':'сентября','10':'октября','11':'ноября','12':'декабря' };
        return `${parseInt(d)} ${months[m] || m} ${y}`;
      })} — Никитина Марина Георгиевна, стоматолог-ортопед</div>
${body}
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

async function publisherAgent(article) {
  const { slug, title, description, date, body } = article;
  const astro = astroTemplate({ slug, title, description, date, body });

  // 1. Push .astro file
  await ghPut(`src/pages/blog/${slug}.astro`, astro, `blog: ${slug} [auto-pipeline]`);

  // 2. Patch index.astro — insert at top of articles array
  const indexFile = await ghFetch('src/pages/blog/index.astro');
  if (!indexFile) throw new Error('index.astro not found');
  const indexContent = Buffer.from(indexFile.content, 'base64').toString('utf-8');
  const newEntry = `  { slug: '${slug}', title: '${title.replace(/'/g, "\\'")}', date: '${date}', desc: '${description.replace(/'/g, "\\'")}' },`;
  const insertPoint = indexContent.indexOf('const articles = [');
  if (insertPoint === -1) throw new Error('articles array not found in index.astro');
  const afterBracket = indexContent.indexOf('[', insertPoint) + 1;
  const patchedIndex = indexContent.slice(0, afterBracket) + '\n' + newEntry + indexContent.slice(afterBracket);
  await ghPut('src/pages/blog/index.astro', patchedIndex, 'blog: update index [auto-pipeline]', indexFile.sha);

  // 3. Patch CONTENT.md
  const contentFile = await ghFetch('CONTENT.md');
  if (contentFile) {
    let contentMd = Buffer.from(contentFile.content, 'base64').toString('utf-8');
    const lines = contentMd.split('\n');
    const headerIdx = lines.findIndex(l => l.startsWith('| # |'));
    if (headerIdx !== -1) {
      const tableLines = lines.slice(headerIdx + 1).filter(l => l.startsWith('|'));
      const lastNum = tableLines.reduce((max, l) => {
        const m = l.match(/^\|\s*(\d+)\s*\|/);
        return m ? Math.max(max, parseInt(m[1])) : max;
      }, 0);
      const newLine = `| ${lastNum + 1} | ${title} | ${date} ✅ |`;
      const sepIdx = headerIdx + 1;
      const afterSep = lines[sepIdx]?.startsWith('|---') ? sepIdx + 1 : sepIdx;
      contentMd = contentMd.slice(0, contentMd.indexOf('\n', contentMd.indexOf('\n', contentMd.indexOf('|') < 0 ? 0 : 0) + 1) + 1) + newLine + '\n';
      // Simpler: append after last table row
      const lastRow = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.startsWith('|') && l.match(/^\|\s*\d+\s*\|/)).pop();
      if (lastRow) {
        contentMd = lines.slice(0, lastRow.i + 1).join('\n') + '\n' + newLine + '\n' + lines.slice(lastRow.i + 1).join('\n');
      }
    }
    await ghPut('CONTENT.md', contentMd, 'blog: update CONTENT.md [auto-pipeline]', contentFile.sha);
  }

  return { slug, title, url: `https://ortopednn.ru/blog/${slug}/` };
}

/* --- AI Helpers --- */

async function callAI(prompt, opts = {}) {
  const key = process.env.OPENMODEL_AI_KEY
  if (!key) throw new Error('OPENMODEL_AI_KEY not set')
  const resp = await fetch('https://api.openmodel.ai/v1/messages', {
    method: 'POST', signal: AbortSignal.timeout(300000),
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'deepseek-v4-flash', max_tokens: opts.maxTokens ?? 4096,
      system: opts.system || 'Ответь только JSON. {"title":"...","description":"...","body":"<p>...</p>"}',
      messages: [{ role: 'user', content: prompt }],
      temperature: opts.temperature ?? 0.5
    })
  })
  if (!resp.ok) console.error('AI API non-200:', resp.status)
  const text = await resp.text()
  if (!text.trim()) throw new Error('Empty AI response')
  try {
    if (text.trim().startsWith('{')) {
      const data = JSON.parse(text)
      return data.content?.find(c => c.type === 'text')?.text || text
    }
  } catch {}
  return text
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

function tryParseJSON(raw) {
  const cleaned = repairJSON(raw);
  if (!cleaned) return null;
  try { const r = JSON.parse(cleaned); if (r && typeof r.title === 'string') return r; } catch {}
  try {
    const s = cleaned.replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    const r = JSON.parse(s); if (r && typeof r.title === 'string') return r;
  } catch {}
  return null;
}

function parseJSON(raw) {
  const parsed = tryParseJSON(raw);
  if (parsed) return parsed;
  const mt = raw.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const md = raw.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (mt && md) {
    const bodyMatch = raw.match(/("body"|'body')\s*:\s*["']([\s\S]*?)["']\s*[,\}]/);
    if (bodyMatch) return { title: mt[1], description: md[1], body: bodyMatch[2] };
  }
  return null;
}

/* --- REVIEW AGENT --- */

const DENTAL_TERMS = RULES.dental_terms;

function extractCitations(text) {
  const citations = [];
  const patterns = [
    /(?:согласно|по данным|исследование|результаты|показал(?:о|и)?|сообщается)\s[^.]{0,30}?(Journal\s+of\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+\(\d{4}\))?)/gi,
    /(Journal\s+of\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*[\(,]\s*(\d{4})/gi,
    /([A-Z][a-z]+(?:\s+(?:of|and|in|for)\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\(\d{4}\)/g
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const journal = m[1] || m[0];
      const year = m[2] || '';
      citations.push({ journal: journal.trim(), year: year.trim(), match: m[0].substring(0, 80) });
    }
  }
  return citations;
}

function verifyCitations(text) {
  const citations = extractCitations(text);
  if (citations.length === 0) return { pass: true, citations: [], suspicious: [] };
  const suspicious = citations.filter(c => {
    const j = c.journal.toLowerCase();
    return !RULES.known_journals.some(k => j.includes(k) || k.includes(j));
  });
  return { pass: suspicious.length === 0, citations, suspicious };
}

function reviewArticle(article, topic) {
  const body = (article.body || '').toLowerCase();
  const text = body.replace(/<[^>]+>/g, '');
  const scores = {};

  scores.dentalTermCount = DENTAL_TERMS.reduce((c, t) => c + (text.includes(t) ? 1 : 0), 0);
  scores.relevance = scores.dentalTermCount >= 4 ? 'pass' : 'weak';

  scores.length = text.length;
  scores.lengthPass = text.length >= 1200;

  scores.h2Count = (body.match(/<h2/g) || []).length;
  scores.h2Pass = scores.h2Count >= 2;

  scores.hasList = /<[uo]l>/.test(body);

  scores.hasFAQ = /faq|вопрос|част/i.test(body);

  const tells = checkAiTells(article.body);
  scores.aiTells = tells;
  scores.aiPass = tells.length === 0;

  const citationResult = verifyCitations(article.body);
  scores.citations = citationResult;
  scores.citationPass = citationResult.pass;

  /* scorers */
  const aiScoreResult = score_ai(article.body);
  scores.aiScore = aiScoreResult.score;
  scores.seoScoreResult = score_seo(article.body, topic);

  const comp = composite_score(article.body, topic);
  scores.composite = comp;
  scores.auditPass = comp.audit.pass;

  const failCount = [!scores.lengthPass, !scores.h2Pass, !scores.hasList, !scores.hasFAQ, scores.relevance === 'weak'].filter(Boolean).length;
  scores.pass = (failCount <= 1) && scores.aiPass && scores.citationPass && scores.auditPass;

  return scores;
}

async function reviewAgent(article, topic, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const scores = reviewArticle(article, topic);

    if (scores.pass) return { article, scores, retries: attempt - 1 };

    const fixes = [];
    if (scores.relevance === 'weak') fixes.push('больше терминов по стоматологии (коронки, протезы, импланты)');
    if (!scores.lengthPass) fixes.push('увеличить объём до 2000+ символов');
    if (!scores.h2Pass) fixes.push('добавить 2-3 подзаголовка h2');
    if (!scores.hasList) fixes.push('добавить список ul/ol с перечислением');
    if (!scores.hasFAQ) fixes.push('добавить блок FAQ (3 вопроса с ответами)');
    if (!scores.aiPass) {
      const tags = [...new Set(scores.aiTells.map(t => t.tag))];
      fixes.push(`убрать AI-маркеры: ${tags.join(', ')}. Пиши естественным русским языком, без шаблонных фраз и штампов`);
    }
    if (!scores.citationPass && scores.citations.suspicious.length > 0) {
      const fake = scores.citations.suspicious.map(c => c.match.substring(0, 50)).join(', ');
      fixes.push(`удали вымышленные ссылки на журналы: ${fake}. Замени на общие утверждения без указания конкретных журналов и годов. Никогда не выдумывай ссылки на научные журналы`);
    }

    const prompt = `Перепиши статью для блога стоматолога-ортопеда. Исправь только указанные проблемы, не меняй остальное.

Что исправить: ${fixes.join('; ')}

Голос: короткие предложения, простые слова, конкретика (цифры, сроки, материалы). Без штампов, без обобщений.

Оригинал:
${article.body}

Ответь ТОЛЬКО JSON:
{"title":"${article.title}","description":"${article.description}","body":"полный HTML"}`;

    const raw = await callAI(prompt, { temperature: 0.3 });
    const improved = parseJSON(raw);
    if (improved?.title && improved?.description && improved?.body) {
      improved.body = humanize(improved.body);
      article = improved;
    }
  }

  const finalScores = reviewArticle(article, topic);
  return { article, scores: finalScores, retries: maxRetries - 1, warning: !finalScores.pass };
}

async function factCheckAgent(article) {
  const prompt = `Проверь факты в статье стоматолога-ортопеда. Найди только то, что явно неверно или выдумано (ложные названия материалов, несуществующие методы, сроки, которые не соответствуют реальности). Игнорируй общие утверждения — лови только конкретные фактологические ошибки.

Статья:
${article.body}

Ответь ТОЛЬКО JSON со списком проблем:
{"issues":[{"claim":"цитата с ошибкой","fix":"как исправить"}]}
Если ошибок нет: {"issues":[]}`;

  const raw = await callAI(prompt, { temperature: 0.2 });
  try {
    const result = JSON.parse(raw);
    return result.issues || [];
  } catch {
    return [];
  }
}

async function adversarialReviewAgent(article) {
  const prompt = `Ты скептически настроенный стоматолог. Найди в статье слабые места: преувеличения, голословные утверждения без конкретики, неподтверждённые обещания, размытые формулировки. Для каждого укажи конкретную цитату и что с ней не так.

Статья:
${article.body}

Ответь ТОЛЬКО JSON:
{"issues":[{"quote":"цитата","problem":"что не так","fix":"как исправить"}]}
Если всё нормально: {"issues":[]}`;

  const raw = await callAI(prompt, { temperature: 0.3 });
  try {
    const result = JSON.parse(raw);
    return result.issues || [];
  } catch {
    return [];
  }
}

/* --- MAIN PIPELINE --- */

export async function runPipelineManual(topic) {
  const result = { stage: '', topic, startedAt: new Date().toISOString() };
  try {
    result.stage = 'check';
    const format = pass_plan(topic);
    result.format = format.key;

    result.stage = 'dedup';
    const dupCheck = await pass_fetch(topic);
    if (dupCheck.exists) return { ...result, error: `duplicate: ${dupCheck.slug}`, stage: 'dedup' };
    result.dedup = dupCheck;

    result.stage = 'research';
    const research = await researchAgent(topic);
    result.research = research;

    result.stage = 'write';
    const article = await writerAgent(topic, research);
    if (article?.body) article.body = humanize(article.body);
    result.article = article;

    result.stage = 'seo';
    const seo = seoAgent(article);
    result.seo = seo;

    result.stage = 'review';
    const reviewed = await reviewAgent(seo, topic);
    result.review = reviewed.scores;
    if (reviewed.warning) result.review.warning = 'quality concerns after max retries';

    result.stage = 'factcheck';
    const factIssues = await factCheckAgent(reviewed.article || seo);
    result.factCheck = factIssues;
    if (factIssues.length > 0) result.review.warning = (result.review.warning || '') + '; fact-check: ' + factIssues.length + ' issues';

    result.stage = 'adversarial';
    const advIssues = await adversarialReviewAgent(reviewed.article || seo);
    result.adversarial = advIssues;
    if (advIssues.length > 0) result.review.warning = (result.review.warning || '') + '; adversarial: ' + advIssues.length + ' issues';

    result.stage = 'draft';
    const draftInfo = await draftAgent({ ...seo, ...reviewed.article });
    result.draft = draftInfo;

    try {
      const stomUrl = await stomatologPublisherAgent({ ...seo, ...reviewed.article });
      result.stomatologUrl = stomUrl.url;
    } catch (stomErr) {
      console.error('Stomatolog stage (non-fatal):', stomErr.message);
      result.stomatologWarning = stomErr.message;
    }

    result.stage = 'done';
    result.completedAt = new Date().toISOString();
    return result;
  } catch (e) {
    return { ...result, error: `${result.stage} agent: ${e.message}`, stage: 'error' };
  }
}

export async function pickAndRun() {
  const task = await dequeue();
  if (!task) return { info: 'No pending topics in queue' };
  const result = await runPipelineManual(task.topic);
  const state = await loadState();
  state.lastRun = new Date().toISOString();
  state.generatedToday = (state.generatedToday || 0) + (result.error ? 0 : 1);
  if (result.error) state.errors = (state.errors || []).concat(result.error).slice(-20);
  await saveState(state);
  return result;
}

/* --- HORIZON WATCHER --- */

async function parseHorizonSummary(filePath) {
  const text = readFileSync(filePath, 'utf-8');
  const items = [];
  const blocks = text.split(/\n---\n/);

  for (const block of blocks) {
    const titleMatch = block.match(/^## \[(.+?)\]\((.+?)\)/m);
    if (!titleMatch) continue;

    const scoreMatch = block.match(/⭐️\s*([\d.]+)\/10/);
    const backgroundMatch = block.match(/\*\*Background\*\*:\s*(.+?)(?:\n\n|\*\*)/s);
    const communityMatch = block.match(/Discussion\*\*:\s*(.+?)(?:\n\n|\*\*)/s);
    const tagsMatch = block.match(/\*\*Tags?\*\*:\s*(.+?)(?:\n|$)/);
    const sourceMatch = block.match(/^(rss|reddit|hackernews|telegram|github|twitter)\s*·/mi);

    // Summary: text between title line + blank and the next blank (source line)
    const bodyAfterTitle = block.split(/^## \[.+?\]\(.+?\)\n\n/m)?.[1] || '';
    const summary = bodyAfterTitle.split(/\n\n/)[0]?.trim() || '';

    items.push({
      title: titleMatch[1],
      url: titleMatch[2],
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
      summary: summary.substring(0, 500),
      background: backgroundMatch ? backgroundMatch[1].trim() : '',
      community: communityMatch ? communityMatch[1].trim() : '',
      tags: tagsMatch ? tagsMatch[1].split(',').map(t => t.replace(/[`#]/g, '').trim()) : [],
      source: sourceMatch ? sourceMatch[1].toLowerCase() : 'unknown',
    });
  }
  return items;
}

export async function runHorizonPipeline() {
  const summariesDir = join(DATA_DIR, '../horizon-data/summaries');
  const files = readdirSync(summariesDir).filter(f => f.endsWith('.md')).sort();
  if (files.length === 0) return { info: 'No Horizon summaries found' };

  const latest = files[files.length - 1];
  const items = await parseHorizonSummary(join(summariesDir, latest));
  const highScored = items.filter(i => i.score >= 7.0).sort((a, b) => b.score - a.score);
  const results = [];

  for (const item of highScored) {
    try {
      const article = await horizonWriterAgent(item);
      const seo = seoAgent(article);
      const draft = await draftAgent(seo);
      results.push({ slug: draft.slug, title: article.title, score: item.score, status: 'draft' });
    } catch (e) {
      results.push({ title: item.title, score: item.score, status: 'error', error: e.message });
    }
  }

  return { file: latest, totalItems: items.length, generated: results.length, results };
}

export { ghPut, ghFetch, checkAiTells, humanize, score_ai, score_seo, composite_score, pass_plan, pass_fetch, horizonWriterAgent };

export async function addTopic(topic) {
  const existing = (await listQueue()).find(t => t.topic === topic);
  if (existing) return { info: 'Topic already in queue', topic };
  const dupCheck = await pass_fetch(topic);
  if (dupCheck.exists) return { info: `duplicate: ${dupCheck.slug}`, topic, duplicate: dupCheck.slug };
  return enqueue(topic);
}

export async function listTopics() {
  return listQueue();
}

export async function listState() {
  return loadState();
}

export async function clearErrors() {
  const state = await loadState();
  state.errors = [];
  await saveState(state);
  return { ok: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const topic = process.argv[2] || 'протезирование зубов показания';
  addTopic(topic).then(() => pickAndRun()).then(r => {
    if (r.error) console.error('Pipeline error:', r.error);
    else if (r.published) console.log(`Published: ${r.published.url}`);
    else console.log('Result:', JSON.stringify(r, null, 2));
  }).catch(e => console.error('Fatal:', e));
}
