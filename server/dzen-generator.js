import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { researchAgent, humanize, checkAiTells, verifyCitations } from './agent-pipeline.js';

const __dirname = fileURLToPath(import.meta.url);
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const DRAFTS_DIR = join(DATA_DIR, 'drafts');
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

/* --- AI --- */

async function callAI(prompt) {
  const system = 'Ты — экспертный стоматолог-ортопед с 30-летним стажем. Пиши как для Дзена: живой язык, конкретика, примеры из практики. Ответь ТОЛЬКО JSON.';
  const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(300000),
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'ortopednn-dzen/1.0' },
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

function parseJSON(raw) {
  const cleaned = repairJSON(raw);
  if (!cleaned) return null;
  try { const r = JSON.parse(cleaned); if (r && typeof r.title === 'string') return r; } catch {}
  try {
    const s = cleaned.replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    const r = JSON.parse(s); if (r && typeof r.title === 'string') return r;
  } catch {}
  return null;
}

/* --- Dzen Article Generator --- */

/**
 * Generate a Dzen-optimized article (4-5k chars).
 * Format: hook title, pain intro, 3-5 H2s with lists, 5-8 images, question conclusion.
 * Structure: H2/H3 every 200-300 words, short paragraphs (2-3 sentences).
 */
export async function generateDzenArticle(topic, research) {
  const pubmedContext = research?.pubmedResults?.length
    ? research.pubmedResults.map(r => `- ${r.title} (${r.source}, PMID ${r.id})`).join('\n')
    : '';

  const prompt = `Напиши статью для Дзена (вертикаль «Здоровье») на тему: "${topic}"

ФОРМАТ ДЗЕН (строго соблюдай):
- Объём: 4000-5000 символов (без пробелов)
- Заголовок: 5-7 слов, интрига, конкретика. Без кликбейта, но с хуком.
- Вступление (первые 2-3 предложения): боль пациента или ситуация. Не общие фразы.
- 3-5 разделов H2, каждый 200-300 слов
- Абзацы: 2-3 предложения. Короткие.
- Списки (ul/ol) в каждом H2
- Конкретика: цифры, сроки, цены (без конкретных сумм — «от ... до ...»), названия материалов
- Заключение: вопрос к читателю («А как вы ...?»)
- HTML: только p, h2, h3, ul/ol, li, strong, em, blockquote
- Без h1, без «запишитесь к врачу», без восклицательных знаков
- Стиль: как опытный врач объясняет пациенту. Простые слова. Живой язык.
${pubmedContext ? '\nНаучный контекст (используй для аргументации):\n' + pubmedContext : ''}

Ответь ТОЛЬКО JSON:
{"title":"заголовок для Дзена (интрига, 5-7 слов)","description":"мета-описание 150-160 символов","body":"полный HTML статьи","tags":["тег1","тег2","тег3"]}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callAI(prompt);
      const json = parseJSON(raw);
      if (json?.title && json?.body) {
        // Validate length
        const textLen = json.body.replace(/<[^>]+>/g, '').replace(/\s/g, '').length;
        if (textLen < 3500) {
          console.log(`Dzen attempt ${attempt}: too short (${textLen} chars), retrying...`);
          continue;
        }
        // Humanize
        json.body = humanize(json.body);
        // Check AI tells
        const tells = checkAiTells(json.body);
        if (tells.length > 0) {
          console.log(`Dzen attempt ${attempt}: ${tells.length} AI tells found, retrying...`);
          continue;
        }
        // Check citations
        const citationCheck = verifyCitations(json.body);
        if (!citationCheck.pass) {
          console.log(`Dzen attempt ${attempt}: suspicious citations, retrying...`);
          continue;
        }
        return json;
      }
    } catch (e) {
      console.error(`Dzen attempt ${attempt} error:`, e.message);
    }
  }
  throw new Error('Dzen generator: failed after 3 attempts');
}

/* --- Draft Agent (save + push) --- */

export async function saveDzenDraft(article, topic) {
  const slug = makeSlug(article.title);
  const date = new Date().toISOString().split('T')[0];
  const body = article.body;

  // Save locally
  mkdirSync(DRAFTS_DIR, { recursive: true });

  const draftJson = {
    slug,
    title: article.title,
    date,
    description: article.description || '',
    body,
    category: article.tags?.[0] || 'uncategorized',
    tags: article.tags || [],
    platform: 'dzen',
    topic,
    charCount: body.replace(/<[^>]+>/g, '').replace(/\s/g, '').length,
    status: 'draft',
    createdAt: new Date().toISOString()
  };

  writeFileSync(join(DRAFTS_DIR, `${slug}.json`), JSON.stringify(draftJson, null, 2), 'utf-8');

  // Push to repo
  try {
    const existing = await ghFetch(`data/drafts/${slug}.json`);
    await ghPut(`data/drafts/${slug}.json`, JSON.stringify(draftJson, null, 2),
      `dzen draft: ${slug}`, existing?.sha);
  } catch (e) {
    console.error('Failed to push Dzen draft:', e.message);
  }

  return { slug, title: article.title, charCount: draftJson.charCount, status: 'draft' };
}

/* --- Full Pipeline --- */

export async function runDzenPipeline(topic) {
  const result = { stage: '', topic, startedAt: new Date().toISOString() };
  try {
    result.stage = 'research';
    const research = await researchAgent(topic);
    result.research = { pubmedCount: research.pubmedResults?.length || 0 };

    result.stage = 'generate';
    const article = await generateDzenArticle(topic, research);
    result.article = { title: article.title, charCount: article.body.replace(/<[^>]+>/g, '').replace(/\s/g, '').length };

    result.stage = 'save';
    const draft = await saveDzenDraft(article, topic);
    result.draft = draft;

    result.stage = 'done';
    result.completedAt = new Date().toISOString();
    return result;
  } catch (e) {
    return { ...result, error: `${result.stage}: ${e.message}`, stage: 'error' };
  }
}

/* --- CLI --- */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const topic = process.argv[2] || 'сравнение коронок из циркония и металлокерамики';
  runDzenPipeline(topic).then(r => {
    if (r.error) console.error('Error:', r.error);
    else console.log('Done:', JSON.stringify(r, null, 2));
  }).catch(e => console.error('Fatal:', e));
}
