import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogDir = join(__dirname, '..', 'src', 'content', 'blog');

const files = readdirSync(blogDir).filter(f => f.endsWith('.md'));
let ok = 0;

for (const file of files) {
  const path = join(blogDir, file);
  let content = readFileSync(path, 'utf-8');
  
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) { console.warn(`No frontmatter: ${file}`); continue; }
  
  let fm = match[1];
  const lines = fm.split('\n');
  const newLines = lines.map(line => {
    if (line.startsWith('title:') || line.startsWith('desc:') || line.startsWith('date:')) {
      const colonIdx = line.indexOf(':');
      const key = line.slice(0, colonIdx);
      const val = line.slice(colonIdx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) return line;
      const escaped = val.replace(/"/g, '\\"');
      return `${key}: "${escaped}"`;
    }
    return line;
  });
  
  const newFm = newLines.join('\n');
  if (newFm === fm) { ok++; continue; }
  
  const newContent = content.replace(match[1], newFm);
  writeFileSync(path, newContent, 'utf-8');
  console.log(`Fixed: ${file}`);
  ok++;
}

console.log(`\nDone: ${ok} files checked`);
