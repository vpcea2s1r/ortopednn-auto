import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/blog' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    date: z.string(),
    desc: z.string(),
    category: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
