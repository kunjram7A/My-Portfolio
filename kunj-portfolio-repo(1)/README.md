# Kunj Agnihotri — portfolio

A static portfolio site. No build step, no dependencies, no framework. Open
`index.html` and it runs.

Live once deployed: `https://<your-username>.github.io/<repo-name>/`

---

## What's in here

```
index.html            the page
data.json              the database — every word and image path on the site
css/style.css          the whole design system
js/data.js             offline fallback copy of data.json (see below)
js/loader.js           fetches data.json at runtime, falls back if it can't
js/terrain.js          the hero contour animation
js/main.js             renders the page from whichever data loaded
js/editor.js           the on-page editor
assets/certs/          certificate and book images
assets/img/            project images
assets/gallery/        event photos
assets/video/          event video clips
assets/docs/           resume PDF
```

**`data.json` is the real database.** Every word, image path, and video path
on the site lives there. The page fetches it fresh on every load — edit that
file, commit, and the live site updates with no other changes needed.

`js/data.js` is a backup copy of the same content, used only when
`data.json` can't be fetched — mainly when someone opens `index.html` by
double-clicking it instead of through a server, since browsers block
`fetch()` of local files that way. A small status pill in the bottom-left
corner of the page always says which one is showing: **Live content** (from
data.json), **Built-in copy** (the data.js fallback), or **your
unpublished draft** (see below).

---

## Running it locally

Double-clicking `index.html` works. If you prefer a server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## Adding a project, certificate, or anything else

1. Open the site and click **Edit site**, bottom right (or press
   <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd>).
2. Sign in — username `kunjram7`, password `Kunjram@7`. This is a front-end
   gate to stop casual visitors from opening the panel, **not real security**:
   anyone who views the page source can read the credentials in
   `js/editor.js`. Don't rely on it to protect anything sensitive, and change
   `EDITOR_USER` / `EDITOR_PASS` in that file if you want different ones.
3. Pick a tab, then **Add** — or edit what's already there. Image fields
   upload straight from your computer and are resized automatically. The
   Gallery tab also accepts videos: type "video" in the type field and give a
   file path under `assets/video/` (videos aren't uploaded through the
   browser — drop the file into that folder yourself first).
4. Changes save to your browser as you type, so the site keeps showing them
   when you reload.
5. When you're happy, click **Download data.js**.
6. Replace `js/data.js` in this repo with the file you just downloaded, then
   commit and push. That's what makes the change visible to everyone else.

**Local edits are only yours until step 5.** The editor stores them in your
browser, not on the server. Anyone else visiting the site sees whatever is in
the committed `js/data.js`. Use **Discard changes** to throw away local edits
and go back to the published version.

### A note on uploaded images

Images added through the editor are embedded directly into `data.js` as text.
That's fine for a handful of certificates, but it makes the file large. If you
are adding many images, it's tidier to drop the files into `assets/certs/` or
`assets/img/` yourself and type the path (e.g. `assets/certs/my-cert.jpg`) into
the image field instead.

---

## Publishing to GitHub Pages

```bash
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch →
`main` / `root` → Save.** The site is live in a minute or two.

`.nojekyll` is already included so GitHub serves the files as-is.

### Custom domain

Add a file named `CNAME` at the root containing just your domain, e.g.
`kunjagnihotri.dev`, then point the domain's DNS at GitHub Pages.

---

## Things worth changing first

- **Your email.** `js/data.js` ships with a placeholder. Set the real one in
  the editor's Links tab, or edit `links.email` directly.
- **GitHub URL.** `links.github` is empty. Fill it in and it appears in the
  contact section automatically.
- **Project links.** Each project has an empty `link` field. Add repository or
  live URLs and a "Visit the project" link appears.

---

## How the hero animation works

A field of topographic contour lines is drawn on a canvas and animated with
stacked sine waves. It's rendered twice per frame: once dimly across the whole
hero, and once brightly, then masked with `destination-in` against an offscreen
canvas containing the name — so the terrain is only visible *through* the
letterforms. Pointer position feeds a gaussian falloff that lifts the ridge
beneath the cursor.

It respects `prefers-reduced-motion` (renders one static frame, no pointer
tracking) and pauses entirely when the hero scrolls out of view.

---

## Browser support

Modern evergreen browsers. Uses `color-mix()`, `aspect-ratio`, and container
queries of the plain media-query variety. No polyfills, no transpiling.
