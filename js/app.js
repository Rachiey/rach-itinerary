/* =====================================================================
   app.js — rendering, interaction & persistence
   Vanilla JS. State is saved to localStorage so ticks / added places /
   flight info / photos all persist between visits.
   ===================================================================== */

(function () {
  "use strict";

  const DATA = window.TRIP_DATA;
  const STORAGE_KEY = "rach-itinerary-v1";

  /* ---------- City theming (used for default header gradients) ---------- */
  const CITY_THEME = {
    shanghai: { g: "linear-gradient(135deg,#8f2c27,#b23a34 55%,#c69a4c)", emoji: "🏮" },
    osaka:    { g: "linear-gradient(135deg,#14504a,#2f6f5e 55%,#6bbfa6)", emoji: "🐙" },
    tokyo:    { g: "linear-gradient(135deg,#3b2a5a,#7d3c98 50%,#d84f8c)", emoji: "🗼" },
    beijing:  { g: "linear-gradient(135deg,#6e1e1a,#b23a34 60%,#e0a24a)", emoji: "🏯" },
  };

  /* ---------- State ---------- */
  let state = loadState();

  function loadState() {
    let s = { over: {}, added: {}, hidden: {}, flights: {}, photos: {}, hotels: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) s = Object.assign(s, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    if (!s.hotels) s.hotels = {};
    return s;
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function genId() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* ---------- SVG icon helpers ---------- */
  const ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8.5" cy="13.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="13.5" r=".5" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    bed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v-.5a2.5 2.5 0 0 1 2.5-2.5h3A2.5 2.5 0 0 1 14 7.5V8"/></svg>',
    walk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1"/><path d="m9 20 2-5 2 2v3"/><path d="m6 12 3-3 2 2 2-1 3 3"/><path d="M11 9v3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
  };
  const NAV_ICON = {
    days: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z"/><line x1="12" y1="5" x2="12" y2="19" stroke-dasharray="2 3"/></svg>',
    buy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    flights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8L8 11l-3 3H2l2 3 3 2 1-3 3-3 3.5 3.7a.5.5 0 0 0 .8-.5z"/></svg>',
    hotels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M16 8h3a2 2 0 0 1 2 2v11"/><path d="M1 21h22"/><path d="M7 7h.01M11 7h.01M7 11h.01M11 11h.01M7 15h.01M11 15h.01"/></svg>',
    tips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>',
  };

  /* ---------- Utilities ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function fmtDate(iso) {
    const d = new Date(iso + "T00:00:00");
    const dow = d.toLocaleDateString("en-GB", { weekday: "short" }).toUpperCase();
    const day = d.getDate();
    const mon = d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
    return { dow, big: day + " " + mon };
  }

  /* Merge a seed place with any saved override. */
  function resolvePlace(seed) {
    const o = state.over[seed.id];
    if (!o) return seed;
    return {
      id: seed.id,
      name: o.name != null ? o.name : seed.name,
      done: !!o.done,
      details: Object.assign({}, seed.details, o.details || {}),
    };
  }
  function ensureOver(id, seedName) {
    if (!state.over[id]) state.over[id] = { name: seedName, done: false, details: {} };
    return state.over[id];
  }

  /* Get every place (seed + added, minus hidden) for a container. */
  function placesFor(seedList, containerKey) {
    const out = [];
    (seedList || []).forEach(function (p) {
      if (state.hidden[p.id]) return;
      out.push(resolvePlace(p));
    });
    (state.added[containerKey] || []).forEach(function (p) {
      if (state.hidden[p.id]) return;
      out.push(p);
    });
    return out;
  }

  /* Nicely format an opening/closing pair: single time shows on its own. */
  function formatHours(open, close) {
    open = (open || "").trim();
    close = (close || "").trim();
    if (open && close) return open + "–" + close;
    if (open) return open;
    if (close) return "til " + close;
    return "";
  }

  /* =====================================================================
     RENDER: a single to-do place row
     travelInfo (itinerary stops only): { first: bool } → shows a "X min from
     hotel / away" chip and adds a Travel-time field to the editor.
     ===================================================================== */
  function renderPlace(p, containerKey, travelInfo) {
    const d = p.details || {};
    const hours = formatHours(d.open, d.close);
    const isItin = !!travelInfo;
    const travel = (d.travel == null ? "" : String(d.travel)).trim();
    const travelChip = (isItin && travel)
      ? '<div class="travel-chip">' + ICON.walk + ' ' + esc(travel) + ' min ' + travelLabel(travelInfo.first, d.travelFrom) + '</div>'
      : "";
    const hoursChip = hours ? '<div class="todo-meta">' + esc(hours) + '</div>' : "";
    return (
      '<div class="todo' + (p.done ? " done" : "") + '" data-place="' + p.id + '" data-container="' + esc(containerKey) + '"' +
        (isItin ? ' data-itin="1" data-first="' + (travelInfo.first ? "1" : "0") + '"' : '') + '>' +
        '<div class="todo-row">' +
          '<button class="check" data-act="toggle" aria-label="Toggle done">' + ICON.check + '</button>' +
          '<div class="todo-name">' + esc(p.name) + '</div>' +
          '<div class="todo-chips">' + travelChip + hoursChip + '</div>' +
          '<button class="todo-expand" data-act="expand" aria-label="Details">' + ICON.chevron + '</button>' +
        '</div>' +
        '<div class="todo-detail">' +
          '<div class="detail-grid">' +
            field("Opens", "open", d.open, "e.g. 09:00") +
            field("Closes", "close", d.close, "e.g. 17:00") +
            (isItin ? field("Travel time (mins)", "travel", d.travel, "e.g. 10") : "") +
            (isItin ? field("From (label)", "travelFrom", d.travelFrom, travelInfo.first ? "hotel" : "previous stop") : "") +
            field("Address", "address", d.address, "Where is it?", true) +
            field("Notes", "note", d.note, "Anything to remember…", true, true) +
          '</div>' +
          '<div class="detail-actions">' +
            '<button class="link-danger" data-act="delete">Remove</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }
  // Wording for the travel chip: use the custom "from" label if the user set
  // one, otherwise fall back to the sensible default for this stop's position.
  function travelLabel(first, from) {
    const f = (from == null ? "" : String(from)).trim();
    if (f) return "from " + esc(f);
    return first ? "from hotel" : "away";
  }
  function field(label, key, val, ph, full, area) {
    const cls = "field" + (full ? " full" : "");
    const input = area
      ? '<textarea data-field="' + key + '" placeholder="' + esc(ph) + '">' + esc(val) + '</textarea>'
      : '<input data-field="' + key + '" value="' + esc(val) + '" placeholder="' + esc(ph) + '">';
    return '<div class="' + cls + '"><label>' + label + '</label>' + input + '</div>';
  }

  function renderSlot(day, slotKey, label, dotClass, seq) {
    const containerKey = day.id + ":" + slotKey;
    const list = placesFor(day[slotKey], containerKey);
    const rows = list.map(function (p) {
      const info = { first: seq.n === 0 };
      seq.n++;
      return renderPlace(p, containerKey, info);
    }).join("");
    return (
      '<div class="slot">' +
        '<div class="slot-head"><span class="dot ' + dotClass + '"></span><h4>' + label + '</h4></div>' +
        rows +
        '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add a place</button>' +
      '</div>'
    );
  }

  function renderBackList(day, slotKey, label) {
    const containerKey = day.id + ":" + slotKey;
    const list = placesFor(day[slotKey], containerKey);
    const rows = list.length
      ? list.map(function (p) { return renderPlace(p, containerKey); }).join("")
      : '<p class="empty">Nothing yet — add a spot.</p>';
    return (
      '<div class="slot">' +
        '<div class="slot-head"><span class="dot ' + (slotKey === "restaurants" ? "afternoon" : "evening") + '"></span><h4>' + label + '</h4></div>' +
        rows +
        '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add a place</button>' +
      '</div>'
    );
  }

  /* =====================================================================
     RENDER: a full day card (front + back)
     ===================================================================== */
  function hotelForDay(day) {
    return DATA.hotels.find(function (h) {
      return day.date >= h.from && day.date <= h.to;
    });
  }
  function resolveHotel(h) {
    const o = state.hotels[h.id] || {};
    return {
      id: h.id,
      name: o.name != null ? o.name : h.name,
      area: o.area != null ? o.area : h.area,
      address: o.address != null ? o.address : h.address,
      checkIn: o.checkIn != null ? o.checkIn : (h.checkIn || ""),
      checkOut: o.checkOut != null ? o.checkOut : (h.checkOut || ""),
    };
  }
  function hotelInfoHTML(h) {
    const hasName = h.name && h.name.trim();
    const loc = [h.area, h.address].filter(function (x) { return x && x.trim(); }).join(" · ");
    const times = (h.checkIn || h.checkOut)
      ? '<div class="hotel-times">' + ICON.clock + ' In ' + esc(h.checkIn || "—") + ' · Out ' + esc(h.checkOut || "—") + '</div>'
      : "";
    return hasName
      ? '<div class="hotel-name">' + esc(h.name) + '</div>' +
        (loc ? '<div class="hotel-loc">' + ICON.pin + ' ' + esc(loc) + '</div>' : '<div class="hotel-loc hotel-empty">Tap to add the location</div>') +
        times
      : '<div class="hotel-name hotel-empty">Add your hotel</div>' +
        '<div class="hotel-loc hotel-empty">Name, area &amp; address</div>';
  }
  function renderHotelBar(day) {
    const seed = hotelForDay(day);
    if (!seed) return "";
    return renderHotelBlock(seed);
  }
  function renderHotelBlock(seed) {
    const h = resolveHotel(seed);
    const hasName = h.name && h.name.trim();
    return (
      '<div class="hotel" data-hotel="' + esc(seed.id) + '">' +
        '<button class="hotel-bar' + (hasName ? "" : " is-empty") + '" data-act="hotel">' +
          '<span class="hotel-icon">' + ICON.bed + '</span>' +
          '<span class="hotel-info">' + hotelInfoHTML(h) + '</span>' +
          '<span class="hotel-edit">' + ICON.edit + '</span>' +
        '</button>' +
        '<div class="hotel-editor">' +
          '<div class="detail-grid">' +
            '<div class="field full"><label>Hotel name</label><input data-hotelfield="name" value="' + esc(h.name) + '" placeholder="Where you\'re staying"></div>' +
            '<div class="field full"><label>Area / neighbourhood</label><input data-hotelfield="area" value="' + esc(h.area) + '" placeholder="e.g. Jing\'an · Huaihai Rd"></div>' +
            '<div class="field full"><label>Address</label><input data-hotelfield="address" value="' + esc(h.address) + '" placeholder="Street address"></div>' +
            '<div class="field"><label>Check-in</label><input data-hotelfield="checkIn" value="' + esc(h.checkIn) + '" placeholder="e.g. 15:00"></div>' +
            '<div class="field"><label>Check-out</label><input data-hotelfield="checkOut" value="' + esc(h.checkOut) + '" placeholder="e.g. 12:00"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderDay(day) {
    const city = DATA.cities[day.city];
    const theme = CITY_THEME[day.city] || { g: "var(--line-strong)", emoji: "📍" };
    const dt = fmtDate(day.date);
    const photo = state.photos[day.id] || day.photo;
    const bg = photo
  ? "background-image:url(" + photo + ");"
  : "background-image:" + theme.g + ";";

    // Running counter across the day so travel chips read "from hotel" for the
    // first stop and "away" (from the previous stop) for the rest.
    const seq = { n: 0 };

    const front =
      '<div class="day-face">' +
        '<div class="day-photo" style="' + bg + '" data-act="flip">' +
          '<div class="stub-code">' + esc(city.code) + '</div>' +
          '<div class="day-caption">' +
            '<div class="dow">' + dt.dow + ' · ' + esc(city.name) + '</div>' +
            '<div class="date">' + dt.big + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="perf"></div>' +
        '<div class="day-body">' +
          '<button class="day-focus" data-act="daytoggle">' +
            '<span class="day-meta">' +
              '<span class="day-date-mini">' + dt.dow + ' · ' + dt.big + '</span>' +
              '<h3>' + esc(day.focus) + '</h3>' +
            '</span>' +
            '<span class="city-tag">' + theme.emoji + ' ' + esc(city.code) + '</span>' +
            '<span class="day-chevron">' + ICON.chevron + '</span>' +
          '</button>' +
          '<div class="day-collapse">' +
            '<div class="flip-hint">Tap the photo to flip for food &amp; cafés →</div>' +
            renderHotelBar(day) +
            renderSlot(day, "morning", "Morning", "morning", seq) +
            renderSlot(day, "afternoon", "Afternoon", "afternoon", seq) +
            renderSlot(day, "evening", "Evening", "evening", seq) +
            '<button class="flip-btn" data-act="flip">' + ICON.flip + ' Eat &amp; drink</button> ' +
            '<button class="flip-btn" data-act="photo">' + ICON.camera + ' Photo</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const back =
      '<div class="day-back">' +
        '<div class="day-face">' +
          '<div class="back-header">' +
            '<h3>Eat &amp; Drink</h3>' +
            '<span class="city-tag">' + dt.big + ' · ' + esc(city.name) + '</span>' +
          '</div>' +
          '<div class="back-body">' +
            renderBackList(day, "restaurants", "Restaurants") +
            renderBackList(day, "cafes", "Cafés") +
            '<button class="flip-btn" data-act="flip">' + ICON.flip + ' Back to plan</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    return (
      '<div class="day collapsed" data-day="' + day.id + '">' +
        '<div class="day-inner">' + front + back + '</div>' +
      '</div>'
    );
  }

  /* =====================================================================
     RENDER: panels
     ===================================================================== */
  function renderItinerary() {
    let html = "";
    let lastCity = null;
    DATA.days.forEach(function (day) {
      if (day.city !== lastCity) {
        const c = DATA.cities[day.city];
        html += '<div class="leg-heading"><span>' + esc(c.flag + " " + c.name + " · " + c.code) + '</span></div>';
        lastCity = day.city;
      }
      html += renderDay(day);
    });
    document.getElementById("panel-days").innerHTML = html;
  }

  function renderShopping() {
    let html = '<h2 class="section-title">Things to buy</h2>';
    DATA.shopping.forEach(function (group) {
      const containerKey = "shop:" + group.category;
      const list = placesFor(group.items, containerKey);
      html += '<div class="shop-group"><h3>' + esc(group.category) + '</h3>';
      html += list.map(function (p) { return renderPlace(p, containerKey); }).join("");
      html += '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add an item</button>';
      html += '</div>';
    });
    document.getElementById("panel-buy").innerHTML = html;
  }

  /* Booked state for a booking (seed → state.over, added → its own flag). */
  function isBooked(id, containerKey) {
    if (isAdded(containerKey, id)) {
      const p = state.added[containerKey].find(function (x) { return x.id === id; });
      return p ? !!p.done : false;
    }
    return !!(state.over[id] && state.over[id].done);
  }

  /* Turn a book-by date into a friendly countdown + urgency level. */
  function bookingCountdown(iso) {
    if (!iso) return { text: "Date TBC", level: "flex" };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(iso + "T00:00:00");
    const days = Math.round((target - today) / 86400000);
    const dt = fmtDate(iso);
    if (days < 0)  return { text: "Window open — book now (" + dt.big + ")", level: "now" };
    if (days === 0) return { text: "Opens today (" + dt.big + ")", level: "now" };
    if (days <= 14) return { text: "Opens in " + days + " days · " + dt.big, level: "soon" };
    return { text: "Opens " + dt.big + " · " + days + " days", level: "later" };
  }

  function renderBooking(b, containerKey) {
    const booked = isBooked(b.id, containerKey);
    const cd = bookingCountdown(b.bookByDate);
    const visit = b.visit ? fmtDate(b.visit).big : "Date flexible";
    let d;
    if (isAdded(containerKey, b.id)) d = b.details || {};
    else d = Object.assign({}, b.details || {}, (state.over[b.id] && state.over[b.id].details) || {});
    return (
      '<div class="todo booking urg-' + cd.level + (booked ? " done" : "") + '" data-place="' + b.id + '" data-container="' + esc(containerKey) + '">' +
        '<div class="todo-row">' +
          '<button class="check" data-act="toggle" aria-label="Mark booked">' + ICON.check + '</button>' +
          '<div class="booking-main">' +
            '<div class="booking-name">' + esc(b.name) + (b.flexible ? ' <span class="flex-tag">flexible</span>' : '') + '</div>' +
            '<div class="booking-where">' + ICON.pin + ' ' + esc(b.where || "") + '</div>' +
          '</div>' +
          '<div class="booking-visit"><span class="lbl">GO</span>' + esc(visit) + '</div>' +
          '<button class="todo-expand" data-act="expand" aria-label="Details">' + ICON.chevron + '</button>' +
        '</div>' +
        '<div class="booking-when"><span class="pulse"></span><div><strong>' + esc(b.bookBy) + '</strong><span class="cd">' + esc(cd.text) + '</span></div></div>' +
        (b.note ? '<div class="booking-note">' + esc(b.note) + '</div>' : '') +
        '<div class="todo-detail">' +
          '<div class="detail-grid">' +
            field("Booking ref", "ref", d.ref, "Confirmation #", true) +
            field("My notes", "note2", d.note2, "Anything to remember…", true, true) +
          '</div>' +
          '<div class="detail-actions">' +
            '<button class="link-danger" data-act="delete">Remove</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function renderBookings() {
    const containerKey = "book";
    let html = '<h2 class="section-title">Things to book</h2>' +
      '<p class="empty" style="margin-bottom:14px">Time-sensitive reservations. Tick one once it\'s booked — the chip shows when each window opens.</p>';

    // Seed bookings (respecting deletions) + any you\'ve added, sorted by urgency.
    const seed = DATA.bookings.filter(function (b) { return !state.hidden[b.id]; });
    const added = (state.added[containerKey] || []).filter(function (b) { return !state.hidden[b.id]; });
    const all = seed.concat(added);
    const rank = { now: 0, soon: 1, later: 2, flex: 3 };
    all.sort(function (a, b) {
      const la = bookingCountdown(a.bookByDate).level, lb = bookingCountdown(b.bookByDate).level;
      return (rank[la] - rank[lb]);
    });

    html += all.map(function (b) { return renderBooking(b, containerKey); }).join("");
    html += '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add something to book</button>';
    document.getElementById("panel-book").innerHTML = html;
  }

  function renderFlights() {
    let html = '<h2 class="section-title">Flight info</h2>' +
      '<p class="empty" style="margin-bottom:12px">Tap a field to fill in your times &amp; seats — it saves automatically.</p>';
    DATA.flights.forEach(function (f) {
      const s = state.flights[f.id] || {};
      const val = function (k, d) { return s[k] != null ? s[k] : (d || ""); };
      const isTrain = f.mode === "train";
      html +=
        '<div class="flight' + (isTrain ? " is-train" : "") + '" data-flight="' + f.id + '">' +
          '<div class="flight-label">' + esc(f.label) + ' · ' + esc(f.date) + '</div>' +
          '<div class="flight-top">' +
            '<div class="flight-city"><div class="code">' + esc(f.fromCode) + '</div><div class="name">' + esc(f.from) + '</div></div>' +
            '<div class="flight-arrow"><span class="line"></span>' + (isTrain ? ICON.train : ICON.plane) + '<span class="line"></span></div>' +
            '<div class="flight-city"><div class="code">' + esc(f.toCode) + '</div><div class="name">' + esc(f.to) + '</div></div>' +
          '</div>' +
          '<div class="flight-perf"></div>' +
          '<div class="flight-detail">' +
            fField(isTrain ? "Service" : "Flight", "flightNo", val("flightNo", f.flightNo)) +
            fField("Depart", "dep", val("dep", f.dep)) +
            fField("Arrive", "arr", val("arr", f.arr)) +
            (isTrain ? "" : fField("Dep terminal", "depTerm", val("depTerm", f.depTerm))) +
            (isTrain ? "" : fField("Arr terminal", "arrTerm", val("arrTerm", f.arrTerm))) +
            fField("Seat", "seat", val("seat", f.seat)) +
            fField("Conf #", "conf", val("conf", f.conf)) +
          '</div>' +
        '</div>';
    });
    document.getElementById("panel-flights").innerHTML = html;
  }
  function fField(label, key, val) {
    return '<div class="field"><label>' + label + '</label><input data-fflight="' + key + '" value="' + esc(val) + '" placeholder="—"></div>';
  }

  function renderTips() {
    let html = '<h2 class="section-title">Good to know</h2>';
    DATA.tips.forEach(function (t) {
      html +=
        '<div class="tip">' +
          '<div class="tip-icon">' + t.icon + '</div>' +
          '<div><h3>' + esc(t.title) + '</h3><p>' + esc(t.body) + '</p></div>' +
        '</div>';
    });
    html +=
      '<div class="footer-note">Everything you tick or add is saved on this device.<br>' +
      '<button class="reset-btn" id="reset">Reset all my changes</button></div>';
    document.getElementById("panel-tips").innerHTML = html;
  }

  function renderHotels() {
    let html = '<h2 class="section-title">Where you\'re staying</h2>' +
      '<p class="empty" style="margin-bottom:14px">Every stay on the trip. Tap a card to edit the name, address or check-in / check-out — it saves automatically and syncs to the day cards.</p>';
    DATA.hotels.forEach(function (seed) {
      const city = DATA.cities[seed.city];
      const range = fmtDate(seed.from).big + " → " + fmtDate(seed.to).big;
      html +=
        '<div class="hotel-card">' +
          '<div class="hotel-card-head">' +
            '<span class="hc-city">' + esc(city ? city.flag + " " + city.name : seed.city) + '</span>' +
            '<span class="hc-dates">' + esc(range) + '</span>' +
          '</div>' +
          renderHotelBlock(seed) +
        '</div>';
    });
    document.getElementById("panel-hotels").innerHTML = html;
  }

  /* ---------- Progress bar ---------- */
  function updateProgress() {
    let total = 0, done = 0;
    DATA.days.forEach(function (day) {
      ["morning", "afternoon", "evening", "restaurants", "cafes"].forEach(function (slot) {
        const key = day.id + ":" + slot;
        placesFor(day[slot], key).forEach(function (p) { total++; if (p.done) done++; });
      });
    });
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById("progressFill").style.width = pct + "%";
    document.getElementById("progressLabel").textContent = done + " / " + total + " ticked off · " + pct + "%";
  }

  /* =====================================================================
     EVENTS (delegated)
     ===================================================================== */
  document.addEventListener("click", function (e) {
    const actEl = e.target.closest("[data-act]");
    if (!actEl) return;
    const act = actEl.getAttribute("data-act");

    if (act === "daytoggle") {
      const day = actEl.closest(".day");
      if (day) {
        day.classList.toggle("collapsed");
        if (day.classList.contains("collapsed")) day.classList.remove("flipped");
      }
      return;
    }
    if (act === "flip") {
      const day = actEl.closest(".day");
      if (day) {
        // A collapsed card expands on tap instead of flipping.
        if (day.classList.contains("collapsed")) day.classList.remove("collapsed");
        else day.classList.toggle("flipped");
      }
      return;
    }
    if (act === "toggle") {
      const todo = actEl.closest(".todo");
      togglePlace(todo);
      return;
    }
    if (act === "expand") {
      const todo = actEl.closest(".todo");
      todo.classList.toggle("open");
      return;
    }
    if (act === "add") {
      addPlace(actEl.getAttribute("data-container"));
      return;
    }
    if (act === "delete") {
      const todo = actEl.closest(".todo");
      deletePlace(todo);
      return;
    }
    if (act === "photo") {
      const day = actEl.closest(".day");
      setPhoto(day.getAttribute("data-day"));
      return;
    }
    if (act === "hotel") {
      const hotel = actEl.closest(".hotel");
      if (hotel) hotel.classList.toggle("open");
      return;
    }
  });

  /* Editing detail fields (place) */
  document.addEventListener("input", function (e) {
    const fEl = e.target.closest("[data-field]");
    if (fEl) {
      const todo = fEl.closest(".todo");
      updatePlaceDetail(todo, fEl.getAttribute("data-field"), fEl.value);
      return;
    }
    const flEl = e.target.closest("[data-fflight]");
    if (flEl) {
      const flight = flEl.closest(".flight");
      updateFlight(flight.getAttribute("data-flight"), flEl.getAttribute("data-fflight"), flEl.value);
      return;
    }
    const hEl = e.target.closest("[data-hotelfield]");
    if (hEl) {
      const hotel = hEl.closest(".hotel");
      updateHotel(hotel, hEl.getAttribute("data-hotelfield"), hEl.value);
      return;
    }
  });

  /* ---------- Mutations ---------- */
  function isAdded(containerKey, id) {
    return (state.added[containerKey] || []).some(function (p) { return p.id === id; });
  }

  function togglePlace(todo) {
    const id = todo.getAttribute("data-place");
    const containerKey = todo.getAttribute("data-container");
    const nowDone = !todo.classList.contains("done");
    todo.classList.toggle("done", nowDone);

    if (isAdded(containerKey, id)) {
      const p = state.added[containerKey].find(function (x) { return x.id === id; });
      if (p) p.done = nowDone;
    } else {
      ensureOver(id).done = nowDone;
    }
    saveState();
    updateProgress();
  }

  function updatePlaceDetail(todo, field, value) {
    const id = todo.getAttribute("data-place");
    const containerKey = todo.getAttribute("data-container");
    if (isAdded(containerKey, id)) {
      const p = state.added[containerKey].find(function (x) { return x.id === id; });
      if (p) { p.details = p.details || {}; p.details[field] = value; }
    } else {
      const o = ensureOver(id);
      o.details = o.details || {};
      o.details[field] = value;
    }
    saveState();
    // keep the hours chip in sync if open/close changed
    if (field === "open" || field === "close") {
      const chips = todo.querySelector(".todo-chips");
      let meta = todo.querySelector(".todo-meta");
      const open = todo.querySelector('[data-field="open"]').value;
      const close = todo.querySelector('[data-field="close"]').value;
      const text = formatHours(open, close);
      if (meta) meta.textContent = text;
      else if (text && chips) {
        meta = document.createElement("div");
        meta.className = "todo-meta";
        meta.textContent = text;
        chips.appendChild(meta);
      }
    }
    // keep the travel chip in sync if travel time or its label changed
    if (field === "travel" || field === "travelFrom") {
      const chips = todo.querySelector(".todo-chips");
      let chip = todo.querySelector(".travel-chip");
      const v = (todo.querySelector('[data-field="travel"]').value || "").trim();
      const from = (todo.querySelector('[data-field="travelFrom"]').value || "").trim();
      if (v && chips) {
        const lbl = travelLabel(todo.getAttribute("data-first") === "1", from);
        if (!chip) {
          chip = document.createElement("div");
          chip.className = "travel-chip";
          chips.insertBefore(chip, chips.firstChild);
        }
        chip.innerHTML = ICON.walk + " " + esc(v) + " min " + lbl;
      } else if (chip) {
        chip.remove();
      }
    }
  }

  function addPlace(containerKey) {
    const name = window.prompt("Add a place / item:");
    if (!name || !name.trim()) return;
    if (!state.added[containerKey]) state.added[containerKey] = [];
    state.added[containerKey].push({
      id: genId(), name: name.trim(), done: false,
      details: { open: "", close: "", address: "", note: "" },
    });
    saveState();
    rerenderForContainer(containerKey);
    updateProgress();
  }

  function deletePlace(todo) {
    const id = todo.getAttribute("data-place");
    const containerKey = todo.getAttribute("data-container");
    if (isAdded(containerKey, id)) {
      state.added[containerKey] = state.added[containerKey].filter(function (p) { return p.id !== id; });
    } else {
      state.hidden[id] = true; // hide seed suggestion
    }
    saveState();
    rerenderForContainer(containerKey);
    updateProgress();
  }

  function updateFlight(flightId, field, value) {
    if (!state.flights[flightId]) state.flights[flightId] = {};
    state.flights[flightId][field] = value;
    saveState();
  }

  function setPhoto(dayId) {
    const current = state.photos[dayId] || "";
    const url = window.prompt("Paste an image URL for this day (leave blank to remove):", current);
    if (url === null) return;
    if (url.trim()) state.photos[dayId] = url.trim();
    else delete state.photos[dayId];
    saveState();
    renderItinerary();
  }

  function updateHotel(hotelEl, field, value) {
    const id = hotelEl.getAttribute("data-hotel");
    if (!state.hotels[id]) {
      const s = DATA.hotels.find(function (h) { return h.id === id; });
      state.hotels[id] = { name: s.name || "", area: s.area || "", address: s.address || "", checkIn: s.checkIn || "", checkOut: s.checkOut || "" };
    }
    state.hotels[id][field] = value;
    saveState();

    const seed = DATA.hotels.find(function (h) { return h.id === id; });
    const h = resolveHotel(seed);
    const hasName = h.name && h.name.trim();
    const infoHTML = hotelInfoHTML(h);

    // Same hotel can appear on several day cards (one per stay) — sync them all.
    const bars = document.querySelectorAll('.hotel[data-hotel="' + id + '"]');
    bars.forEach(function (el) {
      el.querySelector(".hotel-bar").classList.toggle("is-empty", !hasName);
      el.querySelector(".hotel-info").innerHTML = infoHTML;
      // keep other cards' editor inputs in sync (skip the one being typed in)
      if (el !== hotelEl) {
        const input = el.querySelector('[data-hotelfield="' + field + '"]');
        if (input && input.value !== value) input.value = value;
      }
    });
  }

  /* Re-render the right panel after add/delete without losing the tab. */
  function rerenderForContainer(containerKey) {
    if (containerKey.indexOf("shop:") === 0) renderShopping();
    else if (containerKey === "book") renderBookings();
    else renderItinerary();
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-target");
        tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
        document.querySelectorAll(".panel").forEach(function (p) {
          p.classList.toggle("active", p.id === "panel-" + target);
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  /* ---------- Reset ---------- */
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "reset") {
      if (window.confirm("Reset all ticks, added places, photos and flight info back to the starting itinerary?")) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        renderAll();
      }
    }
  });

  /* ---------- Masthead ---------- */
  function renderMasthead() {
    document.getElementById("tripTitle").textContent = DATA.meta.title;
    document.getElementById("tripSub").textContent = DATA.meta.subtitle;
    const s = fmtDate(DATA.meta.start), en = fmtDate(DATA.meta.end);
    document.getElementById("tripRange").textContent = s.big + " → " + en.big + " · " + DATA.days.length + " days";
  }

  /* ---------- Boot ---------- */
  function renderAll() {
    renderMasthead();
    renderItinerary();
    renderBookings();
    renderShopping();
    renderFlights();
    renderHotels();
    renderTips();
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", function () {
    // inject nav icons
    document.querySelector('[data-target="days"] .ic').innerHTML = NAV_ICON.days;
    document.querySelector('[data-target="book"] .ic').innerHTML = NAV_ICON.book;
    document.querySelector('[data-target="buy"] .ic').innerHTML = NAV_ICON.buy;
    document.querySelector('[data-target="flights"] .ic').innerHTML = NAV_ICON.flights;
    document.querySelector('[data-target="hotels"] .ic').innerHTML = NAV_ICON.hotels;
    document.querySelector('[data-target="tips"] .ic').innerHTML = NAV_ICON.tips;
    initTabs();
    renderAll();
  });
})();
