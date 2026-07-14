/* =====================================================================
   app.js — rendering, interaction & persistence
   Vanilla JS. State is saved to localStorage so ticks / added places /
   flight info / photos all persist between visits.
   ===================================================================== */

(function () {
  "use strict";

  const DATA = window.TRIP_DATA;
  const STORAGE_KEY = "rach-itinerary-v1";

  /* ---------- City theming (used for default header gradients) ----------
     A cohesive "summer fruit garden" sweep — every accent sits in the citrus
     palette family (tangerine → mango → lime → leaf → teal → lagoon → grape →
     guava) and each gradient resolves toward a sunny light so they read as one
     set rather than a random rainbow. */
  const CITY_THEME = {
    shanghai: { g: "linear-gradient(135deg,#c14a24,#ec6f3a 55%,#f4c65a)", emoji: "🏮", c: "#ec6f3a" },
    suzhou:   { g: "linear-gradient(135deg,#c14a2e,#e0563f 55%,#f0b45a)", emoji: "🏞️", c: "#e0563f" },
    beijing:  { g: "linear-gradient(135deg,#c47d1c,#eaa72c 55%,#f6d873)", emoji: "🏯", c: "#eaa72c" },
    nara:     { g: "linear-gradient(135deg,#5e8a24,#8fbf3f 55%,#d6e88a)", emoji: "🦌", c: "#8fbf3f" },
    kyoto:    { g: "linear-gradient(135deg,#1c7a4c,#2ba268 55%,#9ad07a)", emoji: "⛩️", c: "#2ba268" },
    osaka:    { g: "linear-gradient(135deg,#0c7d6e,#16a58f 55%,#8fd9b0)", emoji: "🐙", c: "#16a58f" },
    yokohama: { g: "linear-gradient(135deg,#1c7a8c,#2f9fb0 55%,#9ad9d0)", emoji: "🌉", c: "#2f9fb0" },
    tokyo:    { g: "linear-gradient(135deg,#7a4a94,#b06fc0 55%,#e6c07a)", emoji: "🗼", c: "#b06fc0" },
    kamakura: { g: "linear-gradient(135deg,#b84a78,#e56f9c 55%,#f4c07a)", emoji: "🪷", c: "#e56f9c" },
  };

  /* ---------- State ---------- */
  let state = loadState();
  let dayFilter = "all"; // "all" | "todo" | "done" (list view, not persisted)

  function loadState() {
    let s = { over: {}, added: {}, hidden: {}, flights: {}, photos: {}, hotels: {}, view: "list", theme: "light", order: {}, packing: {}, packingAdd: {}, packingHide: {}, expenses: [], docs: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) s = Object.assign(s, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    if (!s.hotels) s.hotels = {};
    if (!s.order || typeof s.order !== "object") s.order = {};
    if (!s.packing || typeof s.packing !== "object") s.packing = {};
    if (!s.packingAdd || typeof s.packingAdd !== "object") s.packingAdd = {};
    if (!s.packingHide || typeof s.packingHide !== "object") s.packingHide = {};
    if (!Array.isArray(s.expenses)) s.expenses = [];
    if (!Array.isArray(s.docs)) s.docs = [];
    if (s.theme !== "dark") s.theme = "light";
    return s;
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function genId() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  /* =====================================================================
     WEATHER (Open-Meteo, no API key required)
     ---------------------------------------------------------------------
     Trip is in the future, so real forecasts only exist within ~16 days.
     Outside that window we look up the SAME dates last year via the
     archive API — a solid "here's what it was like this time last year"
     indicator for packing / planning. Once we're inside 16 days it
     switches to the actual forecast automatically.
     Results are cached in localStorage keyed by "city|YYYY-MM-DD" so
     we don't hammer the API on every render.
     ===================================================================== */
  const WEATHER_CACHE_KEY = "rach-weather-v2";
  const WEATHER = { data: {}, kind: {}, ttl: 6 * 60 * 60 * 1000 /* 6h */ };
  // Sub-cities without their own weather query — fall back to the nearest
  // "primary" city so we only fire 4 requests total and everything renders
  // even when the sub-city fetch would have been slow / rate-limited.
  const WEATHER_ALIAS = {
    kyoto: "osaka",
    nara: "osaka",
    suzhou: "shanghai",
    yokohama: "tokyo",
    kamakura: "tokyo",
  };
  function wxCity(cityKey) { return WEATHER_ALIAS[cityKey] || cityKey; }
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) { WEATHER.data = parsed.data; WEATHER.kind = parsed.kind || {}; WEATHER.savedAt = parsed.savedAt || 0; }
    }
  } catch (e) { /* ignore */ }
  function saveWeatherCache() {
    try {
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
        data: WEATHER.data, kind: WEATHER.kind, savedAt: Date.now(),
      }));
    } catch (e) { /* ignore */ }
  }

  // WMO weather code → { emoji, label }
  function wxIcon(code) {
    if (code == null) return { emoji: "", label: "" };
    if (code === 0) return { emoji: "☀️", label: "Clear" };
    if (code === 1) return { emoji: "🌤️", label: "Mostly clear" };
    if (code === 2) return { emoji: "⛅", label: "Partly cloudy" };
    if (code === 3) return { emoji: "☁️", label: "Cloudy" };
    if (code === 45 || code === 48) return { emoji: "🌫️", label: "Fog" };
    if (code >= 51 && code <= 57) return { emoji: "🌦️", label: "Drizzle" };
    if (code >= 61 && code <= 65) return { emoji: "🌧️", label: "Rain" };
    if (code === 66 || code === 67) return { emoji: "🌧️", label: "Freezing rain" };
    if (code >= 71 && code <= 77) return { emoji: "❄️", label: "Snow" };
    if (code >= 80 && code <= 82) return { emoji: "🌦️", label: "Showers" };
    if (code === 85 || code === 86) return { emoji: "🌨️", label: "Snow showers" };
    if (code >= 95 && code <= 99) return { emoji: "⛈️", label: "Storm" };
    return { emoji: "🌡️", label: "" };
  }

  function wxKey(cityKey, isoDate) { return wxCity(cityKey) + "|" + isoDate; }

  // Render the little chip. Always returns a span so we can update it in
  // place when the async fetch resolves.
  function weatherChip(cityKey, isoDate) {
    const key = wxKey(cityKey, isoDate);
    const w = WEATHER.data[key];
    const kind = WEATHER.kind[key] || "";
    const attrs = 'class="wx" data-wx-key="' + esc(key) + '"' + (kind ? ' data-wx-kind="' + kind + '"' : '');
    if (!w) return '<span ' + attrs + ' aria-hidden="true"></span>';
    const ic = wxIcon(w.code);
    const t = (w.tmax != null) ? Math.round(w.tmax) + "°" : "";
    const title = (ic.label || "") + (t ? " · high " + t : "") + (kind === "avg" ? " (avg from last year)" : "");
    return '<span ' + attrs + ' title="' + esc(title) + '"><span class="wx-ic">' + ic.emoji + '</span>' + (t ? '<span class="wx-t">' + t + '</span>' : '') + '</span>';
  }

  // Sunrise/sunset row (shown on the expanded day). Refreshed in place.
  function sunTimes(cityKey, isoDate) {
    const key = wxKey(cityKey, isoDate);
    const w = WEATHER.data[key];
    const attrs = 'class="sun-times" data-sun-key="' + esc(key) + '"';
    if (!w || (!w.sunrise && !w.sunset)) return '<div ' + attrs + ' hidden></div>';
    return '<div ' + attrs + '>' + sunTimesInner(w) + '</div>';
  }
  function sunTimesInner(w) {
    const rise = w.sunrise ? '<span class="sun-item">🌅 <span>' + esc(w.sunrise) + '</span></span>' : "";
    const set = w.sunset ? '<span class="sun-item">🌇 <span>' + esc(w.sunset) + '</span></span>' : "";
    return rise + set;
  }

  // After WEATHER.data updates, refresh any chips currently in the DOM
  // without re-rendering the whole card (keeps flip / open state).
  function refreshWeatherChips() {
    const chips = document.querySelectorAll('.wx[data-wx-key]');
    chips.forEach(function (el) {
      const key = el.getAttribute("data-wx-key");
      const w = WEATHER.data[key];
      if (!w) return;
      const kind = WEATHER.kind[key] || "";
      const ic = wxIcon(w.code);
      const t = (w.tmax != null) ? Math.round(w.tmax) + "°" : "";
      const title = (ic.label || "") + (t ? " · high " + t : "") + (kind === "avg" ? " (avg from last year)" : "");
      el.setAttribute("title", title);
      if (kind) el.setAttribute("data-wx-kind", kind);
      el.innerHTML = '<span class="wx-ic">' + ic.emoji + '</span>' + (t ? '<span class="wx-t">' + t + '</span>' : '');
    });
    document.querySelectorAll('.sun-times[data-sun-key]').forEach(function (el) {
      const w = WEATHER.data[el.getAttribute("data-sun-key")];
      if (!w || (!w.sunrise && !w.sunset)) return;
      el.hidden = false;
      el.innerHTML = sunTimesInner(w);
    });
    updateTodayBanner();
  }

  function fetchWeatherAll() {
    // Build one request per city covering all its trip dates.
    const byCity = {};
    DATA.days.forEach(function (d) {
      const ck = wxCity(d.city);
      if (!byCity[ck]) byCity[ck] = [];
      byCity[ck].push(d.date);
    });
    const now = Date.now();
    const fresh = WEATHER.savedAt && (now - WEATHER.savedAt) < WEATHER.ttl;

    Object.keys(byCity).forEach(function (cityKey) {
      const city = DATA.cities[cityKey];
      if (!city || city.lat == null) return;
      const dates = byCity[cityKey].sort();
      // Skip if every trip date for this city is already cached (& cache is fresh).
      const allCached = fresh && dates.every(function (d) { return WEATHER.data[wxKey(cityKey, d)]; });
      if (allCached) return;
      fetchWeatherForCity(cityKey, dates).catch(function () { /* silent */ });
    });
  }

  async function fetchWeatherForCity(cityKey, tripDates) {
    const city = DATA.cities[cityKey];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const horizon = new Date(today); horizon.setDate(horizon.getDate() + 15);

    const forecastDates = [];
    const archiveDates = [];
    tripDates.forEach(function (iso) {
      const d = new Date(iso + "T00:00:00");
      if (d >= today && d <= horizon) forecastDates.push(iso);
      else archiveDates.push(iso);
    });

    if (forecastDates.length) {
      const start = forecastDates[0], end = forecastDates[forecastDates.length - 1];
      const url = "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + city.lat + "&longitude=" + city.lon +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset" +
        "&timezone=auto&start_date=" + start + "&end_date=" + end;
      try {
        const r = await fetch(url); if (r.ok) ingestOpenMeteo(cityKey, await r.json(), "forecast", null);
      } catch (e) { /* silent */ }
    }

    if (archiveDates.length) {
      // Look up SAME dates one year earlier from the archive.
      // Use pure string arithmetic — parsing via Date() then toISOString()
      // shifts by the browser's TZ offset and chops days off the range.
      const shifted = archiveDates.map(function (iso) {
        return shiftIsoYears(iso, -1);
      }).sort();
      const start = shifted[0], end = shifted[shifted.length - 1];
      const url = "https://archive-api.open-meteo.com/v1/archive" +
        "?latitude=" + city.lat + "&longitude=" + city.lon +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset" +
        "&timezone=auto&start_date=" + start + "&end_date=" + end;
      try {
        const r = await fetch(url);
        if (r.ok) ingestOpenMeteo(cityKey, await r.json(), "avg", 1 /* year offset */);
      } catch (e) { /* silent */ }
    }
    saveWeatherCache();
    refreshWeatherChips();
  }

  // Add N years to an ISO "YYYY-MM-DD" string without any timezone conversion.
  function shiftIsoYears(iso, delta) {
    const parts = iso.split("-");
    const y = parseInt(parts[0], 10) + delta;
    return String(y).padStart(4, "0") + "-" + parts[1] + "-" + parts[2];
  }

  // yearOffset: if the response dates are N years BEHIND the trip dates
  // (archive case), add N years back so we key by the trip date.
  function ingestOpenMeteo(cityKey, json, kind, yearOffset) {
    if (!json || !json.daily || !json.daily.time) return;
    const t = json.daily.time;
    const codes = json.daily.weather_code || [];
    const tmax = json.daily.temperature_2m_max || [];
    const tmin = json.daily.temperature_2m_min || [];
    const sunrise = json.daily.sunrise || [];
    const sunset = json.daily.sunset || [];
    for (let i = 0; i < t.length; i++) {
      let iso = t[i];
      if (yearOffset) iso = shiftIsoYears(iso, yearOffset);
      const key = wxKey(cityKey, iso);
      WEATHER.data[key] = {
        code: codes[i], tmax: tmax[i], tmin: tmin[i],
        sunrise: hhmm(sunrise[i]), sunset: hhmm(sunset[i]),
      };
      WEATHER.kind[key] = kind;
    }
  }

  // "2025-10-06T06:12" -> "06:12"
  function hhmm(isoDateTime) {
    if (!isoDateTime || typeof isoDateTime !== "string") return "";
    const t = isoDateTime.split("T")[1];
    return t ? t.slice(0, 5) : "";
  }

  /* =====================================================================
     CURRENCY (open.er-api.com — free, no API key)
     Shows GBP → CNY / JPY in the masthead. Cached daily in localStorage.
     ===================================================================== */
  const FX_CACHE_KEY = "rach-fx-v1";
  let FX = null;
  try { const raw = localStorage.getItem(FX_CACHE_KEY); if (raw) FX = JSON.parse(raw); } catch (e) { /* ignore */ }

  function renderFxChip() {
    const el = document.getElementById("fxChip");
    if (!el) return;
    if (!FX || !FX.rates) { el.hidden = true; return; }
    const cny = FX.rates.CNY, jpy = FX.rates.JPY;
    if (cny == null && jpy == null) { el.hidden = true; return; }
    const parts = [];
    if (cny != null) parts.push('<span class="fx-item">🇨🇳 ¥' + cny.toFixed(1) + '</span>');
    if (jpy != null) parts.push('<span class="fx-item">🇯🇵 ¥' + Math.round(jpy) + '</span>');
    el.hidden = false;
    el.title = "£1 = " + (cny != null ? cny.toFixed(2) + " CNY" : "") + (cny != null && jpy != null ? " · " : "") + (jpy != null ? Math.round(jpy) + " JPY" : "") + (FX.date ? " (rates " + FX.date + ")" : "");
    el.innerHTML = '<span class="fx-lead">£1</span>' + parts.join("");
  }

  function fetchCurrency() {
    // Only refetch once a day.
    const today = localISO(new Date());
    if (FX && FX.fetchedOn === today && FX.rates) { renderFxChip(); return; }
    fetch("https://open.er-api.com/v6/latest/GBP")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.rates) return;
        FX = {
          fetchedOn: today,
          date: (j.time_last_update_utc || "").slice(5, 16),
          rates: { CNY: j.rates.CNY, JPY: j.rates.JPY },
        };
        try { localStorage.setItem(FX_CACHE_KEY, JSON.stringify(FX)); } catch (e) { /* ignore */ }
        renderFxChip();
      })
      .catch(function () { /* keep any cached value */ });
  }

  /* =====================================================================
     TODAY banner — an always-visible strip at the top of the Days tab.
     Before the trip: countdown. During: today's city + weather + focus
     (tap to jump to the card). After: a friendly "welcome home".
     ===================================================================== */
  function daysBetween(isoA, isoB) {
    const a = new Date(isoA + "T00:00:00"), b = new Date(isoB + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }

  function todayBannerHTML() {
    const days = effectiveDays();
    if (!days.length) return "";
    const todayISO = localISO(new Date());
    const first = days[0].date, last = days[days.length - 1].date;
    const todayDay = days.find(function (d) { return d.date === todayISO; });

    if (todayDay) {
      const city = DATA.cities[todayDay.city] || {};
      return '<button class="today-banner is-live" data-today-jump="' + esc(todayDay.id) + '">' +
        '<span class="today-tag">TODAY</span>' +
        '<span class="today-main">' +
          '<span class="today-line">' + esc(fmtDate(todayDay.date).dow) + ' · ' + esc(city.name || "") + ' ' + weatherChip(todayDay.city, todayDay.date) + '</span>' +
          '<span class="today-focus">' + esc(todayDay.focus || "") + '</span>' +
        '</span>' +
        '<span class="today-go">' + ICON.chevronRight + '</span>' +
      '</button>';
    }
    if (todayISO < first) {
      const n = daysBetween(todayISO, first);
      const c = DATA.cities[days[0].city] || {};
      const when = n === 0 ? "<strong>today</strong>" : n === 1 ? "<strong>tomorrow</strong>" : "in <strong>" + n + " days</strong>";
      return '<div class="today-banner is-before">' +
        '<span class="today-tag">✈️</span>' +
        '<span class="today-main">' +
          '<span class="today-line">Trip starts ' + when + '</span>' +
          '<span class="today-focus">' + esc(fmtDate(first).dow + " " + fmtDate(first).big) + ' · ' + esc(c.name || "") + '</span>' +
        '</span>' +
      '</div>';
    }
    if (todayISO > last) {
      return '<div class="today-banner is-after">' +
        '<span class="today-tag">🏠</span>' +
        '<span class="today-main"><span class="today-line">Welcome home</span>' +
        '<span class="today-focus">Hope it was unforgettable.</span></span>' +
      '</div>';
    }
    return "";
  }

  // Refresh just the banner's contents in place (called when weather lands).
  function updateTodayBanner() {
    const host = document.getElementById("todayBanner");
    if (!host) return;
    host.innerHTML = todayBannerHTML();
  }

  /* ---------- SVG icon helpers ---------- */
  const ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg>',
    train: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8.5" cy="13.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="13.5" r=".5" fill="currentColor"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    directions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>',
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
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    suitcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M9 21v-14"/><path d="M15 21v-14"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-5A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    ellipsis: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>',
    speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M18.36 5.64a9 9 0 0 1 0 12.72"/></svg>',
  };
  const NAV_ICON = {
    days: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 6v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-6z"/><line x1="12" y1="5" x2="12" y2="19" stroke-dasharray="2 3"/></svg>',
    buy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    flights: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8L8 11l-3 3H2l2 3 3 2 1-3 3-3 3.5 3.7a.5.5 0 0 0 .8-.5z"/></svg>',
    hotels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M16 8h3a2 2 0 0 1 2 2v11"/><path d="M1 21h22"/><path d="M7 7h.01M11 7h.01M7 11h.01M11 11h.01M7 15h.01M11 15h.01"/></svg>',
    tips: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
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

  /* Build a universal maps search URL (opens Google Maps / native maps app
     on mobile, browser on desktop). */
  function mapsUrl(query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }
  /* Open directions for a place: prefer a full address, else name + city. */
  function openMaps(name, address, cityName) {
    const a = (address || "").trim();
    const parts = [];
    if (a) parts.push(a);
    else if (name) parts.push(name.trim());
    if (cityName && (!a || a.toLowerCase().indexOf(cityName.toLowerCase()) === -1)) parts.push(cityName);
    const q = parts.filter(Boolean).join(", ");
    if (!q) return;
    window.open(mapsUrl(q), "_blank", "noopener");
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
     cityName (day places only): enables a "Directions" button → maps.
     ===================================================================== */
  function renderPlace(p, containerKey, travelInfo, cityName) {
    const d = p.details || {};
    const hours = formatHours(d.open, d.close);
    const isItin = !!travelInfo;
    const isFood = /:(restaurants|cafes)$/.test(containerKey || "");
    const travel = (d.travel == null ? "" : String(d.travel)).trim();
    const travelChip = (isItin && travel)
      ? '<div class="travel-chip">' + ICON.walk + ' ' + esc(travel) + ' min ' + travelLabel(travelInfo.first, d.travelFrom) + '</div>'
      : "";
    const hoursChip = hours ? '<div class="todo-meta">' + esc(hours) + '</div>' : "";
    const mapsBtn = cityName
      ? '<button class="link-maps" data-act="maps">' + ICON.directions + ' Directions</button>'
      : "";
    return (
      '<div class="todo' + (p.done ? " done" : "") + '" data-place="' + p.id + '" data-container="' + esc(containerKey) + '"' +
        (cityName ? ' data-city="' + esc(cityName) + '"' : '') +
        (isItin ? ' data-itin="1" data-first="' + (travelInfo.first ? "1" : "0") + '"' : '') + '>' +
        '<div class="todo-row">' +
          '<button class="check" data-act="toggle" aria-label="Toggle done">' + ICON.check + '</button>' +
          '<div class="todo-name">' + esc(p.name) + '</div>' +
          '<div class="todo-chips">' + travelChip + hoursChip + '</div>' +
          '<button class="todo-expand" data-act="expand" aria-label="Details">' + ICON.chevron + '</button>' +
        '</div>' +
        (isFood ? renderRating(p) : "") +
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
            mapsBtn +
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

  /* =====================================================================
     RENDER: star rating + memory note for a restaurant / cafe.
     Only meaningful once the place is ticked off (CSS hides it until then),
     so tapping a star or jotting a note recalls whether it was any good.
     ===================================================================== */
  function renderRating(p) {
    const d = p.details || {};
    const rating = Math.max(0, Math.min(5, parseInt(d.rating, 10) || 0));
    let stars = "";
    for (let n = 1; n <= 5; n++) {
      stars +=
        '<button type="button" class="star' + (n <= rating ? " filled" : "") + '"' +
          ' data-act="rate" data-star="' + n + '"' +
          ' aria-label="Rate ' + n + ' out of 5">' + ICON.star + '</button>';
    }
    return (
      '<div class="todo-rating">' +
        '<div class="stars" role="group" aria-label="Your rating out of 5">' + stars + '</div>' +
        '<textarea class="rating-note" data-field="comment" rows="2"' +
          ' placeholder="Write a note...">' + esc(d.comment) + '</textarea>' +
      '</div>'
    );
  }

  const SLOT_EMOJI = {
    morning: "☀️", afternoon: "🌆", evening: "🌙",
    restaurants: "🍜", cafes: "☕",
  };

  function renderSlot(day, slotKey, label, dotClass, seq) {
    const containerKey = day.id + ":" + slotKey;
    const cityName = (DATA.cities[day.city] || {}).name || "";
    const list = placesFor(day[slotKey], containerKey);
    const rows = list.map(function (p) {
      const info = { first: seq.n === 0 };
      seq.n++;
      return renderPlace(p, containerKey, info, cityName);
    }).join("");
    const doneCount = list.filter(function (p) { return p.done; }).length;
    const tally = list.length ? '<span class="slot-tally">' + doneCount + '/' + list.length + '</span>' : '';
    return (
      '<div class="slot" data-slot="' + dotClass + '">' +
        '<div class="slot-head"><span class="slot-emoji ' + dotClass + '">' + (SLOT_EMOJI[slotKey] || "") + '</span><h4>' + label + '</h4>' + tally + '</div>' +
        rows +
        '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add a place</button>' +
      '</div>'
    );
  }

  function renderBackList(day, slotKey, label) {
    const containerKey = day.id + ":" + slotKey;
    const cityName = (DATA.cities[day.city] || {}).name || "";
    const list = placesFor(day[slotKey], containerKey);
    const rows = list.length
      ? list.map(function (p) { return renderPlace(p, containerKey, null, cityName); }).join("")
      : '<p class="empty">Nothing yet — add a spot.</p>';
    const slotClass = slotKey === "restaurants" ? "afternoon" : "evening";
    return (
      '<div class="slot" data-slot="' + slotClass + '">' +
        '<div class="slot-head"><span class="slot-emoji ' + slotClass + '">' + (SLOT_EMOJI[slotKey] || "") + '</span><h4>' + label + '</h4></div>' +
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
          '<div class="detail-actions">' +
            '<button class="link-maps" data-act="hotelmaps">' + ICON.directions + ' Directions</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  /* How much of a single day is ticked off (all slots incl. eat & drink). */
  function dayProgress(day) {
    let total = 0, done = 0;
    ["morning", "afternoon", "evening", "restaurants", "cafes"].forEach(function (slot) {
      const key = day.id + ":" + slot;
      placesFor(day[slot], key).forEach(function (p) { total++; if (p.done) done++; });
    });
    return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  /* Small SVG progress donut shown on each day card. */
  function ringInner(pct) {
    const r = 9;
    const c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="ringGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">' +
            '<stop offset="0" stop-color="var(--seal)"/>' +
            '<stop offset="0.55" stop-color="var(--gold)"/>' +
            '<stop offset="1" stop-color="var(--jade)"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<circle class="ring-bg" cx="12" cy="12" r="' + r + '"/>' +
        '<circle class="ring-fg" cx="12" cy="12" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '</svg>' +
      (pct >= 100
        ? '<span class="ring-num ring-done">' + ICON.check + '</span>'
        : '<span class="ring-num">' + pct + '</span>')
    );
  }
  function ringHTML(day) {
    const p = dayProgress(day);
    if (!p.total) return '';
    return '<span class="day-ring' + (p.pct >= 100 ? ' is-complete' : '') + '" data-act="daytoggle"' +
      ' title="' + p.done + ' of ' + p.total + ' done" aria-label="' + p.pct + '% of this day done">' +
      ringInner(p.pct) + '</span>';
  }
  function updateDayRing(dayEl) {
    if (!dayEl) return;
    const id = dayEl.getAttribute("data-day");
    const day = DATA.days.find(function (d) { return d.id === id; });
    if (!day) return;
    const ring = dayEl.querySelector(".day-ring");
    if (!ring) return;
    const p = dayProgress(day);
    ring.classList.toggle("is-complete", p.pct >= 100);
    ring.setAttribute("title", p.done + " of " + p.total + " done");
    ring.setAttribute("aria-label", p.pct + "% of this day done");

    // Update the existing circle's offset in place so the CSS transition can
    // animate from the old value to the new one. Replacing the SVG (innerHTML)
    // would insert a fresh circle already at its target, so it would snap.
    const fg = ring.querySelector(".ring-fg");
    const num = ring.querySelector(".ring-num");
    if (fg && num) {
      const r = 9;
      const c = 2 * Math.PI * r;
      const off = c * (1 - Math.max(0, Math.min(100, p.pct)) / 100);
      fg.setAttribute("stroke-dashoffset", off.toFixed(1));
      if (p.pct >= 100) {
        num.classList.add("ring-done");
        num.innerHTML = ICON.check;
      } else {
        num.classList.remove("ring-done");
        num.textContent = p.pct;
      }
    } else {
      ring.innerHTML = ringInner(p.pct);
    }
  }

  function renderDay(day) {
    const city = DATA.cities[day.city];
    const theme = CITY_THEME[day.city] || { g: "var(--line-strong)", emoji: "📍", c: "var(--line-strong)" };
    const dt = fmtDate(day.date);
    const photo = state.photos[day.id] || day.photo;
    const bg = photo
  ? "background-image:url(" + photo + ");"
  : "background-image:" + theme.g + ";";

    // Running counter across the day so travel chips read "from hotel" for the
    // first stop and "away" (from the previous stop) for the rest.
    const seq = { n: 0 };

    const canReorder = !day._single && !day._pinned;
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
            '<div class="dow">' + dt.dow + ' · ' + esc(city.name) + ' ' + weatherChip(day.city, day.date) + '</div>' +
            '<div class="date">' + dt.big + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="perf"></div>' +
        '<div class="day-body">' +
          '<div class="day-head">' +
            reorderHandle +
            ringHTML(day) +
            '<button class="day-focus" data-act="daytoggle">' +
              '<span class="day-meta">' +
                '<span class="day-date-mini">' + weatherChip(day.city, day.date) + ' ' + dt.dow + ' · ' + dt.big + '</span>' +
                '<h3>' + esc(day.focus) + '</h3>' +
              '</span>' +
              '<span class="city-tag">' + theme.emoji + ' ' + esc(city.code) + '</span>' +
              '<span class="day-chevron">' + ICON.chevron + '</span>' +
            '</button>' +
            reorderMoves +
          '</div>' +
          '<div class="day-collapse">' +
            '<div class="flip-hint">Tap the photo to flip for food &amp; cafés →</div>' +
            sunTimes(day.city, day.date) +
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
      '<div class="day collapsed" data-day="' + day.id + '" data-leg="' + esc(day._leg || "") + '" data-city="' + esc(day.city) + '" style="--cc:' + (theme.c || "var(--jade)") + '">' +
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

  // Dates whose PLAN is pinned to that specific date and can't be shuffled
  // (travel/transfer days — flights & the shinkansen mean these are fixed).
  const PINNED_DATES = {
    "2026-09-28": true, // LHR → Shanghai
    "2026-10-05": true, // Shanghai → Osaka
    "2026-10-10": true, // Shinkansen Osaka → Tokyo
    "2026-10-17": true, // Tokyo → Beijing
    "2026-10-19": true, // Beijing → Shanghai (train)
    "2026-10-22": true, // Shanghai → LHR (fly home)
  };

  // Returns the trip days with any user reordering applied. Each day keeps its
  // own id + plan, but its DATE is reassigned from the leg's fixed date slots
  // in the chosen order. Pinned days stay on their original date and are
  // excluded from reordering. Annotates _leg / _first / _last / _single / _pinned.
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
      const pinnedMembers = members.filter(function (d) { return PINNED_DATES[d.date]; });
      const movableMembers = members.filter(function (d) { return !PINNED_DATES[d.date]; });
      const movableSlots = movableMembers.map(function (d) { return d.date; }).sort();
      const movableIds = movableMembers.map(function (d) { return d.id; });

      let order = (state.order && state.order[k]) ? state.order[k].slice()
        .filter(function (id) { return movableIds.indexOf(id) !== -1; }) : null;
      if (!order || order.length !== movableIds.length) order = movableIds.slice();
      // Safety: append any movable ids missing from the stored order.
      movableIds.forEach(function (id) { if (order.indexOf(id) === -1) order.push(id); });

      const byId = {};
      members.forEach(function (d) { byId[d.id] = d; });

      // Pinned plans keep their date exactly.
      pinnedMembers.forEach(function (d) {
        out.push(Object.assign({}, d, {
          _leg: k, _pinned: true, _first: false, _last: false, _single: false,
        }));
      });
      // Movable plans get shuffled among the movable date slots.
      order.forEach(function (id, i) {
        out.push(Object.assign({}, byId[id], {
          date: movableSlots[i],
          _leg: k,
          _first: i === 0,
          _last: i === order.length - 1,
          _single: order.length <= 1,
          _pinned: false,
        }));
      });
    });
    out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    return out;
  }

  // Move a day one slot earlier (-1) or later (+1) within its leg.
  // Only movable (non-pinned) days participate.
  function moveDay(dayId, dir) {
    const eff = effectiveDays();
    const day = eff.find(function (d) { return d.id === dayId; });
    if (!day || day._pinned) return;
    const members = eff.filter(function (d) { return d._leg === day._leg && !d._pinned; });
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

  // Drop the dragged day in front of the target day (same leg only, no pinned).
  function reorderDayTo(dragId, dropId) {
    if (!dragId || !dropId || dragId === dropId) return;
    const eff = effectiveDays();
    const a = eff.find(function (d) { return d.id === dragId; });
    const b = eff.find(function (d) { return d.id === dropId; });
    if (!a || !b || a._leg !== b._leg) return;
    if (a._pinned || b._pinned) return;
    let order = eff.filter(function (d) { return d._leg === a._leg && !d._pinned; })
      .map(function (d) { return d.id; })
      .filter(function (id) { return id !== dragId; });
    const to = order.indexOf(dropId);
    if (to < 0) return;
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
    const cityOrder = [];
    effectiveDays().forEach(function (day) {
      if (day.city !== lastCity) {
        const c = DATA.cities[day.city];
        listHtml += '<div class="leg-heading" data-legcity="' + esc(day.city) + '"><span>' + esc(c.flag + " " + c.name + " · " + c.code) + '</span></div>';
        lastCity = day.city;
        if (cityOrder.indexOf(day.city) === -1) cityOrder.push(day.city);
      }
      listHtml += renderDay(day);
    });
    const toolbar =
      '<div class="days-toolbar">' +
        '<button class="view-btn' + (view === "list" ? " active" : "") + '" data-view="list">' + ICON.list + ' List</button>' +
        '<button class="view-btn' + (view === "calendar" ? " active" : "") + '" data-view="calendar">' + ICON.calendar + ' Calendar</button>' +
      '</div>';
    const filterChips =
      '<div class="day-filters" role="group" aria-label="Filter days">' +
        '<div class="filter-set">' +
          '<button class="chip-filter' + (dayFilter === "all" ? " active" : "") + '" data-dayfilter="all">All</button>' +
          '<button class="chip-filter' + (dayFilter === "todo" ? " active" : "") + '" data-dayfilter="todo">To-do</button>' +
          '<button class="chip-filter' + (dayFilter === "done" ? " active" : "") + '" data-dayfilter="done">Done</button>' +
        '</div>' +
        '<div class="jump-set">' +
          '<button class="chip-jump chip-today" data-jumptoday="1">📍 Today</button>' +
          cityOrder.map(function (ck) {
            const c = DATA.cities[ck];
            const t = CITY_THEME[ck] || {};
            return '<button class="chip-jump" data-jumpcity="' + esc(ck) + '" style="--cc:' + (t.c || "var(--jade)") + '">' + (t.emoji || c.flag) + ' ' + esc(c.name) + '</button>';
          }).join("") +
        '</div>' +
      '</div>';
    const html =
      '<div id="todayBanner">' + todayBannerHTML() + '</div>' +
      toolbar +
      '<div class="days-list"' + (view === "calendar" ? " hidden" : "") + '>' +
        filterChips +
        '<p class="days-reorder-hint">Want to move some days around? — drag the ⣿ handle (hold &amp; move) or tap ▲▼. Dates stay fixed; your plans move with you.</p>' +
        listHtml +
      '</div>' +
      '<div class="days-calendar"' + (view === "list" ? " hidden" : "") + '>' + renderCalendar() + '</div>';
    document.getElementById("panel-days").innerHTML = html;
    applyDayFilter();
  }

  /* Client-side day filtering (All / To-do / Done). Hides leg headings that
     end up with no visible days so the list stays tidy. */
  function applyDayFilter() {
    const panel = document.getElementById("panel-days");
    if (!panel) return;
    const todayISO = localISO(new Date());
    const days = panel.querySelectorAll(".day");
    days.forEach(function (el) {
      const id = el.getAttribute("data-day");
      const day = DATA.days.find(function (d) { return d.id === id; });
      const p = day ? dayProgress(day) : { total: 0, pct: 0 };
      // A day is "done" once everything is ticked off OR the date has passed —
      // past days drop out of To-do automatically to reduce ongoing noise.
      const past = day ? day.date < todayISO : false;
      const complete = p.total > 0 && p.pct >= 100;
      const isDone = complete || past;
      let show = true;
      if (dayFilter === "todo") show = !isDone;
      else if (dayFilter === "done") show = isDone;
      el.classList.toggle("filtered-out", !show);
    });
    // Hide any leg heading with no visible day after it (until the next heading).
    const kids = Array.from(panel.querySelectorAll(".leg-heading, .day"));
    let heading = null, headingHasVisible = false;
    kids.forEach(function (el) {
      if (el.classList.contains("leg-heading")) {
        if (heading) heading.classList.toggle("filtered-out", !headingHasVisible);
        heading = el; headingHasVisible = false;
      } else if (!el.classList.contains("filtered-out")) {
        headingHasVisible = true;
      }
    });
    if (heading) heading.classList.toggle("filtered-out", !headingHasVisible);
  }

  /* Switch to the Days list, expand a given day card and scroll to it. */
  function openDayCard(id, smooth) {
    if (state.view !== "list") { state.view = "list"; saveState(); }
    // Make sure the Days tab is showing.
    const daysTab = document.querySelector('.tab[data-target="days"]');
    if (daysTab && !daysTab.classList.contains("active")) daysTab.click();
    renderItinerary();
    requestAnimationFrame(function () {
      const el = document.querySelector('.day[data-day="' + id + '"]');
      if (!el) return;
      el.classList.remove("collapsed");
      el.classList.add("just-opened");
      el.scrollIntoView({ behavior: smooth === false ? "auto" : "smooth", block: "start" });
      setTimeout(function () { el.classList.remove("just-opened"); }, 1600);
    });
  }

  /* On load, if today falls within the trip, jump to today's card. */
  function focusToday() {
    const days = effectiveDays();
    const todayISO = localISO(new Date());
    const todayDay = days.find(function (d) { return d.date === todayISO; });
    if (todayDay) openDayCard(todayDay.id, false);
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
  let progressAnim = null;      // current rAF handle
  let progressShown = 0;        // exact (fractional) pct currently displayed

  function updateProgress() {
    let total = 0, done = 0;
    DATA.days.forEach(function (day) {
      ["morning", "afternoon", "evening", "restaurants", "cafes"].forEach(function (slot) {
        const key = day.id + ":" + slot;
        placesFor(day[slot], key).forEach(function (p) { total++; if (p.done) done++; });
      });
    });
    const exact = total ? (done / total) * 100 : 0;   // fractional target %
    animateProgress(exact, done, total);
  }

  /* Tween the bar from its current fractional fill to the new one so it glides
     upward smoothly. A single tick only moves ~0.5%, so we animate the exact
     fraction (not a rounded integer) — otherwise small changes would snap or
     be swallowed entirely. The label shows the rounded whole percentage. */
  function animateProgress(targetPct, done, total) {
    const fill = document.getElementById("progressFill");
    const label = document.getElementById("progressLabel");
    if (!fill || !label) return;

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = progressShown;
    const diff = targetPct - from;

    if (progressAnim) { cancelAnimationFrame(progressAnim); progressAnim = null; }

    const setFrame = function (value) {
      const clamped = Math.max(0, Math.min(100, value));
      fill.style.width = clamped + "%";
      label.textContent = done + " / " + total + " ticked off · " + Math.round(clamped) + "%";
    };

    if (reduce || Math.abs(diff) < 0.01) {
      progressShown = targetPct;
      setFrame(targetPct);
      return;
    }

    // Constant glide speed (~55ms per percent), clamped so even a single tick
    // gets a visible, unhurried slide and large jumps don't drag on forever.
    const duration = Math.min(1400, Math.max(420, Math.abs(diff) * 55));
    const start = performance.now();
    const easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };

    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const cur = from + diff * easeOut(t);
      setFrame(cur);
      if (t < 1) {
        progressAnim = requestAnimationFrame(frame);
      } else {
        progressShown = targetPct;
        setFrame(targetPct);
        progressAnim = null;
      }
    }
    progressAnim = requestAnimationFrame(frame);
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
    const filterEl = e.target.closest("[data-dayfilter]");
    if (filterEl) {
      dayFilter = filterEl.getAttribute("data-dayfilter");
      document.querySelectorAll("[data-dayfilter]").forEach(function (b) {
        b.classList.toggle("active", b === filterEl);
      });
      applyDayFilter();
      return;
    }
    const jumpTodayEl = e.target.closest("[data-jumptoday]");
    if (jumpTodayEl) {
      dayFilter = "all";
      applyDayFilter();
      focusToday();
      return;
    }
    const jumpCityEl = e.target.closest("[data-jumpcity]");
    if (jumpCityEl) {
      const ck = jumpCityEl.getAttribute("data-jumpcity");
      dayFilter = "all";
      document.querySelectorAll("[data-dayfilter]").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-dayfilter") === "all");
      });
      applyDayFilter();
      const head = document.querySelector('.leg-heading[data-legcity="' + cssEscape(ck) + '"]');
      if (head) head.scrollIntoView({ behavior: "smooth", block: "start" });
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
    const jumpEl = e.target.closest("[data-today-jump]");
    if (jumpEl) {
      openDayCard(jumpEl.getAttribute("data-today-jump"));
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
    if (act === "rate") {
      const todo = actEl.closest(".todo");
      setRating(todo, parseInt(actEl.getAttribute("data-star"), 10));
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
    if (act === "maps") {
      const todo = actEl.closest(".todo");
      if (todo) {
        const name = (todo.querySelector(".todo-name") || {}).textContent || "";
        const addrEl = todo.querySelector('[data-field="address"]');
        const address = addrEl ? addrEl.value : "";
        openMaps(name, address, todo.getAttribute("data-city") || "");
      }
      return;
    }
    if (act === "hotelmaps") {
      const hotel = actEl.closest(".hotel");
      if (hotel) {
        const name = (hotel.querySelector('[data-hotelfield="name"]') || {}).value || "";
        const area = (hotel.querySelector('[data-hotelfield="area"]') || {}).value || "";
        const address = (hotel.querySelector('[data-hotelfield="address"]') || {}).value || "";
        openMaps(name, address || area, "");
      }
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
    const dayEl = todo.closest(".day");
    const wasComplete = dayEl ? dayEl.querySelector(".day-ring.is-complete") != null : false;
    const nowDone = !todo.classList.contains("done");
    todo.classList.toggle("done", nowDone);
    if (nowDone) {
      todo.classList.remove("just-checked");
      void todo.offsetWidth; // restart the animation
      todo.classList.add("just-checked");
      setTimeout(function () { todo.classList.remove("just-checked"); }, 500);
    }

    if (isAdded(containerKey, id)) {
      const p = state.added[containerKey].find(function (x) { return x.id === id; });
      if (p) p.done = nowDone;
    } else {
      ensureOver(id).done = nowDone;
    }
    saveState();
    updateProgress();
    updateDayRing(dayEl);
    updateSlotTally(todo.closest(".slot"));
    // Celebrate when a whole day just tipped over to 100%.
    if (nowDone && dayEl && !wasComplete && dayEl.querySelector(".day-ring.is-complete")) {
      celebrateDay(dayEl);
    }
  }

  /* Fade the card for a beat and show a "Day completed!" badge with a confetti
     burst from the card's centre, so the celebration is unmissable even if the
     little progress ring is scrolled out of view. */
  function celebrateDay(dayEl) {
    // Show the flash on whichever side is currently facing the user — the
    // back (restaurants/cafés) if the card is flipped, otherwise the front.
    const flipped = dayEl.classList.contains("flipped");
    const face = flipped
      ? dayEl.querySelector(".day-back .day-face")
      : dayEl.querySelector(".day-inner > .day-face");
    const target = face || dayEl.querySelector(".day-face");
    celebrate(target || dayEl); // confetti bursts from the card centre
    if (!target) return;

    const old = target.querySelector(".day-complete-flash");
    if (old) old.remove();

    const flash = document.createElement("div");
    flash.className = "day-complete-flash";
    flash.innerHTML =
      '<div class="day-complete-badge">' + ICON.check +
        '<span>Day completed!</span>' +
      '</div>';
    target.appendChild(flash);

    setTimeout(function () { flash.classList.add("out"); }, 1200);
    setTimeout(function () { flash.remove(); }, 1650);
  }

  /* Lightweight, dependency-free confetti burst from an element's centre.
     Uses the Web Animations API so pieces clean themselves up. */
  function celebrate(originEl) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = originEl && originEl.getBoundingClientRect ? originEl.getBoundingClientRect() : null;
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : window.innerHeight / 3;
    const colors = ["#ec6f3a", "#e9b52b", "#2ba268", "#16a58f", "#e56f9c", "#b06fc0", "#8fbf3f"];
    const layer = document.createElement("div");
    layer.className = "confetti-layer";
    document.body.appendChild(layer);
    for (let i = 0; i < 34; i++) {
      const piece = document.createElement("i");
      piece.className = "confetti-piece";
      piece.style.background = colors[i % colors.length];
      piece.style.left = cx + "px";
      piece.style.top = cy + "px";
      if (i % 3 === 0) piece.style.borderRadius = "50%";
      layer.appendChild(piece);
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 150;
      const dx = Math.cos(angle) * dist;
      const up = -(30 + Math.random() * 70);
      const dy = Math.sin(angle) * dist * 0.5 + up;
      const rot = Math.random() * 720 - 360;
      const fall = Math.abs(dy) + 200 + Math.random() * 160;
      piece.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + (dx * 0.6) + "px," + dy + "px) rotate(" + (rot * 0.5) + "deg)", opacity: 1, offset: 0.35 },
        { transform: "translate(" + dx + "px," + fall + "px) rotate(" + rot + "deg)", opacity: 0 }
      ], { duration: 1000 + Math.random() * 700, easing: "cubic-bezier(0.2,0.6,0.3,1)" });
    }
    setTimeout(function () { layer.remove(); }, 1900);
  }

  /* Keep a slot's "done/total" pill in sync after a tick. */
  function updateSlotTally(slot) {
    if (!slot) return;
    const tally = slot.querySelector(".slot-tally");
    if (!tally) return;
    const items = slot.querySelectorAll(".todo");
    const done = slot.querySelectorAll(".todo.done").length;
    tally.textContent = done + "/" + items.length;
  }

  function setRating(todo, stars) {
    const id = todo.getAttribute("data-place");
    const containerKey = todo.getAttribute("data-container");
    let rating = Math.max(1, Math.min(5, stars || 0));
    // Tapping the current rating again clears it (toggle off).
    const current = parseInt(readPlaceDetail(todo, "rating"), 10) || 0;
    if (rating === current) rating = 0;

    if (isAdded(containerKey, id)) {
      const p = state.added[containerKey].find(function (x) { return x.id === id; });
      if (p) { p.details = p.details || {}; p.details.rating = rating; }
    } else {
      const o = ensureOver(id);
      o.details = o.details || {};
      o.details.rating = rating;
    }
    saveState();

    // Reflect the new rating on the stars without a full re-render.
    const starEls = todo.querySelectorAll(".stars .star");
    starEls.forEach(function (el, i) {
      el.classList.toggle("filled", (i + 1) <= rating);
    });
  }

  function readPlaceDetail(todo, field) {
    const id = todo.getAttribute("data-place");
    const containerKey = todo.getAttribute("data-container");
    if (isAdded(containerKey, id)) {
      const p = (state.added[containerKey] || []).find(function (x) { return x.id === id; });
      return p && p.details ? p.details[field] : undefined;
    }
    const o = state.over[id];
    return o && o.details ? o.details[field] : undefined;
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
    // Find the "Add" button that was clicked and show an inline editor next to it.
    // (window.prompt() is blocked in some mobile & sandboxed browsers, so we do it inline.)
    const btn = document.querySelector('button.add-place[data-act="add"][data-container="' + cssEscape(containerKey) + '"]');
    if (!btn) return;

    // If an editor is already open, just focus its input.
    const existing = btn.parentNode.querySelector('.add-editor[data-container="' + cssEscape(containerKey) + '"]');
    if (existing) { const inp = existing.querySelector("input"); if (inp) inp.focus(); return; }

    const wrap = document.createElement("div");
    wrap.className = "add-editor";
    wrap.setAttribute("data-container", containerKey);
    wrap.innerHTML =
      '<input type="text" class="add-editor-input" placeholder="Add an item… (press Enter)" autocomplete="off" />' +
      '<button type="button" class="add-editor-save">Add</button>' +
      '<button type="button" class="add-editor-cancel" aria-label="Cancel">×</button>';
    btn.parentNode.insertBefore(wrap, btn);

    const input = wrap.querySelector(".add-editor-input");
    const saveBtn = wrap.querySelector(".add-editor-save");
    const cancelBtn = wrap.querySelector(".add-editor-cancel");

    function commit() {
      const name = (input.value || "").trim();
      if (!name) { close(); return; }
      if (!state.added[containerKey]) state.added[containerKey] = [];
      state.added[containerKey].push({
        id: genId(), name: name, done: false,
        details: { open: "", close: "", address: "", note: "" },
      });
      saveState();
      rerenderForContainer(containerKey);
      updateProgress();
      // Re-open a fresh editor so it's easy to add several in a row.
      addPlace(containerKey);
    }
    function close() { wrap.remove(); }

    saveBtn.addEventListener("click", commit);
    cancelBtn.addEventListener("click", close);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); close(); }
    });
    setTimeout(function () { input.focus(); }, 0);
  }

  // Tiny CSS.escape polyfill for containerKey values (they contain ":" etc.).
  function cssEscape(s) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(s);
    return String(s).replace(/([\0-\x1f\x7f]|[!"#$%&'()*+,./:;<=>?@\[\\\]^`{|}~])/g, "\\$1");
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

  /* =====================================================================
     MORE — hub of extra trip tools (packing, budget, emergency,
     phrasebook, documents). One panel with a lightweight in-panel router.
     ===================================================================== */
  let moreView = null; // null = hub; else "packing"|"budget"|"emergency"|"phrasebook"|"docs"
  let phraseLang = 0;  // index into DATA.phrasebook

  const MORE_TOOLS = [
    { key: "packing", icon: ICON.suitcase, title: "Packing list", sub: "Tick things off as you pack" },
    { key: "budget", icon: ICON.wallet, title: "Budget tracker", sub: "Log spend in ¥ / £, auto-converted" },
    { key: "emergency", icon: ICON.phone, title: "Emergency & essentials", sub: "Numbers, embassies, hotel addresses" },
    { key: "phrasebook", icon: ICON.chat, title: "Phrasebook", sub: "Key phrases in Chinese & Japanese" },
    { key: "docs", icon: ICON.file, title: "Documents", sub: "Tickets & bookings, saved offline" },
  ];

  function renderMore() {
    if (moreView === "packing") return renderPacking();
    if (moreView === "budget") return renderBudget();
    if (moreView === "emergency") return renderEmergency();
    if (moreView === "phrasebook") return renderPhrasebook();
    if (moreView === "docs") return renderDocs();
    // Hub
    let html = '<h2 class="section-title">Trip tools</h2>' +
      '<p class="empty" style="margin-bottom:14px">Handy extras for the trip — everything saves on this device and works offline.</p>' +
      '<div class="tool-grid">';
    MORE_TOOLS.forEach(function (t) {
      html += '<button class="tool-card" data-act="more-open" data-tool="' + t.key + '">' +
        '<span class="tool-ic">' + t.icon + '</span>' +
        '<span class="tool-text"><span class="tool-title">' + esc(t.title) + '</span>' +
        '<span class="tool-sub">' + esc(t.sub) + '</span></span>' +
        '<span class="tool-go">' + ICON.chevronRight + '</span>' +
      '</button>';
    });
    html += '</div>';
    document.getElementById("panel-more").innerHTML = html;
  }

  function moreHeader(title) {
    return '<div class="tool-head">' +
      '<button class="tool-back" data-act="more-back" aria-label="Back to tools">' + ICON.back + '</button>' +
      '<h2 class="section-title" style="margin:0">' + esc(title) + '</h2>' +
    '</div>';
  }

  /* ---------- Packing checklist ---------- */
  function packItems(category) {
    // Seed items (minus hidden) + custom added, as {id,label,custom}.
    const seed = (DATA.packing.find(function (g) { return g.category === category; }) || {}).items || [];
    const out = [];
    seed.forEach(function (label, i) {
      const id = "pk:" + category + ":" + i;
      if (!state.packingHide[id]) out.push({ id: id, label: label, custom: false });
    });
    (state.packingAdd[category] || []).forEach(function (it) {
      out.push({ id: it.id, label: it.label, custom: true });
    });
    return out;
  }
  function packingStats() {
    let total = 0, done = 0;
    DATA.packing.forEach(function (g) {
      packItems(g.category).forEach(function (it) {
        total++; if (state.packing[it.id]) done++;
      });
    });
    return { total: total, done: done };
  }
  function renderPacking() {
    const st = packingStats();
    const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
    let html = moreHeader("Packing list");
    html += '<div class="pack-progress"><div class="pack-track"><div class="pack-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="pack-count">' + st.done + " / " + st.total + " packed</div></div>";
    DATA.packing.forEach(function (g) {
      html += '<div class="pack-group"><h3>' + esc(g.category) + '</h3>';
      packItems(g.category).forEach(function (it) {
        const done = !!state.packing[it.id];
        html += '<div class="pack-item' + (done ? " done" : "") + '" data-pack="' + esc(it.id) + '">' +
          '<button class="check" data-act="pack-toggle" aria-label="Toggle packed">' + ICON.check + '</button>' +
          '<span class="pack-label">' + esc(it.label) + '</span>' +
          '<button class="pack-del" data-act="pack-del" data-cat="' + esc(g.category) + '" aria-label="Remove">' + ICON.trash + '</button>' +
        '</div>';
      });
      html += '<form class="pack-add" data-act="pack-add" data-cat="' + esc(g.category) + '">' +
        '<input type="text" placeholder="Add an item…" aria-label="Add packing item">' +
        '<button type="submit" aria-label="Add">' + ICON.plus + '</button>' +
      '</form>';
      html += '</div>';
    });
    const hiddenCount = Object.keys(state.packingHide).length;
    if (hiddenCount) {
      html += '<button class="pack-restore" data-act="pack-restore">Restore ' + hiddenCount +
        ' removed default item' + (hiddenCount === 1 ? "" : "s") + '</button>';
    }
    document.getElementById("panel-more").innerHTML = html;
  }

  /* ---------- Budget / expense tracker ---------- */
  const CCY = { GBP: { sym: "£", flag: "🇬🇧" }, CNY: { sym: "¥", flag: "🇨🇳" }, JPY: { sym: "¥", flag: "🇯🇵" } };
  function toGBP(amount, ccy) {
    if (ccy === "GBP") return amount;
    if (!FX || !FX.rates) return null;
    const rate = FX.rates[ccy];
    return rate ? amount / rate : null;
  }
  function fmtGBP(n) {
    return "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function budgetSubtotals(byCcy) {
    const parts = ["CNY", "JPY", "GBP"].filter(function (c) { return byCcy[c]; }).map(function (c) {
      return CCY[c].flag + " " + CCY[c].sym + byCcy[c].toLocaleString("en-GB", { maximumFractionDigits: c === "JPY" ? 0 : 2 });
    });
    return parts.length ? parts.join(" · ") : "Nothing logged yet";
  }
  function renderBudget() {
    let html = moreHeader("Budget tracker");
    const exps = state.expenses.slice();
    // Totals
    let totalGBP = 0, anyUnconverted = false;
    const byCcy = { GBP: 0, CNY: 0, JPY: 0 };
    exps.forEach(function (e) {
      byCcy[e.ccy] = (byCcy[e.ccy] || 0) + e.amount;
      const g = toGBP(e.amount, e.ccy);
      if (g == null) anyUnconverted = true; else totalGBP += g;
    });
    html += '<div class="budget-total">' +
      '<div class="budget-total-lead">Total spent</div>' +
      '<div class="budget-total-num">' + (anyUnconverted ? "≈ " : "") + fmtGBP(totalGBP) + '</div>' +
      '<div class="budget-total-sub">' + budgetSubtotals(byCcy) + '</div>' +
    '</div>';
    if (!FX || !FX.rates) {
      html += '<p class="empty">Live exchange rates unavailable offline — totals show once you\'ve been online. Native amounts are always saved.</p>';
    }
    // Add form
    html += '<form class="exp-add" data-act="exp-add">' +
      '<div class="exp-row">' +
        '<input class="exp-amt" type="number" inputmode="decimal" step="0.01" min="0" placeholder="Amount" aria-label="Amount">' +
        '<select class="exp-ccy" aria-label="Currency"><option value="CNY">🇨🇳 CNY</option><option value="JPY">🇯🇵 JPY</option><option value="GBP">🇬🇧 GBP</option></select>' +
      '</div>' +
      '<input class="exp-label" type="text" placeholder="What for? (optional)" aria-label="Description">' +
      '<button type="submit" class="exp-submit">' + ICON.plus + ' Add expense</button>' +
    '</form>';
    // List
    if (exps.length) {
      html += '<div class="exp-list">';
      exps.slice().reverse().forEach(function (e) {
        const g = toGBP(e.amount, e.ccy);
        html += '<div class="exp-item" data-exp="' + esc(e.id) + '">' +
          '<div class="exp-main">' +
            '<div class="exp-desc">' + esc(e.label || "Expense") + '</div>' +
            '<div class="exp-meta">' + (e.date ? fmtDate(e.date).big : "") + '</div>' +
          '</div>' +
          '<div class="exp-amts">' +
            '<div class="exp-native">' + CCY[e.ccy].flag + " " + CCY[e.ccy].sym + e.amount.toLocaleString("en-GB", { maximumFractionDigits: e.ccy === "JPY" ? 0 : 2 }) + '</div>' +
            (e.ccy !== "GBP" && g != null ? '<div class="exp-gbp">' + fmtGBP(g) + '</div>' : "") +
          '</div>' +
          '<button class="exp-del" data-act="exp-del" aria-label="Delete">' + ICON.trash + '</button>' +
        '</div>';
      });
      html += '</div>';
    }
    document.getElementById("panel-more").innerHTML = html;
  }

  /* ---------- Emergency & essentials ---------- */
  function renderEmergency() {
    let html = moreHeader("Emergency & essentials");
    html += '<p class="empty" style="margin-bottom:12px">Tap a number to call. Show a hotel address to a taxi driver.</p>';
    // Emergency numbers
    DATA.emergency.numbers.forEach(function (block) {
      html += '<div class="emg-card"><h3>' + esc(block.country) + '</h3><div class="emg-nums">';
      block.items.forEach(function (it) {
        html += '<a class="emg-num" href="tel:' + esc(it.num) + '"><span class="emg-num-big">' + esc(it.num) + '</span><span class="emg-num-lbl">' + esc(it.label) + '</span></a>';
      });
      html += '</div></div>';
    });
    // Embassies
    html += '<h3 class="emg-sub">UK embassies & consulates</h3>';
    DATA.emergency.embassies.forEach(function (em) {
      html += '<div class="emg-row">' +
        '<div class="emg-row-main"><div class="emg-name">' + esc(em.name) + '</div>' +
        '<div class="emg-addr">' + esc(em.address) + '</div></div>' +
        '<div class="emg-row-acts">' +
          '<a class="emg-act" href="tel:' + esc(em.phone) + '" aria-label="Call">' + ICON.phone + '</a>' +
          '<button class="emg-act" data-act="emg-map" data-q="' + esc(em.name + ", " + em.address) + '" aria-label="Directions">' + ICON.directions + '</button>' +
        '</div>' +
      '</div>';
    });
    // Hotels (pulled live from itinerary data)
    html += '<h3 class="emg-sub">Where we\'re staying</h3>';
    DATA.hotels.forEach(function (h) {
      const nights = fmtDate(h.from).big + " – " + fmtDate(h.to).big;
      html += '<div class="emg-row">' +
        '<div class="emg-row-main"><div class="emg-name">' + esc(h.name) + '</div>' +
        '<div class="emg-addr">' + esc(h.address) + '</div>' +
        '<div class="emg-dates">' + nights + '</div></div>' +
        '<div class="emg-row-acts">' +
          '<button class="emg-act" data-act="emg-map" data-q="' + esc(h.name + ", " + h.address) + '" aria-label="Directions">' + ICON.directions + '</button>' +
        '</div>' +
      '</div>';
    });
    document.getElementById("panel-more").innerHTML = html;
  }

  /* ---------- Phrasebook ---------- */
  const speechOK = typeof window !== "undefined" && "speechSynthesis" in window;

  /* Speak a phrase in its native language using the device's voices. */
  function speakPhrase(text, langCode, btn) {
    if (!speechOK || !text) return;
    try {
      window.speechSynthesis.cancel();               // stop anything already playing
      const u = new SpeechSynthesisUtterance(text);
      if (langCode) u.lang = langCode;
      u.rate = 0.85;                                  // a touch slower so it's learnable
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(function (v) { return langCode && v.lang && v.lang.toLowerCase().indexOf(langCode.toLowerCase().slice(0, 2)) === 0; });
      if (match) u.voice = match;
      if (btn) {
        btn.classList.add("speaking");
        u.onend = u.onerror = function () { btn.classList.remove("speaking"); };
      }
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore unsupported */ }
  }

  function renderPhrasebook() {
    let html = moreHeader("Phrasebook");
    html += '<div class="phrase-tabs">';
    DATA.phrasebook.forEach(function (g, i) {
      html += '<button class="phrase-tab' + (i === phraseLang ? " active" : "") + '" data-act="phrase-lang" data-lang="' + i + '">' + esc(g.lang) + '</button>';
    });
    html += '</div>';
    const group = DATA.phrasebook[phraseLang] || DATA.phrasebook[0];
    if (speechOK) {
      html += '<p class="phrase-hint">Tap the speaker to hear how it sounds.</p>';
    }
    html += '<div class="phrase-list">';
    group.phrases.forEach(function (p) {
      const speak = speechOK
        ? '<button class="phrase-speak" data-act="phrase-speak" data-text="' + esc(p.local) + '" aria-label="Hear &quot;' + esc(p.en) + '&quot;">' + ICON.speaker + '</button>'
        : '';
      html += '<div class="phrase-item">' +
        '<div class="phrase-text">' +
          '<div class="phrase-en">' + esc(p.en) + '</div>' +
          '<div class="phrase-local">' + esc(p.local) + '</div>' +
          '<div class="phrase-pron">' + esc(p.pron) + '</div>' +
        '</div>' +
        speak +
      '</div>';
    });
    html += '</div>';
    document.getElementById("panel-more").innerHTML = html;
  }

  /* ---------- Document vault (blobs in IndexedDB, meta in localStorage) ---------- */
  const DOC_DB = "rach-docs", DOC_STORE = "files";
  function docDB() {
    return new Promise(function (res, rej) {
      const r = indexedDB.open(DOC_DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(DOC_STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function docTx(mode, fn) {
    return docDB().then(function (db) {
      return new Promise(function (res, rej) {
        const tx = db.transaction(DOC_STORE, mode);
        const store = tx.objectStore(DOC_STORE);
        const rq = fn(store);
        tx.oncomplete = function () { res(rq && rq.result); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function docPut(id, blob) { return docTx("readwrite", function (s) { return s.put(blob, id); }); }
  function docGet(id) { return docTx("readonly", function (s) { return s.get(id); }); }
  function docDelete(id) { return docTx("readwrite", function (s) { return s.delete(id); }); }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }
  function renderDocs() {
    let html = moreHeader("Documents");
    html += '<p class="empty" style="margin-bottom:12px">Save flight & hotel PDFs, tickets and passport photos here — they stay on this device and open offline.</p>';
    html += '<button class="doc-add-btn" data-act="doc-add">' + ICON.plus + ' Add a document</button>';
    if (state.docs.length) {
      html += '<div class="doc-list">';
      state.docs.slice().reverse().forEach(function (d) {
        const isImg = (d.type || "").indexOf("image/") === 0;
        html += '<div class="doc-item" data-doc="' + esc(d.id) + '">' +
          '<button class="doc-open" data-act="doc-open">' +
            '<span class="doc-ic">' + (isImg ? ICON.camera : ICON.file) + '</span>' +
            '<span class="doc-text"><span class="doc-name">' + esc(d.name) + '</span>' +
            '<span class="doc-meta">' + humanSize(d.size || 0) + '</span></span>' +
          '</button>' +
          '<button class="doc-del" data-act="doc-del" aria-label="Delete">' + ICON.trash + '</button>' +
        '</div>';
      });
      html += '</div>';
    }
    document.getElementById("panel-more").innerHTML = html;
  }

  let docFileInput = null;
  function ensureDocInput() {
    if (docFileInput) return docFileInput;
    docFileInput = document.createElement("input");
    docFileInput.type = "file";
    docFileInput.accept = "image/*,application/pdf";
    docFileInput.hidden = true;
    docFileInput.addEventListener("change", function () {
      const file = docFileInput.files && docFileInput.files[0];
      docFileInput.value = "";
      if (!file) return;
      const id = genId();
      docPut(id, file).then(function () {
        state.docs.push({ id: id, name: file.name, type: file.type, size: file.size, ts: Date.now() });
        saveState();
        renderDocs();
      }).catch(function () {
        window.alert("Sorry — couldn't save that file on this device.");
      });
    });
    document.body.appendChild(docFileInput);
    return docFileInput;
  }
  function openDoc(id) {
    const meta = state.docs.find(function (d) { return d.id === id; });
    docGet(id).then(function (blob) {
      if (!blob) { window.alert("This file is no longer stored on this device."); return; }
      const url = URL.createObjectURL(blob);
      const w = window.open(url, "_blank");
      // Revoke after a while to free memory (give the new tab time to load).
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      if (!w && meta) {
        // Popup blocked — fall back to a download.
        const a = document.createElement("a");
        a.href = url; a.download = meta.name; a.click();
      }
    });
  }

  /* ---------- More: mutations ---------- */
  function togglePack(id) {
    if (state.packing[id]) delete state.packing[id];
    else state.packing[id] = true;
    saveState();
  }
  function addPackItem(category, label) {
    label = (label || "").trim();
    if (!label) return;
    if (!state.packingAdd[category]) state.packingAdd[category] = [];
    state.packingAdd[category].push({ id: genId(), label: label });
    saveState();
    renderPacking();
  }
  function deletePackItem(id, category) {
    if (id.indexOf("pk:") === 0) {
      state.packingHide[id] = true;
    } else if (state.packingAdd[category]) {
      state.packingAdd[category] = state.packingAdd[category].filter(function (it) { return it.id !== id; });
    }
    delete state.packing[id];
    saveState();
    renderPacking();
  }
  function addExpense(amount, ccy, label) {
    amount = parseFloat(amount);
    if (!isFinite(amount) || amount <= 0) return false;
    state.expenses.push({ id: genId(), amount: amount, ccy: ccy, label: (label || "").trim(), date: localISO(new Date()), ts: Date.now() });
    saveState();
    renderBudget();
    return true;
  }
  function deleteExpense(id) {
    state.expenses = state.expenses.filter(function (e) { return e.id !== id; });
    saveState();
    renderBudget();
  }
  function deleteDoc(id) {
    docDelete(id).catch(function () { /* ignore */ });
    state.docs = state.docs.filter(function (d) { return d.id !== id; });
    saveState();
    renderDocs();
  }

  /* ---------- More: event handling ---------- */
  document.addEventListener("click", function (e) {
    const actEl = e.target.closest("[data-act]");
    if (!actEl) return;
    const act = actEl.getAttribute("data-act");
    if (act === "more-open") { moreView = actEl.getAttribute("data-tool"); renderMore(); window.scrollTo({ top: 0 }); return; }
    if (act === "more-back") { moreView = null; renderMore(); window.scrollTo({ top: 0 }); return; }
    if (act === "pack-toggle") {
      const row = actEl.closest(".pack-item");
      if (row) {
        const id = row.getAttribute("data-pack");
        togglePack(id);
        row.classList.toggle("done");
        // Update the progress bar in place.
        const st = packingStats();
        const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
        const fill = document.querySelector(".pack-fill");
        const count = document.querySelector(".pack-count");
        if (fill) fill.style.width = pct + "%";
        if (count) count.textContent = st.done + " / " + st.total + " packed";
      }
      return;
    }
    if (act === "pack-del") {
      const row = actEl.closest(".pack-item");
      if (row) deletePackItem(row.getAttribute("data-pack"), actEl.getAttribute("data-cat"));
      return;
    }
    if (act === "pack-restore") {
      state.packingHide = {};
      saveState();
      renderPacking();
      return;
    }
    if (act === "exp-del") {
      const row = actEl.closest(".exp-item");
      if (row) deleteExpense(row.getAttribute("data-exp"));
      return;
    }
    if (act === "emg-map") { openMaps(actEl.getAttribute("data-q"), "", ""); return; }
    if (act === "phrase-lang") { phraseLang = parseInt(actEl.getAttribute("data-lang"), 10) || 0; renderPhrasebook(); return; }
    if (act === "phrase-speak") {
      const group = DATA.phrasebook[phraseLang] || DATA.phrasebook[0];
      speakPhrase(actEl.getAttribute("data-text"), group && group.code, actEl);
      if (navigator.vibrate) navigator.vibrate(8);
      return;
    }
    if (act === "doc-add") { ensureDocInput().click(); return; }
    if (act === "doc-open") {
      const row = actEl.closest(".doc-item");
      if (row) openDoc(row.getAttribute("data-doc"));
      return;
    }
    if (act === "doc-del") {
      const row = actEl.closest(".doc-item");
      if (row) deleteDoc(row.getAttribute("data-doc"));
      return;
    }
  });

  // Form submits (Enter key / add buttons) for packing & budget.
  document.addEventListener("submit", function (e) {
    const form = e.target.closest("[data-act]");
    if (!form) return;
    const act = form.getAttribute("data-act");
    if (act === "pack-add") {
      e.preventDefault();
      const input = form.querySelector("input");
      addPackItem(form.getAttribute("data-cat"), input ? input.value : "");
      return;
    }
    if (act === "exp-add") {
      e.preventDefault();
      const amt = form.querySelector(".exp-amt");
      const ccy = form.querySelector(".exp-ccy");
      const label = form.querySelector(".exp-label");
      addExpense(amt ? amt.value : "", ccy ? ccy.value : "CNY", label ? label.value : "");
      return;
    }
  });

  /* ---------- Tabs ---------- */
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-target");
        // Tiny haptic tap on devices that support it.
        if (navigator.vibrate) navigator.vibrate(12);
        if (target === "more") { moreView = null; renderMore(); }
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

  /* ---------- Service worker (PWA install + offline) ---------- */
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    // Only register over http(s) — not file://.
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    navigator.serviceWorker.register("sw.js").catch(function () { /* silent */ });
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
    renderMore();
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
    document.querySelector('[data-target="more"] .ic').innerHTML = NAV_ICON.more;
    applyTheme();
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    initTabs();
    renderAll();
    renderFxChip();
    fetchCurrency();
    fetchWeatherAll();
    focusToday();
    registerServiceWorker();
  });
})();
