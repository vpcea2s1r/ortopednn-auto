import fs from "fs";
// Validates every draft in data/drafts/ (no hardcoded list).
const dir = "data/drafts";
let files = [];
try { files = fs.readdirSync(dir).filter(f => f.endsWith(".json")); } catch { /* no dir */ }
if (files.length === 0) { console.log("no drafts to validate (expected - drafts published)"); process.exit(0); }
const idx = fs.readFileSync("data/blog-articles.ts", "utf8");
const cats = new Set();
const rc = new RegExp("category: '([^']+)'", "g");
let m; while ((m = rc.exec(idx))) cats.add(m[1]);
let fail = 0;
for (const f of files) {
  const p = dir + "/" + f;
  const raw = fs.readFileSync(p, "utf8");
  const probs = [];
  if (raw.charCodeAt(0) === 0xfeff) probs.push("BOM");
  let d;
  try { d = JSON.parse(raw); } catch (e) { console.log(f, "JSON ERROR", e.message); fail++; continue; }
  const keys = Object.keys(d).sort().join(",");
  if (keys !== "body,category,date,description,slug,title") probs.push("keys:" + keys);
  if (!cats.has(d.category)) probs.push("bad-category:" + d.category);
  if (d.slug !== f.replace(/\.json$/, "")) probs.push("slug-mismatch");
  if (!d.body || d.body.length < 5500) probs.push("thin:" + (d.body || "").length);
  if ((raw.match(/[\u2500-\u25FF]/g) || []).length) probs.push("mojibake");
  if ((raw.match(/[₽]|руб|price|стоим/gi) || []).length) probs.push("price");
  if (!(raw.match(/tel:\+79202537317/) || []).length) probs.push("no-tel");
  if (!(raw.match(/cta/) || []).length) probs.push("no-cta");
  const opens = (d.body.match(/<div/g) || []).length;
  const closes = (d.body.match(/<\/div>/g) || []).length;
  if (opens !== closes) probs.push("div:" + opens + "/" + closes);
  if (!d.description.includes("+7 (920) 253-73-17")) probs.push("no-phone-desc");
  if (probs.length) { console.log("FAIL", f, probs.join(" ")); fail++; }
  else console.log("OK  ", f, "len:" + d.body.length);
}
process.exit(fail ? 1 : 0);
