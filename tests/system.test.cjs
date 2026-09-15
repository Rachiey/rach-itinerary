const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

// A small DOM stub checks script wiring and rendering, not browser layout.
function bootApp(savedState = {}) {
  const elements = new Map();
  function element(id = "", initialClasses = []) {
    const classes = new Set(initialClasses);
    return {
      id, innerHTML: "", textContent: "", style: {}, attributes: {}, listeners: {},
      classList: {
        contains: (name) => classes.has(name),
        toggle: (name, on) => on ? classes.add(name) : classes.delete(name),
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name]; },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      querySelectorAll() { return []; },
      querySelector() { return null; },
    };
  }
  for (const match of read("index.html").matchAll(/id="([^"]+)"/g)) {
    elements.set(match[1], element(match[1]));
  }
  const tabs = [...read("index.html").matchAll(/data-target="([^"]+)"/g)].map((match, index) => {
    const tab = element("", index === 0 ? ["active"] : []);
    tab.setAttribute("data-target", match[1]);
    const icon = element();
    tab.querySelector = () => icon;
    return tab;
  });
  const listeners = {};
  const meta = element();
  const document = {
    documentElement: element(),
    getElementById: (id) => elements.get(id) || null,
    querySelector: (selector) => selector === 'meta[name="theme-color"]' ? meta : null,
    querySelectorAll: (selector) => selector === ".tab" ? tabs : selector === ".panel"
      ? [...elements.values()].filter((item) => item.id.startsWith("panel-")) : [],
    addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
  };
  const storage = new Map([["rach-itinerary-v1", JSON.stringify(savedState)]]);
  storage.set("rach-fx-v1", JSON.stringify({rates: {CNY: 9.5, JPY: 195}}));
  const window = { matchMedia: () => ({matches: false}), scrollTo() {}, addEventListener() {} };
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : ["2026-09-15T12:00:00Z"])); }
  }
  const context = vm.createContext({
    window, document, Date: FixedDate, navigator: {}, location: {protocol: "file:"},
    localStorage: {getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)},
    getComputedStyle: () => ({getPropertyValue: () => document.documentElement.attributes["data-theme"] === "dark" ? "#201225" : "#fff3ee"}),
    fetch: () => Promise.reject(new Error("Offline test")),
    setTimeout: () => 0, clearTimeout() {}, requestAnimationFrame: () => 0,
    console, URL,
  });
  vm.runInContext(read("js/data.js"), context);
  vm.runInContext(read("js/app.js"), context);
  for (const callback of listeners.DOMContentLoaded) callback();
  return {elements, tabs, storage, document, meta};
}

test("app boots with the current DOM IDs and renders every main panel", () => {
  const {elements, tabs} = bootApp();
  assert.equal(elements.get("trip-title").attributes["aria-label"], "China & Japan");
  assert.match(elements.get("trip-range").textContent, /days$/);
  assert.match(elements.get("fx-chip").innerHTML, /CNY/);
  assert.match(elements.get("fx-chip").innerHTML, /195/);
  for (const tab of tabs) {
    const panelId = "panel-" + tab.getAttribute("data-target");
    assert.ok(elements.get(panelId).innerHTML.length > 0, panelId);
    tab.listeners.click();
    assert.ok(elements.get(panelId).classList.contains("active"), panelId);
    assert.equal(tab.attributes["aria-controls"], panelId);
  }
});

test("theme changes preserve existing saved data", () => {
  const savedState = {theme: "dark", flights: {f1: {flightNo: "TEST123"}}, packing: {charger: true}};
  const {elements, storage, document, meta} = bootApp(savedState);
  assert.equal(document.documentElement.attributes["data-theme"], "dark");
  assert.match(elements.get("panel-travel").innerHTML, /TEST123/);
  elements.get("theme-toggle").listeners.click();
  const saved = JSON.parse(storage.get("rach-itinerary-v1"));
  assert.equal(saved.theme, "light");
  assert.deepEqual(saved.flights, savedState.flights);
  assert.deepEqual(saved.packing, savedState.packing);
  assert.equal(meta.attributes.content, "#fff3ee");
});

test("shell asset versions and install colours match the app", () => {
  const html = read("index.html");
  const sw = read("sw.js");
  for (const match of html.matchAll(/(?:src|href)="((?:css|js)\/[^"?]+\?v=\d+)"/g)) {
    assert.ok(sw.includes('"./' + match[1] + '"'), match[1]);
    assert.ok(fs.existsSync(path.join(root, match[1].split("?")[0])));
  }
  const manifest = JSON.parse(read("manifest.webmanifest"));
  const paper = read("css/style.css").match(/--paper:\s*([^;]+);/)[1];
  assert.equal(manifest.theme_color, paper);
  assert.equal(manifest.background_color, paper);
});

test("service worker only removes obsolete itinerary caches", async () => {
  const handlers = {};
  const removed = [];
  const version = read("sw.js").match(/const CACHE_VERSION = "([^"]+)"/)[1];
  let pending;
  vm.runInNewContext(read("sw.js"), {
    self: {addEventListener: (name, callback) => handlers[name] = callback, clients: {claim() {}}},
    caches: {
      keys: async () => [version + "-shell", version + "-runtime", "rach-itin-v1-shell", "other-app-cache"],
      delete: async (key) => removed.push(key),
    },
  });
  handlers.activate({waitUntil: (promise) => pending = promise});
  await pending;
  assert.deepEqual(removed, ["rach-itin-v1-shell"]);
});
