import rss from '@astrojs/rss';
import { articles } from '../../data/blog-articles';
import { getDzenItemData } from '../utils/rss-utils';

export const GET = async (context) => {
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return rss({
    title: 'Блог стоматолога-ортопеда | Никитина М.Г. | Нижний Новгород',
    description: 'Полезные статьи о протезировании зубов, имплантации, коронках, съёмных и бюгельных протезах. Советы стоматолога-ортопеда в Нижнем Новгороде.',
    site: context.site,
    xmlns: {
      content: 'http://purl.org/rss/1.0/modules/content/',
      media: 'http://search.yahoo.com/mrss/',
    },
    items: sortedArticles.map((article) => {
      const dzen = getDzenItemData(article.slug, article.title);
      return {
        title: article.title,
        pubDate: new Date(article.date),
        description: article.desc,
        link: `/blog/${article.slug}/`,
        customData: `
          <guid>${article.slug}</guid>
          <pdalink>https://ortopednn.ru/blog/${article.slug}/</pdalink>
          <enclosure url="${dzen.enclosure.url}" type="${dzen.enclosure.type}" length="${dzen.enclosure.length}" />
          <category>native-draft</category>
          <category>format-article</category>
          <media:rating scheme="urn:simple">nonadult</media:rating>
          <content:encoded><![CDATA[${dzen.content}]]></content:encoded>
        `.trim(),
      };
    }),
    customData: '<language>ru</language>',
  });
};
