# China · Japan Itinerary 🇨🇳🇯🇵

A mobile-first, offline-friendly travel companion for the Autumn 2026 trip.
Pure HTML/CSS/JS — no build step, no dependencies, installable as a PWA.

**Trip:** Sep 28 → Oct 22, 2026
Shanghai · Osaka · Tokyo · Beijing · Shanghai (home)

## How to run

**Easiest (VS Code Live Server):**
1. Install the **Live Server** extension in VS Code.
2. Right-click `index.html` → **Open with Live Server**.

**Or from a terminal:**
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

You can also just double-click `index.html` to open it in a browser.
For the best mobile feel, open your browser's dev tools and toggle the
device/mobile view.

### Install it as an app
The app ships a web manifest and a service worker, so on a phone you can use
**Add to Home Screen** to install it. Once installed the app shell — including
all the city header photos (lightweight WebP, ~2.6 MB total) — is cached, so it
opens instantly and works fully offline.

## What's inside

Navigation lives in the bottom tab bar (with a hand-drawn squiggle under the
active tab and a subtle haptic tap on supported devices).

- **Days** — a scrollable feed of "boarding pass" day cards. Each has a photo
  header, the day's focus area, a live **weather** chip, a **hotel bar** (tap to
  add the hotel name, area & address for that stay — it fills in across every day
  of the leg), and Morning / Afternoon / Evening to-do lists. Tap the photo (or
  the *Eat & drink* button) to **flip** the card and reveal restaurant & café
  suggestions.
  - Each day card shows a **circular progress donut** (orange→green gradient)
    that fills smoothly as you tick items off.
  - **Filter** the feed by **All / To-do / Done** (centred under the header).
    A day counts as *Done* once every item is ticked **or** its date has passed,
    so past days drop out of the way to keep the itinerary focused.
  - Switch between **List** and **Calendar** views, and **reorder** days by
    dragging the handle or tapping ▲▼ (dates stay fixed; your plans move).
- **To Book** — time-sensitive reservations (Shanghai Disneyland, Wild Animal
  Park, Ghibli Museum, Pokémon Café, Hikiniku to Come, hotel transfers…). Each
  card shows where you're going, the visit date, and a **when-to-book** strip
  with a live countdown, colour-coded by urgency. Tick one once it's booked.
- **To Buy** — shopping checklist grouped by China / Japan / Gifts.
- **Flights** — a boarding-pass card per leg; fill in flight numbers, times,
  seats & confirmation codes.
- **Hotels** — one card per stay; fill in and review hotel details across legs.
- **Tips** — payments, connectivity, etiquette and packing notes, plus the
  **Reset** control.
- **More** — a hub of extra trip tools:
  - **Packing list** — tick things off as you pack; add or hide items.
  - **Budget tracker** — log spend in ¥ / £, auto-converted using live rates.
  - **Emergency & essentials** — key numbers, embassies and hotel addresses,
    with one-tap map links.
  - **Phrasebook** — key phrases in Mandarin & Japanese. Each phrase shows the
    native script and a romanised pronunciation, with a **speaker button** that
    reads it aloud in the correct language (Web Speech API).
  - **Documents** — store tickets & bookings offline (files kept in IndexedDB).

### Live info (no API keys needed)
- **Weather** — per-city forecast / seasonal averages via Open-Meteo, cached
  for 6 hours and available offline.
- **Currency** — a £1 → CNY / JPY chip in the masthead, refreshed daily and
  cached, powering the budget tracker's conversions.

### Interactions
- ✅ Tick any place off — the day donut and the top progress bar animate up
  smoothly, counting to the new percentage.
- ⭐ **Rate restaurants & cafés** out of 5 stars and jot a **memory note** so you
  remember whether a place was worth it.
- ➕ **Add a place** to any section (with optional opening/closing times,
  address and notes — tap the chevron to expand details).
- 📷 **Photo** button on each day lets you paste an image URL for the header.
- 🌗 **Light / dark theme** toggle in the masthead.
- 💾 Everything is saved to your browser's **localStorage** (documents in
  IndexedDB), so ticks, ratings, notes, added places, photos, packing, budget
  and flight info persist between visits.
- ♻️ **Reset all my changes** (bottom of the Tips tab) restores the starting
  itinerary.

## Editing the itinerary

All the trip content lives in [`js/data.js`](js/data.js):
- `DAYS` — each day's focus, photo query, and morning/afternoon/evening items
  plus restaurants & cafés.
- `HOTELS` — one entry per stay (a leg of the trip), matched to days by date
  range. Names/areas start blank so you can fill them in from the app.
- `BOOKINGS` — the "To Book" list. Set `bookByDate` (ISO) to drive the countdown
  chip and urgency colour; `visit` for the day you're going; `flexible: true`
  for anything whose location/date can flex.
- `SHOPPING`, `FLIGHTS`, `TIPS` — the To Buy / Flights / Tips tabs.
- `PACKING`, `EMERGENCY`, `PHRASEBOOK` — the More hub tools. Phrasebook groups
  carry a `code` (BCP-47, e.g. `zh-CN`, `ja-JP`) so the speaker uses the right
  voice.

Editing this file changes the **default** data. Anything you've already saved in
the browser stays until you hit **Reset**.

## Files

```
index.html            layout + Google Fonts
manifest.webmanifest  PWA manifest (installable)
sw.js                 service worker (offline app shell + runtime caching)
css/style.css         boarding-pass design system
js/data.js            the itinerary (edit me!)
js/app.js             rendering, interactions, saving & live data
assets/icons/         app icons (+ generate_icons.py)
assets/photos/        day header images (optimised WebP)
```

> **Note on caching:** the app shell is versioned. When you change `css/style.css`,
> `js/app.js` or `js/data.js`, bump the `?v=` query on those files in both
> `index.html` and `sw.js`, and bump `CACHE_VERSION` in `sw.js`, so installed
> clients pick up the update.
