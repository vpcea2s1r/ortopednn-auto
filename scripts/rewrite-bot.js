import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = join(__dirname, '..', 'data', 'drafts');
const TOKEN = '8992312371:AAEmKcm3WLeTfOjGQrM1-P8XE8yyiTmnSEM';
const API = `https://api.telegram.org/bot${TOKEN}`;

const TRANSLIT = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'p','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
function makeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/[а-яё]/g, c => TRANSLIT[c] || c)
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

function tryParse(raw) {
  try { const r = JSON.parse(raw); if (r && typeof r.title === 'string') return r; } catch {}
  let depth = 0;
  for (const c of raw) { if (c === '{') depth++; if (c === '}') depth--; }
  if (depth > 0) { try { const r = JSON.parse(raw + '}'.repeat(depth)); if (r && typeof r.title === 'string') return r; } catch {} }
  return null;
}

function repairJSON(raw) {
  raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  if (raw.startsWith('{')) { try { const p = JSON.parse(raw); if (p.content) raw = p.content; } catch {} }
  raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return raw;
}

function astroTemplate({ slug, title, description, author, date, body }) {
  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Navbar from '../../components/Navbar.astro';
import doctor from '../../../data/doctor.json';
import socials from '../../../data/socials.json';

const slug = '${slug}';
const pageUrl = \`https://ortopednn.ru/blog/\${slug}/\`;

const ldArticle = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${title.replace(/"/g, '\\"')}",
  "description": "${description.replace(/"/g, '\\"')}",
  "author": { "@type": "Person", "name": "${author}", "medicalSpecialty": "Prosthodontics" },
  "datePublished": "${date}",
  "dateModified": "${date}",
  "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
  "image": "https://ortopednn.ru/og-image.svg",
  "publisher": { "@type": "Organization", "name": "ОртопедНН" }
};
---

<BaseLayout title="${title.replace(/"/g, '\\"')}" description="${description.replace(/"/g, '\\"')}">
  <Navbar slot="navbar" />
  <main class="max-w-3xl mx-auto px-4 py-12">
    <article itemscope itemtype="https://schema.org/Article">
      <h1 class="text-3xl font-bold mb-6">${title}</h1>
      <div class="prose prose-lg max-w-none">
${body}
      </div>
    </article>
  </main>
</BaseLayout>`;
}

async function callAI(prompt) {
  const rulesPath = join(__dirname, '..', 'docs', 'content-rules.md');
  const rules = existsSync(rulesPath) ? readFileSync(rulesPath, 'utf8') : '';
  const systemPrompt = `Ты стоматолог-ортопед с 30-летним стажем. Пишешь статьи на русском для сайта клиники. Вот правила:\n\n${rules}\n\nСледуй правилам выше. Ответ только JSON, без лишнего текста.`;
  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], model: 'openai', seed: Math.floor(Math.random() * 1000000) })
  });
  return await response.text();
}

async function extractText(url) {
  const resp = await fetch(url, { timeout: 15000 });
  const html = await resp.text();
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[#a-zA-Z0-9]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

async function rewrite(url) {
  const text = await extractText(url);
  const snippet = text.substring(0, 5000);
  const prompt = `Перепиши эту статью для блога стоматолога-ортопеда. Сохрани смысл, но переформулируй своим языком.
  
Требования:
- Объём: 1500-2000 символов
- Заголовок h1: чёткий, с ключевыми словами
- Структура: h2 для подзаголовков, p для абзацев
- Добавь один блок ul или ol
- Добавь 3-5 вопросов в FAQ в конце
- Без призывов "запишитесь", без восклицательных знаков
- Только факты, клинические рекомендации, сроки, материалы
- Экранируй кавычки внутри строк обратным слешем

Исходный текст:
${snippet}

Верни ТОЛЬКО JSON без пояснений:
{
  "title": "заголовок статьи",
  "description": "мета-описание 150-160 символов",
  "body": "HTML контент статьи"
}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await callAI(prompt);
    const json = tryParse(repairJSON(raw));
    if (json && json.title && json.description && json.body) {
      const date = new Date().toISOString().split('T')[0];
      const slug = makeSlug(json.title);
      const article = astroTemplate({ slug, title: json.title, description: json.description, author: 'Никитина Марина Георгиевна', date, body: json.body });
      if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true });
      writeFileSync(join(DRAFTS_DIR, `${slug}.astro`), article, 'utf-8');
      writeFileSync(join(DRAFTS_DIR, `${slug}.meta.json`), JSON.stringify({ slug, title: json.title, description: json.description, date, status: 'draft' }, null, 2), 'utf-8');
      return { slug, title: json.title };
    }
  }
  return null;
}

async function tg(method, body) {
  const resp = await fetch(`${API}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return await resp.json();
}

const OFFSET_FILE = process.env.GITHUB_ACTIONS ? '/tmp/bot_offset.txt' : join(DRAFTS_DIR, '..', '.bot-offset');

function loadOffset() {
  try { return parseInt(readFileSync(OFFSET_FILE, 'utf8').trim(), 10); } catch { return 0; }
}

function saveOffset(offset) {
  try { writeFileSync(OFFSET_FILE, String(offset), 'utf8'); } catch {}
}

async function handleUpdate(upd) {
  const msg = upd.message;
  if (!msg || !msg.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const isUrl = text.match(/https?:\/\/[^\s]+/);
  const isCmd = text.startsWith('/');

  if (isCmd && text === '/start') {
    await tg('sendMessage', { chat_id: chatId, text: 'Пришли ссылку — я сделаю рерайт и сохраню черновик.' });
  } else if (isCmd && text === '/drafts') {
    const drafts = [];
    if (existsSync(DRAFTS_DIR)) {
      const files = readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json'));
      for (const f of files) { try { drafts.push(JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf8'))); } catch {} }
    }
    if (drafts.length === 0) await tg('sendMessage', { chat_id: chatId, text: 'Нет черновиков.' });
    else await tg('sendMessage', { chat_id: chatId, text: drafts.map(d => `— ${d.title} (${d.date})`).join('\n') });
  } else if (isUrl) {
    const url = text.match(/https?:\/\/[^\s]+/)[0];
    await tg('sendMessage', { chat_id: chatId, text: `📥 Читаю статью... ⏳` });
    const result = await rewrite(url);
    if (result) {
      await tg('sendMessage', { chat_id: chatId, text: `✅ Черновик: ${result.title}\n📁 data/drafts/${result.slug}.astro\n\nПрочитай и реши: публиковать?` });
    } else {
      await tg('sendMessage', { chat_id: chatId, text: '❌ Ошибка рерайта.' });
    }
  } else if (isCmd) {
    await tg('sendMessage', { chat_id: chatId, text: 'Неизвестная команда. Пришли ссылку.' });
  }
}

async function pollOnce() {
  const offset = loadOffset();
  try {
  const updates = await tg('getUpdates', { offset, timeout: 5 });
  if (!updates.ok) return;
  for (const upd of updates.result) {
    saveOffset(upd.update_id + 1);
    await handleUpdate(upd);
  }
  } catch (e) { console.error('Poll error:', e.message); }
  if (!updates.ok) return;
  for (const upd of updates.result) {
    saveOffset(upd.update_id + 1);
    await handleUpdate(upd);
  }
}

async function main() {
  if (process.argv.includes('--once')) {
    await pollOnce();
    return;
  }
  console.log('🤖 Rewrite bot started. Waiting for URLs...');
  let offset = loadOffset();
  while (true) {
    try {
      const updates = await tg('getUpdates', { offset, timeout: 30 });
      if (!updates.ok) continue;
      for (const upd of updates.result) {
        offset = upd.update_id + 1;
        saveOffset(offset);
        await handleUpdate(upd);
      }
    } catch (e) {
      console.error('Poll error:', e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

main();