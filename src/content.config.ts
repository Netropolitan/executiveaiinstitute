import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Insights (blog) collection. No thumbnail/cover field on purpose — covers are
// generated from the slug (see CoverArt.astro), so publishing a post never
// requires creating an image. Share previews use the site-wide og.png.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.enum(['jamie', 'jonscott']).default('jamie'),
    readMinutes: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
