import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const slug = "atrofiya-kostnoj-tkani-chelyusti";
execSync("node scripts/check-desc.mjs --draft " + slug, { stdio: "inherit" });
console.log("phone in draft desc: OK");
const d = JSON.parse(readFileSync("data/drafts/" + slug + ".json", "utf8"));
const md =
  "---\nslug: " + d.slug + '\ntitle: "' + d.title + '"\ndate: "' + d.date + '"\ndesc: "' + d.description + '"\ncategory: ' + d.category + "\n---\n" + d.body + "\n";
writeFileSync("src/content/blog/" + slug + ".md", md, "utf8");
const b = readFileSync("src/content/blog/" + slug + ".md");
const raw = b.toString("utf8");
console.log("written", b.length, "bytes");
console.log("cyr:", (raw.match(/[\u0400-\u04FF]/g) || []).length);
console.log("bom:", b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf);
console.log("mojibake:", (raw.match(/[\u2500-\u25FF]/g) || []).length);