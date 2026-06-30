# GDC Fire &amp; Security — Website

A modern, high-spec marketing website for **GDC Fire &amp; Security (NI) Ltd** — a
family-run, multi-award-winning fire and security company based in Belfast,
Northern Ireland, accredited by the **SSAIB** and **BAFE**.

A modernised rebuild of [gdcfiresec.com](https://www.gdcfiresec.com), built as a
fast, dependency-free static site (HTML + CSS + vanilla JS) so it can be hosted
anywhere — Vercel, Netlify, Cloudflare Pages, GitHub Pages or any basic web host —
with **zero build step**.

---

## 🎨 Brand &amp; design direction

| Token         | Value     | Use                                  |
|---------------|-----------|--------------------------------------|
| Safety red    | `#E4002B` | Primary accent, buttons, highlights  |
| Red (bright)  | `#FF3B30` | Live/alert indicators, glow          |
| Red (deep)    | `#B00020` | Hover states                         |
| Graphite ink  | `#0E1116` | Dark sections, hero, footer          |
| Paper         | `#F7F8FA` | Light background                     |
| **Headings**  | **Sora**  | Bold display type (Google Fonts)     |
| **Body**      | **Inter** | Clean, legible body text             |

**2026 styling cues used throughout:**

- Sticky **glassmorphism nav** that blurs &amp; inverts on scroll
- Bold oversized display type with an animated gradient highlight
- High-contrast **dark hero** with animated red glow + circuit-trace mask
- **Bento-style** services grid
- Split **security** and **fire** feature sections
- Interactive **live CCTV monitor** demo (4 animated camera feeds, click-to-zoom,
  live timestamps, snapshot flash)
- CSS-built **"24 hour CCTV in operation"** warning sign — a visible deterrent
- **Scroll-reveal** animations + animated stat counters
- First-visit **security-alert** modal + floating "Free estimate" CTA
- Accessible: skip link, ARIA, keyboard support, `prefers-reduced-motion`

---

## 🗂 Structure

```
GDC/
├── index.html     # All page sections (single page)
├── styles.css     # Design system + layout + responsive
├── script.js      # Nav, reveal, counters, CCTV demo, form
├── robots.txt
├── sitemap.xml
├── vercel.json    # Security headers + asset caching
└── assets/
    └── favicon.svg
```

### Page sections
1. **Nav** — wordmark, links, call/estimate CTAs, mobile menu
2. **Hero** — headline, value prop, CTAs, trust chips
3. **Stats** — animated counters (experience, 24/7, accreditations)
4. **Services** — intruder, CCTV, fire, access control, monitoring (bento grid)
5. **About** — family-run story
6. **Security** — feature section (alarms, CCTV, access, monitoring)
7. **Fire** — feature section (detection, extinguishers, emergency lighting)
8. **Live CCTV demo** — interactive multi-camera monitor + warning sign
9. **Why GDC** — trust differentiators
10. **Accreditations** — SSAIB / BAFE / insured / award-winning strip
11. **Process** — 4-step journey
12. **Reviews** — social proof
13. **FAQ** — accordion (with FAQ structured data)
14. **Contact** — details + estimate request form
15. **Footer**

---

## ✏️ Customise before launch

Real GDC details are already in place. Remaining items to wire up:

- **Contact form** — set a free [Web3Forms](https://web3forms.com) `access_key`
  in `index.html` (search `YOUR_WEB3FORMS_ACCESS_KEY`). Until then the form shows
  a friendly confirmation but does **not** send an enquiry.
- **Real photography** — drop hero / project images into `assets/` to add a
  photo gallery or hero background.
- **Brand logo** — the nav currently uses a styled "GDC" wordmark with a shield
  mark. Swap in the official logo image if preferred.
- **Stats** — adjust `data-count` values on `.stat__num` elements.
- **Address** — add the full registered address under the Contact section /
  JSON-LD if you'd like it shown.

> Contact details in place: **028 9622 3008** · **info@gdcfiresec.com** · Belfast,
> serving NI, ROI &amp; mainland UK.

---

## 🚀 Run locally

No tooling required — just open `index.html`, or serve it:

```bash
cd GDC
python3 -m http.server 8000
# visit http://localhost:8000
```

## 🌐 Deploy

- **Vercel / Netlify / Cloudflare Pages:** point at this folder — no build
  command, publish/output directory = `GDC`.
- **GitHub Pages:** push and enable Pages on the branch/folder.

---

## 📈 Next steps / ideas

- Add a real project photo gallery (before &amp; after installs).
- Dedicated service pages for SEO (e.g. `/cctv-belfast`, `/fire-alarms`).
- Embed real Google reviews + accreditation logos (SSAIB / BAFE).
- Connect the estimate form to email/CRM and add reCAPTCHA.
- Analytics + cookie consent before go-live.
