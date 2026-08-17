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
state), CTA band, multi-column footer, and the **quick-contact system**: a
"Contact us" side tab (desktop) / floating button (mobile) opening a pop-up
panel with call/email actions, a mini quote form (same Web3Forms delivery as
the main form) and a **"Quick answers" assistant** — an instant, on-page bot
that answers questions about services, pricing, coverage, accreditations and
hours from a built-in knowledge base and routes everything else to a call or
the form (no external AI service, no data leaves the page). A gentle
"Need a free quote?" nudge appears once per session, and mobile gets a sticky
Call / Free quote action bar. URLs are extensionless via Vercel's
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

The site is the repository root — no build step, no sub-folder.

```
.
├── index.html     # Home
├── services.html  # Services (detail per service + process)
├── about.html     # About (story, values, accreditations)
├── projects.html  # Projects (mini case studies)
├── contact.html   # Contact (form + FAQ)
├── project-*.html # One page per case study (auto-discovered by the editor)
├── styles.css     # Blue/white corporate design system
├── script.js      # Header, mobile nav, reveal, counters, form
├── admin.html · admin.js · admin-config.js   # Client editor (see below)
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

## 🛠 Client editing — `/admin` (Pixrweb Site Editor)

The editor is now a **reusable Pixrweb product** in three files:

| File | Role |
|------|------|
| `admin.html` | UI shell — identical on every site |
| `admin.js`   | Engine — identical on every site |
| `admin-config.js` | **Per-site config** — the only file you edit |

### Adding the editor to any Pixrweb static site
1. Copy `admin.html`, `admin.js` and `admin-config.js` into the site folder.
2. Edit `admin-config.js`: `siteName`, `owner`/`repo`/`branch`/`base`,
   the `pages` list, any add/removable `lists`, and the `editable` selector.
3. Add `Disallow: /admin` to robots.txt. Done — `/admin` works.

### Foolproof features
- Search box to find any text on a page; SEO title/description length guides
- Per-page **Discard changes** (restores the loaded version), unsaved-change
  dots on tabs, leave-page warning
- **View this page ↗** link per tab; drag-and-drop or click photo replacement
  with automatic resize/compression
- Plain-language errors (sign-in explains exactly what's wrong with a key)
- **Pause switches** — see below

### Pause switches (temporarily closing a section)

The top bar carries a switch per entry in `locks` (`admin-config.js`) —
currently one: **Projects: live / paused**. Paused means every project card
(`a.pcard` on `/projects`, `a.project` on the home page) has its `href` parked
on `data-href` and gains `.is-locked`, `<body>` is stamped
`data-locked-projects`, and an editable `.lock-note` paragraph appears above
the grid. An `<a>` with no `href` is not a link, so the cards can't be clicked,
tabbed into or crawled — no runtime JS, no redirects. Switching back restores
every `href` byte-for-byte.

Cards stay visible (photo, name, a "Being updated" chip) so the page still
reads as a body of work. The case-study pages themselves remain reachable by
direct URL and are still in `sitemap.xml` — pausing hides the way in from the
site, not from Google.

Currently **paused** — GDC asked for the case studies to be closed on
17 Aug 2026 while the write-ups are corrected.

### Original notes


The site ships with its own lightweight CMS at **`/admin`** (hidden — not linked
anywhere, `noindex` + blocked in `robots.txt`). No server, no database: the
editor reads the live HTML from GitHub, presents it as simple form fields, and
commits changes back — Vercel republishes automatically (~1 min).

The client can:
- edit **every heading, paragraph, quote and chip** on all five pages (grouped by section)
- edit each page's **Google title & description**
- **add / remove / edit** projects, testimonials, FAQs and area chips
  (FAQ edits also re-sync the FAQPage schema automatically)
- **replace any photo** — images are auto-resized (max 1600px) and converted to JPEG

### Access setup (one-off, done by Pixrweb)
1. Create a GitHub **fine-grained personal access token**: Settings →
   Developer settings → Fine-grained tokens → *Only select repositories* →
   this repo → Repository permissions → **Contents: Read and write** (nothing else).
2. Give the token to the client — they paste it once at `/admin` (stored in
   their browser only).

> ✅ **Security note:** a Contents token grants write access to the *whole
> repository* it is scoped to. This site now has its own repository
> (`ZextEU/gdc-firesec-`) — split out of the Pixrweb multi-site repo — so a token
> issued for it can only ever touch GDC's own site, never any other client's.
> Scope every client token to *Only select repositories → this repo*, and never
> reuse a token issued for the old monorepo. Tokens can be revoked/rotated any
> time on GitHub.

---

## ✏️ Other launch steps

- **Contact form** — ✅ live. A [Web3Forms](https://web3forms.com) `access_key`
  is set on every page (38 fields across 37 files) and enquiries are delivered
  to **info@gdcfiresec.com**. To change the destination inbox, create a new key
  at web3forms.com and search/replace the current one. If a page is ever added
  with the `YOUR_WEB3FORMS_ACCESS_KEY` placeholder, its form refuses to send and
  points the visitor at the phone number rather than showing a false
  confirmation. Spam controls (domain allowlist, hCaptcha) live in the Web3Forms
  dashboard — see Security below.
- **Stats** — adjust `data-count` values on `.stat__num` elements.

---

## 🔒 Security

The site is static — HTML, CSS and one script on a CDN. There is no server, no
database and no first-party API, which decides what can and cannot be enforced
here.

### Enforced in this repo

| Control | Where |
|---|---|
| Content-Security-Policy (no `unsafe-inline` scripts; inline code pinned by SHA-256 hash) | `vercel.json` |
| `frame-ancestors`, `base-uri`, `object-src 'none'`, `form-action` allowlist | `vercel.json` |
| HSTS w/ preload, `nosniff`, Referrer-Policy, Permissions-Policy, COOP | `vercel.json` |
| `/admin` set to `no-store` + `noindex` | `vercel.json`, `robots.txt` |
| Enquiry validation — length caps, per-field character allowlists, control/CRLF stripping | `script.js` |
| Honeypot field, submit de-duplication, per-browser send throttle | `script.js` |
| Editor key in `sessionStorage`, 12h cap on "remember", 30-minute idle sign-out | `admin.js` |
| Editor upload checks — MIME allowlist, 12 MB cap, repo-path traversal guard | `admin.js` |
| Edited pages rendered with scripts stripped **and** an iframe sandbox with no `allow-scripts` | `admin.js` |

> **Changing an inline `<script>` or an `on…=` attribute in any page breaks the
> CSP** until its hash is updated in `vercel.json`. Hash the *committed* bytes
> (LF), not the Windows working copy (CRLF), or every page will silently fail to
> theme itself.

### Not enforceable here — configure it upstream

- **Rate limiting.** There is no endpoint of ours to limit. Enquiries go
  straight from the visitor's browser to `api.web3forms.com` with a public
  access key, so anyone can POST to that endpoint without ever loading this
  site. The throttle in `script.js` stops double-taps and casual abuse only.
  Real limits must be set in the **Web3Forms dashboard**: enable hCaptcha,
  restrict allowed domains to `gdcfiresec.com`, and set their spam/rate rules.
- **The `/admin` paywall is not a security control.** `isUnlocked()` compares a
  value in `localStorage` against `access.unlockHashes` in `admin-config.js` —
  and those hashes ship in this public repo, so the check can be satisfied by
  anyone who reads the file. It gates the *editor UI* only: publishing still
  requires a valid GitHub token, so a bypass costs revenue, not site integrity.
  Making it real needs a server-side check, which this architecture has no place
  for. The hashes are also unsalted SHA-256 of short codes — assume they are
  brute-forceable and do not reuse those codes anywhere else.
- **Repository access.** The editor's fine-grained token should be scoped to
  this repository only, with **Contents: Read and write** and nothing else, and
  given the shortest expiry the client will tolerate. Anyone holding it can
  publish to the live site.

---

## 🚀 Run locally

Internal links use clean URLs (`/services`, `/about`, …), so use a server that
resolves them to the matching `.html` file (as Vercel does in production):

```bash
npx serve .
# visit http://localhost:3000
```

## 🌐 Deploy

Point Vercel / Netlify / Cloudflare Pages at this repository — **no build
command**, root directory = repo root, output directory = repo root.
`vercel.json` supplies clean URLs, security headers and asset caching.
