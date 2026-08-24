import { readFileSync, existsSync } from "fs";
const slug = process.argv[2];
if (!slug) { console.log("usage: node check-links.mjs <slug> — no drafts to check" ); process.exit(0); }
if (!existsSync("data/drafts/" + slug + ".json")) { console.log(`draft not found: ${slug}`); process.exit(0); }
const d = JSON.parse(readFileSync("data/drafts/" + slug + ".json", "utf8").replace(/^\uFEFF/, ""));
const links = [...d.body.matchAll(/href="\/blog\/([^/]+)\//g)].map((m) => m[1]);
for (const l of links) console.log(l.padEnd(38), existsSync("src/content/blog/" + l + ".md") ? "OK" : "MISSING");