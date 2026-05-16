import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    price: z.number(),
    slug: z.string(),
  }),
});

export const collections = { services };