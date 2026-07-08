/* GDC Fire & Security — interactions (lightweight, no dependencies) */
(function () {
  "use strict";

  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const PHONE = "028 9622 3008";

  /* --- Header shadow on scroll --- */
  if (header) {
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --- Theme toggle (light / dark) ---
     The current theme is applied to <html data-theme> by an inline snippet in
     <head> (before first paint, from localStorage or the system preference).
     This button just flips it and remembers the choice. */
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    const root = document.documentElement;
    const label = () =>
      themeBtn.setAttribute(
        "aria-label",
        root.getAttribute("data-theme") === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    label();
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("gdc-theme", next); } catch (e) { /* private mode */ }
      label();
    });
  }

  /* --- Mobile menu --- */
  if (header && burger) {
    burger.addEventListener("click", () => {
      const open = header.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    header.querySelectorAll(".nav a").forEach((a) =>
      a.addEventListener("click", () => {
        header.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* --- Scroll reveal (staggered per group) ---
     Only opt in to the hidden-then-reveal behaviour when JS is running, motion
     is allowed and IntersectionObserver exists. Otherwise content stays visible
     (the hidden state is gated behind `.reveal-ready` on <html>). */
  const reveals = document.querySelectorAll(".reveal");
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reveals.length && !prefersReduced && "IntersectionObserver" in window) {
    // Cascade siblings: each .reveal gets an index within its parent, so grids
    // and lists animate in one-after-another rather than all at once.
    const counts = new Map();
    reveals.forEach((el) => {
      const parent = el.parentElement;
      const n = counts.get(parent) || 0;
      counts.set(parent, n + 1);
      el.style.setProperty("--ri", Math.min(n, 6));
    });
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* --- Animated stat counters --- */
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const counters = document.querySelectorAll(".stat__num");
  const animate = (el) => {
    const numNode = el.firstChild; // text node before the .suf span
    const target = +el.dataset.count;
    if (reduceMotion) { numNode.textContent = target.toLocaleString(); return; }
    const dur = 1300;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      numNode.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    // Start from 0 for JS users, then count up when scrolled into view.
    // (Without JS the real numbers stay in the HTML — never a misleading "0".)
    counters.forEach((c) => { if (c.firstChild) c.firstChild.textContent = "0"; });
    const co = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); co.unobserve(e.target); } }),
      { threshold: 0.6 }
    );
    counters.forEach((c) => co.observe(c));
  }

  /* --- Auto-upgrade photos ---
     Reveal a photo only once its file actually loads; if the file isn't there
     yet, the branded placeholder stays (no broken-image icons). Covers the
     Projects cards and the About photo. */
  const upgrade = (img) => {
    const ok = () => { if (img.naturalWidth > 0) img.classList.add("is-loaded"); };
    if (img.complete) ok();
    img.addEventListener("load", ok);
  };
  document.querySelectorAll("img[data-img]").forEach(upgrade);

  /* --- Footer year --- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* --- Quote form: validate + submit to Web3Forms --- */
  const form = document.getElementById("quoteForm");
  const note = document.getElementById("formNote");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      note.className = "form__note";

      if (!name || !phone) {
        note.textContent = "Please add your name and a contact number.";
        note.classList.add("is-err");
        return;
      }

      const keyField = form.querySelector('[name="access_key"]');
      const configured = keyField && keyField.value && keyField.value.indexOf("YOUR_WEB3FORMS") === -1;

      if (!configured) {
        note.textContent = "Thanks " + name + "! Request received — we'll be in touch shortly.";
        note.classList.add("is-ok");
        form.reset();
        console.warn("[GDC] Contact form is not configured: set a Web3Forms access_key to deliver enquiries.");
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      note.textContent = "Sending…";
      if (submitBtn) submitBtn.disabled = true;
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        const data = await res.json();
        if (data.success) {
          note.textContent = "Thanks " + name + "! Your request is in — we'll be in touch shortly.";
          note.classList.add("is-ok");
          form.reset();
        } else {
          note.textContent = "Sorry — something went wrong. Please call " + PHONE + ".";
          note.classList.add("is-err");
        }
      } catch (err) {
        note.textContent = "Network error — please call " + PHONE + " or try again.";
        note.classList.add("is-err");
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
})();
