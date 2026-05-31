import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = path.resolve(process.cwd(), 'src/pages/blog');

export function getArticleBody(slug: string): string | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.astro`);
  if (!fs.existsSync(filePath)) return null;

  const content = fs.readFileSync(filePath, 'utf-8');

  const articleMatch = content.match(/<article>([\s\S]*?)<\/article>/);
  if (!articleMatch) return null;

  let body = articleMatch[1];

  // Remove Astro component tags (lines starting with < or containing Astro components)
  body = body.replace(/<RelatedArticles[\s\S]*?\/>/g, '');
  body = body.replace(/<RelatedServices[\s\S]*?\/>/g, '');
  body = body.replace(/<div class="cta"[\s\S]*?<\/div>/g, '');

  // Remove <!-- --> HTML comments
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  // Trim whitespace
  body = body.trim();

  return body || null;
}

export function getDzenItemData(slug: string, title: string) {
  const body = getArticleBody(slug);
  const imageUrl = 'https://ortopednn.ru/og-image.svg';
  const articleUrl = `https://ortopednn.ru/blog/${slug}/`;

  return {
    title,
    guid: slug,
    enclosure: { url: imageUrl, type: 'image/svg+xml', length: 0 },
    content: body
      ? `<p>${title}</p>${body}<p><a href="${articleUrl}">Читать на сайте ortopednn.ru</a></p>`
      : `<p>${title}</p><p><a href="${articleUrl}">Читать на сайте ortopednn.ru</a></p>`,
    customData: `
      <category>native-draft</category>
      <category>format-article</category>
    `.trim(),
  };
}
