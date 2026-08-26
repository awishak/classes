// Loaded before anything else in the smoke run.
//
// storage-shim.js sets window.storage and opens a WebSocket the moment it is
// imported, and ESM hoists imports above statements, so stubs written inside
// smoke.jsx would arrive too late. A module of its own runs first.

globalThis.window = globalThis;
globalThis.self = globalThis;

globalThis.WebSocket = class {
  constructor() { this.readyState = 0; }
  send() {}
  close() {}
};

globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.innerWidth = 1440;
globalThis.location = { pathname: "/", search: "", hash: "", origin: "https://example.test", href: "https://example.test/" };
globalThis.history = { pushState() {}, replaceState() {} };
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.fetch = globalThis.fetch || (async () => ({ ok: false, json: async () => ({}), text: async () => "" }));
