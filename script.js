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

  /* --- Hero skyline video (lazy-loaded, performance-guarded) ---
     The poster image (hero.jpg) paints instantly and drives LCP; the video is
     never part of the critical path. We only fetch it *after* the page has
     loaded and the browser is idle, and we skip it entirely when it wouldn't be
     welcome: reduced-motion users, data-saver mode, and slow (2g) connections.
     Once it can play it fades in over the poster and loops silently. An
     IntersectionObserver pauses it while it's scrolled out of view and it pauses
     on hidden tabs, so it never wastes CPU, battery or bandwidth. */
  const heroVideo = document.querySelector(".hero__video");
  const heroSources = heroVideo ? heroVideo.querySelectorAll("source[data-src]") : [];
  if (heroVideo && heroSources.length) {
    const conn = navigator.connection || {};
    const allowed =
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !conn.saveData &&
      !/(^|-)2g$/.test(conn.effectiveType || "");

    if (allowed) {
      let started = false;
      const startLoad = () => {
        if (started) return;
        started = true;
        // Promote each <source> data-src -> src, then let the browser pick the
        // best format (WebM/VP9 where supported, MP4/H.264 fallback) and fetch.
        heroSources.forEach((s) => { s.src = s.dataset.src; });
        heroVideo.load();
        heroVideo.addEventListener(
          "canplay",
          () => {
            heroVideo.classList.add("is-playing");
            heroVideo.play().catch(() => {});
          },
          { once: true }
        );
      };
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
      if (document.readyState === "complete") idle(startLoad);
      else window.addEventListener("load", () => idle(startLoad), { once: true });

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!started) return;
              if (e.isIntersecting) heroVideo.play().catch(() => {});
              else heroVideo.pause();
            });
          },
          { threshold: 0.1 }
        );
        io.observe(heroVideo);
      }
      document.addEventListener("visibilitychange", () => {
        if (!started) return;
        if (document.hidden) heroVideo.pause();
        else heroVideo.play().catch(() => {});
      });
    }
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

  /* --- Quick contact: side tab, FAB, pop-up panel + assistant --- */
  const cPanel = document.getElementById("contactPanel");
  if (cPanel) {
    const fab = document.getElementById("fabBtn");
    const sideTab = document.getElementById("sideTab");
    const nudge = document.getElementById("fabNudge");
    const nudgeClose = document.getElementById("fabNudgeClose");
    const seen = (k) => { try { return sessionStorage.getItem(k); } catch (e) { return "1"; } };
    const mark = (k) => { try { sessionStorage.setItem(k, "1"); } catch (e) {} };
    const hideNudge = () => { if (nudge) nudge.hidden = true; };

    const setOpen = (open) => {
      cPanel.hidden = !open;
      fab.classList.toggle("is-open", open);
      fab.setAttribute("aria-expanded", String(open));
      if (sideTab) sideTab.setAttribute("aria-expanded", String(open));
      if (open) { hideNudge(); mark("gdc-nudged"); }
    };
    const toggle = () => setOpen(cPanel.hidden);
    fab.addEventListener("click", toggle);
    if (sideTab) sideTab.addEventListener("click", toggle);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !cPanel.hidden) setOpen(false); });

    /* gentle one-time nudge bubble (per browsing session) */
    if (nudge && !seen("gdc-nudged")) {
      setTimeout(() => { if (cPanel.hidden && !seen("gdc-nudged")) nudge.hidden = false; }, 12000);
      nudgeClose.addEventListener("click", (e) => { e.stopPropagation(); hideNudge(); mark("gdc-nudged"); });
      nudge.addEventListener("click", () => setOpen(true));
    }

    /* panel tabs */
    const tabQuote = document.getElementById("ctabQuote");
    const tabChat = document.getElementById("ctabChat");
    const paneQuote = document.getElementById("cpaneQuote");
    const paneChat = document.getElementById("cpaneChat");
    const pick = (chat) => {
      tabQuote.classList.toggle("is-active", !chat);
      tabChat.classList.toggle("is-active", chat);
      paneQuote.hidden = chat;
      paneChat.hidden = !chat;
      if (chat) bootChat();
    };
    tabQuote.addEventListener("click", () => pick(false));
    tabChat.addEventListener("click", () => pick(true));

    /* mini quote form — same delivery as the main contact form */
    const mini = document.getElementById("miniQuote");
    const mqNote = document.getElementById("mqNote");
    mini.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = mini.name.value.trim();
      const phoneNo = mini.phone.value.trim();
      mqNote.className = "cpanel__note";
      if (!name || !phoneNo) { mqNote.textContent = "Please add your name and number."; mqNote.classList.add("is-err"); return; }
      const key = mini.querySelector('[name="access_key"]');
      const configured = key && key.value && key.value.indexOf("YOUR_WEB3FORMS") === -1;
      if (!configured) {
        mqNote.textContent = "Thanks " + name + "! We'll call you back shortly.";
        mqNote.classList.add("is-ok");
        mini.reset();
        console.warn("[GDC] Quick-quote form is not configured: set a Web3Forms access_key.");
        return;
      }
      try {
        const res = await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: new FormData(mini) });
        const data = await res.json();
        mqNote.textContent = data.success ? "Thanks " + name + "! We'll call you back shortly." : "Sorry — something went wrong. Please call " + PHONE + ".";
        mqNote.classList.add(data.success ? "is-ok" : "is-err");
        if (data.success) mini.reset();
      } catch (err) {
        mqNote.textContent = "Network error — please call " + PHONE + ".";
        mqNote.classList.add("is-err");
      }
    });

    /* assistant — instant answers from a small on-page knowledge base.
       No external AI service: answers are limited to facts already on
       the site, and anything else is routed to a call or the form. */
    const ANSWERS = [
      { re: /(hello|^hi\b|^hey|good (morning|afternoon|evening))/i, text: "Hello! Ask me about our services, prices, coverage or accreditations — or tap a question below." },
      { re: /(price|cost|how much|quote|estimate|expensive)/i, text: "Every property is different, so we start with a free, no-obligation survey and give you a clear written quote — no pressure, no hidden costs.", link: ["/contact", "Request a free survey"] },
      { re: /(area|cover|where|location|travel|belfast|lisburn|derry|newry|bangor)/i, text: "We're based in Belfast and cover all of Northern Ireland, the Republic of Ireland and mainland UK." },
      { re: /(accredit|ssaib|bafe|certif|qualified|standard)/i, text: "We're SSAIB accredited for intruder alarms, CCTV and access control, and BAFE accredited for fire alarm systems — every installation is certificated." },
      { re: /(hour|open|what time|weekend)/i, text: "Office hours are Mon–Fri 8:30–17:00, and monitoring & emergency support runs 24/7, 365 days a year." },
      { re: /(emergency|urgent|fault|broken|not working|going off)/i, text: "For urgent help, call us right away — support is available 24 hours a day.", tel: true },
      { re: /(fire|smoke|detector)/i, text: "We design, install, commission and certify BAFE-accredited fire alarm systems, with servicing to keep you compliant.", link: ["/fire-safety#fire-alarms", "Fire alarm systems"] },
      { re: /(cctv|camera|surveillance)/i, text: "We install HD CCTV with night vision and secure remote viewing from your phone — cameras, recording and tidy cabling all handled.", link: ["/security-systems#cctv", "CCTV & surveillance"] },
      { re: /(intruder|burglar|alarm)/i, text: "We fit wired and wireless SSAIB-certificated intruder alarms, with monitored options for total peace of mind.", link: ["/security-systems#intruder-alarms", "Intruder alarms"] },
      { re: /(access|fob|keypad|door|intercom|entry|lock)/i, text: "We install access control, smart locks and audio/video door entry for homes, apartments and businesses.", link: ["/security-systems#access-control", "Access control"] },
      { re: /(monitoring|maintenance|servicing|call-?out|repair)/i, text: "We offer 24/7 monitoring, scheduled servicing and rapid call-outs to keep your systems live and compliant.", link: ["/fire-safety#fire-alarm-monitoring", "Monitoring & maintenance"] },
      { re: /(services|what do you (do|offer)|help with)/i, text: "We supply, install and maintain intruder alarms, CCTV, fire alarms, access control, door entry and 24/7 monitoring.", link: ["/services", "See all services"] },
      { re: /(human|person|someone|speak|talk|phone|call|ring)/i, text: "Of course — call us now, or pop your number in the “Get a quote” tab and we'll ring you back.", tel: true },
      { re: /(thank|cheers|great|perfect)/i, text: "You're welcome! Anything else I can help with?" },
    ];
    const log = document.getElementById("chatLog");
    const chipsBox = document.getElementById("chatChips");
    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const CHIPS = ["What services do you offer?", "How much will it cost?", "What areas do you cover?", "Are you accredited?"];
    let booted = false;

    const say = (who, text, link, tel) => {
      const m = document.createElement("div");
      m.className = "msg msg--" + who;
      m.textContent = text;
      if (tel) {
        m.appendChild(document.createTextNode(" "));
        const a = document.createElement("a");
        a.href = "tel:+442896223008";
        a.textContent = "Call " + PHONE;
        m.appendChild(a);
      }
      if (link) {
        m.appendChild(document.createTextNode(" "));
        const a = document.createElement("a");
        a.href = link[0];
        a.textContent = link[1] + " →";
        m.appendChild(a);
      }
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
    };
    const answer = (q) => {
      const hit = ANSWERS.find((a) => a.re.test(q));
      if (hit) say("bot", hit.text, hit.link, hit.tel);
      else say("bot", "I'm best with questions about our services, coverage, accreditations and quotes. For anything else, give us a call or request a free survey.", ["/contact", "Request a survey"], true);
    };
    const ask = (q) => { say("user", q); setTimeout(() => answer(q), 350); };
    const bootChat = () => {
      if (booted) return;
      booted = true;
      say("bot", "Hi! I'm the GDC assistant. Ask me anything about protecting your property — or tap a question:");
      CHIPS.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = c;
        b.addEventListener("click", () => ask(c));
        chipsBox.appendChild(b);
      });
    };
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = chatInput.value.trim();
      if (!q) return;
      chatInput.value = "";
      ask(q);
    });
  }

  /* --- Footer year --- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* --- Preselect the contact-form service from a ?service= link
         (e.g. the footer's "Log a service call") --- */
  const svcSelect = document.getElementById("service");
  if (svcSelect) {
    const want = new URLSearchParams(location.search).get("service");
    if (want) {
      const needle = want.replace(/-/g, " ").toLowerCase();
      const opt = [...svcSelect.options].find((o) => o.textContent.toLowerCase().includes(needle));
      if (opt) svcSelect.value = opt.value || opt.textContent;
    }
  }

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
