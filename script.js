/* GDC Fire & Security — interactions */
(function () {
  "use strict";

  const nav = document.getElementById("nav");
  const burger = document.getElementById("burger");
  const floatCta = document.querySelector(".float-cta");
  const PHONE = "028 9622 3008";

  /* --- Sticky nav state --- */
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-stuck", y > 20);
    if (floatCta) floatCta.classList.toggle("is-visible", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* --- Mobile menu --- */
  if (burger) {
    burger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
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
            e.target.style.transitionDelay = Math.min(i * 60, 240) + "ms";
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* --- Animated stat counters --- */
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const counters = document.querySelectorAll(".stat__num");
  const animate = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { animate(e.target); co.unobserve(e.target); }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((c) => co.observe(c));
  }

  /* --- Faux CCTV live timestamps --- */
  const clocks = document.querySelectorAll("[data-clock]");
  const cctvDate = document.querySelector("[data-date]");
  if (clocks.length || cctvDate) {
    const pad = (n) => String(n).padStart(2, "0");
    const tickClock = () => {
      const d = new Date();
      const t = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
      clocks.forEach((c) => (c.textContent = t));
      if (cctvDate) {
        cctvDate.textContent = d.toLocaleDateString(undefined, {
          weekday: "short", year: "numeric", month: "short", day: "numeric",
        });
      }
    };
    tickClock();
    setInterval(tickClock, 1000);
  }

  /* --- Pause CCTV animations while off-screen (saves mobile battery) --- */
  const cctvSection = document.querySelector(".cctv-section");
  if (cctvSection && "IntersectionObserver" in window) {
    const po = new IntersectionObserver(
      (entries) => entries.forEach((e) => cctvSection.classList.toggle("is-paused", !e.isIntersecting)),
      { threshold: 0 }
    );
    po.observe(cctvSection);
  }

  /* --- Interactive CCTV monitor --- */
  const cctv = document.getElementById("cctv");
  if (cctv) {
    const grid = cctv.querySelector(".cctv__grid");
    const feeds = Array.from(cctv.querySelectorAll(".feed"));
    const ctabs = Array.from(cctv.querySelectorAll(".ctab"));
    const backBtn = cctv.querySelector(".cctv__back");
    const flash = cctv.querySelector(".cctv__flash");
    const toast = cctv.querySelector(".cctv__toast");

    const setTabs = (view) =>
      ctabs.forEach((t) => {
        const on = t.dataset.view === view;
        t.classList.toggle("is-on", on);
        t.setAttribute("aria-pressed", String(on));
      });

    const showAll = () => {
      grid.classList.remove("is-focused");
      feeds.forEach((f) => f.classList.remove("is-active"));
      setTabs("all");
      if (backBtn) backBtn.hidden = true;
    };
    const focusCam = (i) => {
      grid.classList.add("is-focused");
      feeds.forEach((f) => f.classList.toggle("is-active", +f.dataset.cam === i));
      setTabs(String(i));
      if (backBtn) backBtn.hidden = false;
    };

    ctabs.forEach((t) =>
      t.addEventListener("click", () =>
        t.dataset.view === "all" ? showAll() : focusCam(+t.dataset.view)
      )
    );
    feeds.forEach((f) => {
      const act = () =>
        grid.classList.contains("is-focused") ? showAll() : focusCam(+f.dataset.cam);
      f.addEventListener("click", act);
      f.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); }
      });
    });
    if (backBtn) backBtn.addEventListener("click", showAll);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && grid.classList.contains("is-focused")) showAll();
    });

    /* Snapshot: flash + toast */
    const snap = cctv.querySelector('[data-action="snapshot"]');
    if (snap && flash) {
      let toastTimer;
      snap.addEventListener("click", () => {
        flash.classList.remove("fire");
        void flash.offsetWidth; /* restart animation */
        flash.classList.add("fire");
        if (toast) {
          toast.hidden = false;
          requestAnimationFrame(() => toast.classList.add("show"));
          clearTimeout(toastTimer);
          toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
        }
      });
    }
  }

  /* --- First-visit security-alert CTA --- */
  const intro = document.getElementById("introCta");
  if (intro) {
    const KEY = "gdc_seen_intro_v1";
    let seen = false;
    try { seen = localStorage.getItem(KEY) === "1"; } catch (e) {}

    const openIntro = () => {
      intro.hidden = false;
      requestAnimationFrame(() => intro.classList.add("is-open"));
    };
    const closeIntro = () => {
      intro.classList.remove("is-open");
      try { localStorage.setItem(KEY, "1"); } catch (e) {}
      setTimeout(() => { intro.hidden = true; }, 320);
    };

    if (!seen) setTimeout(openIntro, 1400);
    intro.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeIntro));
    const introCtaBtn = intro.querySelector("[data-cta]");
    if (introCtaBtn) introCtaBtn.addEventListener("click", closeIntro);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !intro.hidden) closeIntro();
    });
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
      note.className = "quote-form__note";

      if (!name || !phone) {
        note.textContent = "Please add your name and a contact number.";
        note.classList.add("is-err");
        return;
      }

      const keyField = form.querySelector('[name="access_key"]');
      const configured = keyField && keyField.value && keyField.value.indexOf("YOUR_WEB3FORMS") === -1;

      // Until a Web3Forms key is added, show a graceful confirmation (no enquiry is sent yet).
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
