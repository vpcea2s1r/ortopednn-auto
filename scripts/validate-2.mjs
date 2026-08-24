import { readFileSync } from "fs";
const s = "implant-ne-prizhilsya";
const p = "data/drafts/" + s + ".json";
const b = readFileSync(p);
const raw = b.toString("utf8");
const bom = b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf;
const cyr = (raw.match(/[\u0400-\u04FF]/g) || []).length;
const mojibake = (raw.match(/[\u2500-\u25FF]/g) || []).length;
const j = JSON.parse(raw);
const prices = j.body.match(/\d[\d\s]*(?:руб|₽|тыс)/gi) || [];
const tel = j.body.includes("tel:+79202537317");
const cta = j.body.includes('class="cta"');
const h2 = (j.body.match(/<h2>/g) || []).length;
const faq = (j.body.match(/faq-item/g) || []).length;
const lead = j.body.includes('class="lead"');
console.log(
  s,
  "| bom:" + bom,
  "cyr:" + cyr,
  "mojibake:" + mojibake,
  "prices:" + (prices.length ? prices.join(",") : "0"),
  "tel:" + tel,
  "cta:" + cta,
  "h2:" + h2,
  "faq-items:" + faq,
  "lead:" + lead,
  "body:" + j.body.length
);