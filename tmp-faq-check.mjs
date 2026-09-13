import fs from 'fs';
const content = fs.readFileSync('C:\\opencode\\ortopednn-auto\\src\\content\\blog\\shinirovanie-zubov.md', 'utf8');
const faqMatch = content.match(/<h2>.*?задаваемые.*?вопросы<\/h2>([\s\S]*?)(?=<div class="cta">)/);
if (!faqMatch) { console.log('No FAQ section found'); process.exit(1); }
const section = faqMatch[1];
const re = /<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
let m;
while ((m = re.exec(section)) !== null) {
  const title = m[1].trim();
  const text = m[2].replace(/<[^>]+>/g, '').trim();
  console.log(`FAQ: "${title}"`);
  console.log(`  Length: ${text.length} chars`);
  console.log(`  Text: ${text}`);
  console.log();
}
