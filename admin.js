/* =========================================================
   Pixrweb Site Editor — generic visual engine.
   The client sees their real page and clicks any text to edit
   it in place, or any photo to swap it. Edits are held in a
   parsed copy of each page and committed to GitHub on publish;
   Vercel then republishes automatically. No server, no database.
   Per-site settings live in admin-config.js.
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.PIXRWEB_EDITOR || {};
  const OWNER = CFG.owner, REPO = CFG.repo, BRANCH = CFG.branch || "main", BASE = CFG.base || "";
  const PAGES = CFG.pages || [], LISTS = CFG.lists || [], EDITABLE = CFG.editable || "h1, h2, h3, p";
  const API = "https://api.github.com";
  const TKEY = "pixr-admin-token", DKEY = "pixr-draft-", TOURKEY = "pixr-tour-seen";
  const SITE = CFG.siteName || "Your";

  document.getElementById("siteName").textContent = SITE;
  document.getElementById("barName").textContent = "editor";

  /* ---------- tiny DOM helpers ---------- */
  const $ = (s) => document.querySelector(s);
  const eln = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  function toast(msg, kind) {
    const t = $("#toast"); t.textContent = msg; t.className = "adm-toast show" + (kind ? " " + kind : "");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), kind === "err" ? 6000 : 3200);
  }
  function setLogin(msg, kind) { const n = $("#loginStatus"); n.textContent = msg; n.className = "adm-status" + (kind ? " " + kind : ""); }

  /* ---------- GitHub API (proven, unchanged behaviour) ---------- */
  let token = "";
  async function gh(path, opts) {
    return fetch(API + path, Object.assign({}, opts, {
      headers: Object.assign({ Authorization: "Bearer " + token, Accept: "application/vnd.github+json" }, (opts && opts.headers) || {}),
    }));
  }
  const b64encode = (str) => btoa(unescape(encodeURIComponent(str)));
  const b64decode = (str) => decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
  async function loadFile(path) {
    const res = await gh(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Could not load " + path + " (" + res.status + ")");
    return res.json();
  }
  async function saveFile(path, contentB64, sha, message) {
    const res = await gh(`/repos/${OWNER}/${REPO}/contents/${path}`, {
      method: "PUT", body: JSON.stringify({ message, content: contentB64, branch: BRANCH, sha: sha || undefined }),
    });
    if (!res.ok) throw new Error("Save failed (" + res.status + ")");
    return res.json();
  }

  /* ---------- state ---------- */
  const docs = {};        // file -> { doc, sha, original, dirty, undo: [] }
  let currentFile = null;
  let uid = 0;

  /* ---------- sign in ---------- */
  async function signIn(t, remember) {
    token = (t || "").trim();
    if (!token) return setLogin("Please paste your access key.", "err");
    setLogin("Checking key…");
    let res;
    try { res = await gh(`/repos/${OWNER}/${REPO}`); }
    catch (e) { return setLogin("Couldn't reach GitHub — check your internet connection and try again.", "err"); }
    if (!res.ok) {
      const why = res.status === 401
        ? "That key is invalid or expired (401). Check it was copied in full with no spaces, and hasn't passed its expiry date."
        : res.status === 404
        ? "The key works but can't see the website (404). When creating it, set the repository to “" + REPO + "” under Repository access → Only select repositories."
        : res.status === 403
        ? "GitHub refused access (403) — the account owner may need to approve the token, or it lacks access to this repository."
        : "GitHub returned an unexpected error (" + res.status + "). Please try again or contact Pixrweb.";
      token = ""; return setLogin(why, "err");
    }
    try { remember ? localStorage.setItem(TKEY, token) : localStorage.removeItem(TKEY); } catch (e) {}
    setLogin("Loading your site…");
    try {
      for (const p of PAGES) {
        const data = await loadFile(BASE + p.file);
        if (!data) throw new Error(p.file + " not found in the repository.");
        const html = b64decode(data.content);
        docs[p.file] = { doc: new DOMParser().parseFromString(html, "text/html"), original: html, sha: data.sha, dirty: false, undo: [] };
        stampIds(docs[p.file].doc);
      }
    } catch (err) { return setLogin(String(err.message || err), "err"); }
    // auto-discover any project-*.html not listed in config, so new case
    // studies always show up in the editor (this session and future ones)
    try {
      const dir = (BASE || "").replace(/\/$/, "");
      const res = await gh(`/repos/${OWNER}/${REPO}/contents/${dir || "."}?ref=${BRANCH}`);
      if (res.ok) {
        const files = await res.json();
        for (const f of files) {
          if (/^project-.+\.html$/.test(f.name) && !PAGES.some((p) => p.file === f.name)) {
            const data = await loadFile(BASE + f.name); if (!data) continue;
            const html = b64decode(data.content);
            docs[f.name] = { doc: new DOMParser().parseFromString(html, "text/html"), original: html, sha: data.sha, dirty: false, undo: [] };
            stampIds(docs[f.name].doc);
            const nm = f.name.replace(/^project-/, "").replace(/\.html$/, "").replace(/-/g, " ");
            PAGES.push({ file: f.name, label: "Case: " + nm.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 16) });
          }
        }
      }
    } catch (e) {}
    $("#signin").style.display = "none";
    $("#app").classList.add("on");
    $("#newCaseBtn").style.display = "";
    buildPageSelect();
    openPage(PAGES[0].file);
    maybeTour();
  }

  $("#loginBtn").addEventListener("click", () => signIn($("#tokenInput").value, $("#rememberChk").checked));
  $("#tokenInput").addEventListener("keydown", (e) => { if (e.key === "Enter") signIn($("#tokenInput").value, $("#rememberChk").checked); });
  $("#eyeBtn").addEventListener("click", () => {
    const i = $("#tokenInput"); const show = i.type === "password";
    i.type = show ? "text" : "password"; $("#eyeBtn").textContent = show ? "Hide" : "Show";
  });
  $("#logoutBtn").addEventListener("click", () => {
    if (anyDirty() && !confirm("You have unsaved changes. Log out and keep them saved as a draft on this device?")) return;
    try { localStorage.removeItem(TKEY); } catch (e) {}
    location.reload();
  });

  /* ---------- identify + stamp editable nodes ---------- */
  function isRichText(elm) { return [...elm.children].some((c) => c.matches && c.matches(EDITABLE) === false && c.textContent.trim() && c.tagName !== "svg" && c.tagName !== "SVG"); }
  function editableEls(doc) {
    const main = doc.querySelector("main"); if (!main) return [];
    return [...main.querySelectorAll(EDITABLE)].filter((e) => e.textContent.trim() && !e.querySelector(EDITABLE));
  }
  function stampIds(doc) {
    editableEls(doc).forEach((e) => { if (!e.hasAttribute("data-pxid")) e.setAttribute("data-pxid", "t" + ++uid); });
    doc.querySelectorAll("main img[data-img]").forEach((im) => { if (!im.hasAttribute("data-pxid")) im.setAttribute("data-pxid", "i" + ++uid); });
    LISTS.filter((l) => l.page && docsFileFor(doc) === l.page).forEach((l) => {
      const c = doc.querySelector(l.selector); if (!c) return;
      c.setAttribute("data-pxlist", l.name);
      [...c.querySelectorAll(":scope > " + l.item)].forEach((it) => { if (!it.hasAttribute("data-pxid")) it.setAttribute("data-pxid", "l" + ++uid); });
    });
  }
  function docsFileFor(doc) { for (const f in docs) if (docs[f].doc === doc) return f; return null; }

  /* ---------- page select + top bar ---------- */
  function buildPageSelect() {
    const sel = $("#pageSel"); sel.textContent = "";
    PAGES.forEach((p) => { const o = eln("option", null, p.label); o.value = p.file; sel.appendChild(o); });
    sel.addEventListener("change", () => openPage(sel.value));
  }
  function anyDirty() { return PAGES.some((p) => docs[p.file] && docs[p.file].dirty); }
  function refreshBar() {
    $("#pageSel").value = currentFile;
    const pub = $("#publishBtn"); pub.disabled = !anyDirty(); pub.classList.toggle("is-dirty", anyDirty());
    const d = docs[currentFile]; $("#undoBtn").disabled = !d || !d.undo.length;
  }

  /* ---------- render a page into the stage iframe ---------- */
  function openPage(file) {
    currentFile = file;
    refreshBar();
    $("#stageLoading").style.display = "grid";
    const old = $("#stage iframe"); if (old) old.remove();
    const frame = document.createElement("iframe");
    frame.className = "adm-frame"; frame.id = "frame";
    frame.setAttribute("sandbox", "allow-same-origin allow-popups");
    frame.srcdoc = renderHTML(docs[file].doc);
    frame.addEventListener("load", () => { $("#stageLoading").style.display = "none"; wireFrame(file, frame.contentDocument); });
    $("#stage").appendChild(frame);
    offerDraft(file);
  }

  /* serialise the parsed doc for the editing stage: strip scripts (keeps
     it stable while editing), add <base>, and inject the editor overlay CSS */
  function renderHTML(doc) {
    const clone = doc.cloneNode(true);
    clone.querySelectorAll("script").forEach((s) => s.remove());
    clone.querySelectorAll("video").forEach((v) => { v.removeAttribute("autoplay"); }); // calm the stage
    const head = clone.querySelector("head");
    const base = clone.createElement("base"); base.href = "/"; head.insertBefore(base, head.firstChild);
    const style = clone.createElement("style");
    style.textContent = EDITOR_CSS;
    head.appendChild(style);
    return "<!DOCTYPE html>\n" + clone.documentElement.outerHTML;
  }

  const EDITOR_CSS = `
    /* the live site reveals content + photos via JS which we strip for a
       stable editing stage, so force everything visible + freeze marquees */
    .reveal{ opacity:1 !important; transform:none !important; }
    .ph-img{ opacity:1 !important; }
    .clients-track, .accreds-track{ animation:none !important; transform:none !important; }
    [data-pxid]{ position:relative; }
    .pxedit-on [data-pxid]:not([contenteditable]):hover{ outline:2px dashed #0B5CAB; outline-offset:3px; cursor:text; }
    .pxedit-on img[data-pxid]:hover{ outline:2px dashed #0B5CAB; outline-offset:3px; cursor:pointer; }
    [contenteditable="true"]{ outline:3px solid #0B5CAB !important; outline-offset:3px; background:rgba(11,92,171,.06); border-radius:3px; cursor:text; }
    .pxphoto-badge{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:9; opacity:0; transition:opacity .15s; background:rgba(10,37,64,.55); color:#fff; font:700 14px/1 sans-serif; pointer-events:none; }
    .pxwrap-rel{ position:relative; }
    .pxwrap-rel:hover .pxphoto-badge{ opacity:1; }
    .pxlist-add,.pxlist-del{ position:absolute; z-index:12; font:700 13px/1 sans-serif; border:0; border-radius:999px; padding:7px 13px; cursor:pointer; box-shadow:0 4px 14px rgba(10,37,64,.25); }
    .pxlist-del{ top:6px; right:6px; background:#c0392b; color:#fff; opacity:0; transition:opacity .15s; }
    [data-pxid]:hover > .pxlist-del{ opacity:1; }
    .pxlist-add{ background:#0B5CAB; color:#fff; margin:14px auto; display:block; position:static; }
  `;

  /* ---------- wire the editing behaviour onto the iframe ---------- */
  function wireFrame(file, idoc) {
    idoc.documentElement.classList.add("pxedit-on");
    idoc.body.addEventListener("submit", (e) => e.preventDefault(), true);
    // stop navigation inside the editing stage
    idoc.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest("a"); if (a) e.preventDefault(); }, true);

    /* text: click to edit in place */
    idoc.querySelectorAll("[data-pxid^='t']").forEach((elm) => {
      elm.addEventListener("click", (e) => {
        if (elm.getAttribute("contenteditable") === "true") return;
        e.stopPropagation();
        beginEdit(file, elm);
      });
    });

    /* photos: click to replace */
    idoc.querySelectorAll("img[data-pxid^='i']").forEach((img) => {
      const wrap = img.parentElement;
      if (wrap && !wrap.querySelector(".pxphoto-badge")) {
        wrap.classList.add("pxwrap-rel");
        const badge = idoc.createElement("div"); badge.className = "pxphoto-badge"; badge.textContent = "📷 Click to change photo";
        wrap.appendChild(badge);
      }
      img.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); pickPhoto(file, img); });
    });

    /* lists: add / remove */
    idoc.querySelectorAll("[data-pxlist]").forEach((container) => {
      const conf = LISTS.find((l) => l.page === file && idoc.querySelector(l.selector) === container);
      if (!conf) return;
      [...container.querySelectorAll(":scope > " + conf.item)].forEach((item) => {
        item.style.position = item.style.position || "relative";
        const del = idoc.createElement("button"); del.className = "pxlist-del"; del.type = "button"; del.textContent = "✕ Remove";
        del.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); removeItem(file, conf, item.getAttribute("data-pxid")); });
        item.appendChild(del);
      });
      const add = idoc.createElement("button"); add.className = "pxlist-add"; add.type = "button"; add.textContent = "+ Add " + conf.name.toLowerCase();
      add.addEventListener("click", (e) => { e.stopPropagation(); e.preventDefault(); addItem(file, conf); });
      container.appendChild(add);
    });
  }

  /* ---------- inline text editing ---------- */
  function beginEdit(file, elm) {
    pushUndo(file);
    const simple = ![...elm.childNodes].some((n) => n.nodeType === 1 && n.tagName !== "svg" && n.tagName !== "SVG" && n.textContent.trim());
    try { elm.contentEditable = simple ? "plaintext-only" : "true"; }
    catch (e) { elm.contentEditable = "true"; }
    elm.focus();
    // place caret at click point / end
    const doc = elm.ownerDocument, sel = doc.getSelection();
    if (sel && sel.rangeCount === 0) { const r = doc.createRange(); r.selectNodeContents(elm); r.collapse(false); sel.addRange(r); }
    const commit = () => { elm.removeAttribute("contenteditable"); syncText(file, elm); };
    elm.addEventListener("blur", commit, { once: true });
    elm.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); elm.blur(); }
      if (e.key === "Enter" && elm.tagName !== "P" && elm.tagName !== "BLOCKQUOTE") { e.preventDefault(); elm.blur(); }
    });
  }

  function nonEmptyTextNodes(root) {
    const out = []; const w = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) if (n.nodeValue.trim()) out.push(n);
    return out;
  }

  function syncText(file, iframeEl) {
    const id = iframeEl.getAttribute("data-pxid");
    const target = docs[file].doc.querySelector('[data-pxid="' + id + '"]');
    if (!target) return;
    const src = nonEmptyTextNodes(iframeEl), dst = nonEmptyTextNodes(target);
    let changed = false;
    if (src.length === dst.length) {
      src.forEach((s, i) => {
        const lead = (dst[i].nodeValue.match(/^\s*/) || [""])[0], trail = (dst[i].nodeValue.match(/\s*$/) || [""])[0];
        const val = lead + s.nodeValue.trim().replace(/\s+/g, " ") + trail;
        if (val !== dst[i].nodeValue) { dst[i].nodeValue = val; changed = true; }
      });
    } else {
      // structure changed (a highlighted word was deleted) — fall back to plain text
      const flat = iframeEl.textContent.trim().replace(/\s+/g, " ");
      if (flat !== target.textContent.trim().replace(/\s+/g, " ")) { target.textContent = flat; changed = true; }
    }
    // keep SEO title/description in step when the H1 changes? no — explicit only.
    if (changed) { target.setAttribute("data-pixr-edited", ""); markDirty(file); }
    else { docs[file].undo.pop(); refreshBar(); } // nothing changed; drop the undo snapshot
  }

  /* ---------- photos ---------- */
  function pickPhoto(file, iframeImg) {
    const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
    input.addEventListener("change", () => { if (input.files && input.files[0]) uploadPhoto(file, iframeImg, input.files[0]); });
    input.click();
  }
  function uploadPhoto(file, iframeImg, blob) {
    const id = iframeImg.getAttribute("data-pxid");
    const src = iframeImg.getAttribute("src");
    toast("Optimising photo…");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = async () => {
        try {
          const MAX = 1600, scale = Math.min(1, MAX / image.width);
          const c = document.createElement("canvas"); c.width = Math.round(image.width * scale); c.height = Math.round(image.height * scale);
          c.getContext("2d").drawImage(image, 0, 0, c.width, c.height);
          const dataUrl = c.toDataURL("image/jpeg", 0.85), b64 = dataUrl.split(",")[1];
          const existing = await loadFile(BASE + src);
          await saveFile(BASE + src, b64, existing && existing.sha, "Update photo " + src + " via site editor");
          iframeImg.src = dataUrl;                             // instant preview in stage
          toast("Photo updated — live in about a minute.", "ok");
        } catch (err) { toast("Photo upload failed: " + (err.message || err), "err"); }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(blob);
  }

  /* ---------- add / remove list items ---------- */
  function addItem(file, conf) {
    pushUndo(file);
    const doc = docs[file].doc, container = doc.querySelector(conf.selector);
    const source = container.querySelector(":scope > " + conf.item + (conf.insertBefore ? ":not(" + conf.insertBefore + ")" : ""));
    if (!source) return toast("Couldn't find a card to copy.", "err");
    const clone = source.cloneNode(true);
    clone.removeAttribute("data-pxid"); clone.setAttribute("data-pixr-edited", "");
    clone.querySelectorAll("[data-pxid]").forEach((n) => n.removeAttribute("data-pxid"));
    const before = conf.insertBefore ? container.querySelector(conf.insertBefore) : null;
    container.insertBefore(clone, before);
    stampIds(doc);
    markDirty(file); reopen(file);
    toast("New " + conf.name.toLowerCase() + " added — edit its text or photo, then publish.", "ok");
  }
  function removeItem(file, conf, id) {
    const doc = docs[file].doc, container = doc.querySelector(conf.selector);
    const items = [...container.querySelectorAll(":scope > " + conf.item)];
    if (items.length <= 1) return toast("Keep at least one " + conf.name.toLowerCase() + ".", "err");
    if (!confirm("Remove this " + conf.name.toLowerCase() + "?")) return;
    pushUndo(file);
    const item = doc.querySelector('[data-pxid="' + id + '"]'); if (item) item.remove();
    markDirty(file); reopen(file);
    toast(conf.name + " removed.", "ok");
  }

  /* ---------- dirty / undo / drafts ---------- */
  function markDirty(file) { docs[file].dirty = true; refreshBar(); saveDraft(file); }
  function pushUndo(file) { const d = docs[file]; d.undo.push(serialise(d.doc, false)); if (d.undo.length > 40) d.undo.shift(); refreshBar(); }
  function reopen(file) { if (file === currentFile) openPage(file); }
  $("#undoBtn").addEventListener("click", () => {
    const d = docs[currentFile]; if (!d.undo.length) return;
    d.doc = new DOMParser().parseFromString(d.undo.pop(), "text/html"); stampIds(d.doc);
    d.dirty = !isPristine(currentFile); saveDraft(currentFile); reopen(currentFile);
    toast("Undone.");
  });
  function isPristine(file) { return serialise(docs[file].doc, true) === normalise(docs[file].original); }
  function normalise(html) { const d = new DOMParser().parseFromString(html, "text/html"); return serialise(d, true); }

  function saveDraft(file) {
    try { localStorage.setItem(DKEY + file, JSON.stringify({ sha: docs[file].sha, html: serialise(docs[file].doc, false), at: Date.now() })); } catch (e) {}
  }
  function clearDraft(file) { try { localStorage.removeItem(DKEY + file); } catch (e) {} }
  function offerDraft(file) {
    const banner = $("#draftBanner");
    let raw; try { raw = localStorage.getItem(DKEY + file); } catch (e) {}
    if (!raw || docs[file].dirty) { banner.classList.add("hidden"); return; }
    let draft; try { draft = JSON.parse(raw); } catch (e) { return; }
    if (!draft || draft.sha !== docs[file].sha) { clearDraft(file); banner.classList.add("hidden"); return; }
    if (serialise(docs[file].doc, false) === draft.html) { banner.classList.add("hidden"); return; }
    banner.classList.remove("hidden");
    $("#draftText").textContent = "You have unsaved changes to this page from last time.";
    $("#draftRestore").onclick = () => {
      docs[file].doc = new DOMParser().parseFromString(draft.html, "text/html"); stampIds(docs[file].doc);
      docs[file].dirty = true; banner.classList.add("hidden"); reopen(file); refreshBar(); toast("Draft restored.", "ok");
    };
    $("#draftDiscard").onclick = () => { clearDraft(file); banner.classList.add("hidden"); };
  }

  /* ---------- serialise ---------- */
  function serialise(doc, forSave) {
    const clone = doc.cloneNode(true);
    clone.querySelectorAll("[data-pxid]").forEach((n) => n.removeAttribute("data-pxid"));
    clone.querySelectorAll("[data-pxlist]").forEach((n) => n.removeAttribute("data-pxlist"));
    if (forSave) clone.querySelectorAll("[data-pixr-edited]").forEach((n) => n.removeAttribute("data-pixr-edited"));
    return "<!DOCTYPE html>\n" + clone.documentElement.outerHTML + "\n";
  }
  function changeCount(file) { return docs[file].doc.querySelectorAll("[data-pixr-edited]").length; }

  function syncFaqSchema(doc) {
    const items = [...doc.querySelectorAll(".faq details")].map((d) => ({
      "@type": "Question", name: (d.querySelector("summary") || {}).textContent ? d.querySelector("summary").textContent.trim() : "",
      acceptedAnswer: { "@type": "Answer", text: (d.querySelector("p") || {}).textContent ? d.querySelector("p").textContent.trim() : "" },
    }));
    if (!items.length) return;
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try { const j = JSON.parse(s.textContent); if (j["@type"] === "FAQPage") { j.mainEntity = items; s.textContent = "\n  " + JSON.stringify(j, null, 2).replace(/\n/g, "\n  ") + "\n  "; } } catch (e) {}
    });
  }

  /* ---------- preview (before / after) ---------- */
  function overlay(title) {
    const ov = eln("div", "adm-overlay"); const modal = eln("div", "adm-modal");
    const head = eln("div", "adm-modal__head"); head.appendChild(eln("strong", null, title));
    const close = eln("button", "adm-btn", "Close"); close.type = "button"; close.onclick = () => ov.remove();
    head.appendChild(close); modal.appendChild(head); ov.appendChild(modal);
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov); return { ov, modal };
  }
  $("#previewBtn").addEventListener("click", () => {
    const file = currentFile;
    const { modal } = overlay("Preview — " + label(file) + " · " + changeCount(file) + " change(s)");
    modal.appendChild(eln("p", "adm-modal__note", "Left: your site as it is live now. Right: after your edits, outlined in amber. Nothing is public until you press Save & publish."));
    const wrap = eln("div", "adm-compare");
    const pane = (cap, html, hi) => {
      const fig = document.createElement("figure"); fig.appendChild(eln("figcaption", hi ? "after" : "before", cap));
      const fr = document.createElement("iframe"); fr.setAttribute("sandbox", "allow-same-origin");
      html = html.replace("</head>", '<base href="/" />' + (hi ? '<style>[data-pixr-edited]{outline:3px dashed #F5A623 !important;outline-offset:3px;background:rgba(245,166,35,.12) !important;}</style>' : "") + "</head>");
      fr.srcdoc = html; fig.appendChild(fr); return fig;
    };
    wrap.appendChild(pane("Before — live now", docs[file].original, false));
    wrap.appendChild(pane("After — your edits", serialise(docs[file].doc, false), true));
    modal.appendChild(wrap);
  });

  /* ---------- publish ---------- */
  $("#publishBtn").addEventListener("click", () => {
    const dirty = PAGES.filter((p) => docs[p.file].dirty); if (!dirty.length) return;
    const { ov, modal } = overlay("Ready to publish?");
    modal.appendChild(eln("p", "adm-modal__note", "These pages will update on your live website:"));
    const list = eln("ul", "adm-modal__list");
    dirty.forEach((p) => list.appendChild(eln("li", null, p.label + " — " + changeCount(p.file) + " change(s)")));
    modal.appendChild(list);
    const lab = eln("label", "adm-confirm"); const tick = document.createElement("input"); tick.type = "checkbox";
    lab.appendChild(tick); lab.appendChild(document.createTextNode(" I'm happy for these changes to go live on the real website."));
    modal.appendChild(lab);
    const row = eln("div", "adm-modal__actions");
    const go = eln("button", "adm-btn adm-btn--primary", "Publish now"); go.type = "button"; go.disabled = true;
    tick.onchange = () => (go.disabled = !tick.checked);
    go.onclick = () => { ov.remove(); publish(dirty); };
    const keep = eln("button", "adm-btn", "Keep editing"); keep.type = "button"; keep.onclick = () => ov.remove();
    row.appendChild(go); row.appendChild(keep); modal.appendChild(row);
  });

  async function publish(dirty) {
    $("#publishBtn").disabled = true; toast("Publishing…");
    try {
      for (const p of dirty) {
        toast("Publishing " + p.label + "…");
        const d = docs[p.file];
        if (p.file === "contact.html" || p.file === "faq.html") syncFaqSchema(d.doc);
        const res = await saveFile(BASE + p.file, b64encode(serialise(d.doc, true)), d.sha, "Update " + p.label + " via site editor");
        d.sha = res.content.sha; d.dirty = false; d.undo = []; d.original = serialise(d.doc, true); clearDraft(p.file);
      }
      refreshBar();
      toast("Published! Your live site updates in about a minute.", "ok");
    } catch (err) { toast("Publish failed: " + (err.message || err) + " — please try again.", "err"); }
    finally { $("#publishBtn").disabled = !anyDirty(); }
  }
  const label = (file) => (PAGES.find((p) => p.file === file) || {}).label || file;

  window.addEventListener("beforeunload", (e) => { if (anyDirty()) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------- first-run guided tour ---------- */
  const TOUR = [
    { t: "Welcome to your editor 👋", p: "This is your real website. Let's take 20 seconds to show you around — you can't break anything." },
    { t: "Click any text to change it", p: "Hover over a heading or paragraph and it highlights. Click it, type your change, then click away. That's it." },
    { t: "Click a photo to swap it", p: "Hover a photo and you'll see “Click to change photo”. Pick a new image — it's resized for you automatically." },
    { t: "Switch pages up top", p: "Use the page dropdown to move between Home, About, Services and the rest." },
    { t: "Save & publish when you're done", p: "Your changes stay private until you press Save & publish. Then your live site updates in about a minute." },
  ];
  function maybeTour() { let seen; try { seen = localStorage.getItem(TOURKEY); } catch (e) {} if (!seen) runTour(0); }
  function runTour(i) {
    const prev = $("#tourRoot"); if (prev) prev.remove();
    if (i >= TOUR.length) { try { localStorage.setItem(TOURKEY, "1"); } catch (e) {} return; }
    const root = eln("div", "adm-tour"); root.id = "tourRoot";
    const scrim = eln("div", "adm-tour__scrim"); root.appendChild(scrim);
    const card = eln("div", "adm-tour__card");
    card.style.left = "50%"; card.style.top = "50%"; card.style.transform = "translate(-50%,-50%)";
    card.appendChild(eln("h4", null, TOUR[i].t));
    card.appendChild(eln("p", null, TOUR[i].p));
    const rowc = eln("div", "adm-tour__row");
    const dots = eln("div", "adm-tour__dots"); TOUR.forEach((_, k) => { const d = eln("i"); if (k === i) d.className = "on"; dots.appendChild(d); });
    rowc.appendChild(dots);
    const btns = eln("div"); btns.style.display = "flex"; btns.style.gap = "8px";
    const skip = eln("button", "adm-btn", "Skip"); skip.type = "button"; skip.onclick = () => runTour(TOUR.length);
    const next = eln("button", "adm-btn adm-btn--primary", i === TOUR.length - 1 ? "Start editing" : "Next"); next.type = "button"; next.onclick = () => runTour(i + 1);
    btns.appendChild(skip); btns.appendChild(next); rowc.appendChild(btns); card.appendChild(rowc);
    root.appendChild(card); document.body.appendChild(root);
  }

  /* ---------- new case study ---------- */
  const slugify = (s) => (s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "project";

  $("#newCaseBtn").addEventListener("click", () => {
    if (anyDirty() && !confirm("You have unsaved changes elsewhere. They'll be kept — continue and add a new case study?")) return;
    const { ov, modal } = overlay("Add a new case study");
    modal.appendChild(eln("p", "adm-modal__note", "Creates a new project page (with photo placeholders) and adds it to your Projects page. You can then edit the text and swap the photos like any other page."));
    const form = eln("div", "adm-newcase");
    const mk = (labelText, ph, tag) => {
      const w = eln("label", "adm-field"); w.appendChild(eln("span", null, labelText));
      const i = document.createElement(tag || "input"); if (tag !== "textarea") i.type = "text";
      i.placeholder = ph; i.className = "adm-newcase__in"; w.appendChild(i); form.appendChild(w); return i;
    };
    const nameI = mk("Project / site name", "e.g. The York, Portstewart");
    const sectorI = mk("Sector", "e.g. Commercial · Hospitality");
    const introI = mk("One-line summary", "e.g. Full CCTV and fire alarm upgrade for a busy seafront venue.", "textarea");
    modal.appendChild(form);
    const row = eln("div", "adm-modal__actions");
    const go = eln("button", "adm-btn adm-btn--primary", "Create case study"); go.type = "button";
    const cancel = eln("button", "adm-btn", "Cancel"); cancel.type = "button"; cancel.onclick = () => ov.remove();
    go.onclick = async () => {
      const name = nameI.value.trim(); if (!name) { nameI.focus(); return toast("Enter a project name.", "err"); }
      go.disabled = true; toast("Creating case study…");
      try { await createCaseStudy(name, sectorI.value.trim() || "Commercial", introI.value.trim()); ov.remove(); }
      catch (err) { toast("Couldn't create it: " + (err.message || err), "err"); go.disabled = false; }
    };
    row.appendChild(go); row.appendChild(cancel); modal.appendChild(row);
    nameI.focus();
  });

  async function createCaseStudy(name, sector, intro) {
    let slug = slugify(name), file = "project-" + slug + ".html", n = 2;
    while (docs[file]) { file = "project-" + slug + "-" + n + ".html"; n++; }
    slug = file.replace(/^project-/, "").replace(/\.html$/, "");

    const tmplFile = PAGES.map((p) => p.file).find((f) => /^project-/.test(f) && docs[f]);
    if (!tmplFile) throw new Error("no existing case study to base it on");
    const doc = docs[tmplFile].doc.cloneNode(true);
    doc.querySelectorAll("[data-pxid],[data-pxlist],[data-pixr-edited]").forEach((n) => { n.removeAttribute("data-pxid"); n.removeAttribute("data-pxlist"); n.removeAttribute("data-pixr-edited"); });

    const url = "https://www.gdcfiresec.com/" + file.replace(/\.html$/, "");
    const desc = intro || (name + " — a fire & security project by GDC Fire & Security.");
    const t = doc.querySelector("title"); if (t) t.textContent = name + " — Case Study | GDC Fire & Security";
    const can = doc.querySelector('link[rel="canonical"]'); if (can) can.setAttribute("href", url);
    doc.querySelectorAll('meta[property="og:url"]').forEach((m) => m.setAttribute("content", url));
    doc.querySelectorAll('meta[name="description"],meta[property="og:description"],meta[name="twitter:description"]').forEach((m) => m.setAttribute("content", desc));
    doc.querySelectorAll('meta[property="og:title"],meta[name="twitter:title"]').forEach((m) => m.setAttribute("content", name + " — Case Study | GDC Fire & Security"));

    const main = doc.querySelector("main");
    main.querySelectorAll("h1").forEach((h) => (h.textContent = name));
    // Only the page-hero breadcrumb eyebrow carries the sector — leave the
    // section eyebrows ("Client brief" / "Deliverables") intact so a new case
    // study keeps the same layout as the rest of the site.
    const heroEye = main.querySelector(".page-hero__inner .eyebrow, .page-hero .eyebrow");
    if (heroEye) {
      const a = heroEye.querySelector("a");
      if (a && a.nextSibling && a.nextSibling.nodeType === 3) a.nextSibling.textContent = " · " + sector;
      else if (a) a.insertAdjacentText("afterend", " · " + sector);
      else heroEye.textContent = sector;
    }
    const lead = main.querySelector(".page-hero__lead"); if (lead) lead.textContent = intro || "Add a short overview of this project.";
    const bodyP = [...main.querySelectorAll(".split__copy p")].filter((p) => !p.classList.contains("eyebrow") && !p.classList.contains("page-hero__lead"));
    // Placeholders for the Client brief (first two) then Deliverables (rest).
    const ph = [
      "Describe the client's brief — the site or building, the challenge, and what they needed protected.",
      "Add any extra context — constraints, timescales, or what mattered most to the client.",
      "Describe what GDC delivered — the systems designed, installed and commissioned for this project.",
      "Describe the outcome — the protection now in place and the ongoing support GDC provides.",
    ];
    bodyP.forEach((p, i) => (p.textContent = ph[i] || ph[ph.length - 1]));
    // Reset the "Systems installed" checklist to generic starters (it's editable).
    const sysList = main.querySelector(".svc-detail__list");
    if (sysList) {
      const generic = ["Fire detection", "CCTV & security", "Commissioning & certification", "Servicing & maintenance"];
      [...sysList.querySelectorAll("li")].filter((li) => !li.classList.contains("svc-detail__list-title")).forEach((li, i) => {
        const svg = li.querySelector("svg");
        li.textContent = "";
        if (svg) li.appendChild(svg);
        li.appendChild(doc.createTextNode(" " + (generic[i] || "System installed")));
      });
    }
    let pi = 0;
    main.querySelectorAll("img[data-img]").forEach((im) => { pi++; im.setAttribute("src", "assets/photos/projects/" + slug + "-" + pi + ".jpg"); im.setAttribute("data-img", ""); im.setAttribute("alt", name + " — GDC Fire & Security project"); });

    const html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML + "\n";
    await saveFile(BASE + file, b64encode(html), null, "Add case study: " + name + " (via site editor)");

    // add a card to the Projects page grid
    const pdoc = docs["projects.html"];
    if (pdoc && pdoc.doc.querySelector(".pgrid a.pcard")) {
      const grid = pdoc.doc.querySelector(".pgrid");
      const card = grid.querySelector("a.pcard").cloneNode(true);
      card.querySelectorAll("[data-pxid],[data-pixr-edited]").forEach((x) => { x.removeAttribute("data-pxid"); x.removeAttribute("data-pixr-edited"); });
      card.setAttribute("href", "/" + file.replace(/\.html$/, ""));
      const h = card.querySelector(".pcard__bar h3, h3"); if (h) h.textContent = name;
      const cimg = card.querySelector("img"); if (cimg) { cimg.setAttribute("src", "assets/photos/projects/" + slug + "-1.jpg"); cimg.setAttribute("alt", name + " — GDC Fire & Security project"); }
      grid.insertBefore(card, grid.firstElementChild);
      const body = serialise(pdoc.doc, true);
      const res = await saveFile(BASE + "projects.html", b64encode(body), pdoc.sha, "Add " + name + " to projects (via site editor)");
      pdoc.sha = res.content.sha; pdoc.original = body; pdoc.dirty = false; stampIds(pdoc.doc); clearDraft("projects.html");
    }

    // register + open the new page for editing
    docs[file] = { doc: new DOMParser().parseFromString(html, "text/html"), original: html, sha: null, dirty: false, undo: [] };
    try { const d = await loadFile(BASE + file); if (d) docs[file].sha = d.sha; } catch (e) {}
    stampIds(docs[file].doc);
    PAGES.push({ file, label: "Case: " + name.slice(0, 16) });
    buildPageSelect();
    openPage(file);
    toast("Case study created & live. Now edit the text and add photos.", "ok");
  }

  /* ---------- paid add-on gate ---------- */
  const ACCESS = CFG.access || {};
  const UKEY = "pixr-unlock";
  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function showOnly(id) {
    ["paywall", "signin", "codegen"].forEach((x) => { const n = $("#" + x); if (n) n.style.display = x === id ? "" : "none"; });
    $("#app").classList.remove("on");
  }
  function isUnlocked() {
    if (!ACCESS.enabled) return true;
    let s = ""; try { s = localStorage.getItem(UKEY) || ""; } catch (e) {}
    return !!s && (ACCESS.unlockHashes || []).includes(s);
  }
  function setPay(msg, kind) { const n = $("#payStatus"); if (n) { n.textContent = msg; n.className = "adm-status" + (kind ? " " + kind : ""); } }
  function setPaywallText() {
    $("#payName").textContent = SITE;
    if (ACCESS.priceLabel) $("#payPrice").textContent = ACCESS.priceLabel;
    if (ACCESS.blurb) $("#payBlurb").textContent = ACCESS.blurb;
    const mount = $("#subscribeMount");
    const st = ACCESS.stripe || {};
    if (st.buyButtonId && st.publishableKey && !/YOUR_/.test(st.buyButtonId)) {
      const bb = document.createElement("stripe-buy-button");
      bb.setAttribute("buy-button-id", st.buyButtonId);
      bb.setAttribute("publishable-key", st.publishableKey);
      mount.appendChild(bb);
    } else if (ACCESS.subscribeUrl && !/YOUR_/.test(ACCESS.subscribeUrl)) {
      const a = eln("a", "adm-btn adm-btn--primary", "Subscribe & unlock — " + (ACCESS.priceLabel || ""));
      a.href = ACCESS.subscribeUrl; a.target = "_blank"; a.rel = "noopener";
      a.style.cssText = "width:100%;justify-content:center;text-decoration:none"; mount.appendChild(a);
    } else {
      mount.appendChild(eln("p", "adm-status err", "Payment isn't switched on yet — please contact Pixrweb for your unlock code."));
    }
  }
  async function tryUnlock() {
    const code = ($("#codeInput").value || "").trim();
    if (!code) return setPay("Enter your unlock code.", "err");
    setPay("Checking…");
    let hash; try { hash = await sha256(code); } catch (e) { return setPay("This browser can't verify the code — make sure you're on the https version of the site.", "err"); }
    if ((ACCESS.unlockHashes || []).includes(hash)) {
      try { localStorage.setItem(UKEY, hash); } catch (e) {}
      setPay("Unlocked!", "ok"); startSignin();
    } else setPay("That code isn't right. Check it, or contact Pixrweb.", "err");
  }
  function startSignin() {
    showOnly("signin");
    let saved = ""; try { saved = localStorage.getItem(TKEY) || ""; } catch (e) {}
    if (saved) { $("#tokenInput").value = saved; signIn(saved, true); }
  }

  /* ---------- boot: code helper → gate → sign-in ---------- */
  (function boot() {
    if (/[?&]codes(\b|=)/.test(location.search)) {
      showOnly("codegen");
      const gi = $("#genInput"), go = $("#genOut");
      gi.addEventListener("input", async () => { go.value = gi.value ? await sha256(gi.value) : ""; });
      return;
    }
    if (isUnlocked()) return startSignin();
    setPaywallText();
    showOnly("paywall");
    $("#unlockBtn").addEventListener("click", tryUnlock);
    $("#codeInput").addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  })();
})();
