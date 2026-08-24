import fs from "fs";
// ponytail: hardcoded list, reads all drafts if empty — global scan if many drafts
const files = ["cherneet-desna-vokrug-koronki", "skolko-mozhno-hodit-bez-zubov", "sendvich-protez"];
const existing = files.filter(f => { try { fs.accessSync("data/drafts/" + f + ".json"); return true; } catch { return false; } });
if (existing.length === 0) { console.log("no drafts to validate (expected — drafts published)"); process.exit(0); }
for (const f of existing) {
  const p = "data/drafts/" + f + ".json";
  const raw = fs.readFileSync(p, "utf8");
  const bom = raw.charCodeAt(0) === 0xfeff;
  let d;
  try { d = JSON.parse(raw); } catch (e) { console.log(f, "JSON ERROR", e.message); continue; }
  const keys = Object.keys(d).sort().join(",");
  const req = ["body", "category", "date", "description", "slug", "title"].sort().join(",");
  const cyr = (raw.match(/[\u0400-\u04FF]/g) || []).length;
  const mojibake = (raw.match(/[\u2500-\u25FF]/g) || []).length;
  const prices = (raw.match(/₽|руб|price|стоим/gi) || []).length;
  const tel = (raw.match(/tel:\+79202537317/) || []).length;
  const cta = (raw.match(/class="cta"/) || []).length;
  const h2 = (raw.match(/<h2>/g) || []).length;
  const h3 = (raw.match(/<h3>/g) || []).length;
  const noindex = (raw.match(/noindex/i) || []).length;
  console.log(f.padEnd(32), "keys-ok:" + (keys === req), "cyr:" + cyr, "mojibake:" + mojibake, "bom:" + bom, "price-refs:" + prices, "tel:" + tel, "cta:" + cta, "h2:" + h2, "h3:" + h3, "noindex:" + noindex, "len:" + d.body.length);
}
