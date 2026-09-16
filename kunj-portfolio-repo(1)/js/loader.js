/* ---------------------------------------------------------------
   loader.js — the site's "database" access layer.

   Content lives in data.json, one level up from js/. On every load
   the page fetches it fresh, so editing data.json and pushing is
   enough to update the live site with no other changes.

   If the fetch fails — most commonly because the page was opened by
   double-clicking index.html rather than through a server, which
   blocks fetch() of local files in most browsers — the page falls
   back to the copy embedded in data.js so it still works, and says
   so via the status pill in the corner.
   --------------------------------------------------------------- */

window.SiteDataLoader = (function () {
  "use strict";

  function withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error("timed out"));
        }, ms);
      }),
    ]);
  }

  async function load() {
    try {
      const res = await withTimeout(
        fetch("data.json", { cache: "no-store" }),
        4000
      );
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      if (!json || typeof json !== "object" || !json.profile) {
        throw new Error("data.json did not contain the expected shape");
      }
      return { data: json, source: "live", error: null };
    } catch (err) {
      const fallback = window.SITE_DATA;
      if (fallback && fallback.profile) {
        return { data: fallback, source: "embedded", error: err.message };
      }
      return {
        data: {
          version: 0,
          profile: { name: "Content unavailable" },
          links: {},
          stats: [],
          roles: [],
          projects: [],
          credentials: [],
          awards: [],
          skills: [],
          education: [],
          gallery: [],
        },
        source: "empty",
        error: err.message,
      };
    }
  }

  return { load: load };
})();
