import { readFileSync, existsSync } from "fs";
const slug = process.argv[2];
const t = readFileSync("src/content/blog/" + slug + ".md", "utf8");
const links = [...t.matchAll(/href="\/blog\/([^"]+)\//g)].map((m) => m[1]);
console.log("links:", links.length);
for (const l of links) console.log(l.padEnd(38), existsSync("src/content/blog/" + l + ".md") ? "OK" : "MISSING");