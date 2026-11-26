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

## Publish for free (Netlify)

**Option A, drag and drop (about 2 minutes):**
1. Sign up free at app.netlify.com.
2. Go to *Sites → Add new site → Deploy manually*.
3. Drag the `website` folder (or the `veyro-website.zip` file) onto the page. Netlify gives you a live address like `veyro-digital.netlify.app`.

**Option B, connect GitHub (updates automatically):**
1. In Netlify choose *Add new site → Import an existing project → GitHub* and pick this repository and branch.
2. The `netlify.toml` file in the repo tells Netlify to publish the `website` folder, so there's nothing to configure.
3. Every time a change is pushed, the site updates by itself.

## Connect your own domain

1. Buy a domain, for example `veyrodigital.co.uk`. The easiest way is inside Netlify (*Domain management → Add a domain → Buy*): it sets everything up for you. You can also buy from Namecheap, Cloudflare or 123 Reg.
2. In Netlify go to *Domain management → Add a domain* and type your domain.
3. If you bought it elsewhere, Netlify shows you DNS records (or nameservers) to copy into your domain provider's settings. It can take up to 24 hours to switch over.
4. Netlify adds free HTTPS (the padlock) automatically.

## Contact form

The form sends each enquiry straight to veyrodigital08@gmail.com using FormSubmit (formsubmit.co), a free service with no account needed.

**One-time step:** the very first message sent from the live site triggers an email from FormSubmit asking you to activate the form. Click the link in that email, and every message after that arrives in your inbox. If you change your email address, update `CONTACT_EMAIL` near the bottom of `index.html`.

The form only sends from a live website. In the claude.ai preview it can't reach FormSubmit, so it shows an error and offers to open your email app instead.

## Animation

The site uses three free animation libraries, stored in `vendor/` so the site doesn't rely on another server: GSAP and ScrollTrigger for animations, and Lenis for smooth scrolling. All the motion lives in `assets/site.js`. It switches off automatically for visitors whose device is set to "reduce motion", and if a library fails to load the site still works without animation.
