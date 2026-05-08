import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    price: z.number(),
  }),
});

const districts = defineCollection({
  type: 'content',
  schema: z.object({}),
});

export const collections = { services, districts };