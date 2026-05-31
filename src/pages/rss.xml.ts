import rss from '@astrojs/rss';
import { articles } from '../../data/blog-articles';

export const GET = async (context) => {
  const sortedArticles = [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return rss({
    title: 'Блог стоматолога-ортопеда | Никитина М.Г. | Нижний Новгород',
    description: 'Полезные статьи о протезировании зубов, имплантации, коронках, съёмных и бюгельных протезах. Советы стоматолога-ортопеда в Нижнем Новгороде.',
    site: context.site,
    items: sortedArticles.map((article) => ({
      title: article.title,
      pubDate: new Date(article.date),
      description: article.desc,
      link: `/blog/${article.slug}/`,
    })),
    customData: '<language>ru</language>',
  });
};
