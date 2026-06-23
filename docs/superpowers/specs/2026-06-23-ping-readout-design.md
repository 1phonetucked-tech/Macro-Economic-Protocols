# Live `ping` readout — design

_Date: 2026-06-23. Status: approved, ready for implementation plan._

## Summary

An ambient, terminal-styled **`ping` readout** that ticks in the corner of the
site's dark pages, reinforcing the existing networking/protocol theme
("REQUEST PROTOCOL", "PORTING > COMMISSION INTAKE", `PT-` numbers). It prints a
rolling 3-line tail like a live `ping` command, with a **real measured
round-trip time** for the `time=` value.

## Goals

- Decorative, on-brand "connection is alive" fixture.
- The latency (`time=`) is a **real** measurement of the visitor's round-trip to
  the site's edge — not faked — with a graceful simulated fallback.
- Zero serverless cost (measures a static asset, not an `/api` function).
- No new dependencies; pure `gallery.js` + `gallery.css`.

## Non-goals

- Not on the **commissions** page — that page is intentionally self-contained
  (loads neither `gallery.css` nor `gallery.js`) and stays that way.
- Not a real ICMP ping (browsers can't send ICMP). Only `time=` is real; the IP,
  byte count, and `ttl` are authentic-looking decoration.
- No user-facing controls/toggle.

## Display format

A rolling 3-line tail (oldest line scrolls off), preceded by a one-time header:

```
PING phonetucked.dev (76.76.21.21)
64 bytes: seq=40 ttl=64 time=11.8 ms
64 bytes: seq=41 ttl=64 time=13.1 ms
64 bytes: seq=42 ttl=64 time=12.4 ms
```

- Header `PING phonetucked.dev (76.76.21.21)` printed once. `76.76.21.21` is
  Vercel's real anycast IP (hardcoded, decorative).
- A new reply line is appended every **1 second**; only the **last 3** replies
  are kept visible.
- `seq` increments from 0. `ttl=64` is fixed. `time=` is the real measurement
  (one decimal, e.g. `12.4 ms`).

## Field meanings (reference)

- `PING host (ip)` — host pinged and its resolved IP.
- `64 bytes` — reply packet size (56B payload + 8B ICMP header).
- `seq` — sequence number; gaps imply dropped packets.
- `ttl` — Time To Live; max router hops before discard (starts 64, decrements per hop).
- `time` — round-trip latency (send → reply). **The only real value here.**

## Architecture

Single shared implementation; no per-page markup edits.

### `gallery.js` (shared by the 4 dark pages)

- On `DOMContentLoaded`, create the widget container element and append it to
  `<body>` (so existing page markup is untouched). Mark it `aria-hidden="true"`.
- Print the header line once.
- Start a **1s interval** that, each tick:
  1. Measures a real round-trip: `fetch(asset + '?_=' + Date.now(), { cache: 'no-store', method: 'GET' })`,
     timing `performance.now()` before/after. Use a **tiny static same-origin
     asset** (e.g. `manifest.json` or `favicon`) so there is **no serverless
     invocation**.
  2. On success → `time = roundTrip` (ms, one decimal).
  3. On failure/throw → fall back to a **simulated** jittered value (base ~12ms
     ± a few ms) so the widget never breaks.
  4. Append `64 bytes: seq=N ttl=64 time=X ms`, increment `seq`, trim visible
     lines to the last 3.
- **Pause when the tab is hidden:** skip ticks while `document.hidden` is true
  (listen to `visibilitychange`) to avoid background request churn.
- Guard against double-init if the script runs twice.

### `gallery.css` (shared)

- `.ping` container: terminal styling consistent with the site (IBM Plex Mono,
  small size, muted/cyan accent matching existing tokens, `position: fixed`,
  `pointer-events: none`, low/appropriate `z-index` that doesn't cover
  interactive elements).
- **Default placement (galleries + soldering log):** **bottom-left**.
- **Homepage override:** positioned **directly under the logo** (top-left,
  beneath `.home-stack`) instead of bottom-left. Target via the homepage's
  distinguishing hook (e.g. presence of `#chart` / a body selector) so only the
  homepage gets the under-logo placement.
- **Mobile (`max-width: ~600px`):** shrink font; if it crowds page content,
  hide it (`display: none`) — it's decorative.
- `prefers-reduced-motion`: content still updates (text, not motion) but this is
  low-stakes; no special handling required beyond keeping it subtle.

## Pages affected

| Page | Loads gallery.css/js? | Widget? | Placement |
|------|----------------------|---------|-----------|
| `index.html` (home) | yes | yes | under the logo (top-left) |
| `protocol-accessories/` | yes | yes | bottom-left |
| `phonetucked-benchmark/` | yes | yes | bottom-left |
| `soldering-log/` | yes | yes | bottom-left |
| `commissions/` | **no** (self-contained) | **no** | — |

## Cache-busting / versioning

- Bump **`gallery.js?v=`** (currently `v=4`) on the 4 pages that load it.
- Bump **`gallery.css?v=`** (currently `v=74`) on all four dark pages.
- Commissions is exempt (loads neither).

## Error handling

- `fetch` failure / network error → simulated jittered `time=` value; widget
  keeps ticking.
- Tab hidden → ticks paused, resumed on focus.
- Double script-load → init guard prevents duplicate widgets/intervals.

## Testing / verification

- On homepage + both galleries + soldering log: the widget appears, header prints
  once, a new line appends each ~1s, only 3 reply lines stay visible.
- `time=` reflects real latency (throttle network in devtools → value rises;
  go offline → it falls back to simulated and keeps going, no console errors).
- Homepage: widget sits **under the logo**; other three: **bottom-left**.
- **Commissions page: no widget** (still self-contained).
- Switch tabs away and back: ticking pauses while hidden, resumes on return.
- Mobile: readable and not crowding content (or hidden under ~600px).
