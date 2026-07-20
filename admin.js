/* =========================================================
   Pixrweb Site Editor — generic engine (same on every site;
   per-site settings live in admin-config.js)
   Reads the live HTML pages from GitHub, presents the text as
   simple form fields (plus photo upload slots), and commits
   edits straight back to the repository — Vercel then
   republishes the site automatically. No server, no database.
   ========================================================= */
(function () {
  "use strict";

  /* ---- all per-site settings live in admin-config.js ---- */
  const CFG = window.PIXRWEB_EDITOR || {};
  const OWNER = CFG.owner, REPO = CFG.repo, BRANCH = CFG.branch || "main", BASE = CFG.base || "";
  const PAGES = CFG.pages || [], LISTS = CFG.lists || [], EDITABLE = CFG.editable || "h1, h2, h3, p";
  const API = "https://api.github.com";
  if (CFG.siteName) {
    const t = document.getElementById("siteName");
    if (t) t.textContent = CFG.siteName;
  }


  /* Repeatable groups the client can add / remove items in.
     `insertBefore` keeps trailing chips (e.g. "…and everywhere
     in between") at the end when new items are added. */

  /* Elements whose text the client may edit (inside <main> only —
     nav, buttons and links stay hands-off so nothing can break). */

  /* ---- state ---- */
  let token = "";
  const docs = {}; // file -> { doc, sha, dirty }
  let currentTab = null;

  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ---- GitHub API ---- */
  async function gh(path, opts) {
    const res = await fetch(API + path, Object.assign({}, opts, {
      headers: Object.assign({
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
      }, (opts && opts.headers) || {}),
    }));
    return res;
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
      method: "PUT",
      body: JSON.stringify({ message, content: contentB64, branch: BRANCH, sha: sha || undefined }),
    });
    if (!res.ok) throw new Error("Save failed (" + res.status + ")");
    return res.json();
  }

  /* ---- login ---- */
  const loginCard = $("#loginCard"), editor = $("#editor"), savebar = $("#savebar");
  const loginStatus = $("#loginStatus"), saveStatus = $("#saveStatus");

  function setStatus(node, msg, kind) {
    node.textContent = msg;
    node.className = "adm-status" + (kind ? " " + kind : "");
  }

  async function signIn(t) {
    token = t.trim();
    if (!token) return setStatus(loginStatus, "Please paste your access key.", "err");
    setStatus(loginStatus, "Checking key…");
    const res = await gh(`/repos/${OWNER}/${REPO}`);
    if (!res.ok) {
      const why =
        res.status === 401
          ? "GitHub says the key itself is invalid or expired (401). Check it was copied in full, with no spaces, and hasn't passed its expiry date."
          : res.status === 404
          ? "The key works, but it can't see the website repository (404). When creating the token, set Resource owner to “" + OWNER + "” and pick “" + REPO + "” under Repository access → Only select repositories."
          : res.status === 403
          ? "GitHub refused access (403) — the repository owner may need to approve fine-grained tokens, or the token lacks access to this repository."
          : "GitHub returned an unexpected error (" + res.status + "). Please try again or contact Pixrweb.";
      token = "";
      return setStatus(loginStatus, why, "err");
    }
    try { localStorage.setItem("gdc-admin-token", token); } catch (e) {}
    setStatus(loginStatus, "Loading pages…");
    try {
      for (const p of PAGES) {
        const data = await loadFile(BASE + p.file);
        if (!data) throw new Error(p.file + " not found");
        const html = b64decode(data.content);
        docs[p.file] = {
          doc: new DOMParser().parseFromString(html, "text/html"),
          original: html,
          sha: data.sha,
          dirty: false,
        };
      }
    } catch (err) {
      return setStatus(loginStatus, String(err.message || err), "err");
    }
    loginCard.classList.add("hidden");
    editor.classList.remove("hidden");
    savebar.classList.remove("hidden");
    $("#logoutBtn").classList.remove("hidden");
    buildTabs();
    openTab(PAGES[0].file);
  }

  $("#loginBtn").addEventListener("click", () => signIn($("#tokenInput").value));
  $("#tokenInput").addEventListener("keydown", (e) => { if (e.key === "Enter") signIn($("#tokenInput").value); });
  $("#logoutBtn").addEventListener("click", () => {
    try { localStorage.removeItem("gdc-admin-token"); } catch (e) {}
    location.reload();
  });

  /* ---- tabs ---- */
  function buildTabs() {
    const tabs = $("#tabs");
    tabs.textContent = "";
    for (const p of PAGES) {
      const b = el("button", "adm-tab", p.label);
      b.type = "button";
      b.dataset.file = p.file;
      b.appendChild(el("span", "dot", "●"));
      b.addEventListener("click", () => openTab(p.file));
      tabs.appendChild(b);
    }
    const photos = el("button", "adm-tab", "Photos");
    photos.type = "button";
    photos.dataset.file = "__photos__";
    photos.addEventListener("click", () => openTab("__photos__"));
    tabs.appendChild(photos);
  }

  function markDirty(file) {
    docs[file].dirty = true;
    refreshTabs();
    setStatus(saveStatus, "Unsaved changes on: " + PAGES.filter((p) => docs[p.file].dirty).map((p) => p.label).join(", "));
  }
  function refreshTabs() {
    document.querySelectorAll(".adm-tab").forEach((t) => {
      t.classList.toggle("is-active", t.dataset.file === currentTab);
      const d = docs[t.dataset.file];
      t.classList.toggle("is-dirty", !!(d && d.dirty));
    });
  }

  function openTab(file) {
    currentTab = file;
    refreshTabs();
    const panel = $("#panel");
    panel.textContent = "";
    if (file === "__photos__") buildPhotosPanel(panel);
    else buildPagePanel(panel, file);
  }

  /* ---- field engine ----
     Every editable element is broken into its visible text pieces
     (so icons and highlighted <span>s inside headings survive the
     edit untouched). Inputs write straight back into the parsed
     document; Save serialises it and commits. */
  function textPieces(elm) {
    const pieces = [];
    const walker = elm.ownerDocument.createTreeWalker(elm, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      const owner = n.parentElement && n.parentElement.closest(EDITABLE);
      if (owner !== elm) continue; // belongs to a nested editable element
      pieces.push(n);
    }
    return pieces;
  }

  function fieldFor(file, node, label) {
    const wrap = el("div", "adm-field");
    const raw = node.nodeValue;
    const lead = (raw.match(/^\s*/) || [""])[0];
    const trail = (raw.match(/\s*$/) || [""])[0];
    const value = raw.trim().replace(/\s+/g, " "); // collapse source-code line wrapping
    const long = value.length > 90;
    const input = document.createElement(long ? "textarea" : "input");
    if (!long) input.type = "text";
    input.value = value;
    const lab = el("label", null, label);
    wrap.appendChild(lab);
    wrap.appendChild(input);
    input.addEventListener("input", () => {
      node.nodeValue = lead + input.value + trail; // original spacing preserved
      if (node.parentElement) node.parentElement.setAttribute("data-pixr-edited", "");
      markDirty(file);
    });
    return wrap;
  }

  function labelFor(elm, i, total) {
    const tag = { H1: "Heading", H2: "Heading", H3: "Title", SUMMARY: "Question", P: "Text", BLOCKQUOTE: "Quote", FIGCAPTION: "Caption", LI: "Item", SPAN: "Tag" }[elm.tagName] || "Text";
    return total > 1 ? tag + " — part " + (i + 1) : tag;
  }

  function fieldsForElement(file, elm, container) {
    const pieces = textPieces(elm);
    pieces.forEach((node, i) => container.appendChild(fieldFor(file, node, labelFor(elm, i, pieces.length))));
  }

  function sectionName(elm, doc) {
    const sec = elm.closest("section");
    if (!sec) return "Page";
    const eyebrow = sec.querySelector(".eyebrow");
    if (eyebrow && eyebrow.textContent.trim()) return eyebrow.textContent.trim();
    const h = sec.querySelector("h1, h2");
    if (h && h.textContent.trim()) return h.textContent.trim().slice(0, 40);
    return sec.id || "Section";
  }

  function buildPagePanel(panel, file) {
    const doc = docs[file].doc;

    /* toolbar: preview link · field search · discard */
    const bar = el("div", "adm-toolbar");
    const view = el("a", "adm-mini", "View this page ↗");
    view.href = "/" + file.replace("index.html", "").replace(".html", "");
    view.target = "_blank"; view.rel = "noopener";
    bar.appendChild(view);
    const search = document.createElement("input");
    search.type = "search"; search.placeholder = "Find text on this page…"; search.className = "adm-search";
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      panel.querySelectorAll(".adm-field").forEach((f) => {
        const hit = !q || f.textContent.toLowerCase().includes(q) ||
          (f.querySelector("input,textarea") || {}).value?.toLowerCase().includes(q);
        f.style.display = hit ? "" : "none";
      });
      panel.querySelectorAll(".adm-group").forEach((g) => {
        const any = [...g.querySelectorAll(".adm-field")].some((f) => f.style.display !== "none");
        g.style.display = any ? "" : "none";
      });
    });
    bar.appendChild(search);
    const discard = el("button", "adm-mini adm-mini--danger", "Discard changes");
    discard.type = "button";
    discard.addEventListener("click", () => {
      if (!docs[file].dirty) return setStatus(saveStatus, "Nothing to discard on this page.");
      if (!confirm("Throw away your unsaved changes on this page?")) return;
      docs[file].doc = new DOMParser().parseFromString(docs[file].original, "text/html");
      docs[file].dirty = false;
      refreshTabs();
      setStatus(saveStatus, "Changes discarded — page restored.");
      openTab(file);
    });
    bar.appendChild(discard);
    const prev = el("button", "adm-mini adm-mini--accent", "Preview changes");
    prev.type = "button";
    prev.addEventListener("click", () => openPreview(file));
    bar.appendChild(prev);
    panel.appendChild(bar);
    const lists = LISTS.filter((l) => l.page === file);
    const listContainers = lists.map((l) => doc.querySelector(l.selector)).filter(Boolean);

    /* SEO group */
    const seo = el("div", "adm-group");
    seo.appendChild(el("h3", null, "Search result (SEO)"));
    const titleWrap = el("div", "adm-field");
    titleWrap.appendChild(el("label", null, "Browser / Google title"));
    const tCount = el("small", "adm-count");
    const tTick = () => { tCount.textContent = titleInput.value.length + " characters — aim for under 60"; tCount.classList.toggle("over", titleInput.value.length > 60); };
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = doc.title;
    titleInput.addEventListener("input", () => { doc.title = titleInput.value; docs[file].seoEdited = true; markDirty(file); tTick(); });
    titleWrap.appendChild(titleInput);
    titleWrap.appendChild(tCount); tTick();
    seo.appendChild(titleWrap);
    const metaDesc = doc.querySelector('meta[name="description"]');
    if (metaDesc) {
      const dWrap = el("div", "adm-field");
      dWrap.appendChild(el("label", null, "Google description"));
      const dInput = document.createElement("textarea");
      dInput.value = metaDesc.getAttribute("content") || "";
      const dCount = el("small", "adm-count");
      const dTick = () => { dCount.textContent = dInput.value.length + " characters — aim for 120–160"; dCount.classList.toggle("over", dInput.value.length > 160); };
      dInput.addEventListener("input", () => { metaDesc.setAttribute("content", dInput.value); docs[file].seoEdited = true; markDirty(file); dTick(); });
      dWrap.appendChild(dInput);
      dWrap.appendChild(dCount); dTick();
      seo.appendChild(dWrap);
    }
    panel.appendChild(seo);

    /* Regular sections (excluding list containers, rendered below) */
    const main = doc.querySelector("main");
    if (main) {
      let group = null, groupName = null;
      main.querySelectorAll(EDITABLE).forEach((elm) => {
        if (listContainers.some((c) => c.contains(elm))) return;
        if (!textPieces(elm).length) return;
        const name = sectionName(elm, doc);
        if (name !== groupName) {
          group = el("div", "adm-group");
          group.appendChild(el("h3", null, name));
          panel.appendChild(group);
          groupName = name;
        }
        fieldsForElement(file, elm, group);
      });
    }

    /* Add/remove lists */
    for (const list of lists) {
      const container = doc.querySelector(list.selector);
      if (!container) continue;
      const group = el("div", "adm-group");
      group.appendChild(el("h3", null, list.label + " — add or remove"));
      const items = [...container.querySelectorAll(":scope > " + list.item)];
      items.forEach((item, idx) => {
        const card = el("div", "adm-item");
        const bar = el("div", "adm-item__bar");
        bar.appendChild(el("strong", null, list.name + " " + (idx + 1)));
        const rm = el("button", "adm-mini adm-mini--danger", "Remove");
        rm.type = "button";
        rm.addEventListener("click", () => {
          if (items.length <= 1) return alert("Keep at least one " + list.name.toLowerCase() + ".");
          if (!confirm("Remove this " + list.name.toLowerCase() + "?")) return;
          item.remove();
          markDirty(file);
          openTab(file);
        });
        bar.appendChild(rm);
        card.appendChild(bar);
        item.querySelectorAll(EDITABLE).forEach((elm) => fieldsForElement(file, elm, card));
        if (!item.querySelectorAll(EDITABLE).length) fieldsForElement(file, item, card); // plain <li> chips
        group.appendChild(card);
      });
      const add = el("button", "adm-mini", "+ Add " + list.name.toLowerCase());
      add.type = "button";
      add.addEventListener("click", () => {
        const source = container.querySelector(":scope > " + list.item + (list.insertBefore ? ":not(" + list.insertBefore + ")" : ""));
        const clone = source.cloneNode(true);
        clone.setAttribute("data-pixr-edited", "");
        const img = clone.querySelector("img[data-img]");
        if (img) {
          const slot = nextPhotoSlot();
          img.setAttribute("src", slot);
          alert("New card added — it uses the new photo slot “" + slot + "”. Upload its photo in the Photos tab.");
        }
        const before = list.insertBefore ? container.querySelector(list.insertBefore) : null;
        container.insertBefore(clone, before);
        markDirty(file);
        openTab(file);
      });
      group.appendChild(add);
      panel.appendChild(group);
    }
  }

  /* ---- photos ---- */
  function photoSlots() {
    const slots = new Map(); // src -> { pages: [] }
    for (const p of PAGES) {
      docs[p.file].doc.querySelectorAll("img[data-img]").forEach((img) => {
        const src = img.getAttribute("src");
        if (!slots.has(src)) slots.set(src, { pages: [] });
        if (!slots.get(src).pages.includes(p.label)) slots.get(src).pages.push(p.label);
      });
    }
    return slots;
  }
  function nextPhotoSlot() {
    let max = 0;
    for (const src of photoSlots().keys()) {
      const m = src.match(/work-(\d+)\.jpg$/);
      if (m) max = Math.max(max, +m[1]);
    }
    return "assets/photos/work/work-" + (max + 1) + ".jpg";
  }

  function buildPhotosPanel(panel) {
    const intro = el("div", "adm-group");
    intro.appendChild(el("h3", null, "Photos"));
    const note = el("p", null, "Click “Replace photo” under any slot and choose an image — it's resized automatically and goes live in about a minute. Landscape photos work best.");
    note.style.color = "var(--slate)";
    note.style.fontSize = ".93rem";
    intro.appendChild(note);
    panel.appendChild(intro);

    const grid = el("div", "adm-photos");
    for (const [src, info] of photoSlots()) {
      const card = el("div", "adm-photo");
      const ph = el("div", "ph");
      const img = document.createElement("img");
      img.src = src + "?v=" + Date.now();
      img.alt = "";
      img.onerror = () => img.remove(); // placeholder slot with no photo yet
      ph.appendChild(img);
      card.appendChild(ph);
      const meta = el("div", "meta");
      const code = el("code", null, src.replace("assets/photos/", ""));
      meta.appendChild(code);
      meta.appendChild(el("small", null, "Used on: " + info.pages.join(", ")));
      const btn = el("label", "adm-mini", "Replace photo");
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.style.display = "none";
      fileInput.addEventListener("change", () => {
        if (fileInput.files && fileInput.files[0]) uploadPhoto(fileInput.files[0], src, img, ph, btn);
      });
      btn.appendChild(fileInput);
      meta.appendChild(btn);
      card.appendChild(meta);
      ["dragover", "dragleave", "drop"].forEach((ev) =>
        card.addEventListener(ev, (e) => {
          e.preventDefault();
          card.classList.toggle("is-drop", ev === "dragover");
          if (ev === "drop" && e.dataTransfer.files[0]) uploadPhoto(e.dataTransfer.files[0], src, img, ph, btn);
        }));
      grid.appendChild(card);
    }
    panel.appendChild(grid);
  }

  function uploadPhoto(file, src, imgEl, ph, btn) {
    btn.firstChild.nodeValue = "Uploading…";
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = async () => {
        try {
          /* resize to a sensible web size + convert to JPEG */
          const MAX = 1600;
          const scale = Math.min(1, MAX / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const b64 = dataUrl.split(",")[1];
          const existing = await loadFile(BASE + src);
          await saveFile(BASE + src, b64, existing && existing.sha, "Update photo " + src + " via site editor");
          if (!imgEl.isConnected) ph.appendChild(imgEl);
          imgEl.src = dataUrl; // instant preview
          btn.firstChild.nodeValue = "Replace photo";
          setStatus(saveStatus, "Photo saved — live in about a minute.", "ok");
        } catch (err) {
          btn.firstChild.nodeValue = "Replace photo";
          setStatus(saveStatus, "Photo upload failed: " + (err.message || err), "err");
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---- save ---- */
  function syncFaqSchema(doc) {
    const items = [...doc.querySelectorAll(".faq details")].map((d) => ({
      "@type": "Question",
      name: (d.querySelector("summary") || {}).textContent ? d.querySelector("summary").textContent.trim() : "",
      acceptedAnswer: { "@type": "Answer", text: (d.querySelector("p") || {}).textContent ? d.querySelector("p").textContent.trim() : "" },
    }));
    if (!items.length) return;
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      try {
        const j = JSON.parse(s.textContent);
        if (j["@type"] === "FAQPage") {
          j.mainEntity = items;
          s.textContent = "\n  " + JSON.stringify(j, null, 2).replace(/\n/g, "\n  ") + "\n  ";
        }
      } catch (e) { /* not JSON we manage */ }
    });
  }

  function changeCount(file) {
    const d = docs[file];
    return d.doc.querySelectorAll("[data-pixr-edited]").length + (d.seoEdited ? 1 : 0);
  }

  function serialise(doc, forSave) {
    if (forSave) doc.querySelectorAll("[data-pixr-edited]").forEach((n) => n.removeAttribute("data-pixr-edited"));
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML + "\n";
  }

  /* ---- preview: renders the edited page with every change highlighted ---- */
  function overlay(titleText) {
    const ov = el("div", "adm-overlay");
    const modal = el("div", "adm-modal");
    const head = el("div", "adm-modal__head");
    head.appendChild(el("strong", null, titleText));
    const close = el("button", "adm-mini", "Close");
    close.type = "button";
    close.addEventListener("click", () => ov.remove());
    head.appendChild(close);
    modal.appendChild(head);
    ov.appendChild(modal);
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    return { ov, modal };
  }

  function openPreview(file) {
    const { modal } = overlay("Preview — " + (PAGES.find((p) => p.file === file) || {}).label + " · " + changeCount(file) + " highlighted change(s)");
    const note = el("p", "adm-modal__note", "This is a private preview — nothing is live yet. Your edits are outlined in amber.");
    modal.appendChild(note);
    const frame = document.createElement("iframe");
    frame.className = "adm-modal__frame";
    frame.setAttribute("sandbox", "allow-same-origin");
    let html = serialise(docs[file].doc);
    html = html.replace("</head>", '<base href="/" /><style>[data-pixr-edited]{outline:3px dashed #F5A623 !important;outline-offset:3px;background:rgba(245,166,35,.12) !important;}</style></head>');
    frame.srcdoc = html;
    modal.appendChild(frame);
  }

  /* ---- publish confirmation: summary + required tick ---- */
  function confirmPublish(dirty, onConfirm) {
    const { ov, modal } = overlay("Ready to publish?");
    const list = el("ul", "adm-modal__list");
    dirty.forEach((p) => list.appendChild(el("li", null, p.label + " — " + changeCount(p.file) + " change(s)")));
    modal.appendChild(list);
    const lab = el("label", "adm-confirm");
    const tick = document.createElement("input");
    tick.type = "checkbox";
    lab.appendChild(tick);
    lab.appendChild(document.createTextNode(" I'm happy for these changes to go live on the real website. Once published they can't be undone from this editor."));
    modal.appendChild(lab);
    const row = el("div", "adm-modal__actions");
    const go = el("button", "btn btn--primary", "Publish now");
    go.type = "button";
    go.disabled = true;
    tick.addEventListener("change", () => { go.disabled = !tick.checked; });
    go.addEventListener("click", () => { ov.remove(); onConfirm(); });
    const cancel = el("button", "adm-mini", "Keep editing");
    cancel.type = "button";
    cancel.addEventListener("click", () => ov.remove());
    row.appendChild(go);
    row.appendChild(cancel);
    modal.appendChild(row);
  }

  $("#saveBtn").addEventListener("click", () => {
    const dirty = PAGES.filter((p) => docs[p.file].dirty);
    if (!dirty.length) return setStatus(saveStatus, "Nothing to save — no changes made.");
    confirmPublish(dirty, () => publish(dirty));
  });

  async function publish(dirty) {
    $("#saveBtn").disabled = true;
    try {
      for (const p of dirty) {
        setStatus(saveStatus, "Publishing " + p.label + "…");
        const d = docs[p.file];
        if (p.file === "contact.html" || p.file === "faq.html") syncFaqSchema(d.doc);
        const result = await saveFile(BASE + p.file, b64encode(serialise(d.doc, true)), d.sha, "Update " + p.label + " page via site editor");
        d.sha = result.content.sha;
        d.dirty = false;
        d.seoEdited = false;
        d.original = serialise(d.doc);
      }
      refreshTabs();
      setStatus(saveStatus, "Published! The live site updates in about a minute.", "ok");
    } catch (err) {
      setStatus(saveStatus, "Save failed: " + (err.message || err) + " — try again or contact Pixrweb.", "err");
    } finally {
      $("#saveBtn").disabled = false;
    }
  }

  window.addEventListener("beforeunload", (e) => {
    if (PAGES.some((p) => docs[p.file] && docs[p.file].dirty)) { e.preventDefault(); e.returnValue = ""; }
  });

  /* ---- auto sign-in if a key is already stored ---- */
  let saved = "";
  try { saved = localStorage.getItem("gdc-admin-token") || ""; } catch (e) {}
  if (saved) { $("#tokenInput").value = saved; signIn(saved); }
})();
