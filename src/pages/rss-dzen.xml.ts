import { articles } from '../../data/blog-articles';
import { getDzenItemData } from '../utils/rss-utils';

export const GET = async () => {
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = sortedArticles.map((article) => {
    const dzen = getDzenItemData(article.slug, article.title);
    const pubDate = new Date(article.date).toUTCString();
    const articleUrl = `https://ortopednn.ru/blog/${article.slug}/`;

    return `<item>
  <title><![CDATA[${article.title}]]></title>
  <link>${articleUrl}</link>
  <pdalink>${articleUrl}</pdalink>
  <guid>${article.slug}</guid>
  <pubDate>${pubDate}</pubDate>
  <description><![CDATA[${article.desc}]]></description>
  <enclosure url="${dzen.enclosure.url}" type="${dzen.enclosure.type}" length="${dzen.enclosure.length}"/>
  <category>native-draft</category>
  <category>format-article</category>
  <media:rating scheme="urn:simple">nonadult</media:rating>
  <content:encoded><![CDATA[${dzen.content}]]></content:encoded>
</item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>Блог стоматолога-ортопеда | Никитина М.Г. | Нижний Новгород</title>
  <link>https://ortopednn.ru/</link>
  <language>ru</language>
  <description>Полезные статьи о протезировании зубов, имплантации, коронках, съёмных и бюгельных протезах.</description>
${items}
</channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
