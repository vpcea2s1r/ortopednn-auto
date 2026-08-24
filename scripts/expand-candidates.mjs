import { readFileSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const { freq } = JSON.parse(readFileSync(join(tmpdir(), "opencode", "suggestions-all.json"), "utf8"));
const sugg = Object.entries(freq).sort((a, b) => b[1] - a[1]);

const blogDir = "src/content/blog";
const files = readdirSync(blogDir);

const articles = files.map((f) => {
  const t = readFileSync(join(blogDir, f), "utf8");
  const body = t.split("---").slice(2).join("---");
  const title = (t.split("\n").find((l) => /^title:/i.test(l)) || "").replace(/^title:\s*/i, "").trim();
  const desc = (t.split("\n").find((l) => /^desc:/i.test(l)) || "").replace(/^desc:\s*/i, "").replace(/^"|"$/g, "").trim();
  return { f, title, desc, body, len: body.length, text: (title + " " + body).toLowerCase() };
}).filter((a) => a.len < 6000);

function norm(q) {
  return q.toLowerCase().replace(/[^a-zа-я0-9ё]+/g, " ").trim();
}
const stop = new Set("зуб зубы зубов зубной зубные протез протезы протезов коронка коронки коронку цена цены стоимость отзывы фото сколько что это как какие какой какая какое где когда в на по из для или и с со не да при за нижнем новгороде нн можно ли надо нужно ли".split(" "));

console.log("Коротких статей (<6000 зн):", articles.length);
console.log("\n=== Кандидаты на расширение (статья + реальные подсказки) ===\n");

let shown = 0;
for (const a of articles) {
  // ищем подсказки, чьи значимые слова встречаются в статье
  const hits = [];
  for (const [q, n] of sugg) {
    const words = norm(q).split(" ").filter((w) => w.length > 3 && !stop.has(w));
    if (words.length < 2) continue;
    // подсказка релевантна статье, если все её слова есть в тексте статьи
    const all = words.every((w) => a.text.includes(w));
    if (all) hits.push({ q, n });
  }
  if (hits.length > 0) {
    shown++;
    console.log("[" + a.len + " зн] " + a.f.replace(/\.md$/, ""));
    console.log("   title: " + a.title.slice(0, 80));
    const top = hits.sort((x, y) => y.n - x.n).slice(0, 5);
    top.forEach((h) => console.log("   " + h.n + "x  " + h.q));
    console.log("");
    if (shown >= 40) break;
  }
}