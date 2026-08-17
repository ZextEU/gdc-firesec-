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
      // iOS/Safari only honour muted autoplay when muted is set as a *property*
      // (the HTML attribute alone is unreliable) and the element is inline.
      heroVideo.muted = true;
      heroVideo.setAttribute("muted", "");
      heroVideo.playsInline = true;
      // Reveal + play. The first play() after canplay is often rejected on iOS
      // until the media is buffered a little more, so we retry on the later
      // readiness events instead of giving up (which used to leave the poster
      // showing until a scroll re-triggered play via the observer).
      const tryPlay = () => {
        heroVideo.muted = true;
        const p = heroVideo.play();
        if (p && typeof p.then === "function") {
          p.then(() => heroVideo.classList.add("is-playing")).catch(() => {});
        } else {
          heroVideo.classList.add("is-playing");
        }
      };
      const startLoad = () => {
        if (started) return;
        started = true;
        // Promote ONLY the single best-supported format so the browser fetches
        // one file, not both. (Leaving both <source> src set can make some
        // engines download every format — doubling the payload.)
        let picked = false;
        heroSources.forEach((s) => {
          if (picked) return;
          if (heroVideo.canPlayType(s.type || "")) { s.src = s.dataset.src; picked = true; }
        });
        if (!picked && heroSources[0]) heroSources[0].src = heroSources[0].dataset.src;
        heroVideo.load();
        // Keep attempting across every readiness milestone until one sticks.
        ["loadeddata", "canplay", "canplaythrough"].forEach((ev) =>
          heroVideo.addEventListener(ev, tryPlay)
        );
        heroVideo.addEventListener("playing", () =>
          heroVideo.classList.add("is-playing")
        );
      };
      const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
      if (document.readyState === "complete") idle(startLoad);
      else window.addEventListener("load", () => idle(startLoad), { once: true });
      // A first touch/scroll counts as a user gesture — guarantees playback even
      // where muted autoplay is blocked (e.g. iOS Low Power Mode).
      ["touchstart", "scroll"].forEach((ev) =>
        window.addEventListener(ev, () => { startLoad(); tryPlay(); }, { once: true, passive: true })
      );

      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!started) return;
              if (e.isIntersecting) tryPlay();
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
        else tryPlay();
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

  /* --- Enquiry validation + submission guard -------------------------
     Both the contact-page form and the quick-quote panel post straight to
     Web3Forms; there is no server of ours in between. So everything here
     is about keeping malformed input and accidental double-taps out of
     the inbox — treat it as data hygiene, not a security boundary. The
     controls that actually stop a determined abuser are set on the
     Web3Forms side (hCaptcha, allowed domains, their own rate limits),
     because anyone can POST to their API without loading this page.

     What this does enforce, on every field that reaches an email:
       · length caps, so nothing unbounded is sent
       · a character allowlist per field type
       · no CR/LF or control characters, which are what mail-header and
         log-injection payloads rely on
       · the hidden honeypot, silently dropped if a bot ticks it       */
  const LIMIT = { name: 80, phone: 24, email: 254, message: 2000 };
  const RE = {
    // one @, a dotted domain, no spaces, quotes or angle brackets
    email: /^[^\s@<>"'\\;]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/,
    // digits plus the usual separators — the digit count is checked separately
    phone: /^[0-9+()\u2010-\u2015.\-\s]+$/,
    // a name should not contain markup, URLs or mail-header punctuation
    nameBad: /[<>{}[\]\\|`~^=*_@#$%]|https?:|www\./i,
  };
  // Strip C0/C1 control characters and collapse runs of whitespace.
  const clean = (s, keepBreaks) => {
    const stripped = String(s == null ? "" : s).replace(
      keepBreaks ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g : /[\u0000-\u001F\u007F-\u009F]/g,
      " "
    );
    return (keepBreaks ? stripped.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : stripped.replace(/\s+/g, " ")).trim();
  };
  const digitCount = (s) => (s.match(/\d/g) || []).length;

  /* Returns { ok, error, values } — values are the cleaned strings that
     should be sent, so the caller never forwards the raw input. */
  function validateEnquiry(form) {
    const get = (n) => (form.elements[n] ? form.elements[n].value : "");
    const v = {
      name: clean(get("name")).slice(0, LIMIT.name),
      phone: clean(get("phone")).slice(0, LIMIT.phone),
      email: clean(get("email")).slice(0, LIMIT.email),
      message: clean(get("message"), true).slice(0, LIMIT.message),
      service: clean(get("service")).slice(0, 80),
    };
    const fail = (error, field) => ({ ok: false, error, field, values: v });

    if (v.name.length < 2) return fail("Please add your name.", "name");
    if (RE.nameBad.test(v.name)) return fail("Please enter your name using letters only.", "name");

    if (!v.phone) return fail("Please add a contact number.", "phone");
    if (!RE.phone.test(v.phone) || digitCount(v.phone) < 7 || digitCount(v.phone) > 15)
      return fail("That number doesn't look right — please check it.", "phone");

    // Email is optional; validate it only when one was actually typed.
    if (v.email && !RE.email.test(v.email)) return fail("That email address doesn't look right.", "email");

    if (v.message.length > LIMIT.message)
      return fail("Please shorten your message a little.", "message");

    return { ok: true, values: v };
  }

  /* Honeypot: a hidden checkbox no human can see or tab to. If it is
     ticked the submission is dropped, but we still show the success
     message so a bot cannot tell it failed. */
  const trapped = (form) => !!(form.elements.botcheck && form.elements.botcheck.checked);

  /* Per-browser send throttle. Stops double-taps and casual hammering of
     the inbox; it is trivially bypassed by anyone who cares, which is why
     the real limit has to be configured at Web3Forms. */
  const SEND_KEY = "gdc-sent";
  const THROTTLE = { gapMs: 20000, perHour: 5 };
  function sendHistory() {
    let raw = "";
    try { raw = sessionStorage.getItem(SEND_KEY) || ""; } catch (e) { return []; }
    const cutoff = Date.now() - 3600000;
    return raw.split(",").map(Number).filter((t) => t && t > cutoff);
  }
  function throttleError() {
    const hist = sendHistory();
    if (hist.length >= THROTTLE.perHour)
      return "You've sent us a few requests already — please call " + PHONE + " and we'll pick it up straight away.";
    if (hist.length && Date.now() - hist[hist.length - 1] < THROTTLE.gapMs)
      return "That's already on its way to us — please give us a moment.";
    return null;
  }
  function recordSend() {
    try { sessionStorage.setItem(SEND_KEY, sendHistory().concat(Date.now()).join(",")); } catch (e) {}
  }

  /* Build the payload by hand from the validated values rather than
     posting the raw FormData, so only fields we know about are sent. */
  function enquiryPayload(form, values, extra) {
    const body = new FormData();
    ["access_key", "subject", "from_name"].forEach((k) => {
      if (form.elements[k]) body.append(k, form.elements[k].value);
    });
    Object.keys(values).forEach((k) => { if (values[k]) body.append(k, values[k]); });
    /* Reply-to so hitting Reply in the inbox goes to the enquirer. Only set it
       when an email was given (the field is optional) — an empty or malformed
       value would make Web3Forms reject the whole submission. The address has
       already passed RE.email, which bars the spaces, quotes, angle brackets
       and semicolons a header-injection attempt would need. */
    if (values.email) body.append("replyto", values.email);
    if (extra) Object.keys(extra).forEach((k) => body.append(k, extra[k]));
    return body;
  }

  const isConfigured = (form) => {
    const k = form.elements.access_key;
    return !!(k && k.value && k.value.indexOf("YOUR_WEB3FORMS") === -1);
  };

  async function deliver(form, values, extra) {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: enquiryPayload(form, values, extra),
    });
    const data = await res.json();
    return !!data.success;
  }

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
    let miniBusy = false;
    mini.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (miniBusy) return;
      mqNote.className = "cpanel__note";
      const say = (msg, ok) => { mqNote.textContent = msg; mqNote.classList.add(ok ? "is-ok" : "is-err"); };

      const check = validateEnquiry(mini);
      if (!check.ok) {
        say(check.error, false);
        const bad = mini.elements[check.field];
        if (bad && bad.focus) bad.focus();
        return;
      }
      const name = check.values.name;

      // Silently absorb bots so they get no signal to retry.
      if (trapped(mini)) { say("Thanks " + name + "! We'll call you back shortly.", true); mini.reset(); return; }

      const blocked = throttleError();
      if (blocked) return say(blocked, false);

      if (!isConfigured(mini)) {
        say("Sorry — the online form isn't available right now. Please call " + PHONE + " and we'll help straight away.", false);
        console.warn("[GDC] Quick-quote form is not configured: set a Web3Forms access_key.");
        return;
      }

      miniBusy = true;
      const btn = mini.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      mqNote.textContent = "Sending…";
      try {
        const ok = await deliver(mini, check.values, { subject_form: "Quick quote panel" });
        if (ok) { recordSend(); say("Thanks " + name + "! We'll call you back shortly.", true); mini.reset(); }
        else say("Sorry — something went wrong. Please call " + PHONE + ".", false);
      } catch (err) {
        say("Network error — please call " + PHONE + ".", false);
      } finally {
        miniBusy = false;
        if (btn) btn.disabled = false;
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
      { re: /(fire|smoke|detector)/i, text: "We design, install, commission and certify BAFE-accredited fire alarm systems, with servicing to keep you compliant.", link: ["/fire-alarm-systems", "Fire alarm systems"] },
      { re: /(cctv|camera|surveillance)/i, text: "We install HD CCTV with night vision and secure remote viewing from your phone — cameras, recording and tidy cabling all handled.", link: ["/cctv", "CCTV & surveillance"] },
      { re: /(intruder|burglar|alarm)/i, text: "We fit wired and wireless SSAIB-certificated intruder alarms, with monitored options for total peace of mind.", link: ["/intruder-alarms", "Intruder alarms"] },
      { re: /(access|fob|keypad|door|intercom|entry|lock)/i, text: "We install access control, smart locks and audio/video door entry for homes, apartments and businesses.", link: ["/access-control", "Access control"] },
      { re: /(monitoring|maintenance|servicing|call-?out|repair)/i, text: "We offer 24/7 monitoring, scheduled servicing and rapid call-outs to keep your systems live and compliant.", link: ["/fire-alarm-monitoring", "Monitoring & maintenance"] },
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
      // Questions are only ever matched against the table above and echoed
      // back through textContent, but cap and clean them anyway so nothing
      // unbounded or control-laden reaches the log.
      const q = clean(chatInput.value).slice(0, 300);
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
    let busy = false;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      note.className = "form__note";
      const say = (msg, ok) => { note.textContent = msg; note.classList.add(ok ? "is-ok" : "is-err"); };

      const check = validateEnquiry(form);
      if (!check.ok) {
        say(check.error, false);
        const bad = form.elements[check.field];
        if (bad && bad.focus) bad.focus();
        return;
      }
      const name = check.values.name;

      if (trapped(form)) { say("Thanks " + name + "! Request received — we'll be in touch shortly.", true); form.reset(); return; }

      const blocked = throttleError();
      if (blocked) return say(blocked, false);

      if (!isConfigured(form)) {
        say("Sorry — the online form isn't available right now. Please call " + PHONE + " or email us and we'll come straight back to you.", false);
        console.warn("[GDC] Contact form is not configured: set a Web3Forms access_key to deliver enquiries.");
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      busy = true;
      note.textContent = "Sending…";
      if (submitBtn) submitBtn.disabled = true;
      try {
        const ok = await deliver(form, check.values, { subject_form: "Contact page" });
        if (ok) {
          recordSend();
          say("Thanks " + name + "! Your request is in — we'll be in touch shortly.", true);
          form.reset();
        } else {
          say("Sorry — something went wrong. Please call " + PHONE + ".", false);
        }
      } catch (err) {
        say("Network error — please call " + PHONE + " or try again.", false);
      } finally {
        busy = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  /* --- Testimonials / generic carousel arrows --- */
  document.querySelectorAll("[data-carousel]").forEach((track) => {
    const scope = track.closest("section") || document;
    const prev = scope.querySelector("[data-carousel-prev]");
    const next = scope.querySelector("[data-carousel-next]");
    const step = () => {
      const card = track.querySelector(":scope > *");
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 20;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    if (prev) prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    if (next) next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));

    /* gentle continuous pan; clone cards for a seamless loop, pause on hover/touch */
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      const originals = [...track.children];
      originals.forEach((c) => {
        const cl = c.cloneNode(true);
        cl.setAttribute("aria-hidden", "true");
        cl.classList.remove("reveal");
        track.appendChild(cl);
      });
      let half = track.scrollWidth / 2;
      window.addEventListener("resize", () => { half = track.scrollWidth / 2; });
      let paused = false;
      let pos = track.scrollLeft; // float accumulator (scrollLeft itself rounds to int)
      const speed = 0.45; // px per frame ≈ a slow, readable drift
      const tick = () => {
        if (!paused && half) {
          pos += speed;
          if (pos >= half) pos -= half;
          track.scrollLeft = pos;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      ["mouseenter", "touchstart", "focusin", "pointerdown"].forEach((e) => track.addEventListener(e, () => { paused = true; }, { passive: true }));
      ["mouseleave", "touchend"].forEach((e) => track.addEventListener(e, () => { pos = track.scrollLeft; paused = false; }, { passive: true }));
    }
  });
})();
