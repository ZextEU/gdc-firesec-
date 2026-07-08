# GDC Fire &amp; Security — Website

A modern, corporate rebuild of [gdcfiresec.com](https://www.gdcfiresec.com) for
**GDC Fire &amp; Security (NI) Ltd** — a family-run, multi-award-winning, SSAIB &amp;
BAFE accredited fire and security company based in Belfast, Northern Ireland.

Built as a fast, dependency-free static site (HTML + CSS + vanilla JS) — host it
anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages) with **zero build step**.

---

## 🎨 Brand &amp; design

Clean, professional **blue &amp; white** corporate identity — restrained, trustworthy
and easy to scan (no gimmicks). Includes a matching **dark theme**: it follows the
visitor's system preference automatically and can be toggled from the header
(choice remembered in `localStorage`, applied before first paint so there's no flash).

| Token        | Value     | Use                                  |
|--------------|-----------|--------------------------------------|
| Logo blue    | `#457BBB` | The GDC wordmark — matches the logo  |
| Navy         | `#0A2540` | Top bar, footer, headings, dark panels |
| Primary blue | `#0B5CAB` | Buttons, links, accents (AA-contrast) |
| Blue (light) | `#2E8BE6` | Highlights on dark                   |
| Blue tint    | `#EAF2FB` | Icon backgrounds, hero wash          |
| White / soft | `#FFFFFF` / `#F5F8FC` | Backgrounds              |
| **Headings** | **Barlow** | Strong, corporate display type      |
| **Body**     | **Inter**  | Clean, legible body text            |

The official GDC lion-shield logo is used in the header and footer (and on the
favicon, app icon and social-share image).

### Pages
| Page | URL | Contents |
|------|-----|----------|
| **Home** | `/` | Hero + facts card, accreditation strip, services overview, about teaser, 3 featured projects, sectors, stats band, testimonials, CTA |
| **Services** | `/services` | Detail panel per service (intruder, CCTV, fire, access, door entry, monitoring) with "what's included" lists + 4-step process |
| **About** | `/about` | Story split, values grid, SSAIB/BAFE accreditation cards, stats band |
| **Projects** | `/projects` | 6 mini case-study cards (photo, service tag, summary, deliverables) + process |
| **Contact** | `/contact` | Contact details, enquiry form, FAQ accordion (with FAQPage schema) |

Every page shares the top utility bar, sticky header (with active-page nav
state), CTA band and multi-column footer. URLs are extensionless via Vercel's
`cleanUrls` (`vercel.json`); each page has its own title, description,
canonical and Open Graph tags, and all pages are listed in `sitemap.xml`.

Subtle, professional touches only: gentle scroll-reveal, hero &amp; page-header
entrance cascades, animated stat counters, card hover lifts, sticky header
shadow, FAQ accordion. Fully responsive + accessible (skip link, ARIA, keyboard,
`prefers-reduced-motion` disables all motion).

**Local SEO**: per-page titles/descriptions/canonicals, LocalBusiness schema with
the NI towns served, BreadcrumbList schema on inner pages, FAQPage schema on
Contact, an "Areas we cover" section on the home page, and a full sitemap.

---

## 🗂 Structure

```
GDC/
├── index.html     # Home
├── services.html  # Services (detail per service + process)
├── about.html     # About (story, values, accreditations)
├── projects.html  # Projects (mini case studies)
├── contact.html   # Contact (form + FAQ)
├── styles.css     # Blue/white corporate design system
├── script.js      # Header, mobile nav, reveal, counters, form
├── robots.txt
├── sitemap.xml
├── vercel.json    # cleanUrls + security headers + asset caching
└── assets/
    ├── favicon-64.png · apple-touch-icon.png · og-image.png
    ├── logo/        # gdc-mark.png, gdc-logo.png (official logo)
    └── photos/      # work/ project photos + about.jpg (drop-in slots)
```

See **`assets/README.md`** for the full drop-in guide.

---

## ⚠️ Still to add (from GDC)

The official **logo is integrated** and the brand blue is matched. Remaining:

- **Photography** — the Projects section and About section have drop-in image
  slots (`assets/photos/...`). Add correctly-named files and they appear
  automatically; until then an on-brand placeholder shows. See `assets/README.md`.
- **Accreditation logos** — the SSAIB / BAFE badges are styled text; can swap in
  the official badge images if you have them.

> Contact details already in place: **028 9622 3008** · **info@gdcfiresec.com** ·
> Belfast, serving NI, ROI &amp; mainland UK.

---

## ✏️ Other launch steps

- **Contact form** — set a free [Web3Forms](https://web3forms.com) `access_key`
  in `index.html` (search `YOUR_WEB3FORMS_ACCESS_KEY`). Until then the form shows
  a friendly confirmation but does **not** send an enquiry.
- **Stats** — adjust `data-count` values on `.stat__num` elements.

---

## 🚀 Run locally

Internal links use clean URLs (`/services`, `/about`, …), so use a server that
resolves them to the matching `.html` file (as Vercel does in production):

```bash
npx serve GDC
# visit http://localhost:3000
```

## 🌐 Deploy

Point Vercel / Netlify / Cloudflare Pages at this folder — no build command,
output directory = `GDC`.
