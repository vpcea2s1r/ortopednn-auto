#!/usr/bin/env node
// Publish an approved draft: data/drafts/<slug>.json -> src/content/blog/<slug>.md
// + entry in data/blog-articles.ts + CONTENT.md. Idempotent: safe to re-run.
// Usage: node scripts/publish-draft.mjs <slug>
// After: git rm data/drafts/<slug>.json; npm run build; commit + push.
import { readFileSync, writeFileSync } from 'node:fs';
const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: node scripts/publish-draft.mjs <slug>'); process.exit(1); }
const dp = 'data/drafts/' + slug + '.json';
let d;
try { d = JSON.parse(readFileSync(dp, 'utf8').replace(/^\uFEFF/, '')); }
catch (e) { console.error('draft unreadable:', e.message); process.exit(1); }
for (const k of ['body', 'category', 'date', 'description', 'slug', 'title'])
  if (!d[k]) { console.error('draft missing field:', k); process.exit(1); }
if (d.slug !== slug) { console.error('slug mismatch'); process.exit(1); }
if (d.body.length < 5500) { console.error('thin body:', d.body.length); process.exit(1); }
if (!d.description.includes('+7 (920) 253-73-17')) { console.error('no phone in description'); process.exit(1); }
const esc = (s) => s.replace(/"/g, '\\"');
const md = '---\nslug: ' + d.slug + '\ntitle: "' + esc(d.title) + '"\ndate: "' + d.date + '"\ndesc: "' + esc(d.description) + '"\ncategory: ' + d.category + '\n---\n' + d.body + '\n';
writeFileSync('src/content/blog/' + slug + '.md', md, 'utf8');
let ts = readFileSync('data/blog-articles.ts', 'utf8');
if (!ts.includes("slug: '" + slug + "'")) {
  const entry = "  { slug: '" + slug + "', title: \"" + esc(d.title) + '", date: \'' + d.date + "', desc: '" + esc(d.description) + "', category: '" + d.category + "' },\n";
  const ci = ts.indexOf(' ];');
  if (ci < 0) { console.error('articles array close not found'); process.exit(1); }
  ts = ts.slice(0, ci) + entry + ts.slice(ci);
  writeFileSync('data/blog-articles.ts', ts, 'utf8');
} else console.log('index entry exists, skip');
let cm = readFileSync('CONTENT.md', 'utf8');
if (!cm.includes(slug)) {
  if (!cm.endsWith('\n')) cm += '\n';
  writeFileSync('CONTENT.md', cm + '- ' + slug + '\n', 'utf8');
} else console.log('CONTENT.md entry exists, skip');
console.log('published files for', slug, '(body ' + d.body.length + ')');
console.log('next: git rm ' + dp + '; npm run build; commit + push');
