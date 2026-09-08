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

// A signed-in instructor, so the class site renders past the door. Everyone
// signs in at /login now and a visitor with no session is sent there, which
// is the right thing on a screen and the wrong thing in a render test.
const SESSION = JSON.stringify({ access_token: "t", refresh_token: "r", expires_at: 4102444800, user: { id: "u-andrew", email: "andrewishak@gmail.com" } });
globalThis.localStorage = { getItem: (k) => (k === "classes-session" ? SESSION : null), setItem() {}, removeItem() {} };
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
globalThis.innerWidth = 1440;
globalThis.location = { pathname: "/", search: "", hash: "", origin: "https://example.test", href: "https://example.test/" };
globalThis.history = { pushState() {}, replaceState() {} };
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.fetch = globalThis.fetch || (async () => ({ ok: false, json: async () => ({}), text: async () => "" }));
