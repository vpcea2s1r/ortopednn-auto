import fetch from 'node-fetch';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = join(__dirname, '..', 'data', 'drafts');

async function generateImage(prompt) {
  const imgDir = join(__dirname, '..', 'public', 'images', 'blog');
  if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });

  const slug = makeSlug(prompt).substring(0, 30) || 'article';
  const ext = '.webp';
  const existing = existsSync(join(imgDir, slug + ext));
  if (existing) return `/images/blog/${slug}${ext}`;

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent('стоматология протезирование ' + prompt + ' фотография реалистичная')}?width=1200&height=630&model=flux&nofeed=true`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const buffer = await resp.arrayBuffer();
    writeFileSync(join(imgDir, slug + ext), Buffer.from(buffer));
    return `/images/blog/${slug}${ext}`;
  } catch { return null; }
}

async function callAI(prompt) {
  const rulesPath = join(__dirname, '..', 'docs', 'content-rules.md');
  const rules = existsSync(rulesPath) ? readFileSync(rulesPath, 'utf8') : '';
  const systemPrompt = `Ты стоматолог-ортопед с 30-летним стажем. Пишешь статьи на русском для сайта клиники. Вот правила:

${rules}

Следуй правилам выше. Ответ только JSON, без лишнего текста.`;

  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      model: 'openai',
      seed: Math.floor(Math.random() * 1000000)
    })
  });
  const text = await response.text();
  return text;
}

const TRANSLIT = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
function makeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/[а-яё]/g, c => TRANSLIT[c] || c)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
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
  "author": {
    "@type": "Person",
    "name": "${author}",
    "medicalSpecialty": "Prosthodontics"
  },
  "datePublished": "${date}",
  "dateModified": "${date}",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": pageUrl
  },
  "image": "https://ortopednn.ru/og-image.svg",
  "publisher": {
    "@type": "Organization",
    "name": "ОртопедНН"
  }
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

const RETRIES = 3;

function repairJSON(raw) {
  raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  if (raw.startsWith('{')) {
    try { const p = JSON.parse(raw); if (p.content) raw = p.content; } catch {}
  }
  raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return raw;
}

function tryParse(raw) {
  try { const r = JSON.parse(raw); if (r && typeof r.title === 'string') return r; } catch {}
  let depth = 0;
  for (const c of raw) { if (c === '{') depth++; if (c === '}') depth--; }
  if (depth > 0) { try { const r = JSON.parse(raw + '}'.repeat(depth)); if (r && typeof r.title === 'string') return r; } catch {} }
  return null;
}

async function generate(topicPrompt) {
  const prompt = `Напиши статью для блога стоматолога-ортопеда на тему: ${topicPrompt}
  
Требования:
- Объём: 1500-2000 символов
- Заголовок h1: чёткий, с ключевыми словами
- Структура: h2 для подзаголовков, p для абзацев
- Добавь один блок ul или ol
- Добавь 3-5 вопросов в FAQ в конце
- Без призывов "запишитесь", без восклицательных знаков
- Только факты, клинические рекомендации, сроки, материалы
- Экранируй кавычки внутри строк обратным слешем
- Без изображений, без тегов img

Верни ТОЛЬКО JSON, без пояснений, без markdown:
{
  "title": "заголовок статьи",
  "description": "мета-описание 150-160 символов",
  "body": "HTML контент статьи"
}`;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    console.log(`Generating (attempt ${attempt}/${RETRIES})...`);
    let raw = await callAI(prompt);
    raw = repairJSON(raw);

    const json = tryParse(raw);
    if (json && json.title && json.description && json.body) {
      const date = new Date().toISOString().split('T')[0];
      const slug = makeSlug(json.title);
      const article = astroTemplate({
        slug,
        title: json.title,
        description: json.description,
        author: 'Никитина Марина Георгиевна',
        date,
        body: json.body
      });

      if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true });
      const draftPath = join(DRAFTS_DIR, `${slug}.astro`);
      const metaPath = join(DRAFTS_DIR, `${slug}.meta.json`);
      writeFileSync(draftPath, article, 'utf-8');
      writeFileSync(metaPath, JSON.stringify({ slug, title: json.title, description: json.description, date, status: 'draft' }, null, 2), 'utf-8');
      console.log(`\n📄 ЧЕРНОВИК СОХРАНЁН:`);
      console.log(`   Файл: data/drafts/${slug}.astro`);
      console.log(`   Заголовок: ${json.title}`);
      console.log(`   Описание: ${json.description}`);
      console.log(`   Статус: черновик (ожидает одобрения)\n`);
      return { slug, title: json.title, description: json.description, date, body: json.body };
    } else {
      console.error(`Attempt ${attempt}: JSON parse error`);
      if (attempt < RETRIES) console.log('Retrying...');
    }
  }

  console.error('All attempts failed. Raw response:', raw.substring(0, 500) || 'empty');
  return null;
}

const topic = process.argv[2] || 'протезирование нижних зубов виды протезов сравнение';
generate(topic).then(r => {
  if (r) console.log(`\n⏳ Черновик создан: ${r.title}`);
  console.log('   Ждёт твоего одобрения.');
}).catch(console.error);
