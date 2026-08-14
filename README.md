# Travel Mode

Airtel International Roaming — a working frontend prototype.

Twenty-two screens from the Figma file, rebuilt as thirteen real routes on the
Foundations token system. No backend: the data is JSON, the logic is pure
functions, and the state lives in the browser.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## What changed

It used to be a **Figma scene-graph player**. `tools/figma_codegen.py` pulled
the document into `src/generated/screens.json` — 1.17 MB, 2790 absolutely
positioned nodes — and one recursive component rendered it. There were five
React components in the whole app and **no real inputs**: the destination field
was a `<div>` containing the text "Where are you going?", the typed query on
04.2 was the literal string "UAE |" with a drawn cursor, and the country chips
were flattened instances that could not be selected. Moving from 04.1 to 04.3
meant loading a different picture.

Now the destination search filters real data, the chips toggle, the dates open
a real calendar, the trip length is derived from it, and every downstream
number follows.

## The structure

```
src/
  styles/     tokens.css  — the Foundations board, 1:1 (bg/page -> --bg-page)
              type.css    — the only text primitives; nothing else sets font-size
              ios.css     — Inter, for lock-screen chrome only
  data/       JSON. Countries, packs, copy, notifications, ledger, FAQ.
  lib/        Pure functions. Dates, pricing, recommendation, search, validation.
  state/      Three zustand stores + the scenario snapshots the rail applies.
  ui/         Primitives, one folder each, full variant matrices.
  patterns/   Blocks used by more than one screen.
  screens/    Thirteen routes.
  app/        Device frame, index rail, router, hash sync.
  legacy/     The old scene-graph player. Excluded from the build; kept as reference.
```

## Twenty-two screens, thirteen routes

Most "screens" in the file are states of one screen. 04.1, 04.2 and 04.3 are
the same form empty, mid-search and filled. 05.4 and 05.5 are the dashboard on
day 3 and on day 8. 05.7–05.13 are one lock screen with different banners.

The index rail still lists all twenty-two, because the work has to stay
reviewable against the file — but a rail click now **seeds store state** and
navigates, rather than swapping a picture. Open "04.2 Destination and dates"
and you land on the real form with "UAE" genuinely typed into a real input.

`src/app/routes.ts` holds that mapping. `src/state/scenarios.ts` holds the
snapshots.

## Home → Travel, twice

The Travel tile runs two different transitions, and which one you get is the
point.

**The first tap** plays the full departure sequence: a blush ground grows out of
the tile, the word `Travel` flies to the middle and settles into the lockup, and
a split-flap board turns **"Roaming, sorted after you land"** into **"before you
fly"**. About 4.6 seconds. It is an argument, and it is worth making once.

**Every tap after that** is the long one's *ending*, reborn at the tile. The
plane glyph lifts off, and the trip screen opens out of the tile it left as a
circle with the same glowing red hairline riding its edge. ~550ms, one gesture,
no words.

That relationship is the point: the everyday transition and the set piece are
the same material doing the same thing at different scales, rather than two
unrelated animations.

It is a **reveal**, not a cover — the incoming screen is opaque and in place
from the first frame and only the clip-path moves. The version before it
expanded a pane over the hero band, cross-faded underneath and then uncovered:
three clocks, and what you actually saw was both screens double-exposed at half
opacity followed by a white hole punched in a finished screen. A reveal makes
that structurally impossible rather than tuned away, which is why
`tools/verify_departure.mjs` asserts no frame ever has two partly-transparent
screens.

Neither ending takes its colour from the hero artwork. They used to, and that
was a bug in the making: it let a swappable asset decide what a transition
looks like. Both wash to `--bg-screen` — the white every screen root already is
— so the hero can be replaced or rotated without touching motion.

The long one stays reachable: **Replay** in the toolbar runs it, and selecting
**01 Home** in the index resets the record, so a reviewer always sees it.

Why split it at all: a 4.6-second set piece gating a tile tap is delightful
once and a toll thereafter, and a "tap to skip" is an admission of that rather
than a fix. `src/screens/home/useDepartureSequence.ts` owns both timelines and
the decision between them.

Verified by `tools/verify_departure.mjs`: the first tap is long and has the
board, the second is under 900ms and does not, the incoming screen is genuinely
clipped rather than faded, the circle opens from the tile rather than the
middle, no frame ever shows two screens cross-faded over each other, and Replay
restores the long one.

## On a phone

Open the link on a phone and the presenter shell comes off. Below 600px the
bezel, the dark stage, the toolbar and the caption are all dropped and the
design becomes the viewport — `data-mode="bleed"` on `.app`, driven by
`src/app/useViewport.ts`.

The canvas keeps its **393 logical width** and is scaled up to the device
instead of every component being made responsive. That is a deliberate trade:
scaling keeps every measurement taken off the Figma file in proportion — a 343px
card in a 20px gutter stays a 343px card in a 20px gutter — where a fluid layout
would have relitigated all of them. On a 375pt SE the whole design runs at
0.954x and on a 430pt Pro Max at 1.094x; it reads as a smaller or larger phone,
which is what it is.

The **height** is not 852 there. It is whatever the viewport divides down to —
about 745 in Safari with its chrome showing, 858 on a Pixel — so nothing may
assume a fixed screen height. `DepartureCurtain` measures its frame for exactly
this reason.

| | |
|---|---|
| Index | A drawer, shut on arrival, opened by the pill bottom-right. It used to default open and cover 78% of the screen. |
| Status bar | The drawn one is the only one in a browser tab. Installed to a home screen the device draws its own, so the drawn one is dropped and its space given to the notch. |
| Landscape | Under 520px of height, a prompt to turn the phone back. A portrait design at 852x393 has nowhere to go. |
| Tablet / small desktop | Still framed, but the index is a drawer rather than a column. |

Verified by two harnesses, against the dev server or a production preview:

```bash
node tools/verify_bleed.mjs /tmp/shots          # 6 viewports x 22 screens + landscape
node tools/verify_curtain_bleed.mjs             # the departure sequence at 5 widths
BASE=http://localhost:4180 node tools/verify_bleed.mjs /tmp/shots   # against `vite preview`
```

The first asserts coverage, drawer behaviour, no sideways shell scroll and no
console errors on every screen; the second measures the curtain's ground
coverage, the word's resting position and the exit circle's reach at each
width.

## Reading the design system

`#/dev/gallery` renders every token and every component variant side by side.
Each swatch is read from `tokens.css` rather than re-typed, so the page is a
live view of the system, not a picture of it.

The rail's **"Ghost the Figma render"** toggle overlays the exported PNG for the
current screen in `difference` blend mode — anything that has moved lights up.

## Notes

- `src/data/settings.json` pins `today` to a fixed date. A prototype that reads
  the real clock silently drifts: the trip becomes 8 days, the bill date moves,
  and the screenshots stop matching the file.
- Overlays portal into `#device-portal` inside the phone, never `document.body`.
  `src/app/DeviceFrameContext.tsx` explains why that matters.
- **[DIVERGENCES.md](./DIVERGENCES.md)** records every deliberate departure from
  the Figma, including the one number that changes (GST).
