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
    { file: "about.html", label: "About" },
    { file: "projects.html", label: "Projects" },
    { file: "sectors.html", label: "Sectors" },
    { file: "news.html", label: "News" },
    { file: "faq.html", label: "FAQs" },
    { file: "contact.html", label: "Contact" },
  ],

  lists: [
    { page: "index.html", selector: ".projects", item: "article.project", label: "Featured projects", name: "Project" },
    { page: "index.html", selector: ".reviews", item: "figure.review", label: "Testimonials", name: "Testimonial" },
    { page: "index.html", selector: ".areas", item: "li", label: "Areas we cover", name: "Area", insertBefore: ".areas__more" },
    { page: "projects.html", selector: ".projects", item: "article.project", label: "Project cards", name: "Project" },
    { page: "projects.html", selector: ".reviews", item: "figure.review", label: "Testimonials", name: "Testimonial" },
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
};
