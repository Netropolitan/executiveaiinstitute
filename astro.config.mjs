import { defineConfig } from 'astro/config';

// Site URL: the production domain is executiveaiinstitute.com (DNS held by
// Jonscott — switch the CNAME when publishing to GitHub Pages).
export default defineConfig({
  site: 'https://www.executiveaiinstitute.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
