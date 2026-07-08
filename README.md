# China · Japan Itinerary 🇨🇳🇯🇵

A mobile-first, offline-friendly travel companion for the Autumn 2026 trip.
Pure HTML/CSS/JS — no build step, no dependencies.

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

## What's inside

- **Days** — a scrollable feed of "boarding pass" day cards. Each has a photo
  header, the day's focus area, a **hotel bar** (tap to add the hotel name, area
  & address for that stay — it fills in across every day of the leg), and
  Morning / Afternoon / Evening to-do lists. Tap the photo (or the *Eat & drink*
  button) to **flip** the card and reveal restaurant & café suggestions.
- **To Book** — time-sensitive reservations (Shanghai Disneyland, Wild Animal
  Park, Ghibli Museum, Pokémon Café, Hikiniku to Come, hotel transfers…). Each
  card shows where you're going, the visit date, and a **when-to-book** strip
  with a live countdown, colour-coded by urgency. Tick one once it's booked.
- **To Buy** — shopping checklist grouped by China / Japan / Gifts.
- **Flights** — a boarding-pass card per leg; fill in flight numbers, times,
  seats & confirmation codes.
- **Tips** — payments, connectivity, etiquette and packing notes.

### Interactions
- ✅ Tick any place off — the progress bar at the top updates.
- ➕ **Add a place** to any section (with optional opening/closing times,
  address and notes — tap the chevron to expand details).
- 📷 **Photo** button on each day lets you paste an image URL for the header.
- 💾 Everything is saved to your browser's **localStorage**, so ticks, added
  places, photos and flight info persist between visits.
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
- `SHOPPING`, `FLIGHTS`, `TIPS` — the other tabs.

Editing this file changes the **default** data. Anything you've already saved in
the browser stays until you hit **Reset**.

## Files

```
index.html      layout + Google Fonts
css/style.css   boarding-pass design system
js/data.js      the itinerary (edit me!)
js/app.js       rendering, interactions & saving
```
