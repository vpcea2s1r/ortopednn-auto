import { readFileSync } from "fs";
const slug = process.argv[2];
const d = JSON.parse(readFileSync("data/drafts/" + slug + ".json", "utf8").replace(/^\uFEFF/, ""));
const b = d.body;
const faqStart = b.indexOf('<div class="faq">');
const faqEnd = b.indexOf('<div class="cta">');
console.log("faq exists:", faqStart !== -1);
console.log("cta exists:", faqEnd !== -1);
if (faqStart !== -1 && faqEnd !== -1) {
  console.log("h3 in faq:", (b.slice(faqStart, faqEnd).match(/<h3>/g) || []).length);
}
console.log("cta has tel:", b.slice(faqEnd).includes("tel:+79202537317"));