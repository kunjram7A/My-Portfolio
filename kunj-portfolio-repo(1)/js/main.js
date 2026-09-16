/* ---------------------------------------------------------------
   main.js — renders every section from the live data object and
   wires up navigation, the reveal pass, and the credential viewer.
   --------------------------------------------------------------- */

window.Site = (function () {
  "use strict";

  const STORE_KEY = "kunj-portfolio-data-v1";

  /* ---- data ---------------------------------------------------- */

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function loadLocal(publishedVersion) {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      /* a draft saved against an older published version is stale —
         drop it rather than let it silently hide new content */
      if (parsed.version !== publishedVersion) return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function saveLocal(data) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      return false;
    }
  }

  function clearLocal() {
    try {
      window.localStorage.removeItem(STORE_KEY);
    } catch (err) {
      /* storage unavailable — nothing to clear */
    }
  }

  let published = { profile: {} };
  let data = clone(published);
  let source = "loading";
  let loadError = null;

  /* ---- status pill ------------------------------------------------
     A small persistent indicator — separate from the toast, which
     fades — so it's always possible to tell at a glance whether the
     page is showing live content, a saved draft, or an offline copy. */

  const pill = document.getElementById("status-pill");

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.dataset.show = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.dataset.show = "false";
    }, 2800);
  }

  function paintStatus() {
    if (!pill) return;
    const modified = api.isModified();
    let label;
    let tone;
    if (modified) {
      label = "Showing your unpublished draft";
      tone = "draft";
    } else if (source === "live") {
      label = "Live content";
      tone = "live";
    } else if (source === "embedded") {
      label = "Built-in copy — open via a server for live edits";
      tone = "warn";
    } else {
      label = "Content failed to load";
      tone = "error";
    }
    pill.textContent = label;
    pill.dataset.tone = tone;
    pill.title = loadError
      ? "data.json couldn't be loaded (" + loadError + "); showing the copy built into the page instead."
      : "";
  }

  /* ---- helpers ------------------------------------------------- */

  function el(id) {
    return document.getElementById(id);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }

  function paras(text) {
    return String(text || "")
      .split(/\n{1,}/)
      .filter(Boolean)
      .map(function (p) {
        return "<p>" + esc(p) + "</p>";
      })
      .join("");
  }

  const checkIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

  const BROKEN_IMG =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23141f36"/%3E%3Cpath d="M20 70 38 48 52 62 68 38 82 58" stroke="%232b3d5f" stroke-width="4" fill="none"/%3E%3Ccircle cx="30" cy="32" r="7" fill="%232b3d5f"/%3E%3C/svg%3E';

  function onImgErr() {
    return (
      'onerror="this.onerror=null;this.src=\'' +
      BROKEN_IMG +
      "';this.closest('[data-reveal],.cred,.moment')?.classList.add('is-broken')\""
    );
  }

  /* ---- render -------------------------------------------------- */

  function render() {
    const p = data.profile || {};
    const l = data.links || {};

    document.title = (p.name || "Portfolio") + " — " + (p.role || "");

    if (window.TerrainSetName) {
      window.TerrainSetName(
        p.displayLine1 || (p.name || "").split(" ")[0],
        p.displayLine2 || (p.name || "").split(" ").slice(1).join(" ")
      );
    }

    el("sr-name").textContent = p.name || "";
    el("mark-name").textContent = p.name || "";
    el("hero-role").textContent = p.role || "";
    el("hero-location").textContent = p.location || "";
    el("hero-available").textContent = p.availability || "";
    el("hero-tagline").innerHTML = esc(p.tagline || "");

    const resumeBtn = el("resume-link");
    if (p.resume) {
      resumeBtn.href = p.resume;
      resumeBtn.hidden = false;
    } else {
      resumeBtn.hidden = true;
    }

    /* stats */
    el("stats").innerHTML = (data.stats || [])
      .map(function (s) {
        return (
          '<div class="stats__cell"><div class="stats__value">' +
          esc(s.value) +
          '</div><div class="stats__label">' +
          esc(s.label) +
          "</div></div>"
        );
      })
      .join("");

    /* about */
    el("about-prose").innerHTML = paras(p.about);
    el("rail-edu").innerHTML = (data.education || [])
      .map(function (e) {
        return (
          "<dt>" +
          esc(e.qualification) +
          "</dt><dd>" +
          esc(e.school) +
          "<br>" +
          esc(e.period) +
          (e.detail ? "<br>" + esc(e.detail) : "") +
          "</dd>"
        );
      })
      .join("");

    /* projects */
    const projects = data.projects || [];
    el("projects-count").textContent = pad(projects.length);
    el("projects").innerHTML = projects
      .map(function (pr) {
        const tags = (pr.tags || [])
          .map(function (tg) {
            return "<li>" + esc(tg) + "</li>";
          })
          .join("");
        const shot = pr.image
          ? '<div class="project__shot"><img src="' +
            esc(pr.image) +
            '" alt="' +
            esc(pr.title) +
            '" loading="lazy" ' +
            onImgErr() +
            "></div>"
          : "<div></div>";
        const link = pr.link
          ? '<a class="project__link" href="' +
            esc(pr.link) +
            '" target="_blank" rel="noopener">Visit the project</a>'
          : "";
        return (
          '<article class="project" data-reveal>' +
          '<div class="project__year">' +
          esc(pr.year) +
          "</div>" +
          "<div>" +
          '<h3 class="project__title">' +
          esc(pr.title) +
          "</h3>" +
          '<div class="project__role">' +
          esc(pr.role) +
          "</div>" +
          '<p class="project__summary">' +
          esc(pr.summary) +
          "</p>" +
          (tags ? '<ul class="project__tags">' + tags + "</ul>" : "") +
          link +
          "</div>" +
          shot +
          "</article>"
        );
      })
      .join("");

    /* credentials */
    const creds = data.credentials || [];
    el("creds-count").textContent = pad(creds.length);
    el("creds").innerHTML = creds
      .map(function (c, i) {
        const img = c.image
          ? '<div class="cred__img"><img src="' +
            esc(c.image) +
            '" alt="' +
            esc(c.title) +
            ' certificate" loading="lazy" ' +
            onImgErr() +
            "></div>"
          : "";
        return (
          '<button class="cred" type="button" data-cred="' +
          i +
          '" data-reveal>' +
          img +
          '<div class="cred__body">' +
          '<h3 class="cred__title">' +
          esc(c.title) +
          "</h3>" +
          '<div class="cred__issuer">' +
          esc(c.issuer) +
          (c.date ? ", " + esc(c.date) : "") +
          "</div>" +
          '<div class="cred__foot">' +
          '<span class="cred__id">' +
          (c.id ? esc(c.id) : "") +
          "</span>" +
          '<span class="verified">' +
          checkIcon +
          "Held</span>" +
          "</div>" +
          "</div>" +
          "</button>"
        );
      })
      .join("");

    /* gallery */
    const moments = data.gallery || [];
    el("gallery-count").textContent = pad(moments.length);
    const playIcon =
      '<span class="moment__play"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></span>';
    el("gallery").innerHTML = moments
      .map(function (m, i) {
        const media =
          m.type === "video"
            ? '<video src="' +
              esc(m.src) +
              '" muted loop playsinline preload="metadata" onerror="this.closest(\'[data-moment]\').classList.add(\'is-broken\')"></video>' +
              playIcon
            : '<img src="' +
              esc(m.src) +
              '" alt="' +
              esc(m.caption || "") +
              '" loading="lazy" ' +
              onImgErr() +
              ">";
        return (
          '<button class="moment" type="button" data-moment="' +
          i +
          '" data-reveal>' +
          media +
          (m.caption
            ? '<span class="moment__cap">' + esc(m.caption) + "</span>"
            : "") +
          "</button>"
        );
      })
      .join("");

    /* roles */
    el("roles").innerHTML = (data.roles || [])
      .map(function (r) {
        return (
          '<li class="role" data-reveal>' +
          "<div>" +
          '<h3 class="role__title">' +
          esc(r.title) +
          "</h3>" +
          '<div class="role__org">' +
          esc(r.org) +
          "</div>" +
          '<span class="role__period">' +
          esc(r.period) +
          "</span>" +
          "</div>" +
          '<p class="role__note">' +
          esc(r.note) +
          "</p>" +
          "</li>"
        );
      })
      .join("");

    /* skills */
    el("skills").innerHTML = (data.skills || [])
      .map(function (s) {
        return (
          '<div class="skillset"><h3>' +
          esc(s.group) +
          "</h3><ul>" +
          (s.items || [])
            .map(function (it) {
              return "<li>" + esc(it) + "</li>";
            })
            .join("") +
          "</ul></div>"
        );
      })
      .join("");

    /* awards */
    el("awards").innerHTML = (data.awards || [])
      .map(function (a) {
        const thumb = a.image
          ? '<img class="awards__thumb" src="' +
            esc(a.image) +
            '" alt="" loading="lazy" ' +
            onImgErr() +
            ">"
          : "";
        return (
          "<li>" +
          thumb +
          "<div><strong>" +
          esc(a.title) +
          "</strong>" +
          esc(a.note || "") +
          "</div></li>"
        );
      })
      .join("");

    /* contact */
    const items = [];
    if (l.email)
      items.push(["Email", "mailto:" + l.email, l.email]);
    if (l.phone)
      items.push(["Phone", "tel:" + l.phone.replace(/\s+/g, ""), l.phone]);
    if (l.linkedin) items.push(["LinkedIn", l.linkedin, "in/kunj-agnihotri"]);
    if (l.instagram) items.push(["Instagram", l.instagram, "@" + handle(l.instagram)]);
    if (l.github) items.push(["GitHub", l.github, "@" + handle(l.github)]);

    el("contact-grid").innerHTML = items
      .map(function (it) {
        const ext = it[1].indexOf("http") === 0;
        return (
          '<div class="contact__item"><span>' +
          esc(it[0]) +
          '</span><a href="' +
          esc(it[1]) +
          '"' +
          (ext ? ' target="_blank" rel="noopener"' : "") +
          ">" +
          esc(it[2]) +
          "</a></div>"
        );
      })
      .join("");

    el("foot-name").textContent = p.name || "";
    el("foot-year").textContent = new Date().getFullYear();

    wireCreds();
    wireMoments();
    revealPass();
  }

  function handle(url) {
    const parts = String(url).replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || "";
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  /* ---- credential viewer --------------------------------------- */

  const lb = el("lightbox");
  const lbImg = el("lightbox-img");
  const lbVideo = el("lightbox-video");

  function openLightbox(opts) {
    if (opts.type === "video") {
      lbImg.hidden = true;
      lbImg.removeAttribute("src");
      lbVideo.hidden = false;
      lbVideo.src = opts.src;
      lbVideo.currentTime = 0;
      lbVideo.play().catch(function () {});
    } else {
      lbVideo.hidden = true;
      lbVideo.pause();
      lbVideo.removeAttribute("src");
      lbImg.hidden = false;
      lbImg.src = opts.src;
      lbImg.alt = opts.caption || "";
    }
    el("lightbox-cap").textContent = opts.caption || "";
    lb.dataset.open = "true";
    el("lightbox-close").focus();
    document.body.style.overflow = "hidden";
  }

  function openCred(i) {
    const c = (data.credentials || [])[i];
    if (!c) return;
    openLightbox({
      type: "image",
      src: c.image || "",
      caption:
        c.title +
        " — " +
        c.issuer +
        (c.date ? ", " + c.date : "") +
        (c.id ? " (ID " + c.id + ")" : ""),
    });
  }

  function openMoment(i) {
    const m = (data.gallery || [])[i];
    if (!m) return;
    openLightbox({ type: m.type, src: m.src, caption: m.caption });
  }

  function closeCred() {
    lb.dataset.open = "false";
    lbVideo.pause();
    document.body.style.overflow = "";
  }

  el("lightbox-close").addEventListener("click", closeCred);
  lb.addEventListener("click", function (e) {
    if (e.target === lb) closeCred();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lb.dataset.open === "true") closeCred();
  });

  function wireMoments() {
    Array.prototype.forEach.call(
      document.querySelectorAll("[data-moment]"),
      function (node) {
        node.addEventListener("click", function () {
          openMoment(Number(node.dataset.moment));
        });
        const vid = node.querySelector("video");
        if (!vid) return;
        node.addEventListener("pointerenter", function () {
          vid.play().catch(function () {});
        });
        node.addEventListener("pointerleave", function () {
          vid.pause();
          vid.currentTime = 0;
        });
      }
    );
  }

  function wireCreds() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    Array.prototype.forEach.call(
      document.querySelectorAll("[data-cred]"),
      function (node) {
        node.addEventListener("click", function () {
          openCred(Number(node.dataset.cred));
        });

        if (reduced) return;

        /* a small parallax tilt that answers the pointer */
        node.addEventListener("pointermove", function (e) {
          const r = node.getBoundingClientRect();
          const rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
          const ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
          node.style.transform =
            "perspective(900px) rotateX(" +
            rx.toFixed(2) +
            "deg) rotateY(" +
            ry.toFixed(2) +
            "deg) translateZ(6px)";
        });
        node.addEventListener("pointerleave", function () {
          node.style.transform = "";
        });
      }
    );
  }

  /* ---- reveal + nav -------------------------------------------- */

  let io = null;

  function revealPass() {
    const nodes = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(nodes, function (n) {
        n.classList.add("is-in");
      });
      return;
    }
    if (io) io.disconnect();
    io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    Array.prototype.forEach.call(nodes, function (n) {
      io.observe(n);
    });
  }

  function nav() {
    const bar = el("nav");
    const links = Array.prototype.slice.call(
      document.querySelectorAll(".nav__links a")
    );
    window.addEventListener(
      "scroll",
      function () {
        bar.dataset.stuck = window.scrollY > 40 ? "true" : "false";
      },
      { passive: true }
    );

    if (!("IntersectionObserver" in window)) return;
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) {
            a.setAttribute(
              "aria-current",
              a.getAttribute("href") === "#" + en.target.id ? "true" : "false"
            );
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    links.forEach(function (a) {
      const sec = document.querySelector(a.getAttribute("href"));
      if (sec) spy.observe(sec);
    });
  }

  /* ---- public -------------------------------------------------- */

  const api = {
    get data() {
      return data;
    },
    get published() {
      return published;
    },
    get source() {
      return source;
    },
    render: render,
    save: function () {
      const ok = saveLocal(data);
      render();
      if (!ok) return false;
      paintStatus();
      return true;
    },
    reset: function () {
      clearLocal();
      data = clone(published);
      render();
      paintStatus();
    },
    replace: function (next) {
      data = next;
      saveLocal(data);
      render();
      paintStatus();
    },
    isModified: function () {
      return JSON.stringify(data) !== JSON.stringify(published);
    },
    toast: toast,
  };

  async function boot() {
    if (pill) {
      pill.textContent = "Loading…";
      pill.dataset.tone = "loading";
    }
    const result = await (window.SiteDataLoader
      ? window.SiteDataLoader.load()
      : Promise.resolve({
          data: window.SITE_DATA || { profile: {} },
          source: "embedded",
          error: null,
        }));

    published = clone(result.data);
    source = result.source;
    loadError = result.error;

    const draft = loadLocal(published.version);
    data = draft || clone(published);

    if (draft) toast("Showing your unpublished draft");
    else if (source === "embedded")
      toast("Couldn't reach data.json — showing the built-in copy");

    render();
    paintStatus();
    nav();
  }

  boot();

  return api;
})();
