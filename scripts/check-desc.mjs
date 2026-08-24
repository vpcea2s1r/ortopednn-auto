import { readFileSync } from "fs";
const PHONE = "+7 (920) 253-73-17";
if (process.argv[2] === "--draft") {
  const slug = process.argv[3];
  const d = JSON.parse(readFileSync("data/drafts/" + slug + ".json", "utf8").replace(/^\uFEFF/, ""));
  console.log("phone in draft desc:", d.description.includes(PHONE));
  process.exit(d.description.includes(PHONE) ? 0 : 1);
}
const t = readFileSync("data/blog-articles.ts", "utf8");
const records = [...t.matchAll(/\{ slug: '([^']+)'[^}]*\}/g)].map((m) => {
  const s = m[0];
  const slug = m[1];
  const desc = (s.match(/desc: '([^']*)'/) || [])[1] || "";
  return { slug, desc };
});
if (process.argv[2] === "--all") {
  const noPhone = records.filter((r) => !r.desc.includes(PHONE));
  console.log("records:", records.length, "| without phone in desc:", noPhone.length);
  for (const r of noPhone) console.log(r.slug);
  process.exit(noPhone.length ? 1 : 0);
}
const slug = process.argv[2];
const r = records.find((x) => x.slug === slug);
if (!r) { console.log("NOT FOUND:", slug); process.exit(1); }
console.log("phone in desc:", r.desc.includes(PHONE));
console.log("desc:", r.desc);
process.exit(r.desc.includes(PHONE) ? 0 : 1);
