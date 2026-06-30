# GDC website assets — drop your files here

The website is already wired to use the files below. **Just add a file with the
exact name shown and it appears automatically** — no code changes needed. Until a
file is added, the site shows an elegant branded placeholder (never a broken
image), so it always looks finished.

> Tip: keep photos in **landscape** orientation, good lighting, and export as JPG
> (or WebP) at the sizes below. Large files are fine — but compressing to roughly
> the listed size keeps the site fast.

---

## 1. Logo  → `assets/logo/`

| File | What it is | Recommended |
|------|-----------|-------------|
| `logo/gdc-logo.svg` *(or `.png`)* | Main logo, shown in the header & footer | SVG preferred, or PNG ~480×120, transparent background |

The header currently shows a styled **"GDC"** wordmark. As soon as `logo/gdc-logo.svg`
exists it replaces the wordmark automatically. If your logo is a PNG, name it
`logo/gdc-logo.png` and tell me (or change the `src` in `index.html`).

> If you can confirm your **exact brand blue** (hex or Pantone), send it over and
> I'll set the site's blue to match precisely.

---

## 2. Photos of your work  → `assets/photos/work/`

Shown in the **"Our Work"** gallery. Add up to six — fewer is fine, empty slots
just show a branded placeholder.

| File | Suggested subject |
|------|-------------------|
| `photos/work/work-1.jpg` | CCTV / camera installation |
| `photos/work/work-2.jpg` | Intruder alarm panel / keypad |
| `photos/work/work-3.jpg` | Fire alarm system |
| `photos/work/work-4.jpg` | Access control / door entry |
| `photos/work/work-5.jpg` | A finished commercial job |
| `photos/work/work-6.jpg` | A finished residential job |

Recommended: ~1200×800px landscape, ~200–400 KB each.

The captions in the gallery (e.g. "CCTV installation") can be edited in
`index.html` — search for `work-1.jpg` to find them.

---

## 3. About / team photo  → `assets/photos/`

| File | Where it shows | Recommended |
|------|----------------|-------------|
| `photos/about.jpg` | The "About GDC" section media panel | ~1000×750px landscape (4:3) |
| `photos/hero.jpg` *(optional)* | Reserved for a hero background if you want one later | ~1920×1080px |

A team shot, a van, or an engineer on site all work well here.

---

## 4. Accreditation logos *(optional)*  → `assets/accreditations/`

| File | What it is |
|------|-----------|
| `accreditations/ssaib.png` | Official SSAIB logo |
| `accreditations/bafe.png` | Official BAFE logo |

The SSAIB/BAFE badges are currently clean styled text. If you have the official
logo images, drop them here and tell me — I'll swap them into the accreditation
strip.

---

### How to add files
- **GitHub:** open this folder, choose *Add file → Upload files*, drag them in.
- Or send them to me here and I'll commit them for you.
