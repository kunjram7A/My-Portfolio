# Prompt for Google AI Studio

Paste everything below the line into AI Studio. Attach the four certificate
images, the KickstartU logo, and the resume PDF alongside it if you want the
model to work from the originals rather than the transcribed content.

---

Build a single-page portfolio website as one self-contained `index.html` plus
`css/style.css` and JavaScript split into `js/data.js`, `js/terrain.js`,
`js/main.js`, `js/editor.js`. No framework, no build step, no npm. It must run
by opening the file directly and deploy to GitHub Pages unchanged.

## Who it's for

Kunj Agnihotri. Cyber security and software engineering undergraduate in
Dehradun, Uttarakhand, India. B.Tech in Computer Science at Veer Madho Singh
Bhandari Uttarakhand Technical University, 2027 batch, entered laterally after
a diploma at Government Polytechnic Kashipur (CGPA 8.0/10, Oct 2021 – Jun 2024).

The audience is recruiters, hackathon organisers, and university programme
leads. The job of the page is to make him look like someone who both builds
and leads, in that order, within about fifteen seconds of landing.

## Design direction — "Ridge"

The visual motif is a **topographic contour field**. It reads simultaneously as
the Himalayan foothills around Dehradun and as a signal or heat map, which
suits a security subject. Do not use the terminal-green-on-black hacker
aesthetic, a Matrix rain effect, glassmorphism, a cream-and-serif editorial
look, or a grid of identical rounded shadowed cards. Those are the defaults and
they are all wrong for this.

### Colour tokens

```
--ink        #0a1020   page ground, a deep valley navy
--ink-deep   #060b16   editor and overlay ground
--ridge      #141f36   raised surfaces
--ridge-hi   #1b2947
--line       #2b3d5f   every hairline and border
--mist       #8fa3c4   body text and secondary labels
--paper      #eaf0fa   primary text
--amber      #ffb43d   the single accent — dawn light on a ridge
--jade       #56d3a6   reserved exclusively for verified-credential marks
```

One accent only. Amber carries every call to action, every active state, every
emphasis. Jade appears nowhere except the small check beside a certificate.

### Typography

- Display: **Bricolage Grotesque**, weight 700, variable width axis around 96.
- Body: **IBM Plex Sans**, weights 400/500/600.
- **IBM Plex Mono** only on genuine machine data — certificate IDs and the
  project year column. Never for decorative labels.

Fluid type scale with `clamp()`. Body measure capped at 60 characters. Headings
sentence case. Do not set labels in all caps, do not put an eyebrow label above
every heading, do not append arrows to button text, and do not accent a single
word of a headline in a different colour.

### Layout

Left-aligned throughout, asymmetric, generous vertical rhythm. Sections
separated by full-bleed 1px `--line` rules rather than boxed cards. The About
section is a two-column split with a sticky narrow right rail holding
education. Projects are rows in a hairline-separated list, not cards:

```
┌──────────────────────────────────────────────────────────┐
│  2025 –   KickstartU                        ┌──────────┐ │
│           Founder and ideator               │  image   │ │
│           Summary paragraph, 54ch max       └──────────┘ │
│           [tag] [tag] [tag]                              │
├──────────────────────────────────────────────────────────┤
```

## The signature animation — build this exactly

A hero canvas animation. Two stacked full-bleed `<canvas>` elements inside the
hero, plus a CSS gradient veil above them, plus the hero copy at z-index 2.

**The field.** About 62 horizontal contour bands spanning the hero height. Each
band's vertical displacement at horizontal position `x` is a sum of four sine
waves at different frequencies and drift speeds, phase-shifted per band index,
multiplied by an amplitude that grows with band depth so foreground ridges
swell and distant ones flatten. Step `x` in 9px increments (14px under 640px
wide) and stroke each band as a polyline.

**The pointer.** Track pointer position over the hero with an eased follow so
the ridge lags very slightly behind the cursor. Subtract a 2D gaussian
(σ ≈ 210px) scaled to about 110px from the band displacement, so the terrain
lifts toward the cursor. Ease the strength to zero on `pointerleave`.

**The stencil — this is the whole idea.** The second canvas draws the same
field in amber at higher opacity over a `#2a4069 → #101d34` vertical gradient,
then masks it to the shape of the name:

1. Fill the gradient across the whole canvas.
2. Draw the bright contour field over it with `source-over`.
3. Render "Kunj" and "Agnihotri" as white text **on a separate offscreen
   canvas**, both lines in one pass.
4. Set `globalCompositeOperation = "destination-in"` and `drawImage` that
   offscreen mask onto the canvas in a single operation.
5. Reset to `source-over` and `strokeText` both lines in
   `rgba(255,180,61,0.7)` at `size * 0.008` so the letterforms stay legible
   between contour lines.

Step 3 must be offscreen and step 4 must be one `drawImage`. Calling
`fillText` twice directly with `destination-in` makes each line erase the
other and you end up with empty glyphs.

Size the display type by measuring the longer of the two lines against the
available width, capped at 18.5% of hero height. Line height equals the font
size. Position the block at 11% of hero height from the top, left-aligned to
the same gutter as the rest of the page.

**Quality floor.** Handle `devicePixelRatio` up to 2. Re-render on window
resize (debounced 140ms) and on a `ResizeObserver` watching the hero, because
the hero narrows when the editor panel opens. Wait for `document.fonts.load`
before trusting text metrics. Pause the animation loop with an
`IntersectionObserver` when the hero leaves the viewport. Under
`prefers-reduced-motion: reduce`, render exactly one static frame and disable
pointer tracking.

Everything below the hero stays quiet: a single intersection-observer reveal
pass (14px rise, 0.7s), a pointer-driven 3D tilt on certificate cards, and
transitions only on things the user actually touches. No fade-up on every
section, no hover lift on every element.

## Sections, in order

1. **Hero** — the contour name, a metadata line (role, location, and an
   availability note with a slowly pulsing jade dot), one paragraph, three
   buttons.
2. **Figures** — a hairline-ruled strip: 2027 batch, 8.0 diploma CGPA, 5
   leadership roles, 2 hackathons won.
3. **Work** — three projects (below).
4. **Certificates** — a responsive grid of image cards, click to open a
   lightbox showing the full certificate with issuer, date, and ID.
5. **Leadership** — five roles as a two-column hairline-separated list.
6. **About** — two paragraphs of prose, a skills matrix, recognition list, and
   a sticky education rail.
7. **Contact** — email, phone, LinkedIn, Instagram.

## Content

**Hero paragraph.** "I study how systems break, build the ones that shouldn't,
and lead the teams that ship them. Currently reading for a B.Tech in Computer
Science at Veer Madho Singh Bhandari Uttarakhand Technical University."

**Projects.**

- *KickstartU*, founder and ideator, 2025 – . A platform to get student
  founders from a raw idea to a working first version. Designed the system
  architecture, product roadmap, and core workflow, then worked alongside
  developers to build it in scalable modules. Image: the KickstartU logo
  (blue and orange 3D character walking past map pins, white background).
- *Raj Bhavan Spring Festival*, technology team, Government of Uttarakhand,
  2025. Co-developed and deployed systems handling public-facing operations
  for a state government event, live in production.
- *Cancer Care India*, web platform, 2025. A healthcare awareness platform
  built with modern web tooling and shipped openly through GitHub.

**Certificates.** Each has an image, issuer, date, optional ID, and a note.

- *Build with AI Bootcamp* — Google for Developers with Hack2Skill, 09 June
  2026, ID `2026H2S06BWAIBRK-P00246`. Building AI agents, architecting
  workflows, integrating generative AI into production systems.
- *Google Student Ambassador Program* — Google Gemini with Communique, 31
  December 2025, Faculty of Technology cohort.
- *Solve for Tomorrow 2026* — Samsung. Design-thinking track, innovation
  proposal for a social-impact problem.
- *Student Builder Campus Leader* — AWS Builder Center, current.

**Leadership roles.** AWS Student Builder Campus Leader (AWS Builder Center);
Google Student Ambassador (2025–2026); Uttarakhand Head, Cyber Security
Awareness Program (CSAP); Operational Head, Technical Club, Faculty of
Technology; Smarted Student Ambassador (2025).

**Skills, grouped.** Languages: Python, Java, C, C++, C#, MySQL, XML. Mobile:
Flutter, Android, Firebase, Firebase App Builder. Cloud and tooling: AWS,
Linux, Git, GitHub. Security: VAPT basics, security practices, awareness
training. Systems: IoT, VHDL, MGX. Working with people: leadership, public
speaking, event management, mentoring.

**Recognition.** Winners, IDE BootCamp 2026 (startup concept with market
analysis and revenue strategy). Winner, National Level Hackathon, Dev Bhoomi
University, as team lead. Self-published author of *The Human Brain Is
Universe*.

**Contact.** Phone +91 90454 79659. LinkedIn
`linkedin.com/in/kunj-agnihotri-312b3539a`. Instagram `instagram.com/kunjram7`.
Email is a placeholder to be filled in.

## The editor — build this too

An on-page editor so content can be changed without touching code.

- A fixed "Edit site" button, bottom right. Opens a right-hand panel.
  <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>E</kbd> toggles it.
- Tabs: Profile, Links, Projects, Certificates, Roles, Skills, Awards,
  Education, Figures.
- List tabs get an "Add" button plus, per entry, move-up, move-down, and
  delete controls, and a form generated from a field schema. Deleting asks for
  confirmation.
- Image fields upload from disk, downscale to 1400px longest edge on a canvas,
  re-encode as JPEG at quality 0.82, and store the result as a data URL. Show a
  preview with Replace and Remove.
- Every keystroke updates the live page; writes to `localStorage` are debounced
  300ms. Wrap all storage access in try/catch and degrade gracefully when
  storage is blocked — the page must still work.
- "Download data.js" serialises the current state as a ready-to-commit
  `window.SITE_DATA = {...};` file with a generated header comment.
- "Discard changes" clears local storage and restores the committed content,
  after a confirm.
- On load, if local state differs from the committed data, show a brief toast
  saying the visitor is seeing unpublished local edits.

Make clear in the UI copy that local edits are private to that browser until
`data.js` is committed.

## Non-negotiables

- Semantic HTML. A real `<h1>` containing the name, visually hidden since the
  name is drawn on canvas. Canvases `aria-hidden`. A skip link.
- Visible keyboard focus everywhere (2px amber outline, 3px offset). The
  lightbox is a labelled modal that closes on Escape and on backdrop click.
- All user-supplied strings HTML-escaped before injection — the editor lets a
  user type anything, so never build markup from raw input.
- Responsive from 320px up. Nothing scrolls sideways.
- `prefers-reduced-motion` and a print stylesheet both handled.
- No localStorage for anything except the editor's draft state.
