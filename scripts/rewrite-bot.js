import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = join(__dirname, '..', 'data', 'drafts');
const BLOG_INDEX = join(__dirname, '..', 'src', 'pages', 'blog', 'index.astro');
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8992312371:AAEmKcm3WLeTfOjGQrM1-P8XE8yyiTmnSEM';
const API = `https://api.telegram.org/bot${TOKEN}`;
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = 'vpcea2s1r';
const GH_REPO = 'stomatolog';

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
  const index = readFileSync(BLOG_INDEX, 'utf-8');
  const titles = index.matchAll(/title:\s*'([^']+)'/g);
  const t = newTitle.toLowerCase();
  for (const m of titles) {
    const existing = m[1].toLowerCase();
    if (existing === t) return true;
    const common = [...t].filter(c => existing.includes(c)).length;
    if (common / Math.max(t.length, existing.length) >= threshold) return true;
  }
  return false;
}

// JSON string: "..." with proper escape handling
const JSON_STR = '((?:[^"\\\\]|\\\\.)*)';

function extractBodies(s) {
  // Find the last `"body"` key, extract everything from its value until the closing `}`
  const bodyMatch = s.match(/(?:"|')body(?:"|')\s*:\s*["']/);
  if (!bodyMatch) return null;
  const afterKey = s.slice(bodyMatch.index + bodyMatch[0].length);
  let inStr = false, esc = false;
  let content = '';
  for (let i = 0; i < afterKey.length; i++) {
    const ch = afterKey[i];
    if (esc) { content += ch; esc = false; continue; }
    if (ch === '\\') { content += ch; esc = true; continue; }
    if (inStr) {
      if (ch === '"' || ch === "'") {
        // end of body value — check if followed by , or }
        const rest = afterKey.slice(i + 1).trim();
        if (rest.startsWith(',') || rest.startsWith('}')) {
          return content;
        }
        // double quote inside body (unescaped) — treat as literal
        content += ch;
        continue;
      }
      content += ch;
    } else if (ch === '"' || ch === "'") {
      inStr = true;
    }
  }
  // Fallback: everything until end is body
  return afterKey.replace(/["']\s*[,\}].*$/s, '').trim();
}

function tryParseJSON(raw) {
  // Strategy 1: Native parse
  try { const r = JSON.parse(raw); if (r && typeof r.title === 'string') return r; } catch {}
  // Strategy 2: Close unclosed braces
  let d = 0; for (const c of raw) { if (c === '{') d++; if (c === '}') d--; }
  if (d > 0) { try { const r = JSON.parse(raw + '}'.repeat(d)); if (r && typeof r.title === 'string') return r; } catch {} }
  // Strategy 3: Replace single quotes, unquoted keys
  try { const s = raw.replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); const r = JSON.parse(s); if (r && typeof r.title === 'string') return r; } catch {}
  return null;
}

function tryExtract(raw) {
  // Strategy 4: Regex JSON fields with proper escaping
  const reT = new RegExp(`"title"\\s*:\\s*"${JSON_STR}"`);
  const reD = new RegExp(`"description"\\s*:\\s*"${JSON_STR}"`);
  const mt = raw.match(reT);
  const md = raw.match(reD);
  if (mt && md) {
    const mb = extractBodies(raw);
    if (mb) return { title: mt[1], description: md[1], body: mb };
  }
  // Strategy 5: Same with single quotes
  const reTq = new RegExp(`'title'\\s*:\\s*'([^']+)'`);
  const reDq = new RegExp(`'description'\\s*:\\s*'([^']+)'`);
  const mtq = raw.match(reTq);
  const mdq = raw.match(reDq);
  if (mtq && mdq) {
    const mb = extractBodies(raw);
    if (mb) return { title: mtq[1], description: mdq[1], body: mb };
  }
  return null;
}

function repairJSON(raw) {
  if (!raw || typeof raw !== 'string') return '';
  raw = raw.replace(/```(?:json|html)?\n?/gi, '').replace(/```\n?/g, '').trim();
  // If wrapped in a content field, unwrap
  try { const p = JSON.parse(raw); if (p.content && typeof p.content === 'string') raw = p.content; } catch {}
  raw = raw.replace(/```(?:json|html)?\n?/gi, '').replace(/```\n?/g, '').trim();
  // Extract outermost JSON object
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
  const r = tryParseJSON(cleaned);
  if (r) return r;
  return tryExtract(cleaned) || tryExtract(raw);
}

function formatDate(iso) {
  const m = { '01':'января','02':'февраля','03':'марта','04':'апреля','05':'мая','06':'июня','07':'июля','08':'августа','09':'сентября','10':'октября','11':'ноября','12':'декабря' };
  const [y, month, d] = iso.split('-');
  return `${parseInt(d,10)} ${m[month]||month} ${y}`;
}

function stripH1(html) {
  return html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
}

function astroTemplate({ slug, title, description, author, date, body }) {
  const escaped = (s) => s.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  const escapedTitle = escaped(title);
  const escapedDesc = escaped(description);
  const escapedAuthor = escaped(author);
  const bodyClean = stripH1(body);
  const dateFormatted = formatDate(date);
  return `---
import BaseLayout from '../../layouts/BaseLayout.astro';
import Navbar from '../../components/Navbar.astro';
import doctor from '../../../data/doctor.json';

const slug = '${slug}';
const pageUrl = \`https://ortopednn.ru/blog/\${slug}/\`;

const ldArticle = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "${escapedTitle}",
  "description": "${escapedDesc}",
  "author": { "@type": "Person", "name": "${escapedAuthor}", "medicalSpecialty": "Prosthodontics" },
  "datePublished": "${date}",
  "dateModified": "${date}",
  "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
  "image": "https://ortopednn.ru/og-image.svg",
  "publisher": { "@type": "Organization", "name": "ОртопедНН" }
};
---

<BaseLayout title="${escapedTitle}" description="${escapedDesc}" breadcrumbTitle="${escapedTitle}" doctor={doctor}>
  <Navbar />
  <main class="container">
    <a href="/blog" class="back">← К статьям</a>
    <article>
      <h1>${escapedTitle}</h1>
      <div class="meta">${dateFormatted} — ${escapedAuthor}, стоматолог-ортопед</div>
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
  const systemPrompt = 'Ответь только JSON. Никакого другого текста. Ни markdown, ни пояснений. Только JSON.\n{"title":"заголовок","description":"мета-описание","body":"<p>HTML</p>"}';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], model: 'openai', seed: Math.floor(Math.random() * 1000000) })
    });
    clearTimeout(timer);
    return await response.text();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function extractText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const resp = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);
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
- Первый абзац body: lead (сильный, с "Короткий ответ:" если уместно)
- Структура: h2 для подзаголовков, p для абзацев, один ul или ol
- FAQ: 3-5 вопросов в конце
- НЕ используй h1 — заголовок будет добавлен автоматически
- Без "запишитесь", без восклицательных знаков
- Только факты, сроки, материалы
- Экранируй кавычки внутри строк

Исходный текст:
${snippet}

Теперь верни ТОЛЬКО JSON. Пример:
{"title":"Боль в десне после протезирования","description":"Причины боли в десне после установки коронок и протезов. Когда норма, а когда нужно к врачу.","body":"<p><strong>Короткий ответ:</strong> боль в десне 1-2 дня после фиксации — норма.</p><h2>Почему болит десна</h2><p>После фиксации коронки возможна чувствительность 1-2 дня.</p><ul><li>Адаптация тканей</li><li>Реакция на цемент</li></ul><h2>FAQ</h2><p><strong>Сколько болит?</strong> Обычно 2-3 дня.</p>"}`;

  let lastRaw = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const raw = await callAI(prompt);
    lastRaw = raw;
    const json = parseAny(raw);
    if (json && json.title && json.description && json.body) {
      const existingSlugs = loadExistingSlugs();
      const slug = makeSlug(json.title);
      if (existingSlugs.has(slug)) return { duplicate: true, title: json.title };
      if (isDuplicateTitle(json.title)) return { duplicate: true, title: json.title };
      const date = new Date().toISOString().split('T')[0];
      const article = astroTemplate({ slug, title: json.title, description: json.description, author: 'Никитина Марина Георгиевна', date, body: json.body });
      if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true });
      writeFileSync(join(DRAFTS_DIR, `${slug}.astro`), article, 'utf-8');
      writeFileSync(join(DRAFTS_DIR, `${slug}.meta.json`), JSON.stringify({ slug, title: json.title, description: json.description, date, status: 'draft' }, null, 2), 'utf-8');
      return { slug, title: json.title };
    }
  }
  return { error: true, response: lastRaw };
}

async function pushToStomatolog(slug) {
  const draftPath = join(DRAFTS_DIR, `${slug}.astro`);
  if (!existsSync(draftPath)) return { error: 'Файл не найден' };
  const content = readFileSync(draftPath, 'utf-8');
  const encoded = Buffer.from(content, 'utf-8').toString('base64');
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/src/pages/blog/${slug}.astro`;
  const headers = { Authorization: `token ${GH_TOKEN}`, Accept: 'application/vnd.github.v3+json' };
  const existing = await fetch(url, { headers }).then(r => r.ok ? r.json() : null);
  const sha = existing && existing.sha ? existing.sha : undefined;
  const body = { message: `draft: ${slug}`, content: encoded };
  if (sha) body.sha = sha;
  const resp = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  const json = await resp.json();
  if (!resp.ok) return { error: json.message || 'GitHub API error' };
  unlinkSync(draftPath);
  const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
  if (existsSync(metaPath)) unlinkSync(metaPath);
  return { ok: true, sha: json.content && json.content.sha };
}

function deleteDraft(slug) {
  const draftPath = join(DRAFTS_DIR, `${slug}.astro`);
  if (existsSync(draftPath)) unlinkSync(draftPath);
  const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
  if (existsSync(metaPath)) unlinkSync(metaPath);
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

function draftButtons(slug) {
  return {
    inline_keyboard: [[
      { text: '📰 Опубликовать', callback_data: `pub:${slug}` },
      { text: '🗑 Удалить', callback_data: `del:${slug}` }
    ]]
  };
}

async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const msgId = cb.message.message_id;
  const data = cb.data || '';
  const slug = data.slice(4);

  await tg('answerCallbackQuery', { callback_query_id: cb.id });

  if (data.startsWith('pub:')) {
    const msg = await tg('editMessageText', {
      chat_id: chatId, message_id: msgId,
      text: `📤 Публикую ${slug} на stomatolog.ortopednn.ru... ⏳`,
      parse_mode: 'Markdown'
    });
    const result = await pushToStomatolog(slug);
    if (result.error) {
      await tg('editMessageText', {
        chat_id: chatId, message_id: msgId,
        text: `❌ Ошибка публикации: ${result.error}`
      });
    } else {
      await tg('editMessageText', {
        chat_id: chatId, message_id: msgId,
        text: `✅ Опубликовано!\n🔗 https://stomatolog.ortopednn.ru/blog/${slug}/`,
        reply_markup: { inline_keyboard: [] }
      });
    }
  } else if (data.startsWith('del:')) {
    deleteDraft(slug);
    await tg('editMessageText', {
      chat_id: chatId, message_id: msgId,
      text: `🗑 Черновик «${slug}» удалён.`,
      reply_markup: { inline_keyboard: [] }
    });
  }
}

async function handleUpdate(upd) {
  if (upd.callback_query) return handleCallback(upd.callback_query);

  const msg = upd.message;
  if (!msg || !msg.text) return;
  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const isUrl = text.match(/https?:\/\/[^\s]+/);
  const isCmd = text.startsWith('/');

  if (isCmd && text === '/start') {
    await tg('sendMessage', { chat_id: chatId, text: 'Пришли ссылку — я сделаю рерайт и сохраню черновик.\n\n/drafts — список черновиков' });
  } else if (isCmd && text === '/drafts') {
    const drafts = [];
    if (existsSync(DRAFTS_DIR)) {
      const files = readdirSync(DRAFTS_DIR).filter(f => f.endsWith('.meta.json'));
      for (const f of files) { try { drafts.push(JSON.parse(readFileSync(join(DRAFTS_DIR, f), 'utf8'))); } catch {} }
    }
    if (drafts.length === 0) {
      await tg('sendMessage', { chat_id: chatId, text: 'Нет черновиков.' });
    } else {
      for (const d of drafts) {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `📄 ${d.title}\n${d.date}\n🔗 https://stomatolog.ortopednn.ru/blog/${d.slug}/`,
          reply_markup: draftButtons(d.slug)
        });
      }
    }
  } else if (isUrl) {
    const url = text.match(/https?:\/\/[^\s]+/)[0];
    const statusResp = await tg('sendMessage', { chat_id: chatId, text: `📥 Читаю статью... ⏳` });
    const msgId = statusResp.ok ? statusResp.result.message_id : null;
    if (!msgId) return;
    try {
      const result = await rewrite(url);
      const edit = async (text, extra) => tg('editMessageText', { chat_id: chatId, message_id: msgId, text, ...(extra || {}) });
      if (result) {
        if (result.error) {
          const snippet = (result.response || '').replace(/\n/g, ' ').substring(0, 300);
          await edit(`❌ Не удалось распарсить ответ.\nAI ответил:\n${snippet}\n\nПопробуй другую ссылку.`);
        } else if (result.duplicate) {
          await edit(`⚠️ Дубликат: «${result.title}» — такая статья уже есть.`);
        } else {
          await edit(`✅ Сохранён черновик:\n📄 ${result.title}\n🔗 https://stomatolog.ortopednn.ru/blog/${result.slug}/`, { reply_markup: draftButtons(result.slug) });
        }
      }
    } catch (e) {
      console.error('Rewrite error:', e.message);
      await tg('editMessageText', { chat_id: chatId, message_id: msgId, text: `❌ Ошибка: ${e.message.slice(0, 200)}` });
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