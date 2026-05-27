import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const TOPICS_FILE = join(DATA_DIR, 'topics.json');
const STATE_FILE = join(DATA_DIR, 'pipeline-state.json');
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = 'vpcea2s1r';
const GH_REPO = 'ortopednn-auto';
const GH_BRANCH = 'master';

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

function loadTopics() {
  if (!existsSync(TOPICS_FILE)) return [];
  return JSON.parse(readFileSync(TOPICS_FILE, 'utf-8'));
}

function saveTopics(topics) {
  mkdirSync(join(DATA_DIR), { recursive: true });
  writeFileSync(TOPICS_FILE, JSON.stringify(topics, null, 2), 'utf-8');
}

/* --- Pipeline State --- */

function loadState() {
  if (!existsSync(STATE_FILE)) return { lastRun: null, generatedToday: 0, errors: [] };
  return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

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

  const prompt = `Напиши экспертную статью для блога стоматолога-ортопеда на тему: "${topic}"

${pubmedContext ? 'Научный контекст из PubMed (используй для аргументации):\n' + pubmedContext : ''}

Ключевые параметры:
- 2000-3000 символов
- Первый абзац — ответ на главный вопрос пациента (без общих фраз)
- Каждый h2 — конкретный аспект темы
- Раздел "Сравнение" с таблицей (методы/материалы/сроки)
- FAQ: 3-5 вопросов с короткими предметными ответами
- Стиль: естественный русский, как говорит опытный врач коллеге. Без канцелярита, без "следует отметить", "необходимо подчеркнуть"
- Без h1, без "запишитесь к нам", без восклицательных знаков
- HTML: только p, h2, ul/ol, table (с thead/tbody), strong

Ответь ТОЛЬКО JSON:
{"title":"","description":"150-160 символов","body":"полный HTML"}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await callAI(prompt);
    const json = parseJSON(raw);
    if (json?.title && json?.description && json?.body) return json;
  }
  throw new Error('Writer agent: failed to generate after 3 attempts');
}

/* --- SEO AGENT --- */

function seoAgent(article) {
  const slug = makeSlug(article.title);
  const date = new Date().toISOString().split('T')[0];
  const bodyClean = article.body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
  return { slug, date, title: article.title, description: article.description.substring(0, 160), body: bodyClean };
}

/* --- DRAFT AGENT (save locally instead of publishing) --- */

async function draftAgent(article) {
  const { slug, title, description, date, body } = article;
  const astro = astroTemplate({ slug, title, description, date, body });
  const draftsDir = join(DATA_DIR, 'drafts');
  mkdirSync(draftsDir, { recursive: true });

  writeFileSync(join(draftsDir, `${slug}.astro`), astro, 'utf-8');

  const newEntry = `  { slug: '${slug}', title: '${title.replace(/'/g, "\\'")}', date: '${date}', desc: '${description.replace(/'/g, "\\'")}' },`;
  writeFileSync(join(draftsDir, `${slug}.meta.json`), JSON.stringify({
    slug, title, description, date, status: 'draft',
    repo: 'ortopednn-auto',
    astroEntry: newEntry
  }, null, 2), 'utf-8');

  return { slug, title, url: `https://ortopednn.ru/blog/${slug}/` };
}

/* --- PUBLISHER AGENT --- */

function astroTemplate({ slug, title, description, date, body }) {
  const e = (s) => s.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Navbar from '../../components/Navbar.astro';
import doctor from '../../../data/doctor.json';
const slug = '${slug}';
const pageUrl = \`https://ortopednn.ru/blog/\${slug}/\`;
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
<BaseLayout title="${e(title)}" description="${e(description)}" breadcrumbTitle="${e(title)}" doctor={doctor}>
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

async function callAI(prompt) {
  const system = 'Ответь только JSON. {"title":"...","description":"...","body":"<p>...</p>"}';
  const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(300000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ortopednn-pipeline/1.0' },
    body: JSON.stringify({
      messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
      model: 'deepseek-v4-flash-free'
    })
  });
  const text = await resp.text();
  if (!text.trim()) throw new Error('Empty AI response');
  if (text.trim().startsWith('{')) {
    const data = JSON.parse(text);
    return data.choices?.[0]?.message?.content || text;
  }
  return text;
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

const DENTAL_TERMS = ['зуб', 'коронк', 'протез', 'имплант', 'мост', 'винир', 'керамик', 'циркони', 'металлокерамик', 'стоматолог', 'ортопед', 'десн', 'челюст', 'прикус', 'пломб', 'абатмент', 'культ', 'слепок', 'бюгель', 'нейлон', 'акрил', 'CAD/CAM', '3D', 'окклюзи', 'периодонт', 'пародонт', 'гингивит', 'пульпит', 'эмал', 'дентин', 'цемент', 'фиксаци', 'адгезив'];

function reviewArticle(article, topic) {
  const body = (article.body || '').toLowerCase();
  const text = body.replace(/<[^>]+>/g, '');
  const scores = {};

  // 1. Relevance: count dental terms
  scores.dentalTermCount = DENTAL_TERMS.reduce((c, t) => c + (text.includes(t) ? 1 : 0), 0);
  scores.relevance = scores.dentalTermCount >= 4 ? 'pass' : 'weak';

  // 2. Length
  scores.length = text.length;
  scores.lengthPass = text.length >= 1200;

  // 3. Structure: count h2 headings
  scores.h2Count = (body.match(/<h2/g) || []).length;
  scores.h2Pass = scores.h2Count >= 2;

  // 4. Has list
  scores.hasList = /<[uo]l>/.test(body);

  // 5. Has FAQ
  scores.hasFAQ = /faq|вопрос|част/i.test(body);

  // Overall
  const failCount = [!scores.lengthPass, !scores.h2Pass, !scores.hasList, !scores.hasFAQ, scores.relevance === 'weak'].filter(Boolean).length;
  scores.pass = failCount <= 1;

  return scores;
}

async function reviewAgent(article, topic, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const scores = reviewArticle(article, topic);

    if (scores.pass) return { article, scores, retries: attempt - 1 };

    // Improve prompt based on what's missing
    const fixes = [];
    if (scores.relevance === 'weak') fixes.push('больше терминов по стоматологии (коронки, протезы, импланты)');
    if (!scores.lengthPass) fixes.push('увеличить объём до 2000+ символов');
    if (!scores.h2Pass) fixes.push('добавить 2-3 подзаголовка h2');
    if (!scores.hasList) fixes.push('добавить список ul/ol с перечислением');
    if (!scores.hasFAQ) fixes.push('добавить блок FAQ (3 вопроса с ответами)');

    const prompt = `Перепиши эту статью для блога стоматолога-ортопеда. Исправь: ${fixes.join('; ')}.

Оригинал:
${article.body}

Ответь ТОЛЬКО JSON:
{"title":"${article.title}","description":"${article.description}","body":"полный HTML"}`;

    const raw = await callAI(prompt);
    const improved = parseJSON(raw);
    if (improved?.title && improved?.description && improved?.body) {
      article = improved;
    }
  }

  const finalScores = reviewArticle(article, topic);
  return { article, scores: finalScores, retries: maxRetries - 1, warning: !finalScores.pass };
}

/* --- MAIN PIPELINE --- */

export async function runPipelineManual(topic) {
  const result = { stage: '', topic, startedAt: new Date().toISOString() };
  try {
    result.stage = 'research';
    const research = await researchAgent(topic);
    result.research = research;

    result.stage = 'write';
    const article = await writerAgent(topic, research);
    result.article = article;

    result.stage = 'seo';
    const seo = seoAgent(article);
    result.seo = seo;

    result.stage = 'review';
    const reviewed = await reviewAgent(seo, topic);
    result.review = reviewed.scores;
    if (reviewed.warning) result.review.warning = 'quality concerns after max retries';

    result.stage = 'draft';
    const draftInfo = await draftAgent(reviewed.article);
    result.draft = draftInfo;

    result.stage = 'done';
    result.completedAt = new Date().toISOString();
    return result;
  } catch (e) {
    return { ...result, error: `${result.stage} agent: ${e.message}`, stage: 'error' };
  }
}

export async function pickAndRun() {
  const topics = loadTopics();
  const pending = topics.find(t => t.status === 'pending');
  if (!pending) return { info: 'No pending topics in queue' };
  pending.status = 'running';
  saveTopics(topics);
  const result = await runPipelineManual(pending.topic);
  if (result.error) {
    pending.status = 'error';
    pending.error = result.error;
  } else {
    pending.status = 'awaiting_review';
    pending.slug = result.draft?.slug;
    pending.completedAt = result.completedAt;
  }
  const state = loadState();
  state.lastRun = new Date().toISOString();
  state.generatedToday = (state.generatedToday || 0) + (result.error ? 0 : 1);
  if (result.error) state.errors = (state.errors || []).concat(result.error).slice(-20);
  saveState(state);
  saveTopics(topics);
  return result;
}

export { ghPut, ghFetch };

export async function addTopic(topic) {
  const topics = loadTopics();
  const existing = topics.find(t => t.topic === topic);
  if (existing) return { info: 'Topic already in queue', topic };
  topics.push({ topic, added: new Date().toISOString(), status: 'pending' });
  saveTopics(topics);
  return { ok: true, topic };
}

export async function listTopics() {
  return loadTopics();
}

export async function listState() {
  return loadState();
}

export async function clearErrors() {
  const state = loadState();
  state.errors = [];
  saveState(state);
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
