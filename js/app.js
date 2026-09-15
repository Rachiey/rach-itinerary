
(function () {
  "use strict";

  const DATA = window.TRIP_DATA;
  const STORAGE_KEY = "rach-itinerary-v1";

     const CITY_THEME = {
      shanghai: { g: "linear-gradient(135deg,#c9506f,#ef6f92 55%,#f8c9b5)", emoji: "🏮", c: "#ef6f92" },
      suzhou:   { g: "linear-gradient(135deg,#4f7a4a,#7fa563 55%,#dbe8c4)", emoji: "🏞️", c: "#7fa563" },
      beijing:  { g: "linear-gradient(135deg,#b87a3a,#e0a659 55%,#f8ddaa)", emoji: "🏯", c: "#e0a659" },
      nara:     { g: "linear-gradient(135deg,#7a8f4a,#a3c16f 55%,#e6efc8)", emoji: "🦌", c: "#a3c16f" },
      kyoto:    { g: "linear-gradient(135deg,#3d6b45,#5f9468 55%,#bcdaac)", emoji: "⛩️", c: "#5f9468" },
      osaka:    { g: "linear-gradient(135deg,#2f6b5f,#4a9488 55%,#a8d9cc)", emoji: "🐙", c: "#4a9488" },
      yokohama: { g: "linear-gradient(135deg,#3d7a72,#6fab9a 55%,#c0e0d4)", emoji: "🌉", c: "#6fab9a" },
      tokyo:    { g: "linear-gradient(135deg,#8a4a72,#b06f9a 55%,#e8bcd8)", emoji: "🗼", c: "#b06f9a" },
      kamakura: { g: "linear-gradient(135deg,#c1685a,#e2917d 55%,#f8d8bc)", emoji: "🪷", c: "#e2917d" },
    };

  let state = loadState();
  let dayFilter = "all"; 

  function loadState() {
    let s = { over: {}, added: {}, hidden: {}, flights: {}, photos: {}, hotels: {}, view: "list", theme: "light", order: {}, slotAreas: {}, slotOpen: {}, packing: {}, packingAdd: {}, packingHide: {}, expenses: [], docs: [], stamps: [], recipes: [] };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) s = Object.assign(s, JSON.parse(raw));
    } catch (e) { /* ignore */ }
    if (!s.hotels) s.hotels = {};
    if (!s.order || typeof s.order !== "object") s.order = {};
    if (!s.slotAreas || typeof s.slotAreas !== "object") s.slotAreas = {};
    if (!s.slotOpen || typeof s.slotOpen !== "object") s.slotOpen = {};
    if (!s.packing || typeof s.packing !== "object") s.packing = {};
    if (!s.packingAdd || typeof s.packingAdd !== "object") s.packingAdd = {};
    if (!s.packingHide || typeof s.packingHide !== "object") s.packingHide = {};
    if (!Array.isArray(s.expenses)) s.expenses = [];
    if (!Array.isArray(s.docs)) s.docs = [];
    if (!Array.isArray(s.stamps)) s.stamps = [];
    if (!Array.isArray(s.recipes)) s.recipes = [];
    if (s.theme !== "dark") s.theme = "light";
    return s;
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function genId() { return "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  const WEATHER_CACHE_KEY = "rach-weather-v2";
  const WEATHER = { data: {}, kind: {}, ttl: 6 * 60 * 60 * 1000 /* 6h */ };
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

  function shiftIsoYears(iso, delta) {
    const parts = iso.split("-");
    const y = parseInt(parts[0], 10) + delta;
    return String(y).padStart(4, "0") + "-" + parts[1] + "-" + parts[2];
  }

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

  function hhmm(isoDateTime) {
    if (!isoDateTime || typeof isoDateTime !== "string") return "";
    const t = isoDateTime.split("T")[1];
    return t ? t.slice(0, 5) : "";
  }

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
    if (cny != null) parts.push('<span class="fx-item fx-cny"><span class="fx-label">CNY</span><span>¥' + cny.toFixed(1) + '</span></span>');
    if (jpy != null) parts.push('<span class="fx-item fx-jpy"><span class="fx-label">JPY</span><span>¥' + Math.round(jpy) + '</span></span>');
    el.hidden = false;
    el.title = "£1 = " + (cny != null ? cny.toFixed(2) + " CNY" : "") + (cny != null && jpy != null ? " · " : "") + (jpy != null ? Math.round(jpy) + " JPY" : "") + (FX.date ? " (rates " + FX.date + ")" : "");
    el.setAttribute("aria-label", el.title);
    el.innerHTML = '<span class="fx-lead"><span class="fx-label">GBP</span><span>£1 =</span></span>' + parts.join("");
  }

  function fetchCurrency() {
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
      const when = n === 0 ? "<strong>today</strong>" : n === 1 ? "<strong>tomorrow</strong>" : "in&nbsp;<strong>" + n + " days</strong>";
      return '<div class="today-banner is-before">' +
        '<span class="today-tag">. ݁₊ ⊹ . ݁  ✈︎</span>' +
        '<span class="today-main">' +
          '<span class="today-line">Trip starts ' + when + '</span>' +
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

  function updateTodayBanner() {
    const host = document.getElementById("todayBanner");
    if (!host) return;
    host.innerHTML = todayBannerHTML();
  }

  // Shared integer-grid silhouettes for navigation and all action controls.
  function pixelIcon(outline, accent) {
    return '<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" shape-rendering="crispEdges" aria-hidden="true" focusable="false"><path d="' + outline + '"/>' + (accent ? '<path class="nav-accent" d="' + accent + '"/>' : '') + '</svg>';
  }
  const NAV_ICON = {
    days: pixelIcon('M2 4H6V2H8V4H16V2H18V4H22V22H2Z M4 10V20H20V10Z', 'M6 12H10V16H6Z M12 12H16V14H12Z M12 16H18V18H12Z'),
    book: pixelIcon('M2 4H22V10H20V14H22V20H2V14H4V10H2Z M4 6V8H6V16H4V18H20V16H18V8H20V6Z', 'M14 6H16V8H14Z M14 10H16V12H14Z M14 14H16V16H14Z M8 10H12V14H8Z'),
    buy: pixelIcon('M4 8H8V2H16V8H20V22H4Z M10 4V8H14V4Z M6 10V20H18V10Z', 'M8 12H10V16H14V12H16V18H8Z'),
    travel: pixelIcon('M8 2H16V6H22V20H20V22H18V20H6V22H4V20H2V6H8Z M10 4V6H14V4Z M4 8V18H20V8Z', 'M6 8H8V18H6Z M16 8H18V18H16Z M10 10H14V14H10Z'),
    camera: pixelIcon('M8 2H16V6H22V20H2V6H8Z M10 4V8H4V18H20V8H14V4Z M10 8H14V10H16V14H14V16H10V14H8V10H10Z M10 10V14H14V10Z', 'M4 8H6V10H4Z M10 10H14V14H10Z'),
    packing: pixelIcon('M8 2H16V4H18V6H20V22H4V6H6V4H8Z M10 4V6H14V4Z M6 8V20H18V8Z M8 12H16V18H8Z M10 14V16H14V14Z', 'M8 8H16V10H8Z M10 14H14V16H10Z'),
    more: pixelIcon('M2 10H6V14H2Z M10 10H14V14H10Z M18 10H22V14H18Z', 'M10 10H14V14H10Z')
  };

  const ICON = {
    check: pixelIcon('M4 10H6V12H8V14H10V12H12V10H14V8H16V6H18V4H22V8H20V10H18V12H16V14H14V16H12V18H8V16H6V14H4Z'),
    chevron: pixelIcon('M4 8H8V10H10V12H14V10H16V8H20V12H18V14H16V16H8V14H6V12H4Z'),
    chevronRight: pixelIcon('M8 4H12V6H14V8H16V10H18V14H16V16H14V18H12V20H8V16H10V14H12V10H10V8H8Z'),
    plus: pixelIcon('M10 2H14V10H22V14H14V22H10V14H2V10H10Z'),
    flip: pixelIcon('M6 2H18V4H20V8H18V6H6V10H2V4H6Z M18 22H6V20H4V16H6V18H18V14H22V20H18Z'),
    plane: pixelIcon('M10 2H14V8H16V10H20V12H22V16H14V20H16V22H8V20H10V16H2V12H4V10H8V8H10Z'),
    train: pixelIcon('M6 2H18V4H20V18H18V20H20V22H16V20H8V22H4V20H6V18H4V4H6Z M6 6V12H18V6Z M6 14V16H8V14Z M16 14V16H18V14Z'),
    pin: pixelIcon('M8 2H16V4H20V8H22V14H20V16H18V18H16V20H14V22H10V20H8V18H6V16H4V14H2V8H4V4H8Z M8 6V14H16V6Z'),
    directions: pixelIcon('M18 2H22V6H20V10H18V14H16V18H14V22H10V14H2V10H6V8H10V6H14V4H18Z M12 10V14H14V10Z'),
    bed: pixelIcon('M2 4H4V14H20V10H12V8H20V10H22V22H20V18H4V22H2Z M6 8H10V12H6Z'),
    walk: pixelIcon('M10 2H14V6H10Z M8 8H14V10H16V12H20V14H14V12H12V16H16V22H12V18H10V20H8V22H4V18H6V14H8V10H6V12H2V10H4V8Z'),
    clock: pixelIcon('M6 2H18V4H20V6H22V18H20V20H18V22H6V20H4V18H2V6H4V4H6Z M6 4V6H4V18H6V20H18V18H20V6H18V4Z M10 6H12V12H16V14H10Z'),
    edit: pixelIcon('M16 2H20V4H22V8H20V10H18V12H16V14H14V16H12V18H4V10H6V8H8V6H10V4H14V2Z M6 12V16H10V14H8V12Z M2 20H22V22H2Z'),
    list: pixelIcon('M2 4H6V8H2Z M10 4H22V8H10Z M2 10H6V14H2Z M10 10H22V14H10Z M2 16H6V20H2Z M10 16H22V20H10Z'),
    sun: pixelIcon('M10 0H14V4H10Z M10 20H14V24H10Z M0 10H4V14H0Z M20 10H24V14H20Z M2 2H6V6H2Z M18 2H22V6H18Z M2 18H6V22H2Z M18 18H22V22H18Z M8 6H16V8H18V16H16V18H8V16H6V8H8Z M8 8V16H16V8Z'),
    moon: pixelIcon('M8 2H14V4H10V8H12V12H16V14H20V10H22V16H20V20H16V22H8V20H4V16H2V8H4V4H8Z'),
    grip: pixelIcon('M6 2H10V6H6Z M14 2H18V6H14Z M6 10H10V14H6Z M14 10H18V14H14Z M6 18H10V22H6Z M14 18H18V22H14Z'),
    up: pixelIcon('M10 2H14V4H16V6H18V8H20V12H16V10H14V22H10V10H8V12H4V8H6V6H8V4H10Z'),
    down: pixelIcon('M10 2H14V14H16V12H20V16H18V18H16V20H14V22H10V20H8V18H6V16H4V12H8V14H10Z'),
    back: pixelIcon('M10 2H14V6H12V8H10V10H22V14H10V16H12V18H14V22H10V20H8V18H6V16H4V14H2V10H4V8H6V6H8V4H10Z'),
    wallet: pixelIcon('M4 2H20V6H22V22H2V4H4Z M4 6H18V4H4Z M4 8V20H20V16H12V10H20V8Z M14 12V14H20V12Z'),
    phone: pixelIcon('M2 2H8V8H6V12H8V14H10V16H14V14H20V20H18V22H12V20H8V18H6V16H4V12H2Z'),
    chat: pixelIcon('M4 2H20V4H22V16H20V18H10V20H6V22H2V4H4Z M4 4V18H8V16H20V4Z M6 8H18V10H6Z M6 12H14V14H6Z'),
    file: pixelIcon('M4 2H14V4H16V6H18V8H20V22H4Z M6 4V20H18V10H12V4Z M14 6V8H16V6Z M8 12H16V14H8Z M8 16H16V18H8Z'),
    trash: pixelIcon('M8 2H16V4H22V6H20V22H4V6H2V4H8Z M6 6V20H18V6Z M8 8H10V18H8Z M14 8H16V18H14Z'),
    star: pixelIcon('M10 2H14V6H16V8H22V12H20V14H18V16H20V22H16V20H14V18H10V20H8V22H4V16H6V14H4V12H2V8H8V6H10Z'),
    speaker: pixelIcon('M10 2H14V22H10V20H8V18H6V16H2V8H6V6H8V4H10Z M16 8H18V16H16Z M18 4H20V6H22V18H20V20H18V16H20V8H18Z'),
    stamp: pixelIcon('M8 2H16V4H18V8H16V10H14V14H20V16H22V20H2V16H4V14H10V10H8V8H6V4H8Z M4 16V18H20V16Z M4 22H20V24H4Z'),
    lightbulb: pixelIcon('M8 2H16V4H20V8H22V12H20V14H18V18H6V14H4V12H2V8H4V4H8Z M8 4V6H6V12H8V16H16V12H18V6H16V4Z M8 20H16V22H8Z'),
    calendar: NAV_ICON.days,
    camera: NAV_ICON.camera
  };

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

  function mapsUrl(query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }
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

  function formatHours(open, close) {
    open = (open || "").trim();
    close = (close || "").trim();
    if (open && close) return open + "–" + close;
    if (open) return open;
    if (close) return "til " + close;
    return "";
  }

  function placeType(p, containerKey) {
    const text = (p.name + " " + ((p.details || {}).note || "")).toLowerCase();
    if (/\b(mall|shopping centre|shopping center|department store)\b/.test(text)) return { label: "Mall", key: "mall" };
    if (/\b(shop|shops|store|boutique|market|arcade|loft)\b/.test(text)) return { label: "Shop", key: "shop" };
    if (/\b(fly|flight|airport|train|shinkansen|metro|ferry|transfer|depart|arrive|travel to|travel day|in the air)\b/.test(text)) return { label: "Travel", key: "travel" };
    if (/\b(temple|shrine|garden|museum|palace|castle|park|tower|wall|buddha|waterfall|aquarium|observatory|promenade|bund|lake|island|chinatown)\b/.test(text)) return { label: "Sight", key: "sight" };
    return null;
  }

  function renderPlace(p, containerKey, travelInfo, cityName) {
    const d = p.details || {};
    const hours = formatHours(d.open, d.close);
    const isItin = !!travelInfo;
    const isFood = /:(restaurants|cafes)$/.test(containerKey || "");
    const mustDo = !!d.mustDo;
    const type = placeType(p, containerKey);
    const travel = (d.travel == null ? "" : String(d.travel)).trim();
    const typeChip = type ? '<span class="place-type place-type-' + type.key + '">' + type.label + '</span>' : '';
    const travelChip = (isItin && travel)
      ? '<div class="travel-chip">' + ICON.walk + ' ' + esc(travel) + ' min ' + travelLabel(travelInfo.first, d.travelFrom) + '</div>'
      : "";
    const hoursChip = hours ? '<div class="todo-meta">' + esc(hours) + '</div>' : "";
    const mapsBtn = cityName
      ? '<button class="link-maps" data-act="maps">' + ICON.directions + ' Directions</button>'
      : "";
    return (
      '<div class="todo' + (p.done ? " done" : "") + (mustDo ? " must-do" : "") + '" data-place="' + p.id + '" data-container="' + esc(containerKey) + '"' +
        (cityName ? ' data-city="' + esc(cityName) + '"' : '') +
        (isItin ? ' data-itin="1" data-first="' + (travelInfo.first ? "1" : "0") + '"' : '') + '>' +
        '<div class="todo-row">' +
          '<button class="check" data-act="toggle" aria-label="Toggle done">' + ICON.check + '</button>' +
          '<div class="todo-name"><span class="todo-title">' + esc(p.name) + '</span>' + typeChip + '</div>' +
          '<div class="todo-chips">' + travelChip + hoursChip + '</div>' +
          '<button class="must-do-toggle' + (mustDo ? " active" : "") + '" data-act="must-do" aria-label="' + (mustDo ? "Remove from must do" : "Mark as must do") + '" title="' + (mustDo ? "Remove from must do" : "Mark as must do") + '">' + ICON.star + '</button>' +
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

  const SLOT_ICON = {
    morning: ICON.sun, afternoon: ICON.sun, evening: ICON.moon,
    restaurants: ICON.pin, cafes: ICON.pin,
  };

  function renderSlot(day, slotKey, label, dotClass, seq) {
    const containerKey = day.id + ":" + slotKey;
    const cityName = (DATA.cities[day.city] || {}).name || "";
    const seedArea = (day.areas || {})[slotKey] || "";
    const area = state.slotAreas[containerKey] != null ? state.slotAreas[containerKey] : seedArea;
    const list = placesFor(day[slotKey], containerKey);
    const priority = list.filter(function (p) { return !!(p.details || {}).mustDo; });
    const regular = list.filter(function (p) { return !(p.details || {}).mustDo; });
    const renderRows = function (items) { return items.map(function (p) {
      const info = { first: seq.n === 0 };
      seq.n++;
      return renderPlace(p, containerKey, info, cityName);
    }).join(""); };
    const rows = (priority.length ? '<div class="slot-priority">' + ICON.star + ' Must do</div>' + renderRows(priority) : "") + renderRows(regular);
    const doneCount = list.filter(function (p) { return p.done; }).length;
    const mustDoCount = list.filter(function (p) { return !!(p.details || {}).mustDo; }).length;
    const isOpen = state.slotOpen[containerKey] != null ? state.slotOpen[containerKey] : slotKey === "morning";
    const tally = list.length ? '<span class="slot-tally">' + doneCount + '/' + list.length + '</span>' : '';
    const mustDo = mustDoCount ? '<span class="slot-must">' + ICON.star + ' ' + mustDoCount + '</span>' : '';
    return (
      '<section class="slot' + (isOpen ? " is-open" : "") + '" data-slot="' + dotClass + '" data-container="' + esc(containerKey) + '">' +
        '<div class="slot-head"><button class="slot-toggle" data-act="slot-toggle" aria-expanded="' + isOpen + '"><span class="slot-emoji ' + dotClass + '">' + (SLOT_ICON[slotKey] || "") + '</span><span class="slot-label"><h4>' + label + '</h4><span class="slot-count">' + list.length + (list.length === 1 ? " stop" : " stops") + '</span></span><span class="slot-chevron">' + ICON.chevron + '</span></button><label class="slot-area"><span>Area</span><input data-slotarea="' + esc(containerKey) + '" value="' + esc(area) + '" placeholder="Add area" aria-label="' + esc(label) + ' area"></label>' + mustDo + tally + '</div>' +
        '<div class="slot-content">' + rows + '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add a place</button></div>' +
      '</section>'
    );
  }

  function renderBackList(day, slotKey, label) {
    const containerKey = day.id + ":" + slotKey;
    const cityName = (DATA.cities[day.city] || {}).name || "";
    const list = placesFor(day[slotKey], containerKey);
    const priority = list.filter(function (p) { return !!(p.details || {}).mustDo; });
    const regular = list.filter(function (p) { return !(p.details || {}).mustDo; });
    const renderRows = function (items) {
      return items.map(function (p) { return renderPlace(p, containerKey, null, cityName); }).join("");
    };
    const rows = list.length
      ? (priority.length ? '<div class="slot-priority">' + ICON.star + ' Must do</div>' + renderRows(priority) : "") + renderRows(regular)
      : '<p class="empty">Nothing yet — add a spot.</p>';
    const slotClass = slotKey === "restaurants" ? "afternoon" : "evening";
    return (
      '<div class="slot" data-slot="' + slotClass + '">' +
        '<div class="slot-head"><span class="slot-emoji ' + slotClass + '">' + (SLOT_ICON[slotKey] || "") + '</span><h4>' + label + '</h4></div>' +
        rows +
        '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add a place</button>' +
      '</div>'
    );
  }

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

  function dayProgress(day) {
    let total = 0, done = 0;
    ["morning", "afternoon", "evening", "restaurants", "cafes"].forEach(function (slot) {
      const key = day.id + ":" + slot;
      placesFor(day[slot], key).forEach(function (p) { total++; if (p.done) done++; });
    });
    return { total: total, done: done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function dayMeterInner(p) {
    return '<span class="day-meter-track" aria-hidden="true">' +
      Array.from({ length: 10 }, function (_, i) {
        return '<i class="' + (p.pct >= (i + 1) * 10 ? 'filled' : '') + '"></i>';
      }).join('') + '</span><span class="day-meter-count">' + p.done + '/' + p.total + ' done</span>';
  }
  function dayMeterHTML(day) {
    const p = dayProgress(day);
    if (!p.total) return '';
    return '<span class="day-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p.pct +
      '" aria-label="Day activities" aria-valuetext="' + p.done + ' of ' + p.total + ' done">' + dayMeterInner(p) + '</span>';
  }
  function updateDayMeter(dayEl) {
    if (!dayEl) return;
    const day = DATA.days.find(function (d) { return d.id === dayEl.getAttribute("data-day"); });
    const meter = dayEl.querySelector(".day-meter");
    if (!day || !meter) return;
    const p = dayProgress(day);
    meter.setAttribute("aria-valuenow", p.pct);
    meter.setAttribute("aria-valuetext", p.done + " of " + p.total + " done");
    meter.innerHTML = dayMeterInner(p);
  }

  function bookingsForDay(day) {
    const containerKey = "book";
  
    const seed = DATA.bookings.filter(function (b) {
      return !state.hidden[b.id];
    });
  
    const added = (state.added[containerKey] || []).filter(function (b) {
      return !state.hidden[b.id];
    });
  
    return seed.concat(added).filter(function (b) {
      if (!isBooked(b.id, containerKey)) return false;
  
      const date = readBookingDate(b, containerKey);
      return date === day.date;
    });
  }
  
  function dayBookingBanner(day) {
    const bookings = bookingsForDay(day);
    if (!bookings.length) return "";
  
    return (
      '<div class="day-booking-banner">' +
        '<div class="day-booking-icon">📌</div>' +
        '<div class="day-booking-content">' +
          '<strong>Booking today</strong>' +
          bookings.map(function (b) {
            const d = isAdded("book", b.id)
              ? (b.details || {})
              : Object.assign(
                  {},
                  b.details || {},
                  (state.over[b.id] || {}).details || {}
                );
  
            const time = d.bookingTime ? " · " + d.bookingTime : "";
  
            return '<button type="button" class="day-booking-item" data-act="open-booking" data-place="' + esc(b.id) + '">' +
              '<span>' + esc(b.name) + esc(time) + '</span>' +
              '<span class="day-booking-go">' + ICON.chevron + '</span>' +
            '</button>';
          }).join("") +
        '</div>' +
      '</div>'
    );
  }

  function openBookingItem(id) {
    const bookTab = document.querySelector('.tab[data-target="book"]');
    if (bookTab && !bookTab.classList.contains("active")) bookTab.click();
    requestAnimationFrame(function () {
      const el = document.querySelector('.todo.booking[data-place="' + cssEscape(id) + '"][data-container="book"]');
      if (!el) return;
      el.classList.add("open");
      el.classList.add("just-opened");
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(function () { el.classList.remove("just-opened"); }, 1600);
    });
  }

  function renderDay(day) {
    const city = DATA.cities[day.city];
    const theme = CITY_THEME[day.city] || { g: "var(--line-strong)", emoji: "📍", c: "var(--line-strong)" };
    const dt = fmtDate(day.date);
    const photo = state.photos[day.id] || day.photo;
    const bg = photo
  ? "background-image:url(" + photo + ");"
  : "background-image:" + theme.g + ";";

    const seq = { n: 0 };

    const canReorder = !day._single && !day._pinned;
    const reorderHandle = canReorder
      ? '<span class="day-handle" data-act="draghandle" title="Drag to reorder within this leg">' + ICON.grip + '</span>'
      : '';
    const reorderMoves = canReorder
      ? '<span class="day-move" data-pop="Swap days &mdash; the dates stay fixed, only your plans move">' +
          '<button class="move-btn" type="button" data-act="moveup"' + (day._first ? ' disabled' : '') + ' aria-label="Swap with the day before">' + ICON.up + '</button>' +
          '<button class="move-btn" type="button" data-act="movedown"' + (day._last ? ' disabled' : '') + ' aria-label="Swap with the day after">' + ICON.down + '</button>' +
        '</span>'
      : '';
    const holidayBadge = day.holiday ? '<span class="holiday-badge">' + ICON.calendar + ' Holiday</span>' : '';
    const holidayAlert = day.holiday
      ? '<div class="holiday-alert"><strong>' + ICON.calendar + ' ' + esc(day.holiday.name) + '</strong><span>' + esc(day.holiday.note) + '</span></div>'
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
        '<div class="day-body">' +
          '<div class="day-head">' +
            reorderHandle +
            '<button class="day-focus" data-act="daytoggle">' +
              '<span class="day-date-tile"><strong>' + dt.big.split(' ')[0] + '</strong><small>' + dt.big.split(' ')[1] + '</small></span>' +
              '<span class="day-meta">' +
                '<span class="day-date-mini">' + dt.dow + ' · ' + esc(city.name) + '</span>' +
                '<span class="day-title">' + esc(day.focus) + holidayBadge + '</span>' +
              '</span>' +
              '<span class="day-chevron">' + ICON.chevron + '</span>' +
            '</button>' +
            reorderMoves +
          '</div>' +
          '<div class="day-status">' + dayMeterHTML(day) + weatherChip(day.city, day.date) + '</div>' +
          '<div class="day-collapse">' +
            sunTimes(day.city, day.date) +
            holidayAlert +
            dayBookingBanner(day) +
            renderHotelBar(day) +
            renderSlot(day, "morning", "Morning", "morning", seq) +
            renderSlot(day, "afternoon", "Afternoon", "afternoon", seq) +
            renderSlot(day, "evening", "Evening", "evening", seq) +
            '<button class="day-food-action" data-act="open-food">' + ICON.pin + ' Food &amp; drink</button> ' +
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

  function legKeyForDay(day) {
    const h = hotelForDay(day);
    if (h) return "h:" + h.id;
    const c = DATA.cities[day.city];
    return "c:" + (c ? c.country : day.city);
  }

  const PINNED_DATES = {
    "2026-09-28": true, // LHR → Shanghai
    "2026-10-05": true, // Shanghai → Osaka
    "2026-10-10": true, // Shinkansen Osaka → Tokyo
    "2026-10-17": true, // Tokyo → Beijing
    "2026-10-19": true, // Beijing → Shanghai (train)
    "2026-10-22": true, // Shanghai → LHR (fly home)
  };

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
      nextUpHTML() +
      toolbar +
      '<div class="days-list"' + (view === "calendar" ? " hidden" : "") + '>' +
        filterChips +
        listHtml +
      '</div>' +
      '<div class="days-calendar"' + (view === "list" ? " hidden" : "") + '>' + renderCalendar() + '</div>';
    document.getElementById("panel-days").innerHTML = html;
    applyDayFilter();
  }

  function nextUpHTML() {
    const today = localISO(new Date());
    const days = effectiveDays();
    // When today itself is a trip day, the Today banner already covers it,
    // so Next up should point to whatever comes after — not repeat it.
    const liveToday = days.some(function (item) { return item.date === today; });
    const day = liveToday
      ? days.find(function (item) { return item.date > today; })
      : (days.find(function (item) { return item.date >= today; }) || days[days.length - 1]);
    if (!day) return "";
    const city = DATA.cities[day.city] || {};
    const stops = ["morning", "afternoon", "evening"].reduce(function (total, slot) {
      return total + placesFor(day[slot], day.id + ":" + slot).length;
    }, 0);
    const when = Math.round((new Date(day.date + "T00:00:00") - new Date(today + "T00:00:00")) / 86400000);
    const label = when === 0 ? "Today" : when === 1 ? "Tomorrow" : "In " + when + " days";
    return '<section class="next-up"><div class="next-up-label">Next up <span>' + esc(label) + '</span></div><button class="next-up-main" data-act="open-day" data-day="' + esc(day.id) + '"><span>' + esc((CITY_THEME[day.city] || {}).emoji || city.flag || "") + '</span><span><strong>' + esc(day.focus) + '</strong><small>' + esc(fmtDate(day.date).dow + " · " + fmtDate(day.date).big + " · " + city.name + " · " + stops + " stops") + '</small></span><span class="next-up-chevron">' + ICON.chevron + '</span></button></section>';
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
          return '<span class="cal-key"><span class="dot" style="background:' + (t.c || "#8a8a8a") + '"></span>' + esc(c.name || c.code) + "</span>";
        }).join("") +
      "</div>";

    const hint = todayISO >= dates[0] && todayISO <= dates[dates.length - 1]
      ? '<p class="cal-hint">The glowing square is today. Tap any day to open it.</p>'
      : '<p class="cal-hint">Tap any day to open it. Your current day will glow once the trip begins.</p>';

    return '<div class="cal-wrap">' + head + '<div class="cal-grid">' + cells + "</div>" + legend + hint + "</div>";
  }

  /* Sub-categories for "Things to buy". Order here = display order. */
  const SHOP_CATS = [
    { key: "food",        label: "Food & drink",  emoji: "🍜" },
    { key: "beauty",      label: "Beauty",        emoji: "💄" },
    { key: "clothes",     label: "Clothes",       emoji: "👕" },
    { key: "accessories", label: "Accessories",   emoji: "👜" },
    { key: "gifts",       label: "Gifts",         emoji: "🎁" },
    { key: "tech",        label: "Technology",    emoji: "💻" },
    { key: "utensils",    label: "Utensils",      emoji: "🍽️" },
    { key: "stationery",  label: "Stationery",    emoji: "✏️" },
    { key: "other",       label: "Other",         emoji: "🛍️" },
  ];
  const SHOP_CAT_MAP = {};
  SHOP_CATS.forEach(function (c) { SHOP_CAT_MAP[c.key] = c; });
  function shopCat(key) { return SHOP_CAT_MAP[key] || SHOP_CAT_MAP.other; }

  function renderShopping() {
    let html = '<h2 class="section-title">Things to buy</h2>';
    DATA.shopping.forEach(function (group) {
      const containerKey = "shop:" + group.category;
      const cityKey = group.city || "";
      const theme = CITY_THEME[cityKey] || {};
      const city = (DATA.cities && DATA.cities[cityKey]) || {};
      const colour = theme.c || "var(--highlight)";
      const flag = city.flag || "";
      const list = placesFor(group.items, containerKey);

      html += '<div class="shop-city" style="--cc:' + colour + '">';
      html += '<h3 class="shop-city-name">' + esc(group.category) +
        (flag ? ' <span class="shop-flag">' + flag + '</span>' : '') + '</h3>';

      if (list.length) {
        // Bucket items by sub-category, preserving SHOP_CATS order.
        const buckets = {};
        list.forEach(function (p) {
          const key = shopCat((p.details || {}).cat).key;
          (buckets[key] = buckets[key] || []).push(p);
        });
        SHOP_CATS.forEach(function (cat) {
          const items = buckets[cat.key];
          if (!items || !items.length) return;
          html += '<div class="shop-cat">' +
            '<div class="shop-cat-label"><span class="shop-cat-emoji">' + cat.emoji + '</span>' + esc(cat.label) + '</div>' +
            items.map(function (p) { return renderShopItem(p, containerKey); }).join("") +
            '</div>';
        });
      } else {
        html += '<p class="shop-empty">Nothing added yet.</p>';
      }

      html += '<button class="add-place" data-act="add" data-container="' + esc(containerKey) + '">' + ICON.plus + ' Add an item</button>';
      html += '</div>';
    });
    document.getElementById("panel-buy").innerHTML = html;
    hydrateShopPhotos();
  }

  /* One "thing to buy" card: name, category chip, brand/photo reference. */
  function renderShopItem(p, containerKey) {
    const d = p.details || {};
    const cat = shopCat(d.cat);
    const photo = (d.photo || "").trim();
    const chip = '<span class="shop-chip">' + cat.emoji + ' ' + esc(cat.label) + '</span>';
    const thumb = photo
      ? '<button class="shop-photo-btn" data-act="shop-photo-view" aria-label="View photo">' +
          '<img class="shop-photo" data-photo="' + esc(photo) + '" alt="' + esc(p.name) + '"></button>'
      : '';
    // Category picker buttons for the editor.
    const picker = SHOP_CATS.map(function (c) {
      return '<button type="button" class="cat-opt' + (c.key === cat.key ? " on" : "") + '"' +
        ' data-act="shop-cat" data-cat="' + c.key + '">' + c.emoji + ' ' + esc(c.label) + '</button>';
    }).join("");
    const photoAction = photo
      ? '<button class="link-maps" data-act="shop-photo">' + ICON.camera + ' Replace photo</button>' +
        '<button class="link-danger" data-act="shop-photo-del">Remove photo</button>'
      : '<button class="link-maps" data-act="shop-photo">' + ICON.camera + ' Add a photo</button>';
    return (
      '<div class="todo shop-item' + (p.done ? " done" : "") + '" data-place="' + p.id + '" data-container="' + esc(containerKey) + '">' +
        '<div class="todo-row">' +
          '<button class="check" data-act="toggle" aria-label="Mark bought">' + ICON.check + '</button>' +
          '<div class="todo-name">' + esc(p.name) + '</div>' +
          '<div class="todo-chips">' + chip + '</div>' +
          (thumb ? '<div class="shop-thumb-wrap">' + thumb + '</div>' : '') +
          '<button class="todo-expand" data-act="expand" aria-label="Details">' + ICON.chevron + '</button>' +
        '</div>' +
        '<div class="todo-detail">' +
          '<div class="shop-cat-picker"><label>Category</label><div class="cat-opts">' + picker + '</div></div>' +
          '<div class="detail-grid">' +
            field("What to look for", "note", d.note, "Brand, size, colour…", true, true) +
            field("Where to buy", "address", d.address, "Shop / area", true) +
          '</div>' +
          '<div class="shop-photo-row">' + thumb + '<div class="shop-photo-actions">' + photoAction + '</div></div>' +
          '<div class="detail-actions">' +
            '<button class="link-danger" data-act="delete">Remove item</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
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

  function visitCountdown(iso) {
    if (!iso) return "Date to add";
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(iso + "T00:00:00");
    const days = Math.round((target - today) / 86400000);
    if (days < 0) return "Completed";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return "In " + days + " days";
  }

  function bookingSummary(date, time, location, ref) {
    const when = date ? fmtDate(date).big + (time ? " · " + time : "") : "Date to add";
    return (
      '<div class="booking-confirmed">' +
        '<div class="booking-confirmed-top"><span class="booking-status">Booked</span><span class="booking-visit-countdown">' + esc(visitCountdown(date)) + '</span></div>' +
        '<div class="booking-confirmed-detail booking-confirmed-date">' + ICON.calendar + '<span>' + esc(when) + '</span></div>' +
        '<div class="booking-confirmed-detail booking-confirmed-location">' + ICON.pin + '<span>' + esc(location || "Location to add") + '</span></div>' +
        (ref ? '<div class="booking-confirmed-ref">Ref: ' + esc(ref) + '</div>' : '') +
      '</div>'
    );
  }

  function renderBooking(b, containerKey) {
    const booked = isBooked(b.id, containerKey);
    const cd = bookingCountdown(b.bookByDate);
    let d;
    if (isAdded(containerKey, b.id)) d = b.details || {};
    else d = Object.assign({}, b.details || {}, (state.over[b.id] && state.over[b.id].details) || {});
    const bookingDate = d.bookingDate || b.visit || "";
    const bookingTime = d.bookingTime || "";
    const bookingLocation = d.bookingLocation || b.where || "";
    return (
      '<div class="todo booking urg-' + cd.level + (booked ? " done" : "") + '" data-place="' + b.id + '" data-container="' + esc(containerKey) + '">' +
        '<div class="todo-row">' +
          '<button class="check" data-act="toggle" aria-label="Mark booked">' + ICON.check + '</button>' +
          '<div class="booking-main">' +
            '<div class="booking-name">' + esc(b.name) + (b.flexible ? ' <span class="flex-tag">flexible</span>' : '') + '</div>' +
            '<div class="booking-where">' + ICON.pin + ' ' + esc(b.where || "") + '</div>' +
          '</div>' +
          '<button class="todo-expand" data-act="expand" aria-label="Details">' + ICON.chevron + '</button>' +
        '</div>' +
        (booked ? bookingSummary(bookingDate, bookingTime, bookingLocation, d.ref) : '<div class="booking-when"><span class="pulse"></span><div><strong>' + esc(b.bookBy) + '</strong><span class="cd">' + esc(cd.text) + '</span></div></div>') +
        (b.note ? '<div class="booking-note">' + esc(b.note) + '</div>' : '') +
        '<div class="todo-detail">' +
          '<div class="detail-grid">' +
            '<div class="field"><label>Booked for</label><input type="date" data-field="bookingDate" value="' + esc(bookingDate) + '"></div>' +
            '<div class="field"><label>Time</label><input type="time" data-field="bookingTime" value="' + esc(bookingTime) + '"></div>' +
            field("Booking location", "bookingLocation", bookingLocation, "Venue / branch", true) +
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
    let html = '<h2 class="section-title">Bookings</h2>';

    // Seed bookings (respecting deletions) + any you\'ve added, sorted by urgency.
    const seed = DATA.bookings.filter(function (b) { return !state.hidden[b.id]; });
    const added = (state.added[containerKey] || []).filter(function (b) { return !state.hidden[b.id]; });
    const all = seed.concat(added);
    const rank = { now: 0, soon: 1, later: 2, flex: 3 };
    const confirmed = all.filter(function (b) { return isBooked(b.id, containerKey); });
    const outstanding = all.filter(function (b) { return !isBooked(b.id, containerKey); });
    outstanding.sort(function (a, b) {
      const la = bookingCountdown(a.bookByDate).level, lb = bookingCountdown(b.bookByDate).level;
      return (rank[la] - rank[lb]);
    });

    confirmed.sort(function (a, b) {
      const ad = readBookingDate(a, containerKey), bd = readBookingDate(b, containerKey);
      return ad < bd ? -1 : ad > bd ? 1 : 0;
    });
    if (confirmed.length) {
      html += '<div class="booking-section-head confirmed-head"><span>Confirmed</span><strong>' + confirmed.length + '</strong></div>' +
        confirmed.map(function (b) { return renderBooking(b, containerKey); }).join("");
    }
    html += '<div class="booking-section-head"><span>Still to book</span><strong>' + outstanding.length + '</strong></div>' +
      outstanding.map(function (b) { return renderBooking(b, containerKey); }).join("");
    html += '<button class="add-place" data-act="add" data-container="' + containerKey + '">' + ICON.plus + ' Add something to book</button>';
    document.getElementById("panel-book").innerHTML = html;
  }

  function readBookingDate(b, containerKey) {
    if (isAdded(containerKey, b.id)) return (b.details || {}).bookingDate || b.visit || "";
    return ((state.over[b.id] || {}).details || {}).bookingDate || b.visit || "";
  }

  /* =====================================================================
     TRAVEL — flights / trains + hotels combined into one tab.
     ===================================================================== */
  function renderTravel() {
    document.getElementById("panel-travel").innerHTML = flightsMarkup() + hotelsMarkup();
  }

  function flightsMarkup() {
    let html = '<h2 class="section-title">Flights &amp; trains</h2>';
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
    return html;
  }
  function fField(label, key, val) {
    return '<div class="field"><label>' + label + '</label><input data-fflight="' + key + '" value="' + esc(val) + '" placeholder="—"></div>';
  }

  function hotelsMarkup() {
    let html = '<h2 class="section-title" style="margin-top:var(--space-22)">Where you\'re staying</h2>' +
      '<p class="empty" style="margin-bottom:var(--space-14)">Every stay on the trip. Tap a card to edit the name, address or check-in / check-out — it saves automatically and syncs to the day cards.</p>';
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
    return html;
  }

  /* =====================================================================
     CAMERA — Fujifilm X100VI scene settings + film-simulation recipes.
     Two views: "scenes" (pick a situation → recommended settings) and
     "recipes" (seed recipes + your own, saved on this device).
     ===================================================================== */
  let cameraView = "scenes"; // "scenes" | "recipes"
  let cameraScene = null;    // selected scene id (null → first scene)
  const recipePhotoUrls = {};    // photoId -> object URL (session cache)
  let pendingRecipePhoto = null; // blob id of an example photo waiting to be attached on submit

  /* Build a list of signed values (e.g. "−2", "−1.5" … "0" … "+4") for the
     tone / colour dropdowns, matching how Fujifilm labels them. */
  function signedRange(min, max, step) {
    const out = [];
    for (let v = min; v <= max + 1e-9; v += step) {
      const r = Math.round(v * 10) / 10;
      if (r === 0) { out.push("0"); continue; }
      out.push((r > 0 ? "+" : "−") + String(r).replace("-", ""));
    }
    return out;
  }

  // Fujifilm X100VI film simulations (for the recipe's headline chip).
  const RECIPE_SIMS = [
    "Provia / Standard", "Velvia / Vivid", "Astia / Soft", "Classic Chrome",
    "Reala Ace", "PRO Neg. Hi", "PRO Neg. Std", "Classic Negative",
    "Nostalgic Neg", "Eterna / Cinema", "Eterna Bleach Bypass",
    "Acros", "Acros + Ye", "Acros + R", "Acros + G",
    "Monochrome", "Mono + Ye", "Mono + R", "Mono + G", "Sepia",
  ];

  // Each in-camera setting gets its own labelled dropdown so custom recipes
  // lay out identically to the seeded spec sheets. `wbRed` / `wbBlue` are
  // merged into the White balance row on save.
  const RECIPE_FIELDS = [
    { key: "dr",        label: "Dynamic range",     options: ["DR-Auto", "DR100", "DR200", "DR400"] },
    { key: "grain",     label: "Grain effect",      options: ["Off", "Weak / Small", "Weak / Large", "Strong / Small", "Strong / Large"] },
    { key: "ccfx",      label: "Color chrome FX",   options: ["Off", "Weak", "Strong"] },
    { key: "ccblue",    label: "Color chrome blue", options: ["Off", "Weak", "Strong"] },
    { key: "wb",        label: "White balance",     options: ["Auto", "Auto white priority", "Auto ambience priority", "Daylight", "Shade", "Fluorescent 1", "Fluorescent 2", "Fluorescent 3", "Incandescent", "2500K", "2800K", "3200K", "3500K", "4000K", "4500K", "5000K", "5500K", "6000K", "6500K", "7000K", "7500K", "8000K"] },
    { key: "wbRed",     label: "WB shift · Red",    options: signedRange(-9, 9, 1) },
    { key: "wbBlue",    label: "WB shift · Blue",   options: signedRange(-9, 9, 1) },
    { key: "highlight", label: "Highlight",         options: signedRange(-2, 4, 0.5) },
    { key: "shadow",    label: "Shadow",            options: signedRange(-2, 4, 0.5) },
    { key: "color",     label: "Color",             options: signedRange(-4, 4, 1) },
    { key: "sharpness", label: "Sharpness",         options: signedRange(-4, 4, 1) },
    { key: "clarity",   label: "Clarity",           options: signedRange(-5, 5, 1) },
    { key: "nr",        label: "Noise reduction",   options: signedRange(-4, 4, 1) },
    { key: "iso",       label: "ISO",               options: ["Auto", "Auto up to 3200", "Auto up to 6400", "Auto up to 12800", "125 (base)", "160", "200", "250", "320", "400", "500", "640", "800", "1000", "1250", "1600", "2000", "2500", "3200", "4000", "5000", "6400", "12800"] },
    { key: "expcomp",   label: "Exposure comp",     options: ["−1 EV", "−2/3 EV", "−1/3 EV", "0 EV", "+1/3 EV", "+2/3 EV", "+1 EV", "+1 1/3 EV", "+1 2/3 EV", "+2 EV"] },
  ];

  function renderCamera() {
    let html = '<h2 class="section-title">Camera</h2>' +
      '<div class="cam-seg">' +
        '<button class="cam-seg-btn' + (cameraView === "scenes" ? " on" : "") + '" data-act="cam-view" data-view="scenes">Scene settings</button>' +
        '<button class="cam-seg-btn' + (cameraView === "recipes" ? " on" : "") + '" data-act="cam-view" data-view="recipes">Film recipes</button>' +
      '</div>';
    html += (cameraView === "recipes") ? cameraRecipesMarkup() : cameraScenesMarkup();
    document.getElementById("panel-camera").innerHTML = html;
    if (cameraView === "recipes") hydrateRecipePhotos();
  }

  function specRows(settings) {
    return (settings || []).map(function (row) {
      return '<div class="cam-spec"><span class="cam-spec-k">' + esc(row.k) + '</span>' +
        '<span class="cam-spec-v">' + esc(row.v) + '</span></div>';
    }).join("");
  }

  function cameraScenesMarkup() {
    const scenes = DATA.cameraScenes || [];
    if (!scenes.length) return '<p class="empty">No scenes yet.</p>';
    const activeId = (cameraScene && scenes.some(function (s) { return s.id === cameraScene; }))
      ? cameraScene : scenes[0].id;
    let html = '<div class="cam-chip-row">';
    scenes.forEach(function (s) {
      html += '<button class="cam-chip' + (s.id === activeId ? " on" : "") + '" data-act="cam-scene" data-scene="' + esc(s.id) + '">' +
        '<span class="cam-chip-emoji">' + s.emoji + '</span>' + esc(s.name) + '</button>';
    });
    html += '</div>';
    const scene = scenes.find(function (s) { return s.id === activeId; });
    html += '<div class="cam-detail">' +
      '<div class="cam-detail-head"><span class="cam-detail-emoji">' + scene.emoji + '</span>' +
        '<div class="cam-detail-text"><h3>' + esc(scene.name) + '</h3><p>' + esc(scene.summary) + '</p></div></div>' +
      '<div class="cam-specs">' + specRows(scene.settings) + '</div>' +
      (scene.tip ? '<div class="cam-tip">' + ICON.lightbulb + '<span>' + esc(scene.tip) + '</span></div>' : '') +
    '</div>';
    return html;
  }

  function cameraRecipesMarkup() {
    let html = '<form class="cam-recipe-add" data-act="recipe-add">' +
      '<input class="crx-name" type="text" placeholder="Recipe name" aria-label="Recipe name" required>' +
      '<div class="crx-settings">' +
        recipeSelectRow("Film simulation", "crx-sel crx-sim", "", RECIPE_SIMS) +
        RECIPE_FIELDS.map(function (f) {
          return recipeSelectRow(f.label, "crx-sel", ' data-recipefield="' + f.key + '"', f.options);
        }).join("") +
      '</div>' +
      '<textarea class="crx-notes" rows="2" placeholder="Notes (optional)" aria-label="Notes"></textarea>' +
      '<div class="crx-photo">' + recipePhotoPreviewHTML() + '</div>' +
      '<button type="submit" class="cam-recipe-submit">' + ICON.plus + ' Add recipe</button>' +
    '</form>';
    const seeds = DATA.cameraRecipes || [];
    const mine = state.recipes.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    html += '<div class="cam-recipe-list">';
    seeds.forEach(function (r) { html += recipeCard(r, false); });
    mine.forEach(function (r) { html += recipeCard(r, true); });
    html += '</div>';
    return html;
  }

  // One labelled dropdown row in the add form. First option "—" means "not
  // set" and is omitted from the saved recipe.
  function recipeSelectRow(label, className, dataAttr, options) {
    let opts = '<option value="">—</option>';
    (options || []).forEach(function (v) {
      opts += '<option value="' + esc(v) + '">' + esc(v) + '</option>';
    });
    return '<label class="crx-field"><span class="crx-field-label">' + esc(label) + '</span>' +
      '<select class="' + className + '"' + (dataAttr || "") + '>' + opts + '</select></label>';
  }

  // Inner markup for the add-form's example-photo slot. Shows either an
  // "add" button or the chosen photo with replace / remove controls.
  function recipePhotoPreviewHTML() {
    if (pendingRecipePhoto) {
      return '<div class="crx-photo-preview">' +
        '<img class="crx-photo-img" data-photo="' + esc(pendingRecipePhoto) + '" alt="Example photo preview">' +
        '<div class="crx-photo-acts">' +
          '<button type="button" class="crx-photo-btn" data-act="recipe-photo">' + ICON.camera + ' Replace</button>' +
          '<button type="button" class="crx-photo-btn danger" data-act="recipe-photo-clear">Remove</button>' +
        '</div>' +
      '</div>';
    }
    return '<button type="button" class="crx-photo-add" data-act="recipe-photo">' + ICON.camera + ' Add an example photo</button>';
  }

  // Re-draw just the photo slot (keeps any text the user has already typed).
  function updateRecipePhotoPreview() {
    const box = document.querySelector(".cam-recipe-add .crx-photo");
    if (box) { box.innerHTML = recipePhotoPreviewHTML(); hydrateRecipePhotos(); }
  }

  function recipeCard(r, custom) {
    let body;
    if (Array.isArray(r.settings)) {
      body = '<div class="cam-specs">' + specRows(r.settings) + '</div>';
    } else {
      const lines = String(r.body || "").split(/\r?\n/).filter(function (l) { return l.trim(); });
      body = lines.length
        ? '<div class="cam-recipe-body">' + lines.map(function (l) {
            return '<span class="cam-recipe-line">' + esc(l.trim()) + '</span>';
          }).join("") + '</div>'
        : '';
    }
    const photo = r.photo
      ? '<button class="cam-recipe-photo" data-act="recipe-photo-view" aria-label="View example photo full size">' +
          '<img class="cam-recipe-img" data-photo="' + esc(r.photo) + '" alt="Example photo for ' + esc(r.name || "recipe") + '">' +
        '</button>'
      : '';
    return '<div class="cam-recipe" data-recipe="' + esc(r.id) + '">' +
      '<div class="cam-recipe-head">' +
        '<div class="cam-recipe-title">' + esc(r.name || "Recipe") + '</div>' +
        (r.filmSim ? '<span class="cam-recipe-sim">' + esc(r.filmSim) + '</span>' : '') +
        (custom ? '<button class="cam-recipe-del" data-act="recipe-del" aria-label="Delete recipe">' + ICON.trash + '</button>' : '') +
      '</div>' +
      photo +
      body +
      (r.notes ? '<div class="cam-recipe-notes">' + esc(r.notes) + '</div>' : '') +
    '</div>';
  }

  // Load any recipe example photos on screen that haven't been given a src yet
  // (both the add-form preview and the saved recipe cards).
  function hydrateRecipePhotos() {
    document.querySelectorAll("img.crx-photo-img[data-photo], img.cam-recipe-img[data-photo]").forEach(function (img) {
      const pid = img.getAttribute("data-photo");
      if (!pid || img.getAttribute("src")) return;
      if (recipePhotoUrls[pid]) { img.src = recipePhotoUrls[pid]; return; }
      docGet(pid).then(function (blob) {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        recipePhotoUrls[pid] = u;
        document.querySelectorAll('img[data-photo="' + cssEscape(pid) + '"]').forEach(function (el) {
          if (el.classList.contains("crx-photo-img") || el.classList.contains("cam-recipe-img")) el.src = u;
        });
      }).catch(function () { /* ignore */ });
    });
  }

  let recipePhotoInput = null;
  function ensureRecipeInput() {
    if (recipePhotoInput) return recipePhotoInput;
    recipePhotoInput = document.createElement("input");
    recipePhotoInput.type = "file";
    recipePhotoInput.accept = "image/*";
    recipePhotoInput.hidden = true;
    recipePhotoInput.addEventListener("change", function () {
      const file = recipePhotoInput.files && recipePhotoInput.files[0];
      recipePhotoInput.value = "";
      if (!file) return;
      compressToWebp(file, 1400, 0.82).then(function (blob) {
        const pid = genId();
        return docPut(pid, blob).then(function () {
          // Drop any previous pending photo so we don't orphan its blob.
          clearPendingRecipePhoto();
          pendingRecipePhoto = pid;
          updateRecipePhotoPreview();
        });
      }).catch(function () {
        window.alert("Sorry — couldn't process that image.");
      });
    });
    document.body.appendChild(recipePhotoInput);
    return recipePhotoInput;
  }

  // Remove the not-yet-saved example photo (blob + cached URL).
  function clearPendingRecipePhoto() {
    if (!pendingRecipePhoto) return;
    const pid = pendingRecipePhoto;
    pendingRecipePhoto = null;
    docDelete(pid).catch(function () { /* ignore */ });
    if (recipePhotoUrls[pid]) { URL.revokeObjectURL(recipePhotoUrls[pid]); delete recipePhotoUrls[pid]; }
  }

  function addRecipe(name, filmSim, settings, notes) {
    name = (name || "").trim();
    if (!name) return false;
    const rec = {
      id: genId(), name: name, filmSim: (filmSim || "").trim(),
      settings: Array.isArray(settings) ? settings : [], notes: (notes || "").trim(),
      ts: Date.now(), custom: true,
    };
    // Attach the previewed example photo (if any) without deleting its blob.
    if (pendingRecipePhoto) { rec.photo = pendingRecipePhoto; pendingRecipePhoto = null; }
    state.recipes.push(rec);
    saveState();
    renderCamera();
    return true;
  }
  function deleteRecipe(id) {
    const r = state.recipes.find(function (x) { return x.id === id; });
    if (r && r.photo) {
      docDelete(r.photo).catch(function () { /* ignore */ });
      if (recipePhotoUrls[r.photo]) { URL.revokeObjectURL(recipePhotoUrls[r.photo]); delete recipePhotoUrls[r.photo]; }
    }
    state.recipes = state.recipes.filter(function (x) { return x.id !== id; });
    saveState();
    renderCamera();
  }

  // Open a saved recipe's example photo full-size in a new tab.
  function viewRecipePhoto(id) {
    const r = state.recipes.find(function (x) { return x.id === id; });
    if (!r || !r.photo) return;
    const open = function (u) {
      const w = window.open(u, "_blank", "noopener");
      if (!w) { const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.click(); }
    };
    if (recipePhotoUrls[r.photo]) { open(recipePhotoUrls[r.photo]); return; }
    docGet(r.photo).then(function (blob) {
      if (!blob) return;
      const u = URL.createObjectURL(blob);
      recipePhotoUrls[r.photo] = u;
      open(u);
    }).catch(function () { /* ignore */ });
  }

  const stampPhotoUrls = {}; // photoId -> object URL (session cache)

  function renderStamps() {
    // Newest first, so a freshly-pressed stamp lands at the top.
    const stamps = state.stamps.slice().sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
    let html = moreHeader("Stamp book") +
      '<button class="stamp-add-btn" data-act="stamp-add">' + ICON.stamp + ' Add a stamp</button>';

    if (!stamps.length) {
      html += '<div class="stamp-empty">' +
        '<span class="stamp-empty-mark">' + ICON.stamp + '</span>' +
        '<p>Your book is empty for now. When you collect your first stamp, tap \u201CAdd a stamp\u201D to press it in.</p>' +
      '</div>';
    } else {
      html += '<div class="stamp-grid">';
      stamps.forEach(function (s, i) {
        const tilt = (i % 2 === 0) ? "tilt-l" : "tilt-r";
        html +=
          '<figure class="stamp-card ' + tilt + '" data-stamp="' + esc(s.id) + '">' +
            '<button class="stamp-del" data-act="stamp-del" aria-label="Remove this stamp">' + ICON.trash + '</button>' +
            '<button class="stamp-frame" data-act="stamp-view" aria-label="View this stamp full size">' +
              '<span class="stamp-img-wrap"><img class="stamp-img" data-photo="' + esc(s.photo) + '" alt="' + esc(s.title || "Collected stamp") + '"></span>' +
            '</button>' +
            '<figcaption class="stamp-caption">' +
              '<input class="stamp-title" data-stampfield="title" value="' + esc(s.title || "") + '" placeholder="Name this stamp" aria-label="Stamp title">' +
              '<label class="stamp-line"><span class="stamp-line-ic">' + ICON.pin + '</span>' +
                '<input data-stampfield="place" value="' + esc(s.place || "") + '" placeholder="Where you got it" aria-label="Location"></label>' +
              '<label class="stamp-line"><span class="stamp-line-ic">' + ICON.calendar + '</span>' +
                '<input type="date" data-stampfield="date" value="' + esc(s.date || "") + '" aria-label="Date collected"></label>' +
            '</figcaption>' +
          '</figure>';
      });
      html += '</div>';
    }
    document.getElementById("panel-more").innerHTML = html;
    hydrateStampPhotos();
  }

  // Load any stamp thumbnails on screen that haven't been given a src yet.
  function hydrateStampPhotos() {
    document.querySelectorAll("img.stamp-img[data-photo]").forEach(function (img) {
      const pid = img.getAttribute("data-photo");
      if (!pid || img.getAttribute("src")) return;
      if (stampPhotoUrls[pid]) { img.src = stampPhotoUrls[pid]; return; }
      docGet(pid).then(function (blob) {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        stampPhotoUrls[pid] = u;
        document.querySelectorAll('img.stamp-img[data-photo="' + cssEscape(pid) + '"]').forEach(function (el) { el.src = u; });
      }).catch(function () { /* ignore */ });
    });
  }

  let stampPhotoInput = null;
  function ensureStampInput() {
    if (stampPhotoInput) return stampPhotoInput;
    stampPhotoInput = document.createElement("input");
    stampPhotoInput.type = "file";
    stampPhotoInput.accept = "image/*";
    stampPhotoInput.hidden = true;
    stampPhotoInput.addEventListener("change", function () {
      const file = stampPhotoInput.files && stampPhotoInput.files[0];
      stampPhotoInput.value = "";
      if (!file) return;
      compressToWebp(file, 1000, 0.82).then(function (blob) {
        const pid = genId();
        return docPut(pid, blob).then(function () {
          state.stamps.push({ id: genId(), photo: pid, title: "", place: "", date: localISO(new Date()), ts: Date.now() });
          saveState();
          renderStamps();
          // Focus the new stamp's title so it can be named straight away.
          const title = document.querySelector(".stamp-grid .stamp-card .stamp-title");
          if (title) title.focus();
        });
      }).catch(function () {
        window.alert("Sorry — couldn't process that image.");
      });
    });
    document.body.appendChild(stampPhotoInput);
    return stampPhotoInput;
  }

  function deleteStamp(id) {
    const s = state.stamps.find(function (x) { return x.id === id; });
    if (!s) return;
    if (!window.confirm("Remove this stamp from your book?")) return;
    if (s.photo) {
      docDelete(s.photo).catch(function () { /* ignore */ });
      if (stampPhotoUrls[s.photo]) { URL.revokeObjectURL(stampPhotoUrls[s.photo]); delete stampPhotoUrls[s.photo]; }
    }
    state.stamps = state.stamps.filter(function (x) { return x.id !== id; });
    saveState();
    renderStamps();
  }

  function updateStampField(id, field, value) {
    const s = state.stamps.find(function (x) { return x.id === id; });
    if (!s) return;
    s[field] = value;
    saveState();
  }

  function viewStamp(id) {
    const s = state.stamps.find(function (x) { return x.id === id; });
    if (!s || !s.photo) return;
    const open = function (u) {
      const w = window.open(u, "_blank", "noopener");
      if (!w) { const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.click(); }
    };
    if (stampPhotoUrls[s.photo]) { open(stampPhotoUrls[s.photo]); return; }
    docGet(s.photo).then(function (blob) {
      if (!blob) return;
      const u = URL.createObjectURL(blob);
      stampPhotoUrls[s.photo] = u;
      open(u);
    });
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
    if (act === "open-day") {
      openDayCard(actEl.getAttribute("data-day"));
      return;
    }
    if (act === "open-booking") {
      openBookingItem(actEl.getAttribute("data-place"));
      return;
    }
    if (act === "open-food") {
      const day = actEl.closest(".day");
      if (day) { day.classList.remove("collapsed"); day.classList.add("flipped"); }
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
    if (act === "slot-toggle") {
      const slot = actEl.closest(".slot");
      if (slot) toggleSlot(slot);
      return;
    }
    if (act === "must-do") {
      toggleMustDo(actEl.closest(".todo"));
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
    if (act === "shop-photo") {
      addShopPhoto(actEl.closest(".todo"));
      return;
    }
    if (act === "shop-photo-del") {
      removeShopPhoto(actEl.closest(".todo"));
      return;
    }
    if (act === "shop-photo-view") {
      viewShopPhoto(actEl.closest(".todo"));
      return;
    }
    if (act === "shop-cat") {
      setShopCat(actEl.closest(".todo"), actEl.getAttribute("data-cat"));
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
    const areaEl = e.target.closest("[data-slotarea]");
    if (areaEl) {
      state.slotAreas[areaEl.getAttribute("data-slotarea")] = areaEl.value;
      saveState();
      return;
    }
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
    const sEl = e.target.closest("[data-stampfield]");
    if (sEl) {
      const card = sEl.closest(".stamp-card");
      if (card) updateStampField(card.getAttribute("data-stamp"), sEl.getAttribute("data-stampfield"), sEl.value);
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
    const wasComplete = dayEl ? dayEl.querySelector(".day-meter[aria-valuenow='100']") != null : false;
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
    if (containerKey === "book") {
      renderBookings();
      return;
    }
    updateProgress();
    updateDayMeter(dayEl);
    updateSlotTally(todo.closest(".slot"));
    // Celebrate when a whole day just tipped over to 100%.
    if (nowDone && dayEl && !wasComplete && dayEl.querySelector(".day-meter[aria-valuenow='100']")) {
      celebrateDay(dayEl);
    }
  }

  function toggleSlot(slot) {
    const containerKey = slot.getAttribute("data-container");
    const open = !slot.classList.contains("is-open");
    slot.classList.toggle("is-open", open);
    state.slotOpen[containerKey] = open;
    saveState();
    const button = slot.querySelector(".slot-toggle");
    if (button) button.setAttribute("aria-expanded", String(open));
  }

  function toggleMustDo(todo) {
    if (!todo) return;
    const id = todo.getAttribute("data-place");
    const containerKey = todo.getAttribute("data-container");
    const day = todo.closest(".day");
    const dayId = day ? day.getAttribute("data-day") : "";
    const slot = todo.closest(".slot");
    const slotKey = slot ? slot.getAttribute("data-container") : "";
    const flipped = day && day.classList.contains("flipped");
    const scrollY = window.scrollY;
    const mustDo = !todo.classList.contains("must-do");

    if (isAdded(containerKey, id)) {
      const place = state.added[containerKey].find(function (item) { return item.id === id; });
      if (place) {
        if (!place.details) place.details = {};
        place.details.mustDo = mustDo;
      }
    } else {
      ensureOver(id).details.mustDo = mustDo;
    }
    saveState();

    if (!dayId) return;
    if (/:(restaurants|cafes)$/.test(containerKey)) {
      const dayData = DATA.days.find(function (item) { return item.id === dayId; });
      const foodSlot = containerKey.split(":")[1];
      if (slot && dayData) slot.outerHTML = renderBackList(dayData, foodSlot, foodSlot === "restaurants" ? "Restaurants" : "Cafés");
      return;
    }
    renderItinerary();
    requestAnimationFrame(function () {
      const restoredDay = document.querySelector('.day[data-day="' + dayId + '"]');
      if (!restoredDay) return;
      restoredDay.classList.remove("collapsed");
      restoredDay.classList.toggle("flipped", flipped);
      if (slotKey) {
        const restoredSlot = restoredDay.querySelector('.slot[data-container="' + cssEscape(slotKey) + '"]');
        if (restoredSlot) {
          restoredSlot.classList.add("is-open");
          const toggle = restoredSlot.querySelector(".slot-toggle");
          if (toggle) toggle.setAttribute("aria-expanded", "true");
        }
      }
      window.scrollTo({ top: scrollY, behavior: "instant" });
    });
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
    const colors = ["#ff5c8a", "#ffb3c9", "#74ab54", "#b6d98f", "#f4b740", "#ffe08a", "#4a2e39"];
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
    if (todo.classList.contains("booking") && /^(bookingDate|bookingTime|bookingLocation|ref)$/.test(field)) {
      syncBookingSummary(todo);
    }
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

  function syncBookingSummary(todo) {
    const date = (todo.querySelector('[data-field="bookingDate"]') || {}).value || "";
    const time = (todo.querySelector('[data-field="bookingTime"]') || {}).value || "";
    const location = (todo.querySelector('[data-field="bookingLocation"]') || {}).value || "";
    const ref = (todo.querySelector('[data-field="ref"]') || {}).value || "";
    const summary = todo.querySelector(".booking-confirmed");
    if (summary) summary.outerHTML = bookingSummary(date, time, location, ref);
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
      const day = btn.closest(".day");
      const dayId = day ? day.getAttribute("data-day") : "";
      const slot = btn.closest(".slot");
      const slotKey = slot ? slot.getAttribute("data-container") : "";
      rerenderForContainer(containerKey);
      if (dayId) {
        requestAnimationFrame(function () {
          const restoredDay = document.querySelector('.day[data-day="' + dayId + '"]');
          if (!restoredDay) return;
          restoredDay.classList.remove("collapsed");
          if (slotKey) {
            const restoredSlot = restoredDay.querySelector('.slot[data-container="' + cssEscape(slotKey) + '"]');
            if (restoredSlot) {
              restoredSlot.classList.add("is-open");
              const toggle = restoredSlot.querySelector(".slot-toggle");
              if (toggle) toggle.setAttribute("aria-expanded", "true");
            }
          }
          restoredDay.scrollIntoView({ block: "nearest" });
        });
      }
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
    // Free any attached shopping photo blob.
    const pid = readShopDetail({ id: id, containerKey: containerKey }, "photo");
    if (pid) { docDelete(pid).catch(function () {}); delete shopPhotoUrls[pid]; }
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

  /* =====================================================================
     SHOPPING: photo references (so you know the exact brand to look for).
     Images are downscaled and re-encoded to WebP in the browser, then the
     blob is kept in IndexedDB (same store as documents). Only the blob id
     lives in the item's details, so localStorage stays small.
     ===================================================================== */
  const shopPhotoUrls = {}; // photoId -> object URL (session cache)

  // Downscale + convert to WebP (falls back to JPEG if the browser can't
  // encode WebP). Returns a Promise<Blob>.
  function compressToWebp(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(url);
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;
        if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
        else if (h >= w && h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          if (blob && blob.type === "image/webp") { resolve(blob); return; }
          // WebP not supported by this browser's encoder — fall back to JPEG.
          canvas.toBlob(function (b2) {
            b2 ? resolve(b2) : reject(new Error("encode-failed"));
          }, "image/jpeg", quality);
        }, "image/webp", quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("load-failed")); };
      img.src = url;
    });
  }

  // Load any thumbnails on screen that haven't been given a src yet.
  function hydrateShopPhotos() {
    document.querySelectorAll("img.shop-photo[data-photo]").forEach(function (img) {
      const pid = img.getAttribute("data-photo");
      if (!pid || img.getAttribute("src")) return;
      if (shopPhotoUrls[pid]) { img.src = shopPhotoUrls[pid]; return; }
      docGet(pid).then(function (blob) {
        if (!blob) return;
        const u = URL.createObjectURL(blob);
        shopPhotoUrls[pid] = u;
        document.querySelectorAll('img.shop-photo[data-photo="' + cssEscape(pid) + '"]').forEach(function (el) { el.src = u; });
      }).catch(function () { /* ignore */ });
    });
  }

  let shopPhotoInput = null;
  let shopPhotoTarget = null; // { id, containerKey }
  function ensureShopPhotoInput() {
    if (shopPhotoInput) return shopPhotoInput;
    shopPhotoInput = document.createElement("input");
    shopPhotoInput.type = "file";
    shopPhotoInput.accept = "image/*";
    shopPhotoInput.hidden = true;
    shopPhotoInput.addEventListener("change", function () {
      const file = shopPhotoInput.files && shopPhotoInput.files[0];
      shopPhotoInput.value = "";
      const target = shopPhotoTarget; shopPhotoTarget = null;
      if (!file || !target) return;
      compressToWebp(file, 1000, 0.8).then(function (blob) {
        const pid = genId();
        return docPut(pid, blob).then(function () {
          // Remove any previous photo for this item.
          const prev = readShopDetail(target, "photo");
          if (prev) { docDelete(prev).catch(function () {}); delete shopPhotoUrls[prev]; }
          writeShopDetail(target, "photo", pid);
          saveState();
          renderShopping();
        });
      }).catch(function () {
        window.alert("Sorry — couldn't process that image.");
      });
    });
    document.body.appendChild(shopPhotoInput);
    return shopPhotoInput;
  }

  // Read/write a detail field for a shop item identified by {id, containerKey}
  // (seed items go through the override store, added items store inline).
  function readShopDetail(target, field) {
    if (isAdded(target.containerKey, target.id)) {
      const p = (state.added[target.containerKey] || []).find(function (x) { return x.id === target.id; });
      return p && p.details ? p.details[field] : undefined;
    }
    const o = state.over[target.id];
    return o && o.details ? o.details[field] : undefined;
  }
  function writeShopDetail(target, field, value) {
    if (isAdded(target.containerKey, target.id)) {
      const p = state.added[target.containerKey].find(function (x) { return x.id === target.id; });
      if (p) { p.details = p.details || {}; p.details[field] = value; }
    } else {
      const o = ensureOver(target.id);
      o.details = o.details || {};
      o.details[field] = value;
    }
  }

  function targetFromTodo(todo) {
    return { id: todo.getAttribute("data-place"), containerKey: todo.getAttribute("data-container") };
  }
  function addShopPhoto(todo) {
    shopPhotoTarget = targetFromTodo(todo);
    ensureShopPhotoInput().click();
  }
  function removeShopPhoto(todo) {
    const target = targetFromTodo(todo);
    const pid = readShopDetail(target, "photo");
    if (pid) { docDelete(pid).catch(function () {}); delete shopPhotoUrls[pid]; }
    writeShopDetail(target, "photo", "");
    saveState();
    renderShopping();
  }
  function viewShopPhoto(todo) {
    const pid = readShopDetail(targetFromTodo(todo), "photo");
    if (!pid) return;
    const open = function (u) {
      const w = window.open(u, "_blank", "noopener");
      if (!w) { const a = document.createElement("a"); a.href = u; a.target = "_blank"; a.click(); }
    };
    if (shopPhotoUrls[pid]) { open(shopPhotoUrls[pid]); return; }
    docGet(pid).then(function (blob) {
      if (!blob) return;
      const u = URL.createObjectURL(blob);
      shopPhotoUrls[pid] = u;
      open(u);
    });
  }
  function setShopCat(todo, cat) {
    updatePlaceDetail(todo, "cat", cat);
    renderShopping();
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
  let moreView = null; // null = hub; else "tips"|"packing"|"budget"|"emergency"|"phrasebook"|"docs"
  let phraseLang = 0;  // index into DATA.phrasebook

  const MORE_TOOLS = [
    { key: "stamps", icon: ICON.stamp, title: "Stamp book", sub: "Collect memories from each stop" },
    { key: "budget", icon: ICON.wallet, title: "Budget tracker", sub: "Log spend in ¥ / £, auto-converted" },
    { key: "emergency", icon: ICON.phone, title: "Emergency & essentials", sub: "Numbers, embassies, hotel addresses" },
    { key: "phrasebook", icon: ICON.chat, title: "Phrasebook", sub: "Key phrases in Chinese & Japanese" },
    { key: "docs", icon: ICON.file, title: "Documents", sub: "Tickets & bookings, saved offline" },
  ];

  function renderMore() {
    if (moreView === "tips") return renderTips();
    if (moreView === "stamps") return renderStamps();
    if (moreView === "budget") return renderBudget();
    if (moreView === "emergency") return renderEmergency();
    if (moreView === "phrasebook") return renderPhrasebook();
    if (moreView === "docs") return renderDocs();
    // Hub
    let html = '<h2 class="section-title">Trip tools</h2>' +
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
    html +=
      '<div class="data-tools"><button class="data-tool-btn" data-act="data-export">Download my trip data</button><button class="data-tool-btn" data-act="data-import">Restore trip data</button></div>' +
      '<div class="footer-note">Everything you tick or add is saved on this device. Backups include your plans and settings, but not uploaded photos or documents.<br>' +
      '<button class="reset-btn" id="reset">Reset all my changes</button></div>';
    document.getElementById("panel-more").innerHTML = html;
  }

  function exportTripData() {
    const payload = { app: "rach-itinerary", version: 1, exportedAt: new Date().toISOString(), state: state };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "china-japan-trip-backup-" + localISO(new Date()) + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function ensureDataImportInput() {
    let input = document.getElementById("data-import-input");
    if (input) return input;
    input = document.createElement("input");
    input.id = "data-import-input";
    input.type = "file";
    input.accept = "application/json,.json";
    input.hidden = true;
    input.addEventListener("change", function () {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      file.text().then(function (text) {
        const backup = JSON.parse(text);
        if (!backup || backup.app !== "rach-itinerary" || !backup.state || typeof backup.state !== "object" || Array.isArray(backup.state)) throw new Error("Invalid backup");
        if (!window.confirm("Restore this backup? It will replace the current changes saved on this device.")) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.state));
        state = loadState();
        renderAll();
        applyTheme();
      }).catch(function () {
        window.alert("That file is not a valid China-Japan trip backup.");
      });
    });
    document.body.appendChild(input);
    return input;
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
    let html = '<h2 class="section-title">Packing list</h2>';
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
    document.getElementById("panel-packing").innerHTML = html;
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
    html += '<p class="empty" style="margin-bottom:var(--space-12)">Tap a number to call. Show a hotel address to a taxi driver.</p>';
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
    html += '<p class="empty" style="margin-bottom:var(--space-12)">Save flight & hotel PDFs, tickets and passport photos here — they stay on this device and open offline.</p>';
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
    if (act === "data-export") { exportTripData(); return; }
    if (act === "data-import") { ensureDataImportInput().click(); return; }
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
    if (act === "stamp-add") { ensureStampInput().click(); return; }
    if (act === "stamp-view") {
      const card = actEl.closest(".stamp-card");
      if (card) viewStamp(card.getAttribute("data-stamp"));
      return;
    }
    if (act === "stamp-del") {
      const card = actEl.closest(".stamp-card");
      if (card) deleteStamp(card.getAttribute("data-stamp"));
      return;
    }
    if (act === "cam-view") {
      cameraView = actEl.getAttribute("data-view") || "scenes";
      renderCamera();
      window.scrollTo({ top: 0 });
      return;
    }
    if (act === "cam-scene") {
      cameraScene = actEl.getAttribute("data-scene");
      renderCamera();
      return;
    }
    if (act === "recipe-photo") { ensureRecipeInput().click(); return; }
    if (act === "recipe-photo-clear") { clearPendingRecipePhoto(); updateRecipePhotoPreview(); return; }
    if (act === "recipe-photo-view") {
      const card = actEl.closest(".cam-recipe");
      if (card) viewRecipePhoto(card.getAttribute("data-recipe"));
      return;
    }
    if (act === "recipe-del") {
      const card = actEl.closest(".cam-recipe");
      if (card) deleteRecipe(card.getAttribute("data-recipe"));
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
    if (act === "recipe-add") {
      e.preventDefault();
      const nameEl = form.querySelector(".crx-name");
      const simEl = form.querySelector(".crx-sim");
      const notesEl = form.querySelector(".crx-notes");
      const getVal = function (key) {
        const el = form.querySelector('[data-recipefield="' + key + '"]');
        return el && el.value ? el.value : "";
      };
      // Build the spec sheet in field order, merging the WB shifts into the
      // White balance row so it reads like the seeded recipes.
      const settings = [];
      RECIPE_FIELDS.forEach(function (f) {
        if (f.key === "wbRed" || f.key === "wbBlue") return;
        if (f.key === "wb") {
          const wb = getVal("wb"), r = getVal("wbRed"), b = getVal("wbBlue");
          if (wb || r || b) {
            const parts = [];
            if (wb) parts.push(wb);
            if (r) parts.push(r + " Red");
            if (b) parts.push(b + " Blue");
            settings.push({ k: "White balance", v: parts.join(" · ") });
          }
          return;
        }
        const v = getVal(f.key);
        if (v) settings.push({ k: f.label, v: v });
      });
      addRecipe(nameEl ? nameEl.value : "", simEl ? simEl.value : "", settings, notesEl ? notesEl.value : "");
      return;
    }
  });

  /* ---------- Tabs ---------- */
  function initTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.querySelector(".ic").innerHTML = NAV_ICON[tab.getAttribute("data-target")];
      tab.setAttribute("aria-controls", "panel-" + tab.getAttribute("data-target"));
      tab.setAttribute("aria-pressed", String(tab.classList.contains("active")));
      tab.addEventListener("click", function () {
        const target = tab.getAttribute("data-target");
        // Tiny haptic tap on devices that support it.
        if (navigator.vibrate) navigator.vibrate(12);
        if (target === "more") { moreView = null; renderMore(); }
        tabs.forEach(function (t) {
          t.classList.toggle("active", t === tab);
          t.setAttribute("aria-pressed", String(t === tab));
        });
        document.querySelectorAll(".panel").forEach(function (p) {
          p.classList.toggle("active", p.id === "panel-" + target);
        });
        window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    });
  }

  /* ---------- Reset ---------- */
  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "reset") {
      if (window.confirm("Reset all ticks, added places, photos, stamps and flight info back to the starting itinerary?")) {
        localStorage.removeItem(STORAGE_KEY);
        state = loadState();
        renderAll();
      }
    }
  });

  /* ---------- Masthead ---------- */
  function renderMasthead() {
    const title = document.getElementById("tripTitle");
    const separator = '<span class="title-ampersand" aria-hidden="true">&amp;</span>';
    title.setAttribute("aria-label", DATA.meta.title.split("·").map(function (country) { return country.trim(); }).join(" & "));
    title.innerHTML = DATA.meta.title.split("·").map(function (country) {
      return '<span class="title-country">' + esc(country.trim()) + '</span>';
    }).join(separator);
    const s = fmtDate(DATA.meta.start), en = fmtDate(DATA.meta.end);
    document.getElementById("tripRange").textContent = s.big + " → " + en.big + " · " + DATA.days.length + " days";
  }

  /* ---------- Theme (light / dark) ---------- */
  function applyTheme() {
    const dark = state.theme === "dark";
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--paper").trim());
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
    renderTravel();
    renderCamera();
    renderPacking();
    renderMore();
    updateProgress();
  }

  document.addEventListener("DOMContentLoaded", function () {
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
