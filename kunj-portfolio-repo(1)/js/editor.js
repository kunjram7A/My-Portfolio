/* ---------------------------------------------------------------
   editor.js — lets Kunj add and change content without touching
   code. Everything is written to this browser's local storage so
   the site keeps showing it, and "Download data.js" produces the
   file to commit so the change goes live for everyone.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  const Site = window.Site;
  if (!Site) return;

  const panel = document.getElementById("editor");
  const body = document.getElementById("editor-body");
  const tabsWrap = document.getElementById("editor-tabs");
  const toggle = document.getElementById("edit-toggle");
  const toastEl = document.getElementById("toast");

  /* ---- schema -------------------------------------------------- */

  const TEXT = "text";
  const AREA = "area";
  const CSV = "csv";
  const IMG = "img";
  const URLF = "url";

  const LISTS = {
    projects: {
      label: "Projects",
      title: "title",
      blank: {
        title: "New project",
        role: "",
        year: String(new Date().getFullYear()),
        summary: "",
        tags: [],
        image: "",
        link: "",
      },
      fields: [
        { k: "title", l: "Project name", t: TEXT },
        { k: "role", l: "Your role", t: TEXT },
        { k: "year", l: "Year", t: TEXT },
        { k: "summary", l: "What it is and what you did", t: AREA },
        { k: "tags", l: "Tags, separated by commas", t: CSV },
        { k: "link", l: "Link (optional)", t: URLF },
        { k: "image", l: "Screenshot or logo", t: IMG },
      ],
    },
    credentials: {
      label: "Certificates",
      title: "title",
      blank: {
        title: "New certificate",
        issuer: "",
        date: "",
        id: "",
        note: "",
        image: "",
        link: "",
      },
      fields: [
        { k: "title", l: "Certificate name", t: TEXT },
        { k: "issuer", l: "Issued by", t: TEXT },
        { k: "date", l: "Date", t: TEXT },
        { k: "id", l: "Certificate ID (optional)", t: TEXT },
        { k: "note", l: "What it covered", t: AREA },
        { k: "link", l: "Verification link (optional)", t: URLF },
        { k: "image", l: "Certificate image", t: IMG },
      ],
    },
    roles: {
      label: "Roles",
      title: "title",
      blank: { title: "New role", org: "", period: "", note: "" },
      fields: [
        { k: "title", l: "Role", t: TEXT },
        { k: "org", l: "Organisation", t: TEXT },
        { k: "period", l: "Period", t: TEXT },
        { k: "note", l: "What you do there", t: AREA },
      ],
    },
    skills: {
      label: "Skills",
      title: "group",
      blank: { group: "New group", items: [] },
      fields: [
        { k: "group", l: "Group name", t: TEXT },
        { k: "items", l: "Skills, separated by commas", t: CSV },
      ],
    },
    awards: {
      label: "Awards",
      title: "title",
      blank: { title: "New award", note: "" },
      fields: [
        { k: "title", l: "Award", t: TEXT },
        { k: "note", l: "Detail", t: AREA },
      ],
    },
    gallery: {
      label: "Gallery",
      title: "caption",
      blank: { caption: "New moment", type: "image", src: "" },
      fields: [
        { k: "caption", l: "Caption", t: TEXT },
        {
          k: "type",
          l: 'Type — type exactly "image" or "video"',
          t: TEXT,
        },
        { k: "src", l: "Image upload (for photos)", t: IMG },
        {
          k: "src",
          l: "Or a file path (needed for videos, e.g. assets/video/clip.mp4)",
          t: TEXT,
        },
      ],
    },
    education: {
      label: "Education",
      title: "qualification",
      blank: { school: "", qualification: "New qualification", period: "", detail: "" },
      fields: [
        { k: "qualification", l: "Qualification", t: TEXT },
        { k: "school", l: "Institution", t: TEXT },
        { k: "period", l: "Period", t: TEXT },
        { k: "detail", l: "Detail", t: TEXT },
      ],
    },
    stats: {
      label: "Figures",
      title: "label",
      blank: { value: "0", label: "New figure" },
      fields: [
        { k: "value", l: "Figure", t: TEXT },
        { k: "label", l: "What it means", t: TEXT },
      ],
    },
  };

  const PROFILE_FIELDS = [
    { k: "name", l: "Full name", t: TEXT },
    { k: "displayLine1", l: "Hero line one", t: TEXT },
    { k: "displayLine2", l: "Hero line two", t: TEXT },
    { k: "role", l: "What you do", t: TEXT },
    { k: "location", l: "Where you are", t: TEXT },
    { k: "availability", l: "Availability note", t: TEXT },
    { k: "tagline", l: "Hero paragraph", t: AREA },
    { k: "about", l: "About — blank line starts a new paragraph", t: AREA },
    { k: "resume", l: "Resume path", t: TEXT },
  ];

  const LINK_FIELDS = [
    { k: "email", l: "Email", t: TEXT },
    { k: "phone", l: "Phone", t: TEXT },
    { k: "linkedin", l: "LinkedIn URL", t: URLF },
    { k: "instagram", l: "Instagram URL", t: URLF },
    { k: "github", l: "GitHub URL", t: URLF },
  ];

  const TABS = [
    { id: "profile", label: "Profile" },
    { id: "links", label: "Links" },
    { id: "projects", label: "Projects" },
    { id: "credentials", label: "Certificates" },
    { id: "roles", label: "Roles" },
    { id: "gallery", label: "Gallery" },
    { id: "skills", label: "Skills" },
    { id: "awards", label: "Awards" },
    { id: "education", label: "Education" },
    { id: "stats", label: "Figures" },
  ];

  let active = "profile";

  /* ---- plumbing ------------------------------------------------ */

  let timer = null;
  function commit() {
    clearTimeout(timer);
    timer = setTimeout(function () {
      const ok = Site.save();
      if (!ok) toast("Saved on the page, but this browser blocked storage");
    }, 300);
  }

  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.dataset.show = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.dataset.show = "false";
    }, 2600);
  }

  function field(label, node) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const lab = document.createElement("label");
    lab.textContent = label;
    const id = "f" + Math.random().toString(36).slice(2, 9);
    node.id = id;
    lab.htmlFor = id;
    wrap.append(lab, node);
    return wrap;
  }

  function makeInput(spec, getVal, setVal) {
    let node;
    if (spec.t === AREA) {
      node = document.createElement("textarea");
      node.value = getVal() || "";
    } else if (spec.t === IMG) {
      return imageField(spec, getVal, setVal);
    } else {
      node = document.createElement("input");
      node.type = spec.t === URLF ? "url" : "text";
      const v = getVal();
      node.value = spec.t === CSV ? (v || []).join(", ") : v || "";
    }

    node.addEventListener("input", function () {
      if (spec.t === CSV) {
        setVal(
          node.value
            .split(",")
            .map(function (s) {
              return s.trim();
            })
            .filter(Boolean)
        );
      } else {
        setVal(node.value);
      }
      commit();
    });

    return field(spec.l, node);
  }

  /* ---- image handling ------------------------------------------ */

  function shrink(file, cb) {
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        const max = 1400;
        let w = img.width;
        let h = img.height;
        if (w > max || h > max) {
          const s = Math.min(max / w, max / h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        cb(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () {
        cb(null);
      };
      img.src = reader.result;
    };
    reader.onerror = function () {
      cb(null);
    };
    reader.readAsDataURL(file);
  }

  function imageField(spec, getVal, setVal) {
    const wrap = document.createElement("div");
    wrap.className = "field";

    const lab = document.createElement("label");
    lab.textContent = spec.l;

    const preview = document.createElement("img");
    preview.className = "thumb";
    preview.alt = "";
    const cur = getVal();
    if (cur) preview.src = cur;
    else preview.removeAttribute("src");

    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "0.4rem";
    row.style.flexWrap = "wrap";

    const pick = document.createElement("button");
    pick.type = "button";
    pick.className = "btn";
    pick.textContent = cur ? "Replace image" : "Upload image";

    const drop = document.createElement("button");
    drop.type = "button";
    drop.className = "btn";
    drop.textContent = "Remove";
    drop.hidden = !cur;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;

    pick.addEventListener("click", function () {
      input.click();
    });

    input.addEventListener("change", function () {
      const f = input.files && input.files[0];
      if (!f) return;
      shrink(f, function (dataUrl) {
        if (!dataUrl) {
          toast("That file could not be read as an image");
          return;
        }
        setVal(dataUrl);
        preview.src = dataUrl;
        pick.textContent = "Replace image";
        drop.hidden = false;
        commit();
        toast("Image added");
      });
      input.value = "";
    });

    drop.addEventListener("click", function () {
      setVal("");
      preview.removeAttribute("src");
      pick.textContent = "Upload image";
      drop.hidden = true;
      commit();
    });

    row.append(pick, drop, input);
    wrap.append(lab, preview, row);
    return wrap;
  }

  /* ---- panes --------------------------------------------------- */

  function objectPane(obj, fields) {
    const frag = document.createDocumentFragment();
    fields.forEach(function (spec) {
      frag.appendChild(
        makeInput(
          spec,
          function () {
            return obj[spec.k];
          },
          function (v) {
            obj[spec.k] = v;
          }
        )
      );
    });
    return frag;
  }

  function listPane(key) {
    const schema = LISTS[key];
    const arr = (Site.data[key] = Site.data[key] || []);
    const frag = document.createDocumentFragment();

    const add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn--solid";
    add.textContent = "Add " + schema.label.toLowerCase().replace(/s$/, "");
    add.addEventListener("click", function () {
      arr.unshift(JSON.parse(JSON.stringify(schema.blank)));
      Site.save();
      draw();
      toast(schema.label.replace(/s$/, "") + " added — fill it in below");
      body.scrollTop = 0;
    });
    frag.appendChild(add);

    arr.forEach(function (item, i) {
      const card = document.createElement("div");
      card.className = "card";

      const bar = document.createElement("div");
      bar.className = "card__bar";

      const name = document.createElement("strong");
      name.textContent = item[schema.title] || "Untitled";

      const tools = document.createElement("div");
      tools.style.display = "flex";
      tools.style.gap = "0.3rem";

      tools.appendChild(
        miniBtn("↑", "Move up", function () {
          if (i === 0) return;
          arr.splice(i - 1, 0, arr.splice(i, 1)[0]);
          Site.save();
          draw();
        })
      );
      tools.appendChild(
        miniBtn("↓", "Move down", function () {
          if (i === arr.length - 1) return;
          arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
          Site.save();
          draw();
        })
      );
      const del = miniBtn("✕", "Delete", function () {});
      del.classList.add("mini--danger");
      armDanger(del, function () {
        const idx = arr.indexOf(item);
        if (idx === -1) return;
        arr.splice(idx, 1);
        Site.save();
        draw();
        toast((schema.title ? item[schema.title] : "Item") + " deleted");
      });
      tools.appendChild(del);

      bar.append(name, tools);
      card.appendChild(bar);

      schema.fields.forEach(function (spec) {
        card.appendChild(
          makeInput(
            spec,
            function () {
              return item[spec.k];
            },
            function (v) {
              item[spec.k] = v;
              if (spec.k === schema.title) name.textContent = v || "Untitled";
            }
          )
        );
      });

      frag.appendChild(card);
    });

    if (!arr.length) {
      const empty = document.createElement("p");
      empty.className = "note";
      empty.textContent =
        "Nothing here yet. Use the button above to add the first one.";
      frag.appendChild(empty);
    }

    return frag;
  }

  function miniBtn(glyph, label, fn) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mini";
    b.textContent = glyph;
    b.title = label;
    b.setAttribute("aria-label", label);
    b.addEventListener("click", fn);
    return b;
  }

  /* A two-tap confirm built into the button itself, rather than
     window.confirm(). confirm()/alert() are silently blocked in a
     lot of embedded contexts (sandboxed iframes, some in-app
     browsers) with no visible error, which made delete look broken
     there even though the click handler ran fine. */
  function armDanger(btn, onConfirm) {
    let armed = false;
    let revertTimer = null;
    const glyph = btn.textContent;
    const label = btn.title;

    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!armed) {
        armed = true;
        btn.textContent = glyph.length > 2 ? "Confirm?" : "✓";
        btn.title = "Click again to confirm";
        btn.setAttribute("aria-label", "Click again to confirm");
        btn.classList.add("mini--armed");
        clearTimeout(revertTimer);
        revertTimer = setTimeout(revert, 3000);
        return;
      }
      clearTimeout(revertTimer);
      onConfirm();
    });

    function revert() {
      armed = false;
      btn.textContent = glyph;
      btn.title = label;
      btn.setAttribute("aria-label", label);
      btn.classList.remove("mini--armed");
    }
  }

  /* ---- draw ---------------------------------------------------- */

  function draw() {
    body.innerHTML = "";

    Array.prototype.forEach.call(tabsWrap.children, function (btn) {
      btn.setAttribute(
        "aria-selected",
        btn.dataset.tab === active ? "true" : "false"
      );
    });

    if (active === "profile") {
      Site.data.profile = Site.data.profile || {};
      body.appendChild(objectPane(Site.data.profile, PROFILE_FIELDS));
    } else if (active === "links") {
      Site.data.links = Site.data.links || {};
      body.appendChild(objectPane(Site.data.links, LINK_FIELDS));
      const n = document.createElement("p");
      n.className = "note";
      n.textContent =
        "The email is a placeholder until you set your real one here.";
      body.appendChild(n);
    } else {
      body.appendChild(listPane(active));
    }
  }

  /* ---- tabs ---------------------------------------------------- */

  TABS.forEach(function (tab) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.tab = tab.id;
    b.textContent = tab.label;
    b.setAttribute("role", "tab");
    b.addEventListener("click", function () {
      active = tab.id;
      draw();
      body.scrollTop = 0;
    });
    tabsWrap.appendChild(b);
  });

  /* ---- open / close -------------------------------------------- */

  function setOpen(open) {
    panel.dataset.open = open ? "true" : "false";
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.dataset.editing = open ? "true" : "false";
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) draw();
  }

  /* ---- sign-in gate ---------------------------------------------
     This is a front-end convenience to keep casual visitors from
     poking the editor, not real security — anyone who reads the
     source can find the credentials. Don't put anything sensitive
     behind it. */

  const AUTH_KEY = "kunj-editor-unlocked";
  const EDITOR_USER = "kunjram7";
  const EDITOR_PASS = "Kunjram@7";

  function isUnlocked() {
    try {
      return window.sessionStorage.getItem(AUTH_KEY) === "true";
    } catch (err) {
      return false;
    }
  }

  function unlock() {
    try {
      window.sessionStorage.setItem(AUTH_KEY, "true");
    } catch (err) {
      /* session storage unavailable — stay unlocked for this load only */
    }
  }

  const lockbox = document.getElementById("lockbox");
  const lockForm = document.getElementById("lockbox-form");
  const lockUser = document.getElementById("lock-user");
  const lockPass = document.getElementById("lock-pass");
  const lockErr = document.getElementById("lockbox-err");

  function showLock() {
    lockbox.dataset.open = "true";
    lockErr.hidden = true;
    lockForm.reset();
    lockUser.focus();
  }

  function hideLock() {
    lockbox.dataset.open = "false";
  }

  document.getElementById("lockbox-cancel").addEventListener("click", hideLock);
  lockbox.addEventListener("click", function (e) {
    if (e.target === lockbox) hideLock();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lockbox.dataset.open === "true") hideLock();
  });

  lockForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (lockUser.value === EDITOR_USER && lockPass.value === EDITOR_PASS) {
      unlock();
      hideLock();
      setOpen(true);
    } else {
      lockErr.hidden = false;
      lockPass.value = "";
      lockPass.focus();
    }
  });

  toggle.addEventListener("click", function () {
    if (panel.dataset.open === "true") {
      setOpen(false);
      return;
    }
    if (!Site.data || !Site.data.profile || !Site.data.profile.name) {
      toast("Still loading content — try again in a moment");
      return;
    }
    if (isUnlocked()) setOpen(true);
    else showLock();
  });

  document.getElementById("editor-close").addEventListener("click", function () {
    setOpen(false);
    toggle.focus();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "E" && e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (panel.dataset.open === "true") setOpen(false);
      else if (isUnlocked()) setOpen(true);
      else showLock();
    }
  });

  /* ---- export / reset ------------------------------------------ */

  document.getElementById("editor-export").addEventListener("click", function () {
    const payload = JSON.parse(JSON.stringify(Site.data));
    payload.version = (Site.published.version || 0) + 1;
    const text = JSON.stringify(payload, null, 2) + "\n";

    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    toast("data.json downloaded — replace it at the repo root and commit");
  });

  const resetBtn = document.getElementById("editor-reset");
  armDanger(resetBtn, function () {
    Site.reset();
    draw();
    toast("Back to the published content");
  });

  /* ---- boot ---------------------------------------------------- */

  setOpen(false);
})();
