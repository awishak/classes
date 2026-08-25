// Every class that runs on the shared engine, in one place.
//
// App.jsx resolves routes from this, and the Dashboard's class picker lists it,
// so adding a class means adding one line here rather than editing both. The
// registry lives under config/ rather than in App.jsx because the Dashboard
// needs it too, and importing App from the Dashboard would be a circle.

import comm999 from "./comm999.js";
import comm118 from "./comm118.js";

// Keyed by the URL segment. /comm118/dashboard -> ENGINE.comm118.
export const ENGINE = { comm999, comm118 };

// The order the class picker shows them in: the class I actually teach first,
// the template last.
export const ENGINE_LIST = [comm118, comm999];
