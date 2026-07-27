/* =========================================================
   Pixrweb Site Editor — per-site configuration.
   The editor engine (admin.js + admin.html) is identical on
   every Pixrweb site; only this file changes per project.
   ========================================================= */
window.PIXRWEB_EDITOR = {
  siteName: "GDC Fire & Security",

  /* repository this site lives in */
  owner: "ZextEU",
  repo: "Pixrweb",
  branch: "main",
  base: "GDC/", // folder within the repo ("" if the site is the repo root)

  pages: [
    { file: "index.html", label: "Home" },
    { file: "services.html", label: "Services" },
    { file: "fire-safety.html", label: "Fire safety" },
    { file: "security-systems.html", label: "Security" },
    { file: "fire-alarm-systems.html", label: "Fire alarm syste" },
    { file: "fire-extinguishers.html", label: "Fire extinguishe" },
    { file: "emergency-lighting.html", label: "Emergency lighti" },
    { file: "fire-risk-assessments.html", label: "Fire risk assess" },
    { file: "disabled-refuge.html", label: "Disabled refuge " },
    { file: "fire-alarm-monitoring.html", label: "Fire alarm monit" },
    { file: "intruder-alarms.html", label: "Intruder alarm s" },
    { file: "cctv.html", label: "CCTV systems" },
    { file: "access-control.html", label: "Access control &" },
    { file: "intruder-monitoring.html", label: "Intruder alarm m" },
    { file: "about.html", label: "About" },
    { file: "projects.html", label: "Projects" },
    { file: "sectors.html", label: "Sectors" },
    { file: "news.html", label: "News" },
    { file: "faq.html", label: "FAQs" },
    { file: "project-ramada-hotel.html", label: "Case: Ramada" },
    { file: "project-redeemer-central.html", label: "Case: Redeemer" },
    { file: "project-deichmann.html", label: "Case: Deichmann" },
    { file: "project-castleridge.html", label: "Case: Castleridge " },
    { file: "project-mellon.html", label: "Case: Mellon Prope" },
    { file: "project-kme.html", label: "Case: KME Steel" },
    { file: "project-branniff.html", label: "Case: Branniff Joi" },
    { file: "project-tobar-mhuire.html", label: "Case: Tobar Mhuire" },
    { file: "project-wing-it.html", label: "Case: Wing It NI" },
    { file: "project-applegreen.html", label: "Case: Applegreen N" },
    { file: "project-blackline.html", label: "Case: Blackline Pe" },
    { file: "project-diamond-complex.html", label: "Case: The Diamond " },
    { file: "project-branch-road.html", label: "Case: Branch Road " },
    { file: "contact.html", label: "Contact" },
  ],

  lists: [
    { page: "index.html", selector: ".projects", item: "a.project", label: "Featured projects", name: "Project" },
    { page: "index.html", selector: ".reviews-carousel", item: "figure.review", label: "Testimonials", name: "Testimonial" },
    { page: "index.html", selector: ".areas", item: "li", label: "Areas we cover", name: "Area", insertBefore: ".areas__more" },
    { page: "projects.html", selector: ".pgrid", item: "a.pcard", label: "Project cards", name: "Project" },
    { page: "about.html", selector: ".reviews", item: "figure.review", label: "Testimonials", name: "Testimonial" },
    { page: "services.html", selector: ".reviews", item: "figure.review", label: "Testimonials", name: "Testimonial" },
    { page: "contact.html", selector: ".faq", item: "details", label: "FAQs", name: "FAQ" },
    { page: "faq.html", selector: ".faq", item: "details", label: "FAQs", name: "FAQ" },
    { page: "news.html", selector: ".projects", item: "article.project", label: "News posts", name: "Post" },
  ],

  editable:
      "h1, h2, h3, summary, p, blockquote, figcaption, " +
    ".project__tag, .project__scope li, .areas li, " +
    ".svc-detail__list li, .split__list li, .hero__trust li, " +
    ".hero__facts strong, .hero__facts span, .contact__details strong, .contact__details span.v",

  /* -----------------------------------------------------------------
     Paid add-on gate. The editor is a £40/month option — clients must
     subscribe (Stripe) to unlock, or enter an unlock code Pixrweb
     issues after payment. The Pixrweb override code always works.

     Codes are stored as SHA-256 hashes (never plain text). Remove a
     client's hash below to re-lock them; the override stays.
     To add/change a code: open /admin?codes to hash a new one.
     ----------------------------------------------------------------- */
  access: {
    enabled: true,
    priceLabel: "£40 / month",
    blurb: "Unlock the website editor to change your own text and photos anytime, as often as you like.",
    // Stripe Buy Button (publishable key + button id are safe to be public):
    stripe: {
      buyButtonId: "buy_btn_1TvjcRKRT809tSnE8DpzwehM",
      publishableKey: "pk_live_51KnSxCKRT809tSnEx4JAmKAxUNT4QRNXEhB98ffN6jz9YNp1nA7oioRbpvc6WfxJ3I9M75jsaEUrfpvARczlzVAB00Gq8OCjJk",
    },
    // SHA-256 hashes of accepted unlock codes:
    unlockHashes: [
      "349084cdbb3e9f3d0e21f2cad3fb48f662921ef0461124848a3dffabafdeaaf5", // Pixrweb override (change me)
      "8eeabc3dec3892a6d50799835fe73d7a56a9101801b310a44952fe9c9fd403b5", // GDC client unlock code
    ],
  },
};
