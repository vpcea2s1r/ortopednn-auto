import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dists = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/districts.json'), 'utf8'));
const out = path.join(__dirname, '../src/content/districts');

fs.mkdirSync(out, { recursive: true });

dists.forEach(d => {
  const md = `---
title: "Протезирование в ${d.name}"
description: "Ортопед в ${d.name}. ${d.transport}"
slug: "${d.slug}"
metro: [${d.metro.map(m => `"${m}"`).join(',')}]
updated: "${new Date().toISOString()}"
---

# ${d.name}

${d.transport}

${(d.local_faq || []).map(q => `## ${q.q}
${q.a}`).join('\n\n')}
`;
  fs.writeFileSync(path.join(out, `${d.slug}.md`), md);
});

console.log(`✅ Generated ${dists.length} districts`);