# Veyro Digital website

A single-page site for a web design business. Everything (HTML, CSS, JS) is in `index.html`, so there's nothing to build or install.

## Make it yours

Search `index.html` for these and replace them:

- **Business name**: Veyro Digital. The logo files are in `assets/` (`logo-mark.png` for the top bar and favicon, `logo.png` for the full logo).
- **Contact**: veyrodigital08@gmail.com and 07873 811503. The email appears in the contact section, the footer and `CONTACT_EMAIL` near the bottom of `index.html` (where the form sends messages).
- **Prices**: introductory launch prices in GBP (Starter £299, Business £699, Store £1,199+, care plan £25/month). Raise them in the Pricing section as you get clients.
- **Work section**: three concept homepages for fictional businesses, in `work/` (each opens from its card on the main page; thumbnails are `assets/work-*.jpg`). They are labelled as concepts. Replace them with real client work as you finish it.

## Preview

Open `index.html` in a browser.

## Publish for free

- **GitHub Pages**: Settings → Pages → deploy from a branch, and pick the folder that holds this file.
- **Netlify / Vercel / Cloudflare Pages**: drag this folder in, or connect the repo and set the publish directory to `website`.

Then connect your own domain in the host's settings.

## Contact form

The form opens the visitor's email app with their message filled in. To get messages without that step, point the form at a free form service such as Formspree or Netlify Forms.
