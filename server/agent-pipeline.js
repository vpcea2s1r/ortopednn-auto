import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
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
    const raw = await callAI(prompt);
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

/* --- HUMANIZER: Russian AI pattern fixes --- */

const RU_AI_PHRASES = [
  'стоит отметить', 'следует отметить', 'важно подчеркнуть', 'необходимо подчеркнуть',
  'при этом важно', 'в заключение хочется', 'подводя итог', 'резюмируя вышесказанное',
  'таким образом мы видим', 'таким образом,', 'однако стоит отметить',
  'когда речь заходит о', 'в современном мире', 'в современной стоматологии',
  'играет важную роль', 'играет ключевую роль', 'играет решающую роль',
  'играет огромную роль', 'нельзя забывать', 'тем не менее',
  'эксперты считают', 'по мнению специалистов', 'исследователи отмечают',
  'ряд аналитиков', 'по мнению экспертов',
  'открывает возможности', 'позволяет не только',
  'в конечном счёте', 'решая задачу',
  'является свидетельством', 'знаменует собой', 'подчёркивает важность',
  'закладывает фундамент', 'поворотный момент',
  'будущее выглядит многообещающим',
];

const RU_AI_WORDS = [
  'безусловно', 'инновационный', 'инновационная', 'инновационное', 'инновационные',
  'комплексный', 'комплексная', 'комплексное', 'комплексные', 'комплексно',
  'многогранный', 'многогранная',
  'является', 'представляет собой', 'выступает в качестве',
  'уникальный', 'уникальная', 'уникальное', 'уникальные',
  'революционный', 'революционная', 'революционное',
  'передовой', 'передовая', 'передовые',
];

const RU_AI_PATTERNS = [
  { re: /не\s+(?:только\s+)?[а-яё][а-яё\s,']{2,60}?\s*,\s*но\s+и\s+[а-яё]/i, tag: 'ru_not_only_but' },
  { re: /,\s+(?:обеспечивая|позволяя|создавая|способствуя|демонстрируя|отражая|символизируя|подчёркивая|гарантируя|предотвращая|улучшая|снижая|повышая)\s+/i, tag: 'ru_participle' },
  { re: /возможно,\s+в\s+некоторых\s+случаях/i, tag: 'ru_cascade_soften' },
  { re: /в\s+целом,\s+по\s+сути/i, tag: 'ru_puffery' },
  { re: /(?:от\s+[а-яё]{3,}\s+до\s+[а-яё]{3,}\s+и\s+от\s+[а-яё]{3,}\s+до\s+[а-яё]{3,})/i, tag: 'ru_merism' },
];

function humanize(text) {
  if (!text) return text;
  let result = text;

  const removePhrases = [
    'стоит отметить, что ', 'стоит отметить, что', 'следует отметить, что ', 'следует отметить, что',
    'важно подчеркнуть, что ', 'важно подчеркнуть, что', 'необходимо подчеркнуть, что ',
    'при этом важно понимать, что ', 'при этом важно отметить, что ',
    'в заключение хочется отметить, что ', 'в заключение стоит отметить, что ',
    'подводя итог, можно сказать, что ', 'подводя итог, ',
    'резюмируя вышесказанное, ', 'таким образом, мы видим, что ', 'таким образом, ',
    'однако стоит отметить, что ', 'однако стоит отметить,',
    'когда речь заходит о ', 'в современном мире ',
    'нельзя забывать, что ', 'тем не менее, ',
    'эксперты считают, что ', 'по мнению специалистов, ',
    'исследователи отмечают, что ', 'по мнению экспертов, ',
  ];
  for (const phrase of removePhrases) {
    const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, '');
  }

  const pufferyWords = ['инновационный', 'инновационная', 'инновационное', 'инновационные',
    'революционный', 'революционная', 'революционное',
    'передовой', 'передовая', 'передовые',
    'уникальный', 'уникальная', 'уникальное', 'уникальные'];
  for (const word of pufferyWords) {
    const re = new RegExp('\\b' + word + '\\b', 'gi');
    result = result.replace(re, '');
  }

  result = result.replace(/представляет собой\s+/gi, '— это ');
  result = result.replace(/выступает в качестве\s+/gi, '');
  result = result.replace(/\bявляется\s+/gi, '');
  result = result.replace(/безусловно,\s+/gi, '');
  result = result.replace(/крайне важно,\s+/gi, '');
  result = result.replace(/кроме того,\s+/gi, '');
  result = result.replace(/более того,\s+/gi, '');
  result = result.replace(/в целом,\s+/gi, '');
  result = result.replace(/по сути,\s+/gi, '');

  result = result.replace(/играет (?:важную|ключевую|решающую|огромную) роль[.,;]?\s*/gi, '');

  const emDashCount = (result.match(/—/g) || []).length;
  const pCount = (result.match(/<p>/g) || []).length;
  if (emDashCount > pCount * 1.5) {
    const dashes = result.match(/—/g);
    if (dashes && dashes.length > 2) {
      let count = 0;
      result = result.replace(/—/g, () => { count++; return count % 2 === 0 ? ',' : '—'; });
    }
  }

  result = result.replace(/,{2,}/g, ',');
  result = result.replace(/\s{2,}/g, ' ');
  result = result.replace(/>\s+</g, '><');

  return result;
}

/* ai-tells-validator: detect AI-sounding patterns in text */

const AI_BANNED_WORDS = [
  'delve', 'delving', 'tapestry', 'meticulous', 'meticulously', 'pivotal',
  'robust', 'underscore', 'underscores', 'underscoring', 'showcase', 'showcases', 'showcasing',
  'testament', 'intricate', 'intricacies', 'enduring', 'fostering', 'foster', 'fostered',
  'garner', 'bolster', 'bolstered', 'interplay',
  'leverage', 'leverages', 'leveraging', 'streamline', 'streamlines', 'streamlining',
  'transformative', 'transformational', 'groundbreaking', 'cutting-edge',
  'seamless', 'seamlessly', 'elevate', 'elevates', 'elevating',
  'unlock', 'unlocks', 'unlocking', 'empower', 'empowers', 'empowering',
  'revolutionize', 'revolutionizes', 'revolutionary', 'paradigm', 'synergy', 'synergies',
  'holistic', 'holistically'
];

const AI_BANNED_PHRASES = [
  'i hope this email finds you well', 'i hope this finds you well',
  'just checking in', 'circling back', 'touching base',
  'reaching out to', 'wanted to reach out',
  'in conclusion', 'in summary', 'to summarize',
  'it is important to note', "it's important to note",
  'it is worth noting', 'needless to say',
  'at the end of the day',
  "in today's fast-paced", "in today's digital age",
  'plays a vital role', 'plays a crucial role', 'plays a key role',
  'navigate the complexities', 'navigating the complexities',
  'when it comes to', 'at its core',
  'a powerful tool', 'best-in-class', 'world-class',
  'next-generation', 'mission-critical', 'value proposition',
  'thought leader', 'thought leadership',
  'best practices', 'enhance your', 'optimize your',
  'unlock the power', 'harness the power',
  'let me know your thoughts', 'looking forward to hearing',
  'forward to hearing from you'
];

const AI_PATTERNS = [
  { re: /\bnot\s+(?:just\s+|merely\s+|simply\s+|only\s+)?[a-z][a-z\s,'-]{2,60}?,?\s+but\s+(?:also\s+|rather\s+)?[a-z]/i, tag: 'not_just_but' },
  { re: /,\s+(?:reinforcing|ensuring|fostering|enabling|driving|empowering|enhancing|cultivating|underscoring|highlighting|contributing|paving|setting)\s+/i, tag: 'participle_tail' },
  { re: /\bwhether\s+you\s*['']?\s*re\b/i, tag: 'whether_youre' },
  { re: /\bexcited\s+to\b/i, tag: 'excited_to' },
];

function checkAiTells(body) {
  if (!body) return [];
  const text = body.replace(/<[^>]+>/g, '');
  const lower = text.toLowerCase();
  const tells = [];

  for (const word of AI_BANNED_WORDS) {
    const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\b', 'i');
    if (re.test(text)) {
      tells.push({ tag: 'ai_word:' + word });
    }
  }

  for (const phrase of AI_BANNED_PHRASES) {
    if (lower.includes(phrase)) {
      tells.push({ tag: 'ai_phrase:' + phrase });
    }
  }

  for (const p of AI_PATTERNS) {
    if (p.re.test(text)) {
      tells.push({ tag: 'ai_pattern:' + p.tag });
    }
  }

  /* Russian AI patterns */
  for (const phrase of RU_AI_PHRASES) {
    if (lower.includes(phrase)) {
      tells.push({ tag: 'ru_phrase:' + phrase.substring(0, 30) });
    }
  }

  for (const word of RU_AI_WORDS) {
    const re = new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&') + '\\b', 'i');
    if (re.test(text)) tells.push({ tag: 'ru_word:' + word.substring(0, 20) });
  }

  for (const p of RU_AI_PATTERNS) {
    if (p.re.test(text)) tells.push({ tag: 'ru_pattern:' + p.tag });
  }

  const emDashes = (text.match(/—/g) || []).length;
  if (emDashes > 1) tells.push({ tag: 'ai_em_dash_overuse', detail: `${emDashes} em-dashes` });

  if (/[“”‘’]/.test(text)) tells.push({ tag: 'ai_smart_quotes' });

  return tells;
}

const KNOWN_DENTAL_JOURNALS = [
  'journal of dental research', 'journal of dentistry', 'journal of prosthetic dentistry',
  'journal of oral rehabilitation', 'clinical oral implants research', 'clinical oral investigations',
  'international journal of oral and maxillofacial implants', 'international journal of prosthodontics',
  'dental materials', 'journal of prosthodontics', 'european journal of oral implantology',
  'journal of periodontology', 'journal of clinical periodontology', 'journal of oral science',
  'journal of prosthodontic research', 'journal of applied oral science', 'operative dentistry',
  'journal of endodontics', 'journal of esthetic and restorative dentistry',
  'international dental journal', 'british dental journal', 'community dentistry and oral epidemiology',
  'caries research', 'oral diseases', 'gerodontology', 'journal of oral and maxillofacial surgery',
  'international journal of periodontics and restorative dentistry', 'implant dentistry',
  'journal of cranio-maxillofacial surgery', 'head and face medicine', 'bmc oral health'
];

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
    return !KNOWN_DENTAL_JOURNALS.some(k => j.includes(k) || k.includes(j));
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

  const failCount = [!scores.lengthPass, !scores.h2Pass, !scores.hasList, !scores.hasFAQ, scores.relevance === 'weak'].filter(Boolean).length;
  scores.pass = failCount <= 1 && scores.aiPass && scores.citationPass;

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

    const prompt = `Перепиши эту статью для блога стоматолога-ортопеда. Исправь: ${fixes.join('; ')}.

Оригинал:
${article.body}

Ответь ТОЛЬКО JSON:
{"title":"${article.title}","description":"${article.description}","body":"полный HTML"}`;

    const raw = await callAI(prompt);
    const improved = parseJSON(raw);
    if (improved?.title && improved?.description && improved?.body) {
      improved.body = humanize(improved.body);
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
    if (article?.body) article.body = humanize(article.body);
    result.article = article;

    result.stage = 'seo';
    const seo = seoAgent(article);
    result.seo = seo;

    result.stage = 'review';
    const reviewed = await reviewAgent(seo, topic);
    result.review = reviewed.scores;
    if (reviewed.warning) result.review.warning = 'quality concerns after max retries';

    result.stage = 'draft';
    const draftInfo = await draftAgent({ ...seo, ...reviewed.article });
    result.draft = draftInfo;

    result.stage = 'stomatolog';
    const stomUrl = await stomatologPublisherAgent({ ...seo, ...reviewed.article });
    result.stomatologUrl = stomUrl.url;

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
    pending.status = 'on_stomatolog';
    pending.slug = result.draft?.slug;
    pending.url = result.stomatologUrl;
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

export { ghPut, ghFetch, checkAiTells, humanize, horizonWriterAgent };

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
