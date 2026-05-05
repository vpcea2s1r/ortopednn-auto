import { defineCollection, z } from 'astro:content';

export const collections = {
  districts: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      metro: z.array(z.string()).optional(),
      updated: z.string().or(z.date()).optional()
    })
  }),
  services: defineCollection({
    type: 'content',
    schema: z.object({
      title: z.string(),
      price: z.number().optional(),
      updated: z.string().or(z.date()).optional()
    })
  })
};