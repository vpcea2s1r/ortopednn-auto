import { readFileSync, readdirSync } from "fs";

const freqFile = process.env.TEMP + "\\opencode\\suggestions-all.json";
const data = JSON.parse(readFileSync(freqFile, "utf8"));
const freq = data.freq || {};
const queries = Object.keys(freq);

const files = readdirSync("src/content/blog").filter((f) => f.endsWith(".md"));
const stop = ["zub", "zuby", "zuba", "desna", "protez", "protezy", "chelyust", "chelyusti", "pri", "posle", "chto", "kak", "delat", "esli", "i", "v", "na", "s", "ot", "po", "ili", "bolit", "bez", "dlya"];
const results = [];
for (const f of files) {
  const t = readFileSync("src/content/blog/" + f, "utf8");
  const body = t.split("---").slice(2).join("---").trim();
  const len = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().length;
  if (len >= 5500) continue;
  const words = f.replace(".md", "").split("-").filter((w) => w.length > 3 && !stop.includes(w));
  if (!words.length) continue;
  let matches = [];
  for (const q of queries) {
    const ql = q.toLowerCase();
    if (words.some((w) => ql.includes(w))) matches.push(q);
  }
  if (matches.length) results.push([f, len, matches.length, matches.slice(0, 5)]);
}
results.sort((a, b) => b[2] - a[2]);
console.log("thin with loose demand:", results.length);
for (const [f, len, n, m] of results.slice(0, 50)) {
  console.log(String(n).padStart(3), String(len).padStart(5), f, " | ", m.join("; "));
}