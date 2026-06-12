# Executive AI Institute — executiveaiinstitute.com

Static site for the Executive AI Institute. Astro 5 + three.js, dark
BBE-palette design system, deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs dist/
```

## Structure

- `src/pages/` — home, about, programs, coaching, roadmap (diagnostic), insights, events, contact, faq, privacy
- `src/content/blog/` — Insights articles (markdown). **Text-only, no thumbnails ever**: link previews use the site-wide `/og.png`. Frontmatter `author: jamie | jonscott` selects the byline.
- `src/components/HeroScene.astro` — three.js lattice hero (reduced-motion + no-WebGL fallbacks)

## Forms & integrations

The events list, subscribe band, leadership roadmap, contact form and reports
archive submit to a backend platform. The submission endpoints are configured
inside the relevant components/pages; all back-office management (events,
subscribers, contact messages, reports) is handled separately and is not part
of this repository.

## Deployment

Deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to
`main`. The custom domain is set via `public/CNAME`; enable "Enforce HTTPS" in
repo Settings → Pages once the certificate has been issued.
