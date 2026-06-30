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

  /* --- Scroll reveal --- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            e.target.style.transitionDelay = Math.min(i * 50, 200) + "ms";
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
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
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); co.unobserve(e.target); } }),
      { threshold: 0.6 }
    );
    counters.forEach((c) => co.observe(c));
  }

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
