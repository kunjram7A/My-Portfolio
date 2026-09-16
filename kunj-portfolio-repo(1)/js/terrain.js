/* ---------------------------------------------------------------
   terrain.js — the signature animation.

   A topographic contour field flows across the hero. It is drawn
   twice: once dimly across the whole area, and once brightly with
   canvas compositing so it only shows *through* the letterforms of
   the name. Moving the pointer lifts the ridge beneath it.
   --------------------------------------------------------------- */

(function () {
  "use strict";

  const ambient = document.getElementById("terrain-ambient");
  const typeCv = document.getElementById("terrain-type");
  if (!ambient || !typeCv) return;

  const actx = ambient.getContext("2d");
  const tctx = typeCv.getContext("2d");
  const hero = document.getElementById("hero");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const COLORS = {
    line: "#2b3d5f",
    lineHi: "#3f5885",
    amber: "#ffb43d",
    amberDeep: "#c97f16",
    ink: "#0a1020",
  };

  let W = 0;
  let H = 0;
  let dpr = 1;
  let t = 0;
  let raf = null;

  /* pointer, in css pixels, with an eased follow so the ridge
     lags very slightly behind the cursor rather than snapping */
  const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, power: 0, tp: 0 };

  const BANDS = 62;

  function resize() {
    const rect = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    [ambient, typeCv].forEach(function (cv) {
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
    });

    mask.width = Math.round(W * dpr);
    mask.height = Math.round(H * dpr);

    actx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* vertical displacement of the contour sheet at (x, band) */
  function height(x, bandY, i, time, depth, boost) {
    const nx = x / W;
    /* foreground ridges swell, distant ones flatten out */
    const amp = boost ? boost(depth) : 0.3 + depth * depth * 2.2;
    let h =
      (Math.sin(nx * 5.1 + time * 0.28 + i * 0.16) * 15 +
        Math.sin(nx * 11.7 - time * 0.19 + i * 0.09) * 7 +
        Math.sin(nx * 2.3 + time * 0.11 - i * 0.05) * 26 +
        Math.sin(nx * 1.4 - time * 0.07 + i * 0.03) * 34) *
      amp;

    /* the ridge lifts away from the pointer */
    if (ptr.power > 0.001) {
      const dx = x - ptr.x;
      const dy = bandY - ptr.y;
      const r = 210;
      const falloff = Math.exp(-(dx * dx + dy * dy) / (2 * r * r));
      h -= falloff * 110 * ptr.power;
    }
    return h;
  }

  function drawField(ctx, opts) {
    const spacing = H / BANDS;
    const stepX = W < 640 ? 14 : 9;

    for (let i = 0; i < BANDS; i++) {
      const baseY = i * spacing + spacing * 0.5;
      /* depth: bands read stronger toward the lower half */
      const depth = i / (BANDS - 1);
      const alpha = opts.alphaAt(depth);
      if (alpha <= 0.004) continue;

      ctx.beginPath();
      for (let x = -stepX; x <= W + stepX; x += stepX) {
        const y = baseY + height(x, baseY, i, t, depth, opts.amp);
        if (x <= -stepX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = opts.strokeAt(depth);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = opts.width;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* ---- the name, used as a stencil ---------------------------- */

  let nameLines = ["Kunj", "Agnihotri"];

  /* the mask is built offscreen so both lines land in one operation —
     compositing per line would make each line erase the other */
  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d");

  function contentLeft() {
    const maxW = 82 * 16;
    const gutter = Math.max(20, Math.min(W * 0.05, 80));
    return W > maxW ? (W - maxW) / 2 + gutter : gutter;
  }

  function fitFont(ctx) {
    const left = contentLeft();
    const avail = W - left * 2;
    let size = 40;
    ctx.font = weightedFont(size);
    const longest = nameLines.reduce(
      (a, b) => (ctx.measureText(a).width > ctx.measureText(b).width ? a : b),
      nameLines[0]
    );
    const w = ctx.measureText(longest).width || 1;
    size = Math.floor((size * avail) / w);
    /* never taller than the space above the hero copy */
    const cap = Math.floor(H * 0.185);
    return Math.max(34, Math.min(size, cap, 260));
  }

  function weightedFont(px) {
    return (
      '700 ' +
      px +
      'px "Bricolage Grotesque", "IBM Plex Sans", system-ui, sans-serif'
    );
  }

  function drawStencilled() {
    tctx.clearRect(0, 0, W, H);

    const size = fitFont(tctx);
    const lh = size * 1.0;
    const left = contentLeft();
    const blockTop = H * 0.11;

    /* 1. paint the bright terrain across the whole canvas */
    const g = tctx.createLinearGradient(0, blockTop, 0, blockTop + lh * 2);
    g.addColorStop(0, "#2a4069");
    g.addColorStop(1, "#101d34");
    tctx.fillStyle = g;
    tctx.fillRect(0, 0, W, H);

    drawField(tctx, {
      width: 1.6,
      amp: (d) => 0.85 + d * 1.5,
      alphaAt: (d) => 0.5 + d * 0.45,
      strokeAt: (d) => (d > 0.45 ? COLORS.amber : COLORS.amberDeep),
    });

    /* 2. build the letterform mask, then keep only what falls inside it */
    mctx.clearRect(0, 0, W, H);
    mctx.font = weightedFont(size);
    mctx.textAlign = "left";
    mctx.textBaseline = "top";
    mctx.fillStyle = "#ffffff";
    nameLines.forEach(function (line, i) {
      mctx.fillText(line, left, blockTop + i * lh);
    });

    tctx.globalCompositeOperation = "destination-in";
    tctx.drawImage(mask, 0, 0, W, H);

    /* 3. a hairline edge so the letterforms stay readable */
    tctx.globalCompositeOperation = "source-over";
    tctx.font = weightedFont(size);
    tctx.textAlign = "left";
    tctx.textBaseline = "top";
    tctx.lineWidth = Math.max(1.1, size * 0.008);
    tctx.strokeStyle = "rgba(255, 180, 61, 0.7)";
    nameLines.forEach(function (line, i) {
      tctx.strokeText(line, left, blockTop + i * lh);
    });
  }

  function drawAmbient() {
    actx.clearRect(0, 0, W, H);
    drawField(actx, {
      width: 1,
      alphaAt: (d) => 0.16 + d * 0.6,
      strokeAt: (d) => (d > 0.7 ? COLORS.lineHi : COLORS.line),
    });
  }

  function frame() {
    ptr.x += (ptr.tx - ptr.x) * 0.09;
    ptr.y += (ptr.ty - ptr.y) * 0.09;
    ptr.power += (ptr.tp - ptr.power) * 0.06;
    t += 0.016;
    drawAmbient();
    drawStencilled();
    raf = requestAnimationFrame(frame);
  }

  function renderOnce() {
    drawAmbient();
    drawStencilled();
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    if (reduced.matches) renderOnce();
    else raf = requestAnimationFrame(frame);
  }

  /* ---- pointer -------------------------------------------------- */

  function movePointer(clientX, clientY) {
    const rect = hero.getBoundingClientRect();
    ptr.tx = clientX - rect.left;
    ptr.ty = clientY - rect.top;
    ptr.tp = 1;
    if (ptr.x < -9000) {
      ptr.x = ptr.tx;
      ptr.y = ptr.ty;
    }
  }

  hero.addEventListener(
    "pointermove",
    function (e) {
      if (reduced.matches) return;
      movePointer(e.clientX, e.clientY);
    },
    { passive: true }
  );

  hero.addEventListener("pointerleave", function () {
    ptr.tp = 0;
  });

  /* ---- lifecycle ------------------------------------------------ */

  function boot() {
    resize();
    start();
  }

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (reduced.matches) renderOnce();
    }, 140);
  });

  /* the hero also changes width when the editor panel opens */
  if ("ResizeObserver" in window) {
    let last = 0;
    new ResizeObserver(function (entries) {
      const w = Math.round(entries[0].contentRect.width);
      if (w === last) return;
      last = w;
      resize();
      if (reduced.matches) renderOnce();
    }).observe(hero);
  }

  /* pause when the hero is off screen — no point burning frames */
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            if (!raf && !reduced.matches) raf = requestAnimationFrame(frame);
          } else if (raf) {
            cancelAnimationFrame(raf);
            raf = null;
          }
        });
      },
      { threshold: 0 }
    ).observe(hero);
  }

  reduced.addEventListener &&
    reduced.addEventListener("change", function () {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      start();
    });

  /* the stencil depends on real font metrics, so wait for the face */
  window.TerrainSetName = function (l1, l2) {
    nameLines = [l1 || "Kunj", l2 || "Agnihotri"];
    resize();
    if (reduced.matches) renderOnce();
  };

  boot();

  if (document.fonts && document.fonts.load) {
    document.fonts
      .load('700 100px "Bricolage Grotesque"')
      .then(function () {
        fontReady = true;
        resize();
        if (reduced.matches) renderOnce();
      })
      .catch(function () {});
  }
})();
