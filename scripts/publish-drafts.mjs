import { readFileSync, writeFileSync } from "fs";
const slugs = ["zuby-po-nomeram", "retinirovannyj-zub-mudrosti"];
for (const slug of slugs) {
  const d = JSON.parse(readFileSync("data/drafts/" + slug + ".json", "utf8"));
  const md = "---\nslug: " + d.slug + "\ntitle: \"" + d.title + "\"\ndate: \"" + d.date + "\"\ndesc: \"" + d.description + "\"\ncategory: " + d.category + "\n---\n" + d.body + "\n";
  writeFileSync("src/content/blog/" + slug + ".md", md, "utf8");
  console.log("written", "src/content/blog/" + slug + ".md", md.length, "chars");
}
