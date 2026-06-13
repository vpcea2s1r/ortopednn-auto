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

// Dzen-compatible HTML sanitizer
// Allowed tags: p, a, b, i, u, s, h1-h4, blockquote, ul/ol li, figure, img, strong, em
function sanitizeForDzen(html: string): string {
  let result = html;

  // Remove unsupported elements: details, summary, table, div.table-wrap, div.translation, div.meta, span
  result = result.replace(/<details[\s\S]*?<\/details>/gi, '');
  result = result.replace(/<summary[\s\S]*?<\/summary>/gi, '');

  // Convert tables to lists
  result = result.replace(/<div class="table-wrap">\s*<table>([\s\S]*?)<\/table>\s*<\/div>/gi, (_, tableContent) => {
    const rows: string[] = [];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells.join(' — '));
    }
    return '<ul>' + rows.map(r => `<li>${r}</li>`).join('') + '</ul>';
  });

  // Remove standalone tables
  result = result.replace(/<table>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows: string[] = [];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length > 0) rows.push(cells.join(' — '));
    }
    return '<ul>' + rows.map(r => `<li>${r}</li>`).join('') + '</ul>';
  });

  // Convert div.translation to blockquote
  result = result.replace(/<div class="translation">([\s\S]*?)<\/div>/gi, '<blockquote>$1</blockquote>');

  // Remove div.meta
  result = result.replace(/<div class="meta">[\s\S]*?<\/div>/gi, '');

  // Remove any remaining div tags (but keep content)
  result = result.replace(/<\/?div[^>]*>/gi, '');

  // Remove span tags (keep content)
  result = result.replace(/<\/?span[^>]*>/gi, '');

  // Remove <strong> inside <li> (keep content, simplify)
  // Actually keep strong/em — they're allowed

  // Remove empty paragraphs
  result = result.replace(/<p>\s*<\/p>/gi, '');

  // Remove h1 tags (Dzen uses title from <title>, h1 is redundant)
  result = result.replace(/<\/?h1[^>]*>/gi, '');

  return result.trim();
}

export function getDzenItemData(slug: string, title: string) {
  const body = getArticleBody(slug);
  const imageUrl = 'https://ortopednn.ru/og-image-dzen.png';
  const articleUrl = `https://ortopednn.ru/blog/${slug}/`;

  const sanitizedBody = body ? sanitizeForDzen(body) : '';

  return {
    title,
    guid: slug,
    enclosure: { url: imageUrl, type: 'image/png', length: 54647 },
    content: sanitizedBody
      ? `<p>${title}</p>${sanitizedBody}<p><a href="${articleUrl}">Читать на сайте ortopednn.ru</a></p>`
      : `<p>${title}</p><p><a href="${articleUrl}">Читать на сайте ortopednn.ru</a></p>`,
    customData: `
      <category>native-draft</category>
      <category>format-article</category>
    `.trim(),
  };
}
