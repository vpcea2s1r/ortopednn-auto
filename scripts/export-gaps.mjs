#!/usr/bin/env node
// Export GAP clusters (not JUNK, not covered) to CSV for manual review.
// Usage: node scripts/export-gaps.mjs [data/semantic-clusters/vse.json] [out.csv]
import { readFileSync, writeFileSync } from 'node:fs';
const src = process.argv[2] || 'data/semantic-clusters/vse.json';
const out = process.argv[3] || src.replace(/\.json$/, '.gaps.csv');
const d = JSON.parse(readFileSync(src, 'utf8'));
const rows = [['freq','count','head','top_members']];
for (const c of d.clusters || []) {
  if (c.junk || c.target) continue;
  const top = (c.members || []).slice(0, 3).map(m => m.q).join(' | ');
  rows.push([c.freq, c.count, c.head, top]);
}
const csv = rows.map(r => r.map(v => { const s = String(v).replace(/"/g, '""'); return /[;"\n]/.test(s) ? '"' + s + '"' : s; }).join(';')).join('\n');
writeFileSync(out, csv, 'utf8');
console.log('gaps:', rows.length - 1, '->', out);
