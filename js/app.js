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
    shanghai: { g: "linear-gradient(135deg,#8f2c27,#b23a34 55%,#c69a4c)", emoji: "🏮", c: "#b23a34" },
    osaka:    { g: "linear-gradient(135deg,#14504a,#2f6f5e 55%,#6bbfa6)", emoji: "🐙", c: "#2f6f5e" },
    tokyo:    { g: "linear-gradient(135deg,#3b2a5a,#7d3c98 50%,#d84f8c)", emoji: "🗼", c: "#7d3c98" },
    beijing:  { g: "linear-gradient(135deg,#6e1e1a,#b23a34 60%,#e0a24a)", emoji: "🏯", c: "#c07a1e" },
    kyoto:    { g: "linear-gradient(135deg,#1f6b57,#3f8f7a 55%,#9ad3c0)", emoji: "⛩️", c: "#3f8f7a" },
    nara:     { g: "linear-gradient(135deg,#4a6b2e,#6f9a3e 55%,#b6d68a)", emoji: "🦌", c: "#6f9a3e" },
    yokohama: { g: "linear-gradient(135deg,#274b7a,#4a6fb0 55%,#9cc0e6)", emoji: "🌉", c: "#4a6fb0" },
    kamakura: { g: "linear-gradient(135deg,#5a3a7a,#9d6bbf 55%,#d0b0e6)", emoji: "🪷", c: "#9d6bbf" },
    suzhou:   { g: "linear-gradient(135deg,#6e1e1a,#b23a34 60%,#e0a24a)", emoji: "🏞️", c: "#a13c6e" },
  };

  /* ---------- State ---------- */
  let state = loadState();

  function loadState() {
    let s = { over: {}, added: {}, hidden: {}, flights: {}, photos: {}, hotels: {}, view: "list", theme: "light", order: {} };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) s = Object.assign(s, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    if (!s.hotels) s.hotels = {};
    if (!s.order || typeof s.order !== "object") s.order = {};
    if (s.theme !== "dark") s.theme = "light";
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
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
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

    const canReorder = !day._single;
    const reorderHandle = canReorder
      ? '<span class="day-handle" data-act="draghandle" title="Drag to reorder within this leg">' + ICON.grip + '</span>'
      : '';
    const reorderMoves = canReorder
      ? '<span class="day-move">' +
          '<button class="move-btn" type="button" data-act="moveup"' + (day._first ? ' disabled' : '') + ' aria-label="Move to an earlier date">' + ICON.up + '</button>' +
          '<button class="move-btn" type="button" data-act="movedown"' + (day._last ? ' disabled' : '') + ' aria-label="Move to a later date">' + ICON.down + '</button>' +
        '</span>'
      : '';

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
          '<div class="day-head">' +
            reorderHandle +
            '<button class="day-focus" data-act="daytoggle">' +
              '<span class="day-meta">' +
                '<span class="day-date-mini">' + dt.dow + ' · ' + dt.big + '</span>' +
                '<h3>' + esc(day.focus) + '</h3>' +
              '</span>' +
              '<span class="city-tag">' + theme.emoji + ' ' + esc(city.code) + '</span>' +
              '<span class="day-chevron">' + ICON.chevron + '</span>' +
            '</button>' +
            reorderMoves +
          '</div>' +
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
            '<div class="flip-hint">Tap anywhere blank to flip back to the plan ↩</div>' +
            renderBackList(day, "restaurants", "Restaurants") +
            renderBackList(day, "cafes", "Cafés") +
            '<button class="flip-btn" data-act="flip">' + ICON.flip + ' Back to plan</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    return (
      '<div class="day collapsed" data-day="' + day.id + '" data-leg="' + esc(day._leg || "") + '">' +
        '<div class="day-inner">' + front + back + '</div>' +
      '</div>'
    );
  }

  /* =====================================================================
     RENDER: panels
     ===================================================================== */
  /* =====================================================================
     Reorderable legs — shuffle day PLANS within a leg while the dates
     (and therefore flights & hotels, which are pinned to dates) stay put.
     A "leg" is one hotel stay: a block bounded by fixed flights / transfers,
     so plans never jump across a flight or into the wrong hotel/city.
     ===================================================================== */
  function legKeyForDay(day) {
    const h = hotelForDay(day);
    if (h) return "h:" + h.id;
    const c = DATA.cities[day.city];
    return "c:" + (c ? c.country : day.city);
  }

  // Returns the trip days with any user reordering applied. Each day keeps its
  // own id + plan, but its DATE is reassigned from the leg's fixed date slots
  // in the chosen order. Also annotates _leg / _first / _last / _single.
  function effectiveDays() {
    const groups = {};
    const keyOrder = [];
    DATA.days.forEach(function (d) {
      const k = legKeyForDay(d);
      if (!groups[k]) { groups[k] = []; keyOrder.push(k); }
      groups[k].push(d);
    });
    const out = [];
    keyOrder.forEach(function (k) {
      const members = groups[k];
      const ids = members.map(function (d) { return d.id; });
      const slots = members.map(function (d) { return d.date; }).sort();
      let order = (state.order && state.order[k]) ? state.order[k].slice() : null;
      const valid = order && order.length === ids.length &&
        order.every(function (id) { return ids.indexOf(id) !== -1; });
      if (!valid) order = ids.slice();
      const byId = {};
      members.forEach(function (d) { byId[d.id] = d; });
      order.forEach(function (id, i) {
        out.push(Object.assign({}, byId[id], {
          date: slots[i],
          _leg: k,
          _first: i === 0,
          _last: i === order.length - 1,
          _single: order.length === 1,
        }));
      });
    });
    out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return out;
  }

  // Move a day one slot earlier (-1) or later (+1) within its leg.
  function moveDay(dayId, dir) {
    const eff = effectiveDays();
    const day = eff.find(function (d) { return d.id === dayId; });
    if (!day) return;
    const members = eff.filter(function (d) { return d._leg === day._leg; });
    const idx = members.findIndex(function (d) { return d.id === dayId; });
    const target = idx + dir;
    if (target < 0 || target >= members.length) return;
    const order = members.map(function (d) { return d.id; });
    const t = order[target]; order[target] = order[idx]; order[idx] = t;
    state.order[day._leg] = order;
    saveState();
    renderItinerary();
    flashDay(dayId);
  }

  // Drop the dragged day in front of the target day (same leg only).
  function reorderDayTo(dragId, dropId) {
    if (!dragId || !dropId || dragId === dropId) return;
    const eff = effectiveDays();
    const a = eff.find(function (d) { return d.id === dragId; });
    const b = eff.find(function (d) { return d.id === dropId; });
    if (!a || !b || a._leg !== b._leg) return;
    let order = eff.filter(function (d) { return d._leg === a._leg; })
      .map(function (d) { return d.id; })
      .filter(function (id) { return id !== dragId; });
    const to = order.indexOf(dropId);
    order.splice(to, 0, dragId);
    state.order[a._leg] = order;
    saveState();
    renderItinerary();
    flashDay(dragId);
  }

  function flashDay(id) {
    requestAnimationFrame(function () {
      const el = document.querySelector('.day[data-day="' + id + '"]');
      if (!el) return;
      el.classList.add("just-moved");
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      setTimeout(function () { el.classList.remove("just-moved"); }, 900);
    });
  }

  function renderItinerary() {
    const view = state.view === "calendar" ? "calendar" : "list";
    let listHtml = "";
    let lastCity = null;
    effectiveDays().forEach(function (day) {
      if (day.city !== lastCity) {
        const c = DATA.cities[day.city];
        listHtml += '<div class="leg-heading"><span>' + esc(c.flag + " " + c.name + " · " + c.code) + '</span></div>';
        lastCity = day.city;
      }
      listHtml += renderDay(day);
    });
    const toolbar =
      '<div class="days-toolbar">' +
        '<button class="view-btn' + (view === "list" ? " active" : "") + '" data-view="list">' + ICON.list + ' List</button>' +
        '<button class="view-btn' + (view === "calendar" ? " active" : "") + '" data-view="calendar">' + ICON.calendar + ' Calendar</button>' +
      '</div>';
    const html =
      toolbar +
      '<div class="days-list"' + (view === "calendar" ? " hidden" : "") + '>' +
        '<p class="days-reorder-hint">Reshuffle days within a leg — drag the ⣿ handle (hold &amp; move) or tap ▲▼. Dates stay fixed; your plans move with you.</p>' +
        listHtml +
      '</div>' +
      '<div class="days-calendar"' + (view === "list" ? " hidden" : "") + '>' + renderCalendar() + '</div>';
    document.getElementById("panel-days").innerHTML = html;
  }

  /* Local-time ISO (yyyy-mm-dd) so "today" matches the trip dates correctly. */
  function localISO(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  /* =====================================================================
     RENDER: calendar / grid overview of the whole trip
     ===================================================================== */
  function renderCalendar() {
    const days = effectiveDays();
    const byDate = {};
    days.forEach(function (d) { byDate[d.date] = d; });
    const dates = days.map(function (d) { return d.date; }).sort();
    if (!dates.length) return "";

    const first = new Date(dates[0] + "T00:00:00");
    const last = new Date(dates[dates.length - 1] + "T00:00:00");
    // Grid starts on the Monday of the first week, ends on the Sunday of the last.
    const start = new Date(first);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)));

    const todayISO = localISO(new Date());

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let head = '<div class="cal-weekdays">' + weekdays.map(function (w) { return "<span>" + w + "</span>"; }).join("") + "</div>";

    let cells = "";
    const cur = new Date(start);
    while (cur <= end) {
      const iso = localISO(cur);
      const d = byDate[iso];
      const isToday = iso === todayISO;
      const monthTag = cur.getDate() === 1
        ? '<span class="cal-month">' + cur.toLocaleDateString("en-GB", { month: "short" }) + "</span>"
        : "";
      if (d) {
        const theme = CITY_THEME[d.city] || {};
        const city = DATA.cities[d.city] || { code: "" };
        cells +=
          '<button class="cal-cell trip' + (isToday ? " is-today" : "") + '" data-calday="' + esc(d.id) + '" style="--cc:' + (theme.c || "#8a8a8a") + '" title="' + esc(city.name + " · " + d.focus) + '">' +
            monthTag +
            '<span class="cal-num">' + cur.getDate() + "</span>" +
            '<span class="cal-code">' + esc(city.code) + "</span>" +
          "</button>";
      } else {
        cells +=
          '<div class="cal-cell empty' + (isToday ? " is-today" : "") + '">' +
            monthTag +
            '<span class="cal-num">' + cur.getDate() + "</span>" +
          "</div>";
      }
      cur.setDate(cur.getDate() + 1);
    }

    // Legend of the cities used, in first-appearance order.
    const seen = [];
    days.forEach(function (d) { if (seen.indexOf(d.city) === -1) seen.push(d.city); });
    const legend =
      '<div class="cal-legend">' +
        seen.map(function (key) {
          const t = CITY_THEME[key] || {};
          const c = DATA.cities[key] || { code: key };
          return '<span class="cal-key"><span class="dot" style="background:' + (t.c || "#8a8a8a") + '"></span>' + esc(c.code) + " · " + esc(c.name) + "</span>";
        }).join("") +
      "</div>";

    const hint = todayISO >= dates[0] && todayISO <= dates[dates.length - 1]
      ? '<p class="cal-hint">The glowing square is today. Tap any day to open it.</p>'
      : '<p class="cal-hint">Tap any day to open it. Your current day will glow once the trip begins.</p>';

    return '<div class="cal-wrap">' + head + '<div class="cal-grid">' + cells + "</div>" + legend + hint + "</div>";
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
      const link = t.link
        ? '<a class="tip-link" href="' + esc(t.link.url) + '" target="_blank" rel="noopener noreferrer">' + esc(t.link.label || t.link.url) + '</a>'
        : "";
      html +=
        '<div class="tip">' +
          '<div class="tip-icon">' + t.icon + '</div>' +
          '<div><h3>' + esc(t.title) + '</h3><p>' + esc(t.body) + '</p>' + link + '</div>' +
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
    const viewEl = e.target.closest("[data-view]");
    if (viewEl) {
      state.view = viewEl.getAttribute("data-view") === "calendar" ? "calendar" : "list";
      saveState();
      renderItinerary();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const calEl = e.target.closest("[data-calday]");
    if (calEl) {
      const id = calEl.getAttribute("data-calday");
      state.view = "list";
      saveState();
      renderItinerary();
      requestAnimationFrame(function () {
        const el = document.querySelector('.day[data-day="' + id + '"]');
        if (el) {
          el.classList.remove("collapsed");
          el.classList.add("just-opened");
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          setTimeout(function () { el.classList.remove("just-opened"); }, 1600);
        }
      });
      return;
    }
    const actEl = e.target.closest("[data-act]");
    if (!actEl) {
      // Tap anywhere on the Eat & Drink (back) side — except text inputs and
      // other form controls — flips the card back to the plan.
      const backEl = e.target.closest(".day-back");
      if (backEl && !e.target.closest("input, textarea, select, label")) {
        const day = backEl.closest(".day");
        if (day && day.classList.contains("flipped")) {
          day.classList.remove("flipped");
        }
      }
      return;
    }
    const act = actEl.getAttribute("data-act");

    if (act === "draghandle") { return; }
    if (act === "moveup" || act === "movedown") {
      const dayEl = actEl.closest(".day");
      if (dayEl) moveDay(dayEl.getAttribute("data-day"), act === "moveup" ? -1 : 1);
      return;
    }

    if (act === "daytoggle") {
      const day = actEl.closest(".day");
      if (day) {
        // Keep the header (and chevron) visually anchored: expanding inserts
        // the photo above it, so compensate the scroll by the shift amount.
        const before = actEl.getBoundingClientRect().top;
        day.classList.toggle("collapsed");
        if (day.classList.contains("collapsed")) day.classList.remove("flipped");
        const after = actEl.getBoundingClientRect().top;
        const delta = after - before;
        if (delta) window.scrollBy(0, delta);
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

  /* ---------- Drag-and-drop reordering (works on touch AND mouse) ----------
     Native HTML5 drag-and-drop doesn't fire on touchscreens, so this app —
     which is mobile-first — uses Pointer Events instead. One code path
     handles finger drags on a phone and mouse drags on desktop. */
  let dragDayId = null, dragLeg = null, dragHandleEl = null;
  let dragStartX = 0, dragStartY = 0, dragActive = false;
  let dragCurrentTarget = null, autoScrollTimer = null;
  const DRAG_THRESHOLD = 6; // px before a press becomes a drag

  function clearDropTargets() {
    document.querySelectorAll(".day.drop-target").forEach(function (el) {
      el.classList.remove("drop-target");
    });
  }

  function endDrag(commit) {
    if (autoScrollTimer) { cancelAnimationFrame(autoScrollTimer); autoScrollTimer = null; }
    const targetId = dragCurrentTarget && dragCurrentTarget.getAttribute("data-day");
    document.querySelectorAll(".day.dragging").forEach(function (el) { el.classList.remove("dragging"); });
    clearDropTargets();
    document.body.classList.remove("is-dragging-day");
    if (dragHandleEl) {
      try { dragHandleEl.releasePointerCapture && dragHandleEl.releasePointerCapture(dragPointerId); } catch (e) { /* ignore */ }
    }
    const did = dragDayId;
    dragDayId = null; dragLeg = null; dragHandleEl = null;
    dragActive = false; dragCurrentTarget = null;
    if (commit && did && targetId && targetId !== did) {
      reorderDayTo(did, targetId);
    }
  }

  let dragPointerId = null;
  document.addEventListener("pointerdown", function (e) {
    const h = e.target.closest(".day-handle");
    if (!h) return;
    const card = h.closest(".day");
    if (!card) return;
    // Only primary button / single touch.
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragHandleEl = h;
    dragPointerId = e.pointerId;
    dragDayId = card.getAttribute("data-day");
    dragLeg = card.getAttribute("data-leg");
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragActive = false;
    try { h.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  });

  document.addEventListener("pointermove", function (e) {
    if (!dragDayId) return;
    if (!dragActive) {
      const moved = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY);
      if (moved < DRAG_THRESHOLD) return;
      // Promote to an active drag.
      dragActive = true;
      const card = document.querySelector('.day[data-day="' + dragDayId + '"]');
      if (card) card.classList.add("dragging");
      document.body.classList.add("is-dragging-day");
    }
    e.preventDefault();

    // Which card is under the pointer?
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const card = under && under.closest ? under.closest(".day") : null;
    clearDropTargets();
    dragCurrentTarget = null;
    if (card && card.getAttribute("data-leg") === dragLeg &&
        card.getAttribute("data-day") !== dragDayId) {
      card.classList.add("drop-target");
      dragCurrentTarget = card;
    }

    // Auto-scroll when dragging near the top/bottom edge (helps on mobile).
    const edge = 70;
    const vh = window.innerHeight;
    let dy = 0;
    if (e.clientY < edge) dy = -Math.ceil((edge - e.clientY) / 6);
    else if (e.clientY > vh - edge) dy = Math.ceil((e.clientY - (vh - edge)) / 6);
    if (dy && !autoScrollTimer) {
      const step = function () {
        window.scrollBy(0, dy);
        autoScrollTimer = dy ? requestAnimationFrame(step) : null;
      };
      autoScrollTimer = requestAnimationFrame(step);
    } else if (!dy && autoScrollTimer) {
      cancelAnimationFrame(autoScrollTimer); autoScrollTimer = null;
    }
  }, { passive: false });

  document.addEventListener("pointerup", function () {
    if (!dragDayId) return;
    endDrag(dragActive);
  });
  document.addEventListener("pointercancel", function () {
    if (!dragDayId) return;
    endDrag(false);
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

  /* ---------- Theme (light / dark) ---------- */
  function applyTheme() {
    const dark = state.theme === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#17140f" : "#f4ede1");
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.innerHTML = dark ? ICON.sun : ICON.moon;
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
    }
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
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
    applyTheme();
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    initTabs();
    renderAll();
  });
})();
