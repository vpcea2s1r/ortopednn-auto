import fetch from 'node-fetch';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(import.meta.url);
const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const DRAFTS_DIR = join(DATA_DIR, 'drafts');
const GH_TOKEN = process.env.GH_TOKEN || '';
const GH_OWNER = 'vpcea2s1r';
const GH_REPO = 'stomatolog';

const TRANSLIT = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya' };
function makeSlug(text) {
  return text.toLowerCase().trim()
    .replace(/[а-яё]/g, c => TRANSLIT[c] || c)
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

const systemPrompt = 'Ответь только JSON. Никакого другого текста.\n{"title":"...","description":"...","body":"<p>...</p>"}';

async function callAI(prompt) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 300000);
  try {
    const resp = await fetch('https://opencode.ai/zen/v1/chat/completions', {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }], model: 'deepseek-v4-flash-free' })
    });
    clearTimeout(timer);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || await resp.text();
  } catch (e) { clearTimeout(timer); throw e; }
}

function parseJSON(raw) {
  let s = raw.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim();
  const first = s.indexOf('{');
  let depth = 0, last = -1;
  for (let i = first; i < s.length && i >= 0; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (depth === 0) { last = i + 1; break; } }
  }
  if (first >= 0 && last > first) s = s.slice(first, last);
  try { return JSON.parse(s); } catch {}
  try { const r = JSON.parse(s.replace(/'/g, '"').replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')); if (r?.title) return r; } catch {}
  return null;
}

function astroTemplate({ title, description, body }) {
  const date = new Date().toISOString().split('T')[0];
  const slug = makeSlug(title);
  const e = (s) => s.replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  return { slug, astro: `---
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
      <div class="meta">${date} — Никитина Марина Георгиевна, стоматолог-ортопед</div>
${body.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '')}
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
</style>`, meta: { slug, title, description, date, status: 'generated' } };
}

export async function generate(topic) {
  const prompt = `Напиши SEO-статью для блога стоматолога-ортопеда на тему: "${topic}"

Требования:
- 1500-2000 символов
- Первый абзац — lead, с "Короткий ответ:" если уместно
- h2 для подзаголовков, один ul/ol, FAQ 3-5 вопросов
- Без h1, без "Запишитесь к врачу", без восклицательных знаков
- Только факты

Ответь ТОЛЬКО JSON:
{"title":"заголовок H1","description":"мета-описание 160 символов","body":"<p>HTML текст</p>"}`;

  for (let i = 0; i < 3; i++) {
    const raw = await callAI(prompt);
    const json = parseJSON(raw);
    if (json?.title && json?.description && json?.body) {
      const { slug, astro, meta } = astroTemplate(json);
      if (!existsSync(DRAFTS_DIR)) mkdirSync(DRAFTS_DIR, { recursive: true });
      writeFileSync(join(DRAFTS_DIR, `${slug}.astro`), astro, 'utf-8');
      writeFileSync(join(DRAFTS_DIR, `${slug}.meta.json`), JSON.stringify(meta, null, 2), 'utf-8');
      return { slug, title: json.title, status: 'draft' };
    }
  }
  return { error: 'Failed to generate after 3 retries' };
}
