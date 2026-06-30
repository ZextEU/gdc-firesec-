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
| Navy         | `#0A2540` | Top bar, footer, headings, dark panels |
| Brand blue   | `#0B5CAB` | Primary buttons, links, accents      |
| Blue (light) | `#2E8BE6` | Highlights on dark                   |
| Blue tint    | `#EAF2FB` | Icon backgrounds, hero wash          |
| White / soft | `#FFFFFF` / `#F5F8FC` | Backgrounds              |
| **Headings** | **Barlow** | Strong, corporate display type      |
| **Body**     | **Inter**  | Clean, legible body text            |

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
    └── favicon.svg
```

---

## ⚠️ Assets still to add (from GDC)

The live site blocks automated downloads, so the **official logo and photography
could not be pulled in automatically**. To finish the brand match, drop these into
`assets/` and wire them up:

- **Logo** — replace the styled "GDC" wordmark in the header/footer with the
  official logo (`<img src="assets/logo.svg">`). Confirm the exact brand blue
  and I'll set it precisely as a CSS variable.
- **Photography** — the About section has a placeholder media panel marked in
  `index.html` (search `split__panel`); swap it for a real photo
  (`<img class="split__panel" src="assets/about.jpg" alt="…">`). A hero photo can
  be added the same way.
- **Accreditation logos** — the SSAIB / BAFE badges are styled text; replace with
  the official badge images when available.

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
