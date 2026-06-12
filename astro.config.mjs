import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production domain: www.executiveaiinstitute.com (public/CNAME). DNS is held
// by Jonscott; the Squarespace records point here once cut over from Wix.
export default defineConfig({
  site: 'https://www.executiveaiinstitute.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
