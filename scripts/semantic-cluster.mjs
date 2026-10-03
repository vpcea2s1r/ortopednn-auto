#!/usr/bin/env node
// Semantic core clustering for ortopednn.ru
// Вход: CSV "фраза;частота" (выгрузка Wordstat: ручная вставка, WebJoan, Selenium-парсер).
// Алгоритм: Jaccard по значимым словам + бонус за общие корни 4+ букв (идея kw-clusterized, MIT),
// жадная агломерация от длинных фраз, порог --threshold (по умолч. 0.3).
// Выход: data/semantic-clusters/<name>.json + .md (кластеры, суммы частот,
// привязка к существующим статьям, метки JUNK по правилам проекта).
// Использование: node scripts/semantic-cluster.mjs data/wordstat/gibkie.csv [--threshold 0.3]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STOP = new Set(['это','такое','что','как','какой','какая','какое','какие','какого','есть','ли','для','при','или','от','до','по','про','же','то','так','такая','такие','все','можно','нет','уже','если','когда','где','куда','за','из','над','между','через','всего','просто','именно']);
// RU-стопслова: только мусорные, БЕЗ смысловых (без/на/под/цена оставлены — они различают интенты).

// Мусорные интенты по правилам проекта: ОМС/бесплатно, цены, маркетплейсы, гео вне НН, вакансии.
const JUNK_RE = /омс|бесплатн|цена|цены|стоимость|сколько стоит|купить|продажа|озон|вайлдберриз|wildberries|спб|санкт-петербург|москва|мск|краснодар|екатеринбург|архангельск|пермь|новосибирск|казань|ваканси|работа|квот|мкб|алкоголик|андреевские|xn--|госпрограмм|льготн|перми|хэйхэ|хейхэ|государств|поликлиник|социальн/i;
const GEO_OK_RE = /нижний новгород|нн\b|нижегород/i;

const ENDS = ['\u0438\u044f\u043c\u0438','\u044f\u043c\u0438','\u0430\u043c\u0438','\u0438\u0435\u0439','\u0435\u0439','\u043e\u0439','\u0438\u0439','\u044b\u0439','\u0430\u044f','\u044f\u044f','\u043e\u0435','\u0435\u0435','\u0438\u0435','\u044b\u0435','\u043e\u043c\u0443','\u0435\u043c\u0443','\u043e\u0433\u043e','\u0435\u0433\u043e','\u0443\u044e','\u044e\u044e','\u0430','\u044f','\u043e','\u0435','\u0438','\u044b','\u044c','\u0439','\u0443','\u044e'];
function stem(w){ for (const e of ENDS){ if (w.length - e.length >= 3 && w.endsWith(e)) return w.slice(0,-e.length); } return w; }
const SYN = {'\u0433\u0438\u0431\u043a':['\u043d\u0435\u0439\u043b\u043e\u043d'],'\u043c\u044f\u0433\u043a':['\u043d\u0435\u0439\u043b\u043e\u043d'],'\u0441\u0438\u043b\u0438\u043a\u043e\u043d':['\u043d\u0435\u0439\u043b\u043e\u043d'],'\u0434\u0435\u0444\u043b\u0435\u043a\u0441':['\u043d\u0435\u0439\u043b\u043e\u043d']};
const _JA = [...new Set(JUNK_RE.source.split(/[^a-z\u0430-\u044f\u0451]+/gi))].map(w => stem(w.toLowerCase())).filter(w => w.length > 1);
const _GA = [...new Set(GEO_OK_RE.source.split(/[^a-z\u0430-\u044f\u0451]+/gi))].map(w => stem(w.toLowerCase())).filter(w => w.length > 1);
const SPAM_RE = /xn--|p1ai|crocodent|atlas-diagnostics|\\d{4,}/i;
function isJunk(ph) { if (SPAM_RE.test(ph)) return true;
  const t = tokens(ph);
  const hit = (arr) => t.some(w => arr.some(s => w === s || (w.length > 3 && s.length > 3 && (w.startsWith(s) || s.startsWith(w)))));
  if (!hit(_JA)) return false;
  return !hit(_GA);
}
const _tc = new Map();
function tokens(s) {
  const _h = _tc.get(s); if (_h) return _h;
  const _r = s.toLowerCase().replace(/[^a-z\u0430-\u044f\u04510-9\s-]/g, ' ').split(/[\s-]+/).filter(w => w.length > 2 && !STOP.has(w)).map(stem); _tc.set(s, _r); return _r;
}
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; const hits = [];
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}
function similarity(p1, p2) {
  const t1 = tokens(p1), t2 = tokens(p2);
  if (!t1.length || !t2.length) return 0;
  let s = jaccard(t1, t2);
  const S2 = new Set(t2);
  for (const w of new Set(t1)) if (w.length >= 4 && S2.has(w)) s += 0.08; // бонус за общие корни
  return Math.min(1, s);
}
// Статьи сайта для проверки каннибализации: slug + title из data/blog-articles.ts
function loadArticles() {
  const src = readFileSync(join(ROOT, 'data/blog-articles.ts'), 'utf8');
  const out = [];
  const re = /\{\s*slug:\s*'([^']+)',\s*title:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) out.push({ slug: m[1], title: m[2] });
  for (const a of out) {
    try {
      const md = readFileSync(join(ROOT, 'src/content/blog', a.slug + '.md'), 'utf8');
      const hs = []; let h;
      const r1 = /<h[23]>([^<]+)<\/h[23]>/g; while ((h = r1.exec(md))) hs.push(h[1]);
      const r2 = /^#{2,3}\s+(.+)$/gm; while ((h = r2.exec(md))) hs.push(h[1]);
      a.all = new Set(tokens(a.title + ' ' + hs.join(' ')));
    } catch (e) { a.all = new Set(tokens(a.title)); }
  }
  const df = {}; for (const a of out) for (const w of new Set(tokens(a.title))) df[w] = (df[w] || 0) + 1; return { list: out, df, N: out.length };
}
function mapArticle(head, articles) {
  const ht = new Set(tokens(head)); for (const w of [...ht]) if (SYN[w]) SYN[w].forEach(s => ht.add(s));
  if (!ht.size) return null;
  let best = null, bestScore = 0;
  for (const a of articles) {
    const at = a.all;
    let inter = 0; const hits = [];
    for (const w of ht){ if (at.has(w)) { inter++; hits.push(w); continue; } for (const v of at){ let k=0; while (k<w.length && k<v.length && w[k]===v[k]) k++; if (k>=5) { inter++; hits.push(w); break; } } }
    let hw=0,gw=0; for (const w of ht) hw+=globalThis.__W(w); for (const w of hits) gw+=globalThis.__W(w); const score = hw?gw/hw:0;
    if (score > bestScore) { bestScore = score; best = a.slug; }
  }
  return bestScore >= 0.3 ? { slug: best, score: +bestScore.toFixed(2) } : null;
}
function main() {
  const [csvPath, ...rest] = process.argv.slice(2);
  if (!csvPath) { console.error('usage: node scripts/semantic-cluster.mjs data/wordstat/<name>.csv [--threshold 0.3]'); process.exit(1); }
  const ti = rest.indexOf('--threshold');
  const threshold = ti >= 0 ? parseFloat(rest[ti + 1]) : 0.3;
  const name = basename(csvPath).replace(/\.csv$/i, '');
  const rows = readFileSync(join(ROOT, csvPath), 'utf8').split(/\r?\n/)
    .map(l => l.trim()).filter(Boolean)
    .map(l => { const i = l.lastIndexOf(';'); return { phrase: l.slice(0, i).trim(), freq: parseInt(l.slice(i + 1).replace(/\s/g, ''), 10) || 0 }; })
    .filter(r => r.phrase);
  const { list: articles, df, N } = loadArticles(); const W = w => Math.log(N / (df[w] || 1)); globalThis.__W = W;
  // Жадная агломерация: от длинных фраз к коротким (как kw-clusterized).
  const order = rows.map((_, i) => i).sort((a, b) => rows[b].phrase.length - rows[a].phrase.length);
  const assigned = new Set(), clusters = [];
  for (const i of order) {
    if (assigned.has(i)) continue;
    const members = [rows[i]];
    assigned.add(i);
    for (const j of order) {
      if (i === j || assigned.has(j)) continue;
      if (similarity(rows[i].phrase, rows[j].phrase) >= threshold) { members.push(rows[j]); assigned.add(j); }
    }
    members.sort((a, b) => b.freq - a.freq);
    clusters.push(members);
  }
  clusters.sort((a, b) => b.reduce((s, r) => s + r.freq, 0) - a.reduce((s, r) => s + r.freq, 0));
  const out = clusters.map(members => {
    const sum = members.reduce((s, r) => s + r.freq, 0);
    const head = (members.find(m => !isJunk(m.phrase)) || members[0]).phrase;
    const junk = members.every(m => isJunk(m.phrase));
    return { head, count: members.length, freq: sum, junk, target: mapArticle(head, articles), members: members.map(m => ({ q: m.phrase, f: m.freq })) };
  });
  const dir = join(ROOT, 'data/semantic-clusters');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name + '.json'), JSON.stringify({ source: csvPath, threshold, clusters: out }, null, 2), 'utf8');
  let md = '# Семантическое ядро: ' + name + '\n\nИсточник: `' + csvPath + '`, порог ' + threshold + ', кластеров: ' + out.length + '\n\n';
  md += '| # | Главный запрос | Фраз | Показов | Цель | Вердикт |\n|---|---|---|---|---|---|\n';
  out.forEach((c, i) => {
    const verdict = c.junk ? 'JUNK (не пишем)' : c.target ? 'covered: ' + c.target.slug : 'GAP (кандидат)';
    md += '| ' + (i + 1) + ' | ' + c.head + ' | ' + c.count + ' | ' + c.freq + ' | ' + (c.target ? c.target.slug : '—') + ' | ' + verdict + ' |\n';
  });
  md += '\n## Детали кластеров\n';
  out.forEach((c, i) => {
    md += '\n### ' + (i + 1) + '. ' + c.head + ' (' + c.freq + ')\n';
    c.members.slice(0, 20).forEach(m => { md += '- ' + m.q + ' — ' + m.f + '\n'; });
    if (c.members.length > 20) md += '- ... и ещё ' + (c.members.length - 20) + '\n';
  });
  writeFileSync(join(dir, name + '.md'), md, 'utf8');
  const gaps = out.filter(c => !c.junk && !c.target), covered = out.filter(c => c.target), junk = out.filter(c => c.junk);
  console.log('clusters: ' + out.length + ' | GAP: ' + gaps.length + ' | covered: ' + covered.length + ' | JUNK: ' + junk.length);
  gaps.slice(0, 10).forEach(c => console.log('GAP ' + c.freq + ' : ' + c.head));
}
main();