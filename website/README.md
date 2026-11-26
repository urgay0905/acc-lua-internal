# Veyro Digital website

The website for Veyro Digital. Plain HTML, CSS and JavaScript, so there's nothing to build or install.

- `index.html`: the main page
- `concepts.html`: the "Concepts for you" page
- `work/`: the six concept designs
- `assets/showcase/`: full-page images used by the scroll showcase
- `assets/`: logo, thumbnails, and the shared `site.css` and `site.js`

## Make it yours

Search `index.html` for these and replace them:

- **Business name**: Veyro Digital. The logo files are in `assets/` (`logo-mark.png` for the top bar and favicon, `logo.png` for the full logo).
- **Contact**: veyrodigital08@gmail.com and 07873 811503. The email appears in the contact section, the footer and `CONTACT_EMAIL` near the bottom of `index.html` (where the form sends messages).
- **Prices**: introductory launch prices in GBP (Starter £299, Business £699, Store £1,199+, care plan £25/month). Raise them in the Pricing section as you get clients.
- **Concept designs**: six example homepages for fictional businesses in `work/`, each with its own design and interactive feature. They share `work/base.css` (reset and animation helpers) and `work/motion.js` (scroll and button animation). Photos are in `assets/photos/` (see `CREDITS.md`).
- **Scroll showcase** (homepage Work section and `concepts.html`): full-page images of each concept in `assets/showcase/` (`*-m.jpg` are the phone versions). As you scroll, each page scrolls inside a browser frame, then slides to the next. If you change a concept, retake its full-page screenshot and replace its image.

## Preview

Open `index.html` in a browser.

## Publish for free

- **GitHub Pages**: Settings → Pages → deploy from a branch, and pick the folder that holds this file.
- **Netlify / Vercel / Cloudflare Pages**: drag this folder in, or connect the repo and set the publish directory to `website`.

Then connect your own domain in the host's settings.

## Contact form

The form opens the visitor's email app with their message filled in. To get messages without that step, point the form at a free form service such as Formspree or Netlify Forms.

## Animation

The site uses three free animation libraries, stored in `vendor/` so the site doesn't rely on another server: GSAP and ScrollTrigger for animations, and Lenis for smooth scrolling. All the motion lives in `assets/site.js`. It switches off automatically for visitors whose device is set to "reduce motion", and if a library fails to load the site still works without animation.
