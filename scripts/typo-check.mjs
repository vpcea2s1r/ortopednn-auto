#!/usr/bin/env node
// Typo check for ortopednn-auto: mixed-script words, doubled words, broken punctuation,
// HTML tag balance, frontmatter integrity. Exit 1 on real issues.
import fs from "fs";
import path from "path";

const CYR = "\\u0400-\\u04FF";
const reMixed = new RegExp(`[A-Za-z][${CYR}][A-Za-z${CYR}]*|[${CYR}][A-Za-z][A-Za-z${CYR}]*`, "g");
const reDoubleWord = new RegExp(`\\b([а-яё]{1,3})\\s+\\1\\b`, "gi");
const reDblPunct = /[а-яёa-z0-9)]([,.!?]){2,}(?![.)])/gi;
// Legit latin/mixed terms used in dental content
const latinOK = /(All-on|CAD|CAM|CBCT|E-max|PMMA|MTA|КЛКТ|ВНЧС|AcryFree|Corega|Protefix|Lacalut|RDA|МКБ|et\s+al)/i;

function walk(dir, out) {
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch { return; }
  for (const f of entries) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) { if (!/node_modules|dist/.test(p)) walk(p, out); }
    else if (/\.(md|astro|ts)$/.test(f) && !f.endsWith("typo-check.mjs")) out.push(p);
  }
}

const files = [];
walk("src", files);
walk("data", files);

let issues = 0;
const seen = new Set();
const report = (type, file, s) => {
  const k = type + "|" + file + "|" + (s || "").toLowerCase();
  if (seen.has(k)) return;
  seen.add(k);
  console.log(type.padEnd(12), path.relative(".", file).padEnd(55), JSON.stringify(s));
  issues++;
};

for (const f of files) {
  let t;
  try { t = fs.readFileSync(f, "utf8"); } catch { continue; }
  if (t.charCodeAt(0) === 0xFEFF && f.endsWith(".md")) report("BOM", f, "<FEFF>");
  const clean = t
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/href="[^"]*"/g, " ")
    .replace(/<[^>]+>/g, " ");

  for (const m of clean.matchAll(reMixed)) {
    if (latinOK.test(m[0])) continue;
    report("MIXED-SCRIPT", f, m[0]);
  }
  for (const m of clean.matchAll(reDoubleWord)) {
    if (/\d/.test(m[0])) continue;
    report("DOUBLE-WORD", f, m[0].replace(/\s+/g, " "));
  }
  // DBL-PUNCT has too many legit hits (initials M.G., et al.) — report only outside quotes/citations
  if (f.endsWith(".md")) {
    for (const m of clean.matchAll(reDblPunct)) {
      const ctx = clean.slice(Math.max(0, m.index - 40), m.index + 10);
      if (/(al\.|R\.O\.C\.S|М\.Г|Ю\.[,\s]|Д\.[,\s]|К\.[,\s])/i.test(ctx)) continue;
      report("DBL-PUNCT", f, ctx.trim().slice(-35));
    }
  }
  // PRICE: concrete prices forbidden by SEO.md 1.1 (no numbers with currency)
  // data/pricing.json is the untouched source of truth (never rendered) — skip it
  if (!/pricing\.json$/.test(f)) {
    const rePrice = /₽|\bруб(лей|ля|ль|лем|лях|\.)?\b/gi;
    for (const m of clean.matchAll(rePrice)) {
      const ctx = clean.slice(Math.max(0, m.index - 30), m.index + 25);
      report("PRICE", f, (m[0] + " :: " + ctx).trim().replace(/\s+/g, " ").slice(-60));
    }
  }
}

// HTML tag balance in blog bodies + glossary data
function checkTags(label, body) {
  for (const tag of ["div", "ul", "ol", "table", "h2", "h3", "strong", "em", "a", "li"]) {
    const open = (body.match(new RegExp("<" + tag + "(\\s|>)", "g")) || []).length;
    const close = (body.match(new RegExp("</" + tag + ">", "g")) || []).length;
    if (open !== close) report("TAG-MISMATCH", label, `<${tag}> ${open}/${close}`);
  }
  const po = (body.match(/<p[ >]/g) || []).length, pc = (body.match(/<\/p>/g) || []).length;
  if (po !== pc) report("TAG-MISMATCH", label, `<p> ${po}/${pc}`);
}

const blogDir = "src/content/blog";
if (fs.existsSync(blogDir)) {
  for (const f of fs.readdirSync(blogDir)) {
    if (!f.endsWith(".md")) continue;
    let t = fs.readFileSync(path.join(blogDir, f), "utf8");
    if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
    const fm = t.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    checkTags(f, fm ? t.slice(fm[0].length) : t);
  }
}
const gp = "data/glossary-pages.ts";
if (fs.existsSync(gp)) {
  const g = fs.readFileSync(gp, "utf8");
  for (const m of g.matchAll(/body: `([\s\S]*?)`,/g)) checkTags(gp + ":" + m[1].slice(0, 24), m[1]);
}

console.log("---");
console.log(issues === 0 ? "OK: no typos found" : `FAIL: ${issues} issue(s)`);
process.exit(issues === 0 ? 0 : 1);