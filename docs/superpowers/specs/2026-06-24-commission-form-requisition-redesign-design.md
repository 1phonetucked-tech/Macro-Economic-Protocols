# Commission form — "Requisition / engineering title-block" redesign

_Date: 2026-06-24. Branch: `main`. Target file: `commissions/index.html` (self-contained —
all CSS inline, loads neither `gallery.css` nor `gallery.js`, so **no `v=` bump**)._

## Goal

Keep the form's existing identity — **black background, cyan (`#29c2ec`) accent, IBM Plex
Mono** — but stop it reading like a generic web form dropped onto a cool page. The redesign
recasts the form as an **engineering drawing / requisition sheet**: a bordered sheet of
numbered cells with a title block. Chosen from a visual brainstorm (direction **4B** +
component-pad image tiles **i**).

**Hard constraints from the user:**
- **No glow anywhere.** Remove every `box-shadow`/`text-shadow` glow (focus glow, submit
  hover glow, thumbnail glow). Keep it plain.
- Keep all existing functionality intact (see "Preserve" below).

## The look (what changes — all visual)

### Sheet + title block
- The form body becomes a **bordered "sheet"** (`1px solid #1f3a42`) with **cyan crop-mark
  corner ticks** at the top-left and top-right (small `::before`/`::after` L-shapes).
- A **title bar** across the top of the sheet: `commission intake — drawing no. PT-…-XXXX`
  (uppercase, cyan, letter-spaced), bottom-bordered.
- A **title-block grid** anchored at the **bottom of the sheet**: four bordered cells
  `FORM NO. | DATE | PAGE | REV` (tiny uppercase keys, value below). Maps to existing data:
  - `FORM NO.` → the `PT-…` number (JS-set, id `form-no`)
  - `DATE` → today (JS-set, id `form-date`)
  - `PAGE` → `1 / 1` (static)
  - `REV` → `A` (static, decorative)

### Fields = numbered cells
Every field is a **bordered cell** with a tiny uppercase corner label and a small **number
tag** (`01`–`08`) in the top-right. Inputs are **transparent, borderless, white text** that
fill the cell (no more white boxes). Two-up cells (name/email, budget/deadline) sit side by
side, divided by a hairline. Field order:

1. `01 name` · `02 email` (two-up, required `*`)
2. `03 type of request` — holds the existing `<select>` (web build / pcb & hardware / …)
3. `04 specification *` — holds the **existing rich-text editor** (see Preserve), restyled dark
4. `05 references (links)` — the existing `references` text input
5. `06 reference images` — the paste/drop zone + thumbnail tray (see Images)
6. `07 budget` · `08 deadline` (two-up)

### Images section (component pads, style "i")
- The `06` cell contains the **paste/drop target** and a **tray of thumbnails**.
- Each uploaded image is a **74px cyan-bordered tile** with **corner crop ticks** (echoing the
  sheet corners), a **filename caption** below, and a `×` remove button at the top-right.
  **No glow** on the tile.
- The empty **drop target** is a `74px` dashed-cyan tile reading "paste or drop here". On
  drag-over it changes background only (`#06171c`) — **no glow**.
- Flexible count (tiles wrap), matching today's behavior. (Not the fixed REF-01…04 slots.)

### Focus / interaction (plain, no glow)
- Cell **focus** = subtle background fill on the cell (`#06171c`) and/or a cyan border —
  **no `box-shadow`**.
- **Submit** stays the text CTA `[ SUBMIT REQUEST _ ]` (cyan brackets + blinking caret,
  brackets spread on hover) but the **hover `text-shadow` glow is removed**.
- The rich-text toolbar's existing sliding-cyan indicator may stay (it's a flat underline, not
  a glow) or be simplified to a plain `.on` state — implementer's call, kept minimal.

### Logo / masthead
- The current **floating fixed masthead** (logo bottom-right) is removed (it collided with
  content / was awkward on mobile). The `logo.png` is placed **small near the title bar**
  (top of the sheet, left of or above the title). Title text `PORTING > COMMISSION INTAKE`
  is folded into the title bar / drawing line.

## Preserve (functionality — do NOT change behavior)
- Formspree POST to `/f/mdavqqkw`; hidden `_subject`, `request_id`, `_gotcha` honeypot.
- PT-number assignment via `/api/next-number` with the client `PT-YYYYMMDD-XXXX` fallback; the
  on-load `PT-<today>-XXXX` placeholder with muted `XXXX`.
- **Rich-text specification editor** (contenteditable + bold/italic/underline/highlight
  toolbar) writing `innerHTML` into the hidden `description` field; the submit-time empty-spec
  guard. Restyle it **dark** (dark field, light text) to match the sheet — keep all JS/commands.
- Reference-image pipeline: paste-anywhere + drop → canvas downscale → POST `/api/upload` →
  Blob URL → newline-joined into hidden `reference_images`; the in-flight upload submit guard;
  `×` removal.
- `body.sent` confirmation state (`Request PT-… received.`). Copy unchanged.
- All `aria-label`s / accessibility affordances; `prefers-reduced-motion` holds the caret.

## Out of scope
- No change to the API functions, Formspree, or the confirmation copy.
- No change to other pages; `commissions/` loads no shared CSS/JS, so **no `gallery.css`/
  `gallery.js` version bump**.
- Not the fixed REF-01…04 image slots (we chose flexible pad tiles).

## Final decisions (as built, after live preview iteration)
- **Outer sheet border is white** (`#fff`); inner cell/divider lines stay dark cyan-grey
  (`#1f3a42`). Field/title-block **header labels are dark grey `#4a4a4a`** ("black you can
  still see"); values are white.
- **No crop-mark corners**; **no hairline under the title bar** (title floats). Title bar text
  is white.
- **Title block = FORM NO. · DATE · TYPE · ENC.** (PAGE/REV dropped). `TYPE` mirrors the
  selected request type live; `ENC.` shows the reference-image count (`N img`), live.
- Title-block dividers via a **direct-child selector** (`.block > div`) so the inner
  label/value divs don't pick up stray border stubs.
- **Highlight color is cyan** (`#29c2ec`, black text) — the `hiliteColor` command and the
  `.rt-area` highlight CSS both use it.
- **Submitted state** = the sheet stays, with a bracketed **`[ REQUEST RECEIVED ✓ ]`** line
  (echoes the submit CTA) instead of a stamp; same title block, populated on submit.

## Verify
- `phonetucked.dev/commissions/` renders a bordered engineering sheet: crop-mark corners,
  cyan title bar with the drawing no., numbered cells, a bottom title block
  (`FORM NO / DATE / PAGE / REV`).
- Inputs are transparent (no white boxes); **nothing glows** on focus, hover, or upload.
- Rich-text spec box works (bold/italic/underline/highlight) and is dark.
- Paste/drop a reference image → a cyan crop-marked tile with filename + `×` appears; submit
  is blocked until uploads finish; URLs arrive in the Formspree email as `reference_images`.
- PT-number assigns on submit; `body.sent` confirmation shows. Mobile: two-up cells and the
  title block stack/wrap cleanly; no floating masthead overlap.
