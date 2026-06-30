# GDC Fire &amp; Security — Website

A modern, corporate rebuild of [gdcfiresec.com](https://www.gdcfiresec.com) for
**GDC Fire &amp; Security (NI) Ltd** — a family-run, multi-award-winning, SSAIB &amp;
BAFE accredited fire and security company based in Belfast, Northern Ireland.

Built as a fast, dependency-free static site (HTML + CSS + vanilla JS) — host it
anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages) with **zero build step**.

---

## 🎨 Brand &amp; design

Clean, professional **blue &amp; white** corporate identity — restrained, trustworthy
and easy to scan (no gimmicks).

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

### Layout (top → bottom)
1. **Top utility bar** — accreditation note + phone &amp; email
2. **Sticky white header** — logo, nav, phone + "Free survey" CTA
3. **Hero** — split: headline + CTAs on the left, "Why choose GDC?" facts card on the right
4. **Accreditation strip** — SSAIB · BAFE · award-winning badges
5. **Services** — clean 6-card grid (intruder, CCTV, fire, access, door entry, monitoring)
6. **About** — split with media panel + "30+ years" badge
7. **Sectors** — Residential vs Commercial cards
8. **Process** — 4-step survey-to-support timeline
9. **Stats band** (navy) — animated counters
10. **Testimonials**
11. **CTA band** (blue) — free survey prompt
12. **Contact** — details + enquiry form
13. **Footer** — multi-column corporate footer

Subtle, professional touches only: gentle scroll-reveal, animated stat counters,
sticky header shadow. Fully responsive + accessible (skip link, ARIA, keyboard,
`prefers-reduced-motion`).

---

## 🗂 Structure

```
GDC/
├── index.html     # All page sections (single page)
├── styles.css     # Blue/white corporate design system
├── script.js      # Header, mobile nav, reveal, counters, form
├── robots.txt
├── sitemap.xml
├── vercel.json    # Security headers + asset caching
└── assets/
    ├── favicon-64.png · apple-touch-icon.png · og-image.png
    ├── logo/        # gdc-mark.png, gdc-logo.png (official logo)
    └── photos/      # work/ gallery + about.jpg (drop-in slots)
```

See **`assets/README.md`** for the full drop-in guide.

---

## ⚠️ Still to add (from GDC)

The official **logo is integrated** and the brand blue is matched. Remaining:

- **Photography** — the Our Work gallery and About section have drop-in image
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

```bash
cd GDC
python3 -m http.server 8000
# visit http://localhost:8000
```

## 🌐 Deploy

Point Vercel / Netlify / Cloudflare Pages at this folder — no build command,
output directory = `GDC`.
