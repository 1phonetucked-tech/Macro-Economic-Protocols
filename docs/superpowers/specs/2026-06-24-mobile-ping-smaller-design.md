# Mobile ping line — smaller font

_Date: 2026-06-24. Branch: `main`. Static site; change is CSS + cache-buster bumps only._

## Goal

Make the ambient `ping` readout less prominent on mobile by shrinking its font size
one step. Phones only — desktop is untouched.

## Change

- **`gallery.css`** — inside the `@media (max-width: 600px)` block, change the `.ping`
  rule's `font-size` from **`9px` → `8px`**. Nothing else in that block changes:
  - Both lines stay (cyan `PING …` header + latest reply line).
  - Placement stays (homepage centered under the legend; galleries/log top-right under
    the header).
- **Desktop is untouched** (the base `.ping` rule stays at `10px` / 3 lines).

## Cache-busting

Bump `gallery.css?v=81 → v=82` on all four dark pages **and** the homepage so cached
devices pick up the smaller type:

- `index.html`
- `protocol-accessories/index.html`
- `phonetucked-benchmark/index.html`
- `soldering-log/index.html`

(The commission form does not link `gallery.css`, so it is exempt.)

## Out of scope

- No change to line count, placement, color, or desktop sizing.
- No `gallery.js` change (version stays put).

## Verify

On a phone (≤600px wide): the ping readout reads at 8px, still two lines, in the same
spot. Desktop unchanged at 10px / 3 lines.
