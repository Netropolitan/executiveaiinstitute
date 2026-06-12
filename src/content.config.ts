import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Insights (blog) collection. No thumbnail/cover field on purpose: Insights is
// a text-only surface, so publishing a post never requires any artwork. Share
// previews use the site-wide og.png. Set `author` to jamie or jonscott; the
// byline and author card render from it.
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
