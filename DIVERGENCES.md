# Where the build departs from the Figma

Every item here is deliberate. Anything not listed is meant to match the source.

The previous build could claim exact fidelity because it *replayed* the Figma
scene graph — 1.17 MB of absolutely-positioned nodes rendered by one generic
recursive component. Nothing in it was a real input, so nothing could disagree
with the file. Making it functional means some things now have to.

---

## 1 · Things that had to be invented

The Figma has no state for these. They are absent from the file because the
file only ever drew one path through one trip.

| What | Why it exists |
|---|---|
| **Range calendar** | `SOURCE_ISSUES.md` §3.3: the calendar (`148:5670`) "sits loose on the 04 board, not inside any frame… so dates are unclickable." Rebuilt as a real range picker, styled to that node — its month pill, chevrons and black selected day. The *range* treatment (connecting band, endpoints) is invented; the source only ever shows one selected day. |
| **Search empty state** | Type something with no match and the file has nothing to show. |
| **Result-count announcements** | A live region for screen readers. The file has no such concept. |
| **Validation messages** | Six, across destinations and dates. The file draws a disabled CTA on 04.1 and an enabled one on 04.3, with nothing in between. |
| **Toasts** | They reuse the lock-screen notification component, so an in-app confirmation and the notification it previews cannot drift apart. |
| **FAQ answers** | 04.7 lists "Useful links & FAQs" as a link to nowhere. Seven real answers, in an accordion. |
| **Prototype controls on the dashboard** | Advance a day, jump to the lock screen. Deliberately styled as scaffolding rather than as UI. |
| **The expanded Live Activity** | 05.12 draws the widget collapsed and nothing else — there is no expanded state in the file. Built as a black title band over a white card: `Live in {country}` / `Day {n} of {tripDays}`, a `{n} days to go` headline, a four-stop rail (Landed · Today · Last day · Home), the minutes / SMS / extra-spent chips, and `Call, Free` + `Whatsapp`. Every figure is derived, so the widget cannot disagree with the dashboard. The rail is four fixed moments rather than one cell per day the way `TripProgress` does it — this is read at a glance off a locked phone. |
| **Working "All" and "Travel" tiles** | The quick-action row is drawn on most frames and is a picture on all of them. "All" now returns you to the home screen (`01`) from anywhere in the flow, and "Travel" opens trip creation (`04.1`) — the second way into the flow, alongside the International Roaming row. The tile you are already on is inert, so Travel does not restart the flow from inside it; Wi-Fi, Postpaid and Bank are the rest of the Airtel app and stay inert everywhere. The destination is data (`opens` in `home.json`), so wiring the others later is a JSON edit. |

## 2 · Numbers that now compute

**GST matches the file.** 04.6 draws ₹2,999 + ₹520 = ₹3,519, which is a 17.34%
rate. `gstRate` in `src/data/settings.json` is set to `0.1734` so the screen
reads exactly as drawn, and the line is labelled "GST" with no percentage —
the way the source labels it, and because printing "17%" beside it would read
as a bug.

Statutory GST on Indian telecom is 18% (₹540, total ₹3,539). If this ever needs
to be right rather than faithful, that one value is the whole change.

**Everything else is derived rather than typed**, which resolves four findings
the source audit had already made:

| `SOURCE_ISSUES.md` | How it is resolved |
|---|---|
| §1.3 — day counts disagree (Day 1 of 10, Day 1 of 9, DAY 3 OF 9) | `dayOfTrip` and `dayOfPack` are separate fields, labelled differently. The trip is 9 days; the pack is 10. They can no longer be confused because they are no longer the same number. |
| §1.4 — pack contents contradict between card and detail | One record in `packs.json` renders both. `contentsLine()` builds the card string; the sheet renders the same fields as blocks. |
| §3.4 — three duplicate "Thailand" chips, two off-frame | Chips come from `countries.json`. |
| §4 — "Wi-Fi" on some screens, "Wifi" on others | One `TileRow` component. |

**Recommendation copy is generated.** The file freezes "Covers all three
countries and outlasts your 9 days by one" onto a card. It is now built from
the trip you actually made — change the dates or add a country and the sentence
changes with it.

## 3 · Left alone, or changed on purpose

Two things the audit flagged are design decisions rather than defects to fix in
code:

- **§1.1** — 05.5's headline is pasted from 04.7 ("Usefull links & FAQs" where a
  date line belongs). The rebuilt dashboard derives its own heading, so the
  wrong string has nowhere to live. The Figma still needs fixing.
- **The lock screen's state picker is gone.** It used to carry a row of chips —
  `Live Activity`, `05.13`, `05.11`, … — plus a hint line, floating over the
  wallpaper. The index rail already lists all seven notification screens and the
  widget, and switching from there applies the right scenario as well as the
  right banner. Two controls for one thing, one of them sitting on top of the
  screen it was meant to be showing you. The rail is the one that stayed.
- **§1.2** — 05.3's banner reads "Connected 999****991" on the screen headlined
  "You've landed, but your phone hasn't connected". The banner is now derived
  from `live.connection`, so it reads "Not connected yet". **This is a change to
  what the screen says**, which is why it is listed here.

## 4 · Type

`src/styles/type.css` implements the **twelve TEXT styles named in the Figma
file** (`figma-export/raw/styles.json`), with weights, sizes, line heights and
letter spacing measured off the nodes that use them. Class names mirror the
style names.

| Style | Spec | Nodes |
|---|---|---|
| `display/32` | 700 · 32/36 · −0.5 | 5 |
| `title/24` | 700 · 24/30 · −0.3 | 78 |
| `title/24 Med` | 500 · 24/30 · −0.3 | 7 |
| `heading/18` | 700 · 18/24 | 6 |
| `value/16 Bold` | 700 · 16/22 | 30 |
| `value/16 Med` | 500 · 16/22 | 98 |
| `body/14` | 400 · 14/20 | 28 |
| `body/14 Med` | 500 · 14/20 | 111 |
| `bodyStrong/14` | 700 · 14/20 | 47 |
| `label/12` | 600 · 12/16 · +1 · UPPER | 60 |
| `caption/12` | 400 · 12/16 | 392 |
| `caption/12 Semi` | 600 · 12/16 | 75 |

The **Foundations board is out of date**, not the file. It lists eight styles
and says "Regular and Bold only, because Airtel uses no other weights" —
`SOURCE_ISSUES.md` §4 already flagged this. Four of the twelve are Medium or
Semibold, and the two most-used styles in the whole document (`caption/12` at
392 nodes and `body/14 Med` at 111) include one of them. The board's rule text
and swatch list both need updating to match what the file does.

There is **no 28px type style**. 48 nodes render Poppins 700 / 28 / 40, and
every one of them is a flag emoji glyph — sized by the `Flag` component, not
text. An earlier pass had this listed as a missing style; it was not one.

**The home bottom nav mixes families.** `Manage`, the active tab, is Poppins
600 / 12 / 16 in `--brand` — `caption/12 Semi`, an Airtel style. `Finance`,
`Shop` and `Ask Us` beside it are **Inter 400 / 11.5 / 14** in `#222222`, which
is not an Airtel style at all: it is the same spec as `.ios-caption`, the
system-chrome class `src/styles/ios.css` reserves for the lock screen and the
notification banners. The file draws it that way, so the build does too and
`Home.tsx` reuses `.ios-caption` rather than inventing a thirteenth style. It
is the one place that class appears in a product screen, and it is a defect in
the source rather than in the build — the three inactive labels should be
`caption/12` alongside their active sibling.

## 5 · Approximations

- **`GLASS`** — Figma's API payload for this effect is literally
  `{"type":"GLASS"}`; it exposes no parameters at all. Approximated as a
  translucent fill, a hairline inner ring and a 12px backdrop blur.
- **Flags** — only four Apple glyphs were baked to PNG (SG, MY, AE, TH). The
  other 22 countries render the unicode regional-indicator pair through the
  system font. `tools/bake_emoji.mjs` can produce more if PNG parity matters.
- **The hero banner** plays the real animated GIF, not the still poster frame
  the Figma REST API serves for animated fills. It is served as an animated
  WebP with the GIF as the `<picture>` fallback — the same 65 frames at 330 kB
  instead of 1.66 MB, on the screen the departure sequence lands on. The source
  GIF is still in `public/assets` and is still the file of record.

  **Nothing in the motion layer reads a colour off it.** Both transitions used
  to end on a teal sampled from this artwork, so that they would dissolve into
  the band seamlessly. That made a swappable asset the source of truth for a
  transition: change the hero, or rotate three or four of them, and the endings
  land on a colour that matches nothing — differently each session, and without
  erroring. The curtain now washes to `--bg-screen`, which every one of the 21
  screen roots already is, and the short hop's pane is `--grad-blush`, which is
  the curtain's own material. The artwork can be replaced freely.

## 6 · Checking fidelity

The old scene-graph renderer is kept at `src/legacy/`, excluded from the build,
but it is no longer how to compare against the source. Use the **"Ghost the
Figma render"** toggle in the index rail: it drops the exported PNG over the
live screen in `difference` blend mode, so anything that has moved lights up and
anything that matches goes black.
